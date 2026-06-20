import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { enhancedPlanGenerator } from '@/lib/ai/enhanced-plan-generator'

export const dynamic = 'force-dynamic'

// GET /api/admin/bandit-insights - Fetch bandit arms performance stats (Authenticated users)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = enhancedPlanGenerator.getBanditInsights()
    return NextResponse.json({ success: true, stats })
  } catch (error: any) {
    console.error('Error fetching bandit stats:', error)
    return NextResponse.json({ error: 'Failed to fetch bandit statistics' }, { status: 500 })
  }
}
