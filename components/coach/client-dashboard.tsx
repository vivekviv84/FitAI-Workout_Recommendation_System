'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Search, 
  Plus, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Client {
  id: string
  name: string
  email: string
  joinDate: string
  lastActive: string
  currentPlan: string
  adherenceRate: number
  progressScore: number
  riskLevel: 'low' | 'medium' | 'high'
  notes: string
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    joinDate: '2025-01-01',
    lastActive: '2025-01-28',
    currentPlan: 'PPL - Muscle Gain',
    adherenceRate: 92,
    progressScore: 88,
    riskLevel: 'low',
    notes: 'Excellent progress, highly motivated'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    joinDate: '2024-12-15',
    lastActive: '2025-01-25',
    currentPlan: 'Full Body - Fat Loss',
    adherenceRate: 65,
    progressScore: 72,
    riskLevel: 'medium',
    notes: 'Struggling with consistency, needs encouragement'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    joinDate: '2025-01-10',
    lastActive: '2025-01-29',
    currentPlan: 'Upper/Lower - Strength',
    adherenceRate: 88,
    progressScore: 95,
    riskLevel: 'low',
    notes: 'Great technique, ready for advanced programming'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.w@email.com',
    joinDate: '2024-11-20',
    lastActive: '2025-01-20',
    currentPlan: 'PPL - Muscle Gain',
    adherenceRate: 45,
    progressScore: 38,
    riskLevel: 'high',
    notes: 'At risk of dropping out, needs intervention'
  }
]

export function ClientDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('adherence')
  const [newNote, setNewNote] = useState('')

  const filteredClients = mockClients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'adherence':
          return b.adherenceRate - a.adherenceRate
        case 'progress':
          return b.progressScore - a.progressScore
        case 'risk':
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 }
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        default:
          return 0
      }
    })

  const clientStats = {
    total: mockClients.length,
    active: mockClients.filter(c => c.adherenceRate > 70).length,
    atRisk: mockClients.filter(c => c.riskLevel === 'high').length,
    avgAdherence: Math.round(mockClients.reduce((sum, c) => sum + c.adherenceRate, 0) / mockClients.length)
  }

  return (
    <div className="space-y-6">
      {/* Coach Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.total}</div>
            <Badge variant="secondary" className="text-xs mt-1">All time</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{clientStats.active}</div>
            <Badge variant="default" className="text-xs mt-1">70%+ adherence</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clientStats.atRisk}</div>
            <Badge variant="destructive" className="text-xs mt-1">Need attention</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Adherence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.avgAdherence}%</div>
            <Badge variant="outline" className="text-xs mt-1">This month</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Client Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Client Management</CardTitle>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adherence">Adherence</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="risk">Risk Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                      <Badge variant={
                        client.riskLevel === 'high' ? 'destructive' :
                        client.riskLevel === 'medium' ? 'default' : 'secondary'
                      }>
                        {client.riskLevel} risk
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Adherence</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={client.adherenceRate} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{client.adherenceRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={client.progressScore} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{client.progressScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{client.currentPlan}</p>
                      <p className="text-xs text-muted-foreground">Last active: {client.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Details */}
        <div>
          {selectedClient ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedClient.name}</CardTitle>
                <CardDescription>{selectedClient.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Plan</h4>
                  <p className="text-sm text-muted-foreground">{selectedClient.currentPlan}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Adherence</span>
                        <span>{selectedClient.adherenceRate}%</span>
                      </div>
                      <Progress value={selectedClient.adherenceRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{selectedClient.progressScore}%</span>
                      </div>
                      <Progress value={selectedClient.progressScore} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedClient.notes}</p>
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-2"
                  />
                  <Button size="sm" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Full Plan
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    Generate New Plan
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Progress Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Select a Client</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a client from the list to view their details and progress
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}