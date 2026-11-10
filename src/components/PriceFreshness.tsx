import { useState } from 'react'
import { AlertTriangle, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  REPORT_REASONS,
  reportPrice,
  type Offer,
} from '@/data/offers'
import { omr } from '@/data/products'
import { relativeTime } from '@/lib/freshness'

/* Two things a price row says about itself, in one place so the table and the
   card never drift: the freshness line under the figure, and the report control
   a shopper presses when the figure is wrong. */

/**
 * The figure itself. A price older than the freshness window, or one with no
 * stamp at all, is not shown as the shop's current price: the amount is replaced
 * by what we actually know.
 */
export function PriceFig({
  price,
  updatedAt,
  className,
}: {
  price: number
  updatedAt?: string | null
  className?: string
}) {
  const stale = isStale(updatedAt)
  if (stale) {
    return (
      <span className={`block text-sm font-medium text-muted-foreground ${className ?? ''}`}>
        Price not shown
      </span>
    )
  }
  return <span className={className}>{omr(price)}</span>
}

function isStale(updatedAt?: string | null) {
  if (!updatedAt) return true
  const then = Date.parse(updatedAt)
  return !Number.isFinite(then) || Date.now() - then > 48 * 60 * 60 * 1000
}

/** "Price updated 3 hours ago", "May be outdated", or "unknown". */
export function FreshnessNote({
  updatedAt,
  sample,
  className,
}: {
  updatedAt?: string | null
  sample?: boolean
  className?: string
}) {
  if (sample) return <span className={className}>Sample price — not a live stock check</span>
  if (!updatedAt) return <span className={className}>Price update time unknown</span>
  const then = Date.parse(updatedAt)
  if (!Number.isFinite(then)) return <span className={className}>Price update time unknown</span>
  const stale = Date.now() - then > 48 * 60 * 60 * 1000
  return (
    <span className={className}>
      {stale ? (
        <span className="inline-flex items-center gap-1 font-medium text-saffron-ink">
          <AlertTriangle className="size-3" strokeWidth={1.5} aria-hidden="true" />
          Price updated {relativeTime(updatedAt)} · may be outdated
        </span>
      ) : (
        <>Price updated {relativeTime(updatedAt)}</>
      )}
    </span>
  )
}

/**
 * "Report incorrect price": opens the same lead the page already writes, with
 * the retailer_product_id and a reason. The submit goes through one place, and
 * a row already reported in this tab says so rather than writing again.
 */
export function ReportPriceLink({
  productId,
  productName,
  shop,
  retailerId,
  retailerProductId,
  email,
  label,
}: {
  productId: string
  productName: string
  shop: string
  retailerId?: string
  retailerProductId?: string
  email?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [note, setNote] = useState('')
  const [sent, setSent] = useState<null | 'ok' | 'dupe'>(null)

  if (!retailerId || !retailerProductId) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Not carried by a shop row yet, so there is no price to report.
      </p>
    )
  }

  if (sent) {
    return (
      <p role="status" className="mt-1 text-xs text-muted-foreground">
        {sent === 'dupe'
          ? `Already reported for ${shop} in this tab.`
          : `Reported to the shops team. Nothing is sent from this browser yet.`}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex min-h-11 items-center gap-1 rounded text-xs font-medium text-teal-text underline underline-offset-4 hover:no-underline"
      >
        <Flag className="size-3" strokeWidth={1.5} aria-hidden="true" />
        Report incorrect price
        <span className="sr-only"> for {label}</span>
      </button>
    )
  }

  const id = `report-${retailerId}-${retailerProductId}`
  return (
    <form
      className="mt-2 rounded-lg border border-border bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault()
        const ok = reportPrice({
          retailerId,
          retailerProductId,
          productId,
          productName,
          shop,
          reason,
          note: note.trim(),
          email,
        })
        setSent(ok ? 'ok' : 'dupe')
      }}
    >
      <label htmlFor={`${id}-reason`} className="font-label text-xs font-medium text-foreground">
        What is wrong with the {shop} price?
      </label>
      <select
        id={`${id}-reason`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="field mt-1 w-full"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-note`} className="mt-2 block font-label text-xs font-medium text-foreground">
        Anything else (optional)
      </label>
      <input
        id={`${id}-note`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="field mt-1 w-full"
        placeholder="It was 479.900 in the shop on Saturday"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="submit" className="h-11 bg-teal px-3 text-teal-foreground hover:bg-teal-deep">
          Send report
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This build has no server, so the report is kept in this browser. The shops team sees it once
        the leads route is live.
      </p>
    </form>
  )
}

/** The same report control, for a row the retailer's own dashboard draws. */
export function retailerProductIdOf(row: Offer) {
  return `${row.retailerId}::${row.productId}`
}
