import { useStore } from '@/lib/store'
import { saveJSON, saveCSV } from '@/lib/import'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen, Upload, Save, FileDown, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

interface HeaderProps {
  onImport: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ onImport, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { allData, filtered, clearData } = useStore()
  const hasData = allData.length > 0

  const lastDate = useMemo(() => {
    if (!hasData) return null
    const dates = allData.map(r => r['Data Inserimento']).filter(Boolean).sort()
    const last = dates[dates.length - 1]
    if (!last) return null
    const [y, m, d] = last.split('-')
    return `${d}/${m}/${y}`
  }, [allData, hasData])

  return (
    <header className="bg-[#1F4E79] text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#93C5FD]/50 px-3 text-sm font-medium text-[#93C5FD] transition-colors hover:bg-[#93C5FD]/10 hover:text-white"
          aria-label={sidebarOpen ? 'Nascondi filtri' : 'Mostra filtri'}
          title={sidebarOpen ? 'Nascondi filtri' : 'Mostra filtri'}
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          <span>Filtri</span>
        </button>
        <LayoutDashboard className="w-5 h-5 text-[#93C5FD]" />
        <span className="font-semibold text-base tracking-wide">EscVoyager – Dashboard Pratiche</span>
      </div>

      <div className="flex items-center gap-2.5">
        {hasData && (
          <span className="text-[#93C5FD] text-sm mr-3">
            {allData.length.toLocaleString('it')} pratiche
            {lastDate && <> · aggiornato al {lastDate}</>}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={onImport} className="!px-3 !py-1.5 !text-[13px]">
          <Upload className="w-3.5 h-3.5" /> Importa dati
        </Button>

        {hasData && (
          <>
            <Button variant="success" size="sm" onClick={() => saveJSON(allData)} className="!px-3 !py-1.5 !text-[13px]">
              <Save className="w-3.5 h-3.5" /> Salva database
            </Button>
            <Button variant="secondary" size="sm" onClick={() => saveCSV(filtered)} className="!px-3 !py-1.5 !text-[13px]">
              <FileDown className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm('Rimuovere tutti i dati salvati?')) clearData() }} className="!px-3 !py-1.5 !text-[13px]">
              <Trash2 className="w-3.5 h-3.5" /> Rimuovi dati
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
