'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState } from 'react'

const contacts = [
  { id:1, name:'Ahmed Al Rashid', phone:'+974 5551 2345', msg:'Hello, I need information about your services', time:'2 min ago', unread:3, avatar:'AR', color:'#00e5a0', channel:'WhatsApp', status:'Hot Lead', isNew:false, score:9 },
  { id:2, name:'Fatima Hassan', phone:'+974 5552 3456', msg:'Thank you for your help!', time:'15 min ago', unread:0, avatar:'FH', color:'#3b82f6', channel:'Instagram', status:'Customer', isNew:false, score:7 },
  { id:3, name:'Mohammed Al Ali', phone:'+974 5553 4567', msg:'When will my order arrive?', time:'1 hour ago', unread:1, avatar:'MA', color:'#a78bfa', channel:'WhatsApp', status:'Cold Lead', isNew:true, score:4 },
  { id:4, name:'Sara Al Kuwari', phone:'+974 5554 5678', msg:'I want to book an appointment', time:'2 hours ago', unread:0, avatar:'SK', color:'#f97316', channel:'Facebook', status:'Hot Lead', isNew:true, score:8 },
  { id:5, name:'Khalid Al Thani', phone:'+974 5555 6789', msg:'Is this available in Qatar?', time:'3 hours ago', unread:2, avatar:'KT', color:'#ef4444', channel:'Telegram', status:'New Lead', isNew:true, score:5 },
  { id:6, name:'Mariam Al Dosari', phone:'+974 5556 7890', msg:'Can I get a discount?', time:'5 hours ago', unread:0, avatar:'MD', color:'#fbbf24', channel:'WhatsApp', status:'Customer', isNew:false, score:6 },
]

const initialMessages = [
  { id:1, from:'contact', text:'Hello, I need information about your services', time:'10:30' },
  { id:2, from:'ai', text:'Hello Ahmed! I am the AI assistant for Hayyamed. How can I help you today?', time:'10:31' },
  { id:3, from:'contact', text:'What are your prices?', time:'10:32' },
  { id:4, from:'agent', text:'Our plans start from QAR 299/month. Would you like to see a demo?', time:'10:33' },
]

const statusColors = { 'Hot Lead':'#ef4444', 'Cold Lead':'#3b82f6', 'New Lead':'#f97316', 'Customer':'#00e5a0' }
const channelIcons = { 'WhatsApp':'💬', 'Instagram':'📸', 'Facebook':'👤', 'Telegram':'✈️', 'Email':'📧' }
const channelColors = { 'WhatsApp':'#00e5a0', 'Instagram':'#a78bfa', 'Facebook':'#3b82f6', 'Telegram':'#f97316', 'Email':'#fbbf24' }

export default function Inbox() {
  const [selected, setSelected] = useState(contacts[0])
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [filterChannel, setFilterChannel] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiPanelLoading, setAiPanelLoading] = useState(false)

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.msg.toLowerCase().includes(search.toLowerCase())
    const matchChannel = filterChannel === 'All' || c.channel === filterChannel
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    return matchSearch && matchChannel && matchStatus
  })

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { id: messages.length+1, from:'agent', text:input, time:'Now' }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')

    if (aiMode) {
      setAiLoading(true)
      try {
        const history = messages.map(m => ({
          role: m.from === 'agent' ? 'assistant' : 'user',
          content: m.text
        }))
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input, history })
        })
        const data = await res.json()
        setMessages(prev => [...prev, { id: prev.length+1, from:'ai', text:data.reply, time:'Now' }])
      } catch {
        setMessages(prev => [...prev, { id: prev.length+1, from:'ai', text:'Sorry, AI is not available right now.', time:'Now' }])
      }
      setAiLoading(false)
    }
  }

  const askAiAssistant = async (query) => {
    setAiPanelLoading(true)
    setAiResponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          history: [{ role:'system', content:'You are a CRM analytics assistant. Analyze the following data and provide insights.' }]
        })
      })
      const data = await res.json()
      setAiResponse(data.reply)
    } catch {
      setAiResponse('Sorry, AI assistant is not available right now.')
    }
    setAiPanelLoading(false)
  }

  const quickQueries = [
    'Summarize todays conversations',
    'Which channel brings most leads?',
    'What are the hot leads today?',
    'Generate a brief report of all contacts',
  ]

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      {/* Topbar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="inbox" />

        {/* Contact List */}
        <div style={{width:'300px', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', flexShrink:0}}>
          
          {/* Search & Filters */}
          <div style={{padding:'12px', borderBottom:'1px solid #1a2235'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <div style={{fontWeight:'700'}}>Inbox <span style={{color:'#00e5a0', fontSize:'12px'}}>{contacts.filter(c=>c.unread>0).length} unread</span></div>
              <button onClick={() => setShowAiPanel(!showAiPanel)} style={{padding:'4px 8px', background: showAiPanel ? '#a78bfa' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: showAiPanel ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight:'600'}}>🤖 AI</button>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'7px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none', marginBottom:'8px'}}
            />

            {/* Channel Filter */}
            <div style={{display:'flex', gap:'4px', marginBottom:'6px', flexWrap:'wrap'}}>
              {['All','WhatsApp','Instagram','Facebook','Telegram'].map(ch => (
                <button key={ch} onClick={() => setFilterChannel(ch)} style={{padding:'3px 8px', background: filterChannel===ch ? channelColors[ch] || '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'3px', color: filterChannel===ch ? '#07090f' : '#7a8fa6', fontSize:'9px', cursor:'pointer', fontWeight: filterChannel===ch ? '700' : '400'}}>
                  {ch === 'All' ? 'All' : channelIcons[ch]}  {ch}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
              {['All','New Lead','Hot Lead','Cold Lead','Customer'].map(st => (
                <button key={st} onClick={() => setFilterStatus(st)} style={{padding:'3px 8px', background: filterStatus===st ? (statusColors[st] || '#00e5a0') + '30' : '#111622', border:'1px solid', borderColor: filterStatus===st ? statusColors[st] || '#00e5a0' : '#1a2235', borderRadius:'3px', color: filterStatus===st ? statusColors[st] || '#00e5a0' : '#7a8fa6', fontSize:'9px', cursor:'pointer'}}>
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div style={{overflowY:'auto', flex:1}}>
            {filtered.length === 0 ? (
              <div style={{padding:'20px', textAlign:'center', color:'#3d4f63', fontSize:'12px'}}>No conversations found</div>
            ) : (
              filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)} style={{padding:'12px 14px', borderBottom:'1px solid #1a2235', cursor:'pointer', background: selected.id===c.id ? '#0f1520' : 'none', borderLeft: `3px solid ${statusColors[c.status] || '#1a2235'}`}}>
                  <div style={{display:'flex', gap:'10px', alignItems:'flex-start'}}>
                    <div style={{position:'relative', flexShrink:0}}>
                      <div style={{width:'36px', height:'36px', borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'#07090f'}}>{c.avatar}</div>
                      <div style={{position:'absolute', bottom:'-2px', right:'-2px', fontSize:'10px'}}>{channelIcons[c.channel]}</div>
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'2px'}}>
                        <div style={{fontSize:'12px', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px'}}>
                          {c.name}
                          {c.isNew && <span style={{fontSize:'8px', padding:'1px 5px', background:'rgba(249,115,22,.2)', color:'#f97316', borderRadius:'2px'}}>NEW</span>}
                          {!c.isNew && <span style={{fontSize:'8px', padding:'1px 5px', background:'rgba(0,229,160,.1)', color:'#00e5a0', borderRadius:'2px'}}>RETURNING</span>}
                        </div>
                        <div style={{fontSize:'9px', color:'#3d4f63', flexShrink:0}}>{c.time}</div>
                      </div>
                      <div style={{fontSize:'10px', color:'#7a8fa6', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'4px'}}>{c.msg}</div>
                      <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                        <span style={{fontSize:'9px', padding:'1px 6px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status]}}>{c.status}</span>
                        <span style={{fontSize:'9px', color:'#3d4f63'}}>Score: {c.score}/10</span>
                        {c.unread > 0 && <span style={{marginLeft:'auto', width:'16px', height:'16px', borderRadius:'50%', background:'#00e5a0', color:'#07090f', fontSize:'9px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center'}}>{c.unread}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {/* Chat Header */}
          <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{position:'relative'}}>
              <div style={{width:'36px', height:'36px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'#07090f'}}>{selected.avatar}</div>
              <div style={{position:'absolute', bottom:'-2px', right:'-2px', fontSize:'12px'}}>{channelIcons[selected.channel]}</div>
            </div>
            <div>
              <div style={{fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px'}}>
                {selected.name}
                {selected.isNew ? 
                  <span style={{fontSize:'9px', padding:'2px 6px', background:'rgba(249,115,22,.2)', color:'#f97316', borderRadius:'2px'}}>🆕 New Client</span> :
                  <span style={{fontSize:'9px', padding:'2px 6px', background:'rgba(0,229,160,.1)', color:'#00e5a0', borderRadius:'2px'}}>⭐ Returning</span>
                }
              </div>
              <div style={{fontSize:'11px', color:'#7a8fa6'}}>{selected.phone} · {selected.channel} · Score: {selected.score}/10</div>
            </div>
            <div style={{marginLeft:'auto', display:'flex', gap:'6px', alignItems:'center'}}>
              <span style={{fontSize:'10px', padding:'3px 8px', borderRadius:'2px', background:`${statusColors[selected.status]}20`, color:statusColors[selected.status], fontWeight:'600'}}>{selected.status}</span>
              <button onClick={() => setAiMode(!aiMode)} style={{padding:'6px 12px', background: aiMode ? '#00e5a0' : 'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color: aiMode ? '#07090f' : '#00e5a0', fontSize:'11px', cursor:'pointer', fontWeight: aiMode ? '700' : '400'}}>
                🤖 {aiMode ? 'AI ON' : 'AI Mode'}
              </button>
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
            {aiLoading && (
              <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
                <div style={{width:'24px', height:'24px', borderRadius:'50%', background:'#a78bfa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', color:'#07090f'}}>AI</div>
                <div style={{padding:'9px 13px', borderRadius:'2px 12px 12px 12px', background:'rgba(167,139,250,.08)', border:'1px solid rgba(167,139,250,.2)', fontSize:'12px', color:'#a78bfa'}}>Thinking...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{padding:'12px 18px', borderTop:'1px solid #1a2235', background:'#0c0f1a'}}>
            {aiMode && <div style={{padding:'6px 12px', background:'rgba(167,139,250,.06)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', marginBottom:'8px', fontSize:'11px', color:'#a78bfa'}}>🤖 AI Mode is ON — AI will automatically reply</div>}
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder="Type a message..." style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
              <button onClick={sendMessage} disabled={aiLoading} style={{height:'40px', padding:'0 18px', background: aiLoading ? '#1a2235' : '#00e5a0', border:'none', borderRadius:'6px', color: aiLoading ? '#7a8fa6' : '#07090f', fontWeight:'700', fontSize:'12px', cursor: aiLoading ? 'not-allowed' : 'pointer'}}>
                {aiLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAiPanel && (
          <div style={{width:'280px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', display:'flex', flexDirection:'column', flexShrink:0}}>
            <div style={{padding:'14px 16px', borderBottom:'1px solid #1a2235'}}>
              <div style={{fontWeight:'700', fontSize:'13px', color:'#a78bfa'}}>🤖 AI Assistant</div>
              <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'2px'}}>Ask anything about your leads</div>
            </div>

            <div style={{padding:'12px', borderBottom:'1px solid #1a2235'}}>
              <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'8px'}}>QUICK QUESTIONS:</div>
              {quickQueries.map(q => (
                <button key={q} onClick={() => { setAiQuery(q); askAiAssistant(q) }} style={{display:'block', width:'100%', textAlign:'left', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'10px', cursor:'pointer', marginBottom:'5px'}}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{padding:'12px', flex:1, display:'flex', flexDirection:'column', gap:'8px'}}>
              <input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key==='Enter' && askAiAssistant(aiQuery)}
                placeholder="Ask AI assistant..."
                style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}
              />
              <button onClick={() => askAiAssistant(aiQuery)} style={{padding:'7px', background:'#a78bfa', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>
                Ask AI
              </button>

              {aiPanelLoading && (
                <div style={{fontSize:'11px', color:'#a78bfa', padding:'10px', background:'rgba(167,139,250,.05)', borderRadius:'4px', border:'1px solid rgba(167,139,250,.2)'}}>
                  AI is thinking...
                </div>
              )}

              {aiResponse && !aiPanelLoading && (
                <div style={{fontSize:'11px', color:'#e2e8f0', padding:'12px', background:'rgba(167,139,250,.05)', borderRadius:'4px', border:'1px solid rgba(167,139,250,.2)', lineHeight:'1.6', overflowY:'auto', flex:1}}>
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}