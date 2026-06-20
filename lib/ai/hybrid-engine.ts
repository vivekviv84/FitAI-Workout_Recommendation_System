interface ExerciseScore {
  exerciseId: number
  score: number
  rationale: string[]
}

interface PlanVariant {
  template: 'PPL' | 'UL_LL' | 'FULL_BODY'
  totalReward: number
  attempts: number
  averageReward: number
}

export class HybridPlanEngine {
  private banditArms: Map<string, PlanVariant> = new Map()
  private epsilon = 0.15

  constructor() {
    // Initialize bandit arms
    this.banditArms.set('PPL', { template: 'PPL', totalReward: 0, attempts: 0, averageReward: 0 })
    this.banditArms.set('UL_LL', { template: 'UL_LL', totalReward: 0, attempts: 0, averageReward: 0 })
    this.banditArms.set('FULL_BODY', { template: 'FULL_BODY', totalReward: 0, attempts: 0, averageReward: 0 })
  }

  // Multi-armed bandit template selection
  selectTemplate(userId: string, historicalData?: any): 'PPL' | 'UL_LL' | 'FULL_BODY' {
    // Add randomness so that regeneration/generation does not yield deterministic results for the same user
    const userSeed = this.hashUserId(userId + Math.random().toString())
    const random = this.seededRandom(userSeed)

    if (random < this.epsilon) {
      // Explore: random selection
      const templates = Array.from(this.banditArms.keys())
      return this.banditArms.get(templates[Math.floor(random * templates.length)])!.template
    } else {
      // Exploit: select best performing arm
      let bestArm: PlanVariant | null = null
      const arms = Array.from(this.banditArms.values())
      for (const arm of arms) {
        if (!bestArm || arm.averageReward > bestArm.averageReward) {
          bestArm = arm
        }
      }
      return bestArm!.template
    }
  }

  // Score exercises using hybrid approach
  scoreExercises(
    exercises: any[],
    userProfile: { goal: string; experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' },
    constraints: any,
    historicalData?: any
  ): ExerciseScore[] {
    return exercises.map(exercise => {
      const ruleScore = this.calculateRuleScore(exercise, userProfile, constraints)
      const mlScore = this.calculateMLScore(exercise, userProfile, historicalData)
      const historyScore = this.calculateHistoryScore(exercise, historicalData)
      
      // Weighted combination with slight random jitter to prevent deterministic generation duplicates
      const jitter = (Math.random() - 0.5) * 0.15
      const finalScore = 0.4 * ruleScore + 0.4 * mlScore + 0.2 * historyScore + jitter
      
      const rationale = this.generateRationale(exercise, userProfile, {
        ruleScore,
        mlScore,
        historyScore,
        finalScore
      })

      return {
        exerciseId: exercise.id,
        score: finalScore,
        rationale
      }
    })
  }

  private calculateRuleScore(exercise: { primary_muscle: string; skill_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; equipment: string; contraindications?: string[] }, userProfile: { goal: string; experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }, constraints: any): number {
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
    const experienceAlignment = {
      'BEGINNER': { 'BEGINNER': 0.3, 'INTERMEDIATE': 0.1, 'ADVANCED': -0.2 },
      'INTERMEDIATE': { 'BEGINNER': 0.1, 'INTERMEDIATE': 0.3, 'ADVANCED': 0.2 },
      'ADVANCED': { 'BEGINNER': -0.1, 'INTERMEDIATE': 0.2, 'ADVANCED': 0.3 }
    }

    const alignmentBonus = experienceAlignment[userProfile.experience]?.[exercise.skill_level] || 0
    score += alignmentBonus

    // Equipment availability
    if (constraints.equipment.includes(exercise.equipment) || exercise.equipment === 'BODYWEIGHT') {
      score += 0.2
    } else {
      score = 0 // Cannot perform exercise
    }

    // Injury constraints
    const hasContraindication = exercise.contraindications?.some((contraindication: string) =>
      constraints.injuries.includes(contraindication)
    )
    if (hasContraindication) {
      score = 0 // Cannot perform exercise
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateMLScore(exercise: any, userProfile: any, historicalData?: any): number {
    // Simplified ML scoring (in production, this would use a trained model)
    let score = 0.5

    // Feature-based scoring
    const features = {
      goalMatch: this.getGoalMatchScore(exercise, userProfile.goal),
      experienceMatch: this.getExperienceMatchScore(exercise, userProfile.experience),
      equipmentPreference: this.getEquipmentPreferenceScore(exercise, userProfile),
      muscleGroupBalance: this.getMuscleGroupBalanceScore(exercise, historicalData),
      timeEfficiency: this.getTimeEfficiencyScore(exercise, userProfile.minutes_per_day)
    }

    // Weighted combination of features
    score = (
      features.goalMatch * 0.3 +
      features.experienceMatch * 0.2 +
      features.equipmentPreference * 0.2 +
      features.muscleGroupBalance * 0.15 +
      features.timeEfficiency * 0.15
    )

    return Math.max(0, Math.min(1, score))
  }

  private calculateHistoryScore(exercise: any, historicalData?: any): number {
    if (!historicalData?.exercisePerformance) return 0.5

    const exerciseHistory = historicalData.exercisePerformance[exercise.id]
    if (!exerciseHistory) return 0.5

    let score = 0.5

    // Adherence boost
    if (exerciseHistory.adherenceRate > 0.8) {
      score += 0.3
    }

    // Progression boost
    if (exerciseHistory.progressionRate > 0) {
      score += 0.2
    }

    // Preference penalty/boost
    if (exerciseHistory.averageRPE > 8.5) {
      score -= 0.1 // Too challenging
    } else if (exerciseHistory.averageRPE < 6) {
      score -= 0.1 // Too easy
    }

    return Math.max(0, Math.min(1, score))
  }

  private getGoalMatchScore(exercise: any, goal: string): number {
    const goalExerciseMapping = {
      'MUSCLE_GAIN': {
        'STRENGTH': 0.9,
        'CARDIO': 0.3,
        'CORE': 0.6,
        'MOBILITY': 0.4
      },
      'STRENGTH': {
        'STRENGTH': 1.0,
        'CARDIO': 0.2,
        'CORE': 0.7,
        'MOBILITY': 0.5
      },
      'FAT_LOSS': {
        'STRENGTH': 0.6,
        'CARDIO': 1.0,
        'CORE': 0.8,
        'MOBILITY': 0.6
      },
      'ENDURANCE': {
        'STRENGTH': 0.4,
        'CARDIO': 1.0,
        'CORE': 0.7,
        'MOBILITY': 0.8
      },
      'GENERAL_FITNESS': {
        'STRENGTH': 0.8,
        'CARDIO': 0.8,
        'CORE': 0.9,
        'MOBILITY': 0.9
      }
    }

  const mapping = goalExerciseMapping[goal as keyof typeof goalExerciseMapping] as Record<string, number> | undefined
  const categoryKey = String(exercise.category)
  return mapping?.[categoryKey] ?? 0.5
  }

  private getExperienceMatchScore(exercise: any, experience: string): number {
    const experienceMatrix = {
      'BEGINNER': { 'BEGINNER': 1.0, 'INTERMEDIATE': 0.6, 'ADVANCED': 0.2 },
      'INTERMEDIATE': { 'BEGINNER': 0.8, 'INTERMEDIATE': 1.0, 'ADVANCED': 0.7 },
      'ADVANCED': { 'BEGINNER': 0.6, 'INTERMEDIATE': 0.9, 'ADVANCED': 1.0 }
    }

    const expMapping = experienceMatrix[experience as keyof typeof experienceMatrix] as Record<string, number> | undefined
    const skillKey = String(exercise.skill_level)
    return expMapping?.[skillKey] ?? 0.5
  }

  private getEquipmentPreferenceScore(exercise: any, userProfile: any): number {
    // Prefer equipment user has more experience with
    return 0.7 // Simplified for now
  }

  private getMuscleGroupBalanceScore(exercise: any, historicalData?: any): number {
    // Boost underworked muscle groups
    return 0.6 // Simplified for now
  }

  private getTimeEfficiencyScore(exercise: any, minutesPerDay: number): number {
    // Prefer compound movements for shorter sessions
    const isCompound = exercise.secondary_muscles?.length > 1
    if (minutesPerDay <= 45 && isCompound) {
      return 0.9
    } else if (minutesPerDay > 60) {
      return 0.8
    }
    return 0.7
  }

  private generateRationale(exercise: any, userProfile: any, scores: any): string[] {
    const rationale = []

    if (scores.ruleScore > 0.7) {
      rationale.push(`matches ${userProfile.goal.toLowerCase()} goal`)
    }

    if (scores.mlScore > 0.7) {
      rationale.push(`high ML prediction score`)
    }

    if (scores.historyScore > 0.7) {
      rationale.push(`good historical performance`)
    }

    if (exercise.skill_level === userProfile.experience) {
      rationale.push(`appropriate for ${userProfile.experience.toLowerCase()} level`)
    }

    return rationale
  }

  // Update bandit arm with reward
  updateBanditArm(template: 'PPL' | 'UL_LL' | 'FULL_BODY', reward: number) {
    const arm = this.banditArms.get(template)
    if (!arm) return

    arm.totalReward += reward
    arm.attempts += 1
    arm.averageReward = arm.totalReward / arm.attempts
  }

  // Calculate reward from adherence and progress
  calculateReward(adherenceRate: number, progressScore: number, satisfactionRating: number): number {
    return 0.4 * adherenceRate + 0.3 * progressScore + 0.3 * (satisfactionRating / 5)
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  getBanditStats() {
    return Array.from(this.banditArms.values()).map(arm => ({
      template: arm.template,
      averageReward: arm.averageReward,
      attempts: arm.attempts,
      confidence: arm.attempts > 0 ? arm.averageReward : 0
    }))
  }
}

export const hybridEngine = new HybridPlanEngine()