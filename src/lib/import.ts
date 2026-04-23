import * as XLSX from 'xlsx'
import type { Pratica } from './types'

const COL_MAP: Record<string, string> = {
  'nr pratica': 'Nr Pratica',
  'nr. pratica': 'Nr Pratica',
  'anno': 'Anno',
  'data inserimento': 'Data Inserimento',
  'partenza': 'Partenza',
  'itinerario': 'Itinerario',
  'stato': 'Stato',
  'gestore pratica': 'Gestore Pratica',
  'travel consultant': 'Travel Consultant',
  'classificazione': 'Classificazione',
  'canale di vendita': 'Canale di vendita',
  'id agenzia': 'Id Agenzia',
  'agenzia viaggi': 'Agenzia Viaggi',
  'id filiale': 'Id Filiale',
  'filiale': 'Filiale',
  'intestatario': 'Intestatario',
  'area geografica': 'Area geografica',
  'prezzo': 'Prezzo',
  'incasso': 'Incasso',
  'da incassare': 'Da Incassare',
  'macro-categoria': 'Macro-categoria',
  'nazioni': 'Nazioni',
  'intestatario cliente': 'Intestatario Cliente',
}

const EXCLUDE_COLS = new Set(['Note', 'Stato Voli', 'Visibile', 'Tipo Pratica', 'Conferma Inviata'])
const DATE_COLS = new Set(['Data Inserimento', 'Data Scadenza', 'Partenza', 'Rientro'])

function excelDateToISO(serial: number): string {
  const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
  return utc.toISOString().slice(0, 10)
}

function hashRow(r: Pratica): string {
  return JSON.stringify(
    Object.keys(r).sort().reduce((o: Record<string, unknown>, k) => { o[k] = r[k]; return o }, {})
  )
}

export async function parseXLSFile(file: File): Promise<{ rows: Pratica[], esercizio: string }> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })

  const shName = wb.SheetNames.find(n => n.toLowerCase().includes('grid'))
  if (!shName) {
    throw new Error(
      `Foglio "GridSelPreventivi" non trovato. Fogli disponibili: ${wb.SheetNames.join(', ')}`
    )
  }

  const raw = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[shName], { header: 1, defval: '' })
  if (raw.length < 2) throw new Error('Foglio vuoto o non riconoscibile.')

  const rawHeaders = (raw[0] as string[]).map(h => String(h).replace(/\r\n|\r|\n/g, ' ').toLowerCase().trim())
  const mappedHeaders = rawHeaders.map(h => COL_MAP[h] ?? h)

  let esercizio = 'N/D'
  const fn = file.name.toLowerCase()
  const m2 = fn.match(/(20\d{2}).*(20\d{2})/)
  if (m2) esercizio = `${m2[1]}/${m2[2]}`

  const rows: Pratica[] = []
  for (let i = 1; i < raw.length; i++) {
    const rawRow = raw[i] as unknown[]
    if (rawRow.every(v => v === '' || v == null)) continue
    const row: Pratica = {
      Esercizio: esercizio,
      'Nr Pratica': null, Anno: null, 'Data Inserimento': null, Partenza: null,
      Itinerario: null, Stato: null, 'Gestore Pratica': null, 'Travel Consultant': null,
      Classificazione: null, 'Canale di vendita': null, 'Id Agenzia': null,
      'Agenzia Viaggi': null, 'Id Filiale': null, Filiale: null, Intestatario: null,
      'Area geografica': null, Prezzo: null, Incasso: null, 'Da Incassare': null,
      'Macro-categoria': null, Nazioni: null, 'Intestatario Cliente': null,
    }
    mappedHeaders.forEach((h, idx) => {
      if (EXCLUDE_COLS.has(h)) return
      let v = rawRow[idx] as string | number | null
      if (DATE_COLS.has(h)) {
        v = typeof v === 'number' ? excelDateToISO(v) : (v || null)
      } else if (typeof v === 'string') {
        v = v.replace(/\r\n|\r|\n/g, ' ').trim() || null
      }
      row[h] = v === '' ? null : v
    })
    rows.push(row)
  }
  return { rows, esercizio }
}

export function parseJSONFile(file: File): Promise<Pratica[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target!.result as string)
        if (!Array.isArray(data)) reject(new Error('Il file JSON non contiene un array valido.'))
        else resolve(data as Pratica[])
      } catch (err) {
        reject(new Error(`Errore nel parsing JSON: ${(err as Error).message}`))
      }
    }
    reader.onerror = () => reject(new Error('Impossibile leggere il file.'))
    reader.readAsText(file, 'utf-8')
  })
}

export function dedup(rows: Pratica[]): Pratica[] {
  const seen = new Set<string>()
  return rows.filter(r => {
    const h = hashRow(r)
    if (seen.has(h)) return false
    seen.add(h)
    return true
  })
}

export function saveJSON(data: Pratica[]) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'klsgp_cumulative.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function saveCSV(rows: Pratica[], filename = 'export.csv') {
  const fields: (keyof Pratica)[] = [
    'Esercizio', 'Nr Pratica', 'Data Inserimento', 'Partenza', 'Itinerario',
    'Stato', 'Classificazione', 'Travel Consultant', 'Gestore Pratica',
    'Canale di vendita', 'Agenzia Viaggi', 'Filiale', 'Intestatario Cliente',
    'Area geografica', 'Nazioni', 'Macro-categoria', 'Prezzo', 'Incasso', 'Da Incassare',
  ]
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [fields.join(';'), ...rows.map(r => fields.map(f => esc(r[f])).join(';'))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
