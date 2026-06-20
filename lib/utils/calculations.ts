export function calculateOneRepMax(weight: number, reps: number, rpe: number): number {
  // Epley formula adjusted for RPE
  const rpeAdjustment = 1 + (10 - rpe) * 0.025
  return weight * (1 + reps / 30) * rpeAdjustment
}

export function calculateTonnage(sets: Array<{reps: number, weight: number}>): number {
  return sets.reduce((total, set) => total + (set.reps * set.weight), 0)
}

export function calculateProgress(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / oldValue) * 100
}

export function calculateAdherence(completedWorkouts: number, plannedWorkouts: number): number {
  if (plannedWorkouts === 0) return 0
  return (completedWorkouts / plannedWorkouts) * 100
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function parseRepRange(repRange: string): { min: number, max: number } {
  const [min, max] = repRange.split('-').map(Number)
  return { min, max: max || min }
}