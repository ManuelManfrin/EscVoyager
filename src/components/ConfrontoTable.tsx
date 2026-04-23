import { useStore } from '@/lib/store'
import { fmtEur, shortEse, getYoYPair } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortDir = 1 | -1
type SortField = 'agenzia' | 'incPrev' | 'incCurr' | 'delta' | 'deltapct' | 'npratiche'

export function ConfrontoTable() {
  const { filtered } = useStore()
  const [sortField, setSortField] = useState<SortField>('incCurr')
  const [sortDir, setSortDir]     = useState<SortDir>(-1)
  const [search, setSearch]       = useState('')

  const { rows, prevLabel, currLabel } = useMemo(() => {
    const esercizi = [...new Set(filtered.map(r => r.Esercizio).filter(Boolean) as string[])].sort()
    const [prev, curr] = getYoYPair(esercizi)
    const agenzie = [...new Set(filtered.map(r => r['Agenzia Viaggi']).filter(Boolean) as string[])]

    const rows = agenzie.map(a => {
      const dPrev = prev ? filtered.filter(r => r['Agenzia Viaggi'] === a && r.Esercizio === prev) : []
      const dCurr = curr ? filtered.filter(r => r['Agenzia Viaggi'] === a && r.Esercizio === curr) : []
      const incPrev = dPrev.reduce((s, r) => s + (r.Incasso || 0), 0)
      const incCurr = dCurr.reduce((s, r) => s + (r.Incasso || 0), 0)
      const delta = incCurr - incPrev
      const deltapct = incPrev > 0 ? delta / incPrev * 100 : null
      const npratiche = filtered.filter(r => r['Agenzia Viaggi'] === a).length
      return { agenzia: a, incPrev, incCurr, delta, deltapct, npratiche }
    })
    return { rows, prevLabel: shortEse(prev), currLabel: shortEse(curr) }
  }, [filtered])

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
    <th className="text-left px-3 py-2 font-semibold cursor-pointer whitespace-nowrap hover:bg-[#1a3f63]"
        onClick={() => sort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {sortField === field
          ? sortDir === 1 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <span className="text-[#9DC3E6]/40">⇅</span>}
      </span>
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 flex items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca agenzia…"
          className="w-64 border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
        <span className="text-xs text-gray-400">{sorted.length} agenzie</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-[#1F4E79] text-white sticky top-0 z-10">
            <tr>
              <Th field="agenzia"   label="Agenzia" />
              <Th field="incPrev"   label={`Incasso ${prevLabel}`} />
              <Th field="incCurr"   label={`Incasso ${currLabel}`} />
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
                <tr key={r.agenzia} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7fafd]'}>
                  <td className="px-3 py-1.5 font-medium max-w-[200px] truncate">{r.agenzia}</td>
                  <td className="px-3 py-1.5 text-right">{fmtEur(r.incPrev)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmtEur(r.incCurr)}</td>
                  <td className={`px-3 py-1.5 text-right ${dCls}`}>{r.delta >= 0 ? '+' : ''}{fmtEur(r.delta)}</td>
                  <td className={`px-3 py-1.5 text-right ${dCls}`}>{pct}</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">{r.npratiche}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
