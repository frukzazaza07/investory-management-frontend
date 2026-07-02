import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { ApiResponse } from '@/types'

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<ApiResponse<{ token: string }>>('/auth/login', body)
      return data.data!.token
    },
    onSuccess: (token) => {
      setToken(token)
      navigate('/dashboard')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<ApiResponse>('/auth/register', body),
    onSuccess: () => navigate('/login'),
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ user_id: number; email: string }>>('/api/me')
      return data
    },
  })
}

export function useLogout() {
  const clearToken = useAuthStore((s) => s.clearToken)
  const navigate = useNavigate()
  return () => {
    clearToken()
    navigate('/login')
  }
}
