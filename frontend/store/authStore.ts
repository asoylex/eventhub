import { create } from 'zustand'
import { User } from '@/types'
import { saveSession, clearSession, getStoredUser } from '@/lib/auth'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  initialize: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  initialize: () => {
    const user = getStoredUser()
    set({ user })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      saveSession(data.data.accessToken, data.data.refreshToken, data.data.user)
      set({ user: data.data.user, isLoading: false })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/register', registerData)
      set({ isLoading: false })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } finally {
      clearSession()
      set({ user: null })
    }
  },
}))