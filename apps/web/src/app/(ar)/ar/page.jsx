import HomePage from '@/components/site/HomePage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

export const metadata = {
  title: 'Hayya AI (هيّا AI) — نظام CRM بالذكاء الاصطناعي لقطر والخليج',
  description: 'نظام CRM متعدد القنوات لواتساب وإنستغرام وفيسبوك ودردشة الموقع والبريد الإلكتروني، مع وكلاء ذكاء اصطناعي يردّون تلقائياً بالعربية والإنجليزية، وتقييم للعملاء المحتملين، وإدارة للحملات. مصمَّم للشركات في قطر ودول الخليج.',
  alternates: alternatesFor('ar', '/'),
  openGraph: pageOpenGraph('ar', {
    title: 'Hayya AI (هيّا AI) — نظام CRM بالذكاء الاصطناعي لقطر والخليج',
    description: 'أتمِت محادثات عملائك بالذكاء الاصطناعي، وأدِر العملاء المحتملين والحملات والحجوزات عبر واتساب وإنستغرام والبريد الإلكتروني.',
    url: '/ar',
  }),
}

export default function ArabicLandingPage() {
  return <HomePage locale="ar" />
}
