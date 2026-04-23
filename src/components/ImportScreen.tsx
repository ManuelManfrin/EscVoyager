import { useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { parseXLSFile, parseJSONFile, dedup } from '@/lib/import'
import { Button } from '@/components/ui/button'
import { Upload, FileJson, FileSpreadsheet, X, Play } from 'lucide-react'
import type { Pratica } from '@/lib/types'

interface FileEntry {
  file: File
  type: 'excel' | 'json'
  status: 'pending' | 'ok' | 'error'
  message: string
}

interface ImportScreenProps {
  onClose?: () => void
  fromDashboard?: boolean
}

export function ImportScreen({ onClose, fromDashboard = false }: ImportScreenProps) {
  const { setAllData, allData } = useStore()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [dragging, setDragging] = useState(false)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.file.name))
      const newEntries: FileEntry[] = arr
        .filter(f => !existing.has(f.name))
        .filter(f => /\.(xls|xlsx|json)$/i.test(f.name))
        .map(f => ({
          file: f,
          type: /\.json$/i.test(f.name) ? 'json' : 'excel',
          status: 'pending',
          message: 'in coda...',
        }))
      return [...prev, ...newEntries]
    })
  }, [])

  const removeFile = (name: string) => setFiles(f => f.filter(e => e.file.name !== name))

  const run = async () => {
    setLoading(true)
    const allRows: Pratica[] = []
    const updated = [...files]

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i]
      setProgress(`⏳ Elaborazione: ${entry.file.name}…`)
      try {
        if (entry.type === 'json') {
          const rows = await parseJSONFile(entry.file)
          allRows.push(...rows)
          updated[i] = { ...entry, status: 'ok', message: `${rows.length} pratiche` }
        } else {
          const { rows, esercizio } = await parseXLSFile(entry.file)
          allRows.push(...rows)
          updated[i] = { ...entry, status: 'ok', message: `${rows.length} righe · ${esercizio}` }
        }
      } catch (e) {
        updated[i] = { ...entry, status: 'error', message: (e as Error).message }
      }
      setFiles([...updated])
    }

    if (allRows.length === 0) {
      setProgress('⚠️ Nessuna riga valida trovata.')
      setLoading(false)
      return
    }

    const merged = dedup([...allData, ...allRows])
    const dupes = allData.length + allRows.length - merged.length
    setProgress(`✅ ${merged.length} pratiche${dupes > 0 ? ` (${dupes} duplicati rimossi)` : ''}`)
    setAllData(merged)
    setTimeout(() => { setLoading(false); onClose?.() }, 600)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1F4E79]/95">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-[#1F4E79]">EscVoyager</div>
            <h2 className="text-base font-semibold text-gray-800 mt-1">Dashboard Pratiche</h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Carica file <strong>KLSGP (.xls / .xlsx)</strong> oppure il database salvato (.json)
            </p>
          </div>
          {fromDashboard && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => document.getElementById('file-input-react')?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
          >
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Trascina i file qui</p>
            <p className="text-sm text-gray-400 mt-1">oppure clicca · .xls .xlsx .json</p>
          </div>
          <input
            id="file-input-react"
            type="file"
            multiple
            accept=".xls,.xlsx,.json"
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2.5">
              {files.map(entry => (
                <div key={entry.file.name} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm
                  ${entry.status === 'error' ? 'bg-red-50' : entry.status === 'ok' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {entry.type === 'json'
                    ? <FileJson className="w-4 h-4 text-green-600 shrink-0" />
                    : <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span className="font-medium truncate flex-1">{entry.file.name}</span>
                  <span className={`shrink-0 ${entry.status === 'error' ? 'text-red-600' : 'text-gray-400'}`}>
                    {entry.status === 'ok' ? '✅ ' : entry.status === 'error' ? '❌ ' : ''}{entry.message}
                  </span>
                  {entry.status === 'pending' && !loading && (
                    <button onClick={() => removeFile(entry.file.name)} className="shrink-0 text-gray-300 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {progress && <p className="text-sm text-gray-500 text-center">{progress}</p>}

          <Button
            className="w-full"
            disabled={files.length === 0 || loading}
            onClick={run}
          >
            <Play className="w-4 h-4" />
            {loading ? 'Elaborazione…' : 'Avvia analisi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
