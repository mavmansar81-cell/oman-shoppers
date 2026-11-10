import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/* The mark: a price tag in teal beside the wordmark in the heading face.
   The tag is two paths — nothing here needs a drawing tool. */
export function TagMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <path
        d="M15.4 3.6h9c2.2 0 4 1.8 4 4v9L16.6 28.4a2.6 2.6 0 0 1-3.7 0L4.6 19.1a2.6 2.6 0 0 1 0-3.7L15.4 3.6Z"
        className="fill-teal"
      />
      <circle cx="22.1" cy="9.9" r="2.2" className="fill-background" />
    </svg>
  )
}

export function Brand({
  className,
  markClassName,
  onDark = false,
}: {
  className?: string
  markClassName?: string
  onDark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <TagMark className={cn('size-7 shrink-0', markClassName)} />
      <span className={cn('font-display text-lg font-bold leading-none tracking-tight', onDark && 'text-background')}>
        Oman&nbsp;Shoppers
      </span>
    </span>
  )
}

export function BrandLink({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
      aria-label="Oman Shoppers — compare prices at home"
    >
      <Brand onDark={onDark} />
    </Link>
  )
}
