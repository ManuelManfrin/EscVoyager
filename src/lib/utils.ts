import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '–'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n < 0 ? '-' : '') + '€' + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000)     return (n < 0 ? '-' : '') + '€' + (abs / 1_000).toFixed(0) + 'K'
  return (n < 0 ? '-' : '') + '€' + abs.toLocaleString('it')
}

export function fmtN(n: number | null | undefined): string {
  if (n == null) return '–'
  return n.toLocaleString('it')
}

export function fmtEur(n: number | null | undefined): string {
  if (!n) return '–'
  return '€' + Number(n).toLocaleString('it', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function shortEse(ese: string | null): string {
  if (!ese) return '–'
  return ese.replace(/20(\d{2})\/20(\d{2})/, '$1/$2')
}

export function compareEsercizi(a: string | null, b: string | null): number {
  if (!a && !b) return 0
  if (!a) return -1
  if (!b) return 1

  const matchA = a.match(/^(\d{4})\/(\d{4})$/)
  const matchB = b.match(/^(\d{4})\/(\d{4})$/)

  if (matchA && matchB) {
    const startA = Number(matchA[1])
    const startB = Number(matchB[1])
    if (startA !== startB) return startA - startB

    const endA = Number(matchA[2])
    const endB = Number(matchB[2])
    return endA - endB
  }

  return a.localeCompare(b)
}

export function getYoYPair(esercizi: string[]): [string | null, string | null] {
  const sorted = [...esercizi].sort()
  if (sorted.length === 0) return [null, null]
  if (sorted.length === 1) return [null, sorted[0]]
  return [sorted[sorted.length - 2], sorted[sorted.length - 1]]
}
