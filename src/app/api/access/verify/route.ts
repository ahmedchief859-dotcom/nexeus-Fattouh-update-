import { cookies } from 'next/headers'
import { WORKSPACE_COOKIE } from '@/lib/auth'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'
import { createWorkspaceCookie, verifyWorkspacePin } from '@/lib/workspace-access'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  let body: { pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  if (typeof body.pin !== 'string' || body.pin.length < 4 || body.pin.length > 128) {
    return errorResponse('Enter a valid workspace PIN.')
  }

  try {
    const ipAddress = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const result = await verifyWorkspacePin(body.pin, ipAddress)
    if (!result.valid) return errorResponse(result.locked ? 'Too many attempts. Try again in 15 minutes.' : 'The workspace PIN is incorrect.', result.locked ? 429 : 401)
    const token = createWorkspaceCookie()
    const cookieStore = await cookies()
    cookieStore.set(WORKSPACE_COOKIE, token.value, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: token.expires,
    })
    return jsonResponse({ ok: true })
  } catch (error) {
    const message = error instanceof Error && error.message.includes('not configured')
      ? 'Workspace access is not configured by the administrator.'
      : 'Workspace access could not be verified.'
    return errorResponse(message, 503)
  }
}