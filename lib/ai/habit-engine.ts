interface HabitInsight {
  type: 'streak' | 'consistency' | 'timing' | 'motivation' | 'recovery'
  priority: 'high' | 'medium' | 'low'
  message: string
  actionable: string
  data?: any
}

interface HabitNudge {
  id: string
  type: 'reminder' | 'motivation' | 'celebration' | 'course_correction'
  title: string
  message: string
  cta?: string
  scheduledFor: string
  delivered: boolean
}

export class HabitEngine {
  // Analyze user behavior and provide insights
  generateHabitInsights(habitData: any, progressData: any): HabitInsight[] {
    const insights: HabitInsight[] = []

    // Streak analysis
    if (habitData.streak === 0) {
      insights.push({
        type: 'streak',
        priority: 'high',
        message: 'Ready to restart your fitness journey?',
        actionable: 'Schedule a quick 20-minute workout today to rebuild momentum',
        data: { streakDays: 0 }
      })
    } else if (habitData.streak >= 7 && habitData.streak < 21) {
      insights.push({
        type: 'streak',
        priority: 'medium',
        message: `Great momentum with ${habitData.streak} day streak!`,
        actionable: 'Keep going - you\'re building a lasting habit',
        data: { streakDays: habitData.streak, daysToHabit: 21 - habitData.streak }
      })
    } else if (habitData.streak >= 21) {
      insights.push({
        type: 'streak',
        priority: 'low',
        message: 'Habit formed! Consider progressive challenges',
        actionable: 'Time to increase intensity or try new exercises',
        data: { streakDays: habitData.streak, habitFormed: true }
      })
    }

    // Consistency analysis
    const recentAdherence = habitData.weeklyAdherence.slice(-4)
    if (recentAdherence.length >= 2) {
      const avgAdherence = recentAdherence.reduce((sum: number, rate: number) => sum + rate, 0) / recentAdherence.length
      const trend = recentAdherence[recentAdherence.length - 1] - recentAdherence[0]

      if (avgAdherence < 0.5) {
        insights.push({
          type: 'consistency',
          priority: 'high',
          message: 'Consistency is the key to results',
          actionable: 'Focus on 2-3 workouts per week before adding more',
          data: { adherence: avgAdherence, trend }
        })
      } else if (trend < -0.2) {
        insights.push({
          type: 'consistency',
          priority: 'medium',
          message: 'Adherence has been declining recently',
          actionable: 'Consider reducing workout frequency or duration temporarily',
          data: { adherence: avgAdherence, trend }
        })
      }
    }

    // Timing analysis
    const workoutTimes = this.analyzeWorkoutTiming(habitData)
    if (workoutTimes.preferredTime) {
      insights.push({
        type: 'timing',
        priority: 'low',
        message: `You're most consistent with ${workoutTimes.preferredTime} workouts`,
        actionable: 'Schedule future workouts during your optimal time',
        data: workoutTimes
      })
    }

    // Recovery analysis
    if (progressData.averageSessionRPE > 8.5) {
      insights.push({
        type: 'recovery',
        priority: 'high',
        message: 'High session RPE detected - recovery may be needed',
        actionable: 'Consider a deload week or active recovery',
        data: { averageRPE: progressData.averageSessionRPE }
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Generate personalized nudges
  generateNudges(habitData: any, userProfile: any, currentDate: Date): HabitNudge[] {
    const nudges: HabitNudge[] = []
    const today = currentDate.toISOString().split('T')[0]

    // Streak protection nudges
    if (habitData.streak > 7 && !habitData.lastWorkoutDate) {
      nudges.push({
        id: crypto.randomUUID(),
        type: 'reminder',
        title: 'Protect Your Streak! 🔥',
        message: `You're on a ${habitData.streak}-day streak. Don't break it now!`,
        cta: 'Start Quick Workout',
        scheduledFor: today,
        delivered: false
      })
    }

    // Weekly goal nudges
    const weekDay = currentDate.getDay()
    if (weekDay === 3 && habitData.currentWeekWorkouts === 0) { // Wednesday check
      nudges.push({
        id: crypto.randomUUID(),
        type: 'motivation',
        title: 'Mid-Week Check-In 💪',
        message: 'The week is half over. A quick session now will set you up for success!',
        cta: 'Browse Quick Workouts',
        scheduledFor: today,
        delivered: false
      })
    }

    // Achievement celebrations
    if (habitData.streak > 0 && habitData.streak % 7 === 0) {
      nudges.push({
        id: crypto.randomUUID(),
        type: 'celebration',
        title: 'Week Milestone! 🎉',
        message: `${habitData.streak} days of consistency! You're building something amazing.`,
        scheduledFor: today,
        delivered: false
      })
    }

    // Course correction
    if (habitData.weeklyAdherence.slice(-2).every((rate: number) => rate < 0.5)) {
      nudges.push({
        id: crypto.randomUUID(),
        type: 'course_correction',
        title: 'Let\'s Get Back on Track',
        message: 'Life happens, but your goals are still achievable. Start small and build back up.',
        cta: 'Adjust My Plan',
        scheduledFor: today,
        delivered: false
      })
    }

    return nudges
  }

  // Behavioral change strategies
  applyBehaviorStrategies(userProfile: any, habitData: any): any {
    const strategies = []

    // Implementation intentions
    if (habitData.consistencyScore < 0.6) {
      strategies.push({
        type: 'implementation_intention',
        strategy: 'If-Then Planning',
        suggestion: 'Create specific workout schedules: "If it\'s Monday at 7 AM, then I do my push workout"'
      })
    }

    // Social accountability
    if (habitData.streak < 14) {
      strategies.push({
        type: 'social_accountability',
        strategy: 'Workout Buddy',
        suggestion: 'Find a workout partner or share your progress with friends for accountability'
      })
    }

    // Habit stacking
    strategies.push({
      type: 'habit_stacking',
      strategy: 'Stack with Existing Habits',
      suggestion: 'Link workouts to established routines: "After I have my morning coffee, I will do my workout"'
    })

    // Environmental design
    if (userProfile.equipment.includes('BODYWEIGHT')) {
      strategies.push({
        type: 'environmental_design',
        strategy: 'Remove Barriers',
        suggestion: 'Lay out workout clothes the night before and clear your exercise space'
      })
    }

    return strategies
  }

  // Calculate habit strength score
  calculateHabitStrength(habitData: any): number {
    const factors = {
      consistency: Math.min(1, habitData.consistencyScore),
      frequency: Math.min(1, habitData.currentWeekWorkouts / habitData.weeklyGoal),
      duration: Math.min(1, habitData.streak / 66), // 66 days for habit formation
      stability: this.calculateStability(habitData.weeklyAdherence)
    }

    return (factors.consistency * 0.3 + factors.frequency * 0.3 + factors.duration * 0.25 + factors.stability * 0.15)
  }

  private analyzeWorkoutTiming(habitData: any) {
    // Mock analysis - in real app would analyze actual workout timestamps
    return {
      preferredTime: 'morning',
      consistencyByTime: {
        morning: 0.8,
        afternoon: 0.6,
        evening: 0.4
      }
    }
  }

  private calculateStability(weeklyAdherence: number[]): number {
    if (weeklyAdherence.length < 2) return 0
    
    const variance = weeklyAdherence.reduce((acc, rate, i, arr) => {
      if (i === 0) return 0
      return acc + Math.abs(rate - arr[i - 1])
    }, 0) / (weeklyAdherence.length - 1)

    return Math.max(0, 1 - variance) // Lower variance = higher stability
  }
}

export const habitEngine = new HabitEngine()