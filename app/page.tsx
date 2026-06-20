import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dumbbell, 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  Calendar
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Planning',
      description: 'Hybrid engine with rules, machine learning, and multi-armed bandit optimization',
    },
    {
      icon: TrendingUp,
      title: 'Progressive Overload',
      description: 'Automatic progression with built-in deload weeks for optimal recovery',
    },
    {
      icon: Target,
      title: 'Goal-Focused',
      description: 'Plans adapted for muscle gain, strength, fat loss, or general fitness',
    },
    {
      icon: Shield,
      title: 'Injury-Safe',
      description: 'Smart exercise substitutions based on your injury constraints',
    },
    {
      icon: Users,
      title: 'Coach Mode',
      description: 'Professional tools for trainers to manage and monitor clients',
    },
    {
      icon: Calendar,
      title: 'Habit Formation',
      description: 'Built-in nudges and tracking to build lasting fitness habits',
    },
  ]

  const benefits = [
    'Personalized 12-week programs',
    'Progressive overload automation',
    'Injury-aware exercise selection',
    'Real-time form and RPE tracking',
    'Advanced analytics dashboard',
    'Mobile-optimized workout tracking'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">FitAI</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              AI-Powered Fitness
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Personalized{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Workout Plans
              </span>{' '}
              That Adapt to You
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Get AI-generated workout plans that evolve with your progress. Smart progression, 
              injury prevention, and habit formation built into every program.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="shadow-lg">
                <Link href="/auth/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/signup">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Intelligent Fitness Technology
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Advanced AI algorithms combined with proven fitness science
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Everything You Need for Success
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                From beginner-friendly routines to advanced periodization
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 text-white">
                  <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" variant="secondary" asChild className="shadow-lg">
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              <span className="font-bold">FitAI</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">
              © 2025 FitAI. Built with intelligence and precision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}