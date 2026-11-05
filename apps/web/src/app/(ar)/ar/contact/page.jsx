import ContactPage from '@/components/site/ContactPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'تواصل معنا — Hayya AI'
const description = 'تواصل مع Hayya AI: احجز عرضاً توضيحياً، أو اطرح سؤالك، أو راسلنا عبر واتساب أو البريد الإلكتروني أو الهاتف. من تطوير وتشغيل هيّا ميد للذكاء الاصطناعي في الدوحة، قطر.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('ar', '/contact'),
  openGraph: pageOpenGraph('ar', { title, description, url: '/ar/contact' }),
}

export default function ArabicContact() {
  return <ContactPage locale="ar" />
}
