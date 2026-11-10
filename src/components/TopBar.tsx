import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { LogIn, LogOut, Search } from 'lucide-react'
import { BrandLink } from '@/components/Brand'
import { ROLE_LABEL } from '@/data/accounts'
import { signOut, useCurrentAccount } from '@/lib/session'

/* The top bar: the mark, the search field, and the account. A visitor who is
   signed in sees where their page is and one control to leave; a visitor who is
   not sees one way in for all three access levels. At 360 the field folds away
   and the account label hides, leaving the mark, one search button and one
   account control. */
export function TopBar() {
  const account = useCurrentAccount()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()

  /* The field is uncontrolled so the bar never re-renders on a keystroke; on
     /search it starts with what was asked for. Submitting it goes to the
     results page, which owns the query, the page number and the paging. */
  const asked = pathname === '/search' ? (params.get('q') ?? '') : ''

  return (
    <header className="sticky top-0 z-40 border-b border-primary/40 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 min-w-0 max-w-content items-center gap-2 px-gutter sm:gap-3">
        <BrandLink onDark />

        <form key={asked} role="search" action="/search" className="ml-auto hidden w-[20rem] lg:block">
          <label htmlFor="top-search" className="sr-only">
            Search a product
          </label>
          <div className="relative w-full min-w-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary-foreground/70"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <input
              id="top-search"
              name="q"
              defaultValue={asked}
              placeholder="iPhone 16, MacBook, PS5…"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 pr-3 pl-9 text-sm text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
        </form>

        <button
          type="button"
          aria-label="Search a product"
          className="ml-auto grid size-11 place-items-center rounded-md text-primary-foreground hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:hidden"
          onClick={() => {
            const field = document.getElementById('hero-search') as HTMLInputElement | null
            if (field) {
              field.scrollIntoView({ behavior: 'smooth', block: 'center' })
              field.focus()
            } else {
              navigate('/search')
            }
          }}
        >
          <Search className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          {account ? (
            <>
              <Link
                to={`/account/${account.role}`}
                className="hidden max-w-[13rem] min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:flex"
              >
                <span className="font-label text-[0.65rem] tracking-[0.08em] text-teal-on-band uppercase">
                  {ROLE_LABEL[account.role]}
                </span>
                <span className="truncate font-medium">{account.org || account.name}</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="grid size-11 place-items-center rounded-md text-primary-foreground hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                aria-label={`Sign out of the ${ROLE_LABEL[account.role].toLowerCase()} account`}
              >
                <LogOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link
              to="/access"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary-foreground/30 px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:px-3"
            >
              <LogIn className="size-4" strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
              <span className="sr-only sm:hidden">Sign in as an individual or a retailer</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

/** Sign-out for the account pages, carrying the reason a visitor rarely needs. */
export function SignOutButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        signOut()
        navigate('/')
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
    >
      <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Sign out
    </button>
  )
}
