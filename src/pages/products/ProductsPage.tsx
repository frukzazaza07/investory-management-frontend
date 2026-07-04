import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Plus, Pencil, Trash2, Search, Eye, ScanLine, Camera, CameraOff } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/Pagination'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type ProductBody,
} from '@/hooks/useProducts'
import { useProductByBarcode } from '@/hooks/useProductByBarcode'
import { getApiError } from '@/lib/apiError'
import type { Product } from '@/types'

type Form = {
  pos_product_id: string
  name: string
  sku?: string
  barcode?: string
  is_active?: boolean
}

function ProductDialog({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product?: Product
}) {
  const { t } = useTranslation()
  const create = useCreateProduct()
  const update = useUpdateProduct(product?.id ?? '')
  const isPending = create.isPending || update.isPending
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        pos_product_id: z.string().min(1, t('validation.posProductIdRequired')),
        name: z.string().min(1, t('validation.nameRequired')),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        is_active: z.boolean().optional(),
      }),
    [t],
  )

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
            pos_product_id: product.pos_product_id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            is_active: product.is_active,
          }
          : { pos_product_id: '', name: '', sku: '', barcode: '', is_active: true },
      )
    } else {
      setCameraActive(false)
    }
  }, [open, product, reset])

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }, [])

  useEffect(() => {
    if (!cameraActive || !videoRef.current) return
    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          setValue('barcode', result.getText(), { shouldValidate: true })
          setCameraActive(false)
        }
      })
      .then((controls) => {
        controlsRef.current = controls
      })
      .catch(() => setCameraActive(false))
    return () => stopCamera()
  }, [cameraActive, setValue, stopCamera])

  const onSubmit = async (values: Form) => {
    const body: ProductBody = { ...values }
    try {
      if (product) {
        await update.mutateAsync(body)
        toast.success(t('products.updated'))
      } else {
        await create.mutateAsync(body)
        toast.success(t('products.createdToast'))
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
          <DialogTitle>{product ? t('products.editTitle') : t('products.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>{t('products.posProductId')} *</Label>
            <Input {...register('pos_product_id')} placeholder="pos-001" />
            {errors.pos_product_id && (
              <p className="text-xs text-red-500">{errors.pos_product_id.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input {...register('name')} placeholder={t('products.productNamePlaceholder')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('common.sku')}</Label>
              <Input {...register('sku')} placeholder="SKU-001" />
            </div>
            <div className="space-y-1">
              <Label>{t('common.barcode')}</Label>
              <div className="flex gap-2">
                <Input {...register('barcode')} placeholder="123456789" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  title={t('products.scanBarcode')}
                  onClick={() => setCameraActive((v) => !v)}
                >
                  {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          {cameraActive && (
            <video
              ref={videoRef}
              className="w-full rounded-lg border border-gray-300"
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="rounded" />
            <span className="text-sm">{t('common.active')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : product ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BarcodeLookupPanel() {
  const { t } = useTranslation()
  const [barcode, setBarcode] = useState<string | null>(null)
  const { data: product, isLoading, isError } = useProductByBarcode(barcode)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          {t('products.barcodeLookup')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <BarcodeScanner onScan={(b) => setBarcode(b)} />
        {isLoading && <p className="text-sm text-gray-500">{t('products.lookingUp')}</p>}
        {isError && (
          <p className="text-sm text-red-500">{t('products.noBarcodeProduct', { barcode })}</p>
        )}
        {product && (
          <div className="rounded-lg border border-gray-200 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{product.name}</p>
              <Badge variant={product.is_active ? 'success' : 'secondary'}>
                {product.is_active ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{t('common.sku')}: {product.sku}</p>
            <p className="text-sm text-gray-500">{t('common.barcode')}: {product.barcode}</p>
            {product.bom && product.bom.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('products.bom')}</p>
                <ul className="space-y-0.5">
                  {product.bom.map((b) => (
                    <li key={b.id} className="text-sm">
                      {b.inventory_item?.name} — {b.quantity_required} {b.inventory_item?.unit}
                      {' '}(have {b.inventory_item?.quantity_in_stock})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button size="sm" variant="outline" className="mt-2" asChild>
              <Link to={`/products/${product.id}`}>{t('products.viewDetails')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const [showScanner, setShowScanner] = useState(false)

  const { data, isLoading } = useProducts(page, search)
  const deleteProduct = useDeleteProduct()

  const openCreate = () => { setEditProduct(undefined); setDialogOpen(true) }
  const openEdit = (p: Product) => { setEditProduct(p); setDialogOpen(true) }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(t('products.deleteConfirm', { name: p.name }))) return
    try {
      await deleteProduct.mutateAsync(p.id)
      toast.success(t('products.deleted'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScanner((v) => !v)}>
            <ScanLine className="h-4 w-4" />
            {showScanner ? t('products.hideScanner') : t('products.scanBarcode')}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      {showScanner && <BarcodeLookupPanel />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t('products.searchPlaceholder')}
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
                  <TableHead>{t('products.posId')}</TableHead>
                  <TableHead>{t('common.sku')}</TableHead>
                  <TableHead>{t('common.barcode')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      {t('products.notFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.pos_product_id}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{p.barcode || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? 'success' : 'secondary'}>
                          {p.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/products/${p.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(p)}
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

      <ProductDialog open={dialogOpen} onClose={() => setDialogOpen(false)} product={editProduct} />
    </div>
  )
}
