import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { enhancedPlanGenerator } from '@/lib/ai/enhanced-plan-generator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Require authentication for this endpoint
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { weeks, templateCandidates, startDate, userProfile, historicalData, preferences } = body

    // Validate input - userProfile should come from request, not be trusted from client
    if (!weeks || !templateCandidates || !userProfile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Array.isArray(templateCandidates) || templateCandidates.length === 0) {
      return NextResponse.json({ error: 'Invalid template candidates' }, { status: 400 })
    }

    if (weeks < 1 || weeks > 52) {
      return NextResponse.json({ error: 'Weeks must be between 1 and 52' }, { status: 400 })
    }

    // Generate enhanced plan
    const plan = await enhancedPlanGenerator.generateEnhancedPlan({
      weeks: weeks || 12,
      templateCandidates: templateCandidates,
      startDate: startDate || new Date().toISOString().split('T')[0],
      userId: user.id, // Now properly typed as string
      userProfile,
      historicalData,
      preferences
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}