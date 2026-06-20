import { create } from 'zustand'

export interface CompletedSet {
  reps: number
  weight: number
  rpe: number
}

export interface Exercise {
  id: string
  name: string
  primary_muscle: string
  sets: number
  reps: string
  target_rpe: number
  rest_sec: number
  completed?: boolean
  completedSets?: CompletedSet[]
}

export interface WorkoutDay {
  id: string
  date: string
  label: string
  exercises: Exercise[]
  completed?: boolean
  deload?: boolean
}

export interface WorkoutPlan {
  id: string
  userId: string
  weeks: any[]
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  startDate: string
  rationale?: string
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  days: any[]
}

interface WorkoutState {
  currentPlan: WorkoutPlan | null
  currentWorkout: WorkoutDay | null
  plans: WorkoutPlan[]
  streak: number
  totalWorkouts: number
  
  setPlan: (plan: WorkoutPlan) => void
  setCurrentWorkout: (workout: WorkoutDay | null) => void
  setPlans: (plans: WorkoutPlan[]) => void
  
  generatePlan: (weeks: number, templates: string[]) => Promise<any>
  fetchPlans: () => Promise<void>
  fetchWorkout: (workoutDayId: string) => Promise<WorkoutDay | null>
  logSet: (workoutExerciseId: string, setNumber: number, reps: number, weight: number, rpe: number) => Promise<any>
  completeWorkout: (workoutDayId: string) => Promise<any>
  
  completeSet: (exerciseId: string, setIndex: number, reps: number, weight: number, rpe: number) => void
  updateStreak: (streak: number) => void
  reset: () => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentPlan: null,
  currentWorkout: null,
  plans: [],
  streak: 0,
  totalWorkouts: 0,

  setPlan: (plan) => set({ currentPlan: plan }),
  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),
  setPlans: (plans) => set({ plans }),

  generatePlan: async (weeks, templates) => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeks,
          templateCandidates: templates,
          startDate: new Date().toISOString().split('T')[0]
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan')
      return data
    } catch (error) {
      console.error('Plan generation error:', error)
      throw error
    }
  },

  fetchPlans: async () => {
    try {
      const res = await fetch('/api/plans')
      const data = await res.json()
      if (res.ok) {
        const plansList = data.data || []
        set({ plans: plansList })
        if (plansList.length > 0 && plansList[0].status === 'ACTIVE') {
          set({ currentPlan: plansList[0] })
        }
      }
    } catch (error) {
      console.error('Fetch plans error:', error)
    }
  },

  fetchWorkout: async (workoutDayId: string) => {
    try {
      const res = await fetch(`/api/workout?dayId=${workoutDayId}`)
      const data = await res.json()
      if (res.ok) {
        const formattedWorkout = {
          ...data,
          exercises: (data.exercises || []).map((ex: any) => ({
            ...ex,
            completedSets: (ex.completedSets || []).map((s: any) => ({
              reps: s.reps_completed !== undefined ? s.reps_completed : s.reps,
              weight: s.weight_kg !== undefined ? s.weight_kg : s.weight,
              rpe: s.rpe
            }))
          }))
        }
        set({ currentWorkout: formattedWorkout })
        return formattedWorkout
      }
      throw new Error(data.error || 'Failed to fetch workout')
    } catch (error) {
      console.error('Fetch workout error:', error)
      return null
    }
  },

  logSet: async (workoutExerciseId, setNumber, reps, weight, rpe) => {
    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutExerciseId,
          setNumber,
          repsCompleted: reps,
          weight,
          rpe
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log set')
      return data
    } catch (error) {
      console.error('Log set error:', error)
      throw error
    }
  },

  completeWorkout: async (workoutDayId: string) => {
    try {
      const res = await fetch('/api/workout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutDayId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete workout')
      set({ currentWorkout: null })
      await get().fetchPlans()
      return data
    } catch (error) {
      console.error('Complete workout error:', error)
      throw error
    }
  },

  completeSet: (exerciseId, setIndex, reps, weight, rpe) => {
    const { currentWorkout } = get()
    if (!currentWorkout) return

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(ex => 
        ex.id === exerciseId 
          ? {
              ...ex,
              completedSets: [
                ...(ex.completedSets || []),
                { reps, weight, rpe }
              ]
            }
          : ex
      )
    }
    set({ currentWorkout: updatedWorkout })
  },

  updateStreak: (streak) => set({ streak }),

  reset: () => set({
    currentPlan: null,
    currentWorkout: null,
    plans: [],
    streak: 0,
    totalWorkouts: 0
  })
}))