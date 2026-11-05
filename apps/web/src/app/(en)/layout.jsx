import { Inter, Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google'
import AuthGuard from '@/components/AuthGuard'
import PwaProvider from '@/components/PwaProvider'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'
import { rootMetadata, rootJsonLd, viewport as VIEWPORT, GLOBAL_CSS } from '@/lib/site-shell'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-serif', display: 'swap' })

export const metadata = rootMetadata('en')
export const viewport = VIEWPORT

const JSONLD = rootJsonLd('en')

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${serif.variable}`}>
      <head>
        {/* Warm up the connections used by the hero video + API (LCP/CWV) */}
        <link rel="preconnect" href="https://stream.mux.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        <link rel="preconnect" href="https://api.hayyaai.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <WhatsAppFloatButton />
        <PwaProvider />
      </body>
    </html>
  )
}
