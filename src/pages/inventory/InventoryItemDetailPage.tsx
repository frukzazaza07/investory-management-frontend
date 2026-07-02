import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Pagination } from '@/components/Pagination'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useInventoryItem, useInventoryTransactions } from '@/hooks/useInventory'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import type { StockTransaction } from '@/types'

function TxTypeBadge({ type }: { type: StockTransaction['transaction_type'] }) {
  const map = {
    IN: { label: 'IN', variant: 'success' as const, icon: TrendingUp },
    OUT: { label: 'OUT', variant: 'destructive' as const, icon: TrendingDown },
    ADJUSTMENT_ADD: { label: 'Adj +', variant: 'default' as const, icon: TrendingUp },
    ADJUSTMENT_REMOVE: { label: 'Adj −', variant: 'secondary' as const, icon: TrendingDown },
  }
  const { label, variant } = map[type]
  return <Badge variant={variant}>{label}</Badge>
}

export default function InventoryItemDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState(1)

  const { data: item, isLoading: itemLoading } = useInventoryItem(id ?? '')
  const { data: txData, isLoading: txLoading } = useInventoryTransactions(id ?? '', page)

  if (itemLoading) return <LoadingSpinner />
  if (!item) return <p className="text-gray-500">{t('inventoryDetail.notFound')}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500 font-mono">{item.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('inventoryDetail.inStock')}</p>
            <p className="text-2xl font-bold mt-1">
              {item.quantity_in_stock}
              <span className="text-sm font-normal text-gray-500 ml-1">{item.unit}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('inventoryDetail.minQuantity')}</p>
            <p className="text-2xl font-bold mt-1">
              {item.min_quantity}
              <span className="text-sm font-normal text-gray-500 ml-1">{item.unit}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('inventoryDetail.costPerUnit')}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(item.cost_per_unit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('inventoryDetail.stockValue')}</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(item.quantity_in_stock * item.cost_per_unit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {item.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">{t('common.description')}</p>
            <p className="text-sm">{item.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('inventoryDetail.transactions')}</CardTitle>
          <p className="text-sm text-gray-500">
            {t('inventoryDetail.createdUpdated', {
              created: formatDate(item.created_at),
              updated: formatDate(item.updated_at),
            })}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('inventoryDetail.qty')}</TableHead>
                    <TableHead>{t('common.before')}</TableHead>
                    <TableHead>{t('common.after')}</TableHead>
                    <TableHead>{t('common.reference')}</TableHead>
                    <TableHead>{t('common.note')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txData?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        {t('inventoryDetail.noTransactions')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    txData?.items.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(tx.created_at)}
                        </TableCell>
                        <TableCell>
                          <TxTypeBadge type={tx.transaction_type} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.transaction_type.includes('REMOVE') || tx.transaction_type === 'OUT'
                            ? <span className="text-red-600">−{tx.quantity}</span>
                            : <span className="text-green-600">+{tx.quantity}</span>
                          }
                        </TableCell>
                        <TableCell>{tx.quantity_before}</TableCell>
                        <TableCell>{tx.quantity_after}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {tx.reference_type ? `${tx.reference_type}` : <Minus className="h-3 w-3" />}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{tx.note || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {txData && (
                <div className="p-4">
                  <Pagination page={page} total={txData.total} limit={txData.limit} onPage={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
