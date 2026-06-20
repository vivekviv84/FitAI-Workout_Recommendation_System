import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function seedExercises() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM exercises').get() as any
    if (count.count >= 100) return

    const exercises = [
      // Chest Exercises (12)
      { name: 'Barbell Bench Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
      { name: 'Dumbbell Bench Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
      { name: 'Push-ups', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '8-15', default_rest_sec: 90 },
      { name: 'Incline Dumbbell Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
      { name: 'Cable Flyes', primary_muscle: 'CHEST', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
      { name: 'Chest Dips', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '6-10', default_rest_sec: 120 },
      { name: 'Decline Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
      { name: 'Machine Chest Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Incline Barbell Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 4, default_reps: '6-8', default_rest_sec: 150 },
      { name: 'Pec Deck', primary_muscle: 'CHEST', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 75 },
      { name: 'Decline Dumbbell Press', primary_muscle: 'CHEST', secondary_muscles: 'TRICEPS,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Svend Press', primary_muscle: 'CHEST', secondary_muscles: 'SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

      // Back Exercises (13)
      { name: 'Barbell Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
      { name: 'Pull-ups', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_ISSUES', default_sets: 3, default_reps: '6-12', default_rest_sec: 120 },
      { name: 'Lat Pulldowns', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Deadlifts', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS,QUADS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '3-6', default_rest_sec: 300 },
      { name: 'Dumbbell Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'T-Bar Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
      { name: 'Seated Cable Rows', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Hyper-extensions', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
      { name: 'Chin-ups', primary_muscle: 'BACK', secondary_muscles: 'BICEPS,LATS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '6-10', default_rest_sec: 90 },
      { name: 'Renegade Rows', primary_muscle: 'BACK', secondary_muscles: 'CORE,SHOULDERS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Lat Pullover', primary_muscle: 'BACK', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Single-Arm Lat Pulldown', primary_muscle: 'BACK', secondary_muscles: 'BICEPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Good Mornings', primary_muscle: 'BACK', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },

      // Legs Exercises (19)
      { name: 'Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 180 },
      { name: 'Leg Press', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
      { name: 'Leg Curls', primary_muscle: 'HAMSTRINGS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Romanian Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '6-8', default_rest_sec: 120 },
      { name: 'Leg Extensions', primary_muscle: 'QUADS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
      { name: 'Bulgarian Split Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 90 },
      { name: 'Calf Raises', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '15-20', default_rest_sec: 60 },
      { name: 'Goblet Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,CORE', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Lunges', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Box Jumps', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,CALVES', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN,ANKLE_INJURY', default_sets: 3, default_reps: '5-8', default_rest_sec: 90 },
      { name: 'Hip Thrusts', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
      { name: 'Step-ups', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Sumo Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'QUADS,GLUTES,BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '5-6', default_rest_sec: 180 },
      { name: 'Hack Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'MACHINE', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
      { name: 'Box Squats', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'SQUAT', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN', default_sets: 4, default_reps: '6-8', default_rest_sec: 150 },
      { name: 'Jefferson Curls', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'BACK', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 2, default_reps: '8-10', default_rest_sec: 90 },
      { name: 'Stiff-Legged Deadlifts', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,BACK', movement_pattern: 'HINGE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '6-8', default_rest_sec: 120 },
      { name: 'Glute Bridges', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES,HAMSTRINGS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
      { name: 'Wall Sits', primary_muscle: 'QUADS', secondary_muscles: 'LEGS', movement_pattern: 'ISOMETRIC', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '30-60s', default_rest_sec: 60 },

      // Shoulders Exercises (12)
      { name: 'Overhead Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '6-8', default_rest_sec: 180 },
      { name: 'Dumbbell Shoulder Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS,CHEST', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 120 },
      { name: 'Lateral Raises', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 60 },
      { name: 'Face Pulls', primary_muscle: 'SHOULDERS', secondary_muscles: 'REAR_DELTS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
      { name: 'Front Raises', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Rear Delt Flyes', primary_muscle: 'SHOULDERS', secondary_muscles: 'BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
      { name: 'Arnold Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Upright Rows', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRAPS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Shrugs', primary_muscle: 'SHOULDERS', secondary_muscles: 'BACK', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },
      { name: 'Push Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'LEGS,TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '5-6', default_rest_sec: 180 },
      { name: 'Behind the Neck Press', primary_muscle: 'SHOULDERS', secondary_muscles: 'TRICEPS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'ADVANCED', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '8-10', default_rest_sec: 120 },
      { name: 'Car driver shoulder raise', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'RAISE', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

      // Arms Exercises (15)
      { name: 'Barbell Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Dumbbell Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Hammer Curls', primary_muscle: 'BICEPS', secondary_muscles: 'FOREARMS', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
      { name: 'Preacher Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'ELBOW_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Concentration Curls', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'PULL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Tricep Dips', primary_muscle: 'TRICEPS', secondary_muscles: 'CHEST,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'SHOULDER_PAIN', default_sets: 3, default_reps: '6-12', default_rest_sec: 120 },
      { name: 'Rope Pushdowns', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'CABLE', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-15', default_rest_sec: 60 },
      { name: 'Skull Crushers', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: 'ELBOW_PAIN', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Overhead Tricep Extension', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
      { name: 'Close-Grip Bench Press', primary_muscle: 'TRICEPS', secondary_muscles: 'CHEST,SHOULDERS', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 4, default_reps: '6-8', default_rest_sec: 120 },
      { name: 'Incline Dumbbell Curl', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 90 },
      { name: 'Reverse Grip Barbell Curl', primary_muscle: 'BICEPS', secondary_muscles: 'FOREARMS', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Spider Curl', primary_muscle: 'BICEPS', secondary_muscles: '', movement_pattern: 'CURL', category: 'STRENGTH', equipment: 'BARBELL', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 90 },
      { name: 'Lying Tricep Extensions', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 75 },
      { name: 'Single Arm Dumbbell Kickbacks', primary_muscle: 'TRICEPS', secondary_muscles: '', movement_pattern: 'PUSH', category: 'STRENGTH', equipment: 'DUMBBELLS', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '12-15', default_rest_sec: 60 },

      // Core Exercises (12)
      { name: 'Planks', primary_muscle: 'CORE', secondary_muscles: 'SHOULDERS,BACK', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-60s', default_rest_sec: 60 },
      { name: 'Cable Woodchops', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'PULL', category: 'CORE', equipment: 'CABLE', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Hanging Leg Raises', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'PULL', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '8-12', default_rest_sec: 75 },
      { name: 'Russian Twists', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 45 },
      { name: 'Ab Wheel Rollouts', primary_muscle: 'CORE', secondary_muscles: 'BACK,SHOULDERS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10', default_rest_sec: 90 },
      { name: 'Dead Bug', primary_muscle: 'CORE', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 45 },
      { name: 'Bird Dog', primary_muscle: 'CORE', secondary_muscles: 'BACK', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '10-12', default_rest_sec: 45 },
      { name: 'Bicycle Crunches', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'NECK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 45 },
      { name: 'V-ups', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '10-12', default_rest_sec: 60 },
      { name: 'Windshield Wipers', primary_muscle: 'CORE', secondary_muscles: 'OBLIQUES', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'ADVANCED', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '8-10 reps', default_rest_sec: 90 },
      { name: 'Flutter Kicks', primary_muscle: 'CORE', secondary_muscles: 'HIP_FLEXORS', movement_pattern: 'DYNAMIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
      { name: 'Hollow Body Hold', primary_muscle: 'CORE', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'CORE', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 60 },

      // Cardio Exercises (10)
      { name: 'Burpees', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR,CHEST', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'INTERMEDIATE', contraindications: 'KNEE_PAIN,WRIST_PAIN', default_sets: 3, default_reps: '10-15', default_rest_sec: 90 },
      { name: 'Jumping Jacks', primary_muscle: 'LEGS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
      { name: 'High Knees', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 3, default_reps: '30-45s', default_rest_sec: 45 },
      { name: 'Kettlebell Swings', primary_muscle: 'HAMSTRINGS', secondary_muscles: 'GLUTES,CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'DUMBBELLS', skill_level: 'INTERMEDIATE', contraindications: 'LOWER_BACK_PAIN', default_sets: 3, default_reps: '15-20', default_rest_sec: 60 },
      { name: 'Shadow Boxing', primary_muscle: 'SHOULDERS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 3, default_reps: '2-3 mins', default_rest_sec: 60 },
      { name: 'Jump Rope', primary_muscle: 'LEGS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'ANKLE_INJURY', default_sets: 3, default_reps: '1-2 mins', default_rest_sec: 60 },
      { name: 'Mountain Climbers', primary_muscle: 'CORE', secondary_muscles: 'CARDIOVASCULAR,SHOULDERS', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 3, default_reps: '20-30', default_rest_sec: 60 },
      { name: 'Rowing Machine Interval', primary_muscle: 'BACK', secondary_muscles: 'CARDIOVASCULAR,LEGS', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: 'LOWER_BACK_PAIN', default_sets: 4, default_reps: '500m sprint', default_rest_sec: 120 },
      { name: 'Stationary Cycling', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 1, default_reps: '10 mins HIIT', default_rest_sec: 60 },
      { name: 'Elliptical training session', primary_muscle: 'QUADS', secondary_muscles: 'CARDIOVASCULAR', movement_pattern: 'DYNAMIC', category: 'CARDIO', equipment: 'MACHINE', skill_level: 'BEGINNER', contraindications: '', default_sets: 1, default_reps: '15 mins', default_rest_sec: 0 },

      // Mobility & Stretching (13)
      { name: 'World\'s Greatest Stretch', primary_muscle: 'LEGS', secondary_muscles: 'SHOULDERS,BACK', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '5-6 per side', default_rest_sec: 45 },
      { name: 'Cat-Cow Stretch', primary_muscle: 'BACK', secondary_muscles: 'CORE', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
      { name: 'Deep Squat Hold', primary_muscle: 'QUADS', secondary_muscles: 'GLUTES,HIPS', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 2, default_reps: '30-45s', default_rest_sec: 30 },
      { name: 'Shoulder Dislocations', primary_muscle: 'SHOULDERS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'RESISTANCE_BANDS', skill_level: 'BEGINNER', contraindications: 'SHOULDER_IMPINGEMENT', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
      { name: 'Thoracic Extensions', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '10-12 reps', default_rest_sec: 30 },
      { name: 'Cobra Stretch', primary_muscle: 'BACK', secondary_muscles: 'CORE', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30-45s', default_rest_sec: 30 },
      { name: 'Child\'s Pose', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '45-60s', default_rest_sec: 30 },
      { name: 'Hamstring Stretch', primary_muscle: 'HAMSTRINGS', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30s per side', default_rest_sec: 30 },
      { name: 'Calf Stretch', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '30s per side', default_rest_sec: 30 },
      { name: 'Wrist Mobility Curls', primary_muscle: 'FOREARMS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'WRIST_PAIN', default_sets: 2, default_reps: '15-20 reps', default_rest_sec: 30 },
      { name: 'Pigeon Stretch', primary_muscle: 'LEGS', secondary_muscles: 'GLUTES', movement_pattern: 'ISOMETRIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: 'KNEE_PAIN', default_sets: 2, default_reps: '45s per side', default_rest_sec: 30 },
      { name: 'Thread the Needle', primary_muscle: 'BACK', secondary_muscles: 'SHOULDERS', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '8-10 per side', default_rest_sec: 30 },
      { name: 'Ankle Dorsiflexion stretch', primary_muscle: 'LEGS', secondary_muscles: '', movement_pattern: 'DYNAMIC', category: 'MOBILITY', equipment: 'BODYWEIGHT', skill_level: 'BEGINNER', contraindications: '', default_sets: 2, default_reps: '12-15 reps', default_rest_sec: 30 }
    ]

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO exercises (name, primary_muscle, secondary_muscles, movement_pattern, category, equipment, skill_level, contraindications, default_sets, default_reps, default_rest_sec)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const ex of exercises) {
      stmt.run(
        ex.name,
        ex.primary_muscle,
        ex.secondary_muscles,
        ex.movement_pattern,
        ex.category,
        ex.equipment,
        ex.skill_level,
        ex.contraindications,
        ex.default_sets,
        ex.default_reps,
        ex.default_rest_sec
      )
    }
  } catch (error) {
    console.error('Seeding exercises error:', error)
  }
}

// GET all exercises with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    seedExercises()

    const { searchParams } = new URL(request.url)
    const muscle = searchParams.get('muscle')
    const pattern = searchParams.get('pattern')
    const equipment = searchParams.get('equipment')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200')))
    const offset = (page - 1) * limit

    // Build query with proper parameterization
    const stmt = db.prepare(`
      SELECT * FROM exercises
      WHERE 1=1
        AND (? IS NULL OR primary_muscle = ? OR secondary_muscles LIKE ?)
        AND (? IS NULL OR movement_pattern = ?)
        AND (? IS NULL OR equipment LIKE ?)
      ORDER BY primary_muscle, name
      LIMIT ? OFFSET ?
    `)

    const exercises = stmt.all(
      muscle, muscle, muscle ? `%${muscle}%` : null,
      pattern, pattern,
      equipment, equipment ? `%${equipment}%` : null,
      limit,
      offset
    ) as any[]

    // Get total count for pagination
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM exercises
      WHERE 1=1
        AND (? IS NULL OR primary_muscle = ? OR secondary_muscles LIKE ?)
        AND (? IS NULL OR movement_pattern = ?)
        AND (? IS NULL OR equipment LIKE ?)
    `)

    const countResult = countStmt.get(
      muscle, muscle, muscle ? `%${muscle}%` : null,
      pattern, pattern,
      equipment, equipment ? `%${equipment}%` : null
    ) as any

    return NextResponse.json({
      data: exercises,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
      },
    })
  } catch (error) {
    console.error('Exercises fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}

// POST create a new exercise (Admin/Coach only)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COACH')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Insert new exercise
    const stmt = db.prepare(`
      INSERT INTO exercises (
        name, primary_muscle, secondary_muscles, movement_pattern, category, equipment, skill_level, contraindications, default_sets, default_reps, default_rest_sec
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
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
      default_rest_sec
    )

    return NextResponse.json({
      success: true,
      exerciseId: result.lastInsertRowid,
      name
    })
  } catch (error: any) {
    console.error('Exercise creation error:', error)
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Exercise name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
  }
}
