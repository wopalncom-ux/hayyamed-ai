import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'تعيين كلمة مرور جديدة — Hayya AI',
  alternates: alternatesFor('ar', '/reset-password'),
  // Account screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ResetPasswordForm locale="ar" />
}
