import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Paginated, InventoryItem, InventoryUnit, StockTransaction } from '@/types'

const KEYS = {
  list: (page: number, search: string) => ['inventory', page, search],
  detail: (id: string) => ['inventory', id],
  transactions: (id: string, page: number) => ['inventory', id, 'transactions', page],
  units: ['inventory', 'units'],
}

// Units for the item form's <select> — GET /api/v1/inventory/units.
// Admin-managed but changes rarely, so cache it for a few minutes.
export function useInventoryUnits() {
  return useQuery({
    queryKey: KEYS.units,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InventoryUnit[]>>('/api/v1/inventory/units')
      return data.data!
    },
    staleTime: 5 * 60 * 1000,
  })
}

export type InventoryUnitBody = {
  code: string
  name: string
}

// Admin-only — server returns 403 for non-admins (see useIsAdmin in useAuth.ts).
export function useCreateInventoryUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InventoryUnitBody) =>
      api.post<ApiResponse<InventoryUnit>>('/api/v1/inventory/units', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.units }),
  })
}

export function useUpdateInventoryUnit(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InventoryUnitBody) =>
      api.put<ApiResponse<InventoryUnit>>(`/api/v1/inventory/units/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.units }),
  })
}

// Fails with 400 if the unit is still referenced by an inventory item.
export function useDeleteInventoryUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/inventory/units/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.units }),
  })
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
