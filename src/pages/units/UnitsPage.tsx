import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useIsAdmin } from '@/hooks/useAuth'
import {
  useInventoryUnits,
  useCreateInventoryUnit,
  useUpdateInventoryUnit,
  useDeleteInventoryUnit,
  type InventoryUnitBody,
} from '@/hooks/useInventory'
import { getApiError } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import type { InventoryUnit } from '@/types'

type Form = {
  code: string
  name: string
}

function UnitDialog({
  open,
  onClose,
  unit,
}: {
  open: boolean
  onClose: () => void
  unit?: InventoryUnit
}) {
  const { t } = useTranslation()
  const create = useCreateInventoryUnit()
  const update = useUpdateInventoryUnit(unit?.id ?? '')
  const isPending = create.isPending || update.isPending

  const schema = useMemo(
    () =>
      z.object({
        code: z.string().min(1, t('validation.codeRequired')),
        name: z.string().min(1, t('validation.nameRequired')),
      }),
    [t],
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(unit ? { code: unit.code, name: unit.name } : { code: '', name: '' })
    }
  }, [open, unit, reset])

  const onSubmit = async (values: InventoryUnitBody) => {
    try {
      if (unit) {
        await update.mutateAsync(values)
        toast.success(t('units.updated'))
      } else {
        await create.mutateAsync(values)
        toast.success(t('units.createdToast'))
      }
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{unit ? t('units.editTitle') : t('units.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>{t('units.code')} *</Label>
            <Input {...register('code')} placeholder={t('units.codePlaceholder')} />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input {...register('name')} placeholder={t('units.namePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : unit ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UnitsPage() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUnit, setEditUnit] = useState<InventoryUnit | undefined>()

  const { data: units, isLoading } = useInventoryUnits()
  const deleteUnit = useDeleteInventoryUnit()

  const openCreate = () => { setEditUnit(undefined); setDialogOpen(true) }
  const openEdit = (u: InventoryUnit) => { setEditUnit(u); setDialogOpen(true) }
  const closeDialog = () => setDialogOpen(false)

  const handleDelete = async (u: InventoryUnit) => {
    if (!window.confirm(t('units.deleteConfirm', { name: u.name }))) return
    try {
      await deleteUnit.mutateAsync(u.id)
      toast.success(t('units.deleted'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  if (!isAdmin) {
    return <p className="text-gray-500">{t('units.adminOnly')}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('units.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('units.addUnit')}
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('units.code')}</TableHead>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.created')}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {units?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    {t('units.notFound')}
                  </TableCell>
                </TableRow>
              ) : (
                units?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.code}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <UnitDialog open={dialogOpen} onClose={closeDialog} unit={editUnit} />
    </div>
  )
}
