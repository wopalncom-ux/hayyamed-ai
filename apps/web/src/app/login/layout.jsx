export const metadata = {
  title: 'Log in — Hayya AI',
  alternates: { canonical: '/login' },
  // Login screens have no search value; keep them out of the index.
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }) {
  return children
}
