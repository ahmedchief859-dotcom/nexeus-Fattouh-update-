import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { getCurrentUser } from '@/lib/auth'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect('/home')
  const { error } = await searchParams
  const notice = error === 'google_unconfigured'
    ? 'Google sign-in requires administrator OAuth credentials.'
    : error === 'google_failed'
      ? 'Google sign-in could not be completed.'
      : undefined
  return <LoginForm notice={notice} />
}