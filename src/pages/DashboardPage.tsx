import { useTranslation } from 'react-i18next'
import { Users, Package, ShoppingCart, FileText, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useInventoryItems } from '@/hooks/useInventory'
import { useProducts } from '@/hooks/useProducts'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { useStockLevels } from '@/hooks/usePos'

type StatCardProps = {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const suppliers = useSuppliers(1, '')
  const inventory = useInventoryItems(1, '')
  const products = useProducts(1, '')
  const orders = usePurchaseOrders()
  const stockLevels = useStockLevels()

  const lowStock = stockLevels.data?.filter((s) => s.is_low && !s.is_out) ?? []
  const outOfStock = stockLevels.data?.filter((s) => s.is_out) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.suppliers')}
          value={suppliers.data?.total ?? '—'}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label={t('dashboard.inventoryItems')}
          value={inventory.data?.total ?? '—'}
          icon={Package}
          color="bg-indigo-500"
        />
        <StatCard
          label={t('dashboard.products')}
          value={products.data?.total ?? '—'}
          icon={ShoppingCart}
          color="bg-violet-500"
        />
        <StatCard
          label={t('dashboard.purchaseOrders')}
          value={orders.data?.total ?? '—'}
          icon={FileText}
          color="bg-purple-500"
        />
      </div>

      {stockLevels.isLoading && <LoadingSpinner />}

      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {outOfStock.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  {t('dashboard.outOfStock', { count: outOfStock.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {outOfStock.map((item) => (
                    <li key={item.inventory_item_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{item.sku}</span>
                        <Badge variant="destructive">OUT</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {lowStock.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  {t('dashboard.lowStock', { count: lowStock.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lowStock.map((item) => (
                    <li key={item.inventory_item_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {item.quantity_in_stock} / {item.min_quantity} {item.unit}
                        </span>
                        <Badge variant="warning">LOW</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {stockLevels.data && outOfStock.length === 0 && lowStock.length === 0 && (
        <Card className="border-green-200">
          <CardContent className="p-6 text-center text-green-700">
            {t('dashboard.allHealthy')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
