import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Paginated, PurchaseOrder } from '@/types'

const KEYS = {
  list: (page: number, status?: string) => ['purchase-orders', page, status],
  detail: (id: string) => ['purchase-orders', id],
}

export function usePurchaseOrders(page = 1, status?: string) {
  return useQuery({
    queryKey: KEYS.list(page, status),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Paginated<PurchaseOrder>>>(
        '/api/v1/purchase-orders',
        { params: { page, limit: 20, ...(status ? { status } : {}) } },
      )
      return data.data!
    },
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseOrder>>(
        `/api/v1/purchase-orders/${id}`,
      )
      return data.data!
    },
    enabled: !!id,
  })
}

export type CreatePOBody = {
  supplier_id: string
  notes?: string
  expected_at?: string
  items: { inventory_item_id: string; quantity_ordered: number; cost_per_unit: number }[]
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePOBody) =>
      api.post<ApiResponse<PurchaseOrder>>('/api/v1/purchase-orders', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useUpdatePurchaseOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { status?: string; notes?: string; expected_at?: string }) =>
      api.put<ApiResponse<PurchaseOrder>>(`/api/v1/purchase-orders/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useReceivePurchaseOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      note?: string
      items: { purchase_order_item_id: string; quantity_received: number }[]
    }) => api.post(`/api/v1/purchase-orders/${id}/receive`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCancelPurchaseOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/v1/purchase-orders/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}
