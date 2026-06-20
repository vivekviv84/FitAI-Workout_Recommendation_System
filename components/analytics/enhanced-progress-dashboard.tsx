'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { 
  TrendingUp, 
  Target, 
  Award, 
  Flame,
  Calendar,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Activity
} from 'lucide-react'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { habitEngine } from '@/lib/ai/habit-engine'

// Enhanced mock data with more sophisticated metrics
const mockAdvancedData = {
  strengthProgression: [
    { date: '2025-01-01', benchPress: 80, squat: 100, deadlift: 120, overheadPress: 50 },
    { date: '2025-01-08', benchPress: 82.5, squat: 105, deadlift: 125, overheadPress: 52.5 },
    { date: '2025-01-15', benchPress: 85, squat: 110, deadlift: 130, overheadPress: 55 },
    { date: '2025-01-22', benchPress: 87.5, squat: 115, deadlift: 135, overheadPress: 57.5 },
    { date: '2025-01-29', benchPress: 90, squat: 120, deadlift: 140, overheadPress: 60 },
  ],
  
  volumeByMuscle: [
    { muscle: 'Chest', volume: 1200, improvement: 15, color: '#3b82f6' },
    { muscle: 'Back', volume: 1400, improvement: 22, color: '#10b981' },
    { muscle: 'Legs', volume: 1800, improvement: 18, color: '#f59e0b' },
    { muscle: 'Shoulders', volume: 800, improvement: 12, color: '#8b5cf6' },
    { muscle: 'Arms', volume: 600, improvement: 8, color: '#ef4444' },
    { muscle: 'Core', volume: 400, improvement: 25, color: '#06b6d4' },
  ],

  adherenceData: [
    { week: 'W1', planned: 6, completed: 5, rate: 83 },
    { week: 'W2', planned: 6, completed: 6, rate: 100 },
    { week: 'W3', planned: 6, completed: 4, rate: 67 },
    { week: 'W4', planned: 4, completed: 4, rate: 100 }, // Deload
    { week: 'W5', planned: 6, completed: 5, rate: 83 },
  ],

  recoveryMetrics: [
    { date: '2025-01-01', hrv: 42, restingHR: 65, sleepQuality: 7, readiness: 78 },
    { date: '2025-01-08', hrv: 45, restingHR: 63, sleepQuality: 8, readiness: 85 },
    { date: '2025-01-15', hrv: 38, restingHR: 68, sleepQuality: 6, readiness: 65 },
    { date: '2025-01-22', hrv: 47, restingHR: 62, sleepQuality: 8, readiness: 88 },
    { date: '2025-01-29', hrv: 44, restingHR: 64, sleepQuality: 7, readiness: 82 },
  ],

  bodyComposition: [
    { date: '2025-01-01', weight: 75, bodyFat: 15, muscleMass: 64 },
    { date: '2025-01-08', weight: 74.8, bodyFat: 14.8, muscleMass: 64.2 },
    { date: '2025-01-15', weight: 74.5, bodyFat: 14.5, muscleMass: 64.5 },
    { date: '2025-01-22', weight: 74.2, bodyFat: 14.2, muscleMass: 64.8 },
    { date: '2025-01-29', weight: 74, bodyFat: 14, muscleMass: 65 },
  ]
}

export function EnhancedProgressDashboard() {
  const [timeRange, setTimeRange] = useState('30')
  const [selectedMetric, setSelectedMetric] = useState('strength')
  
  const { habitData, progressMetrics, getStreakInsights, getProgressInsights, getHabitRecommendations } = useEnhancedWorkoutStore()
  
  const streakInsights = getStreakInsights()
  const progressInsights = getProgressInsights()
  const habitRecommendations = getHabitRecommendations()
  
  const [banditStats, setBanditStats] = useState<any[]>([])

  useEffect(() => {
    async function loadBanditStats() {
      try {
        const res = await fetch('/api/admin/bandit-insights')
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.stats)) {
            setBanditStats(data.stats)
          }
        }
      } catch (err) {
        console.error('Error loading bandit stats:', err)
      }
    }
    loadBanditStats()
  }, [])

  const stats = [
    {
      title: 'Habit Strength',
      value: `${Math.round(habitEngine.calculateHabitStrength(habitData) * 100)}%`,
      change: '+5% this week',
      changeType: 'positive' as const,
      icon: Flame,
      description: 'Overall habit formation score'
    },
    {
      title: 'Consistency Score',
      value: `${Math.round(streakInsights.consistencyScore * 100)}%`,
      change: `${streakInsights.trend > 0 ? '+' : ''}${Math.round(streakInsights.trend * 100)}%`,
      changeType: streakInsights.trend > 0 ? 'positive' as const : 'negative' as const,
      icon: Target,
      description: 'How consistently you stick to your plan'
    },
    {
      title: 'AI Confidence',
      value: '92%',
      change: 'High match',
      changeType: 'positive' as const,
      icon: Brain,
      description: 'How well your plan matches your profile'
    },
    {
      title: 'Progress Velocity',
      value: '+12.5%',
      change: 'Above average',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Rate of strength improvement'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : 
                            stat.changeType === 'negative' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Insights Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Insights & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Habit Recommendations</h4>
              <div className="space-y-2">
                {habitRecommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Bandit Performance</h4>
              <div className="space-y-2">
                {banditStats.map(stat => (
                  <div key={stat.template} className="flex items-center justify-between">
                    <span className="text-sm">{stat.template}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={stat.confidence * 100} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground w-8">
                        {Math.round(stat.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Charts */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="body">Body Comp</TabsTrigger>
          </TabsList>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="strength" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strength Progression</CardTitle>
              <CardDescription>
                Estimated 1RM progression across major lifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockAdvancedData.strengthProgression}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="benchPress" stroke="#3b82f6" strokeWidth={3} name="Bench Press" />
                  <Line type="monotone" dataKey="squat" stroke="#10b981" strokeWidth={3} name="Squat" />
                  <Line type="monotone" dataKey="deadlift" stroke="#f59e0b" strokeWidth={3} name="Deadlift" />
                  <Line type="monotone" dataKey="overheadPress" stroke="#8b5cf6" strokeWidth={3} name="OHP" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Volume by Muscle Group</CardTitle>
                <CardDescription>Weekly training volume distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockAdvancedData.volumeByMuscle}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="volume"
                      label={({ muscle, percent }) => `${muscle} ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockAdvancedData.volumeByMuscle.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume Improvements</CardTitle>
                <CardDescription>Progress by muscle group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAdvancedData.volumeByMuscle.map((muscle) => (
                    <div key={muscle.muscle}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{muscle.muscle}</span>
                        <Badge variant="default" className="text-xs">
                          +{muscle.improvement}%
                        </Badge>
                      </div>
                      <Progress value={muscle.improvement * 2} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Adherence Trends</CardTitle>
                <CardDescription>Weekly workout completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAdvancedData.adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habit Insights</CardTitle>
                <CardDescription>Behavioral patterns and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Current Streak</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {streakInsights.currentStreak} days
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Best Streak</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {streakInsights.longestStreak} days
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommendations</h4>
                    {habitRecommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Metrics</CardTitle>
              <CardDescription>
                Heart rate variability, sleep, and readiness trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockAdvancedData.recoveryMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="readiness" stroke="#3b82f6" strokeWidth={3} name="Readiness Score" />
                  <Line type="monotone" dataKey="hrv" stroke="#10b981" strokeWidth={2} name="HRV" />
                  <Line type="monotone" dataKey="sleepQuality" stroke="#f59e0b" strokeWidth={2} name="Sleep Quality" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="body" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Body Composition</CardTitle>
              <CardDescription>
                Weight, body fat, and muscle mass changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockAdvancedData.bodyComposition}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} name="Weight (kg)" />
                  <Line type="monotone" dataKey="bodyFat" stroke="#ef4444" strokeWidth={2} name="Body Fat %" />
                  <Line type="monotone" dataKey="muscleMass" stroke="#10b981" strokeWidth={2} name="Muscle Mass (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bandit Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Template Performance</span>
          </CardTitle>
          <CardDescription>
            Multi-armed bandit optimization results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banditStats.map(stat => (
              <div key={stat.template} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{stat.template}</h4>
                  <Badge variant={stat.confidence > 0.8 ? 'default' : 'secondary'}>
                    {Math.round(stat.confidence * 100)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span>{Math.round(stat.confidence * 100)}%</span>
                  </div>
                  <Progress value={stat.confidence * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stat.attempts} attempts • Avg reward: {stat.averageReward.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}