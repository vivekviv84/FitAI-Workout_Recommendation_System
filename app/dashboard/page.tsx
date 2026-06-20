'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Flame,
  Dumbbell,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
  Activity
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useWorkoutStore } from '@/lib/stores/workout-store'
import Link from 'next/link'

// Loading Skeletons
const CardSkeleton = () => (
  <Card className="shadow-sm animate-pulse border-gray-100">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
)

const WorkoutCardSkeleton = () => (
  <Card className="shadow-sm animate-pulse border-gray-100 h-full">
    <CardHeader>
      <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
)

const ProgressSkeleton = () => (
  <Card className="shadow-sm animate-pulse border-gray-100">
    <CardHeader>
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full w-full animate-pulse"></div>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { currentPlan, fetchPlans } = useWorkoutStore()
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/progress?days=30')
      if (res.ok) {
        const data = await res.json()
        setProgressData(data)
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  useEffect(() => {
    const initDashboard = async () => {
      if (user) {
        setLoading(true)
        await Promise.all([fetchPlans(), fetchProgress()])
        setLoading(false)
      }
    }
    initDashboard()
  }, [user, fetchPlans])

  useEffect(() => {
    // Get today's workout from the plan
    if (currentPlan?.days) {
      const today = new Date().toISOString().split('T')[0]
      const workout = (currentPlan.days as any[]).find(day => day.date === today)
      setTodaysWorkout(workout)
    } else {
      setTodaysWorkout(null)
    }
  }, [currentPlan])

  // Dynamic calculations for stats
  const getWeekRange = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const start = new Date(today)
    start.setDate(today.getDate() - dayOfWeek)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0]
    }
  }

  const { startStr, endStr } = getWeekRange()
  const weekDays = (currentPlan?.days || []).filter(
    (day: any) => day.date >= startStr && day.date <= endStr
  )
  const completedWeekCount = weekDays.filter((day: any) => day.completed).length
  const totalWeekCount = weekDays.length
  const thisWeekVal = totalWeekCount > 0 ? `${completedWeekCount}/${totalWeekCount}` : '0/0'

  const todayStr = new Date().toISOString().split('T')[0]
  const nextUncompleted = (currentPlan?.days || [])
    .filter((day: any) => !day.completed)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))[0]

  let nextSessionVal = 'None'
  let nextSessionDesc = 'No upcoming session'
  if (nextUncompleted) {
    if (nextUncompleted.date === todayStr) {
      nextSessionVal = 'Today'
    } else {
      nextSessionVal = nextUncompleted.date
    }
    nextSessionDesc = nextUncompleted.label
  }

  // Calculate streak from database workout logs
  const calculateStreak = (days: any[]) => {
    const completedDays = days
      .filter((day: any) => day.completed && (day.completed_at || day.date))
      .map((day: any) => {
        const dateStr = day.completed_at ? day.completed_at.split(/[T ]/)[0] : day.date
        return dateStr
      })

    if (completedDays.length === 0) return 0

    // De-duplicate and sort descending (latest date first)
    const uniqueDates = Array.from(new Set(completedDays)).sort((a: any, b: any) => b.localeCompare(a))

    let currentStreak = 0
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // If the latest completed workout is not today or yesterday, streak is broken (0)
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0
    }

    currentStreak = 1
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i])
      const d2 = new Date(uniqueDates[i + 1])
      const diffTime = Math.abs(d1.getTime() - d2.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
      } else if (diffDays > 1) {
        break // Streak broken
      }
    }
    return currentStreak
  }

  const currentStreakVal = currentPlan?.days ? calculateStreak(currentPlan.days) : 0
  const totalCompletedWorkouts = currentPlan?.days ? currentPlan.days.filter((d: any) => d.completed).length : 0

  // Adherence: completedWorkouts / scheduledWorkouts
  const totalDays = currentPlan?.days?.length || 0
  const adherenceValue = totalDays > 0 ? Math.round((totalCompletedWorkouts / totalDays) * 100) : 0

  // Volume & Strength calculations from progress history
  const volumeHistory = progressData?.volumeHistory || []
  let volumeGrowth = 0
  let strengthGrowth = 0

  if (volumeHistory.length >= 2) {
    const lastWeekVol = volumeHistory[volumeHistory.length - 1]?.volume || 0
    const prevWeekVol = volumeHistory[volumeHistory.length - 2]?.volume || 0
    volumeGrowth = prevWeekVol > 0 ? Math.round(((lastWeekVol - prevWeekVol) / prevWeekVol) * 100) : 0

    const lastWeek1RM = volumeHistory[volumeHistory.length - 1]?.max_1rm || 0
    const prevWeek1RM = volumeHistory[volumeHistory.length - 2]?.max_1rm || 0
    strengthGrowth = prevWeek1RM > 0 ? Math.round(((lastWeek1RM - prevWeek1RM) / prevWeek1RM) * 100) : 0
  }

  const stats = [
    {
      title: 'Current Streak',
      value: `${currentStreakVal} days`,
      description: 'Keep it going!',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Total Workouts',
      value: totalCompletedWorkouts.toString(),
      description: 'Sessions completed',
      icon: Dumbbell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'This Week',
      value: thisWeekVal,
      description: 'Workouts completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Next Session',
      value: nextSessionVal,
      description: nextSessionDesc,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <aside className="hidden lg:block border-r bg-white">
            <Sidebar />
          </aside>
          
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header skeleton */}
              <div className="mb-8 space-y-2 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 rounded"></div>
                <div className="h-4 w-96 bg-gray-200 rounded"></div>
              </div>

              {/* Stats Grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WorkoutCardSkeleton />
                </div>
                <div className="space-y-6">
                  <ProgressSkeleton />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <aside className="hidden lg:block border-r bg-white">
          <Sidebar />
        </aside>
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'Athlete'}! 👋
              </h1>
              <p className="text-muted-foreground">
                Ready to crush today&apos;s workout? Let&apos;s make progress together.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Workout / Empty State */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Today&apos;s Workout</span>
                        </CardTitle>
                        <CardDescription>
                          {!currentPlan ? 'No active training plan' : todaysWorkout ? todaysWorkout.label : 'Rest Day'}
                        </CardDescription>
                      </div>
                      {todaysWorkout && (
                        <Badge variant={todaysWorkout.deload ? 'secondary' : 'default'}>
                          {todaysWorkout.deload ? 'Deload' : 'Training'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!currentPlan ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                        <h3 className="font-medium mb-2">No active training plan</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate a highly personalized training split to begin tracking your progress.
                        </p>
                        <Button asChild>
                          <Link href="/plan">Generate Training Plan</Link>
                        </Button>
                      </div>
                    ) : todaysWorkout ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {todaysWorkout.exercises.slice(0, 4).map((exercise: any) => (
                            <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{exercise.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                RPE {exercise.target_rpe}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full" asChild>
                          <Link href={`/workout?dayId=${todaysWorkout.id}`}>
                            Start Workout
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">Rest Day</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Recovery is just as important as training
                        </p>
                        <Button variant="outline" asChild>
                          <Link href="/plan">View Full Plan</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Progress */}
              <div className="space-y-6">
                {/* Weekly Progress */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      <span>Weekly Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Adherence</span>
                        <span className="font-medium">{adherenceValue}%</span>
                      </div>
                      <Progress value={adherenceValue} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Volume</span>
                        <span className="font-medium">{volumeGrowth >= 0 ? `+${volumeGrowth}` : volumeGrowth}%</span>
                      </div>
                      <Progress value={Math.max(0, Math.min(100, volumeGrowth))} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Strength</span>
                        <span className="font-medium">{strengthGrowth >= 0 ? `+${strengthGrowth}` : strengthGrowth}%</span>
                      </div>
                      <Progress value={Math.max(0, Math.min(100, strengthGrowth))} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/plan">
                        <Target className="mr-2 h-4 w-4" />
                        {currentPlan ? 'View/Regenerate Plan' : 'Generate New Plan'}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/progress">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Progress
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/library">
                        <Target className="mr-2 h-4 w-4" />
                        Browse Exercises
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}