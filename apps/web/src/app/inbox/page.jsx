'use client'
import { useState } from 'react'

const contacts = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', msg:'Hello, I need information about...', time:'2m', unread:3, avatar:'AR', color:'#00e5a0' },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', msg:'Thank you for your help!', time:'15m', unread:0, avatar:'FH', color:'#3b82f6' },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', msg:'When will my order arrive?', time:'1h', unread:1, avatar:'MA', color:'#a78bfa' },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', msg:'I want to book an appointment', time:'2h', unread:0, avatar:'SK', color:'#f97316' },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', msg:'Is this available in Qatar?', time:'3h', unread:2, avatar:'KT', color:'#ef4444' },
]

const initialMessages = [
  { id:1, from:'contact', text:'Hello, I need information about your services', time:'10:30' },
  { id:2, from:'ai', text:'Hello Ahmed! I am the AI assistant for Hayyamed. How can I help you today?', time:'10:31' },
  { id:3, from:'contact', text:'What are your prices?', time:'10:32' },
  { id:4, from:'agent', text:'Our plans start from QAR 299/month. Would you like to see a demo?', time:'10:33' },
]

export default function Inbox() {
  const [selected, setSelected] = useState(contacts[0])
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([...messages, { id: messages.length+1, from:'agent', text:input, time:'Now' }])
    setInput('')
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>
      
      {/* Topbar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Sidebar */}
        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          {['⊞','💬','👥','📊','🤖','⚙️'].map((icon, i) => (
            <div key={i} style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: i===1 ? 'rgba(0,229,160,.1)' : 'none', fontSize:'18px'}}>
              {icon}
            </div>
          ))}
        </div>

        {/* Contact List */}
        <div style={{width:'280px', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', flexShrink:0}}>
          <div style={{padding:'12px', borderBottom:'1px solid #1a2235'}}>
            <div style={{fontWeight:'700', marginBottom:'10px'}}>Inbox <span style={{color:'#00e5a0', fontSize:'12px'}}>6 unread</span></div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}
            />
          </div>
          <div style={{overflowY:'auto', flex:1}}>
            {contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} onClick={() => setSelected(c)} style={{padding:'12px 14px', borderBottom:'1px solid #1a2235', cursor:'pointer', background: selected.id===c.id ? '#0f1520' : 'none', display:'flex', gap:'10px', alignItems:'center'}}>
                <div style={{width:'36px', height:'36px', borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0}}>{c.avatar}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}>
                    <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                    <div style={{fontSize:'10px', color:'#3d4f63'}}>{c.time}</div>
                  </div>
                  <div style={{fontSize:'11px', color:'#7a8fa6', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.msg}</div>
                </div>
                {c.unread > 0 && <div style={{width:'18px', height:'18px', borderRadius:'50%', background:'#00e5a0', color:'#07090f', fontSize:'10px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>{c.unread}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          
          {/* Chat Header */}
          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{width:'36px', height:'36px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>{selected.avatar}</div>
            <div>
              <div style={{fontWeight:'600', fontSize:'13px'}}>{selected.name}</div>
              <div style={{fontSize:'11px', color:'#7a8fa6'}}>{selected.phone} · WhatsApp</div>
            </div>
            <div style={{marginLeft:'auto', display:'flex', gap:'8px'}}>
              <button style={{padding:'6px 12px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontSize:'11px', cursor:'pointer'}}>🤖 AI Mode</button>
              <button style={{padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>Profile</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:'12px'}}>
            {messages.map(m => (
              <div key={m.id} style={{display:'flex', flexDirection: m.from==='agent' ? 'row-reverse' : 'row', gap:'8px', alignItems:'flex-end'}}>
                <div style={{width:'24px', height:'24px', borderRadius:'50%', background: m.from==='ai' ? '#a78bfa' : m.from==='agent' ? '#00e5a0' : '#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', color:'#07090f', flexShrink:0}}>
                  {m.from==='ai' ? 'AI' : m.from==='agent' ? 'A' : 'C'}
                </div>
                <div style={{maxWidth:'60%'}}>
                  <div style={{padding:'9px 13px', borderRadius: m.from==='agent' ? '12px 2px 12px 12px' : '2px 12px 12px 12px', background: m.from==='agent' ? 'rgba(0,229,160,.08)' : m.from==='ai' ? 'rgba(167,139,250,.08)' : '#0f1520', border:'1px solid', borderColor: m.from==='agent' ? 'rgba(0,229,160,.2)' : m.from==='ai' ? 'rgba(167,139,250,.2)' : '#1a2235', fontSize:'12px', lineHeight:'1.6'}}>
                    {m.text}
                  </div>
                  <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'3px', textAlign: m.from==='agent' ? 'right' : 'left'}}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{padding:'12px 18px', borderTop:'1px solid #1a2235', background:'#0c0f1a'}}>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}
              />
              <button onClick={sendMessage} style={{height:'40px', padding:'0 18px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Send</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}