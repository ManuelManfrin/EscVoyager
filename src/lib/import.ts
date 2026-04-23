import * as XLSX from 'xlsx'
import type { Pratica } from './types'

// Chiavi lowercase (post-normalizzazione), valori = nomi canonici usati nell'app
const COL_MAP: Record<string, string> = {
  'nr pratica':            'Nr Pratica',
  'nr. pratica':           'Nr Pratica',
  'anno':                  'Anno',
  'data inserimento':      'Data Inserimento',
  'data scadenza':         'Data Scadenza',
  'partenza':              'Partenza',
  'itinerario':            'Itinerario',
  'stato':                 'Stato',
  'gestore pratica':       'Gestore Pratica',
  'travel consultant':     'Travel Consultant',
  'classificazione':       'Classificazione',
  'canale di vendita':     'Canale di vendita',
  'id agenzia':            'Id Agenzia',
  'agenzia viaggi':        'Agenzia Viaggi',
  'id filiale':            'Id Filiale',
  'filiale':               'Filiale',
  'intestatario':          'Intestatario',
  'intestatario cliente':  'Intestatario Cliente',
  'pax':                   'Intestatario Cliente',  // alias KLSGP
  'area geografica':       'Area geografica',
  'prezzo':                'Prezzo',
  'incasso':               'Incasso',
  'da incassare':          'Da Incassare',
  'macro-categoria':       'Macro-categoria',
  'continenti':            'Continenti',
  'nazioni':               'Nazioni',
  'tour operator':         'Tour Operator',
  'data evasione':         'Data Evasione',
  'ultimoincasso':         'Ultimo Incasso',
}

// Colonne da ignorare del tutto (sistema, PII, operativo)
const EXCLUDE_COLS = new Set([
  'note', 'stato voli', 'visibile', 'tipo pratica',
  'conferma inviata', 'contatto', 'adeg. valutario', 'data scadenza sconto',
])

// Colonne che contengono serial Excel → vanno convertite in ISO (dopo il mapping)
const DATE_COLS = new Set([
  'Data Inserimento', 'Data Scadenza', 'Partenza', 'Data Evasione', 'Ultimo Incasso',
])

function excelDateToISO(serial: number): string {
  const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
  return utc.toISOString().slice(0, 10)
}

function hashRow(r: Pratica): string {
  return JSON.stringify(
    Object.keys(r).sort().reduce((o: Record<string, unknown>, k) => { o[k] = r[k]; return o }, {})
  )
}

// Ricava l'esercizio dalla colonna Anno del KLSGP.
// Anno=2025 significa esercizio 2024/2025 (il campo indica l'anno solare di fine esercizio).
function esercizioFromAnno(anno: number): string {
  return `${anno - 1}/${anno}`
}

// Fallback: ricava l'esercizio dalla data di inserimento usando la regola sett–apr.
// Mesi 9–12 (sett–dic) → anno/anno+1   |   Mesi 1–4 (gen–apr) → anno-1/anno
function esercizioFromISO(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})/)
  if (!m) return null
  const y = parseInt(m[1]), mo = parseInt(m[2])
  if (mo >= 9) return `${y}/${y + 1}`
  if (mo <= 4) return `${y - 1}/${y}`
  return null  // mag–ago: fuori dall'esercizio standard
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

  // Normalizzazione robusta: \s+ → singolo spazio, gestisce sia \r\n (.xls) che \r\r\n (.xlsx)
  const rawHeaders = (raw[0] as string[]).map(h =>
    String(h).replace(/\s+/g, ' ').toLowerCase().trim()
  )
  const mappedHeaders = rawHeaders.map(h => COL_MAP[h] ?? h)

  const rows: Pratica[] = []
  for (let i = 1; i < raw.length; i++) {
    const rawRow = raw[i] as unknown[]
    if (rawRow.every(v => v === '' || v == null)) continue

    const row: Pratica = {
      Esercizio: null,
      'Nr Pratica': null, Anno: null, 'Data Inserimento': null, Partenza: null,
      Itinerario: null, Stato: null, 'Gestore Pratica': null, 'Travel Consultant': null,
      Classificazione: null, 'Canale di vendita': null, 'Id Agenzia': null,
      'Agenzia Viaggi': null, 'Id Filiale': null, Filiale: null, Intestatario: null,
      'Area geografica': null, Prezzo: null, Incasso: null, 'Da Incassare': null,
      'Macro-categoria': null, Nazioni: null, 'Intestatario Cliente': null,
    }

    mappedHeaders.forEach((h, idx) => {
      if (EXCLUDE_COLS.has(rawHeaders[idx])) return  // confronto sul raw normalizzato
      let v = rawRow[idx] as string | number | null
      if (DATE_COLS.has(h)) {
        v = typeof v === 'number' && v > 0 ? excelDateToISO(v) : (v || null)
      } else if (typeof v === 'string') {
        v = v.replace(/\s+/g, ' ').trim() || null
      }
      row[h] = v === '' ? null : v
    })

    rows.push(row)
  }

  // ── Deriva esercizio (priorità: colonna Anno > Data Inserimento > filename) ──

  // 1. Colonna Anno: il valore è l'anno solare di fine esercizio (es. 2025 → 2024/2025)
  let esercizio = 'N/D'
  const annoValues = rows
    .map(r => r['Anno'])
    .filter((v): v is number => typeof v === 'number' && v > 2000)
  if (annoValues.length > 0) {
    const modeAnno = annoValues.sort((a, b) =>
      annoValues.filter(v => v === b).length - annoValues.filter(v => v === a).length
    )[0]
    esercizio = esercizioFromAnno(modeAnno)
  }

  // 2. Fallback: Data Inserimento con regola sett–apr
  if (esercizio === 'N/D') {
    const counts: Record<string, number> = {}
    rows.forEach(r => {
      const d = r['Data Inserimento']
      if (!d || typeof d !== 'string') return
      const e = esercizioFromISO(d)
      if (e) counts[e] = (counts[e] || 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top) esercizio = top[0]
  }

  // 3. Ultimo fallback: anni nel nome file (es. "KLSGP 2024 2025.xls")
  if (esercizio === 'N/D') {
    const mFn = file.name.toLowerCase().match(/(20\d{2}).*(20\d{2})/)
    if (mFn) esercizio = `${mFn[1]}/${mFn[2]}`
  }

  rows.forEach(r => { r.Esercizio = esercizio })
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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
