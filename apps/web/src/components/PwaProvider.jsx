'use client'
import { useEffect, useState } from 'react'

// Registers the service worker and renders a premium "Install App" prompt.
// Remembers the user's choice (dismissed/installed) in localStorage.
export default function PwaProvider() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const dismissed = localStorage.getItem('hayyamed_pwa_choice')
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      if (!dismissed) setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    localStorage.setItem('hayyamed_pwa_choice', outcome === 'accepted' ? 'installed' : 'dismissed')
    setShow(false); setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem('hayyamed_pwa_choice', 'dismissed')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, width: 'calc(100% - 32px)', maxWidth: '420px' }}>
      <div style={{ background: '#0f1622', border: '1px solid #1e2d42', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 20px 50px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📲</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#e8eef5' }}>Install Hayyamed AI</div>
          <div style={{ fontSize: '12px', color: '#7a8fa6', marginTop: '2px' }}>Add to your home screen for a faster, app-like experience.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
          <button onClick={install} style={{ padding: '8px 16px', background: '#00e5a0', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Install</button>
          <button onClick={dismiss} style={{ padding: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>Not now</button>
        </div>
      </div>
    </div>
  )
}
