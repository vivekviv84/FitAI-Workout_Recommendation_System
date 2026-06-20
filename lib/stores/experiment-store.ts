import { create } from 'zustand'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Experiment {
  id: string
  key: string
  name: string
  description: string
  variants: string[]
  active: boolean
  trafficAllocation: number
}

interface ExperimentAssignment {
  experimentKey: string
  variant: string
  assignedAt: string
}

interface ExperimentEvent {
  experimentKey: string
  variant: string
  eventType: string
  value?: number
  timestamp: string
}

interface ExperimentState {
  assignments: Record<string, string> // experimentKey -> variant
  events: ExperimentEvent[]
  
  // Actions
  assignVariant: (experimentKey: string, variants: string[], userId: string) => string
  trackEvent: (experimentKey: string, eventType: string, value?: number) => void
  getVariant: (experimentKey: string) => string | null
  isInExperiment: (experimentKey: string) => boolean
  
  // Analytics
  getExperimentResults: (experimentKey: string) => any
  
  // Helper
  hashString: (str: string) => number
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  assignments: {},
  events: [],

  assignVariant: (experimentKey, variants, userId) => {
    const { assignments } = get()
    
    // Check if already assigned
    if (assignments[experimentKey]) {
      return assignments[experimentKey]
    }

    // Hash-based deterministic assignment
    const hash = get().hashString(userId + experimentKey)
    const variantIndex = hash % variants.length
    const selectedVariant = variants[variantIndex]

    set({
      assignments: {
        ...assignments,
        [experimentKey]: selectedVariant
      }
    })

    return selectedVariant
  },

  trackEvent: (experimentKey, eventType, value) => {
    const { assignments, events } = get()
    const variant = assignments[experimentKey]
    
    if (!variant) return // Not in experiment

    const event: ExperimentEvent = {
      experimentKey,
      variant,
      eventType,
      value,
      timestamp: new Date().toISOString()
    }

    set({
      events: [...events, event]
    })
  },

  getVariant: (experimentKey) => {
    const { assignments } = get()
    return assignments[experimentKey] || null
  },

  isInExperiment: (experimentKey) => {
    const { assignments } = get()
    return experimentKey in assignments
  },

  getExperimentResults: (experimentKey) => {
    const { events } = get()
    const experimentEvents = events.filter(e => e.experimentKey === experimentKey)
    
    // Group by variant
    const resultsByVariant = experimentEvents.reduce((acc, event) => {
      if (!acc[event.variant]) {
        acc[event.variant] = {
          variant: event.variant,
          events: [],
          conversions: 0,
          totalValue: 0
        }
      }
      
      acc[event.variant].events.push(event)
      if (event.eventType === 'conversion') {
        acc[event.variant].conversions++
      }
      if (event.value) {
        acc[event.variant].totalValue += event.value
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(resultsByVariant)
  },

  // Helper function
  hashString: (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}))

// Experiment definitions
export const EXPERIMENTS = {
  ONBOARDING_FLOW: {
    key: 'onboarding_flow_v1',
    variants: ['original', 'simplified', 'gamified']
  },
  PLAN_GENERATION: {
    key: 'plan_generation_v1', 
    variants: ['rules_only', 'ml_enhanced', 'hybrid']
  },
  HABIT_NUDGES: {
    key: 'habit_nudges_v1',
    variants: ['gentle', 'motivational', 'data_driven']
  },
  REST_TIMER: {
    key: 'rest_timer_v1',
    variants: ['standard', 'adaptive', 'gamified']
  }
} as const

// Hook for easy experiment usage
export function useExperiment(experimentKey: string, variants: string[]) {
  const { assignVariant, getVariant, trackEvent, isInExperiment } = useExperimentStore()
  const { user } = useAuthStore()

  const variant = user ? assignVariant(experimentKey, variants, user.id) : variants[0]
  
  return {
    variant,
    isInExperiment: isInExperiment(experimentKey),
    track: (eventType: string, value?: number) => trackEvent(experimentKey, eventType, value)
  }
}