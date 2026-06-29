'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const card = { background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'12px', padding:'16px' }
const inp = { background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }
const CH = [['whatsapp','💬 WhatsApp'],['website','🌐 Website Chatbot'],['instagram','📸 Instagram'],['email','📧 Email']]
const ST_C = { DRAFT:'#64748b', SCHEDULED:'#a78bfa', RUNNING:'#16a34a', PAUSED:'#fbbf24', COMPLETED:'#3b82f6' }

export default function ClientCampaigns({ me }) {
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [f, setF] = useState({ name:'', channel:'whatsapp', message:'', audience:'all', tag:'', tone:'friendly', when:'now', scheduledAt:'' })
  const [genBusy, setGenBusy] = useState(false)
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))

  const load = () => api.getCampaigns({ limit: 50 }).then(r => setList(r?.data || r || [])).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const stats = {
    total: list.length,
    active: list.filter(c => c.status === 'RUNNING').length,
    scheduled: list.filter(c => c.status === 'SCHEDULED').length,
    recipients: list.reduce((s,c)=>s+(c.totalRecipients||0),0),
    replied: list.reduce((s,c)=>s+(c.replied||0),0),
    converted: list.reduce((s,c)=>s+(c.converted||0),0),
  }

  const genMsg = async () => {
    if (!f.name.trim()) { setMsg({ ok:false, text:'Give the campaign a name/goal first.' }); return }
    setGenBusy(true)
    try { const r = await api.generateCampaignMessage(`Campaign: ${f.name}. Channel: ${f.channel}.`, f.tone, me?.org?.modules ? undefined : undefined); set('message', r?.message || r?.reply || '') }
    catch { setMsg({ ok:false, text:'Could not generate a message' }) } finally { setGenBusy(false) }
  }

  const create = async () => {
    if (!f.name.trim() || !f.message.trim()) { setMsg({ ok:false, text:'Name and message are required' }); return }
    setBusy(true); setMsg(null)
    try {
      const c = await api.createCampaign({ name: f.name.trim(), message: f.message.trim(), type:'BROADCAST', status:'DRAFT' })
      // audience
      const filter = f.audience === 'all' ? { all:true } : f.audience === 'tag' ? { tag: f.tag } : { status: f.audience }
      await api.addCampaignAudience(c.id, filter).catch(()=>{})
      // send or schedule
      if (f.when === 'schedule' && f.scheduledAt) await api.scheduleCampaign(c.id, { scheduledAt: new Date(f.scheduledAt).toISOString() })
      else await api.launchCampaign(c.id)
      setMsg({ ok:true, text: f.when === 'schedule' ? 'Campaign scheduled ✓' : 'Campaign launched ✓' })
      setShow(false); setF({ name:'', channel:'whatsapp', message:'', audience:'all', tag:'', tone:'friendly', when:'now', scheduledAt:'' }); load()
    } catch (e) { setMsg({ ok:false, text: e?.message || 'Failed (channel may not be connected)' }) } finally { setBusy(false) }
  }

  return (
    <div>
      {msg && <div style={{ marginBottom:'12px', padding:'10px 14px', borderRadius:'8px', fontSize:'12px', background: msg.ok?'rgba(216,177,106,.1)':'rgba(239,68,68,.1)', border:`1px solid ${msg.ok?'rgba(216,177,106,.3)':'rgba(239,68,68,.3)'}`, color: msg.ok?'#D8B16A':'#ef4444' }}>{msg.text}</div>}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'16px' }}>
        {[['Campaigns',stats.total,'#D8B16A'],['Active',stats.active,'#16a34a'],['Scheduled',stats.scheduled,'#a78bfa'],['Recipients',stats.recipients,'#3b82f6'],['Replies',stats.replied,'#06b6d4'],['Converted',stats.converted,'#16a34a']].map(([l,v,c]) => (
          <div key={l} style={{ ...card, padding:'12px', textAlign:'center' }}><div style={{ fontSize:'22px', fontWeight:900, color:c }}>{v}</div><div style={{ fontSize:'10px', color:'#7a8fa6' }}>{l}</div></div>
        ))}
      </div>

      {can('launch_campaigns') && !show && (
        <button onClick={()=>{ setShow(true); setMsg(null) }} style={{ padding:'10px 20px', background:'#D8B16A', border:'none', borderRadius:'8px', color:'#07090f', fontWeight:800, fontSize:'13px', cursor:'pointer', marginBottom:'16px' }}>+ New Campaign</button>
      )}

      {/* Builder */}
      {show && (
        <div style={{ ...card, marginBottom:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontWeight:800, fontSize:'14px' }}>New Campaign</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Name / goal</label><input value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Summer Checkup 2026" style={{ ...inp, width:'100%', boxSizing:'border-box' }} /></div>
            <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Channel</label><select value={f.channel} onChange={e=>set('channel',e.target.value)} style={{ ...inp, width:'100%', cursor:'pointer' }}>{CH.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Message</label>
              <button onClick={genMsg} disabled={genBusy} style={{ fontSize:'11px', padding:'3px 10px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'6px', color:'#a78bfa', fontWeight:700, cursor:'pointer' }}>{genBusy?'…':'✨ AI write'}</button>
            </div>
            <textarea value={f.message} onChange={e=>set('message',e.target.value)} rows={3} placeholder="Use {{name}} for the lead's name…" style={{ ...inp, width:'100%', boxSizing:'border-box', resize:'vertical' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Audience</label>
              <select value={f.audience} onChange={e=>set('audience',e.target.value)} style={{ ...inp, width:'100%', cursor:'pointer' }}>
                <option value="all">All contacts</option><option value="NEW">New leads</option><option value="QUALIFIED">Qualified</option><option value="WON">Customers (Won)</option><option value="tag">By tag…</option>
              </select>
              {f.audience === 'tag' && <input value={f.tag} onChange={e=>set('tag',e.target.value)} placeholder="tag name" style={{ ...inp, width:'100%', boxSizing:'border-box', marginTop:'6px' }} />}
            </div>
            <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>When</label>
              <select value={f.when} onChange={e=>set('when',e.target.value)} style={{ ...inp, width:'100%', cursor:'pointer' }}><option value="now">Send now</option><option value="schedule">Schedule</option></select>
              {f.when === 'schedule' && <input type="datetime-local" value={f.scheduledAt} onChange={e=>set('scheduledAt',e.target.value)} style={{ ...inp, width:'100%', boxSizing:'border-box', marginTop:'6px' }} />}
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={create} disabled={busy} style={{ padding:'9px 20px', background: busy?'#1a2235':'#D8B16A', border:'none', borderRadius:'8px', color: busy?'#64748b':'#07090f', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>{busy?'Working…':(f.when==='schedule'?'Schedule':'Send now')}</button>
            <button onClick={()=>setShow(false)} style={{ padding:'9px 16px', background:'transparent', border:'1px solid #1e2d42', borderRadius:'8px', color:'#7a8fa6', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      <div style={card}>
        {loading ? <div style={{ color:'#3d4f63', fontSize:'12px', textAlign:'center', padding:'16px' }}>Loading…</div>
          : list.length === 0 ? <div style={{ color:'#3d4f63', fontSize:'12px', textAlign:'center', padding:'16px' }}>No campaigns yet.</div>
          : list.map(c => (
            <div key={c.id} style={{ padding:'12px 0', borderBottom:'1px solid #1a2235' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <span style={{ fontWeight:700, fontSize:'13px' }}>{c.name}</span>
                <span style={{ fontSize:'10px', padding:'2px 9px', borderRadius:'10px', background:(ST_C[c.status]||'#64748b')+'22', color:ST_C[c.status]||'#64748b', fontWeight:700 }}>{c.status}</span>
              </div>
              <div style={{ display:'flex', gap:'14px', fontSize:'11px', color:'#7a8fa6' }}>
                <span>👥 {c.totalRecipients||0} recipients</span><span>✓ {c.delivered||0} delivered</span><span>💬 {c.replied||0} replies</span><span style={{ color:'#16a34a' }}>🎯 {c.converted||0} converted</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
