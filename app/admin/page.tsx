'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ExerciseManagement } from '@/components/admin/exercise-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Users, 
  Activity, 
  Shield,
  Brain,
  RefreshCw
} from 'lucide-react'

interface BanditStat {
  template: string
  confidence: number
  attempts: number
  averageReward: number
}

export default function AdminPage() {
  const [banditStats, setBanditStats] = useState<BanditStat[]>([])
  const [loadingBandit, setLoadingBandit] = useState(true)

  useEffect(() => {
    async function fetchBanditStats() {
      try {
        const res = await fetch('/api/admin/bandit-insights')
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.stats)) {
            setBanditStats(data.stats)
          }
        }
      } catch (err) {
        console.error('Failed to load bandit stats:', err)
      } finally {
        setLoadingBandit(false)
      }
    }
    fetchBanditStats()
  }, [])

  const systemStats = [
    { title: 'Total Users', value: '1,234', change: '+12%', icon: Users },
    { title: 'Active Plans', value: '892', change: '+8%', icon: Activity },
    { title: 'Exercise Library', value: '156', change: '+3', icon: Database },
    { title: 'System Health', value: '99.9%', change: 'Stable', icon: Shield },
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                System management and AI performance monitoring
              </p>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {systemStats.map((stat) => {
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
                      <Badge variant="outline" className="text-xs mt-1">
                        {stat.change}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* AI Performance Monitoring */}
            <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>AI Engine Performance</span>
                </CardTitle>
                <CardDescription>
                  Multi-armed bandit optimization results and model performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBandit ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : banditStats.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No performance data available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {banditStats.map(stat => (
                      <div key={stat.template} className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{stat.template} Template</h4>
                          <Badge variant={stat.confidence > 0.8 ? 'default' : 'secondary'}>
                            {Math.round(stat.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Attempts</span>
                            <span className="font-medium">{stat.attempts}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Reward</span>
                            <span className="font-medium">{stat.averageReward.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Performance</span>
                            <Badge variant={stat.confidence > 0.7 ? 'default' : 'destructive'}>
                              {stat.confidence > 0.8 ? 'Excellent' : 
                               stat.confidence > 0.6 ? 'Good' : 'Needs Improvement'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Library Management */}
            <ExerciseManagement />
          </div>
        </main>
      </div>
    </div>
  )
}