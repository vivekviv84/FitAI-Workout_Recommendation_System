-- SQL Server schema for the workout project
-- Converted from lib/db.ts (SQLite) to T-SQL

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- Users
IF OBJECT_ID('dbo.users') IS NULL
BEGIN
CREATE TABLE dbo.users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(255) NOT NULL UNIQUE,
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  role NVARCHAR(10) NOT NULL CONSTRAINT DF_users_role DEFAULT ('USER'),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME())
);
ALTER TABLE dbo.users ADD CONSTRAINT CHK_users_role CHECK (role IN ('USER','COACH','ADMIN'));
END

-- Profiles
IF OBJECT_ID('dbo.profiles') IS NULL
BEGIN
CREATE TABLE dbo.profiles (
  user_id INT PRIMARY KEY,
  age INT NULL,
  sex NVARCHAR(10) NULL,
  height_cm FLOAT NULL,
  weight_kg FLOAT NULL,
  goal NVARCHAR(20) NULL,
  experience NVARCHAR(20) NULL,
  days_per_week INT NULL,
  minutes_per_day INT NULL,
  split_preference NVARCHAR(10) NULL,
  constraints NVARCHAR(MAX) NULL,
  equipment NVARCHAR(MAX) NULL,
  dislikes NVARCHAR(MAX) NULL,
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_profiles_updated_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
ALTER TABLE dbo.profiles ADD CONSTRAINT CHK_profiles_sex CHECK (sex IN ('MALE','FEMALE','OTHER') OR sex IS NULL);
ALTER TABLE dbo.profiles ADD CONSTRAINT CHK_profiles_goal CHECK (goal IN ('FAT_LOSS','MUSCLE_GAIN','STRENGTH','GENERAL_FITNESS','ENDURANCE') OR goal IS NULL);
ALTER TABLE dbo.profiles ADD CONSTRAINT CHK_profiles_experience CHECK (experience IN ('BEGINNER','INTERMEDIATE','ADVANCED') OR experience IS NULL);
ALTER TABLE dbo.profiles ADD CONSTRAINT CHK_profiles_split_pref CHECK (split_preference IN ('PPL','UL_LL','FULL_BODY') OR split_preference IS NULL);
END

-- Exercises
IF OBJECT_ID('dbo.exercises') IS NULL
BEGIN
CREATE TABLE dbo.exercises (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL UNIQUE,
  primary_muscle NVARCHAR(50) NOT NULL,
  secondary_muscles NVARCHAR(MAX) NULL,
  movement_pattern NVARCHAR(50) NOT NULL,
  category NVARCHAR(20) NOT NULL,
  equipment NVARCHAR(50) NOT NULL,
  skill_level NVARCHAR(20) NOT NULL,
  contraindications NVARCHAR(MAX) NULL,
  default_sets INT NOT NULL,
  default_reps NVARCHAR(50) NOT NULL,
  default_rest_sec INT NOT NULL,
  created_by INT NULL,
  version INT NOT NULL CONSTRAINT DF_exercises_version DEFAULT (1),
  active BIT NOT NULL CONSTRAINT DF_exercises_active DEFAULT (1),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_exercises_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_exercises_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
ALTER TABLE dbo.exercises ADD CONSTRAINT CHK_exercises_category CHECK (category IN ('STRENGTH','CARDIO','CORE','MOBILITY'));
ALTER TABLE dbo.exercises ADD CONSTRAINT CHK_exercises_skill_level CHECK (skill_level IN ('BEGINNER','INTERMEDIATE','ADVANCED'));
END

-- Workout plans
IF OBJECT_ID('dbo.workout_plans') IS NULL
BEGIN
CREATE TABLE dbo.workout_plans (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  weeks INT NOT NULL,
  template NVARCHAR(10) NOT NULL,
  start_date DATE NOT NULL,
  metadata NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_workout_plans_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_workout_plans_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
ALTER TABLE dbo.workout_plans ADD CONSTRAINT CHK_workout_plans_template CHECK (template IN ('PPL','UL_LL','FULL_BODY'));
END

-- Workouts
IF OBJECT_ID('dbo.workouts') IS NULL
BEGIN
CREATE TABLE dbo.workouts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  plan_id INT NOT NULL,
  day_number INT NOT NULL,
  completed BIT NOT NULL CONSTRAINT DF_workouts_completed DEFAULT (0),
  completed_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_workouts_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_workouts_plan FOREIGN KEY (plan_id) REFERENCES dbo.workout_plans(id)
);
END

-- Workout exercises
IF OBJECT_ID('dbo.workout_exercises') IS NULL
BEGIN
CREATE TABLE dbo.workout_exercises (
  id INT IDENTITY(1,1) PRIMARY KEY,
  workout_id INT NOT NULL,
  exercise_id INT NOT NULL,
  sets INT NOT NULL,
  reps NVARCHAR(50) NOT NULL,
  rest_sec INT NOT NULL,
  notes NVARCHAR(MAX) NULL,
  order_index INT NOT NULL,
  CONSTRAINT FK_workout_exercises_workout FOREIGN KEY (workout_id) REFERENCES dbo.workouts(id),
  CONSTRAINT FK_workout_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES dbo.exercises(id)
);
END

-- Exercise logs
IF OBJECT_ID('dbo.exercise_logs') IS NULL
BEGIN
CREATE TABLE dbo.exercise_logs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  workout_exercise_id INT NOT NULL,
  set_number INT NOT NULL,
  reps_completed INT NULL,
  weight_kg FLOAT NULL,
  rpe INT NULL,
  notes NVARCHAR(MAX) NULL,
  completed_at DATETIME2 NOT NULL CONSTRAINT DF_exercise_logs_completed_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_exercise_logs_workout_exercise FOREIGN KEY (workout_exercise_id) REFERENCES dbo.workout_exercises(id)
);
ALTER TABLE dbo.exercise_logs ADD CONSTRAINT CHK_exercise_logs_rpe CHECK (rpe BETWEEN 1 AND 10 OR rpe IS NULL);
END

-- Indexes
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_profiles_user_id')
  CREATE INDEX idx_profiles_user_id ON dbo.profiles(user_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_workout_plans_user_id')
  CREATE INDEX idx_workout_plans_user_id ON dbo.workout_plans(user_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_workouts_plan_id')
  CREATE INDEX idx_workouts_plan_id ON dbo.workouts(plan_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_workout_exercises_workout_id')
  CREATE INDEX idx_workout_exercises_workout_id ON dbo.workout_exercises(workout_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_exercise_logs_workout_exercise_id')
  CREATE INDEX idx_exercise_logs_workout_exercise_id ON dbo.exercise_logs(workout_exercise_id);
