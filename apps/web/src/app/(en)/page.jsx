import HomePage from '@/components/site/HomePage'
import { alternatesFor } from '@/lib/i18n'
import { pageOpenGraph } from '@/lib/site-shell'

export const metadata = {
  title: 'Hayya AI — AI-Powered CRM for Qatar & GCC',
  description: 'WhatsApp, Instagram, Facebook, website chat and Email omnichannel CRM with AI agents, automated replies, lead scoring, and campaign management. Built for Qatar and GCC businesses.',
  alternates: alternatesFor('en', '/'),
  openGraph: pageOpenGraph('en', {
    title: 'Hayya AI — AI-Powered CRM for Qatar & GCC',
    description: 'Automate customer conversations with AI. Manage leads, campaigns, and bookings across WhatsApp, Instagram, and email.',
    url: '/',
  }),
}

export default function LandingPage() {
  return <HomePage locale="en" />
}
