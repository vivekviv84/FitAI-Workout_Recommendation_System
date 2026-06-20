'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Dumbbell, User, BarChart3, BookOpen, Users, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'My Plan', href: '/plan', icon: Dumbbell },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'Library', href: '/library', icon: BookOpen },
  ]

  if (user?.role === 'COACH' || user?.role === 'ADMIN') {
    navigation.push({ name: 'Clients', href: '/coach', icon: Users })
  }

  if (user?.role === 'ADMIN') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings })
  }

  const { setUser } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      // clear local client state
      setUser(null)
      setIsOpen(false)
    } catch (err) {
      // still close the menu on error
      setIsOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FitAI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex ml-8 space-x-6">
          {user && navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <span className="hidden md:block text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col space-y-4 mt-6">
                {user ? (
                  <>
                    <div className="border-b pb-4">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {user.role?.toLowerCase() || 'user'}
                      </p>
                    </div>
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-2 text-sm font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="justify-start"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild onClick={() => setIsOpen(false)}>
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild onClick={() => setIsOpen(false)}>
                      <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}