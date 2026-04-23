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
          'inline-flex items-center justify-center gap-1.5 rounded font-semibold cursor-pointer transition-colors',
          size === 'sm' && 'text-xs px-3 py-1.5',
          size === 'md' && 'text-xs px-3.5 py-2',
          variant === 'primary' && 'bg-[#2E75B6] text-white hover:bg-[#1F4E79]',
          variant === 'secondary' && 'bg-[#5BA3D9] text-white hover:bg-[#2E75B6]',
          variant === 'ghost' && 'bg-transparent text-[#9DC3E6] border border-[#9DC3E6] hover:bg-[#9DC3E6]/10',
          variant === 'danger' && 'bg-[#e74c3c] text-white hover:bg-[#c0392b]',
          variant === 'success' && 'bg-[#27ae60] text-white hover:bg-[#219150]',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
