import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Inbox, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentAccount } from '@/lib/session'
import { queueHistory, reviewMatch, undoMatch, useOffers } from '@/data/offers'
import {
  MATCH_THRESHOLD,
  pendingQueue,
  queueCounts,
  type QueueRow,
  type QueueStatus,
} from '@/data/matching'
import { PRODUCTS, RETAILER_COUNT } from '@/data/products'

/* The admin match queue. Every row a shop wrote that could not be tied to one
   master product with certainty is listed here, worst evidence first, for an
   admin to approve or reject. Approving writes the same link an automatic match
   would have written; nothing below the threshold is ever linked on its own. */

const PAGE_SIZE = 10

export default function MatchQueuePage() {
  const account = useCurrentAccount()
  const rows = useOffers()
  const [page, setPage] = useState(0)

  const pending = useMemo(() => pendingQueue(rows), [rows])
  const history = useMemo(() => queueHistory(rows), [rows])
  const counts = useMemo(() => queueCounts(rows), [rows])

  if (!account) return <Navigate to="/access?next=/admin/match-queue" replace />
  if (account.role !== 'admin') return <Navigate to={`/account/${account.role}`} replace />

  const pages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = pending.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  function review(entry: QueueRow, status: QueueStatus) {
    const approved = status === 'approved'
    reviewMatch(entry.row.retailerId, entry.row.productId, {
      masterProductId: approved ? (entry.candidate?.id ?? null) : null,
      status,
      score: entry.score,
      reason: entry.reason,
      candidateProductId: entry.candidate?.id ?? '',
      reviewedBy: account!.name || account!.email,
      reviewedAt: new Date().toISOString(),
    })
    /* The list shrinks under the cursor; step back a page when it empties. */
    if (shown.length === 1 && current > 0) setPage(current - 1)
  }

  return (
    <main>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-9 pb-11">
          <p className="font-label text-xs tracking-[0.08em] text-teal-on-band uppercase">
            Admin · match queue
          </p>
          <h1 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)]">Rows waiting on a decision</h1>
          <p className="mt-3 max-w-[60ch] text-sm text-primary-foreground/80 sm:text-base">
            A shop's row is linked to a master product on its own only at {MATCH_THRESHOLD * 100}%
            confidence or better. Everything weaker waits here, so no price joins the comparison on
            a guess.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pending" value={String(counts.pending)} />
            <Stat label="Approved" value={String(counts.approved)} />
            <Stat label="Rejected" value={String(counts.rejected)} />
            <Stat label="Threshold" value={`${MATCH_THRESHOLD * 100}%`} />
          </dl>
        </div>
      </section>

      <section aria-labelledby="queue" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="queue" className="text-[clamp(1.4rem,3vw,1.9rem)]">
                Pending matches
              </h2>
              <p className="mt-1 max-w-[64ch] text-sm text-muted-foreground">
                Approve links the shop's row to the candidate below and puts it on the comparison;
                reject leaves it in that shop's own book. Both record your name and the time.</p>
            </div>
            <Link
              to="/account/admin"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-teal-text underline underline-offset-4 hover:no-underline"
            >
              Back to the admin page
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="mt-6 flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-deep">
                <Inbox className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">Nothing is waiting</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Every row a shop saved is either linked to a master product or was decided here.
                  A new row appears the moment a shop saves one whose model number and brand do not
                  settle it.
                </p>
                <Link
                  to="/"
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-teal-text underline underline-offset-4"
                >
                  Compare the prices that are linked
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 -mx-gutter overflow-x-auto px-gutter sm:mx-0 sm:px-0">
                <table className="w-full min-w-[54rem] border-separate border-spacing-y-1 text-sm">
                  <caption className="sr-only">
                    Retailer rows whose master product match needs an admin decision, lowest score
                    first. {pending.length} {pending.length === 1 ? 'row' : 'rows'} pending.
                  </caption>
                  <thead>
                    <tr className="text-left font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                      <th scope="col" className="px-2 py-1">Retailer product</th>
                      <th scope="col" className="px-2 py-1">Candidate master product</th>
                      <th scope="col" className="px-2 py-1">Score</th>
                      <th scope="col" className="px-2 py-1">Why</th>
                      <th scope="col" className="px-2 py-1">
                        <span className="sr-only">Decision</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((entry) => (
                      <tr
                        key={`${entry.row.retailerId}-${entry.row.productId}`}
                        className="bg-card align-top"
                      >
                        <th
                          scope="row"
                          className="max-w-[16rem] rounded-l-lg px-2 py-2 text-left font-normal"
                        >
                          <span className="block truncate font-medium">{entry.row.name || 'Untitled row'}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {entry.row.shop} · {entry.row.store}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-xs">
                            {entry.row.model || 'no model number'}
                          </span>
                        </th>
                        <td className="max-w-[15rem] px-2 py-2">
                          {entry.candidate ? (
                            <>
                              <span className="block truncate font-medium">{entry.candidate.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {entry.candidate.brand} · {entry.candidate.category}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No candidate in the comparison
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <Score score={entry.score} />
                        </td>
                        <td className="max-w-[20rem] px-2 py-2 text-xs text-muted-foreground">
                          {entry.reason}
                        </td>
                        <td className="rounded-r-lg px-2 py-2 text-right whitespace-nowrap">
                          <Button
                            type="button"
                            className="h-11 bg-teal px-3 text-teal-foreground hover:bg-teal-deep"
                            disabled={!entry.candidate}
                            onClick={() => review(entry, 'approved')}
                          >
                            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                            Approve
                            <span className="sr-only">
                              {' '}
                              {entry.row.name || 'this row'} as {entry.candidate?.name ?? 'no product'}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="ml-2 h-11 px-3"
                            onClick={() => review(entry, 'rejected')}
                          >
                            <X className="size-4" strokeWidth={2} aria-hidden="true" />
                            Reject
                            <span className="sr-only"> {entry.row.name || 'this row'}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Showing {current * PAGE_SIZE + 1}–
                  {Math.min(pending.length, (current + 1) * PAGE_SIZE)} of {pending.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    Previous
                  </Button>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {current + 1} / {pages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={current >= pages - 1}
                    onClick={() => setPage(current + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="history" className="border-t border-border bg-secondary">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <h2 id="history" className="text-[clamp(1.4rem,3vw,1.9rem)]">
            Decided matches
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            Every link in this browser, with how certain it was and who decided it. An approval made
            by hand writes the same link an automatic match writes, and undoing one sends the row
            back to the queue above.
          </p>
          {history.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No row has been decided yet. Approve or reject one above and it is recorded here.
            </p>
          ) : (
            <div className="mt-4 -mx-gutter overflow-x-auto px-gutter sm:mx-0 sm:px-0">
              <table className="w-full min-w-[48rem] border-separate border-spacing-y-1 text-sm">
                <caption className="sr-only">
                  Rows already linked or rejected, most recent decision first.
                </caption>
                <thead>
                  <tr className="text-left font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                    <th scope="col" className="px-2 py-1">Retailer row</th>
                    <th scope="col" className="px-2 py-1">Linked to</th>
                    <th scope="col" className="px-2 py-1">Status</th>
                    <th scope="col" className="px-2 py-1">Score</th>
                    <th scope="col" className="px-2 py-1">Reviewed by</th>
                    <th scope="col" className="px-2 py-1">When</th>
                    <th scope="col" className="px-2 py-1">
                      <span className="sr-only">Undo</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 12).map((row) => {
                    const link = row.masterLink!
                    return (
                      <tr key={`${row.retailerId}-${row.productId}`} className="bg-card">
                        <th scope="row" className="max-w-[14rem] truncate rounded-l-lg px-2 py-2 text-left font-medium">
                          {row.name || 'Untitled row'}
                          <span className="block truncate text-xs font-normal text-muted-foreground">
                            {row.shop}
                          </span>
                        </th>
                        <td className="max-w-[14rem] px-2 py-2 text-xs">
                          {link.status === 'approved' ? (
                            <span className="block truncate">
                              {PRODUCTS.find((p) => p.id === link.masterProductId)?.name ??
                                link.masterProductId ??
                                '—'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not linked</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <StatusChip status={link.status} />
                        </td>
                        <td className="px-2 py-2">
                          <Score score={link.score} />
                        </td>
                        <td className="max-w-[10rem] truncate px-2 py-2 text-xs">
                          {link.reviewedBy ?? '—'}
                        </td>
                        <td className="max-w-[10rem] truncate px-2 py-2 font-mono text-xs">
                          {link.reviewedAt && !link.reviewedAt.startsWith('Sample')
                            ? new Date(link.reviewedAt).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : (link.reviewedAt ?? '—')}
                        </td>
                        <td className="rounded-r-lg px-2 py-2 text-right">
                          {link.reviewedAt && !link.reviewedAt.startsWith('Sample') ? (
                            <button
                              type="button"
                              onClick={() => undoMatch(row.retailerId, row.productId)}
                              className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-medium text-teal-text underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                            >
                              Undo
                              <span className="sr-only">
                                {' '}
                                the decision on {row.name || 'this row'}, sending it back to the
                                queue
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            Nothing here reaches a server: decisions are saved in this browser, beside the shop rows
            they decide. The comparison draws {RETAILER_COUNT} shops per model from those same rows.
          </p>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-teal-foreground/20 bg-teal-foreground/10 px-3 py-2">
      <dt className="font-label text-[0.68rem] tracking-[0.06em] text-teal-on-band uppercase">
        {label}
      </dt>
      <dd className="font-mono text-xl font-semibold tabular-nums text-teal-foreground">{value}</dd>
    </div>
  )
}

function Score({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const low = score < MATCH_THRESHOLD
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-sm tabular-nums">{pct}%</span>
      <span
        className={`h-1.5 w-10 overflow-hidden rounded-full ${low ? 'bg-saffron-soft' : 'bg-teal-soft'}`}
      >
        <span
          className={`block h-full ${low ? 'bg-saffron' : 'bg-teal'}`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </span>
      <span className="sr-only">
        {low ? 'below the automatic match threshold' : 'above the automatic match threshold'}
      </span>
    </span>
  )
}

function StatusChip({ status }: { status: QueueStatus }) {
  const tone =
    status === 'approved'
      ? 'bg-teal-soft text-teal-deep'
      : status === 'rejected'
        ? 'bg-secondary text-muted-foreground'
        : 'bg-saffron-soft text-saffron-ink'
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2 font-label text-[0.7rem] capitalize ${tone}`}
    >
      {status}
    </span>
  )
}
