import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORIES, PRODUCTS, sortedRetailers, omr, type Category, type Product } from '@/data/products'
import { marketProducts, useOffers } from '@/data/offers'
import { searchProducts } from '@/data/search'
import { ProductTile } from '@/components/ProductTile'
import { DeviceDrawing } from '@/components/DeviceDrawing'

/* The hero's comparison panel: one product, its three shops, cheapest first.
   It straddles the edge of the search block so the screen reads as a tool. */
function ComparisonPreview({ product }: { product: Product }) {
  const rows = sortedRetailers(product)
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 overflow-hidden rounded-[2rem] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--teal)_22%,transparent),transparent)]"
      />
      <div className="relative min-w-0 rounded-xl border border-border bg-card p-4 shadow-raised sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-deep">
            <DeviceDrawing device={product.device} className="size-9" decorative />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-foreground">{product.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.retailers.length} retailers, cheapest first
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.shop}
              className={
                i === 0
                  ? 'flex items-center justify-between gap-3 rounded-md border border-teal/40 bg-teal-soft px-3 py-2.5'
                  : 'flex items-center justify-between gap-3 rounded-md px-3 py-2.5'
              }
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{r.shop}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.sample ? 'Sample row' : r.area}
                </span>
              </span>
              <span
                className={
                  i === 0
                    ? 'shrink-0 font-mono text-sm font-semibold tabular-nums text-teal-text'
                    : 'shrink-0 font-mono text-sm tabular-nums text-foreground'
                }
              >
                {omr(r.price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Link
            to={`/product/${product.id}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-teal-text underline decoration-teal/50 underline-offset-4 hover:decoration-teal"
          >
            All {rows.length} quotes for the {product.name}
          </Link>
          <span className="rounded-full bg-background px-2 py-1 font-label text-[0.7rem] tracking-wide text-muted-foreground">
            Sample prices
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Home({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<Category>('All')
  const inputRef = useRef<HTMLInputElement>(null)

  const live = useOffers()
  const catalogue = marketProducts(PRODUCTS, live)

  /* The field answers from the shared search index — name, brand and barcode,
     tolerating one typo per word — and the category chip narrows it further.
     The full result set lives on /search, 24 to a page. */
  const results = searchProducts(query)
    .map((hit) => catalogue.find((p) => p.id === hit.product.id) ?? hit.product)
    .filter((p) => category === 'All' || p.category === category)

  const counts = CATEGORIES.map((c) => ({
    name: c,
    count: c === 'All' ? catalogue.length : catalogue.filter((p) => p.category === c).length,
  }))

  const preview = catalogue.find((p) => p.id === 'iphone-16-pro-256') ?? catalogue[0]

  function clear() {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <main key={initialQuery}>
      {/* First screen: the search and the comparison panel, on a layered
          ground — a teal glow with a fine ink dot texture over it, both built
          from tokens. The grid below sits on plain paper. */}
      <div className="relative isolate overflow-x-clip">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(65%_70%_at_16%_0%,color-mix(in_oklch,var(--teal-soft)_95%,var(--background))_0%,color-mix(in_oklch,var(--teal-soft)_45%,transparent)_44%,transparent_80%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60%] bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_9%,transparent)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,var(--foreground),transparent)]"
        />

        <section className="relative overflow-x-clip border-b border-border/70">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-24 hidden size-[32rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--teal)_18%,transparent),transparent)] md:block"
          />
          <div className="relative mx-auto grid min-w-0 max-w-content gap-10 px-gutter pt-10 pb-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-start md:gap-12 md:pt-16 md:pb-24">
            <div className="min-w-0">
              <h1 className="max-w-[16ch] text-[var(--hero-size)]">Who sells it cheapest in Oman?</h1>
              <p className="mt-4 max-w-[42ch] text-base text-muted-foreground sm:text-lg">
                Twelve electronics, each one exact model, compared across five Omani retailers — from
                Sharaf DG and eMax to LuluOman and GadgetsOman. Prices in OMR, cheapest first, every
                time.
              </p>

              <form role="search" className="mt-7" action="/search">
                <label htmlFor="hero-search" className="font-label text-sm font-medium text-foreground">
                  Search a product
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <input
                      id="hero-search"
                      name="q"
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="iPhone 16, MacBook, PS5"
                      enterKeyHint="search"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-12 w-full rounded-md border border-input bg-card pr-11 pl-10 text-base text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear the search"
                        className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="h-12 bg-teal px-6 text-base text-teal-foreground hover:bg-teal-deep"
                  >
                    Find the price
                  </Button>
                </div>
                <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
                  {query.trim() ? (
                    <>
                      {results.length} {results.length === 1 ? 'product' : 'products'} match “
                      {query.trim()}”.{' '}
                      <Link
                        to={`/search?q=${encodeURIComponent(query.trim())}`}
                        className="font-medium text-teal-text underline underline-offset-4 hover:no-underline"
                      >
                        Open the full results
                      </Link>
                    </>
                  ) : (
                    'Type a model, or misspell it — “ihpone” and “samsng” both find the right thing.'
                  )}
                </p>
              </form>
            </div>

            <div className="min-w-0 md:-mb-24 md:translate-y-4">
              <ComparisonPreview product={preview} />
            </div>
          </div>
        </section>

        {/* Category row — over the glow, scrolling sideways at 360 */}
        <section aria-labelledby="cat-heading" className="relative border-b border-border/70">
          <div className="mx-auto min-w-0 max-w-content px-gutter py-4">
            <h2 id="cat-heading" className="sr-only">
              Browse by category
            </h2>
            <ul className="flex min-w-0 snap-x gap-2 overflow-x-auto py-1 [scrollbar-width:thin]">
              {counts.map(({ name, count }) => {
                const active = category === name
                return (
                  <li key={name} className="shrink-0 snap-start">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(name)}
                      className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors ${
                        active
                          ? 'border-teal bg-teal text-teal-foreground'
                          : 'border-border bg-background text-foreground hover:border-teal hover:bg-teal-soft'
                      }`}
                    >
                      {name}
                      <span
                        className={`font-mono text-xs tabular-nums ${active ? 'text-teal-foreground' : 'text-muted-foreground'}`}
                      >
                        {count}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* Product grid: plain paper, no texture behind the figures */}
      <section id="products" aria-labelledby="grid-heading" className="scroll-mt-20 bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-section">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="grid-heading" className="text-[clamp(1.5rem,3vw,2rem)]">
              {category === 'All' ? 'Every sample product' : category}
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {results.length} of {catalogue.length} shown
            </p>
          </div>

          {results.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <h3 className="font-display text-xl font-bold">Nothing matches “{query.trim()}”</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                The sample covers twelve models. Try a shorter word, or clear the search to see
                everything.
              </p>
              <Button
                type="button"
                onClick={clear}
                className="mt-6 h-11 bg-teal text-teal-foreground hover:bg-teal-deep"
              >
                Clear the search
              </Button>
            </div>          ) : (
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <li key={p.id} className="min-w-0">
                  <ProductTile product={p} />
                </li>
              ))}
            </ul>
          )}

          <p className="mt-10 max-w-[62ch] border-t border-border pt-5 text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">These prices are samples.</strong> They are
            written to show how the comparison works, not read from the shops today. No live prices,
            accounts or saved lists exist yet.
          </p>
        </div>
      </section>
    </main>
  )
}
