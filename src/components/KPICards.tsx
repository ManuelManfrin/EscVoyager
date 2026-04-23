import { useStore } from '@/lib/store'
import { fmt, fmtN } from '@/lib/utils'
import { useMemo } from 'react'
import { TrendingUp, Wallet, AlertTriangle, FileText, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KPICards() {
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
    <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          title={label}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            bg,
            color
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap">{value}</span>
        </div>
      ))}
    </div>
  )
}
