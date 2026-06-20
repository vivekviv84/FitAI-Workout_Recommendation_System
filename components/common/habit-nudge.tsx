'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Flame, 
  Target, 
  Calendar,
  Zap,
  Trophy,
  AlertCircle
} from 'lucide-react'
import { useEnhancedWorkoutStore } from '@/lib/stores/enhanced-workout-store'
import { habitEngine } from '@/lib/ai/habit-engine'

export function HabitNudge() {
  const [currentNudge, setCurrentNudge] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const { habitData } = useEnhancedWorkoutStore()

  useEffect(() => {
    // Generate nudges based on current state
    const nudges = habitEngine.generateNudges(habitData, {}, new Date())
    if (nudges.length > 0 && !dismissed) {
      setCurrentNudge(nudges[0])
    }
  }, [habitData, dismissed])

  if (!currentNudge || dismissed) return null

  const getIcon = () => {
    switch (currentNudge.type) {
      case 'reminder': return <Calendar className="h-5 w-5" />
      case 'motivation': return <Zap className="h-5 w-5" />
      case 'celebration': return <Trophy className="h-5 w-5" />
      case 'course_correction': return <AlertCircle className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  const getCardStyle = () => {
    switch (currentNudge.type) {
      case 'celebration': return 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50'
      case 'course_correction': return 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50'
      case 'motivation': return 'border-blue-200 bg-gradient-to-r from-blue-50 to-green-50'
      default: return 'border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50'
    }
  }

  return (
    <Card className={`shadow-lg ${getCardStyle()} animate-in slide-in-from-top-2 duration-300`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${
              currentNudge.type === 'celebration' ? 'bg-yellow-100' :
              currentNudge.type === 'course_correction' ? 'bg-red-100' :
              currentNudge.type === 'motivation' ? 'bg-blue-100' :
              'bg-orange-100'
            }`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium">{currentNudge.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {currentNudge.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {currentNudge.message}
              </p>
              <div className="flex space-x-2">
                {currentNudge.cta && (
                  <Button size="sm" variant="default">
                    {currentNudge.cta}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}