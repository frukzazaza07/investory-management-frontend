import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Product } from '@/types'

export function useProductByBarcode(barcode: string | null) {
  return useQuery({
    queryKey: ['products', 'barcode', barcode],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(
        `/api/v1/products/barcode/${barcode}`,
      )
      return data.data!
    },
    enabled: !!barcode,
    retry: false,
  })
}
