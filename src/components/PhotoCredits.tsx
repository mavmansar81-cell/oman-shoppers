import credits from '@/data/photo-credits.json'

type Credit = {
  file: string
  photographer: string
  provider: string
  source_url: string
}

// Renders nothing until a photograph is credited, so the footer can carry it
// unconditionally from the first turn.
export function PhotoCredits({ className }: { className?: string }) {
  const list = credits as Credit[]
  if (list.length === 0) return null
  return (
    <p className={className}>
      Photographs by{' '}
      {list.map((c, i) => (
        <span key={c.file}>
          {i > 0 && ', '}
          <a href={c.source_url} rel="noopener noreferrer" target="_blank">
            {c.photographer}
          </a>
        </span>
      ))}
      .
    </p>
  )
}
