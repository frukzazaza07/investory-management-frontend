import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Paginated, InventoryItem, StockTransaction } from '@/types'

const KEYS = {
  list: (page: number, search: string) => ['inventory', page, search],
  detail: (id: string) => ['inventory', id],
  transactions: (id: string, page: number) => ['inventory', id, 'transactions', page],
}

export function useInventoryItems(page = 1, search = '', limit = 20) {
  return useQuery({
    queryKey: KEYS.list(page, search),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Paginated<InventoryItem>>>(
        '/api/v1/inventory/items',
        { params: { page, limit, search } },
      )
      return data.data!
    },
  })
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InventoryItem>>(
        `/api/v1/inventory/items/${id}`,
      )
      return data.data!
    },
    enabled: !!id,
  })
}

export function useInventoryTransactions(id: string, page = 1) {
  return useQuery({
    queryKey: KEYS.transactions(id, page),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Paginated<StockTransaction>>>(
        `/api/v1/inventory/items/${id}/transactions`,
        { params: { page, limit: 20 } },
      )
      return data.data!
    },
    enabled: !!id,
  })
}

export type InventoryBody = {
  sku: string
  name: string
  unit: string
  description?: string
  min_quantity?: number
  cost_per_unit?: number
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InventoryBody) =>
      api.post<ApiResponse<InventoryItem>>('/api/v1/inventory/items', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateInventoryItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InventoryBody) =>
      api.put<ApiResponse<InventoryItem>>(`/api/v1/inventory/items/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      quantity,
      is_add,
      note,
    }: {
      id: string
      quantity: number
      is_add: boolean
      note?: string
    }) => api.post(`/api/v1/inventory/items/${id}/adjust`, { quantity, is_add, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/inventory/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
