import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { ChartCard } from '@/components/charts/ChartCard'
import { fmtEur, fmtN, shortEse } from '@/lib/utils'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts'
import {
  Building2,
  BriefcaseBusiness,
  CircleDollarSign,
  MapPinned,
  ReceiptText,
  Target,
} from 'lucide-react'

const MONTHS = ['Ott', 'Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set']
const MONTH_INDEX: Record<string, number> = { '10': 0, '11': 1, '12': 2, '01': 3, '02': 4, '03': 5, '04': 6, '05': 7, '06': 8, '07': 9, '08': 10, '09': 11 }
const PALETTE = ['#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DB2777', '#65A30D']
const CONFIRMED_STATI = ['Confermata definitiva', 'Confermata con servizi su richiesta']
const TICK = { fontSize: 11 }
const fmtTip = (v: unknown) => typeof v === 'number' ? fmtEur(v) : v
const fmtCountTip = (v: unknown) => typeof v === 'number' ? fmtN(v) : v

type Row = Record<string, string | number>

function uniqSorted(values: Array<string | null>): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort()
}

function truncateLabel(value: string, max = 28) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

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

function renderTopLabel(formatter?: (value: unknown) => string) {
  return (props: { x?: number; y?: number; width?: number; value?: unknown }) => {
    const x = (props.x ?? 0) + (props.width ?? 0) / 2
    const y = (props.y ?? 0) - 8
    const value = formatter ? formatter(props.value) : String(props.value ?? '')
    if (!value) return null
    return <LabelBadge x={x} y={y} value={value} />
  }
}

function renderRightLabel(formatter?: (value: unknown) => string) {
  return (props: { x?: number; y?: number; width?: number; height?: number; value?: unknown }) => {
    const x = (props.x ?? 0) + (props.width ?? 0) + 18
    const y = (props.y ?? 0) + (props.height ?? 0) / 2
    const value = formatter ? formatter(props.value) : String(props.value ?? '')
    if (!value) return null
    return <LabelBadge x={x} y={y} value={value} />
  }
}

function groupCount(rows: ReturnType<typeof useStore.getState>['filtered'], field: string, limit?: number) {
  const map: Record<string, number> = {}
  rows.forEach(r => {
    const key = String(r[field] ?? '(vuoto)')
    map[key] = (map[key] || 0) + 1
  })

  const out = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, shortName: truncateLabel(name), value }))

  return typeof limit === 'number' ? out.slice(0, limit) : out
}

function monthSeries(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const esercizi = uniqSorted(rows.map(r => r.Esercizio))
  const base: Row[] = MONTHS.map(month => ({ month }))

  esercizi.forEach(e => {
    rows
      .filter(r => r.Esercizio === e && typeof r['Data Inserimento'] === 'string')
      .forEach(r => {
        const mm = String(r['Data Inserimento']).slice(5, 7)
        const idx = MONTH_INDEX[mm]
        if (idx !== undefined) {
          const key = shortEse(e)
          base[idx][key] = Number(base[idx][key] ?? 0) + 1
        }
      })
  })

  return { rows: base, esercizi: esercizi.map(shortEse) }
}

function destinationCounts(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const map: Record<string, number> = {}
  rows.forEach(r => {
    const raw = r.Nazioni
    if (!raw) return
    String(raw)
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .forEach(name => {
        map[name] = (map[name] || 0) + 1
      })
  })

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, value]) => ({ name, shortName: truncateLabel(name), value }))
}

function incassoPerEsercizio(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const map: Record<string, number> = {}
  rows.forEach(r => {
    const key = r.Esercizio
    if (!key) return
    map[key] = (map[key] || 0) + (r.Incasso || 0)
  })
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name: shortEse(name), value }))
}

function classificazioneByStato(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const topStates = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      const key = String(r.Stato ?? '(vuoto)')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  const byCategory: Record<string, Row> = {}
  rows.forEach(r => {
    const category = String(r.Classificazione ?? '(vuoto)')
    const state = String(r.Stato ?? '(vuoto)')
    if (!topStates.includes(state)) return
    if (!byCategory[category]) byCategory[category] = { category: truncateLabel(category, 20) }
    byCategory[category][state] = Number(byCategory[category][state] ?? 0) + 1
  })

  return {
    states: topStates,
    rows: Object.values(byCategory).sort((a, b) => Number((b[topStates[0]] ?? 0)) - Number((a[topStates[0]] ?? 0))),
  }
}

function statusMix(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const summary = rows.reduce<Record<string, number>>((acc, r) => {
    const stato = String(r.Stato ?? '')
    const bucket = CONFIRMED_STATI.includes(stato)
      ? 'Confermate'
      : ['Scaduta/Cancellata', 'Annullata con penali', 'Annullata senza penali', 'Non accettato'].includes(stato)
        ? 'Anomalie'
        : 'In lavorazione'

    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {})

  return ['Confermate', 'In lavorazione', 'Anomalie']
    .filter(name => summary[name] != null)
    .map(name => ({ name, value: summary[name] }))
}

function avgPrezzoPerCategoria(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const map: Record<string, { sum: number; count: number }> = {}
  rows.forEach(r => {
    const key = String(r.Classificazione ?? '(vuoto)')
    if (!map[key]) map[key] = { sum: 0, count: 0 }
    map[key].sum += r.Prezzo || 0
    map[key].count += 1
  })

  return Object.entries(map)
    .map(([name, values]) => ({
      name,
      shortName: truncateLabel(name),
      value: values.count ? Math.round(values.sum / values.count) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

function avgLeadDays(rows: ReturnType<typeof useStore.getState>['filtered']) {
  const diffs = rows.flatMap(r => {
    const start = r['Data Inserimento']
    const end = r.Partenza
    if (!start || !end) return []
    const startTs = new Date(String(start)).getTime()
    const endTs = new Date(String(end)).getTime()
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs < startTs) return []
    return [Math.round((endTs - startTs) / 86400000)]
  })
  if (!diffs.length) return null
  return Math.round(diffs.reduce((sum, value) => sum + value, 0) / diffs.length)
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Building2
  tone: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${tone}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  )
}

export function AgenzieDashboard() {
  const { filtered } = useStore()
  const agencyOptions = useMemo(() => uniqSorted(filtered.map(r => r['Agenzia Viaggi'])), [filtered])
  const [selectedAgency, setSelectedAgency] = useState('')

  useEffect(() => {
    if (!selectedAgency) return
    if (agencyOptions.includes(selectedAgency)) return
    setSelectedAgency('')
  }, [agencyOptions, selectedAgency])

  const scopedData = useMemo(() => {
    if (!selectedAgency) return filtered
    return filtered.filter(r => r['Agenzia Viaggi'] === selectedAgency)
  }, [filtered, selectedAgency])

  const summary = useMemo(() => {
    const totalPractices = scopedData.length
    const confirmed = scopedData.filter(r => r.Stato && CONFIRMED_STATI.includes(r.Stato)).length
    const confirmedIncasso = scopedData
      .filter(r => r.Stato && CONFIRMED_STATI.includes(r.Stato))
      .reduce((sum, r) => sum + (r.Incasso || 0), 0)
    const uniqueDestinations = new Set(
      scopedData.flatMap(r => String(r.Nazioni ?? '').split(',').map(v => v.trim()).filter(Boolean))
    ).size
    const uniqueCategories = new Set(scopedData.map(r => r.Classificazione).filter(Boolean)).size
    const leadDays = avgLeadDays(scopedData)

    return { totalPractices, confirmed, confirmedIncasso, uniqueDestinations, uniqueCategories, leadDays }
  }, [scopedData])

  const monthly = useMemo(() => monthSeries(scopedData), [scopedData])
  const classCount = useMemo(() => groupCount(scopedData, 'Classificazione'), [scopedData])
  const stateCount = useMemo(() => groupCount(scopedData, 'Stato'), [scopedData])
  const topDestinations = useMemo(() => destinationCounts(scopedData), [scopedData])
  const topAreas = useMemo(() => groupCount(scopedData, 'Area geografica', 10), [scopedData])
  const topCanali = useMemo(() => groupCount(scopedData, 'Canale di vendita', 8), [scopedData])
  const byExercise = useMemo(() => incassoPerEsercizio(scopedData), [scopedData])
  const stacked = useMemo(() => classificazioneByStato(scopedData), [scopedData])
  const statoMix = useMemo(() => statusMix(scopedData), [scopedData])
  const avgCategoryValue = useMemo(() => avgPrezzoPerCategoria(scopedData), [scopedData])

  return (
    <div className="flex h-full flex-col gap-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
            className="min-w-[260px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tutte le agenzie</option>
            {agencyOptions.map(agency => (
              <option key={agency} value={agency}>{agency}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {selectedAgency || 'Vista aggregata'} · {fmtN(scopedData.length)} pratiche
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <KpiCard label="Pratiche totali" value={fmtN(summary.totalPractices)} icon={ReceiptText} tone="bg-blue-50 text-blue-600" />
        <KpiCard label="Pratiche confermate" value={fmtN(summary.confirmed)} icon={Target} tone="bg-green-50 text-green-600" />
        <KpiCard label="Incassato confermate" value={fmtEur(summary.confirmedIncasso)} icon={CircleDollarSign} tone="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Destinazioni uniche" value={fmtN(summary.uniqueDestinations)} icon={MapPinned} tone="bg-orange-50 text-orange-600" />
        <KpiCard label="Categorie attive" value={fmtN(summary.uniqueCategories)} icon={BriefcaseBusiness} tone="bg-violet-50 text-violet-600" />
        <KpiCard label="Lead time medio" value={summary.leadDays != null ? `${summary.leadDays} gg` : '–'} icon={Building2} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <ChartCard title="Evoluzione pratiche nel tempo per esercizio">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip formatter={fmtCountTip} />
              <Legend iconSize={10} />
              {monthly.esercizi.map((e, i) => (
                <Line key={e} type="monotone" dataKey={e} stroke={PALETTE[i % PALETTE.length]} dot={{ r: 3 }} strokeWidth={2.5} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incasso per esercizio">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byExercise} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={TICK} />
              <YAxis tick={TICK} tickFormatter={v => fmtEur(typeof v === 'number' ? v : 0)} />
              <Tooltip formatter={fmtTip} />
              <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" content={renderTopLabel((v) => fmtEur(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pratiche per categoria">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={classCount} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="shortName" tick={TICK} width={210} />
              <Tooltip formatter={fmtCountTip} />
              <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="value" content={renderRightLabel((v) => fmtN(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pratiche per stato">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={stateCount} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="shortName" tick={TICK} width={230} />
              <Tooltip formatter={fmtCountTip} />
              <Bar dataKey="value" fill="#0891B2" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="value" content={renderRightLabel((v) => fmtN(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Categoria con dettaglio stato">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stacked.rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="category" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip formatter={fmtCountTip} />
              <Legend iconSize={10} />
              {stacked.states.map((state, i) => (
                <Bar key={state} dataKey={state} stackId="stato" fill={PALETTE[i % PALETTE.length]} radius={i === stacked.states.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top destinazioni più richieste">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topDestinations} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="shortName" tick={TICK} width={220} />
              <Tooltip formatter={fmtCountTip} />
              <Bar dataKey="value" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="value" content={renderRightLabel((v) => fmtN(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ripartizione canali di vendita">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={topCanali} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {topCanali.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={fmtCountTip} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top aree geografiche">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topAreas} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="shortName" tick={TICK} width={220} />
              <Tooltip formatter={fmtCountTip} />
              <Bar dataKey="value" fill="#D97706" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="value" content={renderRightLabel((v) => fmtN(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mix operativo pratiche">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={statoMix} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {statoMix.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={fmtCountTip} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Prezzo medio per categoria">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={avgCategoryValue} layout="vertical" margin={{ right: 16 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={TICK} tickFormatter={v => fmtEur(typeof v === 'number' ? v : 0)} />
              <YAxis type="category" dataKey="shortName" tick={TICK} width={210} />
              <Tooltip formatter={fmtTip} />
              <Bar dataKey="value" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="value" content={renderRightLabel((v) => fmtEur(typeof v === 'number' ? v : 0))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
