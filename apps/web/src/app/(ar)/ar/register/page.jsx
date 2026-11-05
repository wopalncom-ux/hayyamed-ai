import RegisterForm from '@/components/auth/RegisterForm'
import { alternatesFor } from '@/lib/i18n'

export const metadata = {
  title: 'أنشئ حسابك — Hayya AI',
  description: 'سجّل في Hayya AI: وكلاء ذكاء اصطناعي لواتساب وإنستغرام، وصندوق وارد موحّد، ونظام CRM، من تطوير شركة في الدوحة، قطر.',
  alternates: alternatesFor('ar', '/register'),
}

export default function Page() {
  return <RegisterForm locale="ar" />
}
