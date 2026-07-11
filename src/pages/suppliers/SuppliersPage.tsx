import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Pagination } from '@/components/Pagination'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type SupplierBody,
} from '@/hooks/useSuppliers'
import { getApiError } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import type { Supplier } from '@/types'

type Form = {
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
}

function SupplierDialog({
  open,
  onClose,
  supplier,
}: {
  open: boolean
  onClose: () => void
  supplier?: Supplier
}) {
  const { t } = useTranslation()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier(supplier?.id ?? '')
  const isPending = createSupplier.isPending || updateSupplier.isPending

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.nameRequired')),
        contact_name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        supplier
          ? {
              name: supplier.name,
              contact_name: supplier.contact_name,
              phone: supplier.phone,
              email: supplier.email,
              address: supplier.address,
            }
          : { name: '', contact_name: '', phone: '', email: '', address: '' },
      )
    }
  }, [open, supplier, reset])

  const onSubmit = async (values: Form) => {
    const body: SupplierBody = { ...values }
    try {
      if (supplier) {
        await updateSupplier.mutateAsync(body)
        toast.success(t('suppliers.updated'))
      } else {
        await createSupplier.mutateAsync(body)
        toast.success(t('suppliers.createdToast'))
      }
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? t('suppliers.editTitle') : t('suppliers.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input {...register('name')} placeholder={t('suppliers.namePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('suppliers.contactName')}</Label>
              <Input {...register('contact_name')} placeholder={t('suppliers.contactNamePlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('common.phone')}</Label>
              <Input {...register('phone')} placeholder={t('suppliers.phonePlaceholder')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('common.email')}</Label>
            <Input type="email" {...register('email')} placeholder={t('suppliers.emailPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('common.address')}</Label>
            <Textarea {...register('address')} placeholder={t('suppliers.addressPlaceholder')} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : supplier ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SuppliersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>()

  const { data, isLoading } = useSuppliers(page, search)
  const deleteSupplier = useDeleteSupplier()

  const openCreate = () => {
    setEditSupplier(undefined)
    setDialogOpen(true)
  }
  const openEdit = (s: Supplier) => {
    setEditSupplier(s)
    setDialogOpen(true)
  }
  const closeDialog = () => setDialogOpen(false)

  const handleDelete = async (s: Supplier) => {
    if (!window.confirm(t('suppliers.deleteConfirm', { name: s.name }))) return
    try {
      await deleteSupplier.mutateAsync(s.id)
      toast.success(t('suppliers.deleted'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('suppliers.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('suppliers.addSupplier')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t('suppliers.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.contact')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('common.created')}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      {t('suppliers.notFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact_name || '—'}</TableCell>
                      <TableCell>{s.email || '—'}</TableCell>
                      <TableCell>{s.phone || '—'}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(s.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(s)}
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
          {data && (
            <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />
          )}
        </>
      )}

      <SupplierDialog open={dialogOpen} onClose={closeDialog} supplier={editSupplier} />
    </div>
  )
}
