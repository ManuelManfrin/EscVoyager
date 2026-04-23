import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  children: ReactNode
  className?: string
  headerRight?: ReactNode
}

export function ChartCard({ title, children, className = '', headerRight }: ChartCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3 shrink-0">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {headerRight && <div className="flex shrink-0 items-center">{headerRight}</div>}
      </div>
      {children}
    </Card>
  )
}
