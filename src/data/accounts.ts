/* Accounts, sessions and the retailer offer book — all of it in the visitor's
   own browser. There is no server: nothing here is checked by anything but this
   page, and nothing leaves the device. That is stated wherever it is used.

   A password is never stored as typed. Even a prototype should not leave a
   plain-text password sitting in localStorage, so it is stretched with SHA-256
   in the browser. That is not a substitute for a server doing it properly. */

export type Role = 'customer' | 'retailer' | 'admin'

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Individual',
  retailer: 'Retailer',
  admin: 'Admin',
}

export type Account = {
  id: string
  role: Role
  name: string
  /** Store or buying desk, for a retailer; a display name for everyone else. */
  org: string
  email: string
  phone: string
  /** "sha256:<hex>" — see hashPassword. */
  passwordHash: string
  createdAt: string
  /** Retailer only: which brands and which stores this login may touch. */
  brands: string[]
  stores: string[]
}

export type Session = { accountId: string } | null

const ACCOUNTS_KEY = 'oman-shoppers-accounts-v1'
const SESSION_KEY = 'oman-shoppers-session-v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const OMAN_PHONE = /^\+968[\s-]?[0-9]{4}[\s-]?[0-9]{4}$/
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "+968 9123 4567" from whatever the visitor typed. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '').replace(/^968/, '')
  if (digits.length !== 8) return input.trim()
  return `+968 ${digits.slice(0, 4)} ${digits.slice(4)}`
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}::${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return `sha256:${Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}

export function loadAccounts(): Account[] {
  return read<Account[]>(ACCOUNTS_KEY, [])
}

function saveAccounts(accounts: Account[]) {
  write(ACCOUNTS_KEY, accounts)
}

export function loadSession(): Session {
  return read<Session>(SESSION_KEY, null)
}

export function saveSession(session: Session) {
  if (session) write(SESSION_KEY, session)
  else {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* nothing to clear */
    }
  }
}

export function findAccountByEmail(email: string): Account | undefined {
  const needle = email.trim().toLowerCase()
  return loadAccounts().find((a) => a.email.toLowerCase() === needle)
}

/* Two logins exist from the first visit so the three pages can be seen without
   anyone creating accounts first. They are demo credentials and are labelled as
   such on the sign-in page. */
export const DEMO_RETAILER = { email: 'store@sharafdg-sample.om', password: 'sample' }
export const DEMO_ADMIN = { email: 'admin@omanshoppers-sample.om', password: 'sample' }

export async function seedDemoAccounts(): Promise<void> {
  const accounts = loadAccounts()
  if (accounts.length > 0) return
  const salt = 'oman-shoppers-demo'
  const now = new Date().toISOString()
  const seeded: Account[] = [
    {
      id: 'acct-demo-retailer',
      role: 'retailer',
      name: 'Buying desk',
      org: 'Sharaf DG',
      email: DEMO_RETAILER.email,
      phone: '+968 9123 4567',
      passwordHash: await hashPassword(DEMO_RETAILER.password, salt),
      createdAt: now,
      brands: ['Apple', 'Samsung', 'Lenovo'],
      stores: ['City Centre Muscat', 'City Centre Qurum'],
    },
    {
      id: 'acct-demo-admin',
      role: 'admin',
      name: 'Site admin',
      org: 'Oman Shoppers',
      email: DEMO_ADMIN.email,
      phone: '+968 9000 0000',
      passwordHash: await hashPassword(DEMO_ADMIN.password, salt),
      createdAt: now,
      brands: [],
      stores: [],
    },
  ]
  saveAccounts(seeded)
}

export type SignUpInput = {
  role: Role
  name: string
  org: string
  email: string
  phone: string
  password: string
  confirm: string
  brands: string[]
  stores: string[]
}

export type FieldErrors = Partial<Record<keyof SignUpInput, string>>

export function validateSignUp(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.name.trim()) errors.name = 'Enter the name of the person who will sign in.'
  if (input.role === 'retailer' && !input.org.trim())
    errors.org = 'Enter the store this login belongs to.'
  if (!EMAIL.test(input.email.trim())) errors.email = 'Enter an email address, like name@store.om.'
  if (findAccountByEmail(input.email)) errors.email = 'That email already has an account. Sign in instead.'
  if (!OMAN_PHONE.test(input.phone.trim()))
    errors.phone = 'An Omani number, eight digits, like 9123 4567 or +968 9123 4567.'
  if (input.password.length < 8) errors.password = 'At least eight characters.'
  if (input.confirm !== input.password) errors.confirm = 'The two passwords do not match.'
  if (input.role === 'retailer' && input.brands.length === 0)
    errors.brands = 'Pick at least one brand, or an admin must grant access before items can be saved.'
  return errors
}

export async function createAccount(input: SignUpInput): Promise<Account> {
  const salt = crypto.randomUUID?.() ?? String(Date.now())
  const account: Account = {
    id: `acct-${salt.slice(0, 8)}`,
    role: input.role,
    name: input.name.trim(),
    org: input.org.trim(),
    email: input.email.trim(),
    phone: normalisePhone(input.phone),
    passwordHash: await hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
    brands: input.role === 'retailer' ? input.brands : [],
    stores: input.role === 'retailer' ? input.stores : [],
  }
  saveAccounts([...loadAccounts(), account])
  return account
}

export async function signIn(email: string, password: string): Promise<Account | { error: string }> {
  const account = findAccountByEmail(email)
  if (!account) return { error: 'No account uses that email on this browser.' }
  /* The demo logins were seeded with a fixed salt; everything else is salted
     with the account id, which is written into the hash prefix instead. */
  const candidates = account.id === 'acct-demo-retailer' || account.id === 'acct-demo-admin'
    ? ['oman-shoppers-demo']
    : [account.id.replace(/^acct-/, '')]
  for (const salt of candidates) {
    if ((await hashPassword(password, salt)) === account.passwordHash) return account
  }
  return { error: 'That password does not match the account.' }
}

export function updateAccount(id: string, patch: Partial<Account>) {
  saveAccounts(loadAccounts().map((a) => (a.id === id ? { ...a, ...patch } : a)))
}

export function removeAccount(id: string) {
  saveAccounts(loadAccounts().filter((a) => a.id !== id))
}
