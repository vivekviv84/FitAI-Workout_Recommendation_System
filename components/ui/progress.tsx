'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => {
  const percent = Math.max(0, Math.min(100, value))
  return (
    <div
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full bg-primary transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
})

Progress.displayName = 'Progress'

export { Progress }
