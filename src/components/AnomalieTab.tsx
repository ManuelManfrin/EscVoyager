import { useStore } from '@/lib/store'
import { useMemo, useState } from 'react'
import { ChartCard } from '@/components/charts/ChartCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fmt, fmtN, fmtEur } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Ban, FileX } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'

const STATI_ANOMALIA = ['Scaduta/Cancellata', 'Annullata con penali', 'Annullata senza penali', 'Non accettato']

const PALETTE_ANOM = ['#DC2626', '#EA580C', '#D97706', '#7C3AED']
const PALETTE_BAR  = ['#2563EB','#DC2626','#16A34A','#D97706','#7C3AED','#0891B2','#DB2777','#65A30D','#EA580C','#0D9488']

const TICK = { fontSize: 11 }
const fmtTip = (v: unknown) => String(typeof v === 'number' ? v : v)

function statoVariant(stato: string): 'danger' | 'warning' | 'neutral' {
  if (['Scaduta/Cancellata','Annullata con penali','Annullata senza penali'].includes(stato)) return 'danger'
  if (stato === 'Non accettato') return 'neutral'
  return 'warning'
}

export function AnomalieTab() {
  const { filtered } = useStore()
  const [search, setSearch] = useState('')

  const anomalie = useMemo(
    () => filtered.filter(r => r.Stato && STATI_ANOMALIA.includes(r.Stato)),
    [filtered]
  )

  const kpi = useMemo(() => {
    const totale    = anomalie.length
    const pctTot    = filtered.length ? (totale / filtered.length * 100) : 0
    const prezzoPerso = anomalie.reduce((s, r) => s + (r.Prezzo || 0), 0)
    const conPenali = anomalie.filter(r => r.Stato === 'Annullata con penali').length
    return { totale, pctTot, prezzoPerso, conPenali }
  }, [anomalie, filtered])

  const byStato = useMemo(() => {
    const map: Record<string, number> = {}
    anomalie.forEach(r => { if (r.Stato) map[r.Stato] = (map[r.Stato] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [anomalie])

  const byAgenzia = useMemo(() => {
    const map: Record<string, number> = {}
    anomalie.forEach(r => { if (r['Agenzia Viaggi']) map[r['Agenzia Viaggi']] = (map[r['Agenzia Viaggi']] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([name, value]) => ({ name: name.length > 24 ? name.slice(0, 22) + '…' : name, value }))
  }, [anomalie])

  const byTC = useMemo(() => {
    const map: Record<string, Record<string, number> & { _tot: number }> = {}
    anomalie.forEach(r => {
      const tc = r['Travel Consultant']; if (!tc || !r.Stato) return
      if (!map[tc]) map[tc] = { _tot: 0, ...Object.fromEntries(STATI_ANOMALIA.map(s => [s, 0])) }
      map[tc][r.Stato] = (map[tc][r.Stato] || 0) + 1
      map[tc]._tot++
    })
    return Object.entries(map)
      .sort((a, b) => b[1]._tot - a[1]._tot).slice(0, 12)
      .map(([tc, vals]) => {
        const { _tot, ...rest } = vals
        return { name: tc.length > 22 ? tc.slice(0, 20) + '…' : tc, ...rest }
      })
  }, [anomalie])

  const mensile = useMemo(() => {
    const months = ['Ott', 'Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set']
    const monthMap: Record<string, number> = { '10': 0, '11': 1, '12': 2, '01': 3, '02': 4, '03': 5, '04': 6, '05': 7, '06': 8, '07': 9, '08': 10, '09': 11 }
    const rows = months.map(m => ({ month: m, count: 0 }))
    anomalie.forEach(r => {
      if (!r['Data Inserimento']) return
      const mm = r['Data Inserimento'].substring(5, 7)
      const idx = monthMap[mm]
      if (idx !== undefined) rows[idx].count++
    })
    return rows
  }, [anomalie])

  const tableRows = useMemo(() => {
    if (!search) return anomalie
    const s = search.toLowerCase()
    return anomalie.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s)))
  }, [anomalie, search])

  const kpiCards = [
    { label: 'Totale anomalie',   value: fmtN(kpi.totale),                    icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50' },
    { label: '% sul totale',      value: kpi.pctTot.toFixed(1) + '%',          icon: TrendingDown,  color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Fatturato a rischio',value: fmt(kpi.prezzoPerso),                icon: FileX,         color: 'text-rose-600',   bg: 'bg-rose-50' },
    { label: 'Con penali',         value: fmtN(kpi.conPenali),                 icon: Ban,           color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="space-y-5">

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`${bg} ${color} p-2 rounded-lg shrink-0`}>
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

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">

        {/* Donut per tipo */}
        <ChartCard title="Distribuzione per tipo">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={byStato} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {byStato.map((_, i) => <Cell key={i} fill={PALETTE_ANOM[i % PALETTE_ANOM.length]} />)}
              </Pie>
              <Tooltip formatter={fmtTip} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Trend mensile */}
        <ChartCard title="Andamento mensile">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mensile}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={TICK} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Anomalie" stroke="#DC2626" strokeWidth={2} dot={{ r: 3, fill: '#DC2626' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Per agenzia */}
        <ChartCard title="Anomalie per agenzia">
          <ResponsiveContainer width="100%" height={Math.max(byAgenzia.length * 28 + 50, 160)}>
            <BarChart data={byAgenzia} layout="vertical" margin={{ right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={TICK} width={150} />
              <Tooltip />
              <Bar dataKey="value" name="Anomalie" fill="#DC2626" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Per Travel Consultant */}
        <ChartCard title="Anomalie per Travel Consultant">
          <ResponsiveContainer width="100%" height={Math.max(byTC.length * 28 + 50, 160)}>
            <BarChart data={byTC} layout="vertical" margin={{ right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={TICK} width={140} />
              <Tooltip />
              {STATI_ANOMALIA.map((s, i) => (
                <Bar key={s} dataKey={s} name={s} stackId="a" fill={PALETTE_BAR[i]} radius={i === STATI_ANOMALIA.length - 1 ? [0, 2, 2, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Tabella dettaglio */}
      <div className="bg-white rounded-xl border border-gray-200/80">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca in tutte le anomalie…"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-sm text-gray-400 shrink-0">{tableRows.length.toLocaleString('it')} pratiche</span>
        </div>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#1F4E79] text-white sticky top-0 z-10">
              <tr>
                {['Nr Pratica', 'Esercizio', 'Data Ins.', 'Stato', 'TC', 'Agenzia', 'Macro-categoria', 'Prezzo'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/60'}>
                  <td className="px-4 py-2.5 font-mono text-gray-600">{r['Nr Pratica']}</td>
                  <td className="px-4 py-2.5 text-gray-500">{r.Esercizio}</td>
                  <td className="px-4 py-2.5">{r['Data Inserimento']}</td>
                  <td className="px-4 py-2.5">
                    {r.Stato && <Badge variant={statoVariant(r.Stato)}>{r.Stato}</Badge>}
                  </td>
                  <td className="px-4 py-2.5">{r['Travel Consultant']}</td>
                  <td className="px-4 py-2.5 max-w-[180px] truncate">{r['Agenzia Viaggi']}</td>
                  <td className="px-4 py-2.5">{r['Macro-categoria']}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{fmt(r.Prezzo)}</td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Nessuna anomalia nei dati filtrati</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
