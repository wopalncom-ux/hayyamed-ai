import LoginForm from '@/components/auth/LoginForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'Log in — Hayya AI',
  alternates: alternatesFor('en', '/login'),
  // Account screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <LoginForm locale="en" />
}
