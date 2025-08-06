import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils.js'

export function Select({ value, onChange, children, className }) {
  return (
    <div className={cn('relative w-full', className)}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onChange })
      )}
    </div>
  )
}

export function SelectTrigger({ value, placeholder, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
        className
      )}
    >
      {children || <SelectValue value={value} placeholder={placeholder} />}
      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
    </button>
  )
}

// 🆕 Added SelectValue component
export function SelectValue({ value, placeholder, className }) {
  return (
    <span className={cn('truncate', className)}>
      {value || placeholder}
    </span>
  )
}

export function SelectContent({ open, children, className }) {
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md',
        className
      )}
    >
      <ul className="max-h-60 overflow-auto py-1 text-sm">{children}</ul>
    </div>
  )
}

export function SelectItem({ value, onChange, children, className }) {
  return (
    <li
      className={cn(
        'cursor-pointer px-4 py-2 hover:bg-accent hover:text-accent-foreground',
        className
      )}
      onClick={() => onChange(value)}
    >
      {children}
    </li>
  )
}
