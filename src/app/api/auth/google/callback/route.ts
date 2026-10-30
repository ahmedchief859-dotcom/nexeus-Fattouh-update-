import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { createOrganizationUser, createSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { workspaceCookieIsValid } from '@/lib/workspace-access'

export const runtime = 'nodejs'
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('nexora_oauth_state')?.value
  const nonceCookie = cookieStore.get('nexora_oauth_nonce')?.value
  const state = requestUrl.searchParams.get('state')
  const code = requestUrl.searchParams.get('code')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const callback = process.env.GOOGLE_REDIRECT_URI ?? new URL('/api/auth/google/callback', request.url).toString()
  const fail = () => NextResponse.redirect(new URL('/auth/login?error=google_failed', request.url))

  cookieStore.delete('nexora_oauth_state')
  cookieStore.delete('nexora_oauth_nonce')
  if (!clientId || !clientSecret || !stateCookie || state !== stateCookie || !nonceCookie || !code) return fail()
  if (!(await workspaceCookieIsValid())) return NextResponse.redirect(new URL('/', request.url))

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callback, grant_type: 'authorization_code' }),
      cache: 'no-store',
    })
    if (!tokenResponse.ok) return fail()
    const tokens = await tokenResponse.json() as { id_token?: string }
    if (!tokens.id_token) return fail()
    const { payload } = await jwtVerify(tokens.id_token, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    })
    const claims = payload as typeof payload & { email?: string; email_verified?: boolean; name?: string; nonce?: string }
    if (!claims.sub || !claims.email || claims.email_verified !== true || claims.nonce !== nonceCookie) return fail()

    const existing = db.prepare('SELECT id, google_subject FROM users WHERE email = ?')
      .get(claims.email.toLowerCase()) as { id: string; google_subject: string | null } | undefined
    let userId: string
    if (existing) {
      if (existing.google_subject && existing.google_subject !== claims.sub) return fail()
      db.prepare('UPDATE users SET google_subject = ? WHERE id = ?').run(claims.sub, existing.id)
      userId = existing.id
    } else {
      userId = createOrganizationUser({ name: claims.name || claims.email.split('@')[0], email: claims.email, googleSubject: claims.sub })
    }
    await createSession(userId)
    return NextResponse.redirect(new URL('/home', request.url))
  } catch {
    return fail()
  }
}