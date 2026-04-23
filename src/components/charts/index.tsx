import { useStore } from '@/lib/store'
import { ChartCard } from './ChartCard'
import { useMemo } from 'react'
import { getYoYPair, shortEse, fmt } from '@/lib/utils'
import type { Pratica } from '@/lib/types'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'

const PALETTE = ['#1F4E79','#2E75B6','#5BA3D9','#9DC3E6','#BDD7EE','#E2F0FB',
                 '#c0392b','#27ae60','#f39c12','#8e44ad','#16a085']

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
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={8} />
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
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={8} />
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
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend iconSize={8} />
          {data.esercizi.map((e, i) => (
            <Line key={e} type="monotone" dataKey={e} stroke={PALETTE[i]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Agenzie YoY (Barre orizzontali) ─────────────────────────────────────────
export function AgenzieYoYChart() {
  const { filtered } = useStore()
  const { data, prev, curr } = useMemo(() => {
    const esercizi = [...new Set(filtered.map(r => r.Esercizio).filter(Boolean) as string[])].sort()
    const [prevEse, currEse] = getYoYPair(esercizi)
    const incCurr: Record<string, number> = {}
    const incPrev: Record<string, number> = {}
    filtered.forEach(r => {
      const a = r['Agenzia Viaggi']; if (!a) return
      const v = r.Incasso || 0
      if (r.Esercizio === currEse) incCurr[a] = (incCurr[a] || 0) + v
      else if (r.Esercizio === prevEse) incPrev[a] = (incPrev[a] || 0) + v
    })
    const prev = shortEse(prevEse)
    const curr = shortEse(currEse)
    const data = Object.entries(incCurr).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name, vCurr]) => ({
      name: name.length > 20 ? name.slice(0, 18) + '…' : name,
      [curr]: vCurr,
      [prev]: incPrev[name] || 0,
    }))
    return { data, prev, curr }
  }, [filtered])
  return (
    <ChartCard title={`Confronto incasso agenzie (${prev} vs ${curr})`}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
          <Tooltip formatter={fmtTip} />
          <Legend iconSize={8} />
          <Bar dataKey={prev} fill="#9DC3E6" radius={[0,2,2,0]} />
          <Bar dataKey={curr} fill="#1F4E79" radius={[0,2,2,0]} />
        </BarChart>
      </ResponsiveContainer>
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
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={130} />
          <Tooltip formatter={fmtTip} />
          <Bar dataKey="value" fill="#5BA3D9" radius={[0,2,2,0]} />
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
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={110} />
          <Tooltip formatter={fmtTip} />
          <Bar dataKey="Prezzo medio" fill="#2E75B6" radius={[0,2,2,0]} />
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
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={fmtTip} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
