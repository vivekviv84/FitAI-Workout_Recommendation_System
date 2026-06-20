import { create } from 'zustand'

export interface UserProfile {
  user_id: string
  age: number | null
  sex: 'MALE' | 'FEMALE' | 'OTHER' | null
  height_cm: number | null
  weight_kg: number | null
  goal: 'FAT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH' | 'GENERAL_FITNESS' | 'ENDURANCE' | null
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
  days_per_week: number | null
  minutes_per_day: number | null
  split_preference: 'PPL' | 'UL_LL' | 'FULL_BODY' | null
  injuries: string[]
  disliked_exercises: string[]
  available_equipment: string[]
}

interface ProfileState {
  profile: UserProfile | null
  loading: boolean
  
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok) {
        set({ profile: data })
      }
      set({ loading: false })
    } catch (error) {
      console.error('Fetch profile error:', error)
      set({ loading: false })
    }
  },

  updateProfile: async (updates) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      set({ profile: data })
      return data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  reset: () => set({
    profile: null,
    loading: true
  })
}))
