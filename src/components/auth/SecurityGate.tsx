'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SecurityGate() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error ?? 'Workspace access could not be verified.')
        setPin('')
        return
      }
      router.refresh()
    } catch {
      setError('The local access service is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="security-gate-title">
        <div className="brand-mark">N</div>
        <p className="eyebrow">NEXORA SECURE ACCESS</p>
        <h1 id="security-gate-title">Verify workspace access</h1>
        <p className="auth-subtitle">Enter the administrator-provided workspace PIN to continue.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="workspace-pin">Security PIN</label>
          <input
            autoFocus
            autoComplete="current-password"
            id="workspace-pin"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Enter workspace PIN"
            aria-invalid={Boolean(error)}
            disabled={loading}
            required
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Continue securely'}</button>
        </form>
        <p className="auth-footer">Authorized workspace personnel only.</p>
      </section>
    </main>
  )
}