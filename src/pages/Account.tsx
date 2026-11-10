import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Download,
  Eye,
  Inbox,
  Plus,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeviceDrawing } from '@/components/DeviceDrawing'
import {
  PRODUCT_TYPES,
  TYPE_TO_DEVICE,
  deleteOffer,
  saveOffer,
  seedOffers,
  upsertOffers,
  useActivity,
  useOffers,
  viewsFor,
  type Offer,
  type ProductType,
} from '@/data/offers'
import { CSV_COLUMNS, csvTemplate, offersFromCsv, priceWithinBand } from '@/data/offersCsv'
import { updateAccount, type Account } from '@/data/accounts'
import { queueCounts } from '@/data/matching'
import { refreshAccounts, useAccounts, useCurrentAccount } from '@/lib/session'
import { omr } from '@/data/products'

export default function AccountPage() {
  const { role } = useParams()
  const account = useCurrentAccount()

  if (!account) {
    return <Navigate to="/access" replace />
  }
  if (account.role !== role) {
    return <Navigate to={`/account/${account.role}`} replace />
  }
  if (account.role === 'retailer') return <RetailerPage account={account} />
  if (account.role === 'admin') return <AdminPage account={account} />
  return <CustomerPage account={account} />
}

/* -------------------------------------------------------------------------
   Retailer: the price book. A table that edits in place, a CSV import, and
   the two figures the dashboard is for — views on listed models and the
   requests shoppers sent. Reads and writes; the demo login is a sample store.
   ------------------------------------------------------------------------- */

type Draft = Offer

function blankOffer(account: Account): Draft {
  const now = new Date().toISOString().slice(0, 16)
  return {
    productId: '',
    retailerId: account.id.startsWith('acct-') ? account.id : account.id,
    shop: account.org || account.name,
    store: account.stores[0] ?? 'City Centre Muscat',
    type: 'Mobile',
    brand: account.brands[0] ?? '',
    name: '',
    model: '',
    specs: ['', '', ''],
    listedPrice: 0,
    maxPrice: 0,
    minPrice: 0,
    offerActive: false,
    offerFrom: now,
    offerTo: now,
    negotiable: false,
    image1: '',
    image2: '',
    leadEmail: account.email,
    leadPhone: account.phone,
    updated: new Date().toISOString(),
    marketSlug: undefined,
  }
}

function RetailerPage({ account }: { account: Account }) {
  const rows = useOffers()
  const mine = useMemo(
    () => rows.filter((r) => r.retailerId === retailerKey(account)),
    [rows, account],
  )
  const { leads, views } = useActivity()
  const myLeads = leads.filter((l) => l.retailerId === retailerKey(account))
  const [editing, setEditing] = useState<Draft | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [brandFilter, setBrandFilter] = useState('All')

  const brands = ['All', ...account.brands]
  const shown = mine.filter((r) => brandFilter === 'All' || r.brand === brandFilter)
  const listed = mine.length
  const onOffer = mine.filter((r) => r.offerActive).length
  const outsideBand = mine.filter((r) => !priceWithinBand(r)).length

  return (
    <main>
      <section className="bg-teal-band text-teal-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-9 pb-11">
          <p className="font-label text-xs tracking-[0.08em] text-teal-on-band uppercase">
            Retailer · read and write
          </p>
          <h1 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)]">{account.org || account.name}</h1>
          <p className="mt-3 max-w-[56ch] text-sm text-teal-foreground sm:text-base">
            {account.name} · {account.email}. Your rows feed the comparison for the models they
            match, and only your own figures are ever shown to a shopper.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Items listed" value={String(listed)} />
            <Stat label="On offer now" value={String(onOffer)} />
            <Stat label="Views on your models" value={String(viewsFor(mine, views))} />
            <Stat label="Quote requests" value={String(myLeads.length)} />
          </dl>
          {outsideBand > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-md bg-saffron-soft px-3 py-2 text-sm text-saffron-ink">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {outsideBand} {outsideBand === 1 ? 'price sits' : 'prices sit'} outside your own floor
              and ceiling. Only you see this.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="book" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="book" className="text-[clamp(1.4rem,3vw,1.9rem)]">
                Your price book
              </h2>
              <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
                Edit any figure in the row and it saves as you type. Max and min selling price are
                yours alone — they are never rendered to a shopper.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link to="/retailer">
                  Open the dashboard
                  <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setImportOpen((v) => !v)
                  setEditing(null)
                }}
              >
                <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
                {importOpen ? 'Close import' : 'Import CSV'}
              </Button>
              <Button
                type="button"
                className="h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep"
                onClick={() => {
                  setEditing(blankOffer(account))
                  setImportOpen(false)
                }}
              >
                <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Add a product
              </Button>
            </div>
          </div>

          {importOpen && <CsvImport account={account} onDone={() => setImportOpen(false)} />}
          {editing && (
            <OfferEditor
              account={account}
              draft={editing}
              onChange={setEditing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
              existing={mine.some((r) => r.productId === editing.productId && editing.productId !== '')}
            />
          )}

          {account.brands.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrandFilter(b)}
                  aria-pressed={brandFilter === b}
                  className={`min-h-11 rounded-full border px-3 text-sm font-medium ${
                    brandFilter === b
                      ? 'border-teal bg-teal-soft text-teal-deep'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {mine.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="font-display text-lg font-bold">No items yet</p>
              <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">
                Add a product with its model number, or import a CSV from your own sheet. A model
                number that matches one of the sample models joins the comparison straight away.
              </p>
              <Button
                type="button"
                className="mt-4 h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep"
                onClick={() => setEditing(blankOffer(account))}
              >
                <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Add the first item
              </Button>
            </div>
          ) : (
            <PriceBook account={account} rows={shown} onEdit={setEditing} />
          )}
        </div>
      </section>

      <section aria-labelledby="leads" className="border-t border-border bg-secondary">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <h2 id="leads" className="text-[clamp(1.4rem,3vw,1.9rem)]">
            Quote requests
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            Shoppers who asked you for a price on one of your listed models in this browser. Each
            one is kept only for this tab session.
          </p>
          {myLeads.length === 0 ? (
            <div className="mt-5 flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-deep">
                <Inbox className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">No requests yet</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Open one of your models on the comparison and ask for a quote as a shopper to see
                  the row appear here.
                </p>
              </div>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {myLeads.map((lead) => (
                <li key={lead.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
                  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                    <p className="truncate font-medium">{lead.productName}</p>
                    <p className="font-label text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{lead.name}</p>
                  <p className="mt-2 truncate font-mono text-sm">{lead.email}</p>
                  <p className="truncate font-mono text-sm">{lead.phone}</p>
                  {lead.message && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{lead.message}</p>
                  )}
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2 py-0.5 font-label text-[0.7rem] text-teal-deep">
                    <Check className="size-3" strokeWidth={2} aria-hidden="true" />
                    Contact consent given
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

/** The retailer id rows are keyed by: the store slug, stable across logins. */
function retailerKey(account: Account) {
  return account.id
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

function PriceBook({
  account,
  rows,
  onEdit,
}: {
  account: Account
  rows: Offer[]
  onEdit: (draft: Draft) => void
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        No items for this brand. Switch back to All, or add one.
      </p>
    )
  }
  return (
    <div className="mt-5 -mx-gutter overflow-x-auto px-gutter sm:mx-0 sm:px-0">
      <table className="w-full min-w-[46rem] border-separate border-spacing-y-1 text-sm">
        <caption className="sr-only">
          Your items. Each price is editable; max and min selling price stay on this page.
        </caption>
        <thead>
          <tr className="text-left font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
            <th scope="col" className="px-2 py-1">Product</th>
            <th scope="col" className="px-2 py-1">Model</th>
            <th scope="col" className="px-2 py-1">Listed</th>
            <th scope="col" className="px-2 py-1">Floor · Ceiling</th>
            <th scope="col" className="px-2 py-1">Offer</th>
            <th scope="col" className="px-2 py-1">Negotiate</th>
            <th scope="col" className="px-2 py-1">
              <span className="sr-only">Row actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.retailerId}-${row.productId}`} className="bg-card">
              <th scope="row" className="max-w-[16rem] truncate rounded-l-lg px-2 py-2 text-left font-normal">
                <span className="block truncate font-medium">{row.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.brand} · {row.type} · {row.store}
                </span>
              </th>
              <td className="px-2 py-2 font-mono text-xs">{row.model}</td>
              <td className="px-2 py-2 font-mono tabular-nums">{omr(row.listedPrice)}</td>
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
              <td className="px-2 py-2 text-xs text-muted-foreground">
                {row.negotiable ? 'Yes' : 'No'}
              </td>
              <td className="rounded-r-lg px-2 py-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="min-h-11 rounded px-2 text-sm font-medium text-teal-text hover:underline"
                >
                  Edit<span className="sr-only"> {row.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${row.name} from your price book?`)) {
                      deleteOffer(row.retailerId, row.productId)
                    }
                  }}
                  className="ml-1 grid size-11 place-items-center rounded text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${row.name}`}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        {account.org} · {rows.length} {rows.length === 1 ? 'item' : 'items'} in this view
      </p>
    </div>
  )
}

function OfferEditor({
  account,
  draft,
  onChange,
  onCancel,
  onSaved,
  existing,
}: {
  account: Account
  draft: Draft
  onChange: (next: Draft) => void
  onCancel: () => void
  onSaved: () => void
  existing: boolean
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!draft.productId.trim()) next.productId = 'Your own id for this item, unique in your book.'
    if (!draft.name.trim()) next.name = 'The name a shopper sees.'
    if (!draft.model.trim()) next.model = 'The OEM model number, exactly as the maker writes it.'
    if (!draft.brand.trim()) next.brand = 'Pick the brand this login may publish.'
    if (!(draft.listedPrice > 0)) next.listedPrice = 'A price in OMR, like 189.900.'
    if (!draft.leadEmail.includes('@')) next.leadEmail = 'Where a lead should be sent.'
    if (draft.offerActive && (!draft.offerFrom || !draft.offerTo))
      next.offerTo = 'An offer needs both a start and an end.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveOffer({ ...draft, updated: new Date().toISOString() })
    onSaved()
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="mt-6 min-w-0 rounded-xl border border-teal/40 bg-card p-4 sm:p-5"
      aria-labelledby="editor-title"
    >
      <h3 id="editor-title" className="font-display text-lg font-bold">
        {existing ? `Editing ${draft.name}` : 'Add a product'}
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Your product id is unique inside your own book. Max and min never leave this page.
      </p>

      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <Field id="d-product" label="Product ID" error={errors.productId} hint="Unique for your store">
          <input id="d-product" value={draft.productId} onChange={(e) => set('productId', e.target.value)} className="field h-11" placeholder="SDG-16P-256" aria-invalid={Boolean(errors.productId)} />
        </Field>
        <Field id="d-type" label="Product type">
          <select id="d-type" value={draft.type} onChange={(e) => set('type', e.target.value as ProductType)} className="field h-11">
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id="d-brand" label="Product brand" error={errors.brand}>
          <select id="d-brand" value={draft.brand} onChange={(e) => set('brand', e.target.value)} className="field h-11" aria-invalid={Boolean(errors.brand)}>
            {account.brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field id="d-model" label="Model number (OEM)" error={errors.model}>
          <input id="d-model" value={draft.model} onChange={(e) => set('model', e.target.value)} className="field h-11 font-mono" placeholder="A3290-256" aria-invalid={Boolean(errors.model)} />
        </Field>
        <Field id="d-store" label="Store">
          <select id="d-store" value={draft.store} onChange={(e) => set('store', e.target.value)} className="field h-11">
            {Array.from(new Set([draft.store, ...account.stores])).filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="d-name" label="Product name" error={errors.name}>
          <input id="d-name" value={draft.name} onChange={(e) => set('name', e.target.value)} className="field h-11" placeholder="iPhone 16 Pro 256GB" aria-invalid={Boolean(errors.name)} />
        </Field>
        {[0, 1, 2].map((i) => (
          <Field key={i} id={`d-spec${i}`} label={`Specification ${i + 1}`}>
            <input
              id={`d-spec${i}`}
              value={draft.specs[i]}
              onChange={(e) => {
                const specs = [...draft.specs] as [string, string, string]
                specs[i] = e.target.value
                set('specs', specs)
              }}
              className="field h-11"
            />
          </Field>
        ))}
        <Field id="d-listed" label="Listed price (OMR)" error={errors.listedPrice} hint="What a shopper sees">
          <input id="d-listed" type="number" step="0.001" min="0" value={draft.listedPrice || ''} onChange={(e) => set('listedPrice', Number(e.target.value))} className="field h-11 font-mono tabular-nums" aria-invalid={Boolean(errors.listedPrice)} />
        </Field>
        <Field id="d-max" label="Max selling price (OMR)" hint="Never shown to a shopper">
          <input id="d-max" type="number" step="0.001" min="0" value={draft.maxPrice || ''} onChange={(e) => set('maxPrice', Number(e.target.value))} className="field h-11 font-mono tabular-nums" />
        </Field>
        <Field id="d-min" label="Min selling price (OMR)" hint="Never shown to a shopper">
          <input id="d-min" type="number" step="0.001" min="0" value={draft.minPrice || ''} onChange={(e) => set('minPrice', Number(e.target.value))} className="field h-11 font-mono tabular-nums" />
        </Field>
        <Field id="d-lead-email" label="Contact email for leads" error={errors.leadEmail}>
          <input id="d-lead-email" type="email" value={draft.leadEmail} onChange={(e) => set('leadEmail', e.target.value)} className="field h-11" aria-invalid={Boolean(errors.leadEmail)} />
        </Field>
        <Field id="d-lead-phone" label="Contact phone for leads">
          <input id="d-lead-phone" value={draft.leadPhone} onChange={(e) => set('leadPhone', e.target.value)} className="field h-11" inputMode="tel" />
        </Field>
        <Field id="d-image1" label="Image 1 URL" hint="Optional; an address, not a file">
          <input id="d-image1" value={draft.image1} onChange={(e) => set('image1', e.target.value)} className="field h-11" />
        </Field>
        <Field id="d-image2" label="Image 2 URL">
          <input id="d-image2" value={draft.image2} onChange={(e) => set('image2', e.target.value)} className="field h-11" />
        </Field>
      </div>

      <fieldset className="mt-5 min-w-0 rounded-lg border border-border bg-secondary p-4">
        <legend className="px-1 font-label text-sm font-medium">Offer and negotiation</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={draft.offerActive} onChange={(e) => set('offerActive', e.target.checked)} className="size-4 accent-teal" />
            Offer applicable
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={draft.negotiable} onChange={(e) => set('negotiable', e.target.checked)} className="size-4 accent-teal" />
            Negotiation allowed
          </label>
          <Field id="d-from" label="Offer valid from">
            <input id="d-from" type="datetime-local" value={draft.offerFrom} disabled={!draft.offerActive} onChange={(e) => set('offerFrom', e.target.value)} className="field h-11 disabled:opacity-50" />
          </Field>
          <Field id="d-to" label="Offer valid to" error={errors.offerTo}>
            <input id="d-to" type="datetime-local" value={draft.offerTo} disabled={!draft.offerActive} onChange={(e) => set('offerTo', e.target.value)} className="field h-11 disabled:opacity-50" aria-invalid={Boolean(errors.offerTo)} />
          </Field>
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" className="h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep">
          {existing ? 'Save changes' : 'Save to the price book'}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="font-label text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function CsvImport({ account, onDone }: { account: Account; onDone: () => void }) {
  const [result, setResult] = useState<{
    offers: Offer[]
    issues: { line: number; message: string }[]
    unknownHeaders: string[]
    file: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function download() {
    const blob = new Blob([csvTemplate()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'oman-shoppers-price-book.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(file: File) {
    setError(null)
    setResult(null)
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setError(
        'Excel files are a zip of XML, which cannot be read here. Save the sheet as CSV in Excel and import that instead.',
      )
      return
    }
    if (!/\.csv$/i.test(file.name)) {
      setError('Choose a .csv file exported from your own sheet.')
      return
    }
    const text = await file.text()
    const parsed = offersFromCsv(text, {
      id: account.id,
      shop: account.org || account.name,
      store: account.stores[0] ?? 'City Centre Muscat',
    })
    setResult({ ...parsed, file: file.name })
  }

  return (
    <div className="mt-5 min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-display text-lg font-bold">Import a CSV</h3>
      <p className="mt-0.5 max-w-[64ch] text-sm text-muted-foreground">
        One row per item, a header row naming the columns in any order. A row whose product id is
        already yours replaces that item. Nothing is written until you press Import.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm font-medium">
          <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Choose a .csv file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFile(file)
            }}
          />
        </label>
        <Button type="button" variant="outline" className="h-11" onClick={download}>
          <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Download the template
        </Button>
      </div>

      <details className="mt-4 min-w-0">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-teal-text">
          The columns it reads
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead>
              <tr className="font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                <th scope="col" className="py-1 pr-3">Column</th>
                <th scope="col" className="py-1 pr-3">Required</th>
                <th scope="col" className="py-1">Example</th>
              </tr>
            </thead>
            <tbody>
              {CSV_COLUMNS.map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <td className="py-1 pr-3">{c.label}</td>
                  <td className="py-1 pr-3 text-muted-foreground">{c.required ? 'Yes' : '—'}</td>
                  <td className="py-1 font-mono text-xs text-muted-foreground">{c.example || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-saffron-soft px-3 py-2 text-sm text-saffron-ink">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4">
          <p className="text-sm">
            <span className="font-medium">{result.file}</span> — {result.offers.length} readable{' '}
            {result.offers.length === 1 ? 'row' : 'rows'}
            {result.issues.length > 0 && `, ${result.issues.length} skipped`}.
          </p>
          {result.unknownHeaders.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Ignored columns: {result.unknownHeaders.join(', ')}.
            </p>
          )}
          {result.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.issues.slice(0, 8).map((issue) => (
                <li key={`${issue.line}-${issue.message}`} className="text-xs text-saffron-ink">
                  Line {issue.line}: {issue.message}
                </li>
              ))}
            </ul>
          )}
          {result.offers.length > 0 ? (
            <Button
              type="button"
              className="mt-3 h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep"
              onClick={() => {
                upsertOffers(result.offers)
                onDone()
              }}
            >
              Import {result.offers.length} {result.offers.length === 1 ? 'item' : 'items'}
            </Button>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing readable in that file. Download the template to see the shape it expects.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Customer: the price list is the home page. This page holds the one thing a
   customer account has that a visitor does not — the consent to pass contact
   details on, and the watch list the prototype cannot yet save.
   ------------------------------------------------------------------------- */

function CustomerPage({ account }: { account: Account }) {
  const rows = useOffers()
  const { leads } = useActivity()
  const myLeads = leads.filter((l) => l.email === account.email)
  const sample = useMemo(() => seedOffers().slice(0, 3), [])
  const [consent, setConsent] = useState(true)
  const [saved, setSaved] = useState(false)

  function saveConsent(next: boolean) {
    setConsent(next)
    updateAccount(account.id, {
      name: account.name,
      phone: account.phone,
    })
    refreshAccounts()
    setSaved(true)
  }

  return (
    <main>
      <section className="bg-teal-band text-teal-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-9 pb-11">
          <p className="font-label text-xs tracking-[0.08em] text-teal-on-band uppercase">
            Customer · read only
          </p>
          <h2 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)]">Hello, {account.name.split(' ')[0]}</h2>
          <p className="mt-3 max-w-[56ch] text-sm text-teal-foreground sm:text-base">
            Compare {rows.filter((r) => r.marketSlug).length} listed models across Omani shops. Your
            contact details go to a shop only when you ask for a quote.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="h-11 bg-teal-foreground px-4 text-teal-band hover:bg-teal-soft">
              <Link to="/">Compare prices</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="consent" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
            <div className="min-w-0">
              <h2 id="consent" className="text-[clamp(1.4rem,3vw,1.9rem)]">
                Sending your contact details
              </h2>
              <p className="mt-2 max-w-[60ch] text-muted-foreground">
                A quote request passes your name, email and phone to the shop you picked, and to
                nobody else. It is your choice each time — nothing is shared because you have an
                account.
              </p>
              <div className="mt-5 rounded-xl border border-border bg-card p-4">
                <label htmlFor="consent-toggle" className="flex items-start gap-3">
                  <input
                    id="consent-toggle"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => saveConsent(e.target.checked)}
                    className="mt-1 size-4 accent-teal"
                  />
                  <span>
                    <span className="block font-medium">Pre-fill my details on a quote request</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {account.name} · {account.email} · {account.phone}. You can still uncheck it
                      in the form on any product.
                    </span>
                  </span>
                </label>
                {saved && (
                  <p role="status" className="mt-2 text-xs font-medium text-teal-text">
                    Saved on this browser.
                  </p>
                )}
              </div>

              <h3 className="mt-8 font-display text-lg font-bold">Requests you sent</h3>
              {myLeads.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                  None yet. Open a product, pick a shop and ask for a quote to see it here. Requests
                  are kept for this tab session only.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {myLeads.map((lead) => (
                    <li key={lead.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">
                        {lead.productName} — {lead.shop}
                      </span>
                      <Link
                        to={`/product/${lead.productId}`}
                        className="inline-flex items-center gap-1 text-teal-text hover:underline"
                      >
                        Open<span className="sr-only"> {lead.productName}</span>
                        <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="min-w-0">
              <h2 className="font-display text-lg font-bold">Where to start</h2>
              <ul className="mt-3 space-y-2">
                {sample.map((row) => (
                  <li key={row.productId} className="min-w-0">
                    <Link
                      to={row.marketSlug ? `/product/${row.marketSlug}` : '/'}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-teal/50"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-deep">
                        <DeviceDrawing device={TYPE_TO_DEVICE[row.type]} className="size-8" decorative />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{row.name}</span>
                        <span className="block font-mono text-sm tabular-nums text-teal-text">
                          {omr(row.listedPrice)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-border bg-secondary p-4">
                <p className="inline-flex items-center gap-2 font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                  <Eye className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  Watch list
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A saved list needs a server to survive a new device. Until then it lives in this
                  browser's price book and nowhere else.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

/* -------------------------------------------------------------------------
   Admin: every retailer's book, readable, and every row writable. Plus the
   scope controls — which brands and stores a retailer login may publish to.
   ------------------------------------------------------------------------- */

function AdminPage({ account }: { account: Account }) {
  const rows = useOffers()
  const accounts = useAccounts()
  const { leads } = useActivity()
  const [shopFilter, setShopFilter] = useState('All')
  const [editing, setEditing] = useState<Draft | null>(null)

  const shops = ['All', ...Array.from(new Set(rows.map((r) => r.shop)))]
  const shown = rows.filter((r) => shopFilter === 'All' || r.shop === shopFilter)
  const retailers = accounts.filter((a) => a.role === 'retailer')
  const outsideBand = rows.filter((r) => !priceWithinBand(r)).length

  return (
    <main>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-9 pb-11">
          <p className="font-label text-xs tracking-[0.08em] text-teal-on-band uppercase">
            Admin · read and write
          </p>
          <h2 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)]">Every shop, every row</h2>
          <p className="mt-3 max-w-[56ch] text-sm text-primary-foreground/80 sm:text-base">
            Signed in as {account.name}. This is everything saved in this browser, which is the whole
            of the site's data until a server exists.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Items across shops" value={String(rows.length)} />
            <Stat label="Retailer logins" value={String(retailers.length)} />
            <Stat label="Quote requests" value={String(leads.length)} />
            <Stat label="Outside their band" value={String(outsideBand)} />
          </dl>
        </div>
      </section>

      <section aria-labelledby="all-items" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="all-items" className="text-[clamp(1.4rem,3vw,1.9rem)]">
                All items
              </h2>
              <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
                Every row any retailer has saved. Edit corrects a figure; remove takes the row out of
                that shop's book.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link to="/admin/match-queue">
                  Match queue ({queueCounts(rows).pending})
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  const seeded = seedOffers()
                  upsertOffers(seeded)
                }}
              >
                Restore the sample rows
              </Button>
            </div>
          </div>

          {editing && (
            <OfferEditor
              account={account}
              draft={editing}
              onChange={setEditing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
              existing
            />
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {shops.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShopFilter(s)}
                aria-pressed={shopFilter === s}
                className={`min-h-11 rounded-full border px-3 text-sm font-medium ${
                  shopFilter === s ? 'border-teal bg-teal-soft text-teal-deep' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Nothing saved yet. Restore the sample rows to see the shape of a price book.
            </p>
          ) : (
            <div className="mt-4 -mx-gutter overflow-x-auto px-gutter sm:mx-0 sm:px-0">
              <table className="w-full min-w-[52rem] border-separate border-spacing-y-1 text-sm">
                <caption className="sr-only">Every item saved in this browser, by shop.</caption>
                <thead>
                  <tr className="text-left font-label text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase">
                    <th scope="col" className="px-2 py-1">Shop</th>
                    <th scope="col" className="px-2 py-1">Item</th>
                    <th scope="col" className="px-2 py-1">Model</th>
                    <th scope="col" className="px-2 py-1">Listed</th>
                    <th scope="col" className="px-2 py-1">Band</th>
                    <th scope="col" className="px-2 py-1">Leads to</th>
                    <th scope="col" className="px-2 py-1"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={`${row.retailerId}-${row.productId}`} className="bg-card">
                      <th scope="row" className="max-w-[12rem] truncate rounded-l-lg px-2 py-2 text-left font-medium">
                        {row.shop}
                        <span className="block truncate text-xs font-normal text-muted-foreground">{row.store}</span>
                      </th>
                      <td className="max-w-[14rem] truncate px-2 py-2">{row.name}</td>
                      <td className="px-2 py-2 font-mono text-xs">{row.model}</td>
                      <td className="px-2 py-2 font-mono tabular-nums">{omr(row.listedPrice)}</td>
                      <td className="px-2 py-2 text-xs">
                        {priceWithinBand(row) ? (
                          <span className="text-muted-foreground">Inside</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-saffron-ink">
                            <AlertTriangle className="size-3" strokeWidth={1.5} aria-hidden="true" />
                            Outside
                          </span>
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-2 py-2 font-mono text-xs">{row.leadEmail}</td>
                      <td className="rounded-r-lg px-2 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="min-h-11 rounded px-2 text-sm font-medium text-teal-text hover:underline"
                        >
                          Edit<span className="sr-only"> {row.name} at {row.shop}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${row.name} from ${row.shop}'s book?`))
                              deleteOffer(row.retailerId, row.productId)
                          }}
                          className="ml-1 grid size-11 place-items-center rounded text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${row.name} at ${row.shop}`}
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="scopes" className="border-t border-border bg-secondary">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <h2 id="scopes" className="text-[clamp(1.4rem,3vw,1.9rem)]">
            Retailer access
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            A retailer login publishes only the brands and stores granted here. Grants are saved on
            this browser with the account.
          </p>
          {retailers.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No retailer login exists in this browser yet. Create one from the access page.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {retailers.map((r) => (
                <li key={r.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <Users className="size-4 shrink-0 text-teal-text" strokeWidth={1.5} aria-hidden="true" />
                    <p className="truncate font-medium">{r.org || r.name}</p>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.email}</p>
                  <ScopeEditor retailer={r} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

const ALL_BRANDS = ['Apple', 'Samsung', 'Google', 'Dell', 'Lenovo', 'Sony', 'Microsoft', 'Nintendo', 'Bose']
const ALL_STORES = ['City Centre Muscat', 'City Centre Qurum', 'Mall of Oman', 'Al Khuwair', 'Online']

function ScopeEditor({ retailer }: { retailer: Account }) {
  function toggle(key: 'brands' | 'stores', value: string) {
    const list = retailer[key]
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    updateAccount(retailer.id, { [key]: next })
    refreshAccounts()
  }
  return (
    <div className="mt-3">
      <fieldset className="min-w-0">
        <legend className="font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
          Brands
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ALL_BRANDS.map((b) => {
            const on = retailer.brands.includes(b)
            return (
              <label
                key={b}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${
                  on ? 'border-teal bg-teal-soft text-teal-deep' : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle('brands', b)} className="size-3.5 accent-teal" />
                {b}
              </label>
            )
          })}
        </div>
      </fieldset>
      <fieldset className="mt-3 min-w-0">
        <legend className="font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
          Stores
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ALL_STORES.map((s) => {
            const on = retailer.stores.includes(s)
            return (
              <label
                key={s}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${
                  on ? 'border-teal bg-teal-soft text-teal-deep' : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle('stores', s)} className="size-3.5 accent-teal" />
                {s}
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
