import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { posApi } from '@/lib/api'
import type { ApiResponse, StockLevel, AvailabilityResult, DeductStockResult } from '@/types'

export function useStockLevels() {
  return useQuery({
    queryKey: ['pos', 'stock-levels'],
    queryFn: async () => {
      const { data } = await posApi.get<ApiResponse<StockLevel[]>>('/api/v1/pos/stock/levels')
      return data.data!
    },
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useProductAvailability(posProductId: string, quantity = 1) {
  return useQuery({
    queryKey: ['pos', 'availability', posProductId, quantity],
    queryFn: async () => {
      const { data } = await posApi.get<ApiResponse<AvailabilityResult>>(
        `/api/v1/pos/products/${posProductId}/availability`,
        { params: { quantity } },
      )
      return data.data!
    },
    enabled: !!posProductId,
  })
}

export function useDeductStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      pos_order_id: string
      items: { pos_product_id: string; quantity: number }[]
    }) => {
      const { data } = await posApi.post<ApiResponse<DeductStockResult>>(
        '/api/v1/pos/stock/deduct',
        body,
      )
      return data.data!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pos', 'stock-levels'] }),
  })
}
