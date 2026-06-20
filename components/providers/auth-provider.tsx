'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Dumbbell } from 'lucide-react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse">
            <Dumbbell className="h-12 w-12 text-blue-500 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-blue-400">FitAI</h2>
          <p className="text-sm text-slate-400">Initializing session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
