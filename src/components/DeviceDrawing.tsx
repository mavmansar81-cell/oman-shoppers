import type { ReactNode } from 'react'
import type { Device } from '@/data/products'

/* Line drawings of each device in the site's own two colours: ink for the
   outline, teal for the highlighted edge. No photographs — the sample version
   does not claim real stock or real stores. Stroke weight is one value (1.5). */
const shapes: Record<Device, ReactNode> = {
  mobile: (
    <>
      <rect x="34" y="14" width="60" height="104" rx="12" strokeWidth="1.5" />
      <path d="M54 24h20" strokeWidth="1.5" />
      <rect x="42" y="34" width="44" height="62" rx="4" className="stroke-teal" strokeWidth="1.5" />
      <path d="M54 106h20" strokeWidth="1.5" />
    </>
  ),
  laptop: (
    <>
      <rect x="26" y="22" width="76" height="64" rx="6" strokeWidth="1.5" />
      <rect x="34" y="30" width="60" height="48" rx="3" className="stroke-teal" strokeWidth="1.5" />
      <path d="M16 100h96" strokeWidth="1.5" />
      <path d="M44 94h40l8 6H36l8-6Z" strokeWidth="1.5" />
    </>
  ),
  gaming: (
    <>
      <path d="M38 42h52c10 0 16 9 16 22 0 14-4 24-12 24-6 0-9-8-14-8H48c-5 0-8 8-14 8-8 0-12-10-12-24 0-13 6-22 16-22Z" strokeWidth="1.5" />
      <path d="M42 58v16M34 66h16" strokeWidth="1.5" />
      <circle cx="70" cy="62" r="3.5" className="stroke-teal" strokeWidth="1.5" />
      <circle cx="80" cy="70" r="3.5" strokeWidth="1.5" />
    </>
  ),
  audio: (
    <>
      <path d="M32 74V62c0-16 10-28 32-28s32 12 32 28v12" strokeWidth="1.5" />
      <rect x="20" y="68" width="20" height="30" rx="8" strokeWidth="1.5" />
      <rect x="88" y="68" width="20" height="30" rx="8" className="stroke-teal" strokeWidth="1.5" />
    </>
  ),
}

export function DeviceDrawing({
  device,
  className = '',
  decorative = false,
  label,
}: {
  device: Device
  className?: string
  decorative?: boolean
  label?: string
}) {
  if (decorative || !label) {
    return (
      <svg
        viewBox="0 0 128 128"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        {shapes[device]}
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={label}
    >
      {shapes[device]}
    </svg>
  )
}
