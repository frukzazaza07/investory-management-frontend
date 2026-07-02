import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Search, CheckCircle, XCircle, Plus, Trash2, RefreshCw } from 'lucide-react'
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
import { useStockLevels, useProductAvailability, useDeductStock } from '@/hooks/usePos'
import type { DeductStockResult } from '@/types'
import { getApiError } from '@/lib/apiError'

function AvailabilityChecker() {
  const { t } = useTranslation()
  const [posId, setPosId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [query, setQuery] = useState<{ posId: string; quantity: number } | null>(null)

  const { data, isLoading, isError } = useProductAvailability(
    query?.posId ?? '',
    query?.quantity ?? 1,
  )

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    if (posId.trim()) setQuery({ posId: posId.trim(), quantity })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pos.availability')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCheck} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label>{t('pos.posProductId')}</Label>
            <Input
              value={posId}
              onChange={(e) => setPosId(e.target.value)}
              placeholder="pos-product-001"
            />
          </div>
          <div className="w-24 space-y-1">
            <Label>{t('common.quantity')}</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            <Search className="h-4 w-4" />
            {t('pos.check')}
          </Button>
        </form>

        {isLoading && <LoadingSpinner />}
        {isError && <p className="text-sm text-red-500">{t('pos.productNotFound')}</p>}

        {data && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{data.name}</p>
              {data.is_available ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {t('pos.available')}
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {t('pos.unavailable')}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {data.details.map((d) => (
                <div key={d.inventory_item_id} className="flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{t('pos.unitCost')}: {d.unit_cost.toFixed(2)}</span>
                    <span className="text-gray-500">
                      {t('pos.needHave', { required: d.required, available: d.available })}
                    </span>
                    {d.is_sufficient ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type DeductForm = {
  pos_order_id: string
  items: { pos_product_id: string; quantity: number }[]
}

function DeductStockForm() {
  const { t } = useTranslation()
  const deduct = useDeductStock()
  const [lastResult, setLastResult] = useState<DeductStockResult | null>(null)

  const deductSchema = useMemo(
    () =>
      z.object({
        pos_order_id: z.string().min(1, t('validation.orderIdRequired')),
        items: z
          .array(
            z.object({
              pos_product_id: z.string().min(1, t('validation.productIdRequired')),
              quantity: z.coerce.number().min(1, t('validation.quantityMin1')),
            }),
          )
          .min(1, t('validation.itemsMin')),
      }),
    [t],
  )

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<DeductForm>({
    resolver: zodResolver(deductSchema),
    defaultValues: { pos_order_id: '', items: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (values: DeductForm) => {
    try {
      const result = await deduct.mutateAsync(values)
      setLastResult(result)
      toast.success(t('pos.stockDeducted'))
      reset()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pos.deductStock')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('pos.posOrderId')} *</Label>
            <Input {...register('pos_order_id')} placeholder={t('pos.posOrderIdPlaceholder')} />
            {errors.pos_order_id && (
              <p className="text-xs text-red-500">{errors.pos_order_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('pos.items')} *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ pos_product_id: '', quantity: 1 })}
              >
                <Plus className="h-3 w-3" />
                {t('common.add')}
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Input
                  {...register(`items.${index}.pos_product_id`)}
                  placeholder={t('pos.posProductIdPlaceholder')}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  {...register(`items.${index}.quantity`)}
                  className="w-24"
                  placeholder="Qty"
                />
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
              <p className="text-sm text-gray-400 text-center py-3">
                {t('pos.clickToAdd')}
              </p>
            )}
          </div>

          <Button type="submit" disabled={deduct.isPending}>
            {deduct.isPending ? t('common.processing') : t('pos.deduct')}
          </Button>
        </form>

        {lastResult?.cost_breakdown && lastResult.cost_breakdown.length > 0 && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('pos.costBreakdown')}</p>
            {lastResult.cost_breakdown.map((c) => (
              <div key={c.pos_product_id} className="flex justify-between text-sm">
                <span className="text-gray-500 font-mono text-xs">{c.pos_product_id}</span>
                <span>{t('pos.totalCost')}: <strong>{c.total_cost.toFixed(2)}</strong></span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between text-sm font-semibold">
              <span>{t('pos.orderCost')}</span>
              <span>
                {lastResult.cost_breakdown.reduce((s, c) => s + c.total_cost, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function PosPage() {
  const { t } = useTranslation()
  const { data: stockLevels, isLoading, refetch, isFetching } = useStockLevels()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('pos.title')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <AvailabilityChecker />
        <DeductStockForm />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('pos.stockLevels')}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.sku')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('pos.inStock')}</TableHead>
                  <TableHead>{t('pos.minQty')}</TableHead>
                  <TableHead>{t('common.unit')}</TableHead>
                  <TableHead>{t('pos.unitCost')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      {t('pos.noStockData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  stockLevels?.map((item) => (
                    <TableRow key={item.inventory_item_id}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell
                        className={
                          item.is_out
                            ? 'text-red-600 font-bold'
                            : item.is_low
                            ? 'text-yellow-600 font-semibold'
                            : ''
                        }
                      >
                        {item.quantity_in_stock}
                      </TableCell>
                      <TableCell>{item.min_quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.is_out ? (
                          <Badge variant="destructive">{t('pos.outOfStock')}</Badge>
                        ) : item.is_low ? (
                          <Badge variant="warning">{t('pos.low')}</Badge>
                        ) : (
                          <Badge variant="success">{t('pos.ok')}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
