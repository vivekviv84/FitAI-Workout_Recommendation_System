'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Search,
  BarChart3,
  Database,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface Exercise {
  id: number
  name: string
  primary_muscle: string
  secondary_muscles: string[]
  movement_pattern: string
  category: string
  equipment: string
  skill_level: string
  contraindications: string[]
  default_sets: number
  default_reps: string
  default_rest_sec: number
  active: boolean
  usage_count: number
  created_at: string
}

export function ExerciseManagement() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    primary_muscle: 'CHEST',
    secondary_muscles: '',
    movement_pattern: 'PUSH',
    category: 'STRENGTH',
    equipment: 'BARBELL',
    skill_level: 'INTERMEDIATE',
    contraindications: '',
    default_sets: 3,
    default_reps: '8-12',
    default_rest_sec: 90
  })

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exercises?limit=100')
      if (res.ok) {
        const result = await res.json()
        const mapped = (result.data || []).map((ex: any) => ({
          ...ex,
          secondary_muscles: ex.secondary_muscles ? ex.secondary_muscles.split(',').map((s: string) => s.trim()) : [],
          contraindications: ex.contraindications ? ex.contraindications.split(',').map((s: string) => s.trim()) : [],
          active: true,
          usage_count: ex.usage_count || 0
        }))
        setExercises(mapped)
      } else {
        toast.error('Failed to load exercises')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error loading exercises')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const startAdd = () => {
    setEditingExercise(null)
    setFormData({
      name: '',
      primary_muscle: 'CHEST',
      secondary_muscles: '',
      movement_pattern: 'PUSH',
      category: 'STRENGTH',
      equipment: 'BARBELL',
      skill_level: 'INTERMEDIATE',
      contraindications: '',
      default_sets: 3,
      default_reps: '8-12',
      default_rest_sec: 90
    })
    setShowDialog(true)
  }

  const startEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      primary_muscle: exercise.primary_muscle,
      secondary_muscles: Array.isArray(exercise.secondary_muscles) ? exercise.secondary_muscles.join(', ') : (exercise.secondary_muscles || ''),
      movement_pattern: exercise.movement_pattern || 'PUSH',
      category: exercise.category || 'STRENGTH',
      equipment: exercise.equipment || 'BARBELL',
      skill_level: exercise.skill_level || 'INTERMEDIATE',
      contraindications: Array.isArray(exercise.contraindications) ? exercise.contraindications.join(', ') : (exercise.contraindications || ''),
      default_sets: exercise.default_sets || 3,
      default_reps: exercise.default_reps || '8-12',
      default_rest_sec: exercise.default_rest_sec || 90
    })
    setShowDialog(true)
  }

  const handleSaveExercise = async () => {
    if (!formData.name || !formData.primary_muscle || !formData.movement_pattern || !formData.category || !formData.equipment) {
      toast.error('Please fill in all required fields')
      return
    }

    const payload = {
      ...formData,
      secondary_muscles: formData.secondary_muscles ? formData.secondary_muscles.split(',').map(s => s.trim()).filter(Boolean).join(',') : '',
      contraindications: formData.contraindications ? formData.contraindications.split(',').map(s => s.trim()).filter(Boolean).join(',') : '',
      default_sets: parseInt(String(formData.default_sets)) || 3,
      default_rest_sec: parseInt(String(formData.default_rest_sec)) || 90
    }

    try {
      if (editingExercise) {
        // Edit mode
        const res = await fetch(`/api/exercises/${editingExercise.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          toast.success('Exercise updated successfully!')
          setShowDialog(false)
          fetchExercises()
        } else {
          const errData = await res.json()
          toast.error(errData.error || 'Failed to update exercise')
        }
      } else {
        // Add mode
        const res = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          toast.success('Exercise created successfully!')
          setShowDialog(false)
          fetchExercises()
        } else {
          const errData = await res.json()
          toast.error(errData.error || 'Failed to create exercise')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Error saving exercise')
    }
  }

  const handleDeleteExercise = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return

    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Exercise deleted successfully!')
        fetchExercises()
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Failed to delete exercise')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error deleting exercise')
    }
  }

  const handleWgerSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/exercises/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Sync request failed')
      }
      const data = await res.json()
      toast.success(`Sync complete! Synced: ${data.totalSynced}, Imported: ${data.importedCount} new exercises.`)
      fetchExercises()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to sync exercises: ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Primary Muscle', 'Category', 'Equipment', 'Skill Level', 'Usage Count'].join(','),
      ...exercises.map(e => [
        `"${e.name.replace(/"/g, '""')}"`,
        e.primary_muscle,
        e.category,
        e.equipment,
        e.skill_level,
        e.usage_count
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exercise_library.csv'
    a.click()
    
    toast.success('Exercise library exported!')
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.primary_muscle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: exercises.length,
    active: exercises.length, // All DB exercises are active
    popular: exercises.filter(e => e.usage_count > 0).length,
    recent: exercises.slice(-5).length // Last 5 added
  }

  return (
    <div className="space-y-6">
      {/* Library Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Exercises</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
            <Badge variant="secondary" className="text-xs mt-1">In database</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.active}</div>
            <Badge variant="default" className="text-xs mt-1">Available for plans</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prescribed</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.popular}</div>
            <Badge variant="outline" className="text-xs mt-1">Used in workouts</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Import</CardTitle>
            <Plus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{loading ? '...' : stats.recent}</div>
            <Badge variant="outline" className="text-xs mt-1">Added recently</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Exercise Library Management</CardTitle>
              <CardDescription>Create, edit, delete, or sync exercises from the Wger API</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleWgerSync} disabled={isSyncing || loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync from Wger'}
              </Button>
              <Button size="sm" onClick={startAdd} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or muscle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="STRENGTH">Strength</SelectItem>
                <SelectItem value="CARDIO">Cardio</SelectItem>
                <SelectItem value="CORE">Core</SelectItem>
                <SelectItem value="MOBILITY">Mobility</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exercises found matching your search.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base truncate">{exercise.name}</h3>
                      <Badge variant="secondary">{exercise.primary_muscle}</Badge>
                      <Badge variant="outline">{exercise.equipment}</Badge>
                      <Badge variant="outline" className="text-xs">{exercise.movement_pattern}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span><strong>Sets × Reps:</strong> {exercise.default_sets} × {exercise.default_reps}</span>
                      <span><strong>Rest:</strong> {exercise.default_rest_sec}s</span>
                      <span><strong>Skill:</strong> {exercise.skill_level}</span>
                      {exercise.secondary_muscles.length > 0 && (
                        <span className="truncate max-w-[200px]">
                          <strong>Secondary:</strong> {exercise.secondary_muscles.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => startEdit(exercise)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleDeleteExercise(exercise.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExercise ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
            <DialogDescription>
              {editingExercise ? 'Update the details for this exercise.' : 'Create a new exercise for the library.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Barbell Bench Press"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_muscle">Primary Muscle *</Label>
              <Select value={formData.primary_muscle} onValueChange={(value) => setFormData({...formData, primary_muscle: value})}>
                <SelectTrigger id="primary_muscle">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEST">Chest</SelectItem>
                  <SelectItem value="BACK">Back</SelectItem>
                  <SelectItem value="LEGS">Legs</SelectItem>
                  <SelectItem value="QUADS">Quads</SelectItem>
                  <SelectItem value="HAMSTRINGS">Hamstrings</SelectItem>
                  <SelectItem value="SHOULDERS">Shoulders</SelectItem>
                  <SelectItem value="BICEPS">Biceps</SelectItem>
                  <SelectItem value="TRICEPS">Triceps</SelectItem>
                  <SelectItem value="CORE">Core</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_muscles">Secondary Muscles (comma separated)</Label>
              <Input
                id="secondary_muscles"
                value={formData.secondary_muscles}
                onChange={(e) => setFormData({...formData, secondary_muscles: e.target.value})}
                placeholder="e.g., SHOULDERS, TRICEPS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_pattern">Movement Pattern *</Label>
              <Select value={formData.movement_pattern} onValueChange={(value) => setFormData({...formData, movement_pattern: value})}>
                <SelectTrigger id="movement_pattern">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUSH">Push</SelectItem>
                  <SelectItem value="PULL">Pull</SelectItem>
                  <SelectItem value="SQUAT">Squat</SelectItem>
                  <SelectItem value="HINGE">Hinge</SelectItem>
                  <SelectItem value="LUNGE">Lunge</SelectItem>
                  <SelectItem value="CURL">Curl</SelectItem>
                  <SelectItem value="FLY">Fly</SelectItem>
                  <SelectItem value="ISOMETRIC">Isometric</SelectItem>
                  <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                  <SelectItem value="COMPOUND">Compound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRENGTH">Strength</SelectItem>
                  <SelectItem value="CARDIO">Cardio</SelectItem>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="MOBILITY">Mobility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Select value={formData.equipment} onValueChange={(value) => setFormData({...formData, equipment: value})}>
                <SelectTrigger id="equipment">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARBELL">Barbell</SelectItem>
                  <SelectItem value="DUMBBELLS">Dumbbells</SelectItem>
                  <SelectItem value="CABLE">Cable</SelectItem>
                  <SelectItem value="MACHINE">Machine</SelectItem>
                  <SelectItem value="RESISTANCE_BANDS">Resistance Bands</SelectItem>
                  <SelectItem value="BODYWEIGHT">Bodyweight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level">Skill Level</Label>
              <Select value={formData.skill_level} onValueChange={(value) => setFormData({...formData, skill_level: value})}>
                <SelectTrigger id="skill_level">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contraindications">Contraindications (comma separated)</Label>
              <Input
                id="contraindications"
                value={formData.contraindications}
                onChange={(e) => setFormData({...formData, contraindications: e.target.value})}
                placeholder="e.g., SHOULDER_IMPINGEMENT, LOWER_BACK_PAIN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_sets">Default Sets</Label>
              <Input
                id="default_sets"
                type="number"
                value={formData.default_sets}
                onChange={(e) => setFormData({...formData, default_sets: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_reps">Default Reps</Label>
              <Input
                id="default_reps"
                value={formData.default_reps}
                onChange={(e) => setFormData({...formData, default_reps: e.target.value})}
                placeholder="e.g., 8-12"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="default_rest_sec">Default Rest (seconds)</Label>
              <Input
                id="default_rest_sec"
                type="number"
                value={formData.default_rest_sec}
                onChange={(e) => setFormData({...formData, default_rest_sec: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <Button onClick={handleSaveExercise} className="w-full mt-4">
            {editingExercise ? 'Save Changes' : 'Create Exercise'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}