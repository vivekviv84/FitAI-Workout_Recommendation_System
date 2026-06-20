import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function generateRecommendations(userId: string, userProfile: any, workoutData: any) {
  const recommendations = []

  // Check if user has exercises with poor form (low reps, high RPE)
  const poorFormExercises = db.prepare(`
    SELECT DISTINCT e.name, COUNT(*) as poor_sets
    FROM completed_sets cs
    JOIN workout_exercises we ON cs.workout_exercise_id = we.id
    JOIN exercises e ON we.exercise_id = e.id
    JOIN workout_days wd ON we.workout_day_id = wd.id
    JOIN workout_plans wp ON wd.plan_id = wp.id
    WHERE wp.user_id = ? AND cs.rpe >= 9 AND cs.reps_completed < (
      SELECT CAST(substr(reps, 1, instr(reps, '-') - 1) AS INTEGER) 
      FROM exercises e2 WHERE e2.id = e.id
    )
    GROUP BY e.id
    HAVING COUNT(*) >= 2
  `).all(userId) as any[]

  if (poorFormExercises.length > 0) {
    recommendations.push({
      type: 'FORM_IMPROVEMENT',
      title: 'Form Check Needed',
      description: `You might be struggling with form on ${poorFormExercises[0].name}. Consider reducing weight or taking a video of your form.`,
      priority: 'HIGH'
    })
  }

  // Check recovery (workouts per week)
  const workoutsThisWeek = db.prepare(`
    SELECT COUNT(*) as count FROM workout_days wd
    JOIN workout_plans wp ON wd.plan_id = wp.id
    WHERE wp.user_id = ? AND wd.completed = 1 AND wd.date >= DATE('now', '-7 days')
  `).get(userId) as any

  if (workoutsThisWeek?.count > (userProfile?.days_per_week || 5) + 1) {
    recommendations.push({
      type: 'RECOVERY',
      title: 'Rest Day Recommended',
      description: `You've had ${workoutsThisWeek.count} workouts this week. Consider taking an extra rest day to recover.`,
      priority: 'MEDIUM'
    })
  }

  // Check for inconsistency
  const completionRate = db.prepare(`
    SELECT 
      COUNT(CASE WHEN wd.completed = 1 THEN 1 END) * 100.0 / COUNT(*) as completion_rate
    FROM workout_days wd
    JOIN workout_plans wp ON wd.plan_id = wp.id
    WHERE wp.user_id = ? AND wd.date >= DATE('now', '-30 days')
  `).get(userId) as any

  if (completionRate?.completion_rate < 70) {
    recommendations.push({
      type: 'GENERAL',
      title: 'Consistency Matters',
      description: `Your workout completion rate is ${Math.round(completionRate.completion_rate)}%. Try to maintain at least 80% consistency for best results.`,
      priority: 'MEDIUM'
    })
  }

  // Check for progressive overload
  const noProgressExercises = db.prepare(`
    SELECT e.name, MAX(cs.weight_kg) as max_weight
    FROM completed_sets cs
    JOIN workout_exercises we ON cs.workout_exercise_id = we.id
    JOIN exercises e ON we.exercise_id = e.id
    JOIN workout_days wd ON we.workout_day_id = wd.id
    JOIN workout_plans wp ON wd.plan_id = wp.id
    WHERE wp.user_id = ? AND cs.completed_at >= DATE('now', '-30 days')
    GROUP BY e.id
    HAVING COUNT(DISTINCT SUBSTR(cs.completed_at, 1, 10)) >= 4
      AND MAX(cs.weight_kg) = MIN(cs.weight_kg)
  `).all(userId) as any[]

  if (noProgressExercises.length > 0) {
    recommendations.push({
      type: 'EXERCISE_SUBSTITUTION',
      title: 'Time to Progress',
      description: `You've been doing ${noProgressExercises[0].name} at ${noProgressExercises[0].max_weight}kg for 4+ workouts. Try increasing the weight by 2-5%.`,
      priority: 'HIGH'
    })
  }

  // Nutrition reminder
  if (userProfile?.goal === 'MUSCLE_GAIN') {
    recommendations.push({
      type: 'NUTRITION',
      title: 'Protein Intake',
      description: 'For muscle gain, aim for 0.7-1g of protein per pound of body weight daily.',
      priority: 'MEDIUM'
    })
  }

  return recommendations
}

// GET recommendations
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get existing recommendations that haven't been dismissed
    const existing = db.prepare(`
      SELECT * FROM recommendations
      WHERE user_id = ? AND dismissed = 0
      ORDER BY priority DESC, created_at DESC
      LIMIT 5
    `).all(user.id)

    // If less than 5, generate new ones
    if ((existing as any[]).length < 3) {
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id)
      const workoutData = db.prepare(`
        SELECT COUNT(*) as total_workouts FROM workout_days wd
        JOIN workout_plans wp ON wd.plan_id = wp.id
        WHERE wp.user_id = ? AND wd.completed = 1
      `).get(user.id)

      const generated = generateRecommendations(user.id, profile, workoutData)

      // Save new recommendations
      generated.slice(0, 3).forEach(rec => {
        const id = crypto.randomUUID()
        db.prepare(`
          INSERT INTO recommendations (id, user_id, type, title, description, priority)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          id,
          user.id,
          rec.type,
          rec.title,
          rec.description,
          rec.priority
        )
      })
    }

    // Return all active recommendations
    const allRecs = db.prepare(`
      SELECT * FROM recommendations
      WHERE user_id = ? AND dismissed = 0
      ORDER BY priority DESC, created_at DESC
    `).all(user.id)

    return NextResponse.json(allRecs)
  } catch (error) {
    console.error('Recommendations fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

// PUT dismiss recommendation
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { recommendationId } = body

    // Verify ownership
    const rec = db.prepare(`
      SELECT * FROM recommendations WHERE id = ? AND user_id = ?
    `).get(recommendationId, user.id)

    if (!rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    db.prepare(`
      UPDATE recommendations SET dismissed = 1 WHERE id = ?
    `).run(recommendationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Recommendation update error:', error)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}

// POST create recommendation
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, title, description, priority = 'MEDIUM' } = body

    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO recommendations (id, user_id, type, title, description, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      type,
      title,
      description,
      priority
    )

    return NextResponse.json({ success: true, recommendationId: id })
  } catch (error) {
    console.error('Recommendation creation error:', error)
    return NextResponse.json({ error: 'Failed to create recommendation' }, { status: 500 })
  }
}
