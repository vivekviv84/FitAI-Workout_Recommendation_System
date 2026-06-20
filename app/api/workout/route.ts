import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET workout day with exercises
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const workoutDayId = searchParams.get('dayId')

    if (!workoutDayId) {
      return NextResponse.json({ error: 'Missing workoutDayId' }, { status: 400 })
    }

    // Verify ownership
    const day = db.prepare(`
      SELECT wd.* FROM workout_days wd
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wd.id = ? AND wp.user_id = ?
    `).get(workoutDayId, user.id)

    if (!day) {
      return NextResponse.json({ error: 'Workout day not found' }, { status: 404 })
    }

    // Get exercises for this day
    const exercises = db.prepare(`
      SELECT we.*, e.name, e.primary_muscle, e.equipment
      FROM workout_exercises we
      JOIN exercises e ON we.exercise_id = e.id
      WHERE we.workout_day_id = ?
      ORDER BY we.position
    `).all(workoutDayId)

    // Get completed sets for each exercise
    const exercisesWithSets = (exercises as any[]).map(ex => {
      const completedSets = db.prepare(`
        SELECT * FROM completed_sets
        WHERE workout_exercise_id = ?
        ORDER BY set_number
      `).all(ex.id)

      return {
        ...ex,
        completedSets
      }
    })

    return NextResponse.json({
      ...day,
      exercises: exercisesWithSets
    })
  } catch (error) {
    console.error('Workout day fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workout day' }, { status: 500 })
  }
}

// POST log completed set
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { workoutExerciseId, setNumber, repsCompleted, weight, rpe, notes } = body

    // Verify ownership
    const exercise = db.prepare(`
      SELECT we.* FROM workout_exercises we
      JOIN workout_days wd ON we.workout_day_id = wd.id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE we.id = ? AND wp.user_id = ?
    `).get(workoutExerciseId, user.id)

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Insert completed set
    const setId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO completed_sets (id, workout_exercise_id, set_number, reps_completed, weight_kg, rpe, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      setId,
      workoutExerciseId,
      setNumber,
      repsCompleted,
      weight,
      rpe,
      notes
    )

    return NextResponse.json({ success: true, setId })
  } catch (error) {
    console.error('Set logging error:', error)
    return NextResponse.json({ error: 'Failed to log set' }, { status: 500 })
  }
}

// PUT mark workout as complete
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { workoutDayId } = body

    // Verify ownership
    const day = db.prepare(`
      SELECT wd.* FROM workout_days wd
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wd.id = ? AND wp.user_id = ?
    `).get(workoutDayId, user.id)

    if (!day) {
      return NextResponse.json({ error: 'Workout day not found' }, { status: 404 })
    }

    // Mark as completed
    db.prepare(`
      UPDATE workout_days
      SET completed = 1, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(workoutDayId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workout completion error:', error)
    return NextResponse.json({ error: 'Failed to complete workout' }, { status: 500 })
  }
}
