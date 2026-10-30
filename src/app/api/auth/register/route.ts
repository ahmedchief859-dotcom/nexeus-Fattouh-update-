import { createSession, createOrganizationUser, hashCredential, WORKSPACE_COOKIE } from '@/lib/auth'
import { workspaceCookieIsValid } from '@/lib/workspace-access'
import { db } from '@/lib/db'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  if (!(await workspaceCookieIsValid())) return errorResponse('Workspace access is required.', 403)
  let body: { name?: unknown; email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (name.length < 2 || name.length > 100) return errorResponse('Enter a name between 2 and 100 characters.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return errorResponse('Enter a valid email address.')
  if (password.length < 12 || password.length > 128) return errorResponse('Use a password between 12 and 128 characters.')

  try {
    const userId = createOrganizationUser({ name, email, passwordHash: await hashCredential(password) })
    await createSession(userId)
    return jsonResponse({ ok: true }, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) return errorResponse('An account already exists for this email.', 409)
    return errorResponse('The account could not be created.', 500)
  }
}