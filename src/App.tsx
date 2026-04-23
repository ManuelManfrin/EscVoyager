import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ImportScreen } from '@/components/ImportScreen'
import { KPICards } from '@/components/KPICards'
import { DataTable } from '@/components/DataTable'
import { ConfrontoTable } from '@/components/ConfrontoTable'
import { AnomalieTab } from '@/components/AnomalieTab'
import {
  StatoChart, MacroChart, MensileChart, AgenzieYoYChart,
  AreaChart, NazioniChart, CanaleChart,
} from '@/components/charts'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'agenzie',     label: 'Agenzie' },
  { id: 'destinazioni',label: 'Destinazioni' },
  { id: 'anomalie',    label: 'Anomalie' },
  { id: 'tabella',     label: 'Dettaglio pratiche' },
  { id: 'confronto',   label: 'Confronto YoY' },
]

export default function App() {
  const { allData } = useStore()
  const [showImport, setShowImport] = useState(!allData.length)
  const [activeTab, setActiveTab]   = useState('overview')
  const [kpiCollapsed, setKpiCollapsed] = useState(false)
  const hasData = allData.length > 0

  useEffect(() => { setKpiCollapsed(false) }, [activeTab])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onImport={() => setShowImport(true)} />

      {(!hasData || showImport) && (
        <ImportScreen
          fromDashboard={hasData}
          onClose={() => setShowImport(false)}
        />
      )}

      {hasData && (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
            <KPICards collapsed={kpiCollapsed} />

            {/* Tab nav */}
            <div className="px-5 border-b border-gray-200 bg-white flex shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div
              className="flex-1 overflow-auto p-6"
              onScroll={e => setKpiCollapsed(e.currentTarget.scrollTop > 40)}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-5">
                  <StatoChart />
                  <MacroChart />
                  <MensileChart />
                  <CanaleChart />
                </div>
              )}
              {activeTab === 'agenzie' && (
                <div className="h-full flex flex-col min-h-0">
                  <AgenzieYoYChart />
                </div>
              )}
              {activeTab === 'destinazioni' && (
                <div className="grid grid-cols-2 gap-5">
                  <AreaChart />
                  <NazioniChart />
                </div>
              )}
              {activeTab === 'anomalie' && <AnomalieTab />}
              {activeTab === 'tabella' && (
                <div className="bg-white rounded-xl border border-gray-200/80 h-full flex flex-col">
                  <DataTable />
                </div>
              )}
              {activeTab === 'confronto' && (
                <div className="bg-white rounded-xl border border-gray-200/80 h-full flex flex-col">
                  <ConfrontoTable />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
