import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Pratica, Filters } from './types'
import { EMPTY_FILTERS } from './types'

function applyFilters(all: Pratica[], f: Filters): Pratica[] {
  return all.filter(r => {
    if (f.esercizi.length        && !f.esercizi.includes(r.Esercizio ?? ''))              return false
    if (f.classificazioni.length && !f.classificazioni.includes(r.Classificazione ?? '')) return false
    if (f.stati.length           && !f.stati.includes(r.Stato ?? ''))                     return false
    if (f.macro.length           && !f.macro.includes(r['Macro-categoria'] ?? ''))        return false
    if (f.canali.length          && !f.canali.includes(r['Canale di vendita'] ?? ''))     return false
    if (f.tc      && r['Travel Consultant'] !== f.tc)      return false
    if (f.gp      && r['Gestore Pratica']   !== f.gp)      return false
    if (f.agenzia && r['Agenzia Viaggi']    !== f.agenzia) return false
    if (f.filiale && r.Filiale              !== f.filiale) return false
    if (f.area    && r['Area geografica']   !== f.area)    return false
    if (f.nazione && r.Nazioni              !== f.nazione) return false
    if (f.dateFrom && (r['Data Inserimento'] ?? '') < f.dateFrom) return false
    if (f.dateTo   && (r['Data Inserimento'] ?? '') > f.dateTo)   return false
    return true
  })
}

interface AppState {
  allData:  Pratica[]
  filtered: Pratica[]
  filters:  Filters
  setAllData:   (data: Pratica[]) => void
  setFilters:   (f: Partial<Filters>) => void
  resetFilters: () => void
  clearData:    () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      allData:  [],
      filtered: [],
      filters:  EMPTY_FILTERS,

      setAllData: (data) =>
        set({ allData: data, filtered: applyFilters(data, get().filters) }),

      setFilters: (partial) => {
        const filters = { ...get().filters, ...partial }
        set({ filters, filtered: applyFilters(get().allData, filters) })
      },

      resetFilters: () =>
        set({ filters: EMPTY_FILTERS, filtered: get().allData }),

      clearData: () =>
        set({ allData: [], filtered: [], filters: EMPTY_FILTERS }),
    }),
    {
      name: 'escvoyager-dashboard-v4',
      partialize: (state) => ({ allData: state.allData }),
      onRehydrateStorage: () => (state) => {
        if (state && state.allData?.length) {
          state.filtered = applyFilters(state.allData, state.filters ?? EMPTY_FILTERS)
        }
      },
    }
  )
)
