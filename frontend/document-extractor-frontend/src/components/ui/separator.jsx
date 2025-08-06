import React from 'react'
import { cn } from '@/lib/utils.js'

const Separator = ({ className = '', orientation = 'horizontal', ...props }) => {
  return (
    <div
      role="separator"
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
