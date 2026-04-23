import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
  options: string[]
  value: string[]          // [] = tutti selezionati (nessun filtro)
  onChange: (v: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({ options, value, onChange, placeholder = 'Tutti', className }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected = value.length === 0
  const label = allSelected ? placeholder : value.length === 1 ? value[0] : `${value.length} selezionati`

  const toggle = (opt: string) => {
    if (allSelected) { onChange(options.filter(o => o !== opt)); return }
    const next = value.includes(opt) ? value.filter(o => o !== opt) : [...value, opt]
    onChange(next.length === options.length ? [] : next)
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1 bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs hover:border-blue-400 focus:outline-none focus:border-blue-500"
      >
        <span className={cn('truncate', allSelected ? 'text-gray-400' : 'text-gray-800')}>{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {!allSelected && (
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); onChange([]) }} />
          )}
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          <div
            className={cn('px-3 py-2 text-xs cursor-pointer hover:bg-blue-50', allSelected && 'font-semibold text-blue-700')}
            onClick={() => { onChange([]); setOpen(false) }}
          >
            Tutti
          </div>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={allSelected ? true : value.includes(opt)}
                onChange={() => toggle(opt)}
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
