'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

const SRC = {
  whatsapp:{i:'💬',l:'WhatsApp',c:'#25D366'}, WHATSAPP:{i:'💬',l:'WhatsApp',c:'#25D366'},
  instagram:{i:'📸',l:'Instagram',c:'#E1306C'}, INSTAGRAM:{i:'📸',l:'Instagram',c:'#E1306C'},
  facebook:{i:'👤',l:'Facebook',c:'#3b82f6'}, MESSENGER:{i:'👤',l:'Messenger',c:'#3b82f6'},
  website:{i:'🌐',l:'Website',c:'#06b6d4'}, webchat:{i:'🌐',l:'Website',c:'#06b6d4'}, LIVE_CHAT:{i:'🌐',l:'Website',c:'#06b6d4'},
  telegram:{i:'✈️',l:'Telegram',c:'#0088cc'}, TELEGRAM:{i:'✈️',l:'Telegram',c:'#0088cc'},
  email:{i:'📧',l:'Email',c:'#fbbf24'}, EMAIL:{i:'📧',l:'Email',c:'#fbbf24'},
}
const srcOf = (c) => SRC[c?.channel?.type] || SRC[c?.contact?.source] || SRC[c?.channelType] || { i:'•', l: c?.channel?.type || 'Channel', c:'#64748b' }
const ST = {
  NEW:{l:'New',c:'#3b82f6'}, OPEN:{l:'Open',c:'#06b6d4'},
  WAITING_CLIENT:{l:'Waiting on us',c:'#f97316'}, WAITING_LEAD:{l:'Waiting on lead',c:'#fbbf24'},
  QUALIFIED:{l:'Qualified',c:'#D8B16A'}, FOLLOW_UP:{l:'Follow-up',c:'#a78bfa'},
  CONVERTED:{l:'Converted',c:'#16a34a'}, LOST:{l:'Lost',c:'#ef4444'},
  SPAM:{l:'Spam',c:'#ef4444'}, CLOSED:{l:'Closed',c:'#64748b'},
  PENDING:{l:'Waiting',c:'#f97316'}, RESOLVED:{l:'Resolved',c:'#16a34a'}, SNOOZED:{l:'Snoozed',c:'#a78bfa'},
}
const STATUS_OPTIONS = ['NEW','OPEN','WAITING_CLIENT','WAITING_LEAD','QUALIFIED','FOLLOW_UP','CONVERTED','LOST','SPAM','CLOSED']
const card = { background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'12px' }
const selStyle = (v) => ({ flex:1, minWidth:0, maxWidth:'33%', background:'#0a121e', border:`1px solid ${v!=='All'?'#D8B16A':'#1e2d42'}`, borderRadius:'6px', padding:'4px 6px', color: v!=='All'?'#D8B16A':'#7a8fa6', fontSize:'10px', cursor:'pointer', outline:'none' })

export default function ClientInbox({ me }) {
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p)
  const [convos, setConvos] = useState([])
  const [sel, setSel] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [notes, setNotes] = useState([])
  const [team, setTeam] = useState([])
  const [input, setInput] = useState('')
  const [noteText, setNoteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('All')
  const [fSource, setFSource] = useState('All')
  const [fAssignee, setFAssignee] = useState('All')
  const [fTag, setFTag] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showHist, setShowHist] = useState(false)
  const bodyRef = useRef(null)

  const loadConvos = () => api.getConversations({ limit: 100 }).then(r => setConvos(Array.isArray(r) ? r : (r?.data || []))).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { loadConvos(); api.getTeam().then(t => setTeam(Array.isArray(t) ? t : [])).catch(() => {}) }, [])
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }, [msgs])

  const open = async (c) => {
    setSel(c); setMsgs([]); setNotes([]); setShowHist(false)
    api.getMessages(c.id).then(m => setMsgs(Array.isArray(m) ? m : (m?.data || []))).catch(() => {})
    if (can('add_notes')) api.getConversationNotes(c.id).then(n => setNotes(Array.isArray(n) ? n : [])).catch(() => {})
  }
  const send = async () => {
    const text = input.trim(); if (!text || !sel) return
    setBusy(true); setInput('')
    setMsgs(p => [...p, { id:'tmp'+Date.now(), content:text, isAI:false, senderId: me?.id, createdAt:new Date().toISOString() }])
    try { await api.sendMessage(sel.id, text, me?.id) } catch (e) { alert(e?.message || 'Send failed — the channel may not be connected.') }
    finally { setBusy(false); api.getMessages(sel.id).then(m => setMsgs(Array.isArray(m) ? m : (m?.data || []))).catch(() => {}) }
  }
  const suggest = async () => {
    if (!sel) return; setSuggesting(true)
    try { const r = await api.generateReply(sel.id); setInput(r?.reply || r?.message || '') } catch { alert('Could not generate a suggestion') } finally { setSuggesting(false) }
  }
  const setStatus = async (s) => { if (!sel) return; try { await api.updateConversationStatus(sel.id, s); setSel({ ...sel, status:s }); setConvos(p => p.map(c => c.id===sel.id?{ ...c, status:s }:c)) } catch (e) { alert(e?.message) } }
  const assign = async (uid) => { if (!sel) return; try { await api.assignConversation(sel.id, uid || null); setSel({ ...sel, assigneeId: uid }) } catch (e) { alert(e?.message) } }
  const toggleAi = async () => { if (!sel) return; const paused = !(sel.metadata?.aiPaused); try { await api.setConversationAi(sel.id, paused); setSel({ ...sel, metadata: { ...(sel.metadata||{}), aiPaused: paused } }) } catch (e) { alert(e?.message) } }
  const addNote = async () => { const t = noteText.trim(); if (!t || !sel) return; try { await api.addConversationNote(sel.id, t); setNoteText(''); api.getConversationNotes(sel.id).then(n => setNotes(Array.isArray(n)?n:[])) } catch (e) { alert(e?.message) } }

  const convSrc = (c) => (c?.channel?.type || c?.contact?.source || c?.channelType || '')
  const allSources = Array.from(new Set(convos.map(convSrc).filter(Boolean)))
  const allTags = Array.from(new Set(convos.flatMap(c => c.tags || []).filter(Boolean)))
  const filtered = convos.filter(c => {
    if (fStatus !== 'All' && c.status !== fStatus) return false
    if (fSource !== 'All' && convSrc(c) !== fSource) return false
    if (fAssignee !== 'All' && (fAssignee === 'unassigned' ? c.assigneeId : c.assigneeId !== fAssignee)) return false
    if (fTag !== 'All' && !(c.tags || []).includes(fTag)) return false
    if (search && !((c.contact?.name||'') + (c.contact?.phone||'')).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const aiPaused = sel?.metadata?.aiPaused

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'16px', height:'calc(100vh - 230px)', minHeight:'480px' }}>
      {/* List */}
      <div style={{ ...card, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px', borderBottom:'1px solid #1e2d42' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" style={{ width:'100%', background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'8px 10px', color:'#e8eef5', fontSize:'12px', outline:'none', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:'4px', marginTop:'8px', flexWrap:'wrap' }}>
            {['All','OPEN','PENDING','RESOLVED'].map(s => (
              <button key={s} onClick={()=>setFStatus(s)} style={{ padding:'3px 9px', borderRadius:'12px', fontSize:'10px', fontWeight:700, cursor:'pointer', background: fStatus===s?'rgba(216,177,106,.15)':'transparent', border:`1px solid ${fStatus===s?'#D8B16A':'#1e2d42'}`, color: fStatus===s?'#D8B16A':'#7a8fa6' }}>{s==='All'?'All':(ST[s]?.l||s)}</button>
            ))}
          </div>
          {(allSources.length>0 || team.length>0 || allTags.length>0) && (
            <div style={{ display:'flex', gap:'5px', marginTop:'7px', flexWrap:'wrap' }}>
              {allSources.length>0 && <select value={fSource} onChange={e=>setFSource(e.target.value)} style={selStyle(fSource)}><option value="All">All sources</option>{allSources.map(s => <option key={s} value={s}>{(SRC[s]?.l)||s}</option>)}</select>}
              {team.length>0 && <select value={fAssignee} onChange={e=>setFAssignee(e.target.value)} style={selStyle(fAssignee)}><option value="All">Anyone</option><option value="unassigned">Unassigned</option>{team.map(t => <option key={t.id} value={t.id}>{t.name||t.email}</option>)}</select>}
              {allTags.length>0 && <select value={fTag} onChange={e=>setFTag(e.target.value)} style={selStyle(fTag)}><option value="All">All tags</option>{allTags.map(t => <option key={t} value={t}>{t}</option>)}</select>}
            </div>
          )}
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? <div style={{ padding:'20px', textAlign:'center', color:'#3d4f63', fontSize:'12px' }}>Loading…</div>
            : filtered.length===0 ? <div style={{ padding:'20px', textAlign:'center', color:'#3d4f63', fontSize:'12px' }}>No conversations</div>
            : filtered.map(c => { const s = srcOf(c); const st = ST[c.status] || {}; return (
              <div key={c.id} onClick={()=>open(c)} style={{ padding:'11px 13px', borderBottom:'1px solid #141d2e', cursor:'pointer', background: sel?.id===c.id?'#141d2e':'transparent', borderLeft:`3px solid ${sel?.id===c.id?'#D8B16A':'transparent'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontWeight:700, fontSize:'13px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.contact?.name || c.contact?.phone || 'Lead'}</span>
                  <span title={s.l} style={{ fontSize:'13px' }}>{s.i}</span>
                </div>
                <div style={{ fontSize:'11px', color:'#7a8fa6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:'2px' }}>{c.lastMessage || 'No messages yet'}</div>
                <div style={{ marginTop:'4px' }}><span style={{ fontSize:'9px', padding:'1px 7px', borderRadius:'8px', background:(st.c||'#64748b')+'22', color:st.c||'#64748b', fontWeight:700 }}>{st.l || c.status}</span></div>
              </div>
            )})}
        </div>
      </div>

      {/* Chat */}
      <div style={{ ...card, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!sel ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#3d4f63', fontSize:'13px' }}>Select a conversation</div> : (<>
          {/* header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #1e2d42', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'14px' }}>{sel.contact?.name || sel.contact?.phone || 'Lead'}</div>
              <div style={{ fontSize:'11px', color:'#7a8fa6' }}>{srcOf(sel).i} {srcOf(sel).l} · {sel.contact?.phone || sel.contact?.email || ''}</div>
            </div>
            {can('change_status') && (
              <select value={sel.status} onChange={e=>setStatus(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'7px', padding:'5px 8px', color:'#e8eef5', fontSize:'11px', cursor:'pointer' }}>
                {STATUS_OPTIONS.map(k => <option key={k} value={k}>{ST[k]?.l || k}</option>)}
                {!STATUS_OPTIONS.includes(sel.status) && <option value={sel.status}>{ST[sel.status]?.l || sel.status}</option>}
              </select>
            )}
            {(sel.metadata?.statusHistory || []).length > 0 && (
              <div style={{ position:'relative' }}>
                <button onClick={()=>setShowHist(v=>!v)} title="Status history" style={{ background:'none', border:'1px solid #1e2d42', borderRadius:'7px', padding:'5px 8px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer' }}>🕘</button>
                {showHist && (
                  <div style={{ position:'absolute', right:0, top:'32px', width:'220px', maxHeight:'240px', overflowY:'auto', background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'10px', boxShadow:'0 12px 40px rgba(0,0,0,.5)', zIndex:50, padding:'8px' }}>
                    <div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Status history</div>
                    {[...sel.metadata.statusHistory].reverse().map((h, i) => (
                      <div key={i} style={{ fontSize:'11px', color:'#94a3b8', padding:'3px 0', borderBottom:'1px solid #141d2e' }}>
                        <span style={{ color: ST[h.to]?.c || '#94a3b8', fontWeight:700 }}>{ST[h.to]?.l || h.to}</span> <span style={{ color:'#475569' }}>← {ST[h.from]?.l || h.from}</span>
                        <div style={{ fontSize:'9px', color:'#3d4f63' }}>{h.at ? new Date(h.at).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {can('assign_leads') && (
              <select value={sel.assigneeId || ''} onChange={e=>assign(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'7px', padding:'5px 8px', color:'#e8eef5', fontSize:'11px', cursor:'pointer', maxWidth:'130px' }}>
                <option value="">Unassigned</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.name || t.email}</option>)}
              </select>
            )}
            {can('toggle_ai') && (
              <button onClick={toggleAi} title="AI auto-reply" style={{ fontSize:'11px', fontWeight:700, padding:'5px 10px', borderRadius:'7px', cursor:'pointer', border:`1px solid ${aiPaused?'#1e2d42':'#16a34a'}`, background: aiPaused?'transparent':'rgba(22,163,74,.15)', color: aiPaused?'#7a8fa6':'#16a34a' }}>{aiPaused ? '🤖 AI off' : '🤖 AI on'}</button>
            )}
          </div>
          {/* messages */}
          <div ref={bodyRef} style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'8px', background:'#0a121e' }}>
            {msgs.length===0 ? <div style={{ margin:'auto', color:'#3d4f63', fontSize:'12px' }}>No messages yet</div> : msgs.map(m => {
              const mine = m.isFromBot || m.isAI || m.senderId
              return (
                <div key={m.id} style={{ alignSelf: mine?'flex-end':'flex-start', maxWidth:'75%' }}>
                  <div style={{ padding:'9px 13px', borderRadius:'12px', fontSize:'13px', lineHeight:1.5, whiteSpace:'pre-wrap', background: mine ? (m.isAI||m.isFromBot ? '#1a2740' : '#D8B16A') : '#1a2740', color: mine && !(m.isAI||m.isFromBot) ? '#07090f' : '#e8eef5', border: mine && (m.isAI||m.isFromBot) ? '1px solid #2a3d5c' : 'none' }}>{m.content}</div>
                  <div style={{ fontSize:'9px', color:'#3d4f63', marginTop:'2px', textAlign: mine?'right':'left' }}>{(m.isAI||m.isFromBot)?'🤖 AI':''} {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : ''}</div>
                </div>
              )
            })}
          </div>
          {/* notes */}
          {can('add_notes') && notes.length>0 && (
            <div style={{ padding:'8px 16px', borderTop:'1px solid #1e2d42', maxHeight:'90px', overflowY:'auto', background:'#0d1420' }}>
              {notes.map(n => <div key={n.id} style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'3px' }}>📝 {n.content}</div>)}
            </div>
          )}
          {/* composer */}
          {can('reply_leads') ? (
            <div style={{ padding:'12px 16px', borderTop:'1px solid #1e2d42' }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} placeholder="Type your reply…" style={{ flex:1, background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'9px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }} />
                {can('use_ai_replies') && <button onClick={suggest} disabled={suggesting} title="AI suggested reply" style={{ padding:'0 12px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'9px', color:'#a78bfa', fontWeight:700, cursor:'pointer', fontSize:'12px' }}>{suggesting?'…':'✨ AI'}</button>}
                <button onClick={send} disabled={busy || !input.trim()} style={{ padding:'0 18px', background: input.trim()?'#D8B16A':'#1a2235', border:'none', borderRadius:'9px', color: input.trim()?'#07090f':'#64748b', fontWeight:800, cursor:'pointer' }}>Send</button>
              </div>
              {can('add_notes') && (
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <input value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addNote() }} placeholder="Add a private note…" style={{ flex:1, background:'#0d1420', border:'1px solid #1e2d42', borderRadius:'8px', padding:'7px 10px', color:'#94a3b8', fontSize:'11px', outline:'none' }} />
                  <button onClick={addNote} disabled={!noteText.trim()} style={{ padding:'0 12px', background:'transparent', border:'1px solid #1e2d42', borderRadius:'8px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer' }}>Note</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding:'14px 16px', borderTop:'1px solid #1e2d42', fontSize:'12px', color:'#64748b', textAlign:'center' }}>You have read-only access to conversations.</div>
          )}
        </>)}
      </div>
    </div>
  )
}
