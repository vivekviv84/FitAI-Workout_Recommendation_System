#!/usr/bin/env node
/**
 * Database setup script
 * Creates indexes for production performance
 * Run: node scripts/setup-db.js
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'users.db')
const db = new Database(dbPath)

console.log('🗄️  Setting up database indexes...')

const indexes = [
  // User queries
  {
    name: 'idx_users_email',
    sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    table: 'users'
  },
  // Workout plans
  {
    name: 'idx_workout_plans_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id)',
    table: 'workout_plans'
  },
  {
    name: 'idx_workout_plans_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(user_id, status)',
    table: 'workout_plans'
  },
  // Workout days
  {
    name: 'idx_workout_days_plan_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id ON workout_days(plan_id)',
    table: 'workout_days'
  },
  // Workout exercises
  {
    name: 'idx_workout_exercises_day_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_workout_exercises_day_id ON workout_exercises(workout_day_id)',
    table: 'workout_exercises'
  },
  {
    name: 'idx_workout_exercises_exercise_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id)',
    table: 'workout_exercises'
  },
  // Profiles
  {
    name: 'idx_profiles_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)',
    table: 'profiles'
  },
  // Completed sets
  {
    name: 'idx_completed_sets_exercise_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_completed_sets_exercise_id ON completed_sets(workout_exercise_id)',
    table: 'completed_sets'
  },
  // Progress records
  {
    name: 'idx_progress_records_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_progress_records_user_id ON progress_records(user_id)',
    table: 'progress_records'
  },
  // Recommendations
  {
    name: 'idx_recommendations_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id)',
    table: 'recommendations'
  },
  // Habits
  {
    name: 'idx_habits_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)',
    table: 'habits'
  },
  // Exercises
  {
    name: 'idx_exercises_primary_muscle',
    sql: 'CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle)',
    table: 'exercises'
  },
  {
    name: 'idx_exercises_equipment',
    sql: 'CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment)',
    table: 'exercises'
  }
]

let createdCount = 0
for (const index of indexes) {
  try {
    db.prepare(index.sql).run()
    createdCount++
    console.log(`  ✅ ${index.name}`)
  } catch (error) {
    console.log(`  ⚠️  ${index.name} - ${error.message}`)
  }
}

console.log(`\n✅ Database setup complete! Created/verified ${createdCount} indexes`)

// Verify indexes exist
console.log('\n📊 Verifying indexes...')
const verifyIndexes = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type = 'index' AND name LIKE 'idx_%'
  ORDER BY name
`).all()

console.log(`Found ${verifyIndexes.length} production indexes:`)
verifyIndexes.forEach(idx => console.log(`  - ${idx.name}`))

db.close()
console.log('\n✅ Database ready for production!')
