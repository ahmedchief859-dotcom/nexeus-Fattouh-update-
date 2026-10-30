import 'server-only'

import { cookies } from 'next/headers'
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'nexora_session'
export const WORKSPACE_COOKIE = 'nexora_workspace'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

export interface SessionUser {
  id: string
  organization_id: string
  email: string
  name: string
  organization_name: string
}

function deriveSecret(value: string, salt: Buffer, cost: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(value, salt, 64, { N: cost, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, result) => {
      if (error) reject(error)
      else resolve(result as Buffer)
    })
  })
}

export async function hashCredential(value: string, cost = 32768) {
  const salt = randomBytes(16)
  const hash = await deriveSecret(value, salt, cost)
  return `scrypt$${cost}$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export async function verifyCredential(value: string, stored: string) {
  const [algorithm, costText, saltText, hashText] = stored.split('$')
  const cost = Number(costText)
  if (algorithm !== 'scrypt' || !Number.isInteger(cost) || cost < 16384 || cost > 65536 || !saltText || !hashText) return false
  try {
    const expected = Buffer.from(hashText, 'base64url')
    const actual = await deriveSecret(value, Buffer.from(saltText, 'base64url'), cost)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function sessionSecret() {
  const secret = process.env.NEXORA_SESSION_SECRET
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('NEXORA_SESSION_SECRET must contain at least 32 bytes.')
  }
  return secret
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  db.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(randomUUID(), userId, createHash('sha256').update(token).digest('hex'), expiresAt.toISOString(), now.toISOString())
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(createHash('sha256').update(token).digest('hex'))
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const row = db.prepare(`
    SELECT users.id, users.organization_id, users.email, users.name, organizations.name AS organization_name
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    JOIN organizations ON organizations.id = users.organization_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, new Date().toISOString()) as SessionUser | undefined
  if (!row) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash)
  return row ?? null
}

export function createOrganizationUser(input: { name: string; email: string; passwordHash?: string | null; googleSubject?: string | null }) {
  const organizationId = randomUUID()
  const userId = randomUUID()
  const now = new Date().toISOString()
  const create = db.transaction(() => {
    db.prepare('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)')
      .run(organizationId, `${input.name.trim()}'s Workspace`, now)
    db.prepare('INSERT INTO users (id, organization_id, email, name, password_hash, google_subject, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, organizationId, input.email.trim().toLowerCase(), input.name.trim(), input.passwordHash ?? null, input.googleSubject ?? null, now)
    db.prepare('INSERT INTO branches (id, organization_id, name, code, location, manager, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), organizationId, 'Head Office', 'HQ', '', input.name.trim(), now)
  })
  create()
  return userId
}

export function findUserByEmail(email: string) {
  return db.prepare('SELECT id, organization_id, email, name, password_hash FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as (SessionUser & { password_hash: string | null }) | undefined
}