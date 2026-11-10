import { Link } from 'react-router'
import { Link2 } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { PhotoCredits } from '@/components/PhotoCredits'

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex min-w-0 max-w-content flex-col gap-4 px-gutter py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Brand onDark />
          <p className="mt-2 text-sm text-primary-foreground/70">
            Sample prices for twelve electronics across five Omani retailers, from Sharaf DG to
            LuluOman. No live prices yet.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              ['/price-disclaimer', 'Price disclaimer'],
              ['/terms', 'Terms of Use'],
              ['/privacy', 'Privacy'],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="inline-flex min-h-11 items-center text-sm text-primary-foreground/80 underline underline-offset-4 hover:text-primary-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-primary-foreground/80 underline underline-offset-4 hover:text-primary-foreground"
          >
            <Link2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Back to the comparison
          </Link>
          <div className="text-xs text-primary-foreground/65">
            <PhotoCredits />
            <p className="mt-1.5 text-xs text-primary-foreground/65">
              Under development: these are sample prices, with no live pricing or saved lists yet.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
