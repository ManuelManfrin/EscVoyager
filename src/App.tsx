import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ImportScreen } from '@/components/ImportScreen'
import { KPICards } from '@/components/KPICards'
import { DataTable } from '@/components/DataTable'
import { ConfrontoTable } from '@/components/ConfrontoTable'
import {
  StatoChart, MacroChart, MensileChart, AgenzieYoYChart,
  AreaChart, NazioniChart, CanaleChart,
} from '@/components/charts'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'agenzie',     label: 'Agenzie' },
  { id: 'destinazioni',label: 'Destinazioni' },
  { id: 'tabella',     label: 'Dettaglio pratiche' },
  { id: 'confronto',   label: 'Confronto YoY' },
]

export default function App() {
  const { allData } = useStore()
  const [showImport, setShowImport] = useState(!allData.length)
  const [activeTab, setActiveTab]   = useState('overview')
  const hasData = allData.length > 0

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

          <main className="flex-1 flex flex-col overflow-hidden bg-[#f0f4f8]">
            <KPICards />

            {/* Tab nav */}
            <div className="px-4 border-b border-gray-200 bg-white flex gap-0 shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-[#1F4E79] text-[#1F4E79]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <StatoChart />
                  <MacroChart />
                  <MensileChart />
                  <CanaleChart />
                </div>
              )}
              {activeTab === 'agenzie' && (
                <div className="grid grid-cols-1 gap-4">
                  <AgenzieYoYChart />
                </div>
              )}
              {activeTab === 'destinazioni' && (
                <div className="grid grid-cols-2 gap-4">
                  <AreaChart />
                  <NazioniChart />
                </div>
              )}
              {activeTab === 'tabella' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
                  <DataTable />
                </div>
              )}
              {activeTab === 'confronto' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
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
