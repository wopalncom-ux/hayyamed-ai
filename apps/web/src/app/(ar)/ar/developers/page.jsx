import DevelopersPage from '@/components/site/DevelopersPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'واجهة API والـ Webhooks للمطوّرين — Hayya AI'
const description = 'اربط Hayya AI بأنظمتك: أضِف العملاء المحتملين عبر REST API، واستقبل أحداث الـ Webhooks لحظياً.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('ar', '/developers'),
  openGraph: pageOpenGraph('ar', { title, description, url: '/ar/developers' }),
}

export default function ArabicDevelopers() {
  return <DevelopersPage locale="ar" />
}
