import { Inter, Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import AuthGuard from '@/components/AuthGuard'
import PwaProvider from '@/components/PwaProvider'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'
import { rootMetadata, rootJsonLd, viewport as VIEWPORT, GLOBAL_CSS, ARABIC_CSS } from '@/lib/site-shell'

// Arabic root layout: every page under /ar renders with lang="ar" dir="rtl"
// and an Arabic typeface. Latin fonts stay loaded for brand names, numbers
// and code inside Arabic text.
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'], variable: '--font-arabic', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' })

export const metadata = rootMetadata('ar')
export const viewport = VIEWPORT

const JSONLD = rootJsonLd('ar')

export default function ArabicRootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${inter.variable} ${jakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://stream.mux.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        <link rel="preconnect" href="https://api.hayyaai.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + ARABIC_CSS }} />
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <WhatsAppFloatButton />
        <PwaProvider />
      </body>
    </html>
  )
}
