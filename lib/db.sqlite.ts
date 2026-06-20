import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'users.db')

function getColumnType(database: any, tableName: string, columnName: string): string | null {
  try {
    const tableInfo = database.prepare(`PRAGMA table_info(${tableName})`).all()
    return tableInfo.find((column: any) => column.name === columnName)?.type || null
  } catch {
    return null
  }
}

function hasIncompatibleSchema(database: any): boolean {
  const usersIdType = getColumnType(database, 'users', 'id')
  const profileUserIdType = getColumnType(database, 'profiles', 'user_id')
  return (
    usersIdType?.toUpperCase() === 'INTEGER' ||
    profileUserIdType?.toUpperCase() === 'INTEGER'
  )
}

let db: any
if (fs.existsSync(dbPath)) {
  const inspector = new Database(dbPath, { readonly: true })
  if (hasIncompatibleSchema(inspector)) {
    inspector.close()
    const backupPath = path.join(dataDir, `users.db.legacy-${Date.now()}.bak`)
    fs.renameSync(dbPath, backupPath)
    console.warn(`Detected incompatible SQLite schema and renamed old DB to ${backupPath}`)
  } else {
    inspector.close()
  }
}

db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// ===== USERS & AUTH =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('USER', 'COACH', 'ADMIN')) DEFAULT 'USER',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// ===== USER PROFILE =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    age INTEGER,
    sex TEXT CHECK(sex IN ('MALE', 'FEMALE', 'OTHER')),
    height_cm INTEGER,
    weight_kg REAL,
    goal TEXT CHECK(goal IN ('FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'GENERAL_FITNESS', 'ENDURANCE')),
    experience TEXT CHECK(experience IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    days_per_week INTEGER,
    minutes_per_day INTEGER,
    split_preference TEXT CHECK(split_preference IN ('PPL', 'UL_LL', 'FULL_BODY')),
    injuries TEXT,
    disliked_exercises TEXT,
    available_equipment TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// ===== EXERCISE LIBRARY =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT,
    movement_pattern TEXT NOT NULL,
    category TEXT CHECK(category IN ('STRENGTH', 'CARDIO', 'CORE', 'MOBILITY')),
    equipment TEXT NOT NULL,
    skill_level TEXT CHECK(skill_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')) DEFAULT 'INTERMEDIATE',
    contraindications TEXT,
    default_sets INTEGER DEFAULT 3,
    default_reps TEXT DEFAULT '8-12',
    default_rest_sec INTEGER DEFAULT 90,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// ===== WORKOUT PLANS =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    weeks INTEGER NOT NULL,
    template TEXT CHECK(template IN ('PPL', 'UL_LL', 'FULL_BODY')) NOT NULL,
    start_date TEXT NOT NULL,
    rationale TEXT,
    status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')) DEFAULT 'ACTIVE',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// ===== WORKOUT DAYS =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS workout_days (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    date TEXT NOT NULL,
    label TEXT,
    is_deload INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
  )
`).run()

// ===== WORKOUT EXERCISES (exercises prescribed in a workout day) =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY,
    workout_day_id TEXT NOT NULL,
    exercise_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    target_rpe INTEGER,
    rest_sec INTEGER,
    tempo TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE,
    FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
  )
`).run()

// ===== COMPLETED SETS (tracking user's actual performance) =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS completed_sets (
    id TEXT PRIMARY KEY,
    workout_exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps_completed INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    rpe INTEGER,
    notes TEXT,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
  )
`).run()

// ===== PROGRESS TRACKING =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS progress_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    body_weight_kg REAL,
    body_fat_percentage REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// ===== RECOMMENDATIONS =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('EXERCISE_SUBSTITUTION', 'FORM_IMPROVEMENT', 'RECOVERY', 'NUTRITION', 'GENERAL')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// ===== HABIT TRACKING =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_type TEXT NOT NULL,
    target_frequency INTEGER,
    current_streak INTEGER DEFAULT 0,
    last_completed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

// ===== EXPERIMENT TRACKING (A/B tests) =====
db.prepare(`
  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    experiment_type TEXT NOT NULL,
    variant TEXT NOT NULL,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    results TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run()

export default db
