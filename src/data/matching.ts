/* Product matching: deciding which master product a retailer's own row belongs
   to. A row carries the shop's model number, which is not our id. When the model
   number is known and the brand agrees, the row links itself. Anything less
   certain is not guessed at — it is written to the match queue and waits for an
   admin to say yes or no.

   Every match decision is kept on the row (see Offer.masterLink in data/offers),
   so an approval writes exactly what an auto-link would have written. */

import { PRODUCTS, type Product, type Retailer } from '@/data/products'
import { MODEL_TO_PRODUCT, type Offer } from '@/data/offers'

/** Below this, nothing is linked automatically: the row goes to the queue. */
export const MATCH_THRESHOLD = 0.9

export type QueueStatus = 'pending' | 'approved' | 'rejected'

export type LinkRecord = {
  masterProductId: string | null
  status: QueueStatus
  score: number
  reason: string
  /** The candidate the score was measured against, kept for the audit trail. */
  candidateProductId: string
  reviewedBy: string | null
  reviewedAt: string | null
  /** The price a row last showed live, kept so a rejection can be undone. */
  previousMarketSlug?: string | null
}

export type Candidate = {
  product: Product
  score: number
  reason: string
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/** Word overlap between a row and a product's name and search terms. */
function tokenScore(row: Offer, product: Product): { score: number; hits: string[] } {
  const rowWords = new Set(
    `${row.brand} ${row.name}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1),
  )
  const productWords = new Set(
    `${product.brand} ${product.name} ${product.terms.join(' ')}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1),
  )
  const hits: string[] = []
  for (const word of rowWords) if (productWords.has(word)) hits.push(word)
  const union = new Set([...rowWords, ...productWords]).size
  return { score: union === 0 ? 0 : hits.length / union, hits }
}

/**
 * Every master product scored against one retailer row, best first. The score is
 * a number from 0 to 1 and the reason is the sentence an admin reads in the
 * queue, so a reviewer can disagree with a decision without opening anything.
 */
export function candidatesFor(row: Offer): Candidate[] {
  const exact = MODEL_TO_PRODUCT[row.model.trim().toUpperCase()]

  return PRODUCTS.map((product) => {
    if (exact && product.id === exact) {
      const brandAgrees = normalise(product.brand) === normalise(row.brand)
      return {
        product,
        score: brandAgrees ? 1 : 0.7,
        reason: brandAgrees
          ? `Model number ${row.model} is this product's exact model, and both say ${product.brand}.`
          : `Model number ${row.model} is this product's model, but the row is filed under ${row.brand || 'no brand'} while the product says ${product.brand}.`,
      }
    }

    const byModel = normalise(product.id) === normalise(row.model)
    if (byModel) {
      return {
        product,
        score: 0.85,
        reason: `The shop's model matches the product's identifier, but not a known model number.`,
      }
    }

    const { score, hits } = tokenScore(row, product)
    const titleMatch = normalise(product.name) === normalise(row.name)
    if (titleMatch) {
      return {
        product,
        score: 0.82,
        reason: `The shop's title is identical, but the model number does not match.`,
      }
    }

    return {
      product,
      score: Math.round(score * 1000) / 1000,
      reason:
        hits.length === 0
          ? `No shared words with the product name.`
          : `Shares ${hits.slice(0, 4).join(', ')} with the product name; model number does not match.`,
    }
  })
    .filter((c) => c.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

/** The single best guess for a row, or null when nothing is close enough to name. */
export function bestCandidate(row: Offer): Candidate | null {
  return candidatesFor(row)[0] ?? null
}

/**
 * What a freshly written row should look like: linked when the evidence clears
 * the threshold, queued when it does not. `'linked'` is never written to the
 * queue; see the queue statuses in LinkRecord.
 */
export type Decision =
  | { kind: 'linked'; productId: string; score: number; reason: string }
  | { kind: 'queued'; candidate: Candidate | null }

export function decide(row: Offer): Decision {
  const best = bestCandidate(row)
  if (best && best.score >= MATCH_THRESHOLD) {
    return {
      kind: 'linked',
      productId: best.product.id,
      score: best.score,
      reason: best.reason,
    }
  }
  return { kind: 'queued', candidate: best }
}

/** The link a row carries, derived when it has never been reviewed. */
export function linkOf(row: Offer): LinkRecord | null {
  if (row.masterLink) return row.masterLink
  if (row.marketSlug) {
    const product = PRODUCTS.find((p) => p.id === row.marketSlug)
    return {
      masterProductId: row.marketSlug,
      status: 'approved',
      score: 1,
      reason: product
        ? `Already on the comparison as ${product.name}.`
        : `Already on the comparison.`,
      candidateProductId: row.marketSlug,
      reviewedBy: null,
      reviewedAt: null,
    }
  }
  return null
}

/**
 * The comparison, as it should be read. A product lists only the retailer rows
 * an admin (or an exact model number) has approved for that product, labelled
 * with the shop's own name. Any other row stays in its shop's own book.
 */
export function activeRetailers(product: Product, rows: Offer[]): Retailer[] {
  const linked = rows.filter((r) => linkOf(r)?.masterProductId === product.id)
  const standing = product.retailers.filter(
    (r) =>
      !linked.some((l) => l.shop === r.shop) &&
      !rows.some((p) => p.shop === r.shop && p.masterLink?.status === 'rejected'),
  )
  const fromRows = linked
    .filter((r) => Number.isFinite(r.listedPrice) && r.listedPrice > 0)
    .map<Retailer>((r) => ({
      shop: r.shop,
      area: r.store,
      price: r.listedPrice,
      updated: r.updated,
      sample: r.updated.startsWith('Sample'),
      retailerId: r.retailerId,
      retailerProductId: r.productId,
      priceUpdatedAt: r.priceUpdatedAt ?? null,
    }))
  return [...standing, ...fromRows]
}

/** A pending queue entry, as the admin page lists it. */
export type QueueRow = {
  row: Offer
  candidate: Product | null
  score: number
  reason: string
}

/** Rows whose match is unresolved: either never decided, or still pending. */
export function pendingQueue(rows: Offer[]): QueueRow[] {
  const out: QueueRow[] = []
  for (const row of rows) {
    const link = row.masterLink
    if (link && link.status !== 'pending') continue
    const candidates = candidatesFor(row)
    const candidate =
      (link && candidates.find((c) => c.product.id === link.candidateProductId)?.product) ??
      candidates[0]?.product ??
      null
    const best = link
      ? { score: link.score, reason: link.reason }
      : (candidates[0] ?? { score: 0, reason: 'Nothing in the comparison is close.' })
    out.push({ row, candidate, score: best.score, reason: best.reason })
  }
  /* Worst evidence first: the rows an admin must actually think about. */
  return out.sort((a, b) => a.score - b.score)
}

export type QueueCounts = { pending: number; approved: number; rejected: number }

export function queueCounts(rows: Offer[]): QueueCounts {
  const counts: QueueCounts = { pending: 0, approved: 0, rejected: 0 }
  for (const row of rows) {
    const link = linkOf(row)
    if (!link) counts.pending += 1
    else counts[link.status] += 1
  }
  return counts
}
