import 'server-only'

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return request.headers.get('sec-fetch-site') === 'same-origin'
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function jsonResponse<T>(data: T, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}