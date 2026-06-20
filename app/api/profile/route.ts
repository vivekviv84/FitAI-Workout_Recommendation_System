import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET user profile
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(user.id)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse JSON fields
    const parsed = {
      ...profile,
      injuries: (profile as any).injuries ? JSON.parse((profile as any).injuries) : [],
      disliked_exercises: (profile as any).disliked_exercises ? JSON.parse((profile as any).disliked_exercises) : [],
      available_equipment: (profile as any).available_equipment ? JSON.parse((profile as any).available_equipment) : []
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      age,
      sex,
      height_cm,
      weight_kg,
      goal,
      experience,
      days_per_week,
      minutes_per_day,
      split_preference,
      injuries,
      disliked_exercises,
      available_equipment
    } = body

    db.prepare(`
      UPDATE profiles SET
        age = ?,
        sex = ?,
        height_cm = ?,
        weight_kg = ?,
        goal = ?,
        experience = ?,
        days_per_week = ?,
        minutes_per_day = ?,
        split_preference = ?,
        injuries = ?,
        disliked_exercises = ?,
        available_equipment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      age,
      sex,
      height_cm,
      weight_kg,
      goal,
      experience,
      days_per_week,
      minutes_per_day,
      split_preference,
      JSON.stringify(injuries || []),
      JSON.stringify(disliked_exercises || []),
      JSON.stringify(available_equipment || []),
      user.id
    )

    const updated = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(user.id)

    return NextResponse.json({
      ...updated,
      injuries: injuries || [],
      disliked_exercises: disliked_exercises || [],
      available_equipment: available_equipment || []
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
