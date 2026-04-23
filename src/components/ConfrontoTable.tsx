import { useStore } from '@/lib/store'
import { compareEsercizi, fmtEur, shortEse } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortDir = 1 | -1
type SortField = 'agenzia' | 'incA' | 'incB' | 'delta' | 'deltapct' | 'npratiche'

export function ConfrontoTable() {
  const { filtered } = useStore()
  const [sortField, setSortField] = useState<SortField>('incB')
  const [sortDir, setSortDir]     = useState<SortDir>(-1)
  const [search, setSearch]       = useState('')
  const [periodA, setPeriodA]     = useState('')
  const [periodB, setPeriodB]     = useState('')

  const esercizi = useMemo(
    () => [...new Set(filtered.map(r => r.Esercizio).filter(Boolean) as string[])].sort(),
    [filtered]
  )

  useEffect(() => {
    const fallbackA = esercizi.length > 1 ? esercizi[esercizi.length - 2] : (esercizi[0] ?? '')
    const fallbackB = esercizi[esercizi.length - 1] ?? ''

    setPeriodA(current => esercizi.includes(current) ? current : fallbackA)
    setPeriodB(current => esercizi.includes(current) ? current : fallbackB)
  }, [esercizi])

  useEffect(() => {
    if (!periodA || !periodB) return
    if (compareEsercizi(periodA, periodB) <= 0) return

    setPeriodA(periodB)
    setPeriodB(periodA)
  }, [periodA, periodB])

  const { rows, periodALabel, periodBLabel } = useMemo(() => {
    const agenzie = [...new Set(filtered.map(r => r['Agenzia Viaggi']).filter(Boolean) as string[])]

    const rows = agenzie.map(a => {
      const dA = periodA ? filtered.filter(r => r['Agenzia Viaggi'] === a && r.Esercizio === periodA) : []
      const dB = periodB ? filtered.filter(r => r['Agenzia Viaggi'] === a && r.Esercizio === periodB) : []
      const incA = dA.reduce((s, r) => s + (r.Incasso || 0), 0)
      const incB = dB.reduce((s, r) => s + (r.Incasso || 0), 0)
      const delta = incB - incA
      const deltapct = incA > 0 ? delta / incA * 100 : null
      const npratiche = filtered.filter(r => r['Agenzia Viaggi'] === a).length
      return { agenzia: a, incA, incB, delta, deltapct, npratiche }
    })
    return {
      rows,
      periodALabel: shortEse(periodA || null),
      periodBLabel: shortEse(periodB || null),
    }
  }, [filtered, periodA, periodB])

  const filtered2 = useMemo(() => {
    const s = search.toLowerCase()
    return rows.filter(r => !s || r.agenzia.toLowerCase().includes(s))
  }, [rows, search])

  const sorted = useMemo(() => [...filtered2].sort((a, b) => {
    const va = a[sortField] ?? -Infinity
    const vb = b[sortField] ?? -Infinity
    return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir
  }), [filtered2, sortField, sortDir])

  const sort = (f: SortField) => {
    if (f === sortField) setSortDir(d => (d === 1 ? -1 : 1) as SortDir)
    else { setSortField(f); setSortDir(-1) }
  }

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th className="text-left px-4 py-3 font-semibold cursor-pointer whitespace-nowrap hover:bg-[#1a3f63]"
        onClick={() => sort(field)}>
      <span className="flex items-center gap-1.5">
        {label}
        {sortField === field
          ? sortDir === 1 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          : <span className="text-[#93C5FD]/40">⇅</span>}
      </span>
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca agenzia…"
          className="w-72 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        <select
          value={periodA}
          onChange={e => {
            const next = e.target.value
            if (periodB && compareEsercizi(next, periodB) > 0) {
              setPeriodA(periodB)
              setPeriodB(next)
              return
            }
            setPeriodA(next)
          }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          {esercizi.map(e => <option key={e} value={e}>Periodo A · {shortEse(e)}</option>)}
        </select>
        <select
          value={periodB}
          onChange={e => {
            const next = e.target.value
            if (periodA && compareEsercizi(periodA, next) > 0) {
              setPeriodB(periodA)
              setPeriodA(next)
              return
            }
            setPeriodB(next)
          }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          {esercizi.map(e => <option key={e} value={e}>Periodo B · {shortEse(e)}</option>)}
        </select>
        <span className="text-sm text-gray-400">{sorted.length} agenzie</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#1F4E79] text-white sticky top-0 z-10">
            <tr>
              <Th field="agenzia"   label="Agenzia" />
              <Th field="incA"      label={`Incasso ${periodALabel}`} />
              <Th field="incB"      label={`Incasso ${periodBLabel}`} />
              <Th field="delta"     label="Δ Assoluto" />
              <Th field="deltapct"  label="Δ %" />
              <Th field="npratiche" label="N° Pratiche" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const dCls = r.delta > 0 ? 'text-green-700 font-semibold' : r.delta < 0 ? 'text-red-600 font-semibold' : ''
              const pct = r.deltapct != null ? `${r.deltapct >= 0 ? '+' : ''}${r.deltapct.toFixed(1)}%` : 'N/D'
              return (
                <tr key={r.agenzia} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/60'}>
                  <td className="px-4 py-2.5 font-medium max-w-[200px] truncate">{r.agenzia}</td>
                  <td className="px-4 py-2.5 text-right">{fmtEur(r.incA)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmtEur(r.incB)}</td>
                  <td className={`px-4 py-2.5 text-right ${dCls}`}>{r.delta >= 0 ? '+' : ''}{fmtEur(r.delta)}</td>
                  <td className={`px-4 py-2.5 text-right ${dCls}`}>{pct}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{r.npratiche}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
