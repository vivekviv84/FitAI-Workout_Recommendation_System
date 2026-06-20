import { HybridPlanEngine } from './hybrid-engine'
import { ExerciseTemplate, UserConstraints, PlanDay, filterExercisesByConstraints } from './rules'
import db from '../db'
import { fetchExercisesForMuscle } from '../wger'

interface UserProfile {
  goal: string
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  days_per_week: number
  minutes_per_day: number
  constraints: {
    injuries: string[]
    equipment: string[]
  }
  dislikes: number[]
}

interface EnhancedGeneratePlanRequest {
  weeks: number
  templateCandidates: ('PPL' | 'UL_LL' | 'FULL_BODY')[]
  startDate: string
  userId: string
  userProfile: UserProfile
  historicalData?: any
  preferences?: {
    priorityMuscles?: string[]
    avoidMuscles?: string[]
    sessionDuration?: number
    intensityPreference?: 'LOW' | 'MODERATE' | 'HIGH'
  }
}

interface EnhancedGeneratedPlan {
  planId: string
  weeks: PlanDay[][]
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  rationale: string
  confidence: number
  expectedAdherence: number
  volumeProgression: number[]
  deloadWeeks: number[]
  balanceScore: number
}

// Enhanced exercise library with more sophisticated categorization
const rawExercises = [
  // Chest Exercises (12)
  { name: 'Barbell Bench Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
  { name: 'Dumbbell Bench Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
  { name: 'Push-ups', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '8-15', default_rest_sec: 90 },
  { name: 'Incline Dumbbell Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
  { name: 'Cable Flyes', primary_muscle: 'CHEST', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
  { name: 'Chest Dips', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '6-10', default_rest_sec: 120 },
  { name: 'Decline Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
  { name: 'Machine Chest Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Incline Barbell Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 4, default_reps: '6-8', default_rest_sec: 150 },
  { name: 'Pec Deck', primary_muscle: 'CHEST', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 75 },
  { name: 'Decline Dumbbell Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Svend Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

  // Back Exercises (13)
  { name: 'Barbell Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
  { name: 'Pull-ups', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_ISSUES', default_sets: 3, default_reps: '6-12', default_rest_sec: 120 },
  { name: 'Lat Pulldowns', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Deadlifts', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS,QUADS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '3-6', default_rest_sec: 300 },
  { name: 'Dumbbell Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'T-Bar Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
  { name: 'Seated Cable Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Hyper-extensions', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
  { name: 'Chin-ups', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '6-10', default_rest_sec: 90 },
  { name: 'Renegade Rows', primary_muscle: 'BACK', secondary_muscles: 'CORE,SHOULDERS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Lat Pullover', primary_muscle: 'BACK', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Single-Arm Lat Pulldown', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Good Mornings', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },

  // Legs Exercises (19)
  { name: 'Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
  { name: 'Leg Press', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
  { name: 'Leg Curls', primary_muscle: 'HAMSTRINGS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Romanian Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '6-8', default_rest_sec: 120 },
  { name: 'Leg Extensions', primary_muscle: 'QUADS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
  { name: 'Bulgarian Split Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 90 },
  { name: 'Calf Raises', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '15-20', default_rest_sec: 60 },
  { name: 'Goblet Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,CORE', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Lunges', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Box Jumps', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,CALVES', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN,ANKLE_INJURY', default_sets: 3, default_reps: '5-8', default_rest_sec: 90 },
  { name: 'Hip Thrusts', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
  { name: 'Step-ups', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Sumo Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'QUADS,GLUTES,BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '5-6', default_rest_sec: 180 },
  { name: 'Hack Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
  { name: 'Box Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'SQUAT', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 150 },
  { name: 'Jefferson Curls', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'BACK', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 2, default_reps: '8-10', default_rest_sec: 90 },
  { name: 'Stiff-Legged Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,BACK', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '6-8', default_rest_sec: 120 },
  { name: 'Glute Bridges', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
  { name: 'Wall Sits', primary_muscle: 'QUADS', secondary_muscles: 'LEGS', movement_pattern: 'ISOMETRIC', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '30-60s', default_rest_sec: 60 },

  // Shoulders Exercises (12)
  { name: 'Overhead Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '6-8', default_rest_sec: 180 },
  { name: 'Dumbbell Shoulder Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
  { name: 'Lateral Raises', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 60 },
  { name: 'Face Pulls', primary_muscle: 'SHOULDERS', secondary_muscles: 'REAR_DELTS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
  { name: 'Front Raises', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Rear Delt Flyes', primary_muscle: 'SHOULDERS', secondary_muscles: 'BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
  { name: 'Arnold Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Upright Rows', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRAPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Shrugs', primary_muscle: 'SHOULDERS', secondary_muscles: 'BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
  { name: 'Push Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'LEGS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '5-6', default_rest_sec: 180 },
  { name: 'Behind the Neck Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
  { name: 'Car driver shoulder raise', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'RAISE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

  // Arms Exercises (15)
  { name: 'Barbell Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Dumbbell Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Hammer Curls', primary_muscle: 'BICEPS', secondary_muscles: 'FOREARMS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
  { name: 'Preacher Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'ELBOW_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Concentration Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Tricep Dips', primary_muscle: 'TRICEPS', secondary_muscles: 'CHEST,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_PAIN', default_sets: 3, default_reps: '6-12', default_rest_sec: 120 },
  { name: 'Rope Pushdowns', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 60 },
  { name: 'Skull Crushers', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'ELBOW_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Overhead Tricep Extension', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
  { name: 'Close-Grip Bench Press', primary_muscle: 'TRICEPS', secondary_muscles: 'CHEST,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 4, default_reps: '6-8', default_rest_sec: 120 },
  { name: 'Incline Dumbbell Curl', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
  { name: 'Reverse Grip Barbell Curl', primary_muscle: 'BICEPS', secondary_muscles: 'FOREARMS', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Spider Curl', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
  { name: 'Lying Tricep Extensions', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
  { name: 'Single Arm Dumbbell Kickbacks', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

  // Core Exercises (12)
  { name: 'Planks', primary_muscle: 'CORE', secondary_muscles: 'SHOULDERS,BACK', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-60s', default_rest_sec: 60 },
  { name: 'Cable Woodchops', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'PULL', category: 'CORE', equipment: 'CABLE', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Hanging Leg Raises', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'PULL', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 75 },
  { name: 'Russian Twists', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 45 },
  { name: 'Ab Wheel Rollouts', primary_muscle: 'CORE', secondary_muscles: 'BACK,SHOULDERS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 90 },
  { name: 'Dead Bug', primary_muscle: 'CORE', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 45 },
  { name: 'Bird Dog', primary_muscle: 'CORE', secondary_muscles: 'BACK', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 45 },
  { name: 'Bicycle Crunches', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'NECK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 45 },
  { name: 'V-ups', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
  { name: 'Windshield Wipers', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10 reps', default_rest_sec: 90 },
  { name: 'Flutter Kicks', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
  { name: 'Hollow Body Hold', primary_muscle: 'CORE', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 60 },

  // Cardio Exercises (10)
  { name: 'Burpees', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR,CHEST', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN,WRIST_PAIN', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
  { name: 'Jumping Jacks', primary_muscle: 'LEGS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
  { name: 'High Knees', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
  { name: 'Kettlebell Swings', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 60 },
  { name: 'Shadow Boxing', primary_muscle: 'SHOULDERS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '2-3 mins', default_rest_sec: 60 },
  { name: 'Jump Rope', primary_muscle: 'LEGS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'ANKLE_INJURY', default_sets: 3, default_reps: '1-2 mins', default_rest_sec: 60 },
  { name: 'Mountain Climbers', primary_muscle: 'CORE', secondary_muscles: 'CARDIOVASCULAR,SHOULDERS', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '20-30', default_rest_sec: 60 },
  { name: 'Rowing Machine Interval', primary_muscle: 'BACK', secondary_muscles: 'CARDIOVASCULAR,LEGS', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: 'LOWER_BACK_PAIN', default_sets: 4, default_reps: '500m sprint', default_rest_sec: 120 },
  { name: 'Stationary Cycling', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 1, default_reps: '10 mins HIIT', default_rest_sec: 60 },
  { name: 'Elliptical training session', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 1, default_reps: '15 mins', default_rest_sec: 0 },

  // Mobility & Stretching (13)
  { name: 'World\'s Greatest Stretch', primary_muscle: 'LEGS', secondary_muscles: 'SHOULDERS,BACK', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '5-6 per side', default_rest_sec: 45 },
  { name: 'Cat-Cow Stretch', primary_muscle: 'BACK', secondary_muscles: 'CORE', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
  { name: 'Deep Squat Hold', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HIPS', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 2, default_reps: '30-45s', default_rest_sec: 30 },
  { name: 'Shoulder Dislocations', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'RESISTANCE_BANDS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
  { name: 'Thoracic Extensions', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
  { name: 'Cobra Stretch', primary_muscle: 'BACK', secondary_muscles: 'CORE', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30-45s', default_rest_sec: 30 },
  { name: 'Child\'s Pose', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '45-60s', default_rest_sec: 30 },
  { name: 'Hamstring Stretch', primary_muscle: 'HAMSTRINGS', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30s per side', default_rest_sec: 30 },
  { name: 'Calf Stretch', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30s per side', default_rest_sec: 30 },
  { name: 'Wrist Mobility Curls', primary_muscle: 'FOREARMS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 2, default_reps: '15-20 reps', default_rest_sec: 30 },
  { name: 'Pigeon Stretch', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 2, default_reps: '45s per side', default_rest_sec: 30 },
  { name: 'Thread the Needle', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '8-10 per side', default_rest_sec: 30 },
  { name: 'Ankle Dorsiflexion stretch', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '12-15 reps', default_rest_sec: 30 }
];

const enhancedExerciseLibrary: ExerciseTemplate[] = rawExercises.map((ex, idx) => ({
  id: idx + 1,
  name: ex.name,
  primary_muscle: ex.primary_muscle,
  secondary_muscles: ex.secondary_muscles ? ex.secondary_muscles.split(',').map(s => s.trim()).filter(Boolean) : [],
  movement_pattern: ex.movement_pattern,
  category: ex.category as any,
  equipment: ex.equipment,
  skill_level: ex.skill_level as any,
  contraindications: ex.contraindications ? ex.contraindications.split(',').map(s => s.trim()).filter(Boolean) : [],
  default_sets: ex.default_sets,
  default_reps: ex.default_reps,
  default_rest_sec: ex.default_rest_sec
}));

const workoutTemplates = {
  PPL: {
    pattern: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
    daysPerWeek: 6,
    description: 'Push/Pull/Legs split with high frequency',
    volumeDistribution: { 'CHEST': 0.25, 'BACK': 0.25, 'LEGS': 0.3, 'SHOULDERS': 0.15, 'ARMS': 0.05 }
  },
  UL_LL: {
    pattern: ['Upper', 'Lower', 'Upper', 'Lower'],
    daysPerWeek: 4,
    description: 'Upper/Lower split with balanced frequency',
    volumeDistribution: { 'CHEST': 0.2, 'BACK': 0.2, 'LEGS': 0.35, 'SHOULDERS': 0.15, 'ARMS': 0.1 }
  },
  FULL_BODY: {
    pattern: ['Full Body', 'Full Body', 'Full Body'],
    daysPerWeek: 3,
    description: 'Full body sessions with compound focus',
    volumeDistribution: { 'CHEST': 0.2, 'BACK': 0.2, 'LEGS': 0.4, 'SHOULDERS': 0.1, 'ARMS': 0.05, 'CORE': 0.05 }
  }
}

function seedDbExercisesIfEmpty() {
  try {
    const countRes = db.prepare('SELECT COUNT(*) as count FROM exercises').get() as any
    const count = countRes ? countRes.count : 0
    if (count >= 100) return

    console.log('Seeding production-grade exercises into DB...')
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO exercises (
        name, primary_muscle, secondary_muscles, movement_pattern, category, equipment, skill_level, contraindications, default_sets, default_reps, default_rest_sec
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const ex of rawExercises) {
      stmt.run(
        ex.name,
        ex.primary_muscle,
        ex.secondary_muscles,
        ex.movement_pattern,
        ex.category,
        ex.equipment,
        ex.skill_level,
        ex.contraindications,
        ex.default_sets,
        ex.default_reps,
        ex.default_rest_sec
      )
    }
  } catch (err) {
    console.error('Error seeding exercises into db:', err)
  }
}

function getExerciseLibraryFromDb(): ExerciseTemplate[] {
  try {
    const dbExercises = db.prepare('SELECT * FROM exercises').all() as any[]
    return dbExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      primary_muscle: ex.primary_muscle,
      secondary_muscles: ex.secondary_muscles ? ex.secondary_muscles.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      movement_pattern: ex.movement_pattern,
      category: ex.category as any,
      equipment: ex.equipment,
      skill_level: ex.skill_level as any,
      contraindications: ex.contraindications ? ex.contraindications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      default_sets: ex.default_sets || 3,
      default_reps: ex.default_reps || '8-12',
      default_rest_sec: ex.default_rest_sec || 90
    }))
  } catch (err) {
    console.error('Error fetching exercise library from db:', err)
    return []
  }
}

export class EnhancedPlanGenerator {
  private engine: HybridPlanEngine
  private exerciseLibrary: ExerciseTemplate[] = []

  constructor() {
    this.engine = new HybridPlanEngine()
  }

  async generateEnhancedPlan(request: EnhancedGeneratePlanRequest): Promise<EnhancedGeneratedPlan> {
    const { weeks, userId, userProfile, historicalData, preferences } = request

    // 1. Select template using multi-armed bandit
    const selectedTemplate = this.engine.selectTemplate(userId, historicalData)
    const template = workoutTemplates[selectedTemplate]

    // Ensure database contains core exercises and trigger muscle specific fetches if count is low
    seedDbExercisesIfEmpty()

    const muscleGroupMappingForSync = {
      'Push': ['CHEST', 'SHOULDERS', 'TRICEPS'],
      'Pull': ['BACK', 'BICEPS', 'RHOMBOIDS'],
      'Legs': ['LEGS', 'GLUTES', 'HAMSTRINGS'],
      'Upper': ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'BICEPS', 'TRICEPS'],
      'Lower': ['LEGS', 'GLUTES', 'HAMSTRINGS'],
      'Full Body': ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'CORE']
    }

    const muscleTokenToWgerIdsLocal: Record<string, number[]> = {
      'CHEST': [13, 3],
      'BACK': [4, 15],
      'QUADS': [10],
      'HAMSTRINGS': [11],
      'LEGS': [7, 8, 9, 10, 11],
      'SHOULDERS': [2],
      'BICEPS': [1],
      'TRICEPS': [5],
      'CORE': [6, 14, 12]
    }

    const musclesToCheck = new Set<string>()
    template.pattern.forEach(dayLabel => {
      const targetMuscles = muscleGroupMappingForSync[dayLabel as keyof typeof muscleGroupMappingForSync] || []
      targetMuscles.forEach(m => {
        const mapped = m.toUpperCase()
        if (mapped === 'ARMS') {
          musclesToCheck.add('BICEPS')
          musclesToCheck.add('TRICEPS')
        } else if (mapped === 'RHOMBOIDS') {
          musclesToCheck.add('BACK')
        } else if (mapped === 'GLUTES') {
          musclesToCheck.add('LEGS')
        } else if (muscleTokenToWgerIdsLocal[mapped]) {
          musclesToCheck.add(mapped)
        }
      })
    })

    for (const muscle of musclesToCheck) {
      try {
        const countRes = db.prepare('SELECT COUNT(*) as count FROM exercises WHERE primary_muscle = ?').get(muscle) as any
        const count = countRes ? countRes.count : 0
        if (count < 4) {
          console.log(`Low exercise count for muscle ${muscle} (${count} found). Fetching dynamically from Wger...`)
          await fetchExercisesForMuscle(muscle)
        }
      } catch (err) {
        console.error(`Error checking/fetching exercises for muscle ${muscle}:`, err)
      }
    }

    // Now reload exerciseLibrary from DB
    this.exerciseLibrary = getExerciseLibraryFromDb()

    // 2. Filter exercises by constraints
    const constraints: UserConstraints = {
      injuries: userProfile.constraints?.injuries || [],
      equipment: userProfile.constraints?.equipment || ['BODYWEIGHT'],
      dislikes: userProfile.dislikes || []
    }
    
    const availableExercises = filterExercisesByConstraints(this.exerciseLibrary, constraints)
    
    // 3. Score exercises using hybrid engine
    const scoredExercises = this.engine.scoreExercises(
      availableExercises,
      userProfile,
      constraints,
      historicalData
    )

    // 4. Generate weekly plan with progressive overload
    const weeklyPlan: PlanDay[][] = []
    const volumeProgression: number[] = []
    const deloadWeeks = [4, 8, 12].filter(week => week <= weeks)

    for (let week = 1; week <= weeks; week++) {
      const isDeloadWeek = deloadWeeks.includes(week)
      const weekPlan: PlanDay[] = []
      let weeklyVolume = 0

      // Generate days based on template
      const daysInWeek = Math.min(template.daysPerWeek, userProfile.days_per_week || 4)
      
      for (let day = 0; day < daysInWeek; day++) {
        const dayLabel = template.pattern[day % template.pattern.length]
        const dayDate = new Date(request.startDate)
        dayDate.setDate(dayDate.getDate() + (week - 1) * 7 + day)

        // Select exercises for this day
        const dayExercises = this.selectExercisesForDay(
          scoredExercises,
          dayLabel,
          userProfile,
          isDeloadWeek,
          week,
          preferences
        )

        // Calculate volume for this day
        const dayVolume = dayExercises.reduce((vol, ex) => vol + (ex.sets * 10), 0) // Simplified volume calc
        weeklyVolume += dayVolume

        weekPlan.push({
          date: dayDate.toISOString().split('T')[0],
          label: dayLabel,
          deload: isDeloadWeek,
          exercises: dayExercises
        })
      }

      volumeProgression.push(weeklyVolume)
      weeklyPlan.push(weekPlan)
    }

    // 5. Calculate plan metrics
    const confidence = this.calculatePlanConfidence(scoredExercises, userProfile)
    const expectedAdherence = this.predictAdherence(userProfile, selectedTemplate, historicalData)
    const balanceScore = this.calculateBalanceScore(weeklyPlan, template.volumeDistribution)

    // 6. Generate comprehensive rationale
    const rationale = this.generateComprehensiveRationale(
      selectedTemplate,
      userProfile,
      constraints,
      confidence,
      expectedAdherence,
      balanceScore
    )

    return {
      planId: crypto.randomUUID(),
      weeks: weeklyPlan,
      template: selectedTemplate,
      rationale,
      confidence,
      expectedAdherence,
      volumeProgression,
      deloadWeeks,
      balanceScore
    }
  }

  private selectExercisesForDay(
    scoredExercises: any[],
    dayType: string,
    userProfile: any,
    isDeloadWeek: boolean,
    weekNumber: number,
    preferences?: any
  ): any[] {
    const muscleGroupMapping = {
      'Push': ['CHEST', 'SHOULDERS', 'TRICEPS'],
      'Pull': ['BACK', 'BICEPS', 'RHOMBOIDS'],
      'Legs': ['LEGS', 'GLUTES', 'HAMSTRINGS'],
      'Upper': ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'BICEPS', 'TRICEPS'],
      'Lower': ['LEGS', 'GLUTES', 'HAMSTRINGS'],
      'Full Body': ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'CORE']
    }

    const targetMuscles = muscleGroupMapping[dayType as keyof typeof muscleGroupMapping] || []
    
    // Filter for relevant exercises
    const relevantExercises = scoredExercises.filter(ex => {
      const exercise = this.exerciseLibrary.find(e => e.id === ex.exerciseId)
      if (!exercise) return false
      return (
        targetMuscles.includes(exercise.primary_muscle) ||
        exercise.secondary_muscles.some(muscle => targetMuscles.includes(muscle))
      )
    })

    // Sort by score and select appropriate number
    const sortedExercises = relevantExercises.sort((a, b) => b.score - a.score)
    
    // Determine exercise count based on experience and session duration
    let exerciseCount = 4
    if (userProfile.experience === 'BEGINNER') exerciseCount = 3
    else if (userProfile.experience === 'ADVANCED' && userProfile.minutes_per_day > 60) exerciseCount = 6

    const selectedExercises = sortedExercises.slice(0, exerciseCount)

    // Apply progressive overload and deload logic
    return selectedExercises.map(ex => {
      const baseExercise = this.exerciseLibrary.find(e => e.id === ex.exerciseId)!
      
      let sets = baseExercise.default_sets
      let reps = baseExercise.default_reps
      let targetRPE = 7

      if (isDeloadWeek) {
        sets = Math.max(2, Math.floor(sets * 0.7))
        targetRPE = 6
      } else {
        // Progressive overload
        const progressionFactor = Math.floor((weekNumber - 1) / 4)
        sets = Math.min(6, sets + progressionFactor)
        targetRPE = Math.min(9, 7 + progressionFactor * 0.5)
        
        // Adjust reps based on progression
        if (weekNumber > 4 && reps.includes('6-8')) {
          reps = '7-9'
        } else if (weekNumber > 8 && reps.includes('7-9')) {
          reps = '8-10'
        }
      }

      return {
        id: ex.exerciseId,
        name: baseExercise.name,
        sets,
        reps,
        target_rpe: targetRPE,
        rest_sec: baseExercise.default_rest_sec,
        tempo: '2-0-2',
        rationale: ex.rationale
      }
    })
  }

  private calculatePlanConfidence(scoredExercises: any[], userProfile: UserProfile): number {
    const avgScore = scoredExercises.reduce((sum, ex) => sum + ex.score, 0) / scoredExercises.length
    const constraintCount = (userProfile.constraints?.injuries?.length || 0) + 
                           (userProfile.dislikes?.length || 0)
    
    // Higher confidence with higher scores and fewer constraints
    return Math.max(0.5, Math.min(1.0, avgScore - (constraintCount * 0.05)))
  }

  private predictAdherence(userProfile: UserProfile, template: string, historicalData?: any): number {
    let baseAdherence = 0.75

    // Experience factor
    const experienceBonus = {
      'BEGINNER': 0.0,
      'INTERMEDIATE': 0.05,
      'ADVANCED': 0.1
    }
    baseAdherence += experienceBonus[userProfile.experience] || 0

    // Schedule compatibility
    const templateDays = workoutTemplates[template as keyof typeof workoutTemplates].daysPerWeek
    if (templateDays <= userProfile.days_per_week) {
      baseAdherence += 0.1
    } else {
      baseAdherence -= 0.2
    }

    // Historical data bonus
    if (historicalData?.averageAdherence) {
      baseAdherence = (baseAdherence + historicalData.averageAdherence) / 2
    }

    return Math.max(0.4, Math.min(0.95, baseAdherence))
  }

  private calculateBalanceScore(weeklyPlan: PlanDay[][], volumeDistribution: any): number {
    // Calculate actual volume distribution and compare to target
    const actualDistribution: Record<string, number> = {}
    let totalVolume = 0

    weeklyPlan.flat().forEach(day => {
      day.exercises.forEach(ex => {
        const exercise = this.exerciseLibrary.find(e => e.id === ex.id)
        if (exercise) {
          const muscle = exercise.primary_muscle
          const volume = ex.sets * 10 // Simplified volume calculation
          actualDistribution[muscle] = (actualDistribution[muscle] || 0) + volume
          totalVolume += volume
        }
      })
    })

    // Normalize and compare to target
    let balanceScore = 1.0
    Object.entries(volumeDistribution).forEach(([muscle, targetRatio]) => {
      const actualRatio = (actualDistribution[muscle] || 0) / totalVolume
      const difference = Math.abs(actualRatio - (targetRatio as number))
      balanceScore -= difference * 0.5
    })

    return Math.max(0.0, Math.min(1.0, balanceScore))
  }

  private generateComprehensiveRationale(
    template: string,
    userProfile: UserProfile,
    constraints: UserConstraints,
    confidence: number,
    expectedAdherence: number,
    balanceScore: number
  ): string {
    const reasons = []

    reasons.push(`Selected ${template} template via multi-armed bandit optimization`)
    
    if (userProfile.goal) {
      reasons.push(`optimized for ${userProfile.goal.toLowerCase().replace('_', ' ')} goals`)
    }

    if (userProfile.experience) {
      reasons.push(`calibrated for ${userProfile.experience.toLowerCase()} experience level`)
    }

    if (constraints.injuries.length > 0) {
      reasons.push(`adapted around ${constraints.injuries.length} injury constraint(s)`)
    }

    if (confidence > 0.8) {
      reasons.push(`high confidence match (${Math.round(confidence * 100)}%)`)
    }

    if (expectedAdherence > 0.8) {
      reasons.push(`predicted ${Math.round(expectedAdherence * 100)}% adherence rate`)
    }

    if (balanceScore > 0.8) {
      reasons.push(`excellent muscle group balance (${Math.round(balanceScore * 100)}%)`)
    }

    return reasons.join(', ')
  }

  // Update bandit with actual performance
  updateBanditPerformance(
    template: 'PPL' | 'UL_LL' | 'FULL_BODY',
    adherenceRate: number,
    progressScore: number,
    satisfactionRating: number
  ) {
    const reward = this.engine.calculateReward(adherenceRate, progressScore, satisfactionRating)
    this.engine.updateBanditArm(template, reward)
  }

  getBanditInsights() {
    return this.engine.getBanditStats()
  }
}

export const enhancedPlanGenerator = new EnhancedPlanGenerator()