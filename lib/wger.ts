import db from './db'

const API_KEY = process.env.WGER_API_KEY || ''

// Map Wger muscle names to application muscles
function mapMuscle(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('chest') || n.includes('pectoral') || n.includes('pectoralis')) return 'CHEST'
  if (n.includes('back') || n.includes('latissimus') || n.includes('trapezius') || n.includes('traps') || n.includes('rhomboid') || n.includes('lats')) return 'BACK'
  if (n.includes('quadriceps') || n.includes('quad') || n.includes('front thigh')) return 'QUADS'
  if (n.includes('hamstring') || n.includes('biceps femoris') || n.includes('rear thigh')) return 'HAMSTRINGS'
  if (n.includes('gluteus') || n.includes('glute') || n.includes('leg') || n.includes('calf') || n.includes('calves') || n.includes('soleus') || n.includes('thigh')) return 'LEGS'
  if (n.includes('shoulder') || n.includes('deltoid')) return 'SHOULDERS'
  if (n.includes('bicep') || n.includes('biceps')) return 'BICEPS'
  if (n.includes('tricep') || n.includes('triceps')) return 'TRICEPS'
  if (n.includes('abs') || n.includes('abdominis') || n.includes('core') || n.includes('oblique') || n.includes('rectus')) return 'CORE'
  return 'BACK' // default
}

// Map Wger equipment objects to application equipment
function mapEquipment(eqList: any[]): string {
  if (!eqList || eqList.length === 0) return 'BODYWEIGHT'
  const names = eqList.map(e => (e.name || '').toLowerCase())
  if (names.some(n => n.includes('barbell'))) return 'BARBELL'
  if (names.some(n => n.includes('dumbbell'))) return 'DUMBBELLS'
  if (names.some(n => n.includes('cable'))) return 'CABLE'
  if (names.some(n => n.includes('machine') || n.includes('press'))) return 'MACHINE'
  if (names.some(n => n.includes('band') || n.includes('rubber'))) return 'RESISTANCE_BANDS'
  if (names.some(n => n.includes('bodyweight') || n.includes('none') || n.includes('body'))) return 'BODYWEIGHT'
  return 'BODYWEIGHT' // default
}

// Map Wger category names to application categories
function mapCategory(catName: string): string {
  const c = catName.toLowerCase()
  if (c.includes('cardio')) return 'CARDIO'
  if (c.includes('core') || c.includes('abs')) return 'CORE'
  if (c.includes('stretch') || c.includes('flexibility') || c.includes('mobility')) return 'MOBILITY'
  return 'STRENGTH'
}

// Determine movement patterns based on muscle group and name
function determineMovementPattern(name: string, muscle: string, category: string): string {
  const n = name.toLowerCase()
  const m = muscle.toUpperCase()
  const c = category.toUpperCase()

  if (c === 'CARDIO') return 'DYNAMIC'
  if (c === 'CORE') return 'ISOMETRIC'
  if (n.includes('squat')) return 'SQUAT'
  if (n.includes('lunge')) return 'LUNGE'
  if (n.includes('deadlift') || n.includes('hinge') || n.includes('extension')) return 'HINGE'
  if (n.includes('curl')) return 'CURL'
  if (m === 'CHEST' || m === 'SHOULDERS' || m === 'TRICEPS') return 'PUSH'
  if (m === 'BACK' || m === 'BICEPS') return 'PULL'
  return 'COMPOUND'
}

// Maps Wger muscle tokens to Wger muscle IDs
const MUSCLE_TOKEN_TO_WGER_IDS: Record<string, number[]> = {
  'CHEST': [13, 3],
  'BACK': [4, 15],
  'QUADS': [10],
  'HAMSTRINGS': [11],
  'LEGS': [7, 8, 9, 10, 11],
  'SHOULDERS': [2],
  'BICEPS': [1],
  'TRICEPS': [5],
  'CORE': [6, 14, 12]
}

// Save Wger response object to SQLite database
function saveExerciseToDb(ex: any): string | null {
  // Find English translation
  const translation = ex.translations?.find((t: any) => t.language === 2 && t.name) || ex.translations?.[0]
  if (!translation || !translation.name) return null

  const name = translation.name
  const primary_muscle = mapMuscle(ex.muscles?.[0]?.name_en || ex.muscles?.[0]?.name || '')
  
  const secondaryMusclesList = (ex.muscles_secondary || []) as any[]
  const secondary_muscles = secondaryMusclesList
    .map(m => mapMuscle(m.name_en || m.name))
    .filter(m => m !== primary_muscle)
    .join(',')

  const category = mapCategory(ex.category?.name || 'Strength')
  const movement_pattern = determineMovementPattern(name, primary_muscle, category)
  const equipment = mapEquipment(ex.equipment)

  let contraindications = ''
  if (name.toLowerCase().includes('overhead') || name.toLowerCase().includes('shoulder press')) {
    contraindications = 'SHOULDER_IMPINGEMENT'
  } else if (name.toLowerCase().includes('deadlift') || name.toLowerCase().includes('barbell row')) {
    contraindications = 'LOWER_BACK_PAIN'
  } else if (name.toLowerCase().includes('squat') || name.toLowerCase().includes('lunge')) {
    contraindications = 'KNEE_PAIN'
  }

  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO exercises (
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
      'INTERMEDIATE',
      contraindications,
      3,
      '8-12',
      90
    )

    if (result.changes > 0) {
      return name
    }
    return null
  } catch (error) {
    console.error(`Error saving exercise ${name} to DB:`, error)
    return null
  }
}

// Dynamic dynamic sync: Fetch and save exercises for a specific muscle group
export async function fetchExercisesForMuscle(muscleToken: string, limit: number = 10): Promise<string[]> {
  const ids = MUSCLE_TOKEN_TO_WGER_IDS[muscleToken.toUpperCase()] || []
  if (ids.length === 0) return []

  const importedNames: string[] = []
  const fetchFn = global.fetch || require('node-fetch')

  for (const muscleId of ids) {
    try {
      const url = `https://wger.de/api/v2/exerciseinfo/?muscles=${muscleId}&language=2&limit=${limit}`
      const response = await fetchFn(url, {
        headers: {
          'Authorization': `Token ${API_KEY}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Wger API returned status ${response.status} for muscle ${muscleId}`)
        continue
      }

      const data = await response.json()
      const results = data.results || []

      for (const ex of results) {
        const savedName = saveExerciseToDb(ex)
        if (savedName) {
          importedNames.push(savedName)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch exercises for muscle ID ${muscleId} from Wger:`, error)
    }
  }

  return importedNames
}

// Bulk sync: Sync 50 general exercises from Wger
export async function syncWgerExercises(limit: number = 50): Promise<{ total: number; imported: string[] }> {
  const fetchFn = global.fetch || require('node-fetch')
  const imported: string[] = []

  try {
    const url = `https://wger.de/api/v2/exerciseinfo/?language=2&limit=${limit}`
    const response = await fetchFn(url, {
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Wger API returned status ${response.status}`)
    }

    const data = await response.json()
    const results = data.results || []

    for (const ex of results) {
      const savedName = saveExerciseToDb(ex)
      if (savedName) {
        imported.push(savedName)
      }
    }

    return {
      total: results.length,
      imported
    }
  } catch (error) {
    console.error('Wger bulk sync error:', error)
    throw error
  }
}
