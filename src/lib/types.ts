export interface Pratica {
  Esercizio: string | null
  'Nr Pratica': string | null
  Anno: string | null
  'Data Inserimento': string | null
  Partenza: string | null
  Itinerario: string | null
  Stato: string | null
  'Gestore Pratica': string | null
  'Travel Consultant': string | null
  Classificazione: string | null
  'Canale di vendita': string | null
  'Id Agenzia': string | null
  'Agenzia Viaggi': string | null
  'Id Filiale': string | null
  Filiale: string | null
  Intestatario: string | null
  'Area geografica': string | null
  Prezzo: number | null
  Incasso: number | null
  'Da Incassare': number | null
  'Macro-categoria': string | null
  Nazioni: string | null
  'Intestatario Cliente': string | null
  [key: string]: string | number | null
}

export interface Filters {
  esercizi: string[]
  classificazioni: string[]
  stati: string[]
  macro: string[]
  canali: string[]
  tc: string
  gp: string
  agenzia: string
  filiale: string
  area: string
  nazione: string
  dateFrom: string
  dateTo: string
}

export const EMPTY_FILTERS: Filters = {
  esercizi: [], classificazioni: [], stati: [], macro: [], canali: [],
  tc: '', gp: '', agenzia: '', filiale: '', area: '', nazione: '',
  dateFrom: '', dateTo: '',
}
