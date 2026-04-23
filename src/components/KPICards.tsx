import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { fmt, fmtN } from '@/lib/utils'
import { useMemo } from 'react'
import { TrendingUp, Wallet, AlertTriangle, FileText, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardsProps { collapsed?: boolean }

export function KPICards({ collapsed = false }: KPICardsProps) {
  const { filtered } = useStore()

  const kpi = useMemo(() => {
    const totali   = filtered.length
    const fatturato= filtered.reduce((s, r) => s + (r.Prezzo  || 0), 0)
    const incassato= filtered.reduce((s, r) => s + (r.Incasso || 0), 0)
    const daInc    = filtered.reduce((s, r) => s + (r['Da Incassare'] || 0), 0)
    const anomalie = filtered.filter(r =>
      r.Stato && ['Scaduta/Cancellata','Annullata con penali','Annullata senza penali','Non accettato'].includes(r.Stato)
    ).length
    return { totali, fatturato, incassato, daInc, anomalie }
  }, [filtered])

  const cards = [
    { label: 'Pratiche totali', value: fmtN(kpi.totali),   icon: FileText,      color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Fatturato',       value: fmt(kpi.fatturato),  icon: TrendingUp,    color: 'text-indigo-600',bg: 'bg-indigo-50' },
    { label: 'Incassato',       value: fmt(kpi.incassato),  icon: Banknote,      color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Da Incassare',    value: fmt(kpi.daInc),      icon: Wallet,        color: 'text-orange-600',bg: 'bg-orange-50' },
    { label: 'Anomalie',        value: fmtN(kpi.anomalie),  icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50' },
  ]

  return (
    <div className={cn(
      'relative overflow-hidden bg-white border-b border-gray-200/80 transition-[height] duration-300 ease-in-out shrink-0',
      collapsed ? 'h-[48px]' : 'h-[88px]'
    )}>
      {/* ── Mini badges (visibili quando collapsed) ── */}
      <div className={cn(
        'absolute inset-0 flex items-center gap-2.5 px-5 transition-all duration-300',
        collapsed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      )}>
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} title={label}
            className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold', bg, color)}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Full cards (visibili quando non collapsed) ── */}
      <div className={cn(
        'absolute inset-0 grid grid-cols-5 gap-3 px-5 py-3 transition-all duration-300',
        collapsed ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
      )}>
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={cn(bg, color, 'p-2 rounded-lg shrink-0')}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
