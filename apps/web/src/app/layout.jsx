export const metadata = {
  title: 'Hayyamed AI',
  description: 'AI-powered CRM for Qatar',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}