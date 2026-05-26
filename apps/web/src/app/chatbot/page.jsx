'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const initialNodes = [
  { id:1, type:'trigger',   title:'Customer Sends Message', preview:'WhatsApp incoming message',     x:80,  y:120, color:'#00e5a0' },
  { id:2, type:'condition', title:'Check Intent',            preview:'Question or Booking?',          x:320, y:120, color:'#f97316' },
  { id:3, type:'message',   title:'Send Welcome',           preview:'Hello! How can I help you?',    x:560, y:60,  color:'#3b82f6' },
  { id:4, type:'message',   title:'Booking Confirmation',   preview:'Great! Let me check availability.',x:560, y:200, color:'#3b82f6' },
  { id:5, type:'ai',        title:'AI Response',            preview:'GPT-4 handles the conversation',x:800, y:120, color:'#a78bfa' },
]

const nodeTypes = [
  { type:'trigger',   icon:'⚡', label:'Trigger',      color:'#00e5a0' },
  { type:'message',   icon:'💬', label:'Send Message', color:'#3b82f6' },
  { type:'condition', icon:'🔀', label:'Condition',    color:'#f97316' },
  { type:'ai',        icon:'🤖', label:'AI Response',  color:'#a78bfa' },
  { type:'delay',     icon:'⏱️', label:'Delay',        color:'#fbbf24' },
  { type:'action',    icon:'⚙️', label:'Action',       color:'#ef4444' },
]

export default function Chatbot() {
  const [tab, setTab] = useState('flow')
  const [nodes, setNodes] = useState(initialNodes)
  const [selected, setSelected] = useState(nodes[0])
  const [editTitle, setEditTitle] = useState(nodes[0]?.title || '')
  const [editPreview, setEditPreview] = useState(nodes[0]?.preview || '')
  const [botId, setBotId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [status, setStatus] = useState('')

  // Knowledge base state
  const [docs, setDocs] = useState([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [kbLoading, setKbLoading] = useState(false)
  const [kbStatus, setKbStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const dragNode = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  useEffect(() => {
    api.getChatbots()
      .then(bots => {
        if (bots?.length) {
          const bot = bots[0]
          setBotId(bot.id)
          if (bot.flow?.nodes?.length) setNodes(bot.flow.nodes)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!botId) return
    api.getKnowledge(botId)
      .then(kb => {
        setDocs(kb.docs || [])
        setWebsiteUrl(kb.websiteUrl || '')
      })
      .catch(() => {})
  }, [botId])

  const selectNode = (n) => {
    setSelected(n)
    setEditTitle(n.title)
    setEditPreview(n.preview)
  }

  const saveNode = () => {
    setNodes(prev => prev.map(n => n.id === selected.id ? { ...n, title: editTitle, preview: editPreview } : n))
    setSelected(s => ({ ...s, title: editTitle, preview: editPreview }))
    setStatus('node-saved')
    setTimeout(() => setStatus(''), 1500)
  }

  const addNode = (nt) => {
    const id = Date.now()
    const newNode = { id, type: nt.type, title: nt.label, preview: 'Configure this node...', x: 120 + (nodes.length % 4) * 200, y: 80 + Math.floor(nodes.length / 4) * 140, color: nt.color }
    setNodes(prev => [...prev, newNode])
    selectNode(newNode)
  }

  const deleteNode = () => {
    if (!selected) return
    setNodes(prev => prev.filter(n => n.id !== selected.id))
    setSelected(null)
    setEditTitle('')
    setEditPreview('')
  }

  const onMouseDown = (e, node) => {
    e.stopPropagation()
    dragNode.current = node.id
    const rect = canvasRef.current.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y }
    selectNode(node)
  }

  const onMouseMove = (e) => {
    if (!dragNode.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left - dragOffset.current.x)
    const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y)
    setNodes(prev => prev.map(n => n.id === dragNode.current ? { ...n, x, y } : n))
  }

  const onMouseUp = () => { dragNode.current = null }

  const saveFlow = async () => {
    setSaving(true)
    setStatus('')
    try {
      const flow = { nodes }
      if (botId) {
        await api.updateChatbot(botId, { flow })
      } else {
        const bot = await api.createChatbot({ name: 'WhatsApp Bot', channelType: 'WHATSAPP', flow })
        setBotId(bot.id)
      }
      setStatus('saved')
    } catch { setStatus('error') }
    setSaving(false)
  }

  const publishFlow = async () => {
    if (!botId) { await saveFlow() }
    setPublishing(true)
    setStatus('')
    try {
      await api.publishChatbot(botId)
      setStatus('published')
    } catch { setStatus('error') }
    setPublishing(false)
  }

  const uploadFile = async (e) => {
    const file = e.target.files[0]
    if (!file || !botId) return
    setUploading(true)
    setKbStatus('')
    try {
      const form = new FormData()
      form.append('file', file)
      const auth = JSON.parse(localStorage.getItem('hayyamed_auth') || '{}')
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(`${BASE}/api/v1/chatbots/${botId}/knowledge/upload`, {
        method: 'POST',
        headers: {
          'x-org-id': auth.orgId || '',
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
        },
        body: form,
      })
      const data = await res.json()
      setKbStatus(`✅ "${file.name}" added — ${(data.chars/1000).toFixed(1)}k characters`)
      const kb = await api.getKnowledge(botId)
      setDocs(kb.docs || [])
    } catch { setKbStatus('⚠️ Upload failed') }
    setUploading(false)
    e.target.value = ''
  }

  const addUrl = async () => {
    if (!websiteUrl.trim() || !botId) return
    setKbLoading(true)
    setKbStatus('')
    try {
      const data = await api.addKnowledgeUrl(botId, websiteUrl.trim())
      setKbStatus(`✅ Website scraped — ${(data.chars/1000).toFixed(1)}k characters`)
      const kb = await api.getKnowledge(botId)
      setDocs(kb.docs || [])
    } catch { setKbStatus('⚠️ Could not fetch website') }
    setKbLoading(false)
  }

  const removeDoc = async (index) => {
    if (!botId) return
    await api.removeKnowledgeDoc(botId, index).catch(() => {})
    setDocs(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      {/* Top bar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/ Chatbot Builder</div>

        {/* Tab switcher */}
        <div style={{display:'flex', gap:'4px', marginLeft:'16px'}}>
          {[{id:'flow', label:'🔀 Flow Builder'}, {id:'knowledge', label:'🧠 Knowledge Base'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'5px 12px', background: tab===t.id ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: tab===t.id ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: tab===t.id ? '700' : '400'}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{display:'flex', gap:'8px', alignItems:'center', marginLeft:'auto'}}>
          {status === 'node-saved' && <span style={{fontSize:'11px', color:'#00e5a0'}}>✅ Node updated</span>}
          {status === 'saved'      && <span style={{fontSize:'11px', color:'#00e5a0'}}>✅ Flow saved</span>}
          {status === 'published'  && <span style={{fontSize:'11px', color:'#a78bfa'}}>🚀 Published!</span>}
          {status === 'error'      && <span style={{fontSize:'11px', color:'#ef4444'}}>⚠️ Error saving</span>}
          <button onClick={saveFlow} disabled={saving} style={{padding:'6px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={publishFlow} disabled={publishing} style={{padding:'6px 14px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>
            {publishing ? 'Publishing...' : '🚀 Publish'}
          </button>
        </div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="chatbot" />

        {/* ── FLOW BUILDER TAB ── */}
        {tab === 'flow' && (
          <>
            {/* Node palette */}
            <div style={{width:'200px', borderRight:'1px solid #1a2235', background:'#0c0f1a', padding:'14px', overflowY:'auto', flexShrink:0}}>
              <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'12px'}}>CLICK TO ADD NODE</div>
              {nodeTypes.map(n => (
                <div key={n.type} onClick={() => addNode(n)}
                  style={{padding:'9px 12px', border:'1px solid #1a2235', borderRadius:'4px', marginBottom:'7px', cursor:'pointer', fontSize:'11px', color:'#7a8fa6', display:'flex', alignItems:'center', gap:'8px', background:'#111622'}}
                  onMouseEnter={e => e.currentTarget.style.borderColor = n.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2235'}>
                  <span style={{fontSize:'14px'}}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
              <div style={{marginTop:'16px', padding:'10px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.1)', borderRadius:'4px', fontSize:'10px', color:'#3d4f63', lineHeight:'1.5'}}>
                Click to add · Drag to move · Click node to edit
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{flex:1, position:'relative', overflow:'hidden', background:'#07090f', backgroundImage:'radial-gradient(circle, #1a2235 1px, transparent 1px)', backgroundSize:'24px 24px'}}>
              <svg style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none'}}>
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#3d4f63"/>
                  </marker>
                </defs>
                {nodes.length > 1 && nodes.slice(0,-1).map((n,i) => {
                  const next = nodes[i+1]
                  return <line key={`${n.id}-${next.id}`} x1={n.x+160} y1={n.y+36} x2={next.x} y2={next.y+36} stroke="#3d4f63" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)"/>
                })}
              </svg>
              {nodes.map(n => (
                <div key={n.id} onMouseDown={e => onMouseDown(e, n)}
                  style={{position:'absolute', left:n.x, top:n.y, background:'#0f1520', border:`1px solid ${selected?.id===n.id ? n.color : '#1a2235'}`, borderRadius:'4px', padding:'12px 16px', minWidth:'160px', cursor:'grab', userSelect:'none', boxShadow: selected?.id===n.id ? `0 0 0 2px ${n.color}30` : '0 2px 8px rgba(0,0,0,.4)', zIndex: selected?.id===n.id ? 10 : 1}}>
                  <div style={{display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:n.color}}></div>
                    <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', textTransform:'uppercase'}}>{n.type}</div>
                  </div>
                  <div style={{fontSize:'12px', fontWeight:'600', marginBottom:'4px'}}>{n.title}</div>
                  <div style={{fontSize:'10px', color:'#7a8fa6'}}>{n.preview}</div>
                </div>
              ))}
            </div>

            {/* Properties panel */}
            <div style={{width:'240px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'16px', overflowY:'auto', flexShrink:0}}>
              <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'14px'}}>NODE PROPERTIES</div>
              {selected ? (
                <>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
                    <div style={{width:'10px', height:'10px', borderRadius:'50%', background:selected.color}}></div>
                    <div style={{fontSize:'12px', fontWeight:'600', color:selected.color, textTransform:'uppercase'}}>{selected.type}</div>
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'6px'}}>TITLE</div>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box'}}/>
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'6px'}}>MESSAGE / ACTION</div>
                    <textarea value={editPreview} onChange={e => setEditPreview(e.target.value)} rows={4} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'12px', outline:'none', resize:'vertical', boxSizing:'border-box'}}/>
                  </div>
                  <button onClick={saveNode} style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', marginBottom:'8px'}}>✅ Save Node</button>
                  <button onClick={deleteNode} style={{width:'100%', padding:'8px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'4px', color:'#ef4444', fontSize:'12px', cursor:'pointer'}}>🗑️ Delete Node</button>
                </>
              ) : (
                <div style={{fontSize:'11px', color:'#3d4f63', textAlign:'center', marginTop:'40px'}}>Click a node to edit its properties</div>
              )}
            </div>
          </>
        )}

        {/* ── KNOWLEDGE BASE TAB ── */}
        {tab === 'knowledge' && (
          <div style={{flex:1, overflowY:'auto', padding:'28px', display:'flex', flexDirection:'column', gap:'20px', maxWidth:'780px'}}>

            <div>
              <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'4px'}}>🧠 Knowledge Base</div>
              <div style={{fontSize:'12px', color:'#7a8fa6'}}>Train your AI chatbot with your documents and website. The AI will use this to answer client questions accurately.</div>
            </div>

            {!botId && (
              <div style={{padding:'16px', background:'rgba(249,115,22,.1)', border:'1px solid rgba(249,115,22,.3)', borderRadius:'4px', fontSize:'12px', color:'#f97316'}}>
                ⚠️ Save your chatbot flow first before adding knowledge. Click 💾 Save above.
              </div>
            )}

            {kbStatus && (
              <div style={{padding:'12px 16px', background: kbStatus.startsWith('✅') ? 'rgba(0,229,160,.1)' : 'rgba(239,68,68,.1)', border:`1px solid ${kbStatus.startsWith('✅') ? 'rgba(0,229,160,.3)' : 'rgba(239,68,68,.3)'}`, borderRadius:'4px', fontSize:'12px', color: kbStatus.startsWith('✅') ? '#00e5a0' : '#ef4444'}}>
                {kbStatus}
              </div>
            )}

            {/* Upload Document */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'4px'}}>📄 Upload Document</div>
              <div style={{fontSize:'11px', color:'#3d4f63', marginBottom:'16px'}}>Supports PDF and TXT files — price lists, service menus, FAQs, policies</div>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.csv" onChange={uploadFile} style={{display:'none'}}/>
              <button onClick={() => fileRef.current?.click()} disabled={!botId || uploading}
                style={{padding:'10px 20px', background: botId ? '#00e5a0' : '#1a2235', border:'none', borderRadius:'4px', color: botId ? '#07090f' : '#3d4f63', fontWeight:'700', fontSize:'12px', cursor: botId ? 'pointer' : 'not-allowed'}}>
                {uploading ? '⏳ Uploading...' : '📁 Choose File (PDF / TXT)'}
              </button>
            </div>

            {/* Add Website URL */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'4px'}}>🌐 Add Website URL</div>
              <div style={{fontSize:'11px', color:'#3d4f63', marginBottom:'16px'}}>We'll scrape the page and extract the text content for your AI to learn from</div>
              <div style={{display:'flex', gap:'8px'}}>
                <input
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addUrl()}
                  placeholder="https://yourclinic.com/services"
                  style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}
                />
                <button onClick={addUrl} disabled={!botId || kbLoading}
                  style={{padding:'10px 18px', background: botId ? '#3b82f6' : '#1a2235', border:'none', borderRadius:'4px', color: botId ? '#fff' : '#3d4f63', fontWeight:'700', fontSize:'12px', cursor: botId ? 'pointer' : 'not-allowed'}}>
                  {kbLoading ? 'Scraping...' : 'Add URL'}
                </button>
              </div>
            </div>

            {/* Loaded documents */}
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
              <div style={{fontWeight:'700', fontSize:'13px', marginBottom:'16px'}}>
                📚 Loaded Knowledge ({docs.length} source{docs.length !== 1 ? 's' : ''})
              </div>
              {docs.length === 0 ? (
                <div style={{padding:'24px', textAlign:'center', color:'#3d4f63', fontSize:'12px', border:'1px dashed #1a2235', borderRadius:'4px'}}>
                  No knowledge sources yet. Upload a document or add a website URL above.
                </div>
              ) : (
                docs.map((doc, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', marginBottom:'8px'}}>
                    <div style={{fontSize:'20px'}}>{doc.source?.startsWith('http') ? '🌐' : '📄'}</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:'12px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{doc.source}</div>
                      <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'2px'}}>
                        {(doc.text?.length / 1000).toFixed(1)}k chars · Added {new Date(doc.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={() => removeDoc(i)} style={{padding:'4px 10px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'3px', color:'#ef4444', fontSize:'10px', cursor:'pointer', flexShrink:0}}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* How it works */}
            <div style={{padding:'16px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px'}}>
              <div style={{fontSize:'11px', fontWeight:'700', color:'#a78bfa', marginBottom:'8px'}}>How it works</div>
              <div style={{fontSize:'11px', color:'#7a8fa6', lineHeight:'1.8'}}>
                1. Upload your price list, services doc, or FAQ as PDF/TXT<br/>
                2. Optionally add your website URL<br/>
                3. Publish your chatbot<br/>
                4. When a client asks "What's the price for X?" — the AI answers from your documents, not from guessing
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
