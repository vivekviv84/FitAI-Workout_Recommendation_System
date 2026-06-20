'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { EnhancedProgressDashboard } from '@/components/analytics/enhanced-progress-dashboard'

export default function EnhancedProgressPage() {
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
              <h1 className="text-3xl font-bold mb-2">Enhanced Progress Analytics</h1>
              <p className="text-muted-foreground">
                Advanced insights powered by AI and behavioral science
              </p>
            </div>

            <EnhancedProgressDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}