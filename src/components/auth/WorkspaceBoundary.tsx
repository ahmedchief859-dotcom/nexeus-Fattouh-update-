import type { ReactNode } from 'react'
import { SecurityGate } from '@/components/auth/SecurityGate'
import { workspaceCookieIsValid } from '@/lib/workspace-access'

export async function WorkspaceBoundary({ children }: { children: ReactNode }) {
  if (!(await workspaceCookieIsValid())) return <SecurityGate />
  return children
}