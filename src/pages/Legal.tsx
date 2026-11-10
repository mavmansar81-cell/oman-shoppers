import { Link } from 'react-router'
import { Meta } from '@/components/Meta'

/* The three pages a price comparison owes its visitors: what the site does and
   does not promise about a figure, what it keeps, and the terms of using it. They
   share a shape — a short lead, then numbered clauses — because a legal page is
   read by scanning, not by reading. Plain Omani English, no lawyer theatre. */

type Clause = { heading: string; body: React.ReactNode }

function LegalPage({
  title,
  metaTitle,
  metaDescription,
  lead,
  updated,
  clauses,
}: {
  title: string
  metaTitle: string
  metaDescription: string
  lead: string
  updated: string
  clauses: Clause[]
}) {
  return (
    <>
      <Meta title={metaTitle} description={metaDescription} />
      <main className="mx-auto max-w-content px-gutter py-section">
        <div className="grid min-w-0 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
          <div className="min-w-0">
            <h1 className="max-w-[18ch] text-[clamp(1.9rem,4vw,2.8rem)]">{title}</h1>
            <p className="mt-3 max-w-[38ch] text-sm text-muted-foreground">{lead}</p>
            <p className="mt-4 font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
              {updated}
            </p>
            <nav aria-label="Other legal pages" className="mt-6 border-t border-border pt-4">
              <ul className="space-y-1 text-sm">
                <li>
                  <Link className="inline-flex min-h-11 items-center text-teal-text underline underline-offset-4" to="/terms">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link className="inline-flex min-h-11 items-center text-teal-text underline underline-offset-4" to="/privacy">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="inline-flex min-h-11 items-center text-teal-text underline underline-offset-4" to="/price-disclaimer">
                    Price Disclaimer
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="min-w-0">
            <ol className="space-y-8">
              {clauses.map((clause, i) => (
                <li key={clause.heading} className="border-t border-border pt-5 first:border-0 first:pt-0">
                  <h2 className="flex items-baseline gap-3 text-[clamp(1.05rem,2vw,1.25rem)]">
                    <span aria-hidden="true" className="font-mono text-sm tabular-nums text-teal-text">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {clause.heading}
                  </h2>
                  <div className="mt-2 max-w-[62ch] space-y-3 text-sm leading-relaxed text-foreground/90">
                    {clause.body}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
    </>
  )
}

const UPDATED = 'Last updated 1 March 2026'

export function PriceDisclaimerPage() {
  return (
    <LegalPage
      title="Prices come from the shops, not from us"
      metaTitle="Price Disclaimer — Oman Shoppers"
      metaDescription="Every price on Oman Shoppers is supplied by the retailer that listed it, may change without notice, and is not an offer to sell. Oman Shoppers does not sell any product."
      lead="What a figure on this site means, and what it does not."
      updated={UPDATED}
      clauses={[
        {
          heading: 'We do not sell products',
          body: (
            <>
              <p>
                Oman Shoppers is a price comparison. It does not stock, sell, deliver or
                take payment for anything on it. When you decide to buy, you buy from the
                shop, under the shop's prices, terms, delivery and returns.
              </p>
            </>
          ),
        },
        {
          heading: 'Prices are supplied by retailers',
          body: (
            <>
              <p>
                Every figure is published by the retailer that listed it, through a price
                list or a dashboard update. We do not set the price, agree it, or see it
                change in the shop.
              </p>
              <p>
                A shop can change a price at any time and without notice — in a
                promotion, at the till, or when stock runs out. The price you are charged
                is the one the shop shows you at the moment you buy.
              </p>
            </>
          ),
        },
        {
          heading: 'How fresh a figure is',
          body: (
            <>
              <p>
                Each price carries the time the shop last updated it. When that time is
                older than 48 hours, the figure is marked <em>may be outdated</em> and is
                not shown as the shop's current price. When there is no time at all, the
                row says the update time is unknown.
              </p>
            </>
          ),
        },
        {
          heading: 'Sample prices in this version',
          body: (
            <>
              <p>
                Rows marked <strong>Sample row</strong> were added to show the layout. They
                are not those shops' real prices and must not be used to decide what to
                pay. Rows for the shops we compare are identified as samples wherever they
                appear.
              </p>
            </>
          ),
        },
        {
          heading: 'If a figure is wrong',
          body: (
            <>
              <p>
                Use <em>Report incorrect price</em> on any row of a product page. Tell us
                what you saw in the shop and when; a wrong price stays on the page only
                until it is replaced or reported.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="What this site keeps about you"
      metaTitle="Privacy Policy — Oman Shoppers"
      metaDescription="What Oman Shoppers stores when you compare prices, create access or send a price report, where it is stored, and how to have it removed."
      lead="A short account of what is stored, and where."
      updated={UPDATED}
      clauses={[
        {
          heading: 'What a visitor leaves behind',
          body: (
            <>
              <p>
                Comparing prices needs no account. Searching, filtering and opening a
                product do not ask you for anything, and no name, email or phone number is
                recorded until you type one into a form.
              </p>
            </>
          ),
        },
        {
          heading: 'What an account holds',
          body: (
            <>
              <p>
                If you create access, the site keeps the name, email address and, if you
                give it, the phone number you entered, together with your role. A retailer
                account also keeps the shop it belongs to. A password is never stored as
                you typed it — it is stretched with SHA-256 in the browser before it is
                saved.
              </p>
            </>
          ),
        },
        {
          heading: 'Where it is stored in this version',
          body: (
            <>
              <p>
                This build has no server. Accounts, sessions, price reports and retailer
                offers are kept in this browser's own storage, on this device, and are not
                sent anywhere. Clearing site data removes them, and a different browser
                starts empty.
              </p>
            </>
          ),
        },
        {
          heading: 'Price reports and quote requests',
          body: (
            <>
              <p>
                A report or a quote request records the product, the shop, the reason you
                gave and, if you entered one, your email address, so the shops team can
                follow it up. It is stored beside the leads it belongs to and is not shown
                to other visitors.
              </p>
            </>
          ),
        },
        {
          heading: 'Removing your data',
          body: (
            <>
              <p>
                A signed-in account can be removed from its own account page, which
                deletes it from this browser. Once live accounts exist, the contact
                address in the footer is where a removal request goes.
              </p>
            </>
          ),
        },
        {
          heading: 'Cookies and tracking',
          body: (
            <>
              <p>
                No analytics, no advertising and no third-party tracking are loaded. The
                only storage used is the browser storage that keeps your session and your
                own rows in place.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}

export function TermsPage() {
  return (
    <LegalPage
      title="The terms of using Oman Shoppers"
      metaTitle="Terms of Use — Oman Shoppers"
      metaDescription="The terms for using Oman Shoppers to compare electronics prices in Oman, for retailers publishing a price list, and for the data on the site."
      lead="What you may do here, and what we ask of a retailer who publishes."
      updated={UPDATED}
      clauses={[
        {
          heading: 'Using the comparison',
          body: (
            <>
              <p>
                You may use Oman Shoppers to compare prices for yourself and to decide
                where to buy. Automated copying of the price tables, resale of the data, or
                presenting it as your own is not permitted without written agreement.
              </p>
            </>
          ),
        },
        {
          heading: 'A retailer publishing prices',
          body: (
            <>
              <p>
                A retailer account publishes only the rows belonging to its own company. By
                publishing, the shop confirms the figures are its own current prices, that
                it is entitled to publish them, and that it will update or withdraw them
                when they change or the stock ends.
              </p>
            </>
          ),
        },
        {
          heading: 'Matching a row to a product',
          body: (
            <>
              <p>
                A retailer row is linked to one exact model. A row the site cannot link with
                confidence waits in a review queue rather than being shown against the
                wrong product. A retailer can dispute a link from its own dashboard.
              </p>
            </>
          ),
        },
        {
          heading: 'Availability of the site',
          body: (
            <>
              <p>
                The site is under development. Features may change or be withdrawn, and the
                comparison may be unavailable while it is being worked on. It is provided
                as it stands, without a guarantee of uninterrupted access.
              </p>
            </>
          ),
        },
        {
          heading: 'Reporting a problem',
          body: (
            <>
              <p>
                Report a wrong price from the product page. For anything else — a shop's
                rights, a data request, or a dispute about a listing — use the contact
                address in the footer.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
