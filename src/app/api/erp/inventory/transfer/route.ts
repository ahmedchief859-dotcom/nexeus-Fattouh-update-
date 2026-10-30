import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'
import { authorizeWorkspaceUser } from '@/lib/workspace-access'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)
  let body: { itemId?: unknown; toBranchId?: unknown; quantity?: unknown }
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  const itemId = typeof body.itemId === 'string' ? body.itemId : ''
  const toBranchId = typeof body.toBranchId === 'string' ? body.toBranchId : ''
  const quantity = Number(body.quantity)
  if (!itemId || !toBranchId || !Number.isSafeInteger(quantity) || quantity <= 0) return errorResponse('Enter a destination branch and positive whole-number quantity.')

  const transfer = db.transaction(() => {
    const source = db.prepare('SELECT * FROM inventory WHERE id = ? AND organization_id = ?').get(itemId, auth.user!.organization_id) as {
      id: string; branch_id: string; product_name: string; sku: string; category: string; stock: number; reorder_level: number; unit_price: number
    } | undefined
    if (!source || source.stock < quantity) return 'Insufficient stock or source item not found.'
    if (source.branch_id === toBranchId) return 'Choose a different destination branch.'
    const branch = db.prepare('SELECT id FROM branches WHERE id = ? AND organization_id = ?').get(toBranchId, auth.user!.organization_id)
    if (!branch) return 'Destination branch was not found.'
    db.prepare('UPDATE inventory SET stock = stock - ?, updated_at = ? WHERE id = ? AND organization_id = ?')
      .run(quantity, new Date().toISOString(), source.id, auth.user!.organization_id)
    const destination = db.prepare('SELECT id FROM inventory WHERE organization_id = ? AND branch_id = ? AND sku = ?')
      .get(auth.user!.organization_id, toBranchId, source.sku) as { id: string } | undefined
    if (destination) {
      db.prepare('UPDATE inventory SET stock = stock + ?, updated_at = ? WHERE id = ? AND organization_id = ?')
        .run(quantity, new Date().toISOString(), destination.id, auth.user!.organization_id)
    } else {
      db.prepare('INSERT INTO inventory (id, organization_id, branch_id, product_name, sku, category, stock, reorder_level, unit_price, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), auth.user!.organization_id, toBranchId, source.product_name, source.sku, source.category, quantity, source.reorder_level, source.unit_price, new Date().toISOString())
    }
    return null
  })()
  return transfer ? errorResponse(transfer) : jsonResponse({ ok: true })
}