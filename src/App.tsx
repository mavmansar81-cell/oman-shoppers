import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useSearchParams } from 'react-router'
import Home from '@/pages/Home'
import { Meta } from '@/components/Meta'
import { TopBar } from '@/components/TopBar'
import { DevNotice } from '@/components/DevNotice'
import { Footer } from '@/components/Footer'
import { seedDemoAccounts } from '@/data/accounts'
import { refreshAccounts } from '@/lib/session'

// Routes are code-split so the first paint carries only the landing page.
const Product = lazy(() => import('@/pages/Product'))
const Search = lazy(() => import('@/pages/Search'))
const Access = lazy(() => import('@/pages/Access'))
const Account = lazy(() => import('@/pages/Account'))
const MatchQueue = lazy(() => import('@/pages/MatchQueue'))
const Retailer = lazy(() => import('@/pages/Retailer'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Terms = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.TermsPage })))
const Privacy = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.PrivacyPage })))
const Disclaimer = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.PriceDisclaimerPage })))

/* The shell: one top bar and a footer on every route. The bar carries the mark,
   the search and the account; everything else a signed-in visitor needs is on
   its own page under /account. */

function HomeRoute() {
  const [params] = useSearchParams()
  return <Home key={params.get('q') ?? ''} initialQuery={params.get('q') ?? ''} />
}

export default function App() {
  /* The two sample logins are written on the first visit, so the retailer and
     admin pages can be opened without anyone creating an account to see them. */
  useEffect(() => {
    let alive = true
    seedDemoAccounts()
      .then(() => {
        if (alive) refreshAccounts()
      })
      .catch(() => {
        /* storage unavailable: the site works signed out */
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <DevNotice />
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-content px-gutter py-24 text-sm text-muted-foreground">
              Loading prices…
            </div>
          }
        >
          <Routes>
            <Route
              index
              element={
                <>
                  <Meta
                    title="Oman Shoppers — compare electronics prices in Oman"
                    description="Exact models, every Omani retailer that listed them, ranked by price in OMR with offers and negotiation terms. Cheapest first."
                  />
                  <HomeRoute />
                </>
              }
            />
            <Route
              path="product/:id"
              element={
                <>
                  <Meta
                    title="Product prices in Oman — Oman Shoppers"
                    description="Every Omani retailer that stocks this exact model, ranked by price in OMR, cheapest first."
                  />
                  <Product />
                </>
              }
            />
            <Route
              path="search"
              element={
                <>
                  <Meta
                    title="Search every product by model, brand or barcode — Oman Shoppers"
                    description="Type a model, a brand or a barcode and every Omani retailer that listed it appears, priced in OMR and ranked cheapest first, 24 products to a page."
                  />
                  <Search />
                </>
              }
            />
            <Route
              path="access"
              element={
                <>
                  <Meta
                    title="Create access as a customer, retailer or admin — Oman Shoppers"
                    description="One form for the three levels of access: shop for prices as a customer, publish a price book as a retailer, or run the site as an admin."
                  />
                  <Access />
                </>
              }
            />
            <Route
              path="account/:role"
              element={
                <>
                  <Meta
                    title="Your Oman Shoppers account"
                    description="Your price book, your items, your offers and the requests shoppers sent you."
                  />
                  <Account />
                </>
              }
            />
            <Route
              path="retailer"
              element={
                <>
                  <Meta
                    title="Retailer dashboard — your product rows · Oman Shoppers"
                    description="Your company's own product rows: list them with their match status, add or edit one, upload a price list of up to 1,000 rows, and read what each upload wrote."
                  />
                  <Retailer />
                </>
              }
            />
            <Route
              path="admin/match-queue"
              element={
                <>
                  <Meta
                    title="Product match queue — Oman Shoppers admin"
                    description="Review retailer rows that could not be linked to a master product with certainty: approve the candidate, or reject it, with the reason and score recorded."
                  />
                  <MatchQueue />
                </>
              }
            />
            <Route
              path="terms"
              element={
                <>
                  <Meta
                    title="Terms of Use — Oman Shoppers"
                    description="The terms for using Oman Shoppers to compare electronics prices in Oman, for retailers publishing a price list, and for the data on the site."
                  />
                  <Terms />
                </>
              }
            />
            <Route
              path="privacy"
              element={
                <>
                  <Meta
                    title="Privacy Policy — Oman Shoppers"
                    description="What Oman Shoppers stores when you compare prices, create access or send a price report, where it is stored, and how to have it removed."
                  />
                  <Privacy />
                </>
              }
            />
            <Route
              path="price-disclaimer"
              element={
                <>
                  <Meta
                    title="Price Disclaimer — Oman Shoppers"
                    description="Every price on Oman Shoppers is supplied by the retailer that listed it, may change without notice, and is not an offer to sell. Oman Shoppers does not sell any product."
                  />
                  <Disclaimer />
                </>
              }
            />
            <Route
              path="*"
              element={
                <>
                  <Meta
                    title="Page not found — Oman Shoppers"
                    description="That address does not point at a product. Search again to compare electronics prices in Oman."
                  />
                  <NotFound />
                </>
              }
            />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
