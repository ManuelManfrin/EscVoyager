import { useStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { fmt } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortDir = 1 | -1
const PAGE_SIZE = 50

function badgeStato(stato: string | null) {
  if (!stato) return null
  if (stato.startsWith('Confermata')) return <Badge variant="success">{stato}</Badge>
  if (['Scaduta/Cancellata','Annullata con penali','Annullata senza penali'].includes(stato))
    return <Badge variant="danger">{stato}</Badge>
  if (stato === 'Non accettato') return <Badge variant="neutral">{stato}</Badge>
  return <Badge variant="warning">{stato}</Badge>
}

export function DataTable() {
  const { filtered } = useStore()
  const [sortField, setSortField] = useState('Data Inserimento')
  const [sortDir, setSortDir]     = useState<SortDir>(-1)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')

  const searched = useMemo(() => {
    if (!search) return filtered
    const s = search.toLowerCase()
    return filtered.filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s))
    )
  }, [filtered, search])

  const sorted = useMemo(() => {
    return [...searched].sort((a, b) => {
      const va = a[sortField] ?? ''
      const vb = b[sortField] ?? ''
      if (va < vb) return -1 * sortDir
      if (va > vb) return  1 * sortDir
      return 0
    })
  }, [searched, sortField, sortDir])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const rows  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const sort = (field: string) => {
    if (field === sortField) setSortDir(d => (d === 1 ? -1 : 1) as SortDir)
    else { setSortField(field); setSortDir(-1) }
    setPage(1)
  }

  const Th = ({ field, label }: { field: string; label: string }) => (
    <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-[#1a3f63]"
        onClick={() => sort(field)}>
      <span className="flex items-center gap-1.5">
        {label}
        {sortField === field
          ? sortDir === 1 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          : <span className="text-[#93C5FD]/40 text-xs">⇅</span>}
      </span>
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cerca in tutti i campi…"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <span className="text-sm text-gray-400 shrink-0">{sorted.length.toLocaleString('it')} pratiche</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#1F4E79] text-white sticky top-0 z-10">
            <tr>
              <Th field="Nr Pratica" label="Nr Pratica" />
              <Th field="Esercizio" label="Esercizio" />
              <Th field="Data Inserimento" label="Data Ins." />
              <Th field="Partenza" label="Partenza" />
              <Th field="Stato" label="Stato" />
              <Th field="Classificazione" label="Classif." />
              <Th field="Travel Consultant" label="TC" />
              <Th field="Agenzia Viaggi" label="Agenzia" />
              <Th field="Area geografica" label="Area" />
              <Th field="Prezzo" label="Prezzo" />
              <Th field="Incasso" label="Incasso" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/60'}>
                <td className="px-4 py-2.5 font-mono text-gray-600">{r['Nr Pratica']}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.Esercizio}</td>
                <td className="px-4 py-2.5">{r['Data Inserimento']}</td>
                <td className="px-4 py-2.5">{r.Partenza}</td>
                <td className="px-4 py-2.5">{badgeStato(r.Stato)}</td>
                <td className="px-4 py-2.5">{r.Classificazione}</td>
                <td className="px-4 py-2.5">{r['Travel Consultant']}</td>
                <td className="px-4 py-2.5 max-w-[160px] truncate">{r['Agenzia Viaggi']}</td>
                <td className="px-4 py-2.5">{r['Area geografica']}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fmt(r.Prezzo)}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fmt(r.Incasso)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors">‹</button>
          <span>Pagina {page} di {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
            className="px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors">›</button>
        </div>
      )}
    </div>
  )
}
