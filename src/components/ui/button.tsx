import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md font-medium cursor-pointer transition-colors',
          size === 'sm' && 'text-sm px-3.5 py-2',
          size === 'md' && 'text-sm px-4 py-2.5',
          variant === 'primary' && 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]',
          variant === 'secondary' && 'bg-[#5BA3D9] text-white hover:bg-[#2563EB]',
          variant === 'ghost' && 'bg-transparent text-[#93C5FD] border border-[#93C5FD]/60 hover:bg-[#93C5FD]/10',
          variant === 'danger' && 'bg-[#e74c3c] text-white hover:bg-[#c0392b]',
          variant === 'success' && 'bg-[#16a34a] text-white hover:bg-[#15803d]',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
