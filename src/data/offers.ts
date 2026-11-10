import { useSyncExternalStore } from 'react'
import { PRODUCTS, type Device, type Product } from '@/data/products'
/* Only the type is imported: matching reads offers, so importing its values
   here would make the two modules import each other. */
import { activeRetailers, type LinkRecord } from '@/data/matching'

/* The retailer offer book. Every row here is what a shop wrote in its own
   browser: the listed price, the floor and ceiling it will not cross, whether
   an offer runs, whether it will negotiate, and the two places a lead goes.

   The seed rows are the sample prices already on the comparison, so the market
   page and the retailer page show the same eleven figures. Nothing is live. */

export type ProductType = 'Mobile' | 'Laptop' | 'Gaming' | 'Audio' | 'Accessory'

export const PRODUCT_TYPES: ProductType[] = ['Mobile', 'Laptop', 'Gaming', 'Audio', 'Accessory']

export const TYPE_TO_DEVICE: Record<ProductType, Device> = {
  Mobile: 'mobile',
  Laptop: 'laptop',
  Gaming: 'gaming',
  Audio: 'audio',
  Accessory: 'audio',
}

/* The comparison groups by exact model. A retailer row joins the market page
   when its brand and model number match a product there; the link is kept on
   the row so a shop's own product id never has to match ours. */
export const MODEL_TO_PRODUCT: Record<string, string> = {
  'A3290-256': 'iphone-16-pro-256',
  'SM-S928B-512': 'galaxy-s24-ultra-512',
  'GA05564-GB': 'pixel-9-128',
  'MRXV3-256': 'macbook-air-m3-13',
  'XPS9340': 'xps-13-9340',
  '83D4000HAX': 'ideapad-slim-5',
  'CFI-2000': 'playstation-5-slim',
  'RRT-00001': 'xbox-series-x-1tb',
  'HEG-001': 'nintendo-switch-oled',
  'MTJV3-USB-C': 'airpods-pro-2',
  'WH1000XM5/B': 'sony-wh-1000xm5',
  'BOSE-QC-U-01': 'bose-qc-ultra',
}

export type Offer = {
  /** Unique per retailer, not across the site. */
  productId: string
  retailerId: string
  shop: string
  store: string
  type: ProductType
  brand: string
  name: string
  model: string
  specs: [string, string, string]
  listedPrice: number
  /** Never shown to a shopper. Used to flag a listed price outside the range. */
  maxPrice: number
  minPrice: number
  offerActive: boolean
  offerFrom: string
  offerTo: string
  negotiable: boolean
  image1: string
  image2: string
  leadEmail: string
  leadPhone: string
  updated: string
  /**
   * retailer_products.price_updated_at — written on every save and every import
   * row. A price is only shown as current while this is inside the freshness
   * window; see lib/freshness.
   */
  priceUpdatedAt?: string | null
  /** retailer_products.last_seen_at — when the worker last confirmed the row. */
  lastSeenAt?: string | null
  /**
   * product_images storage paths (bucket product-images), never full URLs: the
   * public address is built at render time from the path.
   */
  image1Path?: string | null
  image2Path?: string | null
  /**
   * retailer-documents storage paths (private bucket). Reachable only through a
   * signed URL issued to the uploader or an admin.
   */
  documentPaths?: string[]
  /** The comparison's slug when this row is one of the sample products. */
  marketSlug?: string
  /**
   * The match decision for this row: which master product it belongs to, how
   * certain that is, and who confirmed it. A row with no record and no
   * marketSlug has never been matched and waits in the admin queue.
   */
  masterLink?: LinkRecord
}

const seed: Offer[] = []

function push(
  shop: string,
  retailerId: string,
  brand: string,
  type: ProductType,
  name: string,
  model: string,
  specs: [string, string, string],
  price: number,
  leadEmail: string,
) {
  seed.push({
    productId: `${retailerId}-${model}`,
    retailerId,
    shop,
    store: 'City Centre Muscat',
    type,
    brand,
    name,
    model,
    specs,
    listedPrice: price,
    maxPrice: Math.round((price + 30) * 1000) / 1000,
    minPrice: Math.round((price - 12) * 1000) / 1000,
    offerActive: false,
    offerFrom: '',
    offerTo: '',
    negotiable: true,
    image1: '',
    image2: '',
    leadEmail,
    leadPhone: '+968 2400 0000',
    updated: 'Sample row',
    priceUpdatedAt: null,
    lastSeenAt: null,
    marketSlug: MODEL_TO_PRODUCT[model],
    masterLink: MODEL_TO_PRODUCT[model]
      ? {
          masterProductId: MODEL_TO_PRODUCT[model],
          status: 'approved',
          score: 1,
          reason: `Model number ${model} is this product's exact model.`,
          candidateProductId: MODEL_TO_PRODUCT[model],
          reviewedBy: 'Automatic match',
          reviewedAt: 'Sample row',
        }
      : undefined,
  })
}

const SHOPS = [
  { shop: 'Sharaf DG', id: 'sharafdg', email: 'leads@sharafdg-sample.om' },
  { shop: 'eMax', id: 'emax', email: 'leads@emax-sample.om' },
  { shop: 'Extra Stores', id: 'extra', email: 'leads@extra-sample.om' },
  { shop: 'LuluOman', id: 'lulu', email: 'leads@luluoman-sample.om' },
  { shop: 'GadgetsOman', id: 'gadgets', email: 'leads@gadgetsoman-sample.om' },
]

/* The sample prices on the comparison, turned into that shop's own rows. */
for (const product of PRODUCTS) {
  for (const row of product.retailers) {
    const shop = SHOPS.find((s) => s.shop === row.shop)
    if (!shop) continue
    const type: ProductType =
      product.category === 'Mobiles'
        ? 'Mobile'
        : product.category === 'Laptops'
          ? 'Laptop'
          : product.category === 'Gaming'
            ? 'Gaming'
            : 'Audio'
    push(
      shop.shop,
      shop.id,
      product.brand,
      type,
      product.name,
      Object.keys(MODEL_TO_PRODUCT).find((m) => MODEL_TO_PRODUCT[m] === product.id) ?? product.id,
      [product.category, product.brand, 'Sample specification'],
      row.price,
      shop.email,
    )
  }
}

/* The sample rows are the baseline: a browser that has never saved anything
   shows them, so the comparison keeps its eleven figures. */
export function seedOffers(): Offer[] {
  return seed.map((o) => ({ ...o }))
}

const OFFERS_KEY = 'oman-shoppers-offers-v1'
const VIEWS_KEY = 'oman-shoppers-views-v1'
const LEADS_KEY = 'oman-shoppers-leads-v1'

function readOffers(): Offer[] {
  try {
    const raw = localStorage.getItem(OFFERS_KEY)
    if (raw) return JSON.parse(raw) as Offer[]
  } catch {
    /* fall through to the seed */
  }
  return seed
}

let offers: Offer[] = readOffers()

function persist() {
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers))
  } catch {
    /* private mode: the store simply does not survive a reload */
  }
}

const listeners = new Set<() => void>()
function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useOffers() {
  return useSyncExternalStore(subscribe, () => offers, () => offers)
}

function replaceAll(next: Offer[]) {
  offers = next
  persist()
  emit()
}

/* Every write to a price carries the two stamps together. The edit form and the
   import worker both come through here, so a saved row always says when it was
   priced, and a row that has never been priced keeps a null and says so. */
export function saveOffer(offer: Offer) {
  const stamped = stampPrice(offer)
  replaceAll([
    stamped,
    ...offers.filter((o) => o.retailerId !== stamped.retailerId || o.productId !== stamped.productId),
  ])
}

function stampPrice(offer: Offer): Offer {
  const iso = new Date().toISOString()
  return { ...offer, updated: iso, priceUpdatedAt: iso, lastSeenAt: iso }
}

export function deleteOffer(retailerId: string, productId: string) {
  replaceAll(offers.filter((o) => !(o.retailerId === retailerId && o.productId === productId)))
}

export function upsertOffers(next: Offer[]) {
  const stamped = next.map(stampPrice)
  const keys = new Set(stamped.map((o) => `${o.retailerId}::${o.productId}`))
  replaceAll([...stamped, ...offers.filter((o) => !keys.has(`${o.retailerId}::${o.productId}`))])
}

/* ---- Import history -----------------------------------------------------
   One entry per file a shop loaded, so the shop can see what it sent and which
   rows it refused, and the admin can see which shop has not cleaned up a file.
   The file itself is not stored — only its name, its counts and the messages. */

export type ImportRecord = {
  id: string
  retailerId: string
  company: string
  file: string
  /** ISO timestamp of the import. */
  at: string
  by: string
  rows: number
  /** Rows written to the book: new ones plus replaced ones. */
  written: number
  added: number
  replaced: number
  /** Readable rows held back because their product id belongs to another row. */
  rejected: number
  issues: { line: number; message: string }[]
}

const HISTORY_KEY = 'oman-shoppers-imports-v1'

function readHistory(): ImportRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as ImportRecord[]
  } catch {
    /* no history survives this browser */
  }
  return []
}

let imports: ImportRecord[] = readHistory()

function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(imports))
  } catch {
    /* private mode */
  }
}

export function useImportHistory() {
  return useSyncExternalStore(subscribe, () => imports, () => imports)
}

export function logImport(record: ImportRecord) {
  imports = [record, ...imports].slice(0, 40)
  persistHistory()
  emit()
}

/** The files one company loaded, newest first. A company is its retailer id. */
export function importsFor(records: ImportRecord[], retailerId: string) {
  return records.filter((r) => r.retailerId === retailerId)
}

/* ---- Admin review of matches -------------------------------------------
   An admin either links a row to the candidate (which is what an automatic
   match would have written) or marks it rejected. Both record who reviewed it
   and when, and both leave the row's own price untouched. */

export function reviewMatch(retailerId: string, productId: string, link: LinkRecord): void {
  replaceAll(
    offers.map((o) =>
      o.retailerId === retailerId && o.productId === productId
        ? {
            ...o,
            masterLink: {
              ...link,
              /* The slug the row had before this decision, so rejecting a row
                 that was live, or undoing one, puts it back as it was. */
              previousMarketSlug: o.masterLink
                ? (o.masterLink.previousMarketSlug ?? null)
                : (o.marketSlug ?? null),
            },
            /* An approval is the link the comparison already reads. A rejection
               leaves the row in its shop's book, out of the comparison. */
            marketSlug: link.status === 'approved' ? (link.masterProductId ?? undefined) : undefined,
          }
        : o,
    ),
  )
}

/** Puts a row back to waiting, undoing an approval or a rejection. */
export function undoMatch(retailerId: string, productId: string): void {
  replaceAll(
    offers.map((o) => {
      if (o.retailerId !== retailerId || o.productId !== productId) return o
      const back = o.masterLink?.previousMarketSlug ?? undefined
      return { ...o, masterLink: undefined, marketSlug: back }
    }),
  )
}

/** Rows already reviewed, most recent first, for the audit trail. */
export function queueHistory(rows: Offer[]): Offer[] {
  return rows
    .filter((r) => r.masterLink && r.masterLink.status !== 'pending')
    .sort((a, b) => (b.masterLink?.reviewedAt ?? '').localeCompare(a.masterLink?.reviewedAt ?? ''))
}

/* The comparison as the shops wrote it today: every row joins the product it
   has been linked to, and a product lists only the shops cleared for it. A row
   no one has linked — or one an admin rejected — stays in its own shop's book. */
export function marketProducts(base: Product[], rows: Offer[]): Product[] {
  return base.map((product) => ({
    ...product,
    retailers: activeRetailers(product, rows),
  }))
}

/* ---- Interest, leads and page views -------------------------------------
   A customer asking for a quote writes a lead and records the interested flag
   on the row. A view is counted once per product per tab session, so a
   dashboard figure does not climb every time someone scrolls back. */

export type Lead = {
  id: string
  retailerId: string
  productId: string
  productName: string
  shop: string
  name: string
  email: string
  phone: string
  message: string
  consent: boolean
  createdAt: string
  /**
   * A price report is the same row in the leads table with a kind and the
   * retailer_product_id it is about, so nothing new is stored. Absent on a
   * plain quote request.
   */
  kind?: 'quote' | 'price-report'
  retailerProductId?: string | null
  /** Why the shopper says the figure is wrong. */
  reason?: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadLeads(): Lead[] {
  return readJson<Lead[]>(LEADS_KEY, [])
}

export function addLead(lead: Lead) {
  const next = [lead, ...loadLeads()]
  try {
    sessionStorage.setItem(LEADS_KEY, JSON.stringify(next))
  } catch {
    /* lost with the tab, which is honest for a prototype */
  }
  emit()
}

/* ---- Price reports -------------------------------------------------------
   One report per shopper per retailer row per tab session. The submit route is
   rate-limited on the server; this keeps the browser from firing the same
   report twice while the first is still on screen. */

export const REPORT_REASONS = [
  'The price is different in the shop',
  'The item is out of stock',
  'This is the wrong product',
  'The link does not reach it',
  'Something else',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

const REPORTED_KEY = 'oman-shoppers-reports-v1'

function readReported(): string[] {
  return readJson<string[]>(REPORTED_KEY, [])
}

/** `companyId::productId` keys already reported from this tab. */
export function reportedKeys(): Set<string> {
  return new Set(readReported())
}

/**
 * Write a report to the leads store. Returns false when the same row has
 * already been reported in this tab, so the page can say so instead of writing
 * a second identical row.
 */
export function reportPrice(input: {
  retailerId: string
  retailerProductId: string
  productId: string
  productName: string
  shop: string
  reason: string
  note: string
  email?: string
}): boolean {
  const key = `${input.retailerId}::${input.retailerProductId}`
  const already = readReported()
  if (already.includes(key)) return false
  addLead({
    id: crypto.randomUUID?.() ?? String(Date.now()),
    retailerId: input.retailerId,
    productId: input.productId,
    productName: input.productName,
    shop: input.shop,
    name: '',
    email: input.email ?? '',
    phone: '',
    message: input.note ? `${input.reason} — ${input.note}` : input.reason,
    consent: true,
    createdAt: new Date().toISOString(),
    kind: 'price-report',
    retailerProductId: input.retailerProductId,
    reason: input.reason,
  })
  try {
    sessionStorage.setItem(REPORTED_KEY, JSON.stringify([key, ...already].slice(0, 80)))
  } catch {
    /* nothing to remember */
  }
  return true
}

export type Views = Record<string, number>

export function loadViews(): Views {
  return readJson<Views>(VIEWS_KEY, {})
}

const counted = new Set<string>()

export function countView(slug: string) {
  if (counted.has(slug)) return
  counted.add(slug)
  const views = loadViews()
  views[slug] = (views[slug] ?? 0) + 1
  try {
    sessionStorage.setItem(VIEWS_KEY, JSON.stringify(views))
  } catch {
    /* nothing to remember */
  }
  emit()
}

export function useActivity() {
  return useSyncExternalStore(
    subscribe,
    () => activitySnapshot(),
    () => activitySnapshot(),
  )
}

let cachedLeads: Lead[] = []
let cachedViews: Views = {}
let cachedKey = ''

function activitySnapshot() {
  const key = `${sessionStorage.getItem(LEADS_KEY) ?? ''}|${sessionStorage.getItem(VIEWS_KEY) ?? ''}`
  if (key !== cachedKey) {
    cachedKey = key
    cachedLeads = loadLeads()
    cachedViews = loadViews()
  }
  return { leads: cachedLeads, views: cachedViews }
}

export function leadsFor(retailerId: string | undefined, leads: Lead[]) {
  return retailerId ? leads.filter((l) => l.retailerId === retailerId) : leads
}

/** Views across the rows a login can see, counted once per product. */
export function viewsFor(rows: Offer[], views: Views) {
  return rows.reduce((total, row) => total + (row.marketSlug ? (views[row.marketSlug] ?? 0) : 0), 0)
}
