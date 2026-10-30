import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { errorResponse, isSameOrigin, jsonResponse } from '@/lib/http'
import { authorizeWorkspaceUser } from '@/lib/workspace-access'

export const runtime = 'nodejs'

const resources = {
  branches: { table: 'branches', mutable: ['name', 'code', 'location', 'manager', 'status'] },
  inventory: { table: 'inventory', mutable: ['product_name', 'sku', 'category', 'stock', 'reorder_level', 'unit_price', 'branch_id'] },
  customers: { table: 'customers', mutable: ['name', 'email', 'phone'] },
  sales: { table: 'sales', mutable: [] },
  invoices: { table: 'invoices', mutable: ['status'] },
} as const

type ResourceName = keyof typeof resources
type RouteContext = { params: Promise<{ resource: string }> }
type JsonRecord = Record<string, unknown>

function parseLineItems(row: JsonRecord) {
  if (typeof row.line_items !== 'string') return row
  try {
    return { ...row, line_items: JSON.parse(row.line_items) }
  } catch {
    return { ...row, line_items: [] }
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function GET(request: Request, context: RouteContext) {
  const { resource } = await context.params
  if (!(resource in resources)) return errorResponse('Unknown resource.', 404)
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)

  const definition = resources[resource as ResourceName]
  const url = new URL(request.url)
  const branchId = url.searchParams.get('branchId')
  const table = definition.table
  const rows = branchId && (resource === 'inventory' || resource === 'sales')
    ? db.prepare(`SELECT * FROM ${table} WHERE organization_id = ? AND branch_id = ? ORDER BY created_at DESC LIMIT 500`).all(auth.user.organization_id, branchId)
    : db.prepare(`SELECT * FROM ${table} WHERE organization_id = ? ORDER BY created_at DESC LIMIT 500`).all(auth.user.organization_id)
  return jsonResponse(resource === 'invoices' ? rows.map((row) => parseLineItems(row as JsonRecord)) : rows)
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  const { resource } = await context.params
  if (!(resource in resources)) return errorResponse('Unknown resource.', 404)
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  if (!isRecord(body)) return errorResponse('Invalid record.')

  const organizationId = auth.user.organization_id
  const now = new Date().toISOString()
  const id = randomUUID()
  try {
    if (resource === 'branches') {
      const name = text(body.name, 100)
      const code = text(body.code, 32).toUpperCase()
      if (!name || !code) return errorResponse('Branch name and code are required.')
      db.prepare('INSERT INTO branches (id, organization_id, name, code, location, manager, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, organizationId, name, code, text(body.location, 160), text(body.manager, 100), now)
    } else if (resource === 'inventory') {
      const branchId = text(body.branch_id, 64)
      const productName = text(body.product_name, 160)
      const sku = text(body.sku, 64).toUpperCase()
      const stock = integer(body.stock)
      const reorderLevel = integer(body.reorder_level)
      const unitPrice = finiteNumber(body.unit_price)
      if (!branchOwned(organizationId, branchId)) return errorResponse('Select a branch in this workspace.')
      if (!productName || !sku || stock === null || stock < 0 || reorderLevel === null || reorderLevel < 0 || unitPrice === null || unitPrice < 0) {
        return errorResponse('Enter valid product, SKU, stock, reorder level, and price values.')
      }
      db.prepare('INSERT INTO inventory (id, organization_id, branch_id, product_name, sku, category, stock, reorder_level, unit_price, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, organizationId, branchId, productName, sku, text(body.category, 80) || 'General', stock, reorderLevel, unitPrice, now)
    } else if (resource === 'customers') {
      const name = text(body.name, 120)
      const email = text(body.email, 254).toLowerCase()
      if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return errorResponse('Enter a customer name and valid email address.')
      db.prepare('INSERT INTO customers (id, organization_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, organizationId, name, email, text(body.phone, 40), now)
    } else if (resource === 'sales') {
      const branchId = text(body.branch_id, 64)
      const productName = text(body.product_name, 160)
      const quantity = integer(body.quantity)
      const unitPrice = finiteNumber(body.unit_price)
      if (branchId && !branchOwned(organizationId, branchId)) return errorResponse('Select a branch in this workspace.')
      if (!productName || quantity === null || quantity < 1 || unitPrice === null || unitPrice < 0) return errorResponse('Enter a product, positive quantity, and valid unit price.')
      const total = Math.round(quantity * unitPrice * 100) / 100
      db.prepare('INSERT INTO sales (id, organization_id, branch_id, customer_name, product_name, category, quantity, unit_price, total, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, organizationId, branchId || null, text(body.customer_name, 120), productName, text(body.category, 80) || 'General', quantity, unitPrice, total, currency(body.currency), 'completed', now)
    } else if (resource === 'invoices') {
      const clientName = text(body.client_name, 120)
      const clientEmail = text(body.client_email, 254).toLowerCase()
      const currencyCode = currency(body.currency)
      const vatRate = finiteNumber(body.vat_rate)
      const inputItems = Array.isArray(body.line_items) ? body.line_items : []
      const lineItems = inputItems.map((item) => {
        if (!isRecord(item)) return null
        const name = text(item.name, 160)
        const qty = integer(item.qty)
        const unitPrice = finiteNumber(item.unitPrice)
        if (!name || qty === null || qty < 1 || unitPrice === null || unitPrice < 0) return null
        return { name, qty, unitPrice, total: Math.round(qty * unitPrice * 100) / 100 }
      })
      if (!clientName || !lineItems.length || lineItems.some((item) => item === null) || vatRate === null || vatRate < 0 || vatRate > 100) {
        return errorResponse('Enter a client, valid line items, and a VAT rate from 0 to 100.')
      }
      if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return errorResponse('Enter a valid client email address.')
      const subtotal = Math.round(lineItems.reduce((sum, item) => sum + (item?.total ?? 0), 0) * 100) / 100
      const vatAmount = Math.round(subtotal * vatRate) / 100
      const invoiceNumber = `NX-${new Date().getUTCFullYear()}-${id.slice(0, 8).toUpperCase()}`
      db.prepare('INSERT INTO invoices (id, organization_id, invoice_number, client_name, client_email, line_items, subtotal, vat_rate, vat_amount, total, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, organizationId, invoiceNumber, clientName, clientEmail, JSON.stringify(lineItems), subtotal, vatRate, vatAmount, subtotal + vatAmount, currencyCode, now)
      return jsonResponse({ id, invoice_number: invoiceNumber }, 201)
    }
    return jsonResponse({ id }, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) return errorResponse('A record with that identifier already exists.', 409)
    return errorResponse('The record could not be saved.', 500)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  const { resource } = await context.params
  if (!(resource in resources)) return errorResponse('Unknown resource.', 404)
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.')
  }
  if (!isRecord(body)) return errorResponse('Invalid update.')
  const id = text(body.id, 64)
  if (!id) return errorResponse('Record ID is required.')
  const definition = resources[resource as ResourceName]
  const updates: Array<[string, string | number]> = []
  for (const column of definition.mutable) {
    const value = body[column]
    if (value === undefined) continue
    if (column === 'stock' || column === 'reorder_level') {
      const number = integer(value)
      if (number === null || number < 0) return errorResponse('Stock values must be non-negative whole numbers.')
      updates.push([column, number])
    } else if (column === 'unit_price') {
      const number = finiteNumber(value)
      if (number === null || number < 0) return errorResponse('Unit price must be non-negative.')
      updates.push([column, number])
    } else if (column === 'status' && resource === 'invoices') {
      if (value !== 'draft' && value !== 'sent' && value !== 'paid' && value !== 'void') return errorResponse('Invalid invoice status.')
      updates.push([column, value])
    } else if (typeof value === 'string') {
      updates.push([column, value.trim().slice(0, 160)])
    }
  }
  if (!updates.length) return errorResponse('No supported fields to update.')
  if (resource === 'inventory' && typeof body.branch_id === 'string' && !branchOwned(auth.user.organization_id, body.branch_id)) return errorResponse('Select a branch in this workspace.')
  const setClause = updates.map(([column]) => `${column} = ?`).join(', ')
  const values = updates.map(([, value]) => value)
  if (resource === 'inventory') values.push(new Date().toISOString())
  const updated = db.prepare(`UPDATE ${definition.table} SET ${setClause}${resource === 'inventory' ? ', updated_at = ?' : ''} WHERE id = ? AND organization_id = ?`)
    .run(...values, id, auth.user.organization_id)
  return updated.changes ? jsonResponse({ ok: true }) : errorResponse('Record not found.', 404)
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return errorResponse('Request origin could not be verified.', 403)
  const { resource } = await context.params
  if (!(resource in resources)) return errorResponse('Unknown resource.', 404)
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)
  const id = new URL(request.url).searchParams.get('id')
  if (!id || id.length > 64) return errorResponse('Record ID is required.')
  const removed = db.prepare(`DELETE FROM ${resources[resource as ResourceName].table} WHERE id = ? AND organization_id = ?`)
    .run(id, auth.user.organization_id)
  return removed.changes ? jsonResponse({ ok: true }) : errorResponse('Record not found.', 404)
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function integer(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(number) ? number : null
}

function finiteNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function currency(value: unknown) {
  const allowed = ['USD', 'EUR', 'GBP', 'AED', 'SAR']
  return typeof value === 'string' && allowed.includes(value.toUpperCase()) ? value.toUpperCase() : 'USD'
}

function branchOwned(organizationId: string, branchId: string) {
  return Boolean(db.prepare('SELECT id FROM branches WHERE id = ? AND organization_id = ?').get(branchId, organizationId))
}