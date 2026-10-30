'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State { return { hasError: true } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nexora] dashboard module failed', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main className="min-h-screen bg-nexora flex items-center justify-center p-6">
        <section className="glass-strong max-w-md rounded-2xl p-8 text-center">
          <p className="eyebrow">NEXORA RECOVERY MODE</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">This module needs a refresh</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">Your session is safe. Reload the workspace to restore the affected view.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-nexora-accent px-4 py-2 font-semibold text-nexora-deep">Reload workspace</button>
        </section>
      </main>
    )
  }
}
