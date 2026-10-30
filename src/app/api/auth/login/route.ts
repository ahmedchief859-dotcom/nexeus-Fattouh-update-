import { createSession, findUserByEmail, verifyCredential } from '@/lib/auth'
import { workspaceCookieIsValid } from '@/lib/workspace-access'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  if (!(await workspaceCookieIsValid())) return errorResponse('Workspace access is required.', 403)
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password || password.length > 128) return errorResponse('Email or password is incorrect.', 401)
  const user = findUserByEmail(email)
  if (!user?.password_hash || !(await verifyCredential(password, user.password_hash))) {
    return errorResponse('Email or password is incorrect.', 401)
  }
  await createSession(user.id)
  return jsonResponse({ ok: true })
}