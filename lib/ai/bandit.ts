interface BanditArm {
  variant: 'PPL' | 'UL_LL' | 'FULL_BODY'
  totalReward: number
  attempts: number
  averageReward: number
}

class MultiArmedBandit {
  private arms: BanditArm[]
  private epsilon: number = 0.15

  constructor() {
    this.arms = [
      { variant: 'PPL', totalReward: 0, attempts: 0, averageReward: 0 },
      { variant: 'UL_LL', totalReward: 0, attempts: 0, averageReward: 0 },
      { variant: 'FULL_BODY', totalReward: 0, attempts: 0, averageReward: 0 }
    ]
  }

  selectVariant(userId: string): 'PPL' | 'UL_LL' | 'FULL_BODY' {
    // Epsilon-greedy selection
    if (Math.random() < this.epsilon) {
      // Explore: random selection
      const randomIndex = Math.floor(Math.random() * this.arms.length)
      return this.arms[randomIndex].variant
    } else {
      // Exploit: select best performing arm
      const bestArm = this.arms.reduce((best, current) => 
        current.averageReward > best.averageReward ? current : best
      )
      return bestArm.variant
    }
  }

  updateReward(variant: 'PPL' | 'UL_LL' | 'FULL_BODY', reward: number) {
    const arm = this.arms.find(a => a.variant === variant)
    if (!arm) return

    arm.totalReward += reward
    arm.attempts += 1
    arm.averageReward = arm.totalReward / arm.attempts
  }

  getStats() {
    return this.arms.map(arm => ({
      variant: arm.variant,
      averageReward: arm.averageReward,
      attempts: arm.attempts,
      confidence: arm.attempts > 0 ? arm.averageReward : 0
    }))
  }
}

export const bandit = new MultiArmedBandit()

export function calculateReward(adherenceRate: number, progressScore: number): number {
  // Reward = 0.6 * adherence + 0.4 * progress (normalized 0-1)
  return 0.6 * adherenceRate + 0.4 * progressScore
}