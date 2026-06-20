'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  Dumbbell, 
  BookOpen, 
  Users, 
  Settings, 
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Today\'s Workout', href: '/workout', icon: Dumbbell },
    { name: 'My Plan', href: '/plan', icon: Calendar },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Exercise Library', href: '/library', icon: BookOpen },
    // { name: 'Goals', href: '/goals', icon: Target },
  ]

  if (user?.role === 'COACH' || user?.role === 'ADMIN') {
    navigation.push({ name: 'Clients', href: '/coach', icon: Users })
  }

  if (user?.role === 'ADMIN') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings })
  }

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}