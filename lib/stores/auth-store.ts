import { create } from 'zustand'
import { useWorkoutStore } from '@/lib/stores/workout-store'
import { useProfileStore } from '@/lib/stores/profile-store'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'

interface UserData {
  id: string
  email: string
  name: string
  role: 'USER' | 'COACH' | 'ADMIN'
}

interface AuthState {
  user: UserData | null
  loading: boolean
  isAuthenticated: boolean
  setUser: (user: UserData | null) => void
  setLoading: (loading: boolean) => void
  signUp: (email: string, password: string, name: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email, password, name) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      // Clear all store states for clean sign up
      useWorkoutStore.getState().reset()
      useProfileStore.getState().reset()
      useEnhancedWorkoutStore.getState().reset()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('enhanced-workout-store')
      }

      return data
    } catch (error) {
      throw error
    }
  },

  signIn: async (email, password) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signin failed')
      if (data.user) {
        // Reset stores to clear any previous cached states before setting user
        useWorkoutStore.getState().reset()
        useProfileStore.getState().reset()
        useEnhancedWorkoutStore.getState().reset()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('enhanced-workout-store')
        }
        set({ user: data.user, isAuthenticated: true })
      }
      return data
    } catch (error) {
      throw error
    }
  },

  signOut: async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      set({ user: null, isAuthenticated: false })
      
      // Clear store states on sign out
      useWorkoutStore.getState().reset()
      useProfileStore.getState().reset()
      useEnhancedWorkoutStore.getState().reset()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('enhanced-workout-store')
      }
    } catch (error) {
      console.error('Signout error:', error)
    }
  },

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        const currentUser = get().user
        if (data.user) {
          // If the logged-in user changed, reset all stores
          if (currentUser && currentUser.id !== data.user.id) {
            useWorkoutStore.getState().reset()
            useProfileStore.getState().reset()
            useEnhancedWorkoutStore.getState().reset()
            if (typeof window !== 'undefined') {
              localStorage.removeItem('enhanced-workout-store')
            }
          }
          set({ user: data.user, isAuthenticated: true })
        } else {
          set({ user: null, isAuthenticated: false })
          useWorkoutStore.getState().reset()
          useProfileStore.getState().reset()
          useEnhancedWorkoutStore.getState().reset()
          if (typeof window !== 'undefined') {
            localStorage.removeItem('enhanced-workout-store')
          }
        }
      } else {
        set({ user: null, isAuthenticated: false })
        useWorkoutStore.getState().reset()
        useProfileStore.getState().reset()
        useEnhancedWorkoutStore.getState().reset()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('enhanced-workout-store')
        }
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ loading: false })
    }
  }
}))