'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Flame, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { habitEngine } from '@/lib/ai/habit-engine'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function HabitsPage() {
  const { 
    habitData, 
    progressMetrics, 
    getStreakInsights, 
    getHabitRecommendations 
  } = useEnhancedWorkoutStore()
  
  const [habitInsights, setHabitInsights] = useState<any[]>([])
  const [behaviorStrategies, setBehaviorStrategies] = useState<any[]>([])

  useEffect(() => {
    // Generate comprehensive habit insights
    const insights = habitEngine.generateHabitInsights(habitData, progressMetrics)
    setHabitInsights(insights)

    // Get behavior change strategies
    const strategies = habitEngine.applyBehaviorStrategies({ goal: 'MUSCLE_GAIN' }, habitData)
    setBehaviorStrategies(strategies)
  }, [habitData, progressMetrics])

  const streakInsights = getStreakInsights()
  const recommendations = getHabitRecommendations()
  const habitStrength = habitEngine.calculateHabitStrength(habitData)

  // Mock habit formation data
  const habitFormationData = [
    { phase: 'Initiation', value: 85, description: 'Starting new behaviors' },
    { phase: 'Learning', value: 72, description: 'Building neural pathways' },
    { phase: 'Stability', value: 68, description: 'Consistent execution' },
    { phase: 'Automaticity', value: 45, description: 'Unconscious habits' },
  ]

  const weeklyConsistency = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    consistency: Math.max(0.4, Math.min(1.0, 0.7 + Math.random() * 0.3 - (i > 8 ? 0.1 : 0))),
    target: 0.8
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <aside className="hidden lg:block border-r bg-white">
          <Sidebar />
        </aside>
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Habit Formation & Insights</h1>
              <p className="text-muted-foreground">
                Science-backed strategies to build lasting fitness habits
              </p>
            </div>

            {/* Habit Strength Overview */}
            <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-6 w-6 text-orange-600" />
                  <span>Habit Strength Score</span>
                </CardTitle>
                <CardDescription>
                  Overall measure of how ingrained your fitness habits are
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-orange-600 mb-2">
                        {Math.round(habitStrength * 100)}%
                      </div>
                      <p className="text-lg font-medium text-orange-700">
                        {habitStrength > 0.8 ? 'Strong Habit' : 
                         habitStrength > 0.6 ? 'Developing Habit' : 
                         habitStrength > 0.4 ? 'Early Habit' : 'Building Foundation'}
                      </p>
                    </div>
                    
                    <Progress value={habitStrength * 100} className="h-4 mb-4" />
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{streakInsights.currentStreak}</p>
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{streakInsights.longestStreak}</p>
                        <p className="text-xs text-muted-foreground">Best Streak</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Habit Formation Phases</h4>
                    <div className="space-y-3">
                      {habitFormationData.map((phase, index) => (
                        <div key={phase.phase}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={`${phase.value > 70 ? 'text-green-600' : phase.value > 50 ? 'text-orange-600' : 'text-gray-600'}`}>
                              {phase.phase}
                            </span>
                            <span className="font-medium">{phase.value}%</span>
                          </div>
                          <Progress value={phase.value} className="h-2 mb-1" />
                          <p className="text-xs text-muted-foreground">{phase.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="insights" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="consistency">Consistency</TabsTrigger>
                <TabsTrigger value="strategies">Strategies</TabsTrigger>
                <TabsTrigger value="nudges">Smart Nudges</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {habitInsights.map((insight, index) => (
                    <Card key={index} className={`${
                      insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                      insight.priority === 'medium' ? 'border-orange-200 bg-orange-50' :
                      'border-green-200 bg-green-50'
                    }`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            {insight.priority === 'high' ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                             insight.priority === 'medium' ? <Clock className="h-5 w-5 text-orange-600" /> :
                             <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            <span className="capitalize">{insight.type} Insight</span>
                          </CardTitle>
                          <Badge variant={
                            insight.priority === 'high' ? 'destructive' :
                            insight.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium mb-2">{insight.message}</p>
                        <p className="text-sm text-muted-foreground mb-3">{insight.actionable}</p>
                        {insight.data && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Data:</strong> {JSON.stringify(insight.data)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="consistency" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Consistency Trend</CardTitle>
                    <CardDescription>
                      Your consistency rate over the past 12 weeks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={weeklyConsistency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                        <Tooltip formatter={(value) => [`${Math.round(Number(value) * 100)}%`, 'Consistency']} />
                        <Line type="monotone" dataKey="consistency" stroke="#3b82f6" strokeWidth={3} />
                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategies" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {behaviorStrategies.map((strategy, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <span>{strategy.strategy}</span>
                        </CardTitle>
                        <Badge variant="outline">{strategy.type.replace('_', ' ')}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{strategy.suggestion}</p>
                        <Button variant="outline" size="sm" className="mt-3">
                          Apply Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="nudges" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Smart Nudges</CardTitle>
                    <CardDescription>
                      Personalized reminders and motivation based on your patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">{rec}</p>
                            <div className="flex space-x-2 mt-2">
                              <Button size="sm" variant="outline">
                                Schedule Reminder
                              </Button>
                              <Button size="sm" variant="ghost">
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}