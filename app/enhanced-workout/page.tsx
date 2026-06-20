'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { EnhancedWorkoutTracker } from '@/components/workout/enhanced-workout-tracker'
import { HabitNudge } from '@/components/common/habit-nudge'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function EnhancedWorkoutPage() {
  const router = useRouter()
  const { currentWorkout, setCurrentWorkout, completeWorkout } = useEnhancedWorkoutStore()

  useEffect(() => {
    // Mock enhanced workout data
    if (!currentWorkout) {
      setCurrentWorkout({
        id: 'enhanced-today',
        date: new Date().toISOString().split('T')[0],
        label: 'Push Day - Week 2',
        deload: false,
        exercises: [
          {
            id: 1,
            name: 'Barbell Bench Press',
            primary_muscle: 'CHEST',
            sets: 4,
            reps: '6-8',
            target_rpe: 7,
            rest_sec: 180,
            tempo: '2-0-2',
            completedSets: [],
            rationale: ['optimized for muscle gain', 'high ML prediction score']
          },
          {
            id: 2,
            name: 'Overhead Press',
            primary_muscle: 'SHOULDERS',
            sets: 3,
            reps: '8-10',
            target_rpe: 7,
            rest_sec: 120,
            tempo: '2-0-1',
            completedSets: [],
            rationale: ['matches intermediate level', 'good historical performance']
          },
          {
            id: 3,
            name: 'Dumbbell Incline Press',
            primary_muscle: 'CHEST',
            sets: 3,
            reps: '10-12',
            target_rpe: 8,
            rest_sec: 90,
            tempo: '2-0-2',
            completedSets: [],
            rationale: ['progressive overload applied', 'upper chest focus']
          },
          {
            id: 4,
            name: 'Lateral Raises',
            primary_muscle: 'SHOULDERS',
            sets: 3,
            reps: '12-15',
            target_rpe: 7,
            rest_sec: 60,
            tempo: '1-1-2',
            completedSets: [],
            rationale: ['shoulder isolation', 'time efficient']
          },
          {
            id: 5,
            name: 'Tricep Dips',
            primary_muscle: 'TRICEPS',
            sets: 3,
            reps: '8-12',
            target_rpe: 8,
            rest_sec: 90,
            tempo: '2-0-1',
            completedSets: [],
            rationale: ['compound tricep movement', 'bodyweight available']
          }
        ]
      })
    }
  }, [currentWorkout, setCurrentWorkout])

  const handleWorkoutComplete = (sessionRPE: number, satisfaction: number, notes?: string) => {
    completeWorkout(sessionRPE, satisfaction, notes)
    router.push('/dashboard')
  }

  if (!currentWorkout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No workout scheduled</h2>
              <p className="text-muted-foreground mb-4">
                Today is a rest day. Recovery is when your muscles grow!
              </p>
              <Button variant="outline" asChild>
                <Link href="/plan">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Full Plan
                </Link>
              </Button>
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
        {/* Habit Nudge */}
        <div className="mb-6">
          <HabitNudge />
        </div>

        {/* Enhanced Workout Tracker */}
        <EnhancedWorkoutTracker 
          workout={currentWorkout} 
          onComplete={handleWorkoutComplete}
        />
      </main>
    </div>
  )
}