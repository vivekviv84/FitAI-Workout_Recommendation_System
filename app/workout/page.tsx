'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Dumbbell,
  Target,
  Zap,
  Timer,
  RotateCcw
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useWorkoutStore } from '@/lib/stores/workout-store'
import { calculateOneRepMax, calculateTonnage, formatTime } from '@/lib/utils/calculations'
import { toast } from 'sonner'

function WorkoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayId = searchParams.get('dayId')

  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  
  const { 
    currentWorkout, 
    setCurrentWorkout, 
    completeSet, 
    completeWorkout, 
    logSet: storeLogSet,
    fetchWorkout,
    fetchPlans,
    currentPlan
  } = useWorkoutStore()

  // Fetch plans on mount to load active plan days
  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Load workout day dynamically based on URL parameter or today-date fallback
  useEffect(() => {
    const loadWorkout = async () => {
      if (dayId) {
        await fetchWorkout(dayId)
      } else if (currentPlan?.days) {
        const todayStr = new Date().toISOString().split('T')[0]
        const todaysWorkoutObj = (currentPlan.days as any[]).find(day => day.date === todayStr)
        if (todaysWorkoutObj) {
          await fetchWorkout(todaysWorkoutObj.id)
        } else {
          setCurrentWorkout(null)
        }
      } else {
        setCurrentWorkout(null)
      }
    }
    loadWorkout()
  }, [dayId, currentPlan, fetchWorkout, setCurrentWorkout])

  // Main workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(timer => {
          if (timer <= 1) {
            setIsResting(false)
            toast.success('Rest complete! Time for your next set.')
            return 0
          }
          return timer - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const startWorkout = () => {
    setIsRunning(true)
    setTimer(0)
    toast.success('Workout started! Let\'s do this! 💪')
  }

  const finishWorkout = async () => {
    setIsRunning(false)
    if (currentWorkout?.id) {
      try {
        await completeWorkout(currentWorkout.id)
        toast.success('Workout completed! Great job!')
        router.push('/dashboard')
      } catch (err: any) {
        toast.error(err.message || 'Failed to complete workout')
      }
    }
  }

  const logSet = async (exerciseId: string, reps: number, weight: number, rpe: number) => {
    const currentExercise = currentWorkout?.exercises.find(ex => ex.id === exerciseId)
    if (!currentExercise) return

    const setIndex = currentExercise.completedSets?.length || 0

    try {
      // workoutExerciseId is exerciseId
      await storeLogSet(exerciseId, setIndex + 1, reps, weight, rpe)
      completeSet(exerciseId, setIndex, reps, weight, rpe)
      
      // Start rest timer
      setRestTimer(currentExercise.rest_sec)
      setIsResting(true)
      
      toast.success(`Set logged: ${reps} reps @ ${weight}kg (RPE ${rpe})`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to log set')
    }
  }

  const getCurrentExercise = () => {
    if (!currentWorkout) return null
    return currentWorkout.exercises[currentExerciseIndex]
  }

  const completedSets = getCurrentExercise()?.completedSets?.length || 0
  const totalSets = getCurrentExercise()?.sets || 0
  const completedExercises = currentWorkout ? 
    currentWorkout.exercises.filter((ex: any) => (ex.completedSets?.length || 0) >= ex.sets).length : 0
  const totalExercises = currentWorkout ? currentWorkout.exercises.length : 0
  const workoutProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  if (!currentWorkout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">No workout scheduled</h2>
              <p className="text-muted-foreground">Check your plan or generate a new one</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Workout Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{currentWorkout.label}</h1>
              <p className="text-muted-foreground">
                {currentWorkout.exercises.length} exercises
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Timer className="mr-2 h-4 w-4" />
              {formatTime(timer)}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workout Progress</span>
              <span>{Math.round(workoutProgress)}%</span>
            </div>
            <Progress value={workoutProgress} className="h-3" />
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {formatTime(restTimer)}
                </div>
                <p className="text-orange-700">Rest time remaining</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsResting(false)
                    setRestTimer(0)
                  }}
                  className="mt-3"
                >
                  Skip Rest
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Current Exercise and Tracker Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Exercise */}
            <Card className="shadow-lg border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{getCurrentExercise()?.name}</CardTitle>
                    <CardDescription>
                      Set {completedSets + 1} of {totalSets} • Target: {getCurrentExercise()?.reps} reps @ RPE {getCurrentExercise()?.target_rpe}
                    </CardDescription>
                  </div>
                  <Badge variant={completedSets === totalSets ? 'default' : 'secondary'}>
                    {completedSets === totalSets ? 'Complete' : 'In Progress'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SetLogger
                  exercise={getCurrentExercise()}
                  onLogSet={logSet}
                  disabled={isResting || completedSets >= totalSets}
                />
              </CardContent>
            </Card>

            {/* Workout Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex space-x-4">
                  {!isRunning ? (
                    <Button onClick={startWorkout} className="w-full" size="lg">
                      <Play className="mr-2 h-5 w-5" />
                      Start Workout
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsRunning(false)}
                        className="flex-1"
                        size="lg"
                      >
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </Button>
                      <Button
                        onClick={finishWorkout}
                        className="flex-1"
                        size="lg"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Finish Workout
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Exercise List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Today&apos;s Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentWorkout.exercises.map((exercise, index) => {
                    const completed = (exercise.completedSets?.length || 0) >= exercise.sets
                    const isCurrent = index === currentExerciseIndex
                    
                    return (
                      <div
                        key={exercise.id}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          isCurrent ? 'border-blue-500 bg-blue-50 shadow-sm' : 
                          completed ? 'border-green-200 bg-green-50' :
                          'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentExerciseIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                completed ? 'bg-green-100' : 
                                isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                {completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Dumbbell className={`h-4 w-4 ${
                                    isCurrent ? 'text-blue-600' : 'text-gray-600'
                                  }`} />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">{exercise.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} @ RPE {exercise.target_rpe}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {exercise.completedSets?.length || 0}/{exercise.sets}
                            </p>
                            <p className="text-xs text-muted-foreground">sets</p>
                          </div>
                        </div>
                        
                        {/* Show completed sets */}
                        {exercise.completedSets && exercise.completedSets.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex flex-wrap gap-2">
                              {exercise.completedSets.map((set, setIndex) => (
                                <Badge key={setIndex} variant="outline" className="text-xs">
                                  {set.reps}×{set.weight}kg (RPE {set.rpe})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function SetLogger({ 
  exercise, 
  onLogSet, 
  disabled 
}: { 
  exercise: any
  onLogSet: (exerciseId: string, reps: number, weight: number, rpe: number) => void
  disabled: boolean
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState('')

  const handleLogSet = () => {
    if (!reps || !weight || !rpe) {
      toast.error('Please fill in all fields')
      return
    }

    onLogSet(exercise.id, parseInt(reps), parseFloat(weight), parseInt(rpe))
    
    // Reset form
    setReps('')
    setWeight('')
    setRpe('')
  }

  if (!exercise) return null

  const completedSets = exercise.completedSets?.length || 0
  const totalSets = exercise.sets

  return (
    <div className="space-y-4">
      {/* Previous Sets */}
      {exercise.completedSets && exercise.completedSets.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Completed Sets</h4>
          <div className="space-y-2">
            {exercise.completedSets.map((set: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Set {index + 1}</span>
                <div className="flex space-x-4 text-sm">
                  <span>{set.reps} reps</span>
                  <span>{set.weight}kg</span>
                  <Badge variant="outline" className="text-xs">RPE {set.rpe}</Badge>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
        </div>
      )}

      {/* Current Set Input */}
      {completedSets < totalSets && (
        <div>
          <h4 className="font-medium mb-3">Log Set {completedSets + 1}</h4>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <Label htmlFor="reps" className="text-xs">Reps</Label>
              <Input
                id="reps"
                type="number"
                placeholder="8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                placeholder="60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="rpe" className="text-xs">RPE (1-10)</Label>
              <Input
                id="rpe"
                type="number"
                min="1"
                max="10"
                placeholder="7"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleLogSet} 
            disabled={disabled || !reps || !weight || !rpe}
            className="w-full"
          >
            <Target className="mr-2 h-4 w-4" />
            Log Set
          </Button>

          {/* Estimated 1RM */}
          {reps && weight && rpe && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Estimated 1RM:</span>
                <span className="font-bold text-blue-900">
                  {calculateOneRepMax(parseFloat(weight), parseInt(reps), parseInt(rpe)).toFixed(1)}kg
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise Complete */}
      {completedSets >= totalSets && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-900">Exercise Complete!</p>
          <p className="text-sm text-green-700">
            Total volume: {calculateTonnage(exercise.completedSets || [])}kg
          </p>
        </div>
      )}
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading workout session...</p>
      </div>
    }>
      <WorkoutPageContent />
    </Suspense>
  )
}