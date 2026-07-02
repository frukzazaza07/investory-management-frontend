import { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

export function getApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    return (
      (err.response?.data as ApiResponse)?.message ??
      err.message ??
      'Something went wrong'
    )
  }
  return 'Something went wrong'
}
