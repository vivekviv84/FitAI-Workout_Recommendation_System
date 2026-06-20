'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp,
  Timer,
  Zap,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { formatTime, calculateOneRepMax, calculateTonnage } from '@/lib/utils/calculations'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { useExperimentStore } from '@/lib/stores/experiment-store'
import { toast } from 'sonner'

interface EnhancedWorkoutTrackerProps {
  workout: any
  onComplete: (sessionRPE: number, satisfaction: number, notes?: string) => void
}

export function EnhancedWorkoutTracker({ workout, onComplete }: EnhancedWorkoutTrackerProps) {
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [adaptiveRest, setAdaptiveRest] = useState(false)
  const [sessionRPE, setSessionRPE] = useState(7)
  const [satisfaction, setSatisfaction] = useState(4)
  const [notes, setNotes] = useState('')
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  const { completeSet, addPersonalRecord } = useEnhancedWorkoutStore()
  const { getVariant, trackEvent } = useExperimentStore()

  // A/B test for rest timer
  const restTimerVariant = getVariant('rest_timer_v1') || 'standard'

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(timer => {
          if (timer <= 1) {
            setIsResting(false)
            handleRestComplete()
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
    trackEvent('rest_timer_v1', 'workout_started')
    toast.success('Workout started! Let\'s crush it! 💪')
  }

  const handleRestComplete = () => {
    if (restTimerVariant === 'gamified') {
      toast.success('💥 Rest complete! Time to dominate your next set!')
    } else if (restTimerVariant === 'adaptive') {
      toast.success('✨ Optimal recovery reached. You\'re ready!')
    } else {
      toast.success('Rest complete! Ready for your next set.')
    }
  }

  const logSet = (exerciseId: number, reps: number, weight: number, rpe: number) => {
    const exercise = workout.exercises.find((ex: any) => ex.id === exerciseId)
    if (!exercise) return

    completeSet(exerciseId, reps, weight, rpe)
    
    // Check for PR
    const oneRepMax = calculateOneRepMax(weight, reps, rpe)
    addPersonalRecord(exerciseId, oneRepMax, reps)
    
    // Adaptive rest timer based on RPE and exercise type
    let restTime = exercise.rest_sec
    if (restTimerVariant === 'adaptive') {
      if (rpe >= 9) restTime *= 1.2 // Longer rest for high RPE
      else if (rpe <= 6) restTime *= 0.8 // Shorter rest for easy sets
    }
    
    setRestTimer(Math.floor(restTime))
    setIsResting(true)
    
    trackEvent('rest_timer_v1', 'set_completed', rpe)
    toast.success(`Set logged: ${reps} reps @ ${weight}kg (RPE ${rpe})`)
  }

  const finishWorkout = () => {
    setIsRunning(false)
    setShowCompletionModal(true)
  }

  const handleWorkoutComplete = () => {
    onComplete(sessionRPE, satisfaction, notes)
    setShowCompletionModal(false)
    trackEvent('rest_timer_v1', 'workout_completed', satisfaction)
    toast.success('Workout completed! Amazing work! 🎉')
  }

  const currentExercise = workout.exercises[currentExerciseIndex]
  const completedSets = currentExercise?.completedSets?.length || 0
  const totalSets = currentExercise?.sets || 0
  const workoutProgress = workout.exercises.reduce((acc: number, ex: any) => 
    acc + (ex.completedSets?.length || 0), 0) / 
    workout.exercises.reduce((acc: number, ex: any) => acc + ex.sets, 0) * 100

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{workout.label}</CardTitle>
              <p className="text-blue-100">
                {workout.exercises.length} exercises • {formatTime(timer)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{Math.round(workoutProgress)}%</div>
              <p className="text-blue-100 text-sm">Complete</p>
            </div>
          </div>
          <Progress value={workoutProgress} className="mt-4 bg-blue-700" />
        </CardHeader>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">
                {formatTime(restTimer)}
              </div>
              <p className="text-orange-700 mb-4">
                {restTimerVariant === 'adaptive' ? 'Adaptive Recovery Time' : 'Rest Period'}
              </p>
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsResting(false)
                    setRestTimer(0)
                  }}
                >
                  Skip Rest
                </Button>
                {restTimerVariant === 'adaptive' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestTimer(restTimer + 30)}
                  >
                    +30s
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Exercise and Tracker Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Exercise */}
          <Card className="shadow-lg border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentExercise?.name}</CardTitle>
                  <p className="text-muted-foreground">
                    Set {completedSets + 1} of {totalSets} • Target: {currentExercise?.reps} @ RPE {currentExercise?.target_rpe}
                  </p>
                  {currentExercise?.rationale && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {currentExercise.rationale.join(', ')}
                      </Badge>
                    </div>
                  )}
                </div>
                <Badge variant={completedSets >= totalSets ? 'default' : 'secondary'}>
                  {completedSets >= totalSets ? 'Complete' : 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedSetLogger
                exercise={currentExercise}
                onLogSet={logSet}
                disabled={isResting || completedSets >= totalSets}
                variant={restTimerVariant}
              />
            </CardContent>
          </Card>

          {/* Workout Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-3">
                {!isRunning ? (
                  <Button onClick={startWorkout} size="lg" className="flex-1">
                    <Play className="mr-2 h-5 w-5" />
                    Start Workout
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsRunning(false)}
                      size="lg"
                      className="flex-1"
                    >
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </Button>
                    <Button
                      onClick={finishWorkout}
                      size="lg"
                      className="flex-1"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Finish
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Exercise Navigation */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Today&apos;s Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workout.exercises.map((exercise: any, index: number) => {
                  const completed = (exercise.completedSets?.length || 0) >= exercise.sets
                  const isCurrent = index === currentExerciseIndex
                  
                  return (
                    <div
                      key={exercise.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isCurrent ? 'border-blue-500 bg-blue-50 shadow-md' : 
                        completed ? 'border-green-200 bg-green-50' :
                        'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setCurrentExerciseIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            completed ? 'bg-green-100' : 
                            isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Target className={`h-4 w-4 ${
                                isCurrent ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exercise.sets} × {exercise.reps} @ RPE {exercise.target_rpe}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {exercise.completedSets?.length || 0}/{exercise.sets}
                          </p>
                          <p className="text-xs text-muted-foreground">sets</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Workout Complete! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Overall Session RPE (1-10)</Label>
                <Slider
                  value={[sessionRPE]}
                  onValueChange={(value) => setSessionRPE(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Very Easy</span>
                  <span className="font-medium">RPE {sessionRPE}</span>
                  <span>Max Effort</span>
                </div>
              </div>

              <div>
                <Label>Satisfaction (1-5)</Label>
                <Slider
                  value={[satisfaction]}
                  onValueChange={(value) => setSatisfaction(value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Poor</span>
                  <span className="font-medium">{satisfaction} stars</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="How did the workout feel? Any observations?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCompletionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWorkoutComplete} className="flex-1">
                  Complete Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function EnhancedSetLogger({ 
  exercise, 
  onLogSet, 
  disabled,
  variant 
}: { 
  exercise: any
  onLogSet: (exerciseId: number, reps: number, weight: number, rpe: number) => void
  disabled: boolean
  variant: string
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState(7)

  const handleLogSet = () => {
    if (!reps || !weight) {
      toast.error('Please enter reps and weight')
      return
    }

    onLogSet(exercise.id, parseInt(reps), parseFloat(weight), rpe)
    
    // Reset form
    setReps('')
    setWeight('')
    setRpe(7)
  }

  if (!exercise) return null

  const completedSets = exercise.completedSets?.length || 0
  const totalSets = exercise.sets
  const lastSet = exercise.completedSets?.[exercise.completedSets.length - 1]

  return (
    <div className="space-y-4">
      {/* Previous Sets */}
      {exercise.completedSets && exercise.completedSets.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Completed Sets</h4>
          <div className="space-y-2">
            {exercise.completedSets.map((set: any, index: number) => {
              const oneRM = calculateOneRepMax(set.weight, set.reps, set.rpe)
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">Set {index + 1}</Badge>
                    <span className="text-sm">
                      {set.reps} × {set.weight}kg @ RPE {set.rpe}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">~{oneRM.toFixed(1)}kg</p>
                    <p className="text-xs text-muted-foreground">est. 1RM</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Current Set Input */}
      {completedSets < totalSets && (
        <div className="space-y-4">
          <h4 className="font-medium">Log Set {completedSets + 1}</h4>
          
          {/* Quick suggestions based on last set */}
          {lastSet && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReps(lastSet.reps.toString())
                  setWeight(lastSet.weight.toString())
                  setRpe(lastSet.rpe)
                }}
              >
                Repeat Last: {lastSet.reps}×{lastSet.weight}kg
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReps(lastSet.reps.toString())
                  setWeight((lastSet.weight + 2.5).toString())
                  setRpe(lastSet.rpe)
                }}
              >
                +2.5kg: {lastSet.reps}×{lastSet.weight + 2.5}kg
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="reps">Reps</Label>
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
              <Label htmlFor="weight">Weight (kg)</Label>
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
          </div>

          <div>
            <Label>RPE (Rate of Perceived Exertion)</Label>
            <Slider
              value={[rpe]}
              onValueChange={(value) => setRpe(value[0])}
              max={10}
              min={1}
              step={1}
              className="mt-2"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Easy</span>
              <span className="font-medium">RPE {rpe}</span>
              <span>Max</span>
            </div>
          </div>
          
          <Button 
            onClick={handleLogSet} 
            disabled={disabled || !reps || !weight}
            className="w-full"
            size="lg"
          >
            <Target className="mr-2 h-4 w-4" />
            Log Set
          </Button>

          {/* Enhanced feedback */}
          {reps && weight && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium">Estimated 1RM</p>
                <p className="text-lg font-bold text-blue-900">
                  {calculateOneRepMax(parseFloat(weight), parseInt(reps), rpe).toFixed(1)}kg
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium">Set Volume</p>
                <p className="text-lg font-bold text-green-900">
                  {(parseInt(reps) * parseFloat(weight)).toFixed(1)}kg
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise Complete */}
      {completedSets >= totalSets && (
        <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="font-bold text-green-900 text-lg">Exercise Complete! 🎉</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-green-600">Total Volume</p>
              <p className="text-xl font-bold text-green-900">
                {calculateTonnage(exercise.completedSets || [])}kg
              </p>
            </div>
            <div>
              <p className="text-sm text-green-600">Avg RPE</p>
              <p className="text-xl font-bold text-green-900">
                {exercise.completedSets?.length ? 
                  (exercise.completedSets.reduce((sum: number, set: any) => sum + set.rpe, 0) / exercise.completedSets.length).toFixed(1) : 
                  '-'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}