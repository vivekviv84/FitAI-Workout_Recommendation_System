export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'COACH' | 'ADMIN'
  created_at: string
}

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
  constraints: {
    injuries: string[]
    equipment: string[]
  } | null
  dislikes: number[] | null
  updated_at: string
}

export interface Exercise {
  id: number
  name: string
  primary_muscle: string
  secondary_muscles: string[]
  movement_pattern: string
  category: 'STRENGTH' | 'CARDIO' | 'CORE' | 'MOBILITY'
  equipment: string
  skill_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  contraindications: string[]
  default_sets: number
  default_reps: string
  default_rest_sec: number
}

export interface WorkoutExercise {
  id: number
  name: string
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
  }>
}

export interface WorkoutDay {
  id: string
  date: string
  label: string
  deload: boolean
  exercises: WorkoutExercise[]
  completed?: boolean
}

export interface WorkoutPlan {
  id: string
  user_id: string
  weeks: number
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  start_date: string
  weeklyPlan: WorkoutDay[][]
  rationale: string
  created_at: string
}