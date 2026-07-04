import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Eye } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/Pagination'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  useInventoryItems,
  useInventoryUnits,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useAdjustStock,
  type InventoryBody,
} from '@/hooks/useInventory'
import { Select } from '@/components/ui/select'
import { getApiError } from '@/lib/apiError'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem } from '@/types'

type ItemForm = {
  sku: string
  name: string
  unit: string
  description?: string
  min_quantity?: number
  cost_per_unit?: number
}

type AdjustForm = {
  quantity: number
  is_add: 'true' | 'false'
  note?: string
}

function ItemDialog({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item?: InventoryItem
}) {
  const { t } = useTranslation()
  const create = useCreateInventoryItem()
  const update = useUpdateInventoryItem(item?.id ?? '')
  const { data: units, isLoading: unitsLoading } = useInventoryUnits()
  const isPending = create.isPending || update.isPending

  const itemSchema = useMemo(
    () =>
      z.object({
        sku: z.string().min(1, t('validation.skuRequired')),
        name: z.string().min(1, t('validation.nameRequired')),
        unit: z.string().min(1, t('validation.unitRequired')),
        description: z.string().optional(),
        min_quantity: z.coerce.number().min(0).optional(),
        cost_per_unit: z.coerce.number().min(0).optional(),
      }),
    [t],
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  })

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              sku: item.sku,
              name: item.name,
              unit: item.unit,
              description: item.description,
              min_quantity: item.min_quantity,
              cost_per_unit: item.cost_per_unit,
            }
          : { sku: '', name: '', unit: '', description: '', min_quantity: 0, cost_per_unit: 0 },
      )
    }
  }, [open, item, reset])

  const onSubmit = async (values: ItemForm) => {
    const body: InventoryBody = values
    try {
      if (item) {
        await update.mutateAsync(body)
        toast.success(t('inventory.itemUpdated'))
      } else {
        await create.mutateAsync(body)
        toast.success(t('inventory.itemCreated'))
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
          <DialogTitle>{item ? t('inventory.editTitle') : t('inventory.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('common.sku')} *</Label>
              <Input {...register('sku')} placeholder="SKU-001" />
              {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('common.unit')} *</Label>
              <Select {...register('unit')} disabled={unitsLoading}>
                <option value="" disabled>{t('inventory.unitPlaceholder')}</option>
                {item?.unit && !units?.some((u) => u.code === item.unit) && (
                  <option value={item.unit}>{item.unit}</option>
                )}
                {units?.map((u) => (
                  <option key={u.id} value={u.code}>{u.name} ({u.code})</option>
                ))}
              </Select>
              {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input {...register('name')} placeholder={t('inventory.itemNamePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('common.description')}</Label>
            <Textarea {...register('description')} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('inventory.minQuantity')}</Label>
              <Input type="number" step="any" {...register('min_quantity')} />
            </div>
            <div className="space-y-1">
              <Label>{t('inventory.costPerUnit')}</Label>
              <Input type="number" step="0.01" {...register('cost_per_unit')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : item ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdjustDialog({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item?: InventoryItem
}) {
  const { t } = useTranslation()
  const adjust = useAdjustStock()

  const adjustSchema = useMemo(
    () =>
      z.object({
        quantity: z.coerce.number().min(1, t('validation.quantityMin1')),
        is_add: z.enum(['true', 'false']),
        note: z.string().optional(),
      }),
    [t],
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdjustForm>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { is_add: 'true' },
  })

  useEffect(() => {
    if (open) reset({ quantity: 1, is_add: 'true', note: '' })
  }, [open, reset])

  const onSubmit = async (values: AdjustForm) => {
    if (!item) return
    try {
      await adjust.mutateAsync({
        id: item.id,
        quantity: values.quantity,
        is_add: values.is_add === 'true',
        note: values.note,
      })
      toast.success(t('inventory.stockAdjusted'))
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('inventory.adjustTitle', { name: item?.name })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <p className="text-sm text-gray-500">
            {t('inventory.currentStock')}{' '}
            <span className="font-semibold">{item?.quantity_in_stock} {item?.unit}</span>
          </p>
          <div className="space-y-1">
            <Label>{t('common.type')}</Label>
            <select
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('is_add')}
            >
              <option value="true">{t('inventory.addStock')}</option>
              <option value="false">{t('inventory.removeStock')}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t('common.quantity')} *</Label>
            <Input type="number" step="any" {...register('quantity')} />
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('common.note')}</Label>
            <Input {...register('note')} placeholder={t('inventory.optionalNote')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? t('common.saving') : t('inventory.adjust')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [itemDialog, setItemDialog] = useState(false)
  const [adjustDialog, setAdjustDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()

  const { data, isLoading } = useInventoryItems(page, search)
  const deleteItem = useDeleteInventoryItem()

  const openCreate = () => { setSelectedItem(undefined); setItemDialog(true) }
  const openEdit = (item: InventoryItem) => { setSelectedItem(item); setItemDialog(true) }
  const openAdjust = (item: InventoryItem) => { setSelectedItem(item); setAdjustDialog(true) }

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(t('inventory.deleteConfirm', { name: item.name }))) return
    try {
      await deleteItem.mutateAsync(item.id)
      toast.success(t('inventory.itemDeleted'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  const getStockBadge = (item: InventoryItem) => {
    if (item.quantity_in_stock <= 0) return <Badge variant="destructive">Out</Badge>
    if (item.quantity_in_stock <= item.min_quantity) return <Badge variant="warning">Low</Badge>
    return <Badge variant="success">OK</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('inventory.addItem')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t('inventory.searchPlaceholder')}
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
                  <TableHead>{t('common.sku')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('inventory.stock')}</TableHead>
                  <TableHead>{t('inventory.minQty')}</TableHead>
                  <TableHead>{t('common.unit')}</TableHead>
                  <TableHead>{t('inventory.cost')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      {t('inventory.notFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity_in_stock}</TableCell>
                      <TableCell>{item.min_quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatCurrency(item.cost_per_unit)}</TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View transactions"
                            asChild
                          >
                            <Link to={`/inventory/${item.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Adjust stock"
                            onClick={() => openAdjust(item)}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(item)}
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

      <ItemDialog
        open={itemDialog}
        onClose={() => setItemDialog(false)}
        item={selectedItem}
      />
      <AdjustDialog
        open={adjustDialog}
        onClose={() => setAdjustDialog(false)}
        item={selectedItem}
      />
    </div>
  )
}
