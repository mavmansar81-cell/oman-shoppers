import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-gutter py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-teal-soft text-teal-deep">
          <SearchX className="size-7" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-4 font-label text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">No product at that address</h1>
        <p className="mt-3 text-muted-foreground">
          The link may be mistyped, or that model is not one of the twelve in the sample. Go back
          and search for it by name.
        </p>
        <Button asChild className="mt-7 bg-teal px-5 text-teal-foreground hover:bg-teal-deep">
          <Link to="/">Search products</Link>
        </Button>
      </div>
    </main>
  )
}
