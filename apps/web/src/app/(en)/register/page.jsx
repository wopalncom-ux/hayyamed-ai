import RegisterForm from '@/components/auth/RegisterForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'Create your account — Hayya AI',
  description: 'Sign up for Hayya AI: AI agents for WhatsApp and Instagram, an omnichannel inbox and CRM, built in Doha, Qatar.',
  alternates: alternatesFor('en', '/register'),
}

export default function Page() {
  return <RegisterForm locale="en" />
}
