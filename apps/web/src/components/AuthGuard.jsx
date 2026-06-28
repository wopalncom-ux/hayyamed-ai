'use client'
import { useEffect } from 'react'
import { getAuth } from '@/lib/auth'

// Public routes must server-render for SEO (and for everyone). Everything else
// is an authenticated app route. We ALWAYS render children so the HTML is
// server-rendered (critical for SEO + first paint); the auth check below runs
// on the client and redirects protected routes. Page data itself is fetched via
// authenticated API calls (Bearer token → 401 without a session), so an app
// shell briefly painting before redirect exposes no real data.
const PUBLIC = new Set([
  '/', '/about', '/developers', '/pricing',
  '/login', '/register', '/forgot-password', '/reset-password',
  '/terms', '/privacy', '/legal',
])
const isPublic = (p) => PUBLIC.has(p) || p.startsWith('/blog') || p.startsWith('/legal')

export default function AuthGuard({ children }) {
  useEffect(() => {
    const path = window.location.pathname
    if (isPublic(path)) return

    const { loggedIn, role } = getAuth()
    if (!loggedIn) { window.location.replace('/login'); return }
    if (role === 'client' && path !== '/client') { window.location.replace('/client'); return }

    // Owner-only areas — defense in depth (server also enforces via OwnerGuard)
    const ownerRoles = ['owner', 'super_admin', 'admin', 'agency_admin']
    const isOwner = ownerRoles.includes(String(role || '').toLowerCase())
    if ((path.startsWith('/admin') || path.startsWith('/agency')) && !isOwner) {
      window.location.replace('/dashboard')
    }
  }, [])

  return children
}
