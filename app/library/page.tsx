'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  Dumbbell, 
  Target, 
  Clock, 
  Star,
  PlayCircle,
  Loader2
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { toast } from 'sonner'

export default function LibraryPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function loadExercises() {
      try {
        const res = await fetch('/api/exercises?limit=200')
        if (!res.ok) throw new Error('Failed to fetch exercises')
        const data = await res.json()
        if (data.data) {
          const formatted = data.data.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            primary_muscle: ex.primary_muscle.charAt(0).toUpperCase() + ex.primary_muscle.slice(1).toLowerCase(),
            secondary_muscles: ex.secondary_muscles
              ? ex.secondary_muscles.split(',').map((m: string) => m.trim().charAt(0).toUpperCase() + m.trim().slice(1).toLowerCase())
              : [],
            category: ex.category ? (ex.category.charAt(0).toUpperCase() + ex.category.slice(1).toLowerCase()) : 'Strength',
            equipment: ex.equipment ? (ex.equipment.charAt(0).toUpperCase() + ex.equipment.slice(1).toLowerCase()) : 'Bodyweight',
            skill_level: ex.skill_level ? (ex.skill_level.charAt(0).toUpperCase() + ex.skill_level.slice(1).toLowerCase()) : 'Beginner',
            description: ex.contraindications 
              ? `Avoid if you suffer from ${ex.contraindications.toLowerCase().replace(/_/g, ' ')}.` 
              : `A great ${ex.category?.toLowerCase() || 'strength'} exercise targeting the ${ex.primary_muscle.toLowerCase()}.`,
            difficulty: ex.skill_level === 'BEGINNER' ? 3 : ex.skill_level === 'INTERMEDIATE' ? 6 : 9,
            popularity: 80 + (ex.id % 20),
            default_sets: ex.default_sets || 3,
            default_reps: ex.default_reps || '8-12',
            default_rest_sec: ex.default_rest_sec || 90
          }))
          setExercises(formatted)
        }
      } catch (error) {
        console.error('Failed to load exercises:', error)
        toast.error('Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primary_muscle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = selectedMuscle === 'all' || exercise.primary_muscle.toLowerCase() === selectedMuscle.toLowerCase()
    const matchesEquipment = selectedEquipment === 'all' || exercise.equipment.toLowerCase() === selectedEquipment.toLowerCase()
    const matchesCategory = selectedCategory === 'all' || exercise.category.toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesMuscle && matchesEquipment && matchesCategory
  })

  const muscleGroups = Array.from(new Set(exercises.map(ex => ex.primary_muscle.toLowerCase())))
  const equipmentTypes = Array.from(new Set(exercises.map(ex => ex.equipment.toLowerCase())))
  const categories = Array.from(new Set(exercises.map(ex => ex.category.toLowerCase())))

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
              <h1 className="text-3xl font-bold mb-2">Exercise Library</h1>
              <p className="text-muted-foreground">
                Explore our comprehensive database of exercises with detailed instructions
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Muscle Group</Label>
                    <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Muscles</SelectItem>
                        {muscleGroups.map(muscle => (
                          <SelectItem key={muscle} value={muscle}>
                            {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Equipment</Label>
                    <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Equipment</SelectItem>
                        {equipmentTypes.map(equipment => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Count */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-muted-foreground text-sm font-medium">Loading exercises database...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredExercises.length} of {exercises.length} exercises
                  </p>
                </div>

                {/* Exercise Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="shadow-sm hover:shadow-md transition-all hover:scale-105">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{exercise.name}</CardTitle>
                            <CardDescription>
                              Primary: {exercise.primary_muscle}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{exercise.popularity}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{exercise.equipment}</Badge>
                          <Badge variant="outline">{exercise.skill_level}</Badge>
                          <Badge variant="outline">{exercise.category}</Badge>
                        </div>

                        {/* Secondary Muscles */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Secondary muscles:</p>
                          <div className="flex flex-wrap gap-1">
                            {exercise.secondary_muscles.length > 0 ? (
                              exercise.secondary_muscles.map((muscle: string) => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None</span>
                            )}
                          </div>
                        </div>

                        {/* Exercise Details */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Sets</span>
                            <span className="text-sm font-medium">{exercise.default_sets}</span>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Reps</span>
                            <span className="text-sm font-medium">{exercise.default_reps}</span>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Rest</span>
                            <span className="text-sm font-medium">{Math.floor(exercise.default_rest_sec / 60)}&apos;</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {exercise.description}
                        </p>

                        {/* Difficulty */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Difficulty</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < exercise.difficulty ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-medium ml-2">{exercise.difficulty}/10</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <Button variant="outline" className="w-full" size="sm">
                          <PlayCircle className="mr-2 h-4 w-4" />
                          View Instructions
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Empty State */}
                {filteredExercises.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No exercises found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search terms
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Label({ children, ...props }: { children: React.ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="text-sm font-medium" {...props}>{children}</label>
}