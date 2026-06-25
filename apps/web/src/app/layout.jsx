import AuthGuard from '@/components/AuthGuard'
import PwaProvider from '@/components/PwaProvider'

export const metadata = {
  title: 'Hayyamed AI — Business Operating System',
  description: 'AI-powered CRM, automation, and omnichannel Business Operating System.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hayyamed AI',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
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
      <body>
        <AuthGuard>{children}</AuthGuard>
        <PwaProvider />
      </body>
    </html>
  )
}
