import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { workspaceCookieIsValid } from '@/lib/workspace-access'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/auth/login?error=google_unconfigured', request.url))
  if (!(await workspaceCookieIsValid())) return NextResponse.redirect(new URL('/', request.url))

  const state = randomBytes(32).toString('base64url')
  const nonce = randomBytes(32).toString('base64url')
  const callback = process.env.GOOGLE_REDIRECT_URI ?? new URL('/api/auth/google/callback', request.url).toString()
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorization.searchParams.set('client_id', clientId)
  authorization.searchParams.set('redirect_uri', callback)
  authorization.searchParams.set('response_type', 'code')
  authorization.searchParams.set('scope', 'openid email profile')
  authorization.searchParams.set('state', state)
  authorization.searchParams.set('nonce', nonce)

  const response = NextResponse.redirect(authorization)
  for (const [name, value] of [['nexora_oauth_state', state], ['nexora_oauth_nonce', nonce]] as const) {
    response.cookies.set(name, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/google/callback',
      maxAge: 300,
    })
  }
  return response
}