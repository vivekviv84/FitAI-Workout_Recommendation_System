import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EnhancedExercise {
  id: number
  name: string
  primary_muscle: string
  sets: number
  reps: string
  target_rpe: number
  rest_sec: number
  tempo?: string
  completed?: boolean
  completedSets?: Array<{
    reps: number
    weight: number
    rpe: number
    timestamp: string
  }>
  oneRepMax?: number
  totalTonnage?: number
  rationale?: string[]
}

interface EnhancedWorkoutDay {
  id: string
  date: string
  label: string
  deload: boolean
  exercises: EnhancedExercise[]
  completed?: boolean
  startTime?: string
  endTime?: string
  notes?: string
  sessionRPE?: number
  satisfaction?: number
}

interface WorkoutPlan {
  id: string
  weeks: EnhancedWorkoutDay[][]
  currentWeek: number
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  rationale?: string
  confidence?: number
  expectedAdherence?: number
  volumeProgression?: number[]
  deloadWeeks?: number[]
  balanceScore?: number
}

interface HabitData {
  streak: number
  longestStreak: number
  totalWorkouts: number
  weeklyGoal: number
  currentWeekWorkouts: number
  lastWorkoutDate?: string
  consistencyScore: number
  weeklyAdherence: number[]
}

interface ProgressMetrics {
  personalRecords: Record<number, { weight: number, date: string, reps: number }>
  volumeHistory: Array<{ date: string, volume: number }>
  strengthProgression: Array<{ exerciseId: number, date: string, oneRepMax: number }>
  bodyMetrics: Array<{ date: string, weight?: number, bodyFat?: number }>
}

interface EnhancedWorkoutState {
  // Core state
  currentPlan: WorkoutPlan | null
  currentWorkout: EnhancedWorkoutDay | null
  
  // Habit tracking
  habitData: HabitData
  
  // Progress metrics
  progressMetrics: ProgressMetrics
  
  // Bandit performance tracking
  templatePerformance: Record<string, { adherence: number, satisfaction: number, progressScore: number }>
  
  // Actions
  setPlan: (plan: WorkoutPlan) => void
  setCurrentWorkout: (workout: EnhancedWorkoutDay | null) => void
  completeSet: (exerciseId: number, reps: number, weight: number, rpe: number) => void
  completeWorkout: (sessionRPE: number, satisfaction: number, notes?: string) => void
  updateHabitData: () => void
  addPersonalRecord: (exerciseId: number, weight: number, reps: number) => void
  trackProgress: (exerciseId: number, oneRepMax: number) => void
  updateBodyMetrics: (weight?: number, bodyFat?: number) => void
  
  // Insights
  getStreakInsights: () => any
  getProgressInsights: () => any
  getHabitRecommendations: () => string[]
  reset: () => void
  
  // Helper functions
  calculateOneRepMax: (weight: number, reps: number, rpe: number) => number
  isConsecutiveDay: (lastDate?: string) => boolean
}

export const useEnhancedWorkoutStore = create<EnhancedWorkoutState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      currentWorkout: null,
      
      habitData: {
        streak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        weeklyGoal: 4,
        currentWeekWorkouts: 0,
        consistencyScore: 0,
        weeklyAdherence: []
      },
      
      progressMetrics: {
        personalRecords: {},
        volumeHistory: [],
        strengthProgression: [],
        bodyMetrics: []
      },
      
      templatePerformance: {},
      
      setPlan: (plan) => set({ currentPlan: plan }),
      
      setCurrentWorkout: (workout) => set({ currentWorkout: workout }),
      
      completeSet: (exerciseId, reps, weight, rpe) => {
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
                    { reps, weight, rpe, timestamp: new Date().toISOString() }
                  ]
                }
              : ex
          )
        }
        set({ currentWorkout: updatedWorkout })
      },
      
      completeWorkout: (sessionRPE, satisfaction, notes) => {
        const { currentWorkout, habitData, currentPlan } = get()
        if (!currentWorkout) return

        const now = new Date().toISOString()
        const completedWorkout = {
          ...currentWorkout,
          completed: true,
          endTime: now,
          sessionRPE,
          satisfaction,
          notes
        }

        // Update habit data (guard for undefined)
        const currentHabitData = habitData || get().habitData || {
          streak: 0,
          longestStreak: 0,
          totalWorkouts: 0,
          weeklyGoal: 4,
          currentWeekWorkouts: 0,
          lastWorkoutDate: undefined,
          consistencyScore: 0,
          weeklyAdherence: []
        }

        const newStreak = get().isConsecutiveDay(currentHabitData.lastWorkoutDate) ? currentHabitData.streak + 1 : 1
        const updatedHabitData = {
          ...currentHabitData,
          streak: newStreak,
          longestStreak: Math.max(currentHabitData.longestStreak, newStreak),
          totalWorkouts: currentHabitData.totalWorkouts + 1,
          currentWeekWorkouts: currentHabitData.currentWeekWorkouts + 1,
          lastWorkoutDate: now.split('T')[0]
        }

        // Update template performance for bandit
        if (currentPlan) {
          const template = currentPlan.template
          const currentPerf = get().templatePerformance[template] || { adherence: 0, satisfaction: 0, progressScore: 0 }
          const updatedPerf = {
            adherence: (currentPerf.adherence + 1) / 2, // Simplified
            satisfaction: (currentPerf.satisfaction + satisfaction) / 2,
            progressScore: currentPerf.progressScore // Would be calculated from actual progress
          }
          
          set({
            templatePerformance: {
              ...get().templatePerformance,
              [template]: updatedPerf
            }
          })
        }

        // Calculate and update PRs and progress
        completedWorkout.exercises.forEach(exercise => {
          exercise.completedSets?.forEach(set => {
            get().addPersonalRecord(exercise.id, set.weight, set.reps)
            const oneRepMax = get().calculateOneRepMax(set.weight, set.reps, set.rpe)
            get().trackProgress(exercise.id, oneRepMax)
          })
        })

        set({ 
          currentWorkout: null,
          habitData: updatedHabitData
        })
      },

      updateHabitData: () => {
        const { habitData } = get()
        const today = new Date().toISOString().split('T')[0]
        
        // Calculate weekly adherence
        const weeklyAdherence = habitData.currentWeekWorkouts / habitData.weeklyGoal
        
        // Calculate consistency score (last 4 weeks)
        const recentAdherence = habitData.weeklyAdherence.slice(-4)
        const consistencyScore = recentAdherence.length > 0 ? 
          recentAdherence.reduce((sum, rate) => sum + rate, 0) / recentAdherence.length : 0

        set({
          habitData: {
            ...habitData,
            consistencyScore,
            weeklyAdherence: [...habitData.weeklyAdherence, weeklyAdherence].slice(-12) // Keep last 12 weeks
          }
        })
      },

      addPersonalRecord: (exerciseId, weight, reps) => {
        const { progressMetrics } = get()
        const currentPR = progressMetrics.personalRecords[exerciseId]
        
        const estimatedMax = get().calculateOneRepMax(weight, reps, 7) // Assume RPE 7 for PR calc
        
        if (!currentPR || estimatedMax > currentPR.weight) {
          set({
            progressMetrics: {
              ...progressMetrics,
              personalRecords: {
                ...progressMetrics.personalRecords,
                [exerciseId]: { weight: estimatedMax, date: new Date().toISOString().split('T')[0], reps }
              }
            }
          })
        }
      },

      trackProgress: (exerciseId, oneRepMax) => {
        const { progressMetrics } = get()
        const newEntry = {
          exerciseId,
          date: new Date().toISOString().split('T')[0],
          oneRepMax
        }

        set({
          progressMetrics: {
            ...progressMetrics,
            strengthProgression: [...progressMetrics.strengthProgression, newEntry].slice(-100) // Keep last 100 entries
          }
        })
      },

      updateBodyMetrics: (weight, bodyFat) => {
        const { progressMetrics } = get()
        const newEntry = {
          date: new Date().toISOString().split('T')[0],
          weight,
          bodyFat
        }

        set({
          progressMetrics: {
            ...progressMetrics,
            bodyMetrics: [...progressMetrics.bodyMetrics, newEntry].slice(-365) // Keep last year
          }
        })
      },

      getStreakInsights: () => {
        const { habitData } = get()
        return {
          currentStreak: habitData.streak,
          longestStreak: habitData.longestStreak,
          weeklyProgress: habitData.currentWeekWorkouts / habitData.weeklyGoal,
          consistencyScore: habitData.consistencyScore,
          trend: habitData.weeklyAdherence.slice(-4).reduce((sum, rate) => sum + rate, 0) / 4
        }
      },

      getProgressInsights: () => {
        const { progressMetrics } = get()
        const recentProgress = progressMetrics.strengthProgression.slice(-30)
        
        const progressByExercise = recentProgress.reduce((acc, entry) => {
          if (!acc[entry.exerciseId]) acc[entry.exerciseId] = []
          acc[entry.exerciseId].push(entry.oneRepMax)
          return acc
        }, {} as Record<number, number[]>)

        const improvements = Object.entries(progressByExercise).map(([exerciseId, values]) => {
          const improvement = values.length > 1 ? 
            ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0
          return { exerciseId: Number(exerciseId), improvement }
        })

        return {
          totalPRs: Object.keys(progressMetrics.personalRecords).length,
          recentImprovements: improvements.filter(imp => imp.improvement > 0),
          stagnantExercises: improvements.filter(imp => imp.improvement <= 0),
          overallProgress: improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length
        }
      },

      getHabitRecommendations: () => {
        const { habitData } = get()
        const recommendations = []

        if (habitData.streak === 0) {
          recommendations.push("Start building momentum with just one workout this week")
        } else if (habitData.streak < 7) {
          recommendations.push("Great start! Try to maintain consistency for better habit formation")
        } else if (habitData.streak >= 21) {
          recommendations.push("Amazing! You've built a solid habit. Consider increasing intensity")
        }

        if (habitData.consistencyScore < 0.7) {
          recommendations.push("Focus on consistency over intensity - even short workouts count")
        }

        if (habitData.currentWeekWorkouts === 0 && new Date().getDay() > 3) {
          recommendations.push("Mid-week slump? Try a quick 20-minute session to get back on track")
        }

        return recommendations
      },

      // Helper functions
      calculateOneRepMax: (weight: number, reps: number, rpe: number): number => {
        const rpeAdjustment = 1 + (10 - rpe) * 0.025
        return weight * (1 + reps / 30) * rpeAdjustment
      },

      isConsecutiveDay: (lastDate?: string): boolean => {
        if (!lastDate) return false
        const last = new Date(lastDate)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - last.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 2 // Allow for rest days
      },

      reset: () => set({
        currentPlan: null,
        currentWorkout: null,
        habitData: {
          streak: 0,
          longestStreak: 0,
          totalWorkouts: 0,
          weeklyGoal: 4,
          currentWeekWorkouts: 0,
          consistencyScore: 0,
          weeklyAdherence: []
        },
        progressMetrics: {
          personalRecords: {},
          volumeHistory: [],
          strengthProgression: [],
          bodyMetrics: []
        },
        templatePerformance: {}
      })
    }),
    {
      name: 'enhanced-workout-store',
      partialize: (state) => ({
        habitData: state.habitData,
        progressMetrics: state.progressMetrics,
        templatePerformance: state.templatePerformance
      })
    }
  )
)