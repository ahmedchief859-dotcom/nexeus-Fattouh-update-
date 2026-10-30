'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

export function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error ?? 'The account could not be created.')
        return
      }
      window.location.assign('/home')
    } catch {
      setError('The local authentication service is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="signup-title">
        <div className="brand-mark">N</div>
        <p className="eyebrow">NEXORA BUSINESS OS</p>
        <h1 id="signup-title">Create your workspace</h1>
        <p className="auth-subtitle">Your organization and records stay in your local database.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="signup-name">Full name</label>
          <input id="signup-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
          <label htmlFor="signup-email">Work email</label>
          <input id="signup-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link href="/auth/login">Sign in</Link></p>
      </section>
    </main>
  )
}