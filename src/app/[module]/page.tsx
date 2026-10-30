import { notFound, redirect } from 'next/navigation'
import { WorkspaceClient } from '@/components/auth/WorkspaceClient'
import { getCurrentUser } from '@/lib/auth'

const moduleRoutes: Record<string, string> = {
  home: 'home',
  'store-management': 'store',
  sales: 'sales',
  inventory: 'inventory',
  customers: 'customers',
  accounting: 'accounting',
  reports: 'reports',
  suppliers: 'suppliers',
  employees: 'employees',
  branches: 'branches',
  billing: 'invoices',
  subscription: 'subscription',
  settings: 'settings',
}

export default async function WorkspaceModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const initialView = moduleRoutes[module]
  if (!initialView) notFound()
  if (!(await getCurrentUser())) redirect('/auth/login')
  return <WorkspaceClient initialView={initialView} />
}