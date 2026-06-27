'use client'
import { useState, useEffect } from 'react'
import { getAuth } from '@/lib/auth'

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const { loggedIn, role } = getAuth()
    const path = window.location.pathname
    if (path === '/login') { setStatus('ok'); return }
    if (!loggedIn) { setStatus('redirecting'); window.location.replace('/login'); return }
    if (role === 'client' && path !== '/client') { setStatus('redirecting'); window.location.replace('/client'); return }

    // Owner-only areas — defense in depth (server also enforces via OwnerGuard)
    const ownerRoles = ['owner', 'super_admin', 'admin', 'agency_admin']
    const isOwner = ownerRoles.includes(String(role || '').toLowerCase())
    if ((path.startsWith('/admin') || path.startsWith('/agency')) && !isOwner) {
      setStatus('redirecting'); window.location.replace('/dashboard'); return
    }
    setStatus('ok')
  }, [])

  if (status === 'loading') return (
    <div style={{background:'#07090f', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif'}}>
      <div style={{fontSize:'22px', fontWeight:'900', letterSpacing:'-0.5px', color:'#e2e8f0'}}>
        Hayya<span style={{color:'#00e5a0'}}> AI</span>
      </div>
    </div>
  )
  if (status === 'redirecting') return null
  return children
}
