import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, Search as SearchIcon, X } from 'lucide-react'
import { Meta } from '@/components/Meta'
import { Button } from '@/components/ui/button'
import { ProductTile } from '@/components/ProductTile'
import { CATEGORIES, PRODUCTS, type Category } from '@/data/products'
import { marketProducts, useOffers } from '@/data/offers'
import { SEARCH_PAGE_SIZE, pageOf, searchProducts, setSuggestionQuery, useSuggestions } from '@/data/search'

/* Search results. The query lives in the URL, so a result page can be shared,
   reloaded and stepped through a page at a time; the page number is clamped
   into range rather than trusted, and only the current 24 products are ever
   built into the page. */

export default function Search() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const offers = useOffers()
  const catalogue = useMemo(() => marketProducts(PRODUCTS, offers), [offers])
  const query = params.get('q') ?? ''
  const asked = Number(params.get('page') ?? '1')

  /* Results are scored against the master list, then each product is drawn
     with the rows its shops have actually had approved. */
  const scored = useMemo(() => searchProducts(query), [query])
  const category = (params.get('category') as Category | null) ?? 'All'
  const live = scored
    .map((hit) => {
      const approved = catalogue.find((p) => p.id === hit.product.id)
      return approved ?? hit.product
    })
    .filter((p) => category === 'All' || p.category === category)
  const result = pageOf(live, asked)

  /* A page number past the end is corrected in the address bar, so the pager
     and the URL never disagree. */
  useEffect(() => {
    if (asked !== result.page) {      const next = new URLSearchParams(params)
      if (result.page === 1) next.delete('page')
      else next.set('page', String(result.page))
      setParams(next, { replace: true })
    }
  }, [asked, result.page, params, setParams])
  const suggestions = useSuggestions()
  const [draft, setDraft] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(query)
  }, [query])

  useEffect(() => {
    setSuggestionQuery(draft)
  }, [draft])

  function submit(value: string, category: Category = 'All') {
    const next = new URLSearchParams()
    if (value.trim()) next.set('q', value.trim())
    if (category !== 'All') next.set('category', category)
    navigate(next.toString() ? `/search?${next}` : '/search')
  }

  const title = query.trim()
    ? `“${query.trim()}” — prices in Oman · Oman Shoppers`
    : 'Search every product — Oman Shoppers'

  return (
    <main>
      <Meta
        title={title}
        description={
          query.trim()
            ? `${result.total} ${result.total === 1 ? 'product matches' : 'products match'} “${query.trim()}” across Omani retailers, priced in OMR and ranked cheapest first.`
            : 'Search electronics by model, brand or barcode and compare every Omani retailer that listed it, cheapest first.'
        }
      />

      <section className="border-b border-border/70">
        <div className="mx-auto min-w-0 max-w-content px-gutter pt-8 pb-6 md:pt-12">
          <h1 className="text-[clamp(1.9rem,4.4vw,3rem)]">
            {query.trim() ? `Results for “${query.trim()}”` : 'Search the catalogue'}
          </h1>
          <p className="mt-2 max-w-[52ch] text-sm text-muted-foreground sm:text-base">
            One exact model per product, every shop that listed it. Type a model, a brand or a
            barcode, and a misspelling still finds it.
          </p>

          <form
            role="search"
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit(draft)
            }}
          >
            <label htmlFor="results-search" className="font-label text-sm font-medium text-foreground">
              Search a product
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <input
                  id="results-search"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => setSuggestionQuery('')}
                  placeholder="iPhone 16, MacBook, PS5"
                  enterKeyHint="search"
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="results-count"
                  className="h-12 w-full rounded-md border border-input bg-card pr-11 pl-10 text-base text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                />
                {draft && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft('')
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear the search"
                    className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
                {suggestions.length > 0 && draft.trim() !== query.trim() && (
                  <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-raised">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/product/${p.id}`}
                          className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-sm text-popover-foreground hover:bg-secondary"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{p.brand}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button type="submit" className="h-12 bg-teal px-6 text-base text-teal-foreground hover:bg-teal-deep">
                Find the price
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section aria-labelledby="results" className="bg-background">
        <div className="mx-auto min-w-0 max-w-content px-gutter py-8 md:py-10">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="results" className="text-[clamp(1.4rem,3vw,1.9rem)]">
              {result.total === 0
                ? 'Nothing matched'
                : `${result.total} ${result.total === 1 ? 'product' : 'products'}`}
            </h2>
            <p id="results-count" aria-live="polite" className="text-sm text-muted-foreground">
              {result.total > 0
                ? `Showing ${result.from}–${result.to}, ${SEARCH_PAGE_SIZE} to a page`
                : query.trim()
                  ? `No product in the sample answers “${query.trim()}”`
                  : 'Type something to search'}
            </p>
          </div>

          {result.total === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                The sample holds a dozen models. Try a shorter word — “iphone” rather than the full
                model number — or pick a category below.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <Link
                    key={c}
                    to={`/search?category=${encodeURIComponent(c)}`}
                    className="inline-flex min-h-11 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:border-teal hover:bg-teal-soft"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((p) => (
                <li key={p.id} className="min-w-0">
                  <ProductTile product={p} />
                </li>
              ))}
            </ul>
          )}

          {result.pages > 1 && (
            <nav
              aria-label="Search result pages"
              className="mt-8 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
            >
              <p className="text-sm text-muted-foreground">
                Page {result.page} of {result.pages}
              </p>
              <div className="flex items-center gap-2">
                <PageLink page={result.page - 1} disabled={result.page <= 1} query={query}>
                  <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  Previous
                </PageLink>
                <PageLink
                  page={result.page + 1}
                  disabled={result.page >= result.pages}
                  query={query}
                >
                  Next
                  <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </PageLink>
              </div>
            </nav>
          )}

          <p className="mt-10 max-w-[62ch] border-t border-border pt-5 text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Prices shown as listed by the retailer.</strong>{' '}
            Every figure is a sample written to show how the comparison works; it is not read from the
            shops today and may differ from what a shop charges.
          </p>
        </div>
      </section>
    </main>
  )
}

function PageLink({
  page,
  disabled,
  query,
  children,
}: {
  page: number
  disabled: boolean
  query: string
  children: ReactNode
}) {
  const base =
    'inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-card px-4 text-sm font-medium'
  if (disabled) {
    return (
      <span className={`${base} cursor-not-allowed text-muted-foreground opacity-60`} aria-disabled="true">
        {children}
      </span>
    )
  }
  const next = new URLSearchParams()
  if (query.trim()) next.set('q', query.trim())
  if (page > 1) next.set('page', String(page))
  return (
    <Link to={`/search${next.toString() ? `?${next}` : ''}`} className={`${base} text-foreground hover:border-teal`}>
      {children}
    </Link>
  )
}
