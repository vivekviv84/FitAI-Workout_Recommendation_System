import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { enhancedPlanGenerator } from '@/lib/ai/enhanced-plan-generator'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET user's workout plans with pagination
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    // Get paginated plans
    const plans = db.prepare(`
      SELECT * FROM workout_plans
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, limit, offset) as any[]

    // Get total count for pagination
    const countResult = db.prepare(
      'SELECT COUNT(*) as count FROM workout_plans WHERE user_id = ?'
    ).get(user.id) as any

    if (plans.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: countResult.count,
          totalPages: Math.ceil(countResult.count / limit),
        },
      })
    }

    const planIds = plans.map(p => p.id)

    // Bulk fetch all days for these plans (1 query instead of N)
    const daysQuery = db.prepare(`
      SELECT * FROM workout_days
      WHERE plan_id IN (${planIds.map(() => '?').join(',')})
      ORDER BY plan_id, week_number, day_number
    `)
    const allDays = daysQuery.all(...planIds) as any[]

    // Bulk fetch all exercises for these days (1 query instead of N*7)
    const dayIds = allDays.map(d => d.id)
    if (dayIds.length === 0) {
      // No days, return empty plans
      return NextResponse.json({
        data: plans.map(plan => ({
          ...plan,
          days: [],
          weeks: [],
        })),
        pagination: {
          page,
          limit,
          total: countResult.count,
          totalPages: Math.ceil(countResult.count / limit),
        },
      })
    }

    const exercisesQuery = db.prepare(`
      SELECT we.*, e.name, e.primary_muscle, e.equipment
      FROM workout_exercises we
      JOIN exercises e ON we.exercise_id = e.id
      WHERE we.workout_day_id IN (${dayIds.map(() => '?').join(',')})
      ORDER BY we.workout_day_id, we.position
    `)
    const allExercises = exercisesQuery.all(...dayIds) as any[]

    // Group exercises by day ID (in-memory instead of N queries)
    const exercisesByDay = new Map<string, any[]>()
    for (const exercise of allExercises) {
      const dayId = exercise.workout_day_id
      if (!exercisesByDay.has(dayId)) {
        exercisesByDay.set(dayId, [])
      }
      exercisesByDay.get(dayId)!.push(exercise)
    }

    // Add exercises to days
    const daysWithExercises = allDays.map(day => ({
      ...day,
      exercises: exercisesByDay.get(day.id) || [],
    }))

    // Group days by plan ID
    const daysByPlan = new Map<string, any[]>()
    for (const day of daysWithExercises) {
      if (!daysByPlan.has(day.plan_id)) {
        daysByPlan.set(day.plan_id, [])
      }
      daysByPlan.get(day.plan_id)!.push(day)
    }

    // Build final response with weeks structure
    const enrichedPlans = plans.map(plan => {
      const planDays = daysByPlan.get(plan.id) || []

      // Group days into weeks
      const weeks = Array.from({ length: plan.weeks }, () => [] as any[])
      for (const day of planDays) {
        const weekIndex = day.week_number - 1
        if (weekIndex >= 0 && weekIndex < weeks.length) {
          weeks[weekIndex].push(day)
        }
      }

      return {
        ...plan,
        days: planDays,
        weeks,
      }
    })

    return NextResponse.json({
      data: enrichedPlans,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
      },
    })
  } catch (error) {
    console.error('Plans fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST create new workout plan
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      weeks = 12,
      templateCandidates = ['PPL', 'UL_LL', 'FULL_BODY'],
      startDate = new Date().toISOString().split('T')[0]
    } = body

    // Validate input
    if (!Array.isArray(templateCandidates) || templateCandidates.length === 0) {
      return NextResponse.json({ error: 'Invalid template candidates' }, { status: 400 })
    }

    if (weeks < 1 || weeks > 52) {
      return NextResponse.json({ error: 'Weeks must be between 1 and 52' }, { status: 400 })
    }

    // Get user profile
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id) as any

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Parse stored JSON fields safely
    let userProfile = {
      ...profile,
      injuries: [],
      disliked_exercises: [],
      available_equipment: []
    }

    try {
      if (profile.injuries) userProfile.injuries = JSON.parse(profile.injuries)
      if (profile.disliked_exercises) userProfile.disliked_exercises = JSON.parse(profile.disliked_exercises)
      if (profile.available_equipment) userProfile.available_equipment = JSON.parse(profile.available_equipment)
    } catch (e) {
      console.warn('Failed to parse profile JSON fields:', e)
    }

    // Get historical workout data if available
    const workoutHistory = db.prepare(`
      SELECT COUNT(DISTINCT wd.id) as total_workouts,
             MAX(wd.completed_at) as last_workout
      FROM completed_sets cs
      JOIN workout_exercises we ON cs.workout_exercise_id = we.id
      JOIN workout_days wd ON we.workout_day_id = wd.id
      JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wp.user_id = ?
    `).get(user.id) as any

    // Generate plan using AI
    const generatedPlan = await enhancedPlanGenerator.generateEnhancedPlan({
      weeks,
      templateCandidates: templateCandidates as any,
      startDate,
      userId: user.id, // Now properly typed as string
      userProfile,
      historicalData: workoutHistory || {},
      preferences: {}
    })

    // Use transaction for data consistency - all or nothing
    const createPlan = db.transaction(() => {
      // Archive old active plans so only the new plan is active
      db.prepare(`
        UPDATE workout_plans
        SET status = 'ARCHIVED'
        WHERE user_id = ? AND status = 'ACTIVE'
      `).run(user.id)

      // Save plan to database
      const planId = crypto.randomUUID()
      db.prepare(`
        INSERT INTO workout_plans (id, user_id, weeks, template, start_date, rationale, status)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(
        planId,
        user.id,
        weeks,
        generatedPlan.template,
        startDate,
        generatedPlan.rationale
      )

      // Save workout days and exercises
      const weekData = generatedPlan.weeks as any[]
      weekData.forEach((week, weekIndex) => {
        week.forEach((day: any, dayIndex: number) => {
          const dayId = crypto.randomUUID()
          const dayDate = new Date(startDate)
          dayDate.setDate(dayDate.getDate() + (weekIndex * 7) + dayIndex)

          db.prepare(`
            INSERT INTO workout_days (id, plan_id, week_number, day_number, date, label, is_deload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            dayId,
            planId,
            weekIndex + 1,
            dayIndex + 1,
            dayDate.toISOString().split('T')[0],
            day.label || `Day ${dayIndex + 1}`,
            day.deload ? 1 : 0
          )

          // Add exercises to day
          day.exercises.forEach((exercise: any, exIndex: number) => {
            // Find exercise ID from name
            const exerciseRecord = db.prepare(`
              SELECT id FROM exercises WHERE name = ?
            `).get(exercise.name) as any

            if (exerciseRecord) {
              const exId = crypto.randomUUID()
              db.prepare(`
                INSERT INTO workout_exercises (id, workout_day_id, exercise_id, position, sets, reps, target_rpe, rest_sec)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                exId,
                dayId,
                exerciseRecord.id,
                exIndex + 1,
                exercise.sets,
                exercise.reps,
                exercise.target_rpe || 7,
                exercise.rest_sec || 90
              )
            }
          })
        })
      })

      return planId
    })

    const planId = createPlan()

    return NextResponse.json({
      success: true,
      planId,
      template: generatedPlan.template,
      weeks,
      rationale: generatedPlan.rationale
    })
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
