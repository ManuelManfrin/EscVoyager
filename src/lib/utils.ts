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

export function getYoYPair(esercizi: string[]): [string | null, string | null] {
  const sorted = [...esercizi].sort()
  if (sorted.length === 0) return [null, null]
  if (sorted.length === 1) return [null, sorted[0]]
  return [sorted[sorted.length - 2], sorted[sorted.length - 1]]
}
