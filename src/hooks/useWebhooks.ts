import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, Webhook, WebhookLog } from '@/types'

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Webhook[]>>('/api/v1/webhooks')
      return (data.data ?? []).map((w) => ({
        ...w,
        events: Array.isArray(w.events) ? w.events : [],
      }))
    },
  })
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhooks', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Webhook>>(`/api/v1/webhooks/${id}`)
      const webhook = data.data!
      return { ...webhook, events: Array.isArray(webhook.events) ? webhook.events : [] }
    },
    enabled: !!id,
  })
}

export function useWebhookLogs(id: string) {
  return useQuery({
    queryKey: ['webhooks', id, 'logs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WebhookLog[]>>(
        `/api/v1/webhooks/${id}/logs`,
      )
      return data.data!
    },
    enabled: !!id,
  })
}

export type WebhookBody = {
  name: string
  url: string
  secret?: string
  events?: ('STOCK_UPDATED' | 'STOCK_LOW' | 'STOCK_OUT')[]
  is_active?: boolean
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: WebhookBody) =>
      api.post<ApiResponse<Webhook>>('/api/v1/webhooks', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useUpdateWebhook(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<WebhookBody>) =>
      api.put<ApiResponse<Webhook>>(`/api/v1/webhooks/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useTestWebhook(id: string) {
  return useMutation({
    mutationFn: () => api.post(`/api/v1/webhooks/${id}/test`),
  })
}
