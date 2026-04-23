import { useStore } from '@/lib/store'
import { MultiSelect } from '@/components/ui/multiselect'
import { SingleSelect } from '@/components/ui/singleselect'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useMemo } from 'react'

function uniq(arr: (string | null)[]): string[] {
  return [...new Set(arr.filter(Boolean) as string[])].sort()
}

export function Sidebar() {
  const { allData, filters, setFilters, resetFilters } = useStore()

  const opts = useMemo(() => ({
    esercizi:       uniq(allData.map(r => r.Esercizio)),
    classificazioni:uniq(allData.map(r => r.Classificazione)),
    stati:          uniq(allData.map(r => r.Stato)),
    macro:          uniq(allData.map(r => r['Macro-categoria'])),
    canali:         uniq(allData.map(r => r['Canale di vendita'])),
    tc:             uniq(allData.map(r => r['Travel Consultant'])),
    gp:             uniq(allData.map(r => r['Gestore Pratica'])),
    agenzie:        uniq(allData.map(r => r['Agenzia Viaggi'])),
    filiali:        uniq(allData.map(r => r.Filiale)),
    aree:           uniq(allData.map(r => r['Area geografica'])),
    nazioni:        uniq(allData.map(r => r.Nazioni)),
  }), [allData])

  const section = (title: string) => (
    <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-6 mb-2.5 px-1">{title}</div>
  )
  const group = (label: string, children: React.ReactNode) => (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1.5 px-1">{label}</label>
      {children}
    </div>
  )

  return (
    <aside className="w-[248px] shrink-0 bg-white border-r border-gray-200/80 flex flex-col overflow-y-auto">
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">Filtri</span>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="!px-2.5 !py-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>

        {section('Periodo')}
        {group('Esercizio', <MultiSelect options={opts.esercizi} value={filters.esercizi} onChange={v => setFilters({ esercizi: v })} />)}
        {group('Data dal', <input type="date" value={filters.dateFrom} onChange={e => setFilters({ dateFrom: e.target.value })}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" />)}
        {group('Data al', <input type="date" value={filters.dateTo} onChange={e => setFilters({ dateTo: e.target.value })}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" />)}

        {section('Pratica')}
        {group('Classificazione', <MultiSelect options={opts.classificazioni} value={filters.classificazioni} onChange={v => setFilters({ classificazioni: v })} />)}
        {group('Stato', <MultiSelect options={opts.stati} value={filters.stati} onChange={v => setFilters({ stati: v })} />)}
        {group('Macro-categoria', <MultiSelect options={opts.macro} value={filters.macro} onChange={v => setFilters({ macro: v })} />)}
        {group('Canale di vendita', <MultiSelect options={opts.canali} value={filters.canali} onChange={v => setFilters({ canali: v })} />)}

        {section('Agente / Consulente')}
        {group('Travel Consultant', <SingleSelect options={opts.tc} value={filters.tc} onChange={v => setFilters({ tc: v })} />)}
        {group('Gestore Pratica', <SingleSelect options={opts.gp} value={filters.gp} onChange={v => setFilters({ gp: v })} />)}

        {section('Agenzia / Filiale')}
        {group('Agenzia', <SingleSelect options={opts.agenzie} value={filters.agenzia} onChange={v => setFilters({ agenzia: v })} />)}
        {group('Filiale', <SingleSelect options={opts.filiali} value={filters.filiale} onChange={v => setFilters({ filiale: v })} />)}

        {section('Destinazione')}
        {group('Area Geografica', <SingleSelect options={opts.aree} value={filters.area} onChange={v => setFilters({ area: v })} />)}
        {group('Nazione', <SingleSelect options={opts.nazioni} value={filters.nazione} onChange={v => setFilters({ nazione: v })} />)}
      </div>
    </aside>
  )
}
