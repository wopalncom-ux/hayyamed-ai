import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'Reset your password — Hayya AI',
  alternates: alternatesFor('en', '/forgot-password'),
  // Account screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ForgotPasswordForm locale="en" />
}
