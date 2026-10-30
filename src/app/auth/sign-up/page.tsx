import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/SignupForm'
import { getCurrentUser } from '@/lib/auth'

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect('/home')
  return <SignupForm />
}