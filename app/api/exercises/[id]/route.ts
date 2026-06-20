import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUT update a specific exercise by ID (Admin/Coach only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COACH')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const exerciseId = parseInt(params.id)
  if (isNaN(exerciseId)) {
    return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      name,
      primary_muscle,
      secondary_muscles = '',
      movement_pattern,
      category,
      equipment,
      skill_level = 'INTERMEDIATE',
      contraindications = '',
      default_sets = 3,
      default_reps = '8-12',
      default_rest_sec = 90
    } = body

    if (!name || !primary_muscle || !movement_pattern || !category || !equipment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if exercise exists
    const existing = db.prepare('SELECT id FROM exercises WHERE id = ?').get(exerciseId)
    if (!existing) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    const stmt = db.prepare(`
      UPDATE exercises SET
        name = ?,
        primary_muscle = ?,
        secondary_muscles = ?,
        movement_pattern = ?,
        category = ?,
        equipment = ?,
        skill_level = ?,
        contraindications = ?,
        default_sets = ?,
        default_reps = ?,
        default_rest_sec = ?
      WHERE id = ?
    `)

    stmt.run(
      name,
      primary_muscle,
      secondary_muscles,
      movement_pattern,
      category,
      equipment,
      skill_level,
      contraindications,
      default_sets,
      default_reps,
      default_rest_sec,
      exerciseId
    )

    return NextResponse.json({
      success: true,
      id: exerciseId,
      name
    })
  } catch (error: any) {
    console.error('Exercise update error:', error)
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Exercise name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }
}

// DELETE an exercise by ID (Admin/Coach only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COACH')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const exerciseId = parseInt(params.id)
  if (isNaN(exerciseId)) {
    return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 })
  }

  try {
    // Check if exercise exists
    const existing = db.prepare('SELECT id, name FROM exercises WHERE id = ?').get(exerciseId) as any
    if (!existing) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Check if the exercise is used in any workout_exercises (foreign key RESTRICT or CASCADE)
    // Wait, let's verify if there are any dependents. If so, return error or handle it.
    // In our schema: FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
    // Meaning SQLite itself will throw an error if the exercise is used, preventing deletion.
    const stmt = db.prepare('DELETE FROM exercises WHERE id = ?')
    stmt.run(exerciseId)

    return NextResponse.json({
      success: true,
      message: `Exercise "${existing.name}" successfully deleted`
    })
  } catch (error: any) {
    console.error('Exercise deletion error:', error)
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({
        error: 'Cannot delete exercise as it is currently used in active workout plans.'
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
  }
}
