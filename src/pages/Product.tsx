import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ChevronLeft, ArrowUpRight, Handshake, Tag, Mail } from 'lucide-react'
import { DeviceDrawing } from '@/components/DeviceDrawing'
import { Meta } from '@/components/Meta'
import { Button } from '@/components/ui/button'
import { PRODUCTS, omr, sortedRetailers, findProduct } from '@/data/products'
import { addLead, countView, marketProducts, useOffers } from '@/data/offers'
import { isOfferLive } from '@/data/offersCsv'
import { priceFreshness } from '@/lib/freshness'
import { FreshnessNote, PriceFig, ReportPriceLink } from '@/components/PriceFreshness'
import { EMAIL, ROLE_LABEL, normalisePhone, OMAN_PHONE } from '@/data/accounts'
import { useCurrentAccount } from '@/lib/session'
import NotFound from '@/pages/NotFound'

/* One exact model, every shop that listed it, cheapest first. The floor and
   ceiling a shop sets never appear here — only what it is asking today. */

export default function Product() {
  const { id } = useParams()
  const account = useCurrentAccount()
  const offers = useOffers()
  const catalogue = marketProducts(PRODUCTS, offers)
  const product = catalogue.find((p) => p.id === id) ?? findProduct(id)

  useEffect(() => {
    if (id && account) countView(id)
  }, [id, account])

  /* A visitor who is not signed in is sent to choose individual or retailer,
     with the model they opened carried along so signing in brings them back. */
  if (!account) {
    return <Navigate to={`/access?next=${encodeURIComponent(`/product/${id ?? ''}`)}`} replace />
  }

  if (!product) return <NotFound />

  const rows = sortedRetailers(product)
  const cheapest = rows[0]
  const dearest = rows[rows.length - 1]
  const saving = dearest.price - cheapest.price

  /* The offers behind these prices, so a shopper sees when a deal runs out and
     which shops will talk about the figure. */
  const shopOffers = offers.filter((o) => o.marketSlug === product.id)

  return (
    <main>
      <Meta
        title={`${product.name} price in Oman — Oman Shoppers`}
        description={`Which Omani shop sells the ${product.name} for least. ${rows.length} retailers ranked by price in OMR, cheapest at ${cheapest.shop}. Sample prices.`}
      />

      {/* The teal band owns this page's header */}
      <section className="bg-teal-band text-teal-foreground">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-6 pb-10 md:pt-8 md:pb-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-teal-foreground hover:underline hover:underline-offset-4"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Back to all products
            </Link>
            <Link
              to={`/account/${account.role}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-teal-foreground/85 hover:underline hover:underline-offset-4"
            >
              Your {ROLE_LABEL[account.role].toLowerCase()} page
            </Link>
          </div>

          <div className="mt-4 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0">
              <p className="font-label text-xs font-medium tracking-[0.08em] text-teal-foreground uppercase">
                {product.brand} · {product.category}
              </p>
              <h1 className="mt-2 max-w-[20ch] text-[clamp(1.9rem,5vw,3rem)]">{product.name}</h1>
              <p className="mt-3 max-w-[46ch] text-sm text-teal-foreground">
                Compared across {rows.length} retailers, every price for this exact model, so the
                list starts with the shop to buy from. Sample prices.
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-5">
              <div className="relative order-2 grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-teal-foreground/15 sm:size-32">
                <DeviceDrawing
                  device={product.device}
                  className="size-20 text-teal-foreground sm:size-24"
                  label={`Line drawing of the ${product.name}`}
                />
              </div>
              <div className="order-1 min-w-0 md:text-right">
                <p className="font-label text-xs tracking-[0.08em] text-teal-foreground uppercase">
                  Lowest price
                </p>
                <p className="mt-1 font-mono text-[clamp(1.6rem,4.5vw,2.4rem)] font-semibold tabular-nums text-teal-on-band">
                  {priceFreshness(cheapest.priceUpdatedAt).isCurrent ? omr(cheapest.price) : 'Not current'}
                </p>
                <p className="text-sm text-teal-foreground">
                  {priceFreshness(cheapest.priceUpdatedAt).isCurrent
                    ? `at ${cheapest.shop}`
                    : `${cheapest.shop}'s figure is not shown — ${priceFreshness(cheapest.priceUpdatedAt).label.toLowerCase()}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Retailer table: sorted lowest to highest */}
      <section aria-labelledby="retailers" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="retailers" className="text-[clamp(1.4rem,3vw,1.9rem)]">
              {rows.length} {rows.length === 1 ? 'retailer' : 'retailers'}, cheapest first
            </h2>
            <p className="text-sm text-muted-foreground">
              {saving > 0 ? `${omr(saving)} separates the first and last shop` : 'One price only'}
            </p>
          </div>

          <div className="mt-6 hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Retailer prices for the {product.name}, sorted lowest to highest
              </caption>
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th scope="col" className="px-5 py-3 font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Retailer
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Price
                  </th>
                  <th scope="col" className="px-5 py-3 font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Stock note
                  </th>
                  <th scope="col" className="px-5 py-3 font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Terms
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Deal
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const offer = shopOffers.find((o) => o.shop === r.shop)
                  return (
                    <tr key={r.shop} className={i === 0 ? 'bg-saffron-soft' : 'border-t border-border'}>
                      <th scope="row" className="px-5 py-4 text-left font-medium text-foreground">
                        <span className="block">{r.shop}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{r.area}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {i === 0 && (
                            <span className="inline-block rounded-full bg-saffron px-2 py-0.5 font-label text-[0.7rem] font-medium tracking-wide text-saffron-ink">
                              Cheapest
                            </span>
                          )}
                          <span className="inline-block rounded-full border border-border bg-card px-2 py-0.5 font-label text-[0.7rem] font-medium tracking-wide text-muted-foreground">
                            Sample row
                          </span>
                        </span>
                      </th>
                      <td
                        className={`px-5 py-4 text-right font-mono tabular-nums ${
                          i === 0 ? 'text-base font-semibold text-saffron-text' : 'text-foreground'
                        }`}
                      >
                        <PriceFig price={r.price} updatedAt={r.priceUpdatedAt} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <FreshnessNote updatedAt={r.priceUpdatedAt} sample={r.sample} />
                        {!r.sample && (
                          <ReportPriceLink
                            productId={product.id}
                            productName={product.name}
                            shop={r.shop}
                            retailerId={r.retailerId}
                            retailerProductId={r.retailerProductId}
                            email={account.email}
                            label={r.shop}
                          />
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <TermChips offer={offer} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${r.shop} Oman ${product.name}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-medium text-teal-text underline decoration-teal/50 underline-offset-4 hover:decoration-teal"
                        >
                          View Deal
                          <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                          <span className="sr-only">
                            for the {product.name} at {r.shop}
                          </span>
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((r, i) => {
              const offer = shopOffers.find((o) => o.shop === r.shop)
              return (
                <li
                  key={r.shop}
                  className={`rounded-xl border p-4 ${
                    i === 0 ? 'border-saffron bg-saffron-soft' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold text-foreground">{r.shop}</p>
                      <p className="text-xs text-muted-foreground">{r.area}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {i === 0 && (
                        <span className="rounded-full bg-saffron px-2 py-0.5 font-label text-[0.7rem] font-medium tracking-wide text-saffron-ink">
                          Cheapest
                        </span>
                      )}
                      <span className="rounded-full border border-border bg-card px-2 py-0.5 font-label text-[0.7rem] font-medium tracking-wide text-muted-foreground">
                        Sample row
                      </span>
                    </div>
                  </div>
                  <p
                    className={`mt-3 font-mono text-xl font-semibold tabular-nums ${
                      i === 0 ? 'text-saffron-text' : 'text-foreground'
                    }`}
                  >
                    <PriceFig price={r.price} updatedAt={r.priceUpdatedAt} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <FreshnessNote updatedAt={r.priceUpdatedAt} sample={r.sample} />
                  </p>
                  {!r.sample && (
                    <ReportPriceLink
                      productId={product.id}
                      productName={product.name}
                      shop={r.shop}
                      retailerId={r.retailerId}
                      retailerProductId={r.retailerProductId}
                      email={account.email}
                      label={`${r.shop} in the card`}
                    />
                  )}
                  <div className="mt-2">
                    <TermChips offer={offer} />
                  </div>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${r.shop} Oman ${product.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md bg-teal px-4 text-sm font-medium text-teal-foreground hover:bg-teal-deep"
                  >
                    View Deal
                    <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    <span className="sr-only">
                      at {r.shop} for the {product.name}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* The lead: what a shopper sends, and what the shop agreed to receive */}
      <section aria-labelledby="lead" className="border-t border-border bg-secondary">
        <div className="mx-auto grid min-w-0 max-w-content gap-8 px-gutter py-section md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-14">
          <div className="min-w-0">
            <h2 id="lead" className="max-w-[22ch] text-[clamp(1.5rem,3vw,2.1rem)]">
              Ask the shops for a real quote
            </h2>
            <p className="mt-3 max-w-[44ch] text-muted-foreground">
              The figures above are samples. This form shows what happens when a shopper asks for
              one: the request is recorded with the shops that listed the model, and the shop's
              buying desk sees it. Nothing is sent from this browser.
            </p>
            <p className="mt-4 max-w-[44ch] text-sm text-muted-foreground">
              Your name, email and phone go only to the shops you list it with, and only if you say
              yes below. Leaving the box unticked sends nothing.
            </p>
          </div>
          <LeadForm
            productId={product.id}
            productName={product.name}
            shops={rows.map((r) => r.shop)}
            offers={shopOffers}
            cheapest={cheapest.shop}
            negotiable={rows
              .filter((r) => shopOffers.find((o) => o.shop === r.shop)?.negotiable ?? true)
              .slice(0, 3)}
            accountName={account.name}
            accountEmail={account.email}
            accountPhone={account.phone}
          />
        </div>
      </section>

      <div className="mx-auto min-w-0 max-w-content px-gutter pb-section">
        <div className="max-w-[64ch] border-t border-border pt-5 text-sm text-muted-foreground">
          <h2 className="font-display text-base font-bold text-foreground">How these prices were set</h2>
          <p className="mt-2">
            Every row is a sample. No figure here is read from a shop's live system, and the
            retailer's own price floor and ceiling are never shown to a shopper. Where an offer is
            listed, its window is the one that shop entered. A deal link opens a search rather than
            the shop's own page.
          </p>
        </div>
      </div>
    </main>
  )
}

function TermChips({ offer }: { offer?: import('@/data/offers').Offer }) {
  if (!offer) return <span className="text-xs text-muted-foreground">Not stated</span>
  const live = isOfferLive(offer)
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {live && (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 font-label text-[0.7rem] font-medium text-teal-deep">
          <Tag className="size-3" strokeWidth={1.5} aria-hidden="true" />
          Offer on
        </span>
      )}
      {offer.negotiable && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-label text-[0.7rem] font-medium text-foreground">
          <Handshake className="size-3" strokeWidth={1.5} aria-hidden="true" />
          Will negotiate
        </span>
      )}
      {!live && !offer.negotiable && <span className="text-xs text-muted-foreground">Fixed price</span>}
    </span>
  )
}

/* Two things a shopper does from a product: ask one shop to match or beat the
   cheapest figure (a negotiation), or ask the sales desk a question before
   buying. Both write a lead to this browser only — nothing is sent anywhere. */
function LeadForm({
  productId,
  productName,
  shops,
  offers,
  cheapest,
  negotiable,
  accountName,
  accountEmail,
  accountPhone,
}: {
  productId: string
  productName: string
  shops: string[]
  offers: import('@/data/offers').Offer[]
  cheapest: string
  negotiable: { shop: string; price: number }[]
  accountName: string
  accountEmail: string
  accountPhone: string
}) {
  const [kind, setKind] = useState<'contact' | 'negotiate'>('contact')
  const [target, setTarget] = useState(cheapest)
  const [ask, setAsk] = useState('')
  const [name, setName] = useState(accountName)
  const [email, setEmail] = useState(accountEmail)
  const [phone, setPhone] = useState(accountPhone)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (!EMAIL.test(email.trim())) next.email = 'Enter an email address the shop can reply to.'
    if (!OMAN_PHONE.test(phone.trim())) next.phone = 'An Omani number, like 9123 4567.'
    if (!consent) next.consent = 'Tick the box to send it. Without it, nothing is sent.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const routed = kind === 'negotiate' ? target : offers.map((o) => o.shop).join(', ') || shops.join(', ')
    const shopsToWrite =
      kind === 'negotiate'
        ? offers.filter((o) => o.shop === target)
        : offers.length > 0
          ? offers
          : [{ shop: shops[0] ?? '', retailerId: '' }]
    const message =
      kind === 'negotiate'
        ? `Would you match ${ask || 'a lower figure'} for the ${productName}? The cheapest listed is ${cheapest}.`
        : 'Asked the sales desk a question before buying.'
    for (const offer of shopsToWrite.length > 0 ? shopsToWrite : [{ shop: routed, retailerId: '' }]) {
      addLead({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        retailerId: offer.retailerId,
        productId,
        productName,
        shop: offer.shop,
        name: name.trim(),
        email: email.trim(),
        phone: normalisePhone(phone),
        message,
        consent: true,
        createdAt: new Date().toISOString(),
      })
    }
    setSent(
      kind === 'negotiate'
        ? `A negotiation request is recorded for ${routed}.`
        : `A question is recorded for ${routed}.`,
    )
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-teal/40 bg-card p-5">
        <h3 className="font-display text-lg font-bold">Request recorded</h3>
        <p className="mt-2 text-sm text-foreground">{sent}</p>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <Mail className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          The shop will not receive it: this build has no server, so the request stays in this
          browser. Live leads need the retailer's own system connected.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11"
          onClick={() => {
            setSent(null)
            setName('')
            setEmail('')
            setPhone('')
            setConsent(false)
          }}
        >
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} className="rounded-xl border border-border bg-card p-5">
      <fieldset className="min-w-0">
        <legend className="font-label text-sm font-medium">What do you want to ask?</legend>
        <div className="mt-2 flex gap-1 rounded-lg bg-secondary p-1">
          {([
            { id: 'contact', label: 'Contact sales team' },
            { id: 'negotiate', label: 'Negotiate' },
          ] as const).map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
              className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium ${
                kind === k.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      {kind === 'negotiate' && (
        <div className="mt-4 rounded-lg bg-teal-soft p-3">
          <label htmlFor="lead-target" className="font-label text-sm font-medium text-teal-deep">
            Ask which shop
          </label>
          <select
            id="lead-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field mt-1 h-11"
          >
            {negotiable.map((r) => (
              <option key={r.shop} value={r.shop}>
                {r.shop} — will negotiate, listing {omr(r.price)}
              </option>
            ))}
          </select>
          <label htmlFor="lead-ask" className="mt-3 block font-label text-sm font-medium text-teal-deep">
            Your figure, if you have one
          </label>
          <input
            id="lead-ask"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            inputMode="decimal"
            className="field mt-1 h-11"
            placeholder={`${omr(negotiable[0]?.price ?? 0)} or less`}
          />
          <p className="mt-2 text-xs text-teal-deep">
            Shops that said they will talk: {negotiable.map((r) => r.shop).join(', ') || 'none on this model yet'}.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="lead-name" label="Your name" error={errors.name}>
          <input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="field h-11"
            placeholder="Amina Al Balushi"
          />
        </Field>
        <Field id="lead-phone" label="Phone" error={errors.phone}>
          <input
            id="lead-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            className="field h-11"
            placeholder="9123 4567"
          />
        </Field>
      </div>
      <div className="mt-4">
        <Field id="lead-email" label="Email" error={errors.email}>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="field h-11"
            placeholder="name@example.com"
          />
        </Field>
      </div>

      <div className="mt-5 rounded-lg bg-secondary p-3">
        <label htmlFor="lead-consent" className="flex min-h-11 items-start gap-3 text-sm">
          <input
            id="lead-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-teal"
            aria-describedby="lead-consent-note"
          />
          <span className="text-foreground">
            I agree to send my name, email and phone to the shops that list this model, so they can
            reply with a quote.
          </span>
        </label>
        <p id="lead-consent-note" className="pl-8 text-xs text-muted-foreground">
          Optional — nothing leaves this browser either way.
        </p>
        {errors.consent && (
          <p className="mt-1 pl-8 text-xs font-medium text-destructive">{errors.consent}</p>
        )}
      </div>

      <Button type="submit" className="mt-5 h-11 bg-teal px-5 text-teal-foreground hover:bg-teal-deep">
        {kind === 'negotiate' ? `Send the request to ${target}` : 'Contact the sales team'}
      </Button>
    </form>
  )
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
  optional,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 font-label text-sm font-medium text-foreground">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
