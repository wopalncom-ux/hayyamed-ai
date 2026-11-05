import ContactPage from '@/components/site/ContactPage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

const title = 'Contact — Hayya AI'
const description = 'Talk to Hayya AI. Book a demo, ask a question, or reach us by WhatsApp, email, or phone. Built and operated by Hayya Med AI in Doha, Qatar.'

export const metadata = {
  title,
  description,
  alternates: alternatesFor('en', '/contact'),
  openGraph: pageOpenGraph('en', { title, description, url: '/contact' }),
}

export default function Contact() {
  return <ContactPage locale="en" />
}
