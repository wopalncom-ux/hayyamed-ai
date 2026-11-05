import LoginForm from '@/components/auth/LoginForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'تسجيل الدخول — Hayya AI',
  alternates: alternatesFor('ar', '/login'),
  // Account screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <LoginForm locale="ar" />
}
