import { useStore } from '@/lib/store'
import { saveJSON, saveCSV } from '@/lib/import'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Upload, Save, FileDown, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

interface HeaderProps {
  onImport: () => void
}

export function Header({ onImport }: HeaderProps) {
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
    <header className="bg-[#1F4E79] text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-2.5">
        <LayoutDashboard className="w-5 h-5 text-[#9DC3E6]" />
        <span className="font-bold text-sm tracking-wide">KEL 12 – Dashboard Pratiche</span>
      </div>

      <div className="flex items-center gap-2">
        {hasData && (
          <span className="text-[#9DC3E6] text-xs mr-2">
            {allData.length.toLocaleString('it')} pratiche
            {lastDate && <> · aggiornato al {lastDate}</>}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={onImport}>
          <Upload className="w-3.5 h-3.5" /> Importa dati
        </Button>

        {hasData && (
          <>
            <Button variant="success" size="sm" onClick={() => saveJSON(allData)}>
              <Save className="w-3.5 h-3.5" /> Salva database
            </Button>
            <Button variant="secondary" size="sm" onClick={() => saveCSV(filtered)}>
              <FileDown className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm('Rimuovere tutti i dati salvati?')) clearData() }}>
              <Trash2 className="w-3.5 h-3.5" /> Rimuovi dati
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
