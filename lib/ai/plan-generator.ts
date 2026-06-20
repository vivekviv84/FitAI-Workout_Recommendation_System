import { ExerciseTemplate, UserConstraints, PlanDay, filterExercisesByConstraints, scoreExercise, applyProgressiveOverload, balanceWorkoutVolume } from './rules'
import { bandit } from './bandit'

export interface GeneratePlanRequest {
  weeks: number
  templateCandidates: ('PPL' | 'UL_LL' | 'FULL_BODY')[]
  startDate: string
  userId: string
  userProfile: any
}

export interface GeneratedPlan {
  planId: string
  weeks: PlanDay[][]
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  rationale: string
}

// Mock exercise library - in real app this would come from Supabase
const mockExerciseLibrary: ExerciseTemplate[] = [
  {
    id: 1,
    name: 'Barbell Bench Press',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS', 'TRICEPS'],
    movement_pattern: 'PUSH',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'INTERMEDIATE',
    contraindications: ['SHOULDER_IMPINGEMENT'],
    default_sets: 4,
    default_reps: '6-8',
    default_rest_sec: 180
  },
  {
    id: 2,
    name: 'Push-ups',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS', 'TRICEPS'],
    movement_pattern: 'PUSH',
    category: 'STRENGTH',
    equipment: 'BODYWEIGHT',
    skill_level: 'BEGINNER',
    contraindications: ['WRIST_PAIN'],
    default_sets: 3,
    default_reps: '8-12',
    default_rest_sec: 90
  },
  {
    id: 3,
    name: 'Barbell Rows',
    primary_muscle: 'BACK',
    secondary_muscles: ['BICEPS'],
    movement_pattern: 'PULL',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'INTERMEDIATE',
    contraindications: ['LOWER_BACK_PAIN'],
    default_sets: 4,
    default_reps: '6-8',
    default_rest_sec: 180
  },
  {
    id: 4,
    name: 'Squats',
    primary_muscle: 'LEGS',
    secondary_muscles: ['GLUTES', 'CORE'],
    movement_pattern: 'SQUAT',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'INTERMEDIATE',
    contraindications: ['KNEE_PAIN'],
    default_sets: 4,
    default_reps: '8-10',
    default_rest_sec: 180
  },
  {
    id: 5,
    name: 'Bodyweight Squats',
    primary_muscle: 'LEGS',
    secondary_muscles: ['GLUTES'],
    movement_pattern: 'SQUAT',
    category: 'STRENGTH',
    equipment: 'BODYWEIGHT',
    skill_level: 'BEGINNER',
    contraindications: [],
    default_sets: 3,
    default_reps: '12-15',
    default_rest_sec: 60
  },
  {
    id: 6,
    name: 'Overhead Press',
    primary_muscle: 'SHOULDERS',
    secondary_muscles: ['TRICEPS', 'CORE'],
    movement_pattern: 'PUSH',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'INTERMEDIATE',
    contraindications: ['SHOULDER_IMPINGEMENT'],
    default_sets: 3,
    default_reps: '6-8',
    default_rest_sec: 180
  },
  {
    id: 7,
    name: 'Deadlifts',
    primary_muscle: 'BACK',
    secondary_muscles: ['LEGS', 'GLUTES'],
    movement_pattern: 'HINGE',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'ADVANCED',
    contraindications: ['LOWER_BACK_PAIN'],
    default_sets: 3,
    default_reps: '5-6',
    default_rest_sec: 240
  },
  {
    id: 8,
    name: 'Pull-ups',
    primary_muscle: 'BACK',
    secondary_muscles: ['BICEPS'],
    movement_pattern: 'PULL',
    category: 'STRENGTH',
    equipment: 'BODYWEIGHT',
    skill_level: 'INTERMEDIATE',
    contraindications: ['SHOULDER_IMPINGEMENT'],
    default_sets: 3,
    default_reps: '5-8',
    default_rest_sec: 120
  }
]

const workoutTemplates = {
  PPL: {
    pattern: ['Push', 'Pull', 'Legs'],
    daysPerWeek: 6,
    description: 'Push/Pull/Legs split repeated twice per week'
  },
  UL_LL: {
    pattern: ['Upper', 'Lower'],
    daysPerWeek: 4,
    description: 'Upper/Lower split repeated twice per week'
  },
  FULL_BODY: {
    pattern: ['Full Body'],
    daysPerWeek: 3,
    description: 'Full body workouts 3 times per week'
  }
}

export async function generateWorkoutPlan(request: GeneratePlanRequest): Promise<GeneratedPlan> {
  const { weeks, templateCandidates, startDate, userId, userProfile } = request
  
  // 1. Multi-armed bandit selects template
  const selectedTemplate = bandit.selectVariant(userId)
  
  // 2. Filter exercises by user constraints
  const constraints: UserConstraints = {
    injuries: userProfile.constraints?.injuries || [],
    equipment: userProfile.equipment || ['BODYWEIGHT'],
    dislikes: userProfile.dislikes || []
  }
  
  const availableExercises = filterExercisesByConstraints(mockExerciseLibrary, constraints)
  
  // 3. Score and select exercises for each day type
  const template = workoutTemplates[selectedTemplate]
  const weeklyPlan: PlanDay[][] = []
  
  for (let week = 1; week <= weeks; week++) {
    const weekPlan: PlanDay[] = []
    const isDeloadWeek = [4, 8, 12].includes(week)
    
    // Generate days based on template
    const daysInWeek = template.daysPerWeek
    for (let day = 0; day < daysInWeek; day++) {
      const dayLabel = template.pattern[day % template.pattern.length]
      const dayDate = new Date(startDate)
      dayDate.setDate(dayDate.getDate() + (week - 1) * 7 + day)
      
      // Select exercises for this day
      const dayExercises = selectExercisesForDay(
        availableExercises,
        dayLabel,
        userProfile,
        isDeloadWeek
      )
      
      // Apply progressive overload
      const progressedExercises = applyProgressiveOverload(dayExercises, week)
      const balancedExercises = balanceWorkoutVolume(progressedExercises)
      
      weekPlan.push({
        date: dayDate.toISOString().split('T')[0],
        label: dayLabel,
        deload: isDeloadWeek,
        exercises: balancedExercises
      })
    }
    
    weeklyPlan.push(weekPlan)
  }
  
  // Generate rationale
  const rationale = generateRationale(selectedTemplate, userProfile, constraints)
  
  return {
    planId: crypto.randomUUID(),
    weeks: weeklyPlan,
    template: selectedTemplate,
    rationale
  }
}

function selectExercisesForDay(
  exercises: ExerciseTemplate[],
  dayType: string,
  userProfile: any,
  isDeloadWeek: boolean
): any[] {
  const muscleGroupMapping = {
    'Push': ['CHEST', 'SHOULDERS', 'TRICEPS'],
    'Pull': ['BACK', 'BICEPS'],
    'Legs': ['LEGS', 'GLUTES'],
    'Upper': ['CHEST', 'BACK', 'SHOULDERS', 'ARMS'],
    'Lower': ['LEGS', 'GLUTES'],
    'Full Body': ['CHEST', 'BACK', 'LEGS', 'SHOULDERS']
  }
  
  const targetMuscles = muscleGroupMapping[dayType as keyof typeof muscleGroupMapping] || []
  
  // Filter exercises for target muscles
  const relevantExercises = exercises.filter(ex => 
    targetMuscles.includes(ex.primary_muscle) ||
    ex.secondary_muscles.some(muscle => targetMuscles.includes(muscle))
  )
  
  // Score and select top exercises
  const scoredExercises = relevantExercises
    .map(ex => ({
      ...ex,
      score: scoreExercise(ex, userProfile)
    }))
    .sort((a, b) => b.score - a.score)
  
  // Select 4-6 exercises based on experience and day type
  const exerciseCount = userProfile.experience === 'BEGINNER' ? 4 : 
                       userProfile.experience === 'INTERMEDIATE' ? 5 : 6
  
  return scoredExercises.slice(0, exerciseCount).map(ex => ({
    id: ex.id,
    name: ex.name,
    sets: isDeloadWeek ? Math.max(2, Math.floor(ex.default_sets * 0.7)) : ex.default_sets,
    reps: ex.default_reps,
    target_rpe: isDeloadWeek ? 6 : 7,
    rest_sec: ex.default_rest_sec,
    tempo: '2-0-2'
  }))
}

function generateRationale(
  template: 'PPL' | 'UL_LL' | 'FULL_BODY',
  userProfile: any,
  constraints: UserConstraints
): string {
  const reasons = []
  
  reasons.push(`Selected ${template} template via intelligent selection`)
  
  if (userProfile.goal) {
    reasons.push(`optimized for ${userProfile.goal.toLowerCase().replace('_', ' ')}`)
  }
  
  if (userProfile.experience) {
    reasons.push(`adapted for ${userProfile.experience.toLowerCase()} level`)
  }
  
  if (constraints.injuries.length > 0) {
    reasons.push(`modified to avoid ${constraints.injuries.length} injury constraint(s)`)
  }
  
  if (constraints.equipment.length > 0) {
    reasons.push(`using available equipment: ${constraints.equipment.join(', ').toLowerCase()}`)
  }
  
  return reasons.join(', ')
}

export function generatePlanDiff(oldPlan: GeneratedPlan, newPlan: GeneratedPlan) {
  const changes = []
  
  if (oldPlan.template !== newPlan.template) {
    changes.push(`Changed template from ${oldPlan.template} to ${newPlan.template}`)
  }
  
  // Compare exercises (simplified)
  const oldExerciseIds = new Set()
  const newExerciseIds = new Set()
  
  oldPlan.weeks.flat().forEach(day => 
    day.exercises.forEach(ex => oldExerciseIds.add(ex.id))
  )
  
  newPlan.weeks.flat().forEach(day => 
    day.exercises.forEach(ex => newExerciseIds.add(ex.id))
  )
  
  const addedCount = Array.from(newExerciseIds).filter(id => !oldExerciseIds.has(id)).length
  const removedCount = Array.from(oldExerciseIds).filter(id => !newExerciseIds.has(id)).length
  
  if (addedCount > 0) changes.push(`Added ${addedCount} new exercises`)
  if (removedCount > 0) changes.push(`Removed ${removedCount} exercises`)
  
  return {
    changes,
    rationale: newPlan.rationale
  }
}