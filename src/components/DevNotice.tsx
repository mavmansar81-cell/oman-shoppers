import { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'

/* The development notice: the first thing under the top bar on every route.
   It is a status line, not an alert — saffron-soft ground, ink text, one
   sentence a visitor actually needs. Dismissing it lasts for the session; a
   fresh visit shows it again, which is the point of a notice like this. */
const STORAGE_KEY = 'oman-shoppers-notice-dismissed'

export function DevNotice() {
  const [dismissed, setDismissed] = useState(false)
  const [announce, setAnnounce] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true)
    } catch {
      /* private mode: the notice simply stays */
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* nothing to remember it with */
    }
  }

  function reopen() {
    setDismissed(false)
    setAnnounce(true)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to remember it with */
    }
  }

  if (dismissed) {
    return (
      <div className="border-b border-border bg-saffron-soft">
        <div className="mx-auto flex min-w-0 max-w-content items-center justify-between gap-3 px-gutter py-1.5">
          <p className="text-xs text-saffron-ink">Prices on this site are samples.</p>
          <button
            type="button"
            onClick={reopen}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-medium text-saffron-ink underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            Show notice
          </button>
        </div>
      </div>
    )
  }

  return (
    <aside aria-label="Site status" className="border-b border-saffron bg-saffron-soft text-saffron-ink">
      <div className="mx-auto flex min-w-0 max-w-content items-start gap-2.5 px-gutter py-2.5 sm:items-center">
        <Info className="mt-0.5 size-4 shrink-0 sm:mt-0" strokeWidth={1.5} aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-semibold">Under development.</span>{' '}
          <span className="tabular-nums">
            The prices here are samples — live prices and saved lists are not available yet.
          </span>
          {announce && (
            <span aria-live="polite" className="sr-only">
              Notice reopened.
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss the development notice"
          className="-my-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-md text-saffron-ink hover:bg-saffron/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
