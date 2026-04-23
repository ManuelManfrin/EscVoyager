import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface ChartCardProps { title: string; children: ReactNode; className?: string }

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-4 shrink-0">{title}</h3>
      {children}
    </Card>
  )
}
