import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Check, Info, Store, ShoppingBag, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DEMO_ADMIN,
  DEMO_RETAILER,
  ROLE_LABEL,
  createAccount,
  normalisePhone,
  seedDemoAccounts,
  signIn,
  validateSignUp,
  type Account,
  type FieldErrors,
  type Role,
  type SignUpInput,
} from '@/data/accounts'
import { setSession, useCurrentAccount } from '@/lib/session'

/* The access page: one form, three levels. Which level is chosen decides what
   the form asks for — a retailer names its store and picks the brands it may
   publish, a customer and an admin do not. Everything here runs in this
   browser; the note under the form says so rather than pretending otherwise. */

const ROLES: { role: Role; blurb: string; icon: typeof ShoppingBag }[] = [
  {
    role: 'customer',
    blurb: 'I am an individual: compare prices and ask a shop for a quote.',
    icon: ShoppingBag,
  },
  {
    role: 'retailer',
    blurb: 'I am a retailer: keep a price book, read the requests, answer them.',
    icon: Store,
  },
  {
    role: 'admin',
    blurb: 'Admin: read and correct every shop, and set who may publish.',
    icon: ShieldCheck,
  },
]

const BRAND_CHOICES = ['Apple', 'Samsung', 'Google', 'Dell', 'Lenovo', 'Sony', 'Microsoft', 'Nintendo', 'Bose']
const STORE_CHOICES = ['City Centre Muscat', 'City Centre Qurum', 'Mall of Oman', 'Al Khuwair', 'Online']

type Mode = 'create' | 'signin'

export default function AccessPage() {
  const account = useCurrentAccount()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  /* Opening a product while signed out arrives here as ?next=/product/…, and
     with ?role=retailer when the visitor said they were a shop. */
  const next = params.get('next') ?? '/'
  const jump = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signin' ? 'signin' : 'create')
  const chosen = params.get('role')
  const [role, setRole] = useState<Role | null>(
    chosen === 'retailer' || chosen === 'customer' ? chosen : null,
  )
  const [form, setForm] = useState<SignUpInput>({
    role: 'customer',
    name: '',
    org: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    brands: [],
    stores: [],
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [signInError, setSignInError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (account) return <Navigate to={`/account/${account.role}`} replace />

  function set<K extends keyof SignUpInput>(key: K, value: SignUpInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function chooseRole(next: Role) {
    setRole(next)
    setForm((f) => ({ ...f, role: next, brands: next === 'retailer' ? f.brands : [] }))
    setErrors({})
    setSignInError(null)
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    const input: SignUpInput = { ...form, role }
    const found = validateSignUp(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setPending(true)
    try {
      const created: Account = await createAccount(input)
      setSession({ accountId: created.id })
      navigate(created.role === 'customer' ? jump : `/account/${created.role}`)
    } finally {
      setPending(false)
    }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInError(null)
    setPending(true)
    try {
      await seedDemoAccounts()
      const result = await signIn(form.email, form.password)
      if ('error' in result) {
        setSignInError(result.error)
        return
      }
      setSession({ accountId: result.id })
      navigate(jump !== '/' ? jump : `/account/${result.role}`)
    } finally {
      setPending(false)
    }
  }

  const isRetailer = role === 'retailer'
  const labels = { create: 'Create access', signin: 'Sign in' }

  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 15% 0%, color-mix(in oklch, var(--teal-soft) 85%, transparent), transparent 70%), radial-gradient(45% 40% at 95% 12%, color-mix(in oklch, var(--teal) 18%, transparent), transparent 70%)',
        }}
      />
      <div className="relative mx-auto min-w-0 max-w-content px-gutter py-section">
        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div className="min-w-0 lg:pt-4">
            <p className="font-label text-xs tracking-[0.08em] text-teal-text uppercase">Access</p>
            <h1 className="mt-2 text-[clamp(2rem,4.6vw,3.25rem)]">
              Are you shopping or selling?
            </h1>
            <p className="mt-3 max-w-[46ch] text-muted-foreground">
              An individual compares prices and asks shops for a quote. A retailer keeps a price
              book and answers those requests. Choose one and the form below becomes that desk.
            </p>
            {jump !== '/' && (
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-teal/40 bg-card px-3.5 py-3 text-sm">
                <span className="text-muted-foreground">Signed in, you go back to the model you were reading.</span>
                <Link to={jump} className="font-medium text-teal-text underline decoration-teal/50 underline-offset-4 hover:decoration-teal">
                  Go back without signing in
                </Link>
              </p>
            )}

            <ul className="mt-7 grid gap-3 sm:grid-cols-1">
              {ROLES.map(({ role: r, blurb, icon: Icon }) => {
                const on = role === r
                return (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => chooseRole(r)}
                      aria-pressed={on}
                      className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                        on
                          ? 'border-teal bg-card shadow-raised'
                          : 'border-border bg-card/70 hover:border-teal/50'
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                          on ? 'bg-teal text-teal-foreground' : 'bg-teal-soft text-teal-deep'
                        }`}
                      >
                        <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-display font-bold">
                          {r === 'customer' ? 'Individual' : ROLE_LABEL[r]}
                          {on && <Check className="size-4 text-teal-text" strokeWidth={2} aria-hidden="true" />}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{blurb}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 flex min-w-0 items-start gap-2.5 rounded-lg border border-border bg-secondary px-3.5 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-teal-text" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                There is no server yet. Accounts, price books and leads live in this browser only, and
                a password is hashed here rather than checked against anything.
              </p>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-raised sm:p-6">
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              {(['create', 'signin'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium ${
                    mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {labels[m]}
                </button>
              ))}
            </div>

            {!role ? (
              <div className="mt-5 rounded-lg bg-secondary p-4">
                <h2 className="font-display text-lg font-bold">Choose who you are first</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick individual or retailer from the two cards beside this panel — the form only
                  appears once it knows which one to ask for.
                </p>
              </div>
            ) : mode === 'create' ? (
              <form noValidate onSubmit={onCreate} className="mt-5">
                <h2 className="font-display text-xl font-bold">
                  {role === 'customer' ? 'Individual' : ROLE_LABEL[role]} access
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Phone, email and a password. We ask for the phone so a shop can reach you about a
                  quote — nothing else uses it.
                </p>

                <div className="mt-4 grid min-w-0 gap-4">
                  <TextField
                    id="name"
                    label="Your name"
                    value={form.name}
                    onChange={(v) => set('name', v)}
                    error={errors.name}
                    autoComplete="name"
                  />
                  {isRetailer && (
                    <TextField
                      id="org"
                      label="Store or company"
                      value={form.org}
                      onChange={(v) => set('org', v)}
                      error={errors.org}
                      autoComplete="organization"
                    />
                  )}
                  <TextField
                    id="email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set('email', v)}
                    error={errors.email}
                    autoComplete="email"
                    hint={isRetailer ? 'Leads are sent here unless a product names another address.' : undefined}
                  />
                  <TextField
                    id="phone"
                    label="Phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => set('phone', v)}
                    error={errors.phone}
                    autoComplete="tel"
                    hint="Eight digits, or +968 and eight digits."
                    onBlur={() => setForm((f) => ({ ...f, phone: normalisePhone(f.phone) }))}
                  />
                  <TextField
                    id="password"
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => set('password', v)}
                    error={errors.password}
                    autoComplete="new-password"
                    hint="At least eight characters."
                  />
                  <TextField
                    id="confirm"
                    label="Confirm password"
                    type="password"
                    value={form.confirm}
                    onChange={(v) => set('confirm', v)}
                    error={errors.confirm}
                    autoComplete="new-password"
                  />

                  {isRetailer && (
                    <fieldset className="min-w-0">
                      <legend className="font-label text-sm font-medium">
                        Brands this login may publish
                      </legend>
                      {errors.brands && (
                        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
                          {errors.brands}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {BRAND_CHOICES.map((b) => {
                          const on = form.brands.includes(b)
                          return (
                            <label
                              key={b}
                              className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm ${
                                on ? 'border-teal bg-teal-soft text-teal-deep' : 'border-border text-muted-foreground'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() =>
                                  set(
                                    'brands',
                                    on ? form.brands.filter((x) => x !== b) : [...form.brands, b],
                                  )
                                }
                                className="size-4 accent-teal"
                              />
                              {b}
                            </label>
                          )
                        })}
                      </div>

                      <p className="mt-3 font-label text-sm font-medium">Stores</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {STORE_CHOICES.map((s) => {
                          const on = form.stores.includes(s)
                          return (
                            <label
                              key={s}
                              className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm ${
                                on ? 'border-teal bg-teal-soft text-teal-deep' : 'border-border text-muted-foreground'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() =>
                                  set('stores', on ? form.stores.filter((x) => x !== s) : [...form.stores, s])
                                }
                                className="size-4 accent-teal"
                              />
                              {s}
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  className="mt-5 h-11 w-full bg-teal px-5 text-teal-foreground hover:bg-teal-deep"
                >
                  {pending
                    ? 'Saving…'
                    : `Create ${role === 'customer' ? 'individual' : ROLE_LABEL[role].toLowerCase()} access`}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  By creating access you agree a shop may contact you about a quote you asked for.
                  Sending your details is always your choice at the moment you ask.
                </p>
              </form>
            ) : (
              <form noValidate onSubmit={onSignIn} className="mt-5">
                <h2 className="font-display text-xl font-bold">Sign in</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Your account opens the page for its level — customer, retailer or admin.
                </p>
                <div className="mt-4 grid min-w-0 gap-4">
                  <TextField
                    id="signin-email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set('email', v)}
                    autoComplete="username"
                  />
                  <TextField
                    id="signin-password"
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => set('password', v)}
                    autoComplete="current-password"
                    error={signInError ?? undefined}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending}
                  className="mt-5 h-11 w-full bg-teal px-5 text-teal-foreground hover:bg-teal-deep"
                >
                  {pending ? 'Checking…' : 'Sign in'}
                </Button>

                <div className="mt-5 rounded-lg border border-border bg-secondary p-3">
                  <p className="font-label text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    Sample logins
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Two accounts exist so the retailer and admin pages can be seen without creating
                    anything. Both passwords are <span className="font-mono">sample</span>.
                  </p>
                  <div className="mt-2 grid gap-1.5">
                    {[
                      { label: 'Retailer', ...DEMO_RETAILER },
                      { label: 'Admin', ...DEMO_ADMIN },
                    ].map((demo) => (
                      <button
                        key={demo.email}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, email: demo.email, password: demo.password }))
                          setSignInError(null)
                        }}
                        className="min-h-11 rounded-md border border-border bg-card px-2.5 py-1.5 text-left"
                      >
                        <span className="block text-xs font-medium">{demo.label}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {demo.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/" className="underline decoration-border underline-offset-2">
                Back to comparing prices
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  error,
  hint,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: string
  error?: string
  hint?: string
  autoComplete?: string
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="font-label text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="field mt-1 h-11"
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
