import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ImportScreen } from '@/components/ImportScreen'
import { KPICards } from '@/components/KPICards'
import { AgenzieDashboard } from '@/components/AgenzieDashboard'
import { DataTable } from '@/components/DataTable'
import { ConfrontoTable } from '@/components/ConfrontoTable'
import { AnomalieTab } from '@/components/AnomalieTab'
import {
  StatoChart, MacroChart, MensileChart,
  AreaChart, NazioniChart, CanaleChart,
} from '@/components/charts'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'agenzie',     label: 'Agenzie' },
  { id: 'destinazioni',label: 'Destinazioni' },
  { id: 'anomalie',    label: 'Anomalie' },
  { id: 'tabella',     label: 'Dettaglio pratiche' },
  { id: 'confronto',   label: 'Confronto esercizi' },
]

export default function App() {
  const { allData } = useStore()
  const [showImport, setShowImport] = useState(!allData.length)
  const [activeTab, setActiveTab]   = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const hasData = allData.length > 0

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        onImport={() => setShowImport(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(open => !open)}
      />

      {(!hasData || showImport) && (
        <ImportScreen
          fromDashboard={hasData}
          onClose={() => setShowImport(false)}
        />
      )}

      {hasData && (
        <div className="flex flex-1 overflow-hidden">
          {sidebarOpen && <Sidebar />}

          <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
            {/* Tab nav */}
            <div className="border-b border-gray-200 bg-white shrink-0">
              <div className="flex h-12 items-stretch justify-between gap-4 overflow-hidden px-5">
                <div className="flex min-w-0 overflow-x-auto overflow-y-hidden">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'shrink-0 px-5 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.id
                          ? 'border-[#2563EB] text-[#2563EB]'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="hidden xl:flex shrink-0 items-center overflow-x-auto overflow-y-hidden">
                  <KPICards />
                </div>
              </div>

              <div className="xl:hidden overflow-x-auto overflow-y-hidden px-5 py-2 border-t border-gray-100">
                <KPICards />
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-6">
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
                  <AgenzieDashboard />
                </div>
              )}
              {activeTab === 'destinazioni' && (
                <div className="grid grid-cols-1 gap-5">
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
