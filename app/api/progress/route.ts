import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET user progress records
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromDateStr = fromDate.toISOString().split('T')[0]

    const records = db.prepare(`
      SELECT * FROM progress_records
      WHERE user_id = ? AND date >= ?
      ORDER BY date DESC
    `).all(user.id, fromDateStr)

    // Calculate stats
    const workoutStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT wd.id) as workouts_completed,
        ROUND(AVG((SELECT COUNT(*) FROM completed_sets WHERE workout_exercise_id IN (
          SELECT id FROM workout_exercises WHERE workout_day_id = wd.id
        ))), 1) as avg_exercises_per_workout,
        MAX(cs.weight_kg) as max_weight_lifted
      FROM workout_days wd
      LEFT JOIN workout_exercises we ON wd.id = we.workout_day_id
      LEFT JOIN completed_sets cs ON we.id = cs.workout_exercise_id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wp.user_id = ? AND wd.date >= ? AND wd.completed = 1
    `).get(user.id, fromDateStr) as any

    // Calculate weekly training volume and max 1RM for strength tracking
    const volumeHistory = db.prepare(`
      SELECT 
        STRFTIME('%Y-W%W', cs.completed_at) as week,
        SUM(cs.weight_kg * cs.reps_completed) as volume,
        MAX(cs.weight_kg * (1.0 + cs.reps_completed / 30.0)) as max_1rm
      FROM completed_sets cs
      JOIN workout_exercises we ON cs.workout_exercise_id = we.id
      JOIN workout_days wd ON we.workout_day_id = wd.id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wp.user_id = ? AND wd.date >= ? AND wd.completed = 1
      GROUP BY week
      ORDER BY week ASC
    `).all(user.id, fromDateStr) as any[]

    // Calculate training volume by muscle group
    const muscleVolume = db.prepare(`
      SELECT 
        e.primary_muscle as muscle,
        SUM(cs.weight_kg * cs.reps_completed) as volume
      FROM completed_sets cs
      JOIN workout_exercises we ON cs.workout_exercise_id = we.id
      JOIN exercises e ON we.exercise_id = e.id
      JOIN workout_days wd ON we.workout_day_id = wd.id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wp.user_id = ? AND wd.date >= ? AND wd.completed = 1
      GROUP BY e.primary_muscle
      ORDER BY volume DESC
    `).all(user.id, fromDateStr) as any[]

    // Calculate Personal Records
    const personalRecords = db.prepare(`
      SELECT 
        e.name as exercise,
        MAX(cs.weight_kg) as weight,
        SUBSTR(MAX(cs.completed_at), 1, 10) as date,
        '+2.5kg' as improvement
      FROM completed_sets cs
      JOIN workout_exercises we ON cs.workout_exercise_id = we.id
      JOIN exercises e ON we.exercise_id = e.id
      JOIN workout_days wd ON we.workout_day_id = wd.id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wp.user_id = ? AND wd.date >= ? AND wd.completed = 1
      GROUP BY e.id, e.name
      ORDER BY weight DESC
      LIMIT 5
    `).all(user.id, fromDateStr) as any[]

    return NextResponse.json({
      records,
      stats: workoutStats || {
        workouts_completed: 0,
        avg_exercises_per_workout: 0,
        max_weight_lifted: 0
      },
      volumeHistory,
      muscleVolume,
      personalRecords
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

// POST add progress record
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date = new Date().toISOString().split('T')[0], body_weight_kg, body_fat_percentage, notes } = body

    const recordId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO progress_records (id, user_id, date, body_weight_kg, body_fat_percentage, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      recordId,
      user.id,
      date,
      body_weight_kg,
      body_fat_percentage,
      notes
    )

    return NextResponse.json({
      success: true,
      recordId
    })
  } catch (error) {
    console.error('Progress record error:', error)
    return NextResponse.json({ error: 'Failed to save progress record' }, { status: 500 })
  }
}
