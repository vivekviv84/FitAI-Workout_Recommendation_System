import { NextRequest, NextResponse } from 'next/server'
import { enhancedPlanGenerator } from '@/lib/ai/enhanced-plan-generator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, userId, template, adherenceRate, progressScore, satisfactionRating } = body

    // Update bandit performance
    enhancedPlanGenerator.updateBanditPerformance(
      template,
      adherenceRate / 100, // Convert percentage to decimal
      progressScore / 100,
      satisfactionRating
    )

    // In production, this would also save to database
    console.log('Bandit feedback received:', { 
      planId, 
      userId, 
      template, 
      adherenceRate, 
      progressScore, 
      satisfactionRating 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}