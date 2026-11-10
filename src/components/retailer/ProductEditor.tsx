import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PRODUCT_TYPES, saveOffer, type Offer, type ProductType } from '@/data/offers'
import type { Account } from '@/data/accounts'
import { FileUploader, type PickedFile } from '@/components/retailer/FileUploader'

/* Add or edit one of a company's own retailer_products rows. Everything here is
   written with the company's own id, so a shop can never create a row for
   another shop: the id comes from the session, not from the form. */

export type Draft = Offer

const FIELD = 'field field-tall w-full'

export function blankOffer(account: Account): Draft {
  const now = new Date().toISOString().slice(0, 16)
  return {
    productId: '',
    retailerId: account.id,
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

export function OfferEditor({
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
  const [saved, setSaved] = useState(false)

  const [pickedImages, setPickedImages] = useState<PickedFile[]>(() =>
    [draft.image1Path, draft.image2Path]
      .filter((p): p is string => Boolean(p))
      .map((path) => ({ path, name: path.split('/').pop() ?? path, size: 0 })),
  )
  const [pickedDocuments, setPickedDocuments] = useState<PickedFile[]>(() =>
    (draft.documentPaths ?? []).map((path) => ({
      path,
      name: path.split('/').pop() ?? path,
      size: 0,
    })),
  )
  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value })
    setSaved(false)
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
    if (draft.maxPrice > 0 && draft.minPrice > draft.maxPrice)
      next.maxPrice = 'The ceiling must be at least the floor.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveOffer({ ...draft, updated: new Date().toISOString() })
    setSaved(true)
    onSaved()
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="min-w-0 rounded-xl border border-teal/40 bg-card p-4 sm:p-5"
      aria-labelledby="editor-title"
    >
      <h2 id="editor-title" className="font-display text-lg font-bold">
        {existing ? `Editing ${draft.name}` : 'Add a product'}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Saved under {account.org || account.name}. Max and min selling price never leave this page.
      </p>

      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <Field id="d-product" label="Product ID" error={errors.productId} hint="Unique in your company's rows">
          <input
            id="d-product"
            value={draft.productId}
            onChange={(e) => set('productId', e.target.value)}
            className={`${FIELD} font-mono`}
            placeholder="SDG-16P-256"
            aria-invalid={Boolean(errors.productId)}
          />
        </Field>
        <Field id="d-type" label="Product type">
          <select
            id="d-type"
            value={draft.type}
            onChange={(e) => set('type', e.target.value as ProductType)}
            className={FIELD}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field id="d-brand" label="Product brand" error={errors.brand} hint="Only the brands granted to this login">
          <select
            id="d-brand"
            value={draft.brand}
            onChange={(e) => set('brand', e.target.value)}
            className={FIELD}
            aria-invalid={Boolean(errors.brand)}
          >
            {account.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field id="d-model" label="Model number (OEM)" error={errors.model}>
          <input
            id="d-model"
            value={draft.model}
            onChange={(e) => set('model', e.target.value)}
            className={`${FIELD} font-mono`}
            placeholder="A3290-256"
            aria-invalid={Boolean(errors.model)}
          />
        </Field>
        <Field id="d-store" label="Store">
          <select id="d-store" value={draft.store} onChange={(e) => set('store', e.target.value)} className={FIELD}>
            {Array.from(new Set([draft.store, ...account.stores]))
              .filter(Boolean)
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </Field>
        <Field id="d-name" label="Product name" error={errors.name}>
          <input
            id="d-name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            className={FIELD}
            placeholder="iPhone 16 Pro 256GB"
            aria-invalid={Boolean(errors.name)}
          />
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
              className={FIELD}
            />
          </Field>
        ))}
        <Field id="d-listed" label="Listed price (OMR)" error={errors.listedPrice} hint="What a shopper sees">
          <input
            id="d-listed"
            type="number"
            step="0.001"
            min="0"
            value={draft.listedPrice || ''}
            onChange={(e) => set('listedPrice', Number(e.target.value))}
            className={`${FIELD} font-mono tabular-nums`}
            aria-invalid={Boolean(errors.listedPrice)}
          />
        </Field>
        <Field id="d-max" label="Max selling price (OMR)" hint="Never shown to a shopper" error={errors.maxPrice}>
          <input
            id="d-max"
            type="number"
            step="0.001"
            min="0"
            value={draft.maxPrice || ''}
            onChange={(e) => set('maxPrice', Number(e.target.value))}
            className={`${FIELD} font-mono tabular-nums`}
            aria-invalid={Boolean(errors.maxPrice)}
          />
        </Field>
        <Field id="d-min" label="Min selling price (OMR)" hint="Never shown to a shopper">
          <input
            id="d-min"
            type="number"
            step="0.001"
            min="0"
            value={draft.minPrice || ''}
            onChange={(e) => set('minPrice', Number(e.target.value))}
            className={`${FIELD} font-mono tabular-nums`}
          />
        </Field>
        <Field id="d-lead-email" label="Contact email for leads" error={errors.leadEmail}>
          <input
            id="d-lead-email"
            type="email"
            value={draft.leadEmail}
            onChange={(e) => set('leadEmail', e.target.value)}
            className={FIELD}
            aria-invalid={Boolean(errors.leadEmail)}
          />
        </Field>
        <Field id="d-lead-phone" label="Contact phone for leads">
          <input
            id="d-lead-phone"
            value={draft.leadPhone}
            onChange={(e) => set('leadPhone', e.target.value)}
            className={FIELD}
            inputMode="tel"
          />
        </Field>
        <Field id="d-image1" label="Image 1 URL" hint="Optional; an address, not a file">
          <input id="d-image1" value={draft.image1} onChange={(e) => set('image1', e.target.value)} className={FIELD} />
        </Field>
        <Field id="d-image2" label="Image 2 URL">
          <input id="d-image2" value={draft.image2} onChange={(e) => set('image2', e.target.value)} className={FIELD} />
        </Field>
      </div>

      <fieldset className="mt-5 min-w-0 rounded-lg border border-border bg-secondary p-4">
        <legend className="px-1 font-label text-sm font-medium">Offer and negotiation</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={draft.offerActive}
              onChange={(e) => set('offerActive', e.target.checked)}
              className="size-4 accent-teal"
            />
            Offer applicable
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={draft.negotiable}
              onChange={(e) => set('negotiable', e.target.checked)}
              className="size-4 accent-teal"
            />
            Negotiation allowed
          </label>
          <Field id="d-from" label="Offer valid from">
            <input
              id="d-from"
              type="datetime-local"
              value={draft.offerFrom}
              disabled={!draft.offerActive}
              onChange={(e) => set('offerFrom', e.target.value)}
              className={`${FIELD} disabled:opacity-50`}
            />
          </Field>
          <Field id="d-to" label="Offer valid to" error={errors.offerTo}>
            <input
              id="d-to"
              type="datetime-local"
              value={draft.offerTo}
              disabled={!draft.offerActive}
              onChange={(e) => set('offerTo', e.target.value)}
              className={`${FIELD} disabled:opacity-50`}
              aria-invalid={Boolean(errors.offerTo)}
            />
          </Field>
        </div>
      </fieldset>

      {/* Files: products public, documents private. Paths only — never a URL. */}
      <fieldset className="mt-6 min-w-0 border-t border-border pt-4">
        <legend className="font-display text-base font-bold">Images and documents</legend>
        <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
          <FileUploader
            bucket="product-images"
            companyId={account.id}
            label="Product photos"
            multiple
            value={pickedImages}
            onChange={(next) => {
              setPickedImages(next)
              set('image1Path', next[0]?.path ?? null)
              set('image2Path', next[1]?.path ?? null)
            }}
          />
          <FileUploader
            bucket="retailer-documents"
            companyId={account.id}
            label="Proof of price (private)"
            multiple
            value={pickedDocuments}
            onChange={(next) => {
              setPickedDocuments(next)
              set('documentPaths', next.map((f) => f.path))
            }}
          />
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" className="h-11 bg-teal px-4 text-teal-foreground hover:bg-teal-deep">
          {existing ? 'Save changes' : 'Save to the product list'}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
          Cancel
        </Button>
        {saved && (
          <p role="status" className="self-center text-sm font-medium text-teal-text">
            Saved on this browser.
          </p>
        )}
      </div>
    </form>
  )
}

export function Field({
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
