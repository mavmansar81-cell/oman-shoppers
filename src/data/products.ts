export type Device = 'mobile' | 'laptop' | 'gaming' | 'audio'

export type Category = 'All' | 'Mobiles' | 'Laptops' | 'Gaming' | 'Audio'

export const CATEGORIES: Category[] = ['All', 'Mobiles', 'Laptops', 'Gaming', 'Audio']

export const CATEGORY_OF: Record<Exclude<Category, 'All'>, string> = {
  Mobiles: 'mobile',
  Laptops: 'laptop',
  Gaming: 'gaming',
  Audio: 'audio',
}

export type Retailer = {
  shop: string
  area: string
  price: number
  updated: string
  /**
   * True for the two rows added for review. They are labelled as samples
   * wherever they appear until real price data and permission arrive.
   */
  sample?: boolean
  /** The company row this figure came from, so a shopper can report it. */
  retailerId?: string
  retailerProductId?: string
  /** retailer_products.price_updated_at, ISO. Null when it has never been set. */
  priceUpdatedAt?: string | null
}

export type Product = {
  id: string
  name: string
  brand: string
  category: Exclude<Category, 'All'>
  device: Device
  /** Lower-case words a shopper might type, including the usual misspellings. */
  terms: string[]
  retailers: Retailer[]
}

/** How many shops a product is compared across in this sample. */
export const RETAILER_COUNT = 5

/** Always three decimals, then OMR: "189.900 OMR". */
export function omr(value: number): string {
  return `${value.toFixed(3)} OMR`
}

export function sortedRetailers(p: Product): Retailer[] {
  return [...p.retailers].sort((a, b) => a.price - b.price)
}

export function lowestPrice(p: Product): number {
  return Math.min(...p.retailers.map((r) => r.price))
}

export const PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-256',
    name: 'iPhone 16 Pro 256GB',
    brand: 'Apple',
    category: 'Mobiles',
    device: 'mobile',
    terms: ['iphone', 'ihpone', 'iphnoe', 'ipone', 'iphone 16', 'iphone 16 pro', '256gb', 'apple'],
    retailers: [
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 489.9, updated: 'Today, 09:12' },
      { shop: 'eMax', area: 'Mall of Oman', price: 495.0, updated: 'Today, 08:40' },
      { shop: 'Extra Stores', area: 'Qurum', price: 502.5, updated: 'Yesterday, 21:05' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 494.5, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 499.0, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'galaxy-s24-ultra-512',
    name: 'Galaxy S24 Ultra 512GB',
    brand: 'Samsung',
    category: 'Mobiles',
    device: 'mobile',
    terms: ['samsung', 'samsng', 'samsug', 'galaxy', 's24', 's24 ultra', '512gb'],
    retailers: [
      { shop: 'Extra Stores', area: 'Qurum', price: 519.0, updated: 'Today, 10:24' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 524.5, updated: 'Today, 09:12' },
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 539.9, updated: 'Today, 07:58' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 527.9, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 533.0, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'pixel-9-128',
    name: 'Pixel 9 128GB',
    brand: 'Google',
    category: 'Mobiles',
    device: 'mobile',
    terms: ['pixel', 'pixle', 'google', 'pixel 9', '128gb'],
    retailers: [
      { shop: 'eMax', area: 'Mall of Oman', price: 329.0, updated: 'Today, 11:02' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 335.5, updated: 'Today, 09:12' },
      { shop: 'Extra Stores', area: 'Qurum', price: 344.0, updated: 'Yesterday, 20:31' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 331.9, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 339.5, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'macbook-air-m3-13',
    name: 'MacBook Air M3 13" 256GB',
    brand: 'Apple',
    category: 'Laptops',
    device: 'laptop',
    terms: ['macbook', 'macbok', 'mac book', 'air', 'm3', 'apple', 'laptop'],
    retailers: [
      { shop: 'eMax', area: 'Mall of Oman', price: 419.0, updated: 'Today, 08:40' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 429.9, updated: 'Today, 09:12' },
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 445.0, updated: 'Yesterday, 19:47' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 424.0, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 432.5, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'xps-13-9340',
    name: 'Dell XPS 13 9340',
    brand: 'Dell',
    category: 'Laptops',
    device: 'laptop',
    terms: ['dell', 'xps', 'xps 13', '9340', 'laptop', 'intel'],
    retailers: [
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 549.0, updated: 'Today, 09:55' },
      { shop: 'Extra Stores', area: 'Qurum', price: 559.5, updated: 'Today, 08:10' },
      { shop: 'eMax', area: 'Mall of Oman', price: 569.0, updated: 'Yesterday, 21:05' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 556.5, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 549.0, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'ideapad-slim-5',
    name: 'Lenovo IdeaPad Slim 5 14"',
    brand: 'Lenovo',
    category: 'Laptops',
    device: 'laptop',
    terms: ['lenovo', 'ideapad', 'idea pad', 'slim 5', 'laptop'],
    retailers: [
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 219.0, updated: 'Today, 07:58' },
      { shop: 'Extra Stores', area: 'Qurum', price: 229.5, updated: 'Today, 08:10' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 239.0, updated: 'Yesterday, 18:22' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 224.0, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 231.5, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'playstation-5-slim',
    name: 'PlayStation 5 Slim Disc',
    brand: 'Sony',
    category: 'Gaming',
    device: 'gaming',
    terms: ['playstation', 'playstation 5', 'ps5', 'ps 5', 'sony', 'console'],
    retailers: [
      { shop: 'Extra Stores', area: 'Qurum', price: 199.0, updated: 'Today, 10:24' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 205.5, updated: 'Today, 09:12' },
      { shop: 'eMax', area: 'Mall of Oman', price: 214.9, updated: 'Yesterday, 20:05' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 203.9, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 211.0, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'xbox-series-x-1tb',
    name: 'Xbox Series X 1TB',
    brand: 'Microsoft',
    category: 'Gaming',
    device: 'gaming',
    terms: ['xbox', 'x box', 'series x', 'microsoft', 'console', '1tb'],
    retailers: [
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 209.0, updated: 'Today, 07:58' },
      { shop: 'eMax', area: 'Mall of Oman', price: 215.0, updated: 'Today, 08:40' },
      { shop: 'Extra Stores', area: 'Qurum', price: 222.5, updated: 'Yesterday, 21:05' },
    ],
  },
  {
    id: 'nintendo-switch-oled',
    name: 'Nintendo Switch OLED',
    brand: 'Nintendo',
    category: 'Gaming',
    device: 'gaming',
    terms: ['nintendo', 'switch', 'oled', 'swich', 'console'],
    retailers: [
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 145.5, updated: 'Today, 09:12' },
      { shop: 'Extra Stores', area: 'Qurum', price: 149.0, updated: 'Today, 10:24' },
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 159.9, updated: 'Yesterday, 18:22' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 152.0, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 156.9, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2 (USB-C)',
    brand: 'Apple',
    category: 'Audio',
    device: 'audio',
    terms: ['airpods', 'air pods', 'airpod', 'airpods pro', 'apple', 'usb-c'],
    retailers: [
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 89.9, updated: 'Today, 09:12' },
      { shop: 'eMax', area: 'Mall of Oman', price: 92.5, updated: 'Today, 08:40' },
      { shop: 'Extra Stores', area: 'Qurum', price: 99.0, updated: 'Yesterday, 21:05' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 91.5, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 94.9, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Audio',
    device: 'audio',
    terms: ['sony', 'wh-1000xm5', 'xm5', 'headphones', 'head phones', 'noise cancelling'],
    retailers: [
      { shop: 'Extra Stores', area: 'Qurum', price: 129.0, updated: 'Today, 10:24' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 134.9, updated: 'Today, 09:12' },
      { shop: 'Lulu Hypermarket', area: 'Darsait', price: 142.0, updated: 'Yesterday, 18:22' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 132.5, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 138.0, updated: 'Sample', sample: true },
    ],
  },
  {
    id: 'bose-qc-ultra',
    name: 'Bose QuietComfort Ultra',
    brand: 'Bose',
    category: 'Audio',
    device: 'audio',
    terms: ['bose', 'quietcomfort', 'quiet comfort', 'ultra', 'headphones', 'head phones'],
    retailers: [
      { shop: 'eMax', area: 'Mall of Oman', price: 139.0, updated: 'Today, 08:40' },
      { shop: 'Extra Stores', area: 'Qurum', price: 145.0, updated: 'Today, 10:24' },
      { shop: 'Sharaf DG', area: 'City Centre Muscat', price: 152.5, updated: 'Yesterday, 20:05' },
      { shop: 'LuluOman', area: 'Online, delivers in Muscat', price: 142.9, updated: 'Sample', sample: true },
      { shop: 'GadgetsOman', area: 'Al Khuwair', price: 147.5, updated: 'Sample', sample: true },
    ],
  },
]

export function findProduct(id: string | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

/** Distance between two words: 1 edit, 2 edits, or the sum for near-equal lengths. */
function distance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 1) return 3
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}

/**
 * Matches on whole words and tolerates one typo per word, so "ihpone" finds the
 * iPhone and "samsng" finds the Samsung. Everything in a product's name, brand,
 * category and term list is a candidate.
 */
export function matchesQuery(product: Product, query: string): boolean {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = `${product.name} ${product.brand} ${product.category} ${product.terms.join(' ')}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  return words.every((word) =>
    haystack.some((token) => {
      if (token.includes(word) || word.includes(token)) return true
      if (word.length < 3) return false
      return distance(word, token) <= (word.length >= 6 ? 2 : 1)
    }),
  )
}
