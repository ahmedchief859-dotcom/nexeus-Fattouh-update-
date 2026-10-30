'use client'

import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace'

export function WorkspaceClient({ initialView }: { initialView: string }) {
  async function logout() {
    await fetch('/api/auth/session', { method: 'DELETE' })
    window.location.assign('/auth/login')
  }

  return <DashboardWorkspace initialView={initialView} onLogout={() => void logout()} />
}