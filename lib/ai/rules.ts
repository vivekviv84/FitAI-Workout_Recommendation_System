export interface ExerciseTemplate {
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

export interface UserConstraints {
  injuries: string[]
  equipment: string[]
  dislikes: number[]
}

export interface PlanDay {
  date: string
  label: string
  deload: boolean
  exercises: Array<{
    id: number
    name: string
    sets: number
    reps: string
    target_rpe: number
    rest_sec: number
    tempo?: string
  }>
}

export function applyProgressiveOverload(exercises: any[], weekIndex: number): any[] {
  // Deload weeks (4, 8, 12)
  if ([4, 8, 12].includes(weekIndex)) {
    return exercises.map(ex => ({
      ...ex,
      sets: Math.max(2, Math.floor(ex.sets * 0.7)),
      target_rpe: Math.max(5, ex.target_rpe - 1),
      deload: true
    }))
  }

  // Progressive overload
  return exercises.map(ex => {
    let newReps = ex.reps
    let newSets = ex.sets
    
    // Increase reps range or sets based on week
    if (weekIndex % 3 === 1) {
      // Every 3rd week, add a set
      newSets = Math.min(6, ex.sets + 1)
    } else {
      // Increase rep range
      if (ex.reps.includes('6-8')) {
        newReps = '7-9'
      } else if (ex.reps.includes('8-10')) {
        newReps = '9-11'
      } else if (ex.reps.includes('10-12')) {
        newReps = '11-13'
      }
    }

    return {
      ...ex,
      sets: newSets,
      reps: newReps,
      target_rpe: Math.min(9, ex.target_rpe + 0.5)
    }
  })
}

export function filterExercisesByConstraints(
  exercises: ExerciseTemplate[],
  constraints: UserConstraints
): ExerciseTemplate[] {
  return exercises.filter(exercise => {
    // Filter out exercises with contraindicated injuries
    const hasContraindication = exercise.contraindications.some(contraindication =>
      constraints.injuries.includes(contraindication)
    )
    
    // Filter out exercises requiring unavailable equipment
    const hasRequiredEquipment = constraints.equipment.includes(exercise.equipment) ||
      exercise.equipment === 'BODYWEIGHT'
    
    // Filter out disliked exercises
    const isDisliked = constraints.dislikes.includes(exercise.id)
    
    return !hasContraindication && hasRequiredEquipment && !isDisliked
  })
}

export function scoreExercise(
  exercise: ExerciseTemplate,
  userProfile: any,
  historicalPerformance: any = {}
): number {
  let score = 0.5 // Base score

  // Goal alignment
  const goalMuscleMapping = {
    'MUSCLE_GAIN': ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS'],
    'STRENGTH': ['CHEST', 'BACK', 'LEGS'],
    'FAT_LOSS': ['LEGS', 'CORE', 'FULL_BODY'],
    'ENDURANCE': ['CARDIO', 'CORE'],
    'GENERAL_FITNESS': ['FULL_BODY', 'CORE']
  }

  const goalMuscles = goalMuscleMapping[userProfile.goal as keyof typeof goalMuscleMapping] || []
  if (goalMuscles.includes(exercise.primary_muscle)) {
    score += 0.3
  }

  // Experience level alignment
  const experienceMapping = {
    'BEGINNER': 0.8,
    'INTERMEDIATE': 0.9,
    'ADVANCED': 1.0
  }
  
  if (exercise.skill_level === userProfile.experience) {
    score += 0.2
  }

  // Historical performance boost
  const exerciseId = exercise.id.toString()
  if (historicalPerformance[exerciseId]) {
    const performance = historicalPerformance[exerciseId]
    if (performance.adherence > 0.8) score += 0.2
    if (performance.progression > 0) score += 0.1
  }

  return Math.min(1.0, Math.max(0.0, score))
}

export function balanceWorkoutVolume(exercises: any[]): any[] {
  const muscleGroups = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE']
  const volumeByMuscle: Record<string, number> = {}
  
  // Calculate current volume
  exercises.forEach(ex => {
    const muscle = ex.primary_muscle
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (ex.sets * 8) // Approximate volume
  })

  // Balance push/pull ratio
  const pushVolume = (volumeByMuscle['CHEST'] || 0) + (volumeByMuscle['SHOULDERS'] || 0)
  const pullVolume = (volumeByMuscle['BACK'] || 0)
  
  if (Math.abs(pushVolume - pullVolume) > pushVolume * 0.2) {
    // Adjust if imbalance > 20%
    // Implementation would rebalance exercises
  }

  return exercises
}