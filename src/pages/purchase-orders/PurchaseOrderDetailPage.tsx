import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  usePurchaseOrder,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from '@/hooks/usePurchaseOrders'
import { getApiError } from '@/lib/apiError'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'

const STATUS_VARIANTS: Record<
  PurchaseOrder['status'],
  'secondary' | 'default' | 'warning' | 'success' | 'destructive'
> = {
  DRAFT: 'secondary',
  ORDERED: 'default',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'destructive',
}

type ReceiveForm = {
  note?: string
  items: { purchase_order_item_id: string; quantity_received: number }[]
}

function ReceiveSection({ po }: { po: PurchaseOrder }) {
  const { t } = useTranslation()
  const receive = useReceivePurchaseOrder(po.id)

  const schema = useMemo(
    () =>
      z.object({
        note: z.string().optional(),
        items: z.array(
          z.object({
            purchase_order_item_id: z.string(),
            quantity_received: z.coerce.number().min(0),
          }),
        ),
      }),
    [],
  )

  const { register, handleSubmit, formState: { errors } } = useForm<ReceiveForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      note: '',
      items:
        po.items?.map((item) => ({
          purchase_order_item_id: item.id,
          quantity_received: item.quantity_ordered - item.quantity_received,
        })) ?? [],
    },
  })

  const onSubmit = async (values: ReceiveForm) => {
    try {
      await receive.mutateAsync(values)
      toast.success(t('purchaseOrderDetail.itemsReceived'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('purchaseOrderDetail.receiveItems')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            {po.items?.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.inventory_item?.name ?? item.inventory_item_id}</p>
                  <p className="text-xs text-gray-500">
                    {t('purchaseOrderDetail.orderedReceived', {
                      ordered: item.quantity_ordered,
                      received: item.quantity_received,
                    })}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity_ordered - item.quantity_received}
                    placeholder={t('purchaseOrderDetail.qtyToReceive')}
                    {...register(`items.${index}.quantity_received`)}
                  />
                  {errors.items?.[index]?.quantity_received && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {errors.items[index]?.quantity_received?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label>{t('common.note')}</Label>
            <Input {...register('note')} placeholder={t('purchaseOrderDetail.receivingNote')} />
          </div>
          <Button type="submit" disabled={receive.isPending}>
            <CheckCircle className="h-4 w-4" />
            {receive.isPending ? t('common.processing') : t('purchaseOrderDetail.confirmReceipt')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function PurchaseOrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: po, isLoading } = usePurchaseOrder(id ?? '')
  const cancelPO = useCancelPurchaseOrder(id ?? '')

  const handleCancel = async () => {
    if (!window.confirm(t('purchaseOrderDetail.cancelConfirm'))) return
    try {
      await cancelPO.mutateAsync()
      toast.success(t('purchaseOrderDetail.cancelled'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (!po) return <p className="text-gray-500">{t('purchaseOrderDetail.notFound')}</p>

  const canReceive = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED'
  const canCancel = po.status !== 'RECEIVED' && po.status !== 'CANCELLED'
  const total =
    po.items?.reduce((sum, i) => sum + i.quantity_ordered * i.cost_per_unit, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/purchase-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{po.po_number}</h1>
          <p className="text-sm text-gray-500">{po.supplier?.name}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[po.status]} className="text-sm">
          {po.status.replace(/_/g, ' ')}
        </Badge>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={cancelPO.isPending}
          >
            <XCircle className="h-4 w-4" />
            {t('purchaseOrderDetail.cancelPO')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('common.ordered')}</p>
            <p className="font-medium mt-1">{formatDate(po.ordered_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('common.expected')}</p>
            <p className="font-medium mt-1">{formatDate(po.expected_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('common.received')}</p>
            <p className="font-medium mt-1">{formatDate(po.received_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('purchaseOrderDetail.totalValue')}</p>
            <p className="font-bold text-lg mt-1">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
      </div>

      {po.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('common.notes')}</p>
            <p className="text-sm">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('purchaseOrders.lineItems')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.items')}</TableHead>
                <TableHead>{t('common.sku')}</TableHead>
                <TableHead>{t('common.ordered')}</TableHead>
                <TableHead>{t('common.received')}</TableHead>
                <TableHead>{t('purchaseOrderDetail.costPerUnit')}</TableHead>
                <TableHead>{t('common.subtotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.inventory_item?.name ?? item.inventory_item_id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.inventory_item?.sku ?? '—'}
                  </TableCell>
                  <TableCell>{item.quantity_ordered}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.quantity_received >= item.quantity_ordered
                          ? 'text-green-600 font-medium'
                          : item.quantity_received > 0
                          ? 'text-yellow-600 font-medium'
                          : 'text-gray-400'
                      }
                    >
                      {item.quantity_received}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(item.cost_per_unit)}</TableCell>
                  <TableCell>{formatCurrency(item.quantity_ordered * item.cost_per_unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canReceive && <ReceiveSection po={po} />}
    </div>
  )
}
