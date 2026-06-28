'use client'
import { useState } from 'react'

const Menu = ({ size = 26 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>)
const X = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>)

const jakarta = 'var(--font-jakarta), system-ui, sans-serif'
const GOLD = '#D8B16A'

// Client island: the mobile hamburger + full-screen overlay menu only.
export default function HeroMenu({ nav = [] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button aria-label="Menu" onClick={() => setOpen(true)} className="hai-burger"
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><Menu /></button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(7,11,10,0.97)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px' }}>
            <button aria-label="Close" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
            {nav.map(n => (
              <a key={n.label} href={n.href} onClick={() => setOpen(false)} style={{ fontFamily: jakarta, fontWeight: 800, fontSize: '22px', letterSpacing: '0.06em', color: '#fff', textDecoration: 'none' }}>{n.label}</a>
            ))}
            <a href="/register" onClick={() => setOpen(false)} style={{ fontFamily: jakarta, fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', background: GOLD, color: '#070b0a', padding: '14px 28px', borderRadius: '999px', textDecoration: 'none', marginTop: '12px' }}>Start Building</a>
          </div>
        </div>
      )}
    </>
  )
}
