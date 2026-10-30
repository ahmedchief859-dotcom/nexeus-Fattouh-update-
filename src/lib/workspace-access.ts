import 'server-only'

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getCurrentUser, WORKSPACE_COOKIE, sessionSecret, verifyCredential } from '@/lib/auth'
import { db } from '@/lib/db'

export async function workspaceCookieIsValid() {
  const value = (await cookies()).get(WORKSPACE_COOKIE)?.value
  if (!value) return false
  const [expiresText, signature] = value.split('.')
  const expiresAt = Number(expiresText)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000 || !signature) return false
  const expected = createHmac('sha256', sessionSecret()).update(`workspace:${expiresAt}`).digest()
  const received = Buffer.from(signature, 'base64url')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function createWorkspaceCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12
  const signature = createHmac('sha256', sessionSecret()).update(`workspace:${expiresAt}`).digest('base64url')
  return { value: `${expiresAt}.${signature}`, expires: new Date(expiresAt * 1000) }
}

export async function verifyWorkspacePin(pin: string, ipAddress: string) {
  const configuredHash = process.env.NEXORA_WORKSPACE_PIN_HASH
  if (!configuredHash) throw new Error('NEXORA_WORKSPACE_PIN_HASH is not configured.')

  const ipHash = createHmac('sha256', sessionSecret()).update(ipAddress).digest('hex')
  const existing = db.prepare('SELECT attempts, locked_until FROM workspace_pin_attempts WHERE ip_hash = ?')
    .get(ipHash) as { attempts: number; locked_until: string | null } | undefined
  if (existing?.locked_until && existing.locked_until > new Date().toISOString()) return { valid: false, locked: true }

  const valid = await verifyCredential(pin, configuredHash)
  const now = new Date().toISOString()
  if (valid) {
    db.prepare('DELETE FROM workspace_pin_attempts WHERE ip_hash = ?').run(ipHash)
    return { valid: true, locked: false }
  }

  const attempts = existing?.attempts ?? 0
  const nextAttempts = attempts + 1
  const lockedUntil = nextAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
  db.prepare(`
    INSERT INTO workspace_pin_attempts (ip_hash, attempts, locked_until, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(ip_hash) DO UPDATE SET attempts = excluded.attempts, locked_until = excluded.locked_until, updated_at = excluded.updated_at
  `).run(ipHash, nextAttempts, lockedUntil, now)
  return { valid: false, locked: Boolean(lockedUntil) }
}

export async function authorizeWorkspaceUser() {
  if (!(await workspaceCookieIsValid())) return { error: 'Workspace access is required.', status: 403 as const, user: null }
  const user = await getCurrentUser()
  if (!user) return { error: 'Sign in is required.', status: 401 as const, user: null }
  return { error: null, status: 200 as const, user }
}