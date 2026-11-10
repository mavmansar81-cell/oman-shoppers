import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { DeviceDrawing } from '@/components/DeviceDrawing'
import { lowestPrice, omr, sortedRetailers, type Product } from '@/data/products'

/* One product in the grid. The whole tile is the link, the lowest price is the
   fact, and the retailer count says how much comparing there is behind it. */
export function ProductTile({ product }: { product: Product }) {
  const rows = sortedRetailers(product)
  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-raised focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <div className="grid place-items-center rounded-lg bg-teal-soft py-4 text-teal-deep">
        <DeviceDrawing device={product.device} className="size-20" decorative />
      </div>

      <p className="mt-3 font-label text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {product.brand} · {product.category}
      </p>
      <h3 className="mt-1 font-display text-lg leading-snug font-bold text-foreground">{product.name}</h3>

      <div className="mt-auto flex min-w-0 items-end justify-between gap-3 pt-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Lowest at {rows[0].shop}</p>
          <p className="font-mono text-lg font-semibold tabular-nums text-saffron-ink">
            {omr(lowestPrice(product))}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 pb-1 text-sm font-medium text-teal-text">
          Compare
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </span>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{rows.length} retailers compared</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 font-label text-[0.7rem] tracking-wide">
          Sample prices
        </span>
      </p>
    </Link>
  )
}
