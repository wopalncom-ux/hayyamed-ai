import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'Set a new password — Hayya AI',
  alternates: alternatesFor('en', '/reset-password'),
  // Account screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ResetPasswordForm locale="en" />
}
