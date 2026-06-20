'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ClientDashboard } from '@/components/coach/client-dashboard'

export default function CoachPage() {
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
              <h1 className="text-3xl font-bold mb-2">Coach Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor client progress and provide personalized guidance
              </p>
            </div>

            <ClientDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}