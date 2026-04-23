import { useStore } from '@/lib/store'
import { ChartCard } from './ChartCard'
import { useMemo } from 'react'
import { shortEse, fmt } from '@/lib/utils'
import type { Pratica } from '@/lib/types'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'

const PALETTE = [
  '#2563EB', // blu
  '#DC2626', // rosso
  '#16A34A', // verde
  '#D97706', // ambra
  '#7C3AED', // viola
  '#0891B2', // ciano
  '#DB2777', // fucsia
  '#65A30D', // lime
  '#EA580C', // arancione
  '#0D9488', // teal
]

const TICK = { fontSize: 11 }
const fmtTick = (v: unknown) => fmt(typeof v === 'number' ? v : 0)
const fmtTip  = (v: unknown) => fmt(typeof v === 'number' ? v : 0)

function groupBy(data: Pratica[], field: keyof Pratica, valField: keyof Pratica) {
  const map: Record<string, number> = {}
  data.forEach(r => {
    const k = String(r[field] ?? '(vuoto)')
    map[k] = (map[k] || 0) + (Number(r[valField]) || 0)
  })
  return map
}

// ── Stato (Donut) ────────────────────────────────────────────────────────────
export function StatoChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map = groupBy(filtered, 'Stato', 'Prezzo')
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value }))
  }, [filtered])
  return (
    <ChartCard title="Distribuzione stati">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Macro-categoria (Pie) ────────────────────────────────────────────────────
export function MacroChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map = groupBy(filtered, 'Macro-categoria', 'Prezzo')
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value }))
  }, [filtered])
  return (
    <ChartCard title="Macro-categoria">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Mensile (Linee) ──────────────────────────────────────────────────────────
export function MensileChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const months = ['Ott','Nov','Dic','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set']
    const monthMap: Record<string,number> = {'10':0,'11':1,'12':2,'01':3,'02':4,'03':5,'04':6,'05':7,'06':8,'07':9,'08':10,'09':11}
    const esercizi = [...new Set(filtered.map(r => r.Esercizio).filter(Boolean) as string[])].sort()
    const base: Record<string, string | number>[] = months.map(m => ({ month: m }))
    esercizi.forEach(e => {
      filtered.filter(r => r.Esercizio === e && r['Data Inserimento']).forEach(r => {
        const mm = r['Data Inserimento']!.substring(5, 7)
        const idx = monthMap[mm]
        if (idx !== undefined) base[idx][e] = ((base[idx][e] as number) || 0) + 1
      })
    })
    return { rows: base, esercizi }
  }, [filtered])
  return (
    <ChartCard title="Andamento mensile inserimenti">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={TICK} />
          <YAxis tick={TICK} />
          <Tooltip />
          <Legend iconSize={10} />
          {data.esercizi.map((e, i) => (
            <Line key={e} type="monotone" dataKey={e} stroke={PALETTE[i]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Agenzie per Esercizio (Barre orizzontali, scrollabile) ───────────────────
export function AgenzieYoYChart() {
  const { filtered } = useStore()
  const { data, esercizi } = useMemo(() => {
    const rawEse = [...new Set(filtered.map(r => r.Esercizio).filter(Boolean) as string[])].sort()
    const esercizi = rawEse.map(shortEse)

    const byAgency: Record<string, Record<string, number>> = {}
    filtered.forEach(r => {
      const a = r['Agenzia Viaggi']; if (!a) return
      const e = r.Esercizio; if (!e) return
      const es = shortEse(e)
      if (!byAgency[a]) byAgency[a] = {}
      byAgency[a][es] = (byAgency[a][es] || 0) + (r.Incasso || 0)
    })

    const data = Object.entries(byAgency)
      .map(([name, vals]) => {
        const total = Object.values(vals).reduce((s, v) => s + v, 0)
        return {
          name: name.length > 22 ? name.slice(0, 20) + '…' : name,
          ...vals,
          _total: total,
        }
      })
      .sort((a, b) => b._total - a._total)
      .map(({ _total, ...rest }) => rest)

    return { data, esercizi }
  }, [filtered])

  const rowH = esercizi.length * 20 + 10
  const chartH = data.length * rowH + 50

  return (
    <ChartCard title="Confronto incasso agenzie per Esercizio" className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResponsiveContainer width="100%" height={chartH}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
            <YAxis type="category" dataKey="name" tick={TICK} width={150} />
            <Tooltip formatter={fmtTip} />
            <Legend iconSize={10} />
            {esercizi.map((e, i) => (
              <Bar key={e} dataKey={e} fill={PALETTE[i % PALETTE.length]} radius={[0, 2, 2, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

// ── Area geografica (Barre orizzontali) ─────────────────────────────────────
export function AreaChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map = groupBy(filtered, 'Area geografica', 'Prezzo')
    return Object.entries(map).filter(([k]) => k !== '(vuoto)').sort((a,b)=>b[1]-a[1]).slice(0,12)
      .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0,20)+'…' : name, value }))
  }, [filtered])
  return (
    <ChartCard title="Prezzo per area geografica">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="name" tick={TICK} width={130} />
          <Tooltip formatter={fmtTip} />
          <Bar dataKey="value" fill="#2563EB" radius={[0,2,2,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Nazioni top (Prezzo medio) ───────────────────────────────────────────────
export function NazioniChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map: Record<string, {sum:number,count:number}> = {}
    filtered.forEach(r => {
      const k = r.Nazioni; if (!k || k === '(vuoto)') return
      if (!map[k]) map[k] = { sum: 0, count: 0 }
      map[k].sum += r.Prezzo || 0; map[k].count++
    })
    return Object.entries(map)
      .map(([name, v]) => ({ name, 'Prezzo medio': v.count ? Math.round(v.sum/v.count) : 0 }))
      .sort((a,b) => b['Prezzo medio'] - a['Prezzo medio']).slice(0,15)
  }, [filtered])
  return (
    <ChartCard title="Top 15 nazioni – prezzo medio pratica">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="name" tick={TICK} width={110} />
          <Tooltip formatter={fmtTip} />
          <Bar dataKey="Prezzo medio" fill="#0891B2" radius={[0,2,2,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Canale vendita (Donut) ───────────────────────────────────────────────────
export function CanaleChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map = groupBy(filtered, 'Canale di vendita', 'Prezzo')
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value }))
  }, [filtered])
  return (
    <ChartCard title="Canale di vendita">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
