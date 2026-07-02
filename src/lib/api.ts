import axios from 'axios'

const getLang = () => localStorage.getItem('lang') ?? 'en'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Accept-Language': getLang() },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = getLang()
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const posApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'X-API-Key': import.meta.env.VITE_POS_API_KEY },
})
