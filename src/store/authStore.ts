import { create } from 'zustand'

type AuthState = {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  clearToken: () => {
    localStorage.removeItem('token')
    set({ token: null })
  },
  isAuthenticated: () => !!get().token,
}))
