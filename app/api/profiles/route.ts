import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const now = new Date().toISOString()
    const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(user.id)
    const injuries = body.constraints?.injuries ? JSON.stringify(body.constraints.injuries) : '[]'
    const available_equipment = body.constraints?.equipment ? JSON.stringify(body.constraints.equipment) : '[]'
    const disliked_exercises = body.dislikes ? JSON.stringify(body.dislikes) : '[]'

    if (existing) {
      db.prepare(`
        UPDATE profiles SET
          age = ?, sex = ?, height_cm = ?, weight_kg = ?,
          goal = ?, experience = ?, days_per_week = ?, minutes_per_day = ?,
          split_preference = ?, injuries = ?, available_equipment = ?, disliked_exercises = ?, updated_at = ?
        WHERE user_id = ?
      `).run(
        body.age ?? null,
        body.sex ?? null,
        body.height_cm ?? null,
        body.weight_kg ?? null,
        body.goal ?? null,
        body.experience ?? null,
        body.days_per_week ?? null,
        body.minutes_per_day ?? null,
        body.split_preference ?? null,
        injuries,
        available_equipment,
        disliked_exercises,
        now,
        user.id
      )
    } else {
      db.prepare(`
        INSERT INTO profiles (user_id, age, sex, height_cm, weight_kg, goal, experience, days_per_week, minutes_per_day, split_preference, injuries, available_equipment, disliked_exercises, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        body.age ?? null,
        body.sex ?? null,
        body.height_cm ?? null,
        body.weight_kg ?? null,
        body.goal ?? null,
        body.experience ?? null,
        body.days_per_week ?? null,
        body.minutes_per_day ?? null,
        body.split_preference ?? null,
        injuries,
        available_equipment,
        disliked_exercises,
        now
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile save error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
