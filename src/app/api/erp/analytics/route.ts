import { db } from '@/lib/db'
import { errorResponse, jsonResponse } from '@/lib/http'
import { authorizeWorkspaceUser } from '@/lib/workspace-access'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await authorizeWorkspaceUser()
  if (!auth.user) return errorResponse(auth.error ?? 'Sign in is required.', auth.status)
  const organizationId = auth.user.organization_id
  const sales = db.prepare(`
    SELECT substr(created_at, 1, 10) AS date, SUM(total) AS total
    FROM sales WHERE organization_id = ? AND status = 'completed' AND created_at >= ?
    GROUP BY substr(created_at, 1, 10) ORDER BY date DESC LIMIT 14
  `).all(organizationId, new Date(Date.now() - 13 * 86400000).toISOString()) as Array<{ date: string; total: number }>
  const categoryRows = db.prepare(`
    SELECT category AS label, SUM(total) AS value FROM sales
    WHERE organization_id = ? AND status = 'completed'
    GROUP BY category ORDER BY value DESC
  `).all(organizationId) as Array<{ label: string; value: number }>
  const summary = db.prepare(`
    SELECT
      COALESCE((SELECT SUM(total) FROM sales WHERE organization_id = ? AND status = 'completed'), 0) AS revenue,
      (SELECT COUNT(*) FROM sales WHERE organization_id = ?) AS sale_count,
      (SELECT COUNT(*) FROM customers WHERE organization_id = ?) AS customer_count,
      COALESCE((SELECT SUM(stock) FROM inventory WHERE organization_id = ?), 0) AS stock_units
  `).get(organizationId, organizationId, organizationId, organizationId) as { revenue: number; sale_count: number; customer_count: number; stock_units: number }
  const dailyRevenue = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(Date.now() - (13 - index) * 86400000).toISOString().slice(0, 10)
    return { date, total: sales.find((row) => row.date === date)?.total ?? 0 }
  })
  const colors = ['#7ee8e8', '#a78bfa', '#f0abfc', '#fbbf24', '#34d399', '#fb7185']
  return jsonResponse({
    summary,
    dailyRevenue,
    categories: categoryRows.map((row, index) => ({ ...row, color: colors[index % colors.length] })),
  })
}