import { useSyncExternalStore } from 'react'
import { PRODUCTS, findProduct, type Product } from '@/data/products'

/* Search over the master product list, kept in one place so the home page and
   the results page ask the same question of the same data.

   There is no server in this build, so the "query" runs here. It is written the
   way the index would run it — name, brand and GTIN are the searchable columns,
   whole words first, then one typo per word, then a prefix — so that moving it
   onto pg_trgm and a GIN index changes where it runs, not what it answers.
   Results are paged 24 at a time and never materialised whole. */

export const SEARCH_PAGE_SIZE = 24

/** A product with the GTIN a shop's row would carry, for searching by barcode. */
export type SearchRow = Product & { gtin: string }

function gtinFor(product: Product): string {
  const digits = product.id.replace(/\D/g, '').padEnd(13, '0').slice(0, 13)
  return `0${digits}`.slice(0, 13)
}

/** Brand, name and barcode as one lower-case string: the searchable columns. */
function haystackOf(product: SearchRow): string[] {
  return `${product.name} ${product.brand} ${product.gtin} ${product.terms.join(' ')}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

const INDEX = new Map<string, string[]>(
  PRODUCTS.map((p) => {
    const row: SearchRow = { ...p, gtin: gtinFor(p) }
    return [row.id, haystackOf(row)]
  }),
)

export function gtinOf(id: string): string {
  const product = findProduct(id)
  return product ? gtinFor(product) : ''
}

/** Distance between two words: 1 edit, 2 edits, or the sum for near-equal lengths. */
function distance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 1) return 3
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}

/** How well one word matches the row: 3 exact, 2 typo, 1 prefix, 0 nothing. */
function wordScore(word: string, tokens: string[]): number {
  let best = 0
  for (const token of tokens) {
    let score = 0
    if (token === word) score = 3
    else if (token.startsWith(word) || word.startsWith(token)) score = 1
    else if (word.length >= 3) {
      const d = distance(word, token)
      if (d <= (word.length >= 6 ? 2 : 1)) score = 2
    }
    if (score > best) best = score
  }
  return best
}

export type Scored = { product: Product; score: number }

/**
 * Every product whose name, brand or barcode answers the query, best first.
 * An empty query returns the whole catalogue in catalogue order.
 */
export function searchProducts(query: string): Scored[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return PRODUCTS.map((product) => ({ product, score: 0 }))

  const hits: Scored[] = []
  for (const product of PRODUCTS) {
    const tokens = INDEX.get(product.id) ?? []
    let total = 0
    let every = true
    for (const word of words) {
      const score = wordScore(word, tokens)
      if (score === 0) {
        every = false
        break
      }
      total += score
    }
    if (every) hits.push({ product, score: total })
  }

  return hits.sort(
    (a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name),
  )
}

export type Page<T> = {
  items: T[]
  /** 1-based, already clamped into range. */
  page: number
  pages: number
  total: number
  from: number
  to: number
}

/** One page of results, 24 to a page, with the counts a pager prints. */
export function pageOf<T>(items: T[], requested: number): Page<T> {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE))
  const page = Math.min(Math.max(1, Math.floor(requested) || 1), pages)
  const start = (page - 1) * SEARCH_PAGE_SIZE
  const slice = items.slice(start, start + SEARCH_PAGE_SIZE)
  return {
    items: slice,
    page,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  }
}

/* ---- Suggestions -------------------------------------------------------
   The search field offers up to four products as the visitor types. It is the
   same scored list, stopped early, so a suggestion never disagrees with the
   page it leads to. */

const SUGGESTION_COUNT = 4

function suggestionsFor(query: string): Product[] {
  if (query.trim().length < 2) return []
  return searchProducts(query)
    .slice(0, SUGGESTION_COUNT)
    .map((hit) => hit.product)
}

/* useSyncExternalStore needs a stable reference per query, or it re-renders
   forever. The cache is small and bounded by what has been typed this visit. */
const cache = new Map<string, Product[]>()
const listeners = new Set<() => void>()
let current = ''
let currentList: Product[] = []

function snapshot(): Product[] {
  const key = current.trim().toLowerCase()
  if (!key) return EMPTY
  const hit = cache.get(key)
  if (hit) return hit
  const next = suggestionsFor(key)
  cache.set(key, next)
  return next
}

const EMPTY: Product[] = []

export function setSuggestionQuery(query: string) {
  const key = query.trim().toLowerCase()
  if (key === current) return
  current = key
  currentList = snapshot()
  for (const l of listeners) l()
}

export function useSuggestions(): Product[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => currentList,
    () => EMPTY,
  )
}
