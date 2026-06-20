'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { 
  TrendingUp, 
  Target, 
  Dumbbell, 
  Award,
  Loader2,
  Activity
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useWorkoutStore } from '@/lib/stores/workout-store'
import { toast } from 'sonner'

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState('30')
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)

  const { user } = useAuthStore()
  const { currentPlan, fetchPlans } = useWorkoutStore()

  const fetchProgress = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/progress?days=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        setProgressData(data)
      } else {
        toast.error('Failed to load progress details')
      }
    } catch (error) {
      console.error('Progress fetch error:', error)
      toast.error('Failed to load progress details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && !currentPlan) {
      fetchPlans()
    }
  }, [user, currentPlan, fetchPlans])

  useEffect(() => {
    if (user) {
      fetchProgress()
    }
  }, [user, timeRange])

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    setSavingWeight(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_weight_kg: weight })
      })
      if (!res.ok) throw new Error('Failed to save weight')
      toast.success('Weight logged successfully!')
      setNewWeight('')
      await fetchProgress()
    } catch (error) {
      console.error(error)
      toast.error('Failed to log weight')
    } finally {
      setSavingWeight(false)
    }
  }

  // Parse charts data
  const weightData = progressData?.records 
    ? progressData.records.map((r: any) => ({
        date: r.date,
        weight: r.body_weight_kg
      })).reverse()
    : []

  const volumeData = progressData?.volumeHistory 
    ? progressData.volumeHistory.map((v: any) => ({
        week: v.week,
        volume: v.volume
      }))
    : []

  const muscleVolume = progressData?.muscleVolume 
    ? progressData.muscleVolume.map((mv: any, idx: number) => ({
        muscle: mv.muscle.charAt(0).toUpperCase() + mv.muscle.slice(1).toLowerCase(),
        volume: mv.volume,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'][idx % 7]
      }))
    : []

  const personalRecords = progressData?.personalRecords || []

  // Metrics calculations
  const totalVolume = volumeData.reduce((acc: number, curr: any) => acc + (curr.volume || 0), 0)
  const totalVolumeStr = totalVolume.toLocaleString() + 'kg'

  const completedDays = currentPlan?.days ? currentPlan.days.filter((d: any) => d.completed).length : 0
  const totalDays = currentPlan?.days ? currentPlan.days.length : 0
  const adherenceRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
  const adherenceStr = `${adherenceRate}%`

  let weightChangeStr = '0.0kg'
  if (weightData.length >= 2) {
    const change = weightData[weightData.length - 1].weight - weightData[0].weight
    weightChangeStr = `${change >= 0 ? '+' : ''}${change.toFixed(1)}kg`
  }

  const prCountStr = personalRecords.length.toString()

  const stats = [
    {
      title: 'Total Volume',
      value: totalVolumeStr,
      change: `Last ${timeRange} days`,
      changeType: 'positive' as const,
      icon: Dumbbell,
    },
    {
      title: 'Adherence Rate',
      value: adherenceStr,
      change: `${completedDays} of ${totalDays} sessions`,
      changeType: adherenceRate >= 80 ? ('positive' as const) : ('neutral' as const),
      icon: Target,
    },
    {
      title: 'Weight Change',
      value: weightChangeStr,
      change: `Last ${timeRange} days`,
      changeType: 'neutral' as const,
      icon: TrendingUp,
    },
    {
      title: 'Personal Records',
      value: prCountStr,
      change: 'All time',
      changeType: 'positive' as const,
      icon: Award,
    },
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Progress Tracking</h1>
                <p className="text-muted-foreground">
                  Monitor your fitness journey and celebrate your achievements
                </p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-muted-foreground text-sm font-medium">Loading progress records...</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <Card key={stat.title} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </CardTitle>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <div className="flex items-center mt-1">
                            <Badge 
                              variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {stat.change}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Charts */}
                <Tabs defaultValue="weight" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="weight">Body Weight</TabsTrigger>
                    <TabsTrigger value="volume">Training Volume</TabsTrigger>
                    <TabsTrigger value="muscles">Muscle Groups</TabsTrigger>
                    <TabsTrigger value="prs">Personal Records</TabsTrigger>
                  </TabsList>

                  <TabsContent value="weight" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Body Weight Trend</CardTitle>
                            <CardDescription>
                              Track your weight changes over time
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {weightData.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 border border-dashed rounded-lg p-6 text-center">
                                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-1">No weight records</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mb-4">
                                  Use the form on the right to log your weight and start tracking your trend.
                                </p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={weightData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                                  <Tooltip />
                                  <Line 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle>Log Today&apos;s Weight</CardTitle>
                            <CardDescription>
                              Record your daily weight to track progress
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleLogWeight} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Body Weight (kg)</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="e.g. 75.5"
                                  value={newWeight}
                                  onChange={(e) => setNewWeight(e.target.value)}
                                  required
                                  disabled={savingWeight}
                                />
                              </div>
                              <Button type="submit" className="w-full" disabled={savingWeight}>
                                {savingWeight ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Entry'
                                )}
                              </Button>
                            </form>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="volume" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Training Volume</CardTitle>
                        <CardDescription>
                          Total volume (weight × reps × sets) per week
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {volumeData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 border border-dashed rounded-lg p-6 text-center">
                            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-1">No completed workouts</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                              Start a scheduled session and log completed sets to generate training volume.
                            </p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={volumeData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="muscles" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Volume by Muscle Group</CardTitle>
                        <CardDescription>
                          Distribution of training volume across muscle groups
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {muscleVolume.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 border border-dashed rounded-lg p-6 text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-1">No muscle split data</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                              Complete workouts and log sets to view your muscle training split.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={muscleVolume}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="volume"
                                  label={({ muscle, percent }) => `${muscle} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {muscleVolume.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            
                            <div className="space-y-3">
                              {muscleVolume.map((muscle: any) => (
                                <div key={muscle.muscle} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: muscle.color }}
                                    />
                                    <span className="font-medium">{muscle.muscle}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {muscle.volume.toLocaleString()}kg
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="prs" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Records</CardTitle>
                        <CardDescription>
                          Your latest strength achievements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {personalRecords.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 border border-dashed rounded-lg p-6 text-center">
                            <Award className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-1">No personal records</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                              Lift heavier weights or perform more repetitions to establish personal records!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {personalRecords.map((pr: any) => (
                              <div key={pr.exercise} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-100 rounded-full">
                                    <Award className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{pr.exercise}</p>
                                    <p className="text-sm text-muted-foreground">{pr.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{pr.weight}kg</p>
                                  <Badge variant="default" className="text-xs">
                                    {pr.improvement || '+2.5kg'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}