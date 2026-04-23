import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { fmt, fmtN } from '@/lib/utils'
import { useMemo } from 'react'
import { TrendingUp, Wallet, AlertTriangle, FileText, Banknote } from 'lucide-react'

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
    { label: 'Pratiche totali', value: fmtN(kpi.totali), icon: FileText,   color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Fatturato',       value: fmt(kpi.fatturato), icon: TrendingUp, color: 'text-indigo-600',bg: 'bg-indigo-50' },
    { label: 'Incassato',       value: fmt(kpi.incassato), icon: Banknote,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Da Incassare',    value: fmt(kpi.daInc),     icon: Wallet,     color: 'text-orange-600',bg: 'bg-orange-50' },
    { label: 'Anomalie',        value: fmtN(kpi.anomalie), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3 p-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`${bg} ${color} p-2 rounded-lg shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{label}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
