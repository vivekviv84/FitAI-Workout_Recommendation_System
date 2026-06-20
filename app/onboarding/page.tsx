'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Target, Calendar, Wrench, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

const profileSchema = z.object({
  age: z.number().min(13).max(100),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  goal: z.enum(['FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'GENERAL_FITNESS', 'ENDURANCE']),
  experience: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  days_per_week: z.number().min(2).max(7),
  minutes_per_day: z.number().min(15).max(180),
  split_preference: z.enum(['PPL', 'UL_LL', 'FULL_BODY']).optional(),
  constraints: z.object({
    injuries: z.array(z.string()),
    equipment: z.array(z.string()),
  }),
  dislikes: z.array(z.number()).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const STEPS = [
  { title: 'Basic Info', icon: Target },
  { title: 'Goals & Schedule', icon: Calendar },
  { title: 'Equipment & Constraints', icon: Wrench },
  { title: 'Preferences', icon: AlertTriangle },
]

const EQUIPMENT_OPTIONS = [
  'BODYWEIGHT', 'DUMBBELLS', 'BARBELL', 'RESISTANCE_BANDS', 
  'KETTLEBELLS', 'MACHINES', 'PULL_UP_BAR', 'BENCH'
]

const INJURY_OPTIONS = [
  'SHOULDER_IMPINGEMENT', 'LOWER_BACK_PAIN', 'KNEE_PAIN', 
  'WRIST_PAIN', 'NECK_PAIN', 'ANKLE_INJURY', 'HIP_PAIN'
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuthStore()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      constraints: {
        injuries: [],
        equipment: ['BODYWEIGHT'],
      },
      dislikes: [],
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data }),
      })
      const result = await res.json()

      if (!res.ok || result.error) throw new Error(result.error || 'Failed to save profile')

      toast.success('Profile created successfully!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error('Failed to save profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      form.handleSubmit(onSubmit)()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="container max-w-2xl mx-auto py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup Your Profile</h1>
            <Badge variant="secondary">{currentStep + 1} of {STEPS.length}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className={`flex items-center space-x-1 text-xs ${
                    index <= currentStep ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:block">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Tell us about yourself</h2>
                    <p className="text-muted-foreground">This helps us create the perfect plan for you</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        {...form.register('age', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select onValueChange={(value) => form.setValue('sex', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height_cm">Height (cm)</Label>
                      <Input
                        id="height_cm"
                        type="number"
                        placeholder="175"
                        {...form.register('height_cm', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        placeholder="70"
                        {...form.register('weight_kg', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Schedule */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Goals & Schedule</h2>
                    <p className="text-muted-foreground">What do you want to achieve?</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Goal</Label>
                      <Select onValueChange={(value) => form.setValue('goal', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your main goal..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MUSCLE_GAIN">Build Muscle</SelectItem>
                          <SelectItem value="FAT_LOSS">Lose Weight</SelectItem>
                          <SelectItem value="STRENGTH">Get Stronger</SelectItem>
                          <SelectItem value="GENERAL_FITNESS">General Fitness</SelectItem>
                          <SelectItem value="ENDURANCE">Improve Endurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <Select onValueChange={(value) => form.setValue('experience', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner (0-1 years)</SelectItem>
                          <SelectItem value="INTERMEDIATE">Intermediate (1-3 years)</SelectItem>
                          <SelectItem value="ADVANCED">Advanced (3+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="days_per_week">Days per week</Label>
                        <Select onValueChange={(value) => form.setValue('days_per_week', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Days..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7].map(day => (
                              <SelectItem key={day} value={day.toString()}>{day} days</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minutes_per_day">Minutes per session</Label>
                        <Select onValueChange={(value) => form.setValue('minutes_per_day', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Time..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">2+ hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Equipment & Constraints */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Equipment & Constraints</h2>
                    <p className="text-muted-foreground">What equipment do you have access to?</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Available Equipment</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {EQUIPMENT_OPTIONS.map((equipment) => (
                          <div key={equipment} className="flex items-center space-x-2">
                            <Checkbox
                              id={equipment}
                              onCheckedChange={(checked) => {
                                const currentEquipment = form.getValues('constraints.equipment') || []
                                if (checked) {
                                  form.setValue('constraints.equipment', [...currentEquipment, equipment])
                                } else {
                                  form.setValue('constraints.equipment', 
                                    currentEquipment.filter(e => e !== equipment)
                                  )
                                }
                              }}
                            />
                            <Label htmlFor={equipment} className="text-sm font-normal cursor-pointer">
                              {equipment.replace('_', ' ').toLowerCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Current Injuries or Limitations</Label>
                      <p className="text-sm text-muted-foreground">
                        Select any injuries or conditions we should consider
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {INJURY_OPTIONS.map((injury) => (
                          <div key={injury} className="flex items-center space-x-2">
                            <Checkbox
                              id={injury}
                              onCheckedChange={(checked) => {
                                const currentInjuries = form.getValues('constraints.injuries') || []
                                if (checked) {
                                  form.setValue('constraints.injuries', [...currentInjuries, injury])
                                } else {
                                  form.setValue('constraints.injuries', 
                                    currentInjuries.filter(i => i !== injury)
                                  )
                                }
                              }}
                            />
                            <Label htmlFor={injury} className="text-sm font-normal cursor-pointer">
                              {injury.replace('_', ' ').toLowerCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <AlertTriangle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Final Preferences</h2>
                    <p className="text-muted-foreground">Choose your preferred workout style</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Preferred Split Style</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <div
                          className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                          onClick={() => form.setValue('split_preference', 'PPL')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Push/Pull/Legs (PPL)</h3>
                              <p className="text-sm text-muted-foreground">6 days/week, muscle-focused</p>
                            </div>
                            <Checkbox checked={form.watch('split_preference') === 'PPL'} />
                          </div>
                        </div>

                        <div
                          className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                          onClick={() => form.setValue('split_preference', 'UL_LL')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Upper/Lower</h3>
                              <p className="text-sm text-muted-foreground">4 days/week, balanced approach</p>
                            </div>
                            <Checkbox checked={form.watch('split_preference') === 'UL_LL'} />
                          </div>
                        </div>

                        <div
                          className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                          onClick={() => form.setValue('split_preference', 'FULL_BODY')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Full Body</h3>
                              <p className="text-sm text-muted-foreground">3 days/week, efficient training</p>
                            </div>
                            <Checkbox checked={form.watch('split_preference') === 'FULL_BODY'} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  type={currentStep === STEPS.length - 1 ? 'submit' : 'button'}
                  onClick={currentStep === STEPS.length - 1 ? undefined : nextStep}
                  disabled={loading}
                >
                  {currentStep === STEPS.length - 1 ? (
                    loading ? 'Creating Profile...' : 'Complete Setup'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}