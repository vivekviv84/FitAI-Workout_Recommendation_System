'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Flame,
  Dumbbell,
  Clock,
  CheckCircle,
  ArrowRight,
  Brain,
  Zap,
  Trophy,
  AlertTriangle,
  Play
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { useExperimentStore } from '@/lib/stores/experiment-store'
import { habitEngine } from '@/lib/ai/habit-engine'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EnhancedDashboardPage() {
  const { user } = useAuthStore()
  const { 
    habitData, 
    currentPlan, 
    currentWorkout,
    getStreakInsights, 
    getProgressInsights, 
    getHabitRecommendations,
    updateHabitData
  } = useEnhancedWorkoutStore()
  const { trackEvent } = useExperimentStore()
  
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [habitInsights, setHabitInsights] = useState<any[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

  useEffect(() => {
    // Update habit data on page load
    updateHabitData()

    // Find today's workout
    if (currentPlan) {
      const today = new Date().toISOString().split('T')[0]
      const workout = currentPlan.weeks.flat().find(day => day.date === today)
      setTodaysWorkout(workout)
    }

    // Generate AI insights
    const insights = habitEngine.generateHabitInsights(habitData, {})
    setHabitInsights(insights)

    // Get habit recommendations
    const recommendations = getHabitRecommendations()
    setAiRecommendations(recommendations)

    // Track dashboard view
    trackEvent('dashboard', 'page_view')
  }, [currentPlan, habitData])

  const streakInsights = getStreakInsights()
  const progressInsights = getProgressInsights()
  const habitStrength = habitEngine.calculateHabitStrength(habitData)

  const enhancedStats = [
    {
      title: 'Habit Strength',
      value: `${Math.round(habitStrength * 100)}%`,
      description: 'Overall habit formation',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+5%'
    },
    {
      title: 'Current Streak',
      value: `${streakInsights.currentStreak} days`,
      description: 'Consecutive workout days',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: streakInsights.currentStreak > streakInsights.longestStreak ? 'New record!' : ''
    },
    {
      title: 'AI Confidence',
      value: `${Math.round((currentPlan?.confidence || 0.85) * 100)}%`,
      description: 'Plan-profile match',
      icon: Brain,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: 'High match'
    },
    {
      title: 'Weekly Progress',
      value: `${habitData.currentWeekWorkouts}/${habitData.weeklyGoal}`,
      description: 'This week\'s sessions',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: `${Math.round((habitData.currentWeekWorkouts / habitData.weeklyGoal) * 100)}%`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <aside className="hidden lg:block border-r bg-white">
          <Sidebar />
        </aside>
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name || 'Athlete'}! 
                    {streakInsights.currentStreak > 0 && '🔥'}
                  </h1>
                  <p className="text-muted-foreground">
                    {streakInsights.currentStreak > 0 ? 
                      `${streakInsights.currentStreak} day streak! Keep the momentum going.` :
                      'Ready to start building healthy habits? Let\'s begin today.'
                    }
                  </p>
                </div>
                {habitStrength > 0.8 && (
                  <Badge variant="default" className="px-4 py-2">
                    <Trophy className="mr-1 h-4 w-4" />
                    Habit Master
                  </Badge>
                )}
              </div>

              {/* Quick habit insights */}
              {habitInsights.filter(insight => insight.priority === 'high').length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {habitInsights.find(insight => insight.priority === 'high')?.message}
                    <Button variant="link" className="p-0 h-auto ml-2 text-orange-700">
                      {habitInsights.find(insight => insight.priority === 'high')?.actionable}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {enhancedStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title} className="shadow-sm hover:shadow-md transition-all hover:scale-105">
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
                      {stat.trend && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {stat.trend}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Today's Workout */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-2 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Today&apos;s Workout</span>
                        </CardTitle>
                        <CardDescription>
                          {todaysWorkout ? todaysWorkout.label : 'Active Recovery Day'}
                        </CardDescription>
                      </div>
                      {todaysWorkout && (
                        <Badge variant={todaysWorkout.deload ? 'secondary' : 'default'}>
                          {todaysWorkout.deload ? 'Deload Week' : 'Training Day'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {todaysWorkout ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {todaysWorkout.exercises.slice(0, 4).map((exercise: any) => (
                            <div key={exercise.id} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-sm">{exercise.name}</p>
                                <Target className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  RPE {exercise.target_rpe}
                                </Badge>
                              </div>
                              {exercise.rationale && (
                                <p className="text-xs text-blue-600 mt-1 truncate">
                                  {exercise.rationale.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button className="flex-1" asChild>
                            <Link href="/workout">
                              <Play className="mr-2 h-4 w-4" />
                              Start Workout
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href="/plan">View Full Plan</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">Rest & Recovery Day</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Recovery is when the magic happens. Your muscles grow during rest.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" asChild>
                            <Link href="/library?category=mobility">
                              <Zap className="mr-2 h-4 w-4" />
                              Mobility Work
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href="/progress">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              View Progress
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights & Quick Actions */}
              <div className="space-y-6">
                {/* AI Insights */}
                <Card className="shadow-sm border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Brain className="h-4 w-4" />
                      <span>AI Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {habitInsights.slice(0, 2).map((insight, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                        <div className="flex items-start space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{insight.message}</p>
                            <p className="text-xs text-muted-foreground">{insight.actionable}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {aiRecommendations.slice(0, 1).map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-700">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/plan/generate">
                        <Target className="mr-2 h-4 w-4" />
                        Regenerate Plan
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/enhanced-progress">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Enhanced Analytics
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/habits">
                        <Flame className="mr-2 h-4 w-4" />
                        Habit Insights
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Habit Formation Progress */}
                <Card className="shadow-sm bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span>Habit Formation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress to Automatic Habit</span>
                        <span className="font-medium">
                          {Math.round((streakInsights.currentStreak / 66) * 100)}%
                        </span>
                      </div>
                      <Progress value={(streakInsights.currentStreak / 66) * 100} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {66 - streakInsights.currentStreak} days to automatic habit
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Weekly Consistency</span>
                        <span className="font-medium">
                          {Math.round(streakInsights.weeklyProgress * 100)}%
                        </span>
                      </div>
                      <Progress value={streakInsights.weeklyProgress * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Plan Confidence & Performance */}
            {currentPlan && (
              <Card className="mt-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    <span>AI Plan Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Intelligent optimization insights for your current plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {Math.round((currentPlan.confidence || 0.85) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <p className="text-xs text-green-600 mt-1">High profile match</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Math.round((currentPlan.expectedAdherence || 0.8) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Predicted Adherence</p>
                      <p className="text-xs text-blue-600 mt-1">Above average</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {Math.round((currentPlan.balanceScore || 0.9) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Balance Score</p>
                      <p className="text-xs text-purple-600 mt-1">Optimal distribution</p>
                    </div>
                  </div>

                  {currentPlan.rationale && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-700">
                        <strong>AI Rationale:</strong> {currentPlan.rationale}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}