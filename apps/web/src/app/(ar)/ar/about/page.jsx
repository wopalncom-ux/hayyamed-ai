import AboutPage from '@/components/site/AboutPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'من نحن — Hayya AI من تطوير وتشغيل هيّا ميد للذكاء الاصطناعي'
const description = 'Hayya AI من تطوير وتشغيل شركة هيّا ميد للذكاء الاصطناعي، المتخصصة في حلول الذكاء الاصطناعي والتقنيات المؤسسية في الدوحة، قطر. أسّسها عباس المصري. وُلدت في قطر، أثبتت جدارتها في الخليج، جاهزة للعالم.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('ar', '/about'),
  openGraph: pageOpenGraph('ar', { title, description, url: '/ar/about' }),
}

export default function ArabicAbout() {
  return <AboutPage locale="ar" />
}
