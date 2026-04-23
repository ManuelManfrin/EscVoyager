import { cn } from '@/lib/utils'

interface SingleSelectProps {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SingleSelect({ options, value, onChange, placeholder = '— Tutti —', className }: SingleSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors',
        !value && 'text-gray-400',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
