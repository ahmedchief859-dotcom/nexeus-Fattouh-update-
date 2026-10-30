import { clearSession, getCurrentUser } from '@/lib/auth'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  return jsonResponse({ user: user ? { id: user.id, name: user.name, email: user.email, organization: user.organization_name } : null })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  await clearSession()
  return jsonResponse({ ok: true })
}