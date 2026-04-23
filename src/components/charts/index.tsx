import { useStore } from '@/lib/store'
import { ChartCard } from './ChartCard'
import { useMemo, useState } from 'react'
import { shortEse, fmt, fmtN } from '@/lib/utils'
import type { Pratica } from '@/lib/types'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  LabelList,
} from 'recharts'
import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react'

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
const fmtTip  = (v: unknown): string => fmt(typeof v === 'number' ? v : 0)
const truncateLabel = (value: string, max = 32) => value.length > max ? `${value.slice(0, max - 1)}…` : value
function renderRightLabel(formatter?: (value: unknown) => string) {
  function LabelBadge({
    x,
    y,
    value,
    fill = '#334155',
  }: {
    x: number
    y: number
    value: string
    fill?: string
  }) {
    const width = Math.max(20, value.length * 6.5 + 10)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={-width / 2}
          y={-9}
          width={width}
          height={18}
          rx={6}
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(148,163,184,0.35)"
        />
        <text textAnchor="middle" dominantBaseline="middle" fill={fill} fontSize={11} fontWeight={600}>
          {value}
        </text>
      </g>
    )
  }

  return (props: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; value?: unknown }) => {
    const x = Number(props.x ?? 0) + Number(props.width ?? 0) + 18
    const y = Number(props.y ?? 0) + Number(props.height ?? 0) / 2
    const value = formatter ? formatter(props.value) : String(props.value ?? '')
    if (!value) return null
    return <LabelBadge x={x} y={y} value={value} />
  }
}

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
            <Line key={e} type="monotone" dataKey={e} stroke={PALETTE[i]} dot={{ r: 3 }} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Agenzie per Esercizio (Barre orizzontali, scrollabile) ───────────────────
export function AgenzieYoYChart() {
  const { filtered } = useStore()
  const [sortMetric, setSortMetric] = useState('__total')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

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
      .sort((a, b) => {
        const aValue = sortMetric === '__total'
          ? a._total
          : Number(a[sortMetric as keyof typeof a] ?? 0)
        const bValue = sortMetric === '__total'
          ? b._total
          : Number(b[sortMetric as keyof typeof b] ?? 0)

        if (aValue === bValue) {
          return a.name.localeCompare(b.name)
        }

        return sortDir === 'asc' ? aValue - bValue : bValue - aValue
      })
      .map(({ _total, ...rest }) => rest)

    return { data, esercizi }
  }, [filtered, sortDir, sortMetric])

  const rowH = esercizi.length * 20 + 10
  const chartH = data.length * rowH + 50

  const headerControls = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        value={sortMetric}
        onChange={e => setSortMetric(e.target.value)}
        className="h-8 rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
      >
        <option value="__total">Aggregato</option>
        {esercizi.map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
      <div className="inline-flex items-center rounded-md border border-gray-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setSortDir('desc')}
          title="Ordine decrescente"
          aria-label="Ordine decrescente"
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${sortDir === 'desc' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ArrowDownAZ className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setSortDir('asc')}
          title="Ordine crescente"
          aria-label="Ordine crescente"
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${sortDir === 'asc' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ArrowUpAZ className="size-4" />
        </button>
      </div>
    </div>
  )

  return (
    <ChartCard
      title="Confronto incasso agenzie per Esercizio"
      className="flex-1 flex flex-col min-h-0"
      headerRight={headerControls}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResponsiveContainer width="100%" height={chartH}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
            <YAxis type="category" dataKey="name" tick={TICK} width={150} />
            <Tooltip formatter={fmtTip} />
            <Legend iconSize={10} />
            {esercizi.map((e, i) => (
              <Bar key={e} dataKey={e} fill={PALETTE[i % PALETTE.length]} radius={[0, 2, 2, 0]}>
                <LabelList dataKey={e} content={renderRightLabel((v) => fmt(typeof v === 'number' ? v : 0))} />
              </Bar>
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
      .map(([name, value]) => ({ name, shortName: truncateLabel(name), value }))
  }, [filtered])
  return (
    <ChartCard title="Prezzo per area geografica">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="shortName" tick={TICK} width={220} />
          <Tooltip formatter={fmtTip} />
          <Bar dataKey="value" fill="#2563EB" radius={[0,2,2,0]} barSize={18}>
            <LabelList dataKey="value" content={renderRightLabel((v) => fmt(typeof v === 'number' ? v : 0))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Nazioni top (Prezzo medio) ───────────────────────────────────────────────
export function NazioniChart() {
  const { filtered } = useStore()
  const data = useMemo(() => {
    const map: Record<string, {sum:number,count:number,min:number,max:number}> = {}
    filtered.forEach(r => {
      const k = r.Nazioni; if (!k || k === '(vuoto)') return
      const prezzo = r.Prezzo || 0
      if (!map[k]) map[k] = { sum: 0, count: 0, min: prezzo, max: prezzo }
      map[k].sum += prezzo
      map[k].count++
      map[k].min = Math.min(map[k].min, prezzo)
      map[k].max = Math.max(map[k].max, prezzo)
    })
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        shortName: `${truncateLabel(name, 24)} (${v.count})`,
        'Prezzo medio': v.count ? Math.round(v.sum/v.count) : 0,
        occorrenze: v.count,
        min: v.min,
        max: v.max,
        rangeBase: v.min,
        rangeSpan: Math.max(0, v.max - v.min),
      }))
      .sort((a,b) => b['Prezzo medio'] - a['Prezzo medio']).slice(0,15)
  }, [filtered])
  return (
    <ChartCard title="Top 15 nazioni – prezzo medio pratica">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={TICK} tickFormatter={fmtTick} />
          <YAxis type="category" dataKey="shortName" tick={TICK} width={220} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as {
                name: string
                'Prezzo medio': number
                occorrenze: number
                min: number
                max: number
              }

              return (
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
                  <div className="font-semibold text-gray-900">{row.name}</div>
                  <div className="mt-1 text-gray-600">Prezzo medio: <span className="font-medium text-gray-900">{fmt(row['Prezzo medio'])}</span></div>
                  <div className="text-gray-600">Occorrenze: <span className="font-medium text-gray-900">{fmtN(row.occorrenze)}</span></div>
                  <div className="text-gray-600">Min: <span className="font-medium text-gray-900">{fmt(row.min)}</span></div>
                  <div className="text-gray-600">Max: <span className="font-medium text-gray-900">{fmt(row.max)}</span></div>
                </div>
              )
            }}
          />
          <Bar dataKey="rangeBase" stackId="range" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="rangeSpan" stackId="range" fill="#0891B2" fillOpacity={0.18} radius={[0,2,2,0]} barSize={10} isAnimationActive={false} />
          <Bar dataKey="Prezzo medio" fill="#0891B2" radius={[0,2,2,0]} barSize={18}>
            <LabelList dataKey="Prezzo medio" content={renderRightLabel((v) => fmt(typeof v === 'number' ? v : 0))} />
          </Bar>
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
