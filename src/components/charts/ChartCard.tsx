import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface ChartCardProps { title: string; children: ReactNode; className?: string }

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h3>
      {children}
    </Card>
  )
}
