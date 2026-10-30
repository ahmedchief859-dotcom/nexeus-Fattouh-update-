import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { WorkspaceBoundary } from '@/components/auth/WorkspaceBoundary'

export const metadata: Metadata = {
  title: 'Nexora Business OS',
  description: 'Real-time SaaS and ERP operations workspace for sales, inventory, invoices, and business intelligence.',
  generator: 'Nexora Systems',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WorkspaceBoundary>
          <ThemeProvider>
            <I18nProvider>{children}</I18nProvider>
          </ThemeProvider>
        </WorkspaceBoundary>
      </body>
    </html>
  )
}
