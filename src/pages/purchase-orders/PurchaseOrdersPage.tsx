import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
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
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/usePurchaseOrders'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useInventoryItems } from '@/hooks/useInventory'
import { getApiError } from '@/lib/apiError'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'

type POForm = {
  supplier_id: string
  notes?: string
  expected_at?: string
  items: { inventory_item_id: string; quantity_ordered: number; cost_per_unit: number }[]
}

const STATUS_VARIANTS: Record<PurchaseOrder['status'], 'secondary' | 'default' | 'warning' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  ORDERED: 'default',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'destructive',
}

function CreatePODialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const createPO = useCreatePurchaseOrder()
  const { data: suppliersData } = useSuppliers(1, '', 100)
  const { data: inventoryData } = useInventoryItems(1, '', 100)

  const schema = useMemo(
    () =>
      z.object({
        supplier_id: z.string().min(1, t('validation.supplierRequired')),
        notes: z.string().optional(),
        expected_at: z.string().optional(),
        items: z
          .array(
            z.object({
              inventory_item_id: z.string().min(1, t('validation.itemRequired')),
              quantity_ordered: z.coerce.number().min(1, t('validation.quantityMin1short')),
              cost_per_unit: z.coerce.number().min(0, t('validation.quantityMin0')),
            }),
          )
          .min(1, t('validation.itemsMin')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<POForm>({
    resolver: zodResolver(schema),
    defaultValues: { supplier_id: '', notes: '', expected_at: '', items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (values: POForm) => {
    try {
      await createPO.mutateAsync({
        supplier_id: values.supplier_id,
        notes: values.notes,
        expected_at: values.expected_at || undefined,
        items: values.items,
      })
      toast.success(t('purchaseOrders.createdToast'))
      reset()
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('purchaseOrders.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('common.supplier')} *</Label>
            <Select {...register('supplier_id')}>
              <option value="">{t('purchaseOrders.selectSupplier')}</option>
              {suppliersData?.items.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            {errors.supplier_id && (
              <p className="text-xs text-red-500">{errors.supplier_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('purchaseOrders.expectedDate')}</Label>
              <Input type="date" {...register('expected_at')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('common.notes')}</Label>
            <Textarea {...register('notes')} rows={2} placeholder={t('purchaseOrders.optionalNotes')} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('purchaseOrders.lineItems')} *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ inventory_item_id: '', quantity_ordered: 1, cost_per_unit: 0 })}
              >
                <Plus className="h-3 w-3" />
                {t('common.add')} {t('common.items').slice(0, -1)}
              </Button>
            </div>
            {errors.items?.root && (
              <p className="text-xs text-red-500">{errors.items.root.message}</p>
            )}
            {errors.items?.message && (
              <p className="text-xs text-red-500">{errors.items.message}</p>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-2 rounded-lg bg-gray-50">
                  <div className="flex-1 space-y-1">
                    <Select {...register(`items.${index}.inventory_item_id`)}>
                      <option value="">{t('purchaseOrders.selectItem')}</option>
                      {inventoryData?.items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.sku})
                        </option>
                      ))}
                    </Select>
                    {errors.items?.[index]?.inventory_item_id && (
                      <p className="text-xs text-red-500">
                        {errors.items[index]?.inventory_item_id?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      {...register(`items.${index}.quantity_ordered`)}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('purchaseOrders.costUnit')}
                      {...register(`items.${index}.cost_per_unit`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  {t('purchaseOrders.noItems')}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={createPO.isPending}>
              {createPO.isPending ? t('common.creating') : t('purchaseOrders.createPO')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PurchaseOrdersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = usePurchaseOrders(page, statusFilter || undefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('purchaseOrders.title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('purchaseOrders.newPO')}
        </Button>
      </div>

      <div className="flex gap-3">
        <Select
          className="w-48"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">{t('purchaseOrders.allStatuses')}</option>
          <option value="DRAFT">{t('purchaseOrders.draft')}</option>
          <option value="ORDERED">{t('purchaseOrders.orderedStatus')}</option>
          <option value="PARTIALLY_RECEIVED">{t('purchaseOrders.partiallyReceived')}</option>
          <option value="RECEIVED">{t('purchaseOrders.receivedStatus')}</option>
          <option value="CANCELLED">{t('purchaseOrders.cancelledStatus')}</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('purchaseOrders.poNumber')}</TableHead>
                  <TableHead>{t('common.supplier')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.items')}</TableHead>
                  <TableHead>{t('common.expected')}</TableHead>
                  <TableHead>{t('common.ordered')}</TableHead>
                  <TableHead>{t('common.total')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      {t('purchaseOrders.notFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((po) => {
                    const total = po.items?.reduce(
                      (sum, i) => sum + i.quantity_ordered * i.cost_per_unit,
                      0,
                    ) ?? 0
                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.supplier?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[po.status]}>
                            {po.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{po.items?.length ?? 0}</TableCell>
                        <TableCell className="text-gray-500">{formatDate(po.expected_at)}</TableCell>
                        <TableCell className="text-gray-500">{formatDate(po.ordered_at)}</TableCell>
                        <TableCell>{total > 0 ? formatCurrency(total) : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/purchase-orders/${po.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {data && (
            <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />
          )}
        </>
      )}

      <CreatePODialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
