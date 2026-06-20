'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  RotateCcw,
  Target,
  Clock,
  Dumbbell,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { generatePlanDiff } from '@/lib/ai/plan-generator'
import { useWorkoutStore } from '@/lib/stores/workout-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PlanPage() {
  const [loading, setLoading] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [planDiff, setPlanDiff] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [plansLoaded, setPlansLoaded] = useState(false)
  const { currentPlan, setPlan, fetchPlans } = useWorkoutStore()
  const { user } = useAuthStore()
  const [selectedWeek, setSelectedWeek] = useState(0)

  // Fetch plans on mount
  useEffect(() => {
    const loadPlans = async () => {
      if (user) {
        try {
          await fetchPlans()
        } catch (error) {
          console.error('Failed to fetch plans on mount:', error)
        } finally {
          setPlansLoaded(true)
        }
      }
    }
    loadPlans()
  }, [user, fetchPlans])

  // Fetch user profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const profile = await res.json()
          setUserProfile(profile)
        } else {
          toast.error('Failed to load profile')
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        toast.error('Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  // Generate initial plan if none exists
  useEffect(() => {
    if (plansLoaded && !currentPlan && user && userProfile && !profileLoading && !loading) {
      generateInitialPlan()
    }
  }, [plansLoaded, user, currentPlan, userProfile, profileLoading, loading])

  const generateInitialPlan = async () => {
    if (!user || !userProfile) return

    setLoading(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeks: 12,
          templateCandidates: ['PPL', 'UL_LL', 'FULL_BODY'],
          startDate: new Date().toISOString().split('T')[0]
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate plan')
      }

      const result = await res.json()

      // Fetch the full plan with all details
      const plansRes = await fetch('/api/plans')
      if (!plansRes.ok) throw new Error('Failed to fetch plans')

      const plansData = await plansRes.json()
      const plansList = plansData.data || []
      if (Array.isArray(plansList) && plansList.length > 0) {
        const fullPlan = plansList[0]
        setPlan(fullPlan)
      }
    } catch (error) {
      toast.error('Failed to generate plan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const regeneratePlan = async () => {
    if (!user || !currentPlan) return

    setLoading(true)
    try {
      const oldPlan = {
        planId: currentPlan.id,
        weeks: currentPlan.weeks,
        template: currentPlan.template,
        rationale: currentPlan.rationale || ''
      }

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeks: 12,
          templateCandidates: ['PPL', 'UL_LL', 'FULL_BODY'],
          startDate: new Date().toISOString().split('T')[0]
        })
      })

      if (!res.ok) {
        throw new Error('Failed to regenerate plan')
      }

      const result = await res.json()
      const plansRes = await fetch('/api/plans')
      if (!plansRes.ok) throw new Error('Failed to fetch plans')

      const plansData = await plansRes.json()
      const plansList = plansData.data || []
      if (!Array.isArray(plansList) || plansList.length === 0) {
        throw new Error('No plans returned')
      }

      const fullPlan = plansList[0]

      const diff = generatePlanDiff(oldPlan, fullPlan)
      setPlanDiff(diff)
      setShowDiff(true)
      setPlan(fullPlan)

      toast.success('Plan regenerated successfully!')
    } catch (error) {
      toast.error('Failed to regenerate plan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !currentPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <aside className="hidden lg:block border-r bg-white">
            <Sidebar />
          </aside>
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-64 bg-gray-200 rounded"></div>
                <div className="h-4 w-96 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse h-10 w-full bg-gray-200 rounded-md"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse shadow-sm border-gray-100">
                    <CardHeader className="space-y-2">
                      <div className="h-5 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="h-14 bg-gray-100 rounded-lg w-full"></div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <aside className="hidden lg:block border-r bg-white">
            <Sidebar />
          </aside>
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">No workout plan found. Please wait while we generate one for you.</p>
                <Button onClick={generateInitialPlan} disabled={loading}>
                  Generate Plan
                </Button>
              </CardContent>
            </Card>
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
            {/* Plan Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Workout Plan</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Target className="mr-1 h-4 w-4" />
                    {currentPlan?.template} Split
                  </span>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {currentPlan?.weeks?.length} Weeks
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    Progressive
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Dialog open={showDiff} onOpenChange={setShowDiff}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={regeneratePlan} disabled={loading}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {loading ? 'Regenerating...' : 'Regenerate Plan'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Plan Updated</DialogTitle>
                      <DialogDescription>
                        Here&apos;s what changed in your new plan:
                      </DialogDescription>
                    </DialogHeader>
                    {planDiff && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Changes:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {Array.isArray(planDiff.changes) && planDiff.changes.map((change: string, index: number) => (
                              <li key={index}>{change}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Rationale:</h4>
                          <p className="text-sm text-muted-foreground">{planDiff.rationale}</p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button asChild>
                  <Link href="/workout">Start Today&apos;s Workout</Link>
                </Button>
              </div>
            </div>

            {/* Plan Rationale */}
            {currentPlan?.rationale && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 mb-1">AI Rationale</p>
                      <p className="text-sm text-blue-700">{currentPlan.rationale}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Week Tabs */}
            {Array.isArray(currentPlan?.weeks) && currentPlan.weeks.length > 0 && (
              <Tabs value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                <TabsList className="flex flex-nowrap overflow-x-auto justify-start w-full h-auto p-1.5 gap-2 mb-6 bg-muted rounded-md scrollbar-thin">
                  {currentPlan.weeks.map((_: any, i: number) => (
                    <TabsTrigger
                      key={i}
                      value={i.toString()}
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Week {i + 1}
                      {[3, 7, 11].includes(i) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Deload
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {currentPlan.weeks.map((week: any, weekIndex: number) => (
                  <TabsContent key={weekIndex} value={weekIndex.toString()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.isArray(week) && week.length > 0 ? (
                        week.map((day: any, dayIndex: number) => (
                          <Card key={dayIndex} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">{day.label}</CardTitle>
                                  <CardDescription>
                                    {day.date && parseISO(day.date) ? format(parseISO(day.date), 'EEEE, MMM d') : 'No date'}
                                  </CardDescription>
                                </div>
                                {day.deload && (
                                  <Badge variant="secondary">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Deload
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
                                day.exercises.map((exercise: any) => (
                                  <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{exercise.name}</p>
                                      <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                                        <span>{exercise.sets} sets</span>
                                        <span>{exercise.reps} reps</span>
                                        <span>RPE {exercise.target_rpe}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {Math.floor((exercise.rest_sec || 0) / 60)}&apos;
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No exercises for this day</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="col-span-full">
                          <CardContent className="pt-6 text-center">
                            <p className="text-muted-foreground">No workouts scheduled for this week</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}