import AuthGuard from '@/components/AuthGuard'
import PwaProvider from '@/components/PwaProvider'

const SITE = 'https://www.hayyaai.com'
const DESC = 'Hayya AI is an AI customer-engagement platform: WhatsApp & Instagram AI agents, an omnichannel inbox, CRM, and automation. Built & operated by Hayya Med AI in Doha, Qatar.'

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Hayya AI — AI Agents for WhatsApp, Instagram & CRM',
    template: '%s · Hayya AI',
  },
  description: DESC,
  keywords: [
    'AI agent', 'WhatsApp AI', 'Instagram DM automation', 'AI chatbot Qatar',
    'omnichannel inbox', 'CRM Qatar', 'customer engagement AI', 'GCC AI platform',
    'WhatsApp Business API', 'AI customer support', 'Hayya AI', 'Hayya Med AI',
  ],
  authors: [{ name: 'Hayya Med AI', url: 'https://hayyamed.ai' }],
  creator: 'Hayya Med AI',
  publisher: 'Hayya Med AI',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE,
    siteName: 'Hayya AI',
    title: 'Hayya AI — AI Agents for WhatsApp, Instagram & CRM',
    description: DESC,
    images: [{ url: '/logo.svg', width: 1200, height: 630, alt: 'Hayya AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hayya AI — AI Agents for WhatsApp, Instagram & CRM',
    description: DESC,
    images: ['/logo.svg'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Hayya AI' },
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
}

// Structured data (JSON-LD) for rich search results.
const JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'Hayya AI',
      url: SITE,
      logo: `${SITE}/logo.svg`,
      parentOrganization: { '@type': 'Organization', name: 'Hayya Med AI', url: 'https://hayyamed.ai' },
      founder: { '@type': 'Person', name: 'Abbas Al Masri' },
      foundingDate: '2025',
      email: 'abbas@hayyamed.ai',
      telephone: '+974 3367 7333',
      address: { '@type': 'PostalAddress', addressLocality: 'Doha', addressCountry: 'QA' },
      areaServed: ['QA', 'GCC', 'MENA'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Hayya AI',
      publisher: { '@id': `${SITE}/#org` },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Hayya AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description: DESC,
      offers: { '@type': 'Offer', price: '150', priceCurrency: 'QAR' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '37' },
    },
  ],
}

export const viewport = {
  themeColor: '#07090f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <PwaProvider />
      </body>
    </html>
  )
}
