import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simple in-memory experiment store (in production, use database)
const experiments = new Map([
  ['onboarding_flow_v1', {
    id: 'onboarding_flow_v1',
    name: 'Onboarding Flow Optimization',
    variants: ['original', 'simplified', 'gamified'],
    active: true,
    trafficAllocation: 1.0
  }],
  ['plan_generation_v1', {
    id: 'plan_generation_v1',
    name: 'Plan Generation Algorithm',
    variants: ['rules_only', 'ml_enhanced', 'hybrid'],
    active: true,
    trafficAllocation: 1.0
  }],
  ['rest_timer_v1', {
    id: 'rest_timer_v1',
    name: 'Rest Timer Variants',
    variants: ['standard', 'adaptive', 'gamified'],
    active: true,
    trafficAllocation: 1.0
  }]
])

const assignments = new Map<string, Map<string, string>>() // userId -> experimentKey -> variant

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const experimentKey = searchParams.get('experiment')

  if (experimentKey && userId) {
    // Get specific assignment
    const userAssignments = assignments.get(userId) || new Map()
    const variant = userAssignments.get(experimentKey)
    
    if (variant) {
      return NextResponse.json({ variant })
    } else {
      // Assign variant
      const experiment = experiments.get(experimentKey)
      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
      }

      // Hash-based deterministic assignment
      const hash = hashString(userId + experimentKey)
      const variantIndex = hash % experiment.variants.length
      const selectedVariant = experiment.variants[variantIndex]

      // Store assignment
      if (!assignments.has(userId)) {
        assignments.set(userId, new Map())
      }
      assignments.get(userId)!.set(experimentKey, selectedVariant)

      return NextResponse.json({ variant: selectedVariant })
    }
  }

  // Return all active experiments
  const activeExperiments = Array.from(experiments.values()).filter(exp => exp.active)
  return NextResponse.json({ experiments: activeExperiments })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, experimentKey, eventType, value } = body

  // Track experiment event (in production, store in database)
  console.log('Experiment event:', { userId, experimentKey, eventType, value, timestamp: new Date().toISOString() })

  return NextResponse.json({ success: true })
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}