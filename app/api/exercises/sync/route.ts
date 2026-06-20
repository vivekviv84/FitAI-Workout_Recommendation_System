import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { syncWgerExercises } from '@/lib/wger'

export const dynamic = 'force-dynamic'

// POST /api/exercises/sync - Trigger bulk exercise sync from Wger (Admin only)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let limit = 50
    try {
      const body = await request.json()
      if (body && typeof body.limit === 'number') {
        limit = Math.min(100, Math.max(1, body.limit))
      }
    } catch {
      // Ignore if no valid body is provided, fallback to default
    }

    const result = await syncWgerExercises(limit)

    return NextResponse.json({
      success: true,
      message: `Successfully processed Wger sync.`,
      totalSynced: result.total,
      importedCount: result.imported.length,
      importedNames: result.imported
    })
  } catch (error: any) {
    console.error('Wger sync endpoint error:', error)
    return NextResponse.json({
      error: 'Failed to sync exercises from Wger API',
      details: error.message
    }, { status: 500 })
  }
}
