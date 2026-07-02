import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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
import { useProduct, useProductBOM, useUpdateProductBOM } from '@/hooks/useProducts'
import { useInventoryItems } from '@/hooks/useInventory'
import { getApiError } from '@/lib/apiError'

type DraftBOMItem = {
  inventory_item_id: string
  quantity_required: number
}

export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading: productLoading } = useProduct(id ?? '')
  const { data: bom, isLoading: bomLoading } = useProductBOM(id ?? '')
  const { data: inventoryData } = useInventoryItems(1, '', 100)
  const updateBOM = useUpdateProductBOM(id ?? '')

  const [draftBOM, setDraftBOM] = useState<DraftBOMItem[] | null>(null)
  const [newItemId, setNewItemId] = useState('')
  const [newQty, setNewQty] = useState(1)

  const activeBOM: DraftBOMItem[] = draftBOM ?? (bom?.map((b) => ({
    inventory_item_id: b.inventory_item_id,
    quantity_required: b.quantity_required,
  })) ?? [])

  const startEditing = () => {
    setDraftBOM(bom?.map((b) => ({
      inventory_item_id: b.inventory_item_id,
      quantity_required: b.quantity_required,
    })) ?? [])
  }

  const cancelEditing = () => setDraftBOM(null)

  const addBOMItem = () => {
    if (!newItemId) return
    if (activeBOM.some((b) => b.inventory_item_id === newItemId)) {
      toast.error(t('productDetail.itemAlreadyInBom'))
      return
    }
    setDraftBOM([...(draftBOM ?? []), { inventory_item_id: newItemId, quantity_required: newQty }])
    setNewItemId('')
    setNewQty(1)
  }

  const removeBOMItem = (itemId: string) => {
    setDraftBOM(activeBOM.filter((b) => b.inventory_item_id !== itemId))
  }

  const updateQty = (itemId: string, qty: number) => {
    setDraftBOM(activeBOM.map((b) =>
      b.inventory_item_id === itemId ? { ...b, quantity_required: qty } : b,
    ))
  }

  const saveBOM = async () => {
    if (!draftBOM) return
    try {
      await updateBOM.mutateAsync(draftBOM)
      toast.success(t('productDetail.bomSaved'))
      setDraftBOM(null)
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  const inventoryItems = inventoryData?.items ?? []
  const getInventoryName = (itemId: string) =>
    inventoryItems.find((i) => i.id === itemId)?.name ?? itemId

  const getInventoryUnit = (itemId: string) =>
    inventoryItems.find((i) => i.id === itemId)?.unit ?? ''

  if (productLoading) return <LoadingSpinner />
  if (!product) return <p className="text-gray-500">{t('productDetail.notFound')}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 font-mono">{product.sku || product.pos_product_id}</p>
        </div>
        <Badge variant={product.is_active ? 'success' : 'secondary'} className="ml-auto">
          {product.is_active ? t('common.active') : t('common.inactive')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('products.posProductId')}</p>
            <p className="font-mono text-sm font-medium mt-1">{product.pos_product_id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('common.sku')}</p>
            <p className="font-mono text-sm font-medium mt-1">{product.sku || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('common.barcode')}</p>
            <p className="font-mono text-sm font-medium mt-1">{product.barcode || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('productDetail.bomItems')}</p>
            <p className="text-2xl font-bold mt-1">{bom?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('productDetail.bom')}</CardTitle>
          {draftBOM === null ? (
            <Button size="sm" variant="outline" onClick={startEditing}>
              {t('productDetail.editBom')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={saveBOM} disabled={updateBOM.isPending}>
                {updateBOM.isPending ? t('productDetail.savingBom') : t('productDetail.saveBom')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {bomLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {draftBOM !== null && (
                <div className="flex gap-2 items-end p-3 rounded-lg bg-gray-50 border border-dashed border-gray-300">
                  <div className="flex-1 space-y-1">
                    <Label>{t('productDetail.inventoryItem')}</Label>
                    <Select value={newItemId} onChange={(e) => setNewItemId(e.target.value)}>
                      <option value="">{t('productDetail.selectItem')}</option>
                      {inventoryItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.sku})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label>{t('common.quantity')}</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0.001"
                      value={newQty}
                      onChange={(e) => setNewQty(Number(e.target.value))}
                    />
                  </div>
                  <Button size="sm" onClick={addBOMItem}>
                    <Plus className="h-4 w-4" />
                    {t('common.add')}
                  </Button>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('productDetail.ingredient')}</TableHead>
                    <TableHead>{t('productDetail.qtyRequired')}</TableHead>
                    <TableHead>{t('common.unit')}</TableHead>
                    {draftBOM !== null && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBOM.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                        {t('productDetail.noBomItems')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeBOM.map((b) => (
                      <TableRow key={b.inventory_item_id}>
                        <TableCell className="font-medium">
                          {getInventoryName(b.inventory_item_id)}
                        </TableCell>
                        <TableCell>
                          {draftBOM !== null ? (
                            <Input
                              type="number"
                              step="any"
                              min="0.001"
                              className="w-24"
                              value={b.quantity_required}
                              onChange={(e) =>
                                updateQty(b.inventory_item_id, Number(e.target.value))
                              }
                            />
                          ) : (
                            b.quantity_required
                          )}
                        </TableCell>
                        <TableCell>{getInventoryUnit(b.inventory_item_id)}</TableCell>
                        {draftBOM !== null && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeBOMItem(b.inventory_item_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
