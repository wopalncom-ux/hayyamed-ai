'use client'
import { useState, useEffect } from 'react'
import NavSidebar from '@/components/NavSidebar'
import { api } from '@/lib/api'

const TYPE_META = {
  message:  { color:'#00e5a0', icon:'💬' },
  lead:     { color:'#3b82f6', icon:'👤' },
  campaign: { color:'#a78bfa', icon:'📣' },
  ai:       { color:'#f97316', icon:'🤖' },
  payment:  { color:'#00e5a0', icon:'💳' },
  alert:    { color:'#ef4444', icon:'⚠️' },
  booking:  { color:'#06b6d4', icon:'📅' },
  system:   { color:'#64748b', icon:'ℹ️' },
}

const toUiNotif = (n) => ({
  id:    n.id,
  type:  n.type?.toLowerCase() || 'system',
  title: n.title || 'Notification',
  body:  n.body || n.message || '',
  time:  n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }) : '',
  read:  !!n.readAt,
  color: TYPE_META[n.type?.toLowerCase()]?.color || '#64748b',
  icon:  TYPE_META[n.type?.toLowerCase()]?.icon  || 'ℹ️',
})

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([])
  const [filter,  setFilter]  = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getNotifications({ limit: 50 })
      .then(data => {
        const list = Array.isArray(data) ? data : data?.data || []
        setNotifs(list.map(toUiNotif))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await api.markNotificationRead(id) } catch {}
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    try { await api.markAllNotificationsRead() } catch {}
  }

  const filtered    = filter === 'all'    ? notifs
                    : filter === 'unread' ? notifs.filter(n => !n.read)
                    : notifs.filter(n => n.type === filter)
  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}> AI</span></div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/  Notifications</div>
        {unreadCount > 0 && <div style={{fontSize:'10px', padding:'3px 8px', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'10px', color:'#ef4444', fontWeight:'700'}}>{unreadCount} unread</div>}
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        <NavSidebar current="notifications" />

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {/* Filter bar */}
          <div style={{padding:'12px 20px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', gap:'8px', background:'#0c0f1a', flexShrink:0, flexWrap:'wrap'}}>
            {['all','unread','message','lead','campaign','ai','alert','payment'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{padding:'5px 12px', background: filter===f ? '#00e5a0' : '#111622', border:'1px solid', borderColor: filter===f ? '#00e5a0' : '#1a2235', borderRadius:'4px', color: filter===f ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: filter===f ? '700' : '400', textTransform:'capitalize'}}>
                {f}
              </button>
            ))}
            <div style={{marginLeft:'auto'}}>
              <button onClick={markAllRead}
                style={{padding:'5px 14px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontSize:'11px', cursor:'pointer', fontWeight:'600'}}>
                Mark all read
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div style={{flex:1, overflowY:'auto', padding:'16px'}}>
            {loading ? (
              <div style={{textAlign:'center', padding:'60px', color:'#3d4f63', fontSize:'12px'}}>Loading notifications…</div>
            ) : filtered.length === 0 ? (
              <div style={{textAlign:'center', padding:'60px', color:'#3d4f63'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>🔔</div>
                <div style={{fontSize:'14px'}}>No notifications</div>
              </div>
            ) : filtered.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{display:'flex', alignItems:'flex-start', gap:'14px', padding:'14px 16px', marginBottom:'8px', background: n.read ? '#0c0f1a' : '#0f1520', border:'1px solid', borderColor: n.read ? '#1a2235' : `${n.color}30`, borderRadius:'8px', cursor:'pointer', transition:'all .2s', borderLeft:`3px solid ${n.read ? '#1a2235' : n.color}`}}>
                <div style={{width:'38px', height:'38px', borderRadius:'8px', background:`${n.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{n.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px'}}>
                    <div style={{fontSize:'13px', fontWeight: n.read ? '400' : '600'}}>{n.title}</div>
                    <div style={{fontSize:'10px', color:'#3d4f63', flexShrink:0, marginLeft:'12px'}}>{n.time}</div>
                  </div>
                  <div style={{fontSize:'12px', color:'#7a8fa6', lineHeight:'1.5'}}>{n.body}</div>
                </div>
                {!n.read && <div style={{width:'8px', height:'8px', borderRadius:'50%', background:n.color, flexShrink:0, marginTop:'6px'}}></div>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
