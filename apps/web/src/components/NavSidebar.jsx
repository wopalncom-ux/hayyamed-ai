'use client'
import { useState, useEffect, useRef } from 'react'
import { getAuth, ROLE_NAV, logout } from '@/lib/auth'
import { api } from '@/lib/api'

const ALL_NAV = [
  { page:'dashboard',     href:'/dashboard',     icon:'⊞',  label:'Dashboard' },
  { page:'inbox',         href:'/inbox',         icon:'💬', label:'Inbox' },
  { page:'contacts',      href:'/contacts',      icon:'👥', label:'Contacts' },
  { page:'pipeline',      href:'/pipeline',      icon:'📊', label:'Pipeline' },
  { page:'sales',         href:'/sales',         icon:'💰', label:'Sales' },
  { page:'analytics',     href:'/analytics',     icon:'📈', label:'Analytics' },
  { page:'reports',       href:'/reports',       icon:'📑', label:'Reports' },
  { page:'campaigns',     href:'/campaigns',     icon:'📣', label:'Campaigns' },
  { page:'workflows',     href:'/workflows',     icon:'⚡', label:'Workflows' },
  { page:'agents',        href:'/agents',        icon:'🤖', label:'AI Agents' },
  { page:'knowledge',     href:'/knowledge',     icon:'🧠', label:'Knowledge' },
  { page:'bookings',      href:'/bookings',      icon:'📅', label:'Bookings' },
  { page:'chatbot',       href:'/chatbot',       icon:'🔀', label:'Chatbot' },
  { page:'notifications', href:'/notifications', icon:'🔔', label:'Notifications' },
  { page:'clients',       href:'/clients',       icon:'🏢', label:'Client AI Center' },
  { page:'agency',        href:'/agency',        icon:'🏬', label:'Agency' },
  { page:'marketplace',   href:'/marketplace',   icon:'🏪', label:'Marketplace' },
  { page:'integrations',  href:'/integrations',  icon:'🔌', label:'Integrations' },
  { page:'admin',         href:'/admin',         icon:'👑', label:'Admin' },
  { page:'settings',      href:'/settings',      icon:'⚙️', label:'Settings' },
]

// Floating toast that appears near the bell when a live event arrives
function LiveToast({ msg, visible }) {
  if (!msg || !visible) return null
  return (
    <div style={{
      position: 'fixed', left: '68px', top: '50%', transform: 'translateY(-50%)',
      background: '#111622', border: '1px solid rgba(216,177,106,.35)', borderRadius: '8px',
      padding: '10px 14px', zIndex: 9999, maxWidth: '240px', pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,.5)',
      animation: 'slideInLeft .2s ease',
    }}>
      <div style={{ fontSize: '11px', color: '#D8B16A', fontWeight: '700', marginBottom: '3px' }}>● LIVE</div>
      <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.4' }}>{msg}</div>
    </div>
  )
}

export default function NavSidebar({ current }) {
  const [allowed, setAllowed]   = useState(ALL_NAV.map(n => n.page))
  const [unread, setUnread]     = useState(0)
  const [flash, setFlash]       = useState(false)
  const [toast, setToast]       = useState(null)
  const [toastVisible, setToastVisible] = useState(false)
  const socketRef = useRef(null)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000)
  }

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  useEffect(() => {
    const auth = getAuth()
    const role = auth.role || 'owner'
    setAllowed(ROLE_NAV[role] || ROLE_NAV.owner)

    // Fetch initial unread notification count
    api.getNotifications({ limit: 50 })
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.data || [])
        const count = list.filter(n => !n.readAt).length
        setUnread(count)
      })
      .catch(() => {})

    if (!auth.accessToken) return

    // Real-time Socket.IO — only connect once (SSR-safe via dynamic import)
    let cancelled = false
    ;(async () => {
      try {
        const { io } = await import('socket.io-client')
        if (cancelled) return
        const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const socket = io(`${BASE}/ws`, {
          auth: { token: auth.accessToken },
          transports: ['websocket', 'polling'],
          reconnectionDelay: 3000,
          reconnectionAttempts: 5,
        })
        socketRef.current = socket

        socket.on('notification:new', (n) => {
          setUnread(prev => prev + 1)
          showToast(n?.title || n?.body || 'New notification')
          triggerFlash()
        })

        socket.on('lead:new', (contact) => {
          setUnread(prev => prev + 1)
          showToast(`New lead: ${contact?.name || contact?.phone || 'unknown'}`)
          triggerFlash()
        })

        socket.on('message:new', () => {
          // Only badge if not already in inbox
          if (window.location.pathname !== '/inbox') {
            setUnread(prev => prev + 1)
            triggerFlash()
          }
        })

        socket.on('campaign:progress', ({ campaignId, sent, failed, total }) => {
          if (sent && total && sent === total) {
            showToast(`Campaign complete — ${sent} messages sent`)
            triggerFlash()
          }
        })
      } catch { /* Socket unavailable — silent fail */ }
    })()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
    }
  }, [])

  // Clear badge when user visits notifications page
  useEffect(() => {
    if (current === 'notifications') setUnread(0)
    if (current === 'inbox') {
      // Don't clear all, just the message ones — approximate: do nothing
    }
  }, [current])

  return (
    <>
      <style>{`
        @keyframes bellShake {
          0%,100% { transform: rotate(0deg); }
          15%      { transform: rotate(15deg); }
          30%      { transform: rotate(-12deg); }
          45%      { transform: rotate(10deg); }
          60%      { transform: rotate(-8deg); }
          75%      { transform: rotate(5deg); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform: translateX(-10px) translateY(-50%); }
          to   { opacity:1; transform: translateX(0)    translateY(-50%); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:.5; }
        }
        /* Mobile: convert the left rail into a fixed bottom navigation bar */
        @media (max-width: 768px) {
          .hm-nav {
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            position: fixed !important;
            bottom: 0; left: 0; right: 0;
            border-right: none !important;
            border-top: 1px solid #1a2235;
            padding: 6px 8px calc(6px + env(safe-area-inset-bottom)) 8px !important;
            gap: 2px !important;
            overflow-x: auto;
            overflow-y: hidden;
            z-index: 1000;
            -webkit-overflow-scrolling: touch;
          }
          .hm-nav::-webkit-scrollbar { display: none; }
          .hm-nav-spacer { display: none !important; }
          body { padding-bottom: 64px; }
        }
      `}</style>

      <LiveToast msg={toast} visible={toastVisible} />

      <div className="hm-nav" style={{
        width: '56px', background: '#0c0f1a', borderRight: '1px solid #1a2235',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 0', gap: '4px', flexShrink: 0,
      }}>
        {ALL_NAV.filter(n => allowed.includes(n.page)).map(n => {
          const isActive = current === n.page
          const isBell   = n.page === 'notifications'
          const hasUnread = isBell && unread > 0

          return (
            <a key={n.href} href={n.href} title={n.label}
              style={{
                width: '40px', height: '40px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', textDecoration: 'none', position: 'relative',
                background: isActive ? 'rgba(216,177,106,.12)' : 'transparent',
                border: isActive ? '1px solid rgba(216,177,106,.2)' : '1px solid transparent',
                transition: 'background .15s, border-color .15s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <span style={{
                animation: isBell && flash ? 'bellShake .6s ease' : 'none',
                display: 'inline-block',
              }}>
                {n.icon}
              </span>

              {/* Unread badge on bell */}
              {hasUnread && (
                <span style={{
                  position: 'absolute', top: '5px', right: '5px',
                  minWidth: '14px', height: '14px',
                  background: '#ef4444', borderRadius: '7px',
                  fontSize: '9px', fontWeight: '800', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: '1',
                  boxShadow: '0 0 0 2px #0c0f1a',
                  animation: flash ? 'pulse .3s ease' : 'none',
                }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <span style={{
                  position: 'absolute', left: '-1px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px', height: '20px',
                  background: '#D8B16A', borderRadius: '0 2px 2px 0',
                }} />
              )}
            </a>
          )
        })}

        <div className="hm-nav-spacer" style={{ flex: 1 }} />

        {/* Logout */}
        <button onClick={logout} title="Log out"
          style={{
            width: '40px', height: '40px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', background: 'transparent', border: '1px solid transparent',
            cursor: 'pointer', opacity: 0.45, transition: 'all .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = 'rgba(239,68,68,.12)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '0.45'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}>
          🚪
        </button>
      </div>
    </>
  )
}
