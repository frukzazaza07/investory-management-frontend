import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Paginated, Product, BOMItem } from '@/types'

const KEYS = {
  list: (page: number, search: string) => ['products', page, search],
  detail: (id: string) => ['products', id],
  bom: (id: string) => ['products', id, 'bom'],
}

export function useProducts(page = 1, search = '', limit = 20) {
  return useQuery({
    queryKey: KEYS.list(page, search),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Paginated<Product>>>('/api/v1/products', {
        params: { page, limit, search },
      })
      return data.data!
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(`/api/v1/products/${id}`)
      return data.data!
    },
    enabled: !!id,
  })
}

export function useProductBOM(id: string) {
  return useQuery({
    queryKey: KEYS.bom(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BOMItem[]>>(`/api/v1/products/${id}/bom`)
      return data.data!
    },
    enabled: !!id,
  })
}

export type ProductBody = {
  pos_product_id: string
  name: string
  sku?: string
  barcode?: string
  is_active?: boolean
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProductBody) =>
      api.post<ApiResponse<Product>>('/api/v1/products', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProductBody) =>
      api.put<ApiResponse<Product>>(`/api/v1/products/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProductBOM(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: { inventory_item_id: string; quantity_required: number }[]) =>
      api.put<ApiResponse<BOMItem[]>>(`/api/v1/products/${id}/bom`, { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', id] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
