'use client'
import { useState } from 'react'

const notifications = [
  { id:1, type:'message', title:'New WhatsApp message', body:'Ahmed Al Rashid sent a message: "Hello, I need help with..."', time:'2 min ago', read:false, color:'#00e5a0', icon:'💬' },
  { id:2, type:'lead', title:'New lead captured', body:'Sara Al Kuwari filled the contact form from Instagram', time:'15 min ago', read:false, color:'#3b82f6', icon:'👤' },
  { id:3, type:'campaign', title:'Campaign completed', body:'Ramadan 2024 campaign sent to 1,234 contacts successfully', time:'1 hour ago', read:false, color:'#a78bfa', icon:'📣' },
  { id:4, type:'ai', title:'AI handled 12 conversations', body:'Your AI assistant automatically replied to 12 customers', time:'2 hours ago', read:true, color:'#f97316', icon:'🤖' },
  { id:5, type:'payment', title:'New subscription payment', body:'Khalid Al Thani upgraded to Enterprise plan — QAR 8,000', time:'3 hours ago', read:true, color:'#00e5a0', icon:'💳' },
  { id:6, type:'message', title:'New WhatsApp message', body:'Mohammed Al Ali: "When will my order arrive?"', time:'4 hours ago', read:true, color:'#00e5a0', icon:'💬' },
  { id:7, type:'alert', title:'WhatsApp API rate limit warning', body:'You have used 80% of your monthly message quota', time:'5 hours ago', read:true, color:'#ef4444', icon:'⚠️' },
  { id:8, type:'lead', title:'New lead from Facebook', body:'Mariam Al Dosari clicked your Facebook ad and submitted a form', time:'Yesterday', read:true, color:'#3b82f6', icon:'👤' },
]

export default function Notifications() {
  const [notifs, setNotifs] = useState(notifications)
  const [filter, setFilter] = useState('all')

  const markAllRead = () => setNotifs(notifs.map(n => ({...n, read:true})))
  const markRead = (id) => setNotifs(notifs.map(n => n.id===id ? {...n, read:true} : n))

  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter)
  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/notifications" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>🔔</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{fontWeight:'700', fontSize:'15px'}}>
              Notifications
              {unreadCount > 0 && <span style={{marginLeft:'8px', fontSize:'11px', padding:'2px 8px', background:'#00e5a0', color:'#07090f', borderRadius:'10px', fontWeight:'700'}}>{unreadCount}</span>}
            </div>
            <div style={{display:'flex', gap:'6px', marginLeft:'auto'}}>
              {['all','unread','message','lead','campaign','ai'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{padding:'5px 10px', background: filter===f ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: filter===f ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight: filter===f ? '700' : '400', textTransform:'capitalize'}}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={markAllRead} style={{padding:'5px 12px', background:'none', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'10px', cursor:'pointer'}}>
              Mark all read
            </button>
          </div>

          <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'8px'}}>
            {filtered.length === 0 ? (
              <div style={{textAlign:'center', color:'#3d4f63', padding:'40px'}}>No notifications found</div>
            ) : (
              filtered.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} style={{display:'flex', gap:'14px', padding:'16px', background: n.read ? '#0c0f1a' : '#0f1520', border:'1px solid', borderColor: n.read ? '#1a2235' : n.color+'30', borderLeft: n.read ? '1px solid #1a2235' : `3px solid ${n.color}`, cursor:'pointer', transition:'all .2s', borderRadius:'2px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'50%', background:`${n.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>
                    {n.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px'}}>
                      <div style={{fontSize:'13px', fontWeight: n.read ? '400' : '600'}}>{n.title}</div>
                      <div style={{fontSize:'10px', color:'#3d4f63', flexShrink:0, marginLeft:'12px'}}>{n.time}</div>
                    </div>
                    <div style={{fontSize:'12px', color:'#7a8fa6', lineHeight:'1.5'}}>{n.body}</div>
                  </div>
                  {!n.read && <div style={{width:'8px', height:'8px', borderRadius:'50%', background:n.color, flexShrink:0, marginTop:'6px'}}></div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}