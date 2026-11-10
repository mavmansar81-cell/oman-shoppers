import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  FileUp,
  LayoutList,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Meta } from '@/components/Meta'
import { FreshnessNote } from '@/components/PriceFreshness'
import { OfferEditor, blankOffer, type Draft } from '@/components/retailer/ProductEditor'
import { BulkUpload } from '@/components/retailer/BulkUpload'
import { deleteOffer, importsFor, useImportHistory, useOffers, type Offer } from '@/data/offers'
import { priceWithinBand } from '@/data/offersCsv'
import { linkOf } from '@/data/matching'
import { omr } from '@/data/products'
import type { Account } from '@/data/accounts'
import { useCurrentAccount } from '@/lib/session'

/* The retailer dashboard. Everything on it is filtered by the account's own id
   before it is drawn: a company sees its own retailer_products rows and nothing
   else, and every write is keyed by that id rather than by anything the form or
   the file says. Four views under one address, so the tab is a link a shop can
   keep. */

type Tab = 'products' | 'add' | 'upload' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'add', label: 'Add or edit' },
  { id: 'upload', label: 'Bulk upload' },
  { id: 'history', label: 'Upload history' },
]

export default function RetailerPage() {
  const account = useCurrentAccount()

  if (!account) return <Navigate to="/access" replace />
  if (account.role !== 'retailer') return <Navigate to={`/account/${account.role}`} replace />
  return <Dashboard account={account} />
}

/** Rows belonging to this company, and only this company. */
function rowsFor(rows: Offer[], account: Account) {
  return rows.filter((r) => r.retailerId === account.id)
}

function Dashboard({ account }: { account: Account }) {
  const [params, setParams] = useSearchParams()
  const allRows = useOffers()
  const history = useImportHistory()
  const mine = useMemo(() => rowsFor(allRows, account), [allRows, account])
  const myImports = useMemo(() => importsFor(history, account.id), [history, account.id])

  const tabParam = params.get('tab')
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'products'
  const editId = params.get('id')
  const editingRow = editId ? mine.find((r) => r.productId === editId) : undefined

  const [draft, setDraft] = useState<Draft | null>(null)
  const [statusLine, setStatusLine] = useState<string | null>(null)

  function go(next: Record<string, string | null>) {
    const url = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null) url.delete(key)
      else url.set(key, value)
    }
    setParams(url, { replace: true })
    setDraft(null)
  }

  function startAdd() {
    setDraft(blankOffer(account))
    go({ tab: 'add', id: null })
  }

  function startEdit(row: Offer) {
    setDraft(row)
    go({ tab: 'add', id: row.productId })
  }

  /* A draft opened from the list starts as that row; the one the form edits is
     what was picked, or a blank one when Add is pressed. */
  const activeDraft = draft ?? (tab === 'add' ? (editingRow ?? null) : null)

  const listed = mine.length
  const onOffer = mine.filter((r) => r.offerActive).length
  const outside = mine.filter((r) => !priceWithinBand(r)).length
  const live = mine.filter((r) => linkOf(r)?.status === 'approved').length

  return (
    <main>
      <section className="bg-teal-band text-teal-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-9 pb-0">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-label text-xs tracking-[0.08em] text-teal-on-band uppercase">
                Retailer · {account.role}
              </p>
              <h1 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)]">{account.org || account.name}</h1>
                <Meta
                  title="Retailer dashboard — your product rows · Oman Shoppers"
                  description="Your company's own product rows: list them with their match status, add or edit one, upload a price list of up to 1,000 rows, and read what each upload wrote."
                />
                <p className="mt-2 max-w-[56ch] text-sm text-teal-foreground/90">
                {account.email} · you read and write only the rows carrying your company id.
              </p>
            </div>
            <Button
              type="button"
              className="h-11 shrink-0 bg-teal-foreground px-4 text-teal-band hover:bg-teal-soft"
              onClick={startAdd}
            >
              <FileUp className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Add a product
            </Button>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Your rows" value={String(listed)} />
            <Stat label="On the comparison" value={String(live)} />
            <Stat label="On offer now" value={String(onOffer)} />
            <Stat label="Outside your band" value={String(outside)} />
          </dl>

          <nav aria-label="Dashboard sections" className="mt-8">
            <ul className="-mb-px flex min-w-0 gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const on = t.id === tab
                return (
                  <li key={t.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => go({ tab: t.id, id: null })}
                      aria-current={on ? 'page' : undefined}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-t-lg border border-b-0 px-4 text-sm font-medium ${
                        on
                          ? 'border-teal-band bg-background text-foreground'
                          : 'border-transparent text-teal-on-band hover:bg-teal-foreground/10'
                      }`}
                    >
                      {t.id === 'upload' || t.id === 'history' ? (
                        <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      ) : (
                        <LayoutList className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      )}
                      {t.label}
                      {t.id === 'history' && myImports.length > 0 && (
                        <span className="rounded-full bg-teal-foreground/20 px-1.5 font-mono text-xs tabular-nums">
                          {myImports.length}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </section>

      <section aria-labelledby="panel-title" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-8 md:py-10">
          <h2 id="panel-title" className="sr-only">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>

          {statusLine && (
            <p role="status" className="mb-4 flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-sm text-teal-deep">
              <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {statusLine}
            </p>
          )}

          {tab === 'products' && (
            <ProductList
              account={account}
              rows={mine}
              onEdit={startEdit}
              onAdd={startAdd}
              onRemoved={(name) => setStatusLine(`${name} removed from your rows.`)}
            />
          )}

          {tab === 'add' && (
            <>
              {activeDraft ? (
                <OfferEditor
                  key={`${activeDraft.productId}-${Boolean(editingRow)}`}
                  account={account}
                  draft={activeDraft}
                  onChange={setDraft}
                  onCancel={() => go({ tab: 'products', id: null })}
                  onSaved={() => {
                    setStatusLine('Saved. Your row is listed under Products.')
                    go({ tab: 'products', id: null })
                  }}
                  existing={Boolean(editingRow)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="font-display text-lg font-bold">Nothing to edit yet</p>
                  <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">
                    Pick a row under Products, or start a new one with its model number.
                  </p>
                  <Button type="button" className="mt-4 h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep" onClick={startAdd}>
                    Add a product
                  </Button>
                </div>
              )}
            </>
          )}

          {tab === 'upload' && (
            <BulkUpload
              account={account}
              existingIds={new Set(mine.map((r) => r.productId))}
              onImported={(record) => {
                setStatusLine(
                  `${record.written} ${record.written === 1 ? 'row' : 'rows'} written from ${record.file}.`,
                )
                go({ tab: 'history', id: null })
              }}
            />
          )}

          {tab === 'history' && <UploadHistory records={myImports} />}
        </div>
      </section>

      <section aria-labelledby="links" className="border-t border-border bg-secondary">
        <div className="mx-auto flex min-w-0 max-w-content flex-wrap items-center justify-between gap-3 px-gutter py-6">
          <p className="text-sm text-muted-foreground">
            Rows that match a model on the comparison appear on its page, labelled with your shop.
          </p>
          <Link
            to="/account/retailer"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-teal-text hover:underline"
          >
            Account overview
            <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-teal-foreground/20 bg-teal-foreground/10 px-3 py-2">
      <dt className="font-label text-[0.68rem] tracking-[0.06em] text-teal-on-band uppercase">{label}</dt>
      <dd className="font-mono text-xl font-semibold tabular-nums text-teal-foreground">{value}</dd>
    </div>
  )
}

/** The company's own retailer_products, one row each, with its status. */
function ProductList({
  account,
  rows,
  onEdit,
  onAdd,
  onRemoved,
}: {
  account: Account
  rows: Offer[]
  onEdit: (row: Offer) => void
  onAdd: () => void
  onRemoved: (name: string) => void
}) {
  const [filter, setFilter] = useState<'all' | 'needs-work' | 'on-comparison'>('all')
  const filtered = rows.filter((r) => {
    if (filter === 'needs-work') return !priceWithinBand(r) || linkOf(r)?.status !== 'approved'
    if (filter === 'on-comparison') return linkOf(r)?.status === 'approved'
    return true
  })

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="font-display text-lg font-bold">No rows for {account.org || account.name} yet</p>
        <p className="mx-auto mt-1 max-w-[48ch] text-sm text-muted-foreground">
          Add one item with its model number, or upload a price list as CSV. Only rows carrying your
          company id are ever shown here.
        </p>
        <Button type="button" className="mt-4 h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep" onClick={onAdd}>
          Add the first row
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All rows'],
              ['needs-work', 'Needs attention'],
              ['on-comparison', 'On the comparison'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`min-h-11 rounded-full border px-3 text-sm font-medium ${
                filter === id
                  ? 'border-teal bg-teal-soft text-teal-deep'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No rows in this view. Switch back to All rows to see everything you hold.
        </p>
      ) : (
        <div className="mt-4 -mx-gutter overflow-x-auto px-gutter sm:mx-0 sm:px-0">
          <table className="w-full min-w-[54rem] border-separate border-spacing-y-1 text-sm">
            <caption className="sr-only">
              Your company's product rows, with the matching status of each.
            </caption>
            <thead>
              <tr className="text-left font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                <th scope="col" className="px-2 py-1">Product</th>
                <th scope="col" className="px-2 py-1">Model</th>
                <th scope="col" className="px-2 py-1">Listed</th>
                <th scope="col" className="px-2 py-1">Floor · Ceiling</th>
                <th scope="col" className="px-2 py-1">Offer</th>
                <th scope="col" className="px-2 py-1">Match status</th>
                <th scope="col" className="px-2 py-1"><span className="sr-only">Row actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const link = linkOf(row)
                return (
                  <tr key={row.productId} className="bg-card">
                    <th scope="row" className="max-w-[16rem] rounded-l-lg px-2 py-2 text-left font-normal">
                      <span className="block truncate font-medium">{row.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.productId} · {row.brand} · {row.store}
                      </span>                    </th>
                    <td className="px-2 py-2 font-mono text-xs">{row.model}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">
                      {omr(row.listedPrice)}
                      <FreshnessNote
                        updatedAt={row.priceUpdatedAt}
                        className="block font-sans text-[0.7rem] font-normal text-muted-foreground"
                      />
                    </td>
                    <td className="px-2 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                      {omr(row.minPrice)} · {omr(row.maxPrice)}
                      {!priceWithinBand(row) && (
                        <span className="mt-0.5 flex items-center gap-1 text-saffron-ink">
                          <AlertTriangle className="size-3" strokeWidth={1.5} aria-hidden="true" />
                          Outside band
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {row.offerActive ? (
                        <span className="inline-flex rounded-full bg-saffron px-2 py-0.5 font-label text-[0.7rem] text-saffron-text">
                          On
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <MatchStatus status={link?.status} reviewedBy={link?.reviewedBy} />
                    </td>
                    <td className="rounded-r-lg px-2 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="min-h-11 rounded px-2 text-sm font-medium text-teal-text hover:underline"
                      >
                        <Pencil className="mr-1 inline size-3.5" strokeWidth={1.5} aria-hidden="true" />
                        Edit<span className="sr-only"> {row.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${row.name} from your rows?`)) {
                            deleteOffer(row.retailerId, row.productId)
                            onRemoved(row.name)
                          }
                        }}
                        className="ml-1 grid size-11 place-items-center rounded text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${row.name}`}
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function MatchStatus({ status, reviewedBy }: { status?: string; reviewedBy?: string | null }) {
  if (status === 'approved')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 font-label text-[0.7rem] text-teal-deep">
        <Check className="size-3" strokeWidth={2} aria-hidden="true" />
        Live
      </span>
    )
  if (status === 'rejected')
    return (
      <span className="block text-xs text-muted-foreground">
        Rejected — not on any product page
      </span>
    )
  return (
    <span className="block">
      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 font-label text-[0.7rem] text-secondary-foreground">
        Awaiting review
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {reviewedBy ? `Queued for ${reviewedBy}` : 'An admin decides which model it belongs to'}
      </span>
    </span>
  )
}

function UploadHistory({ records }: { records: ReturnType<typeof importsFor> }) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="font-display text-lg font-bold">No files uploaded yet</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">
          Every price list you upload is listed here with the rows it wrote and the rows it refused.
        </p>
      </div>
    )
  }

  return (
    <ol className="min-w-0 space-y-3">
      {records.map((record) => (
        <li key={record.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
            <p className="min-w-0 truncate font-medium">{record.file}</p>
            <p className="inline-flex items-center gap-1.5 font-label text-xs text-muted-foreground">
              <Clock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              {new Date(record.at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <p className="mt-1 font-mono text-xs break-words text-muted-foreground">{record.by}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Rows in file', record.rows],
              ['Written', record.written],
              ['Replacing', record.replaced],
              ['Rejected', record.rejected],
            ].map(([label, value]) => (
              <div key={String(label)} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2">
                <dt className="font-label text-[0.68rem] tracking-[0.06em] text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="font-mono text-base font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {record.issues.length > 0 && (
            <details className="mt-3 min-w-0">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-teal-text">
                {record.issues.length} {record.issues.length === 1 ? 'row' : 'rows'} refused — read them
              </summary>
              <ul className="mt-1 space-y-1">
                {record.issues.map((issue) => (
                  <li key={`${issue.line}-${issue.message}`} className="text-xs text-saffron-ink">
                    Line {issue.line}: {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </li>
      ))}
    </ol>
  )
}
