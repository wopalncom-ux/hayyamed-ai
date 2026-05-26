'use client'
import { useState } from 'react'
import NavSidebar from '@/components/NavSidebar'

const notifications = [
  { id:1, type:'message',  title:'New WhatsApp message',         body:'Abbas Al Masri sent a message: "Hello, I need help with..."', time:'2 min ago',   read:false, color:'#00e5a0', icon:'💬' },
  { id:2, type:'lead',     title:'New lead captured',            body:'Ahmad Singa filled the contact form from Instagram',          time:'15 min ago',  read:false, color:'#3b82f6', icon:'👤' },
  { id:3, type:'campaign', title:'Campaign completed',           body:'Ramadan 2024 campaign sent to 1,234 contacts successfully',  time:'1 hour ago',  read:false, color:'#a78bfa', icon:'📣' },
  { id:4, type:'ai',       title:'AI handled 12 conversations',  body:'Your AI assistant automatically replied to 12 customers',    time:'2 hours ago', read:true,  color:'#f97316', icon:'🤖' },
  { id:5, type:'payment',  title:'New subscription payment',     body:'Thomas Thompson upgraded to Growth plan — QAR 599',          time:'3 hours ago', read:true,  color:'#00e5a0', icon:'💳' },
  { id:6, type:'message',  title:'New WhatsApp message',         body:'Khaled Ahmad: "When will my order arrive?"',                 time:'4 hours ago', read:true,  color:'#00e5a0', icon:'💬' },
  { id:7, type:'alert',    title:'WhatsApp API rate limit warning',body:'You have used 80% of your monthly message quota',          time:'5 hours ago', read:true,  color:'#ef4444', icon:'⚠️' },
  { id:8, type:'lead',     title:'New lead from Facebook',       body:'Cecilia Talal clicked your Facebook ad and submitted a form',time:'Yesterday',   read:true,  color:'#3b82f6', icon:'👤' },
]

export default function Notifications() {
  const [notifs, setNotifs] = useState(notifications)
  const [filter, setFilter] = useState('all')

  const markAllRead = () => setNotifs(notifs.map(n => ({...n, read:true})))
  const markRead    = (id) => setNotifs(notifs.map(n => n.id===id ? {...n, read:true} : n))

  const filtered    = filter==='all' ? notifs : filter==='unread' ? notifs.filter(n=>!n.read) : notifs.filter(n=>n.type===filter)
  const unreadCount = notifs.filter(n=>!n.read).length

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/  Notifications</div>
        {unreadCount > 0 && <div style={{fontSize:'10px', padding:'3px 8px', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'10px', color:'#ef4444', fontWeight:'700'}}>{unreadCount} unread</div>}
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="notifications" />

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {/* Filter bar */}
          <div style={{padding:'12px 20px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', gap:'8px', background:'#0c0f1a', flexShrink:0}}>
            {['all','unread','message','lead','campaign','ai','alert','payment'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{padding:'5px 12px', background: filter===f ? '#00e5a0' : '#111622', border:'1px solid', borderColor: filter===f ? '#00e5a0' : '#1a2235', borderRadius:'4px', color: filter===f ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: filter===f ? '700' : '400', textTransform:'capitalize'}}>
                {f}
              </button>
            ))}
            <div style={{marginLeft:'auto'}}>
              <button onClick={markAllRead} style={{padding:'5px 14px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontSize:'11px', cursor:'pointer', fontWeight:'600'}}>
                Mark all read
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div style={{flex:1, overflowY:'auto', padding:'16px'}}>
            {filtered.length === 0 ? (
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
