'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

export function LoginForm({ notice }: { notice?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(notice ?? '')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error ?? 'Email or password is incorrect.')
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
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark">N</div>
        <p className="eyebrow">NEXORA BUSINESS OS</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your local business workspace.</p>
        <a className="auth-google-button" href="/api/auth/google">Continue with Google</a>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="login-email">Work email</label>
          <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to dashboard'}</button>
        </form>
        <p className="auth-footer">New to Nexora? <Link href="/auth/sign-up">Create an account</Link></p>
      </section>
    </main>
  )
}