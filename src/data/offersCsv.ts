import { MODEL_TO_PRODUCT, PRODUCT_TYPES, type Offer, type ProductType } from '@/data/offers'
import { EMAIL } from '@/data/accounts'

/** The rows whose offer flag is set and whose window contains the moment. */
export function activeOffers(rows: Offer[], now = new Date()): Offer[] {
  return rows.filter((r) => isOfferLive(r, now))
}

export function isOfferLive(row: Offer, now = new Date()): boolean {
  if (!row.offerActive) return false
  const from = row.offerFrom ? new Date(row.offerFrom) : null
  const to = row.offerTo ? new Date(row.offerTo) : null
  if (from && !Number.isNaN(from.getTime()) && now < from) return false
  if (to && !Number.isNaN(to.getTime()) && now > to) return false
  return true
}

export function priceWithinBand(row: Offer): boolean {
  if (!Number.isFinite(row.minPrice) || !Number.isFinite(row.maxPrice)) return true
  return row.listedPrice >= row.minPrice && row.listedPrice <= row.maxPrice
}

/* ---- CSV ---------------------------------------------------------------
   CSV only. A shop exports its sheet as CSV and imports it here, with a header
   row naming the columns in any order. Excel's .xlsx is a zip of XML, which is
   not something to parse in a page this size, so it is refused by name with a
   one-line explanation rather than failing silently. */

export const CSV_COLUMNS = [
  { key: 'productId', label: 'Product ID', required: true, example: 'LULU-16P-256' },
  { key: 'type', label: 'Product Type', required: true, example: 'Mobile' },
  { key: 'brand', label: 'Product Brand', required: true, example: 'Apple' },
  { key: 'name', label: 'Product Name', required: true, example: 'iPhone 16 Pro 256GB' },
  { key: 'model', label: 'Model number', required: true, example: 'A3290-256' },
  { key: 'spec1', label: 'Specification 1', required: false, example: '6.3" LTPO' },
  { key: 'spec2', label: 'Specification 2', required: false, example: 'A18 Pro' },
  { key: 'spec3', label: 'Specification 3', required: false, example: '256GB' },
  { key: 'listedPrice', label: 'Listed Price', required: true, example: '494.500' },
  { key: 'maxPrice', label: 'Max selling price', required: false, example: '520.000' },
  { key: 'minPrice', label: 'Min selling price', required: false, example: '480.000' },
  { key: 'offerActive', label: 'Offer applicable', required: false, example: 'Yes' },
  { key: 'offerFrom', label: 'Offer valid from', required: false, example: '2026-03-01T08:00' },
  { key: 'offerTo', label: 'Offer valid to', required: false, example: '2026-03-31T20:00' },
  { key: 'negotiable', label: 'Negotiation allowed', required: false, example: 'Yes' },
  { key: 'image1', label: 'Image 1 URL', required: false, example: '' },
  { key: 'image2', label: 'Image 2 URL', required: false, example: '' },
  { key: 'leadEmail', label: 'Contact email', required: true, example: 'leads@shop.om' },
  { key: 'leadPhone', label: 'Contact phone', required: true, example: '+968 2400 0000' },
] as const

export type CsvRow = Record<string, string>

/** Splits one CSV line, honouring quotes and the "":"" escape inside them. */
function splitLine(line: string): string[] {
  const out: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cell)
      cell = ''
    } else cell += ch
  }
  out.push(cell)
  return out.map((c) => c.trim())
}

export function parseCsv(text: string): { rows: CsvRow[]; headers: string[] } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
  const headers = (lines.shift() ?? '').split(',').map((h) => h.trim())
  const rows = lines.map((line) => {
    const cells = splitLine(line)
    const row: CsvRow = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? ''
    })
    return row
  })
  return { rows, headers }
}

const ALIASES: Record<string, string[]> = {
  productId: ['product id', 'productid', 'sku', 'retailer product id', 'item id'],
  type: ['product type', 'type', 'category'],
  brand: ['product brand', 'brand'],
  name: ['product name', 'name', 'title'],
  model: ['model number', 'model', 'oem model', 'oem'],
  spec1: ['specification 1', 'spec 1', 'specification1'],
  spec2: ['specification 2', 'spec 2', 'specification2'],
  spec3: ['specification 3', 'spec 3', 'specification3'],
  listedPrice: ['listed price', 'price', 'listedprice'],
  maxPrice: ['max selling price', 'max price', 'maxsellingprice'],
  minPrice: ['min selling price', 'min price', 'minsellingprice'],
  offerActive: ['offer applicable', 'offer applicable or not', 'offeractive', 'offer'],
  offerFrom: ['offer valid from date and time', 'offer valid from', 'offer from', 'offerfrom'],
  offerTo: ['offer valid to', 'offer to', 'offerto'],
  negotiable: ['negotiation allowed flag', 'negotiation allowed', 'negotiable'],
  image1: ['image 1', 'image1'],
  image2: ['image 2', 'image2'],
  leadEmail: ['contact email to send leads', 'contact email', 'lead email', 'leademail'],
  leadPhone: ['contact phone to send lead', 'contact phone', 'lead phone', 'leadphone'],
}

function mapHeader(header: string): string | undefined {
  const key = header.toLowerCase().replace(/\s+/g, ' ').trim()
  for (const [field, names] of Object.entries(ALIASES)) {
    if (names.includes(key)) return field
  }
  return undefined
}

export type ImportIssue = { line: number; message: string }

/** Up to 1,000 rows of a shop's own shop sheet are read in one file. */
export const MAX_IMPORT_ROWS = 1000

/** What happened to one line of the file, for the review table. */
export type ImportVerdict =
  | { line: number; productId: string; name: string; status: 'new' }
  | { line: number; productId: string; name: string; status: 'replaced' }
  | { line: number; productId: string; name: string; status: 'rejected'; message: string }

export function offersFromCsv(
  text: string,
  retailer: { id: string; shop: string; store: string },
): {
  offers: Offer[]
  issues: ImportIssue[]
  verdicts: ImportVerdict[]
  unknownHeaders: string[]
  /** Lines present in the file beyond the 1,000-row cap. */
  dropped: number
} {
  const { rows, headers } = parseCsv(text)
  const issues: ImportIssue[] = []
  const verdicts: ImportVerdict[] = []
  const unknownHeaders = headers.filter((h) => !mapHeader(h) && h.length > 0)
  const offers: Offer[] = []
  const kept = rows.slice(0, MAX_IMPORT_ROWS)
  const dropped = rows.length - kept.length
  /* A product id repeated inside one file is the same row twice: the later
     line wins, and the earlier one is named so the shop can see why. */
  const seen = new Map<string, number>()

  kept.forEach((row, index) => {
    const line = index + 2
    const value: Record<string, string> = {}
    for (const [header, cell] of Object.entries(row)) {
      const field = mapHeader(header)
      if (field) value[field] = cell
    }
    const reject = (message: string) => {
      issues.push({ line, message })
      verdicts.push({
        line,
        productId: value.productId ?? '',
        name: value.name ?? '',
        status: 'rejected',
        message,
      })
    }
    const missing = CSV_COLUMNS.filter((c) => c.required && !value[c.key]).map((c) => c.label)
    if (missing.length) {
      reject(`Missing ${missing.join(', ')}.`)
      return
    }
    const listed = Number(value.listedPrice.replace(/[^\d.]/g, ''))
    if (!Number.isFinite(listed) || listed <= 0) {
      reject(`Listed price “${value.listedPrice}” is not a number.`)
      return
    }
    const earlier = seen.get(value.productId)
    if (earlier !== undefined) {
      reject(`Same product id as line ${earlier} — superseded by that line.`)
      return
    }
    seen.set(value.productId, line)
    const type = (PRODUCT_TYPES as string[]).includes(value.type) ? (value.type as ProductType) : 'Mobile'
    if (type !== value.type) issues.push({ line, message: `Unknown product type — saved as Mobile.` })
    if (!EMAIL.test(value.leadEmail)) issues.push({ line, message: `Contact email “${value.leadEmail}” does not look like an address.` })

    offers.push({
      productId: value.productId,
      retailerId: retailer.id,
      shop: retailer.shop,
      store: retailer.store,
      type,
      brand: value.brand ?? '',
      name: value.name ?? '',
      model: value.model ?? '',
      specs: [value.spec1 ?? '', value.spec2 ?? '', value.spec3 ?? ''],
      listedPrice: listed,
      maxPrice: Number(value.maxPrice?.replace(/[^\d.]/g, '')) || 0,
      minPrice: Number(value.minPrice?.replace(/[^\d.]/g, '')) || 0,
      offerActive: /^(yes|y|true|1)$/i.test(value.offerActive ?? ''),
      offerFrom: value.offerFrom ?? '',
      offerTo: value.offerTo ?? '',
      negotiable: /^(yes|y|true|1)$/i.test(value.negotiable ?? ''),
      image1: value.image1 ?? '',
      image2: value.image2 ?? '',
      leadEmail: value.leadEmail ?? '',
      leadPhone: value.leadPhone ?? '',
      updated: new Date().toISOString(),
      marketSlug: MODEL_TO_PRODUCT[value.model ?? ''],
    })
  })

  if (dropped > 0) {
    issues.push({
      line: MAX_IMPORT_ROWS + 2,
      message: `${dropped} more ${dropped === 1 ? 'row' : 'rows'} not read — a file carries at most ${MAX_IMPORT_ROWS.toLocaleString('en-GB')} rows. Split the sheet and import the rest.`,
    })
  }

  return { offers, issues, verdicts, unknownHeaders, dropped }
}

export function csvTemplate(): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(',')
  const example = CSV_COLUMNS.map((c) => c.example).join(',')
  return `${header}\n${example}\n`
}
