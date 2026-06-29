'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const SRC = {
  whatsapp:{i:'💬',l:'WhatsApp'}, instagram:{i:'📸',l:'Instagram'}, facebook:{i:'👤',l:'Facebook'},
  messenger:{i:'👤',l:'Messenger'}, website:{i:'🌐',l:'Website'}, webchat:{i:'🌐',l:'Website'}, live_chat:{i:'🌐',l:'Website'},
  telegram:{i:'✈️',l:'Telegram'}, email:{i:'📧',l:'Email'}, import:{i:'📥',l:'Import'}, manual:{i:'✍️',l:'Manual'}, campaign:{i:'📣',l:'Campaign'},
}
const srcMeta = (s) => SRC[String(s||'').toLowerCase()] || { i:'•', l: s || 'Unknown' }
const ST_COLOR = { NEW:'#3b82f6', CONTACTED:'#06b6d4', QUALIFYING:'#f97316', QUALIFIED:'#D8B16A', NEGOTIATION:'#fbbf24', WON:'#16a34a', LOST:'#ef4444', UNQUALIFIED:'#64748b', PROPOSAL:'#a78bfa' }
const card = { background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'12px' }
const ago = (d) => { if (!d) return '—'; const s=(Date.now()-new Date(d))/1000; if (s<3600) return Math.floor(s/60)+'m'; if (s<86400) return Math.floor(s/3600)+'h'; return Math.floor(s/86400)+'d' }

export default function ClientLeads({ me }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fSource, setFSource] = useState('All')
  const [fStatus, setFStatus] = useState('All')
  const [fTag, setFTag] = useState('All')
  const [fPriority, setFPriority] = useState('All')
  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [fCampaign, setFCampaign] = useState('All')
  const [campMap, setCampMap] = useState({})
  const [sel, setSel] = useState(null)        // selected lead profile
  const [detail, setDetail] = useState(null)  // loaded profile
  const [aiSummary, setAiSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p)

  useEffect(() => {
    api.getContacts({ limit: 200 }).then(r => setLeads((r?.data || r || []))).catch(() => {}).finally(() => setLoading(false))
    api.getCampaigns({ limit: 100 }).then(r => { const a = r?.data || r || []; setCampMap(Object.fromEntries(a.map(c => [c.id, c.name]))) }).catch(() => {})
  }, [])
  const campName = (id) => id ? (campMap[id] || 'Campaign') : null

  const openLead = async (l) => { setSel(l); setDetail(null); setAiSummary(''); setFollowUp(l.metadata?.followUp || ''); try { setDetail(await api.getContactProfile(l.id)) } catch {} }
  const genSummary = async () => {
    const cid = detail?.conversations?.[0]?.id; if (!cid) { setAiSummary('No conversation to summarize yet.'); return }
    setSummarizing(true)
    try { const r = await api.summarizeConversation(cid); setAiSummary(r?.summary || 'No summary available.') } catch { setAiSummary('Could not generate a summary.') } finally { setSummarizing(false) }
  }
  const saveFollowUp = async (v) => {
    setFollowUp(v); if (!sel) return
    try { await api.updateContact(sel.id, { metadata: { ...(sel.metadata || {}), followUp: v } }); setLeads(p => p.map(x => x.id===sel.id ? { ...x, metadata: { ...(x.metadata||{}), followUp: v } } : x)) } catch {}
  }

  const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean)))
  const statuses = Array.from(new Set(leads.map(l => l.status).filter(Boolean)))
  const tags = Array.from(new Set(leads.flatMap(l => l.tags || []).filter(Boolean)))
  const prio = (s) => (s>=70 ? 'High' : s>=40 ? 'Medium' : 'Low')
  const filtered = leads.filter(l => {
    if (fSource !== 'All' && l.source !== fSource) return false
    if (fStatus !== 'All' && l.status !== fStatus) return false
    if (fTag !== 'All' && !(l.tags || []).includes(fTag)) return false
    if (fCampaign !== 'All' && l.campaignId !== fCampaign) return false
    if (fPriority !== 'All' && prio(l.score || 0) !== fPriority) return false
    const ld = (l.createdAt || l.updatedAt || '').slice(0, 10)
    if (fFrom && ld && ld < fFrom) return false
    if (fTo && ld && ld > fTo) return false
    if (search && !((l.name||'')+(l.phone||'')+(l.email||'')).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" style={{ flex:'1 1 200px', background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }} />
        <select value={fSource} onChange={e=>setFSource(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 10px', color:'#e8eef5', fontSize:'12px', cursor:'pointer' }}>
          <option value="All">All sources</option>{sources.map(s => <option key={s} value={s}>{srcMeta(s).l}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 10px', color:'#e8eef5', fontSize:'12px', cursor:'pointer' }}>
          <option value="All">All statuses</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fPriority} onChange={e=>setFPriority(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 10px', color:'#e8eef5', fontSize:'12px', cursor:'pointer' }}>
          <option value="All">All priority</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        {tags.length>0 && <select value={fTag} onChange={e=>setFTag(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 10px', color:'#e8eef5', fontSize:'12px', cursor:'pointer' }}>
          <option value="All">All tags</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>}
        {Object.keys(campMap).length>0 && <select value={fCampaign} onChange={e=>setFCampaign(e.target.value)} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'9px 10px', color:'#e8eef5', fontSize:'12px', cursor:'pointer' }}>
          <option value="All">All campaigns</option>{Object.entries(campMap).map(([id,n]) => <option key={id} value={id}>{n}</option>)}
        </select>}
        <span style={{ fontSize:'11px', color:'#64748b' }}>From</span>
        <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} style={{ background:'#0a121e', border:`1px solid ${fFrom?'#D8B16A':'#1e2d42'}`, borderRadius:'8px', padding:'8px 9px', color:'#e8eef5', fontSize:'11px', cursor:'pointer' }} />
        <span style={{ fontSize:'11px', color:'#64748b' }}>to</span>
        <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} style={{ background:'#0a121e', border:`1px solid ${fTo?'#D8B16A':'#1e2d42'}`, borderRadius:'8px', padding:'8px 9px', color:'#e8eef5', fontSize:'11px', cursor:'pointer' }} />
        {(fFrom||fTo) && <button onClick={()=>{ setFFrom(''); setFTo('') }} style={{ fontSize:'11px', background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}>clear</button>}
        <span style={{ fontSize:'12px', color:'#7a8fa6', marginLeft:'auto' }}>{filtered.length} leads</span>
      </div>

      <div style={{ ...card, overflow:'hidden' }}>
        {loading ? <div style={{ padding:'24px', textAlign:'center', color:'#3d4f63', fontSize:'13px' }}>Loading…</div>
          : filtered.length===0 ? <div style={{ padding:'24px', textAlign:'center', color:'#3d4f63', fontSize:'13px' }}>No leads yet. They appear here as they arrive from your channels.</div>
          : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12.5px' }}>
              <thead><tr style={{ color:'#64748b', fontSize:'10px', letterSpacing:'.08em', textTransform:'uppercase' }}>
                {['Lead','Source','Status','Score','Tags','Last activity',''].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #1e2d42' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(l => { const s = srcMeta(l.source); return (
                  <tr key={l.id} onClick={()=>openLead(l)} style={{ cursor:'pointer', borderBottom:'1px solid #141d2e' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#141d2e'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 12px' }}><div style={{ fontWeight:700, color:'#e8eef5' }}>{l.name || 'Unknown'}</div><div style={{ fontSize:'11px', color:'#7a8fa6' }}>{l.phone || l.email || ''}</div></td>
                    <td style={{ padding:'10px 12px' }}>{s.i} {s.l}</td>
                    <td style={{ padding:'10px 12px' }}><span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'10px', background:(ST_COLOR[l.status]||'#64748b')+'22', color:ST_COLOR[l.status]||'#64748b', fontWeight:700 }}>{l.status}</span></td>
                    <td style={{ padding:'10px 12px' }}><span style={{ color: l.score>=70?'#16a34a':l.score>=40?'#fbbf24':'#7a8fa6', fontWeight:700 }}>{l.score ?? 0}</span></td>
                    <td style={{ padding:'10px 12px', maxWidth:'160px' }}><div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>{(l.tags||[]).slice(0,3).map(t => <span key={t} style={{ fontSize:'9px', padding:'1px 6px', borderRadius:'8px', background:'#1a2740', color:'#94a3b8' }}>{t}</span>)}</div></td>
                    <td style={{ padding:'10px 12px', color:'#7a8fa6' }}>{ago(l.updatedAt)}</td>
                    <td style={{ padding:'10px 12px', color:'#D8B16A' }}>View →</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead detail drawer */}
      {sel && (
        <div onClick={()=>setSel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:300, display:'flex', justifyContent:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'460px', maxWidth:'100vw', height:'100%', background:'#0f1622', borderLeft:'1px solid #1e2d42', overflowY:'auto', padding:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
              <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#D8B16A,#A07C3A)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#07090f', fontSize:'18px' }}>{(sel.name||'?')[0].toUpperCase()}</div>
                <div><div style={{ fontWeight:800, fontSize:'16px' }}>{sel.name || 'Unknown lead'}</div><div style={{ fontSize:'12px', color:'#7a8fa6' }}>{srcMeta(sel.source).i} {srcMeta(sel.source).l}</div></div>
              </div>
              <button onClick={()=>setSel(null)} style={{ background:'none', border:'none', color:'#7a8fa6', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'18px' }}>
              {[['Status', sel.status],['Score', sel.score ?? 0],['Source', srcMeta(sel.source).l],['Campaign', campName(sel.campaignId) || '—'],
                ...(sel.firstTouch ? [['First touch', sel.firstTouch],['Last touch', sel.lastTouch || sel.firstTouch]] : []),
                ...(sel.utmSource || sel.utmCampaign ? [['UTM source', sel.utmSource || '—'],['UTM campaign', sel.utmCampaign || '—']] : []),
                ['Phone', sel.phone || '—'],['Email', sel.email || '—'],['Value', sel.value ? `${sel.value} ${sel.currency||'QAR'}` : '—'],['City', sel.city || '—']].map(([k,v]) => (
                <div key={k} style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px' }}><div style={{ fontSize:'9px', color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em' }}>{k}</div><div style={{ fontSize:'13px', fontWeight:700, marginTop:'2px' }}>{String(v)}</div></div>
              ))}
            </div>

            {(sel.tags||[]).length>0 && <div style={{ marginBottom:'18px' }}><div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'6px' }}>Tags</div><div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{sel.tags.map(t => <span key={t} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'10px', background:'#1a2740', color:'#94a3b8' }}>{t}</span>)}</div></div>}

            {/* AI summary */}
            {can('use_ai_replies') && (
              <div style={{ background:'#0a121e', border:'1px solid #2a3d5c', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: aiSummary?'8px':'0' }}>
                  <div style={{ fontSize:'12px', fontWeight:800, color:'#a78bfa' }}>✨ AI Summary</div>
                  <button onClick={genSummary} disabled={summarizing} style={{ fontSize:'11px', padding:'4px 10px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'6px', color:'#a78bfa', fontWeight:700, cursor:'pointer' }}>{summarizing?'…':(aiSummary?'Regenerate':'Generate')}</button>
                </div>
                {aiSummary && <div style={{ fontSize:'12px', color:'#cbd5e1', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{aiSummary}</div>}
              </div>
            )}

            {/* Schedule follow-up */}
            {(can('change_status') || can('add_notes')) && (
              <div style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
                <div style={{ fontSize:'12px', fontWeight:800, marginBottom:'8px' }}>📅 Follow-up</div>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <input type="date" value={followUp} onChange={e=>saveFollowUp(e.target.value)} style={{ background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'7px', padding:'7px 10px', color:'#e8eef5', fontSize:'12px', outline:'none' }} />
                  {followUp && <button onClick={()=>saveFollowUp('')} style={{ fontSize:'11px', background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}>Clear</button>}
                </div>
              </div>
            )}

            {/* AI memory — what the assistant remembers about this customer */}
            <div style={{ background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <div style={{ fontSize:'12px', fontWeight:800, color:'#06b6d4' }}>🧠 What we remember</div>
                {can('add_notes') && <button onClick={async () => { const f = prompt('Add a fact the AI should remember about this customer:'); if (!f || !f.trim()) return; const mem = [...(sel.metadata?.memory || []), f.trim()].slice(-20); try { await api.updateContact(sel.id, { metadata: { ...(sel.metadata||{}), memory: mem } }); setSel(s => ({ ...s, metadata: { ...(s.metadata||{}), memory: mem } })) } catch {} }} style={{ fontSize:'11px', background:'none', border:'1px solid #1e2d42', borderRadius:'6px', padding:'3px 9px', color:'#7a8fa6', cursor:'pointer' }}>+ Add</button>}
              </div>
              {(sel.metadata?.memory || []).length === 0 ? <div style={{ fontSize:'11px', color:'#3d4f63' }}>Nothing yet — the AI learns durable facts each time a conversation is resolved.</div>
                : (sel.metadata.memory).map((f, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', color:'#cbd5e1', padding:'3px 0' }}>
                    <span>• {f}</span>
                    {can('add_notes') && <button onClick={async () => { const mem = (sel.metadata.memory || []).filter((_, j) => j !== i); try { await api.updateContact(sel.id, { metadata: { ...(sel.metadata||{}), memory: mem } }); setSel(s => ({ ...s, metadata: { ...(s.metadata||{}), memory: mem } })) } catch {} }} style={{ fontSize:'11px', background:'none', border:'none', color:'#64748b', cursor:'pointer' }}>×</button>}
                  </div>
                ))}
            </div>

            {!detail ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>Loading history…</div> : (<>
              {detail.conversations?.length>0 && (
                <div style={{ marginBottom:'18px' }}>
                  <div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'8px' }}>Conversations ({detail.conversations.length})</div>
                  {detail.conversations.map(c => <div key={c.id} style={{ fontSize:'12px', color:'#94a3b8', padding:'6px 0', borderBottom:'1px solid #141d2e' }}>{srcMeta(c.channel?.type).i} {c.channel?.name || c.channel?.type} · {c.status} · {ago(c.lastMsgAt || c.updatedAt)}</div>)}
                </div>
              )}
              <div style={{ marginBottom:'18px' }}>
                <div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'8px' }}>Activity timeline</div>
                {(detail.activities||[]).length===0 ? <div style={{ fontSize:'12px', color:'#3d4f63' }}>No activity yet.</div> : detail.activities.map(a => (
                  <div key={a.id} style={{ display:'flex', gap:'8px', fontSize:'12px', color:'#94a3b8', padding:'5px 0' }}>
                    <span style={{ color:'#D8B16A' }}>•</span><span>{String(a.type||'').replace(/_/g,' ')}{a.user?.name ? ` — ${a.user.name}` : ''}<span style={{ color:'#3d4f63' }}> · {ago(a.createdAt)}</span></span>
                  </div>
                ))}
              </div>
              {(detail.notes||[]).length>0 && (
                <div>
                  <div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'8px' }}>Notes</div>
                  {detail.notes.map(n => <div key={n.id} style={{ fontSize:'12px', color:'#94a3b8', padding:'6px 0', borderBottom:'1px solid #141d2e' }}>📝 {n.content}{n.author?.name ? <span style={{ color:'#3d4f63' }}> — {n.author.name}</span> : ''}</div>)}
                </div>
              )}
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}
