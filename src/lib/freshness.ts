/* Price freshness. One helper, so every place that shows a price says the same
   thing about it: when the row was last priced, and whether that is recent
   enough to show the figure as current.

   price_updated_at is the column the retailer write path sets; a row that has
   never carried one shows no figure as current. Nothing here decides shillings —
   it only reads two timestamps. */

export type FreshnessTone = 'fresh' | 'stale' | 'unknown'

export type Freshness = {
  tone: FreshnessTone
  /** "Price updated 3 hours ago", or a sentence when there is no stamp. */
  label: string
  /** True only when the figure may be shown as the shop's current price. */
  isCurrent: boolean
}

/** A price older than this is no longer shown as current. */
export const STALE_AFTER_HOURS = 48

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** "just now", "12 minutes ago", "3 hours ago", "2 days ago", or "" for a bad date. */
export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const delta = now - then
  if (delta < MINUTE) return 'just now'
  if (delta < HOUR) return `${plural(Math.floor(delta / MINUTE), 'minute')} ago`
  if (delta < DAY) return `${plural(Math.floor(delta / HOUR), 'hour')} ago`
  return `${plural(Math.floor(delta / DAY), 'day')} ago`
}

/**
 * Where a price stands. `price_updated_at` is the stamp the retailer write path
 * sets on every save and every import row; `last_seen_at` is when the worker last
 * confirmed the row still existed, and only ever refreshes the "ago" wording.
 */
export function priceFreshness(
  priceUpdatedAt: string | null | undefined,
  now = Date.now(),
): Freshness {
  if (!priceUpdatedAt) {
    return {
      tone: 'unknown',
      label: 'Price update time unknown',
      isCurrent: false,
    }
  }
  const then = Date.parse(priceUpdatedAt)
  if (!Number.isFinite(then)) {
    return {
      tone: 'unknown',
      label: 'Price update time unknown',
      isCurrent: false,
    }
  }
  if (now - then > STALE_AFTER_HOURS * HOUR) {
    return {
      tone: 'stale',
      label: `Price updated ${relativeTime(priceUpdatedAt, now)} — may be outdated`,
      isCurrent: false,
    }
  }
  return {
    tone: 'fresh',
    label: `Price updated ${relativeTime(priceUpdatedAt, now)}`,
    isCurrent: true,
  }
}

/** The two stamps written together whenever a retailer row is priced. */
export function stampedNow(now = new Date()): { priceUpdatedAt: string; lastSeenAt: string } {
  const iso = now.toISOString()
  return { priceUpdatedAt: iso, lastSeenAt: iso }
}
