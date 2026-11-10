import { useSyncExternalStore } from 'react'
import {
  loadAccounts,
  loadSession,
  saveSession,
  updateAccount,
  type Account,
  type Session,
} from '@/data/accounts'

/* One store for the whole app: the accounts saved in this browser and the
   session held in this tab's localStorage. Every page reads it through
   useAccounts(), so a edit on the retailer page shows on the market page in the
   same tab without a reload. */

let session: Session = loadSession()
let accounts: Account[] = loadAccounts()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAccounts() {
  return accounts
}

export function getSession() {
  return session
}

export function refreshAccounts() {
  accounts = loadAccounts()
  emit()
}

export function setSession(next: Session) {
  saveSession(next)
  session = next
  accounts = loadAccounts()
  emit()
}

export function currentAccount(): Account | undefined {
  const id = session?.accountId
  if (!id) return undefined
  return accounts.find((a) => a.id === id)
}

export function useAccounts() {
  return useSyncExternalStore(subscribe, getAccounts, getAccounts)
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

export function useCurrentAccount(): Account | undefined {
  const s = useSession()
  const list = useAccounts()
  if (!s) return undefined
  return list.find((a) => a.id === s.accountId)
}

export function signOut() {
  setSession(null)
}

/** Wraps a change that writes accounts, so every subscriber re-reads them. */
export function withAccounts(fn: () => void) {
  fn()
  refreshAccounts()
}

export { updateAccount }
