import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Paginated, Supplier } from '@/types'

const KEYS = {
  list: (page: number, search: string) => ['suppliers', page, search],
  detail: (id: string) => ['suppliers', id],
}

export function useSuppliers(page = 1, search = '', limit = 20) {
  return useQuery({
    queryKey: KEYS.list(page, search),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Paginated<Supplier>>>('/api/v1/suppliers', {
        params: { page, limit, search },
      })
      return data.data!
    },
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Supplier>>(`/api/v1/suppliers/${id}`)
      return data.data!
    },
    enabled: !!id,
  })
}

export type SupplierBody = {
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SupplierBody) =>
      api.post<ApiResponse<Supplier>>('/api/v1/suppliers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SupplierBody) =>
      api.put<ApiResponse<Supplier>>(`/api/v1/suppliers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
