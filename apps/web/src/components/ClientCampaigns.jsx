'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const card = { background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'12px', padding:'16px' }
const inp = { background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'10px 12px', color:'#e8eef5', fontSize:'13px', outline:'none' }
const CH = [['whatsapp','💬 WhatsApp'],['website','🌐 Website Chatbot'],['instagram','📸 Instagram'],['facebook','👍 Facebook Messenger'],['email','📧 Email']]
const ST_C = { DRAFT:'#64748b', SCHEDULED:'#a78bfa', RUNNING:'#16a34a', PAUSED:'#fbbf24', COMPLETED:'#3b82f6' }

export default function ClientCampaigns({ me }) {
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [f, setF] = useState({ name:'', channel:'whatsapp', message:'', mediaType:'none', media:'', audience:'all', tag:'', tone:'friendly', when:'now', scheduledAt:'' })
  const [genBusy, setGenBusy] = useState(false)
  const [upBusy, setUpBusy] = useState(false)
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))
  const uploadMedia = async (file) => {
    if (!file) return
    setUpBusy(true); setMsg(null)
    try { const r = await api.uploadMedia(file); set('media', r.url) }
    catch (e) { setMsg({ ok:false, text: e.message || 'Upload failed' }) } finally { setUpBusy(false) }
  }

  const [leadsByCamp, setLeadsByCamp] = useState({})
  const [contacts, setContacts] = useState([])
  const load = () => api.getCampaigns({ limit: 50 }).then(r => setList(r?.data || r || [])).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(() => {
    load()
    api.getContacts({ limit: 500 }).then(r => { const a = r?.data || r || []; setContacts(a); const m = {}; a.forEach(c => { if (c.campaignId) m[c.campaignId] = (m[c.campaignId]||0)+1 }); setLeadsByCamp(m) }).catch(()=>{})
  }, [])

  // Estimated send cost (QAR/message; rough — WhatsApp business-initiated has real per-conversation pricing)
  const RATE = { whatsapp:0.10, instagram:0, facebook:0, website:0, email:0.005 }
  // Broadcast currently sends via WhatsApp → only contacts with a phone are reachable (matches backend filter)
  const reachable = contacts.filter(c => c.phone)
  const audienceSize = (f.audience === 'all') ? reachable.length
    : (f.audience === 'tag') ? reachable.filter(c => (c.tags||[]).includes(f.tag)).length
    : reachable.filter(c => String(c.status||'').toUpperCase() === f.audience).length
  const estCost = +(audienceSize * (RATE[f.channel] ?? 0)).toFixed(2)
  const TEMPLATES = {
    '': '',
    'Appointment reminder': 'Hi {{name}}, a friendly reminder about your upcoming appointment. Reply here to confirm or reschedule. 🦷',
    'Seasonal promotion': 'Hi {{name}}! For a limited time we have a special offer just for you. Reply to learn more and book your spot. ✨',
    'Re-engagement': 'Hi {{name}}, we miss you! It has been a while — is there anything we can help you with today?',
    'New service': 'Hi {{name}}, exciting news! We just launched a new service we think you will love. Want the details?',
  }

  const leadsOf = (c) => leadsByCamp[c.id] || c.replied || 0
  const respRate = (c) => c.totalRecipients ? Math.round((c.replied||0)/c.totalRecipients*100) : 0
  const convRate = (c) => { const l = leadsOf(c); return l ? Math.round((c.converted||0)/l*100) : 0 }
  const costPerLead = (c) => { const l = leadsOf(c); return (c.cost && l) ? +(c.cost/l).toFixed(1) : null }
  const saveCost = async (c, v) => { try { await api.updateCampaign(c.id, { cost: v === '' ? null : Number(v) }); load() } catch {} }

  const stats = {
    total: list.length,
    active: list.filter(c => c.status === 'RUNNING').length,
    scheduled: list.filter(c => c.status === 'SCHEDULED').length,
    recipients: list.reduce((s,c)=>s+(c.totalRecipients||0),0),
    leads: list.reduce((s,c)=>s+leadsOf(c),0),
    converted: list.reduce((s,c)=>s+(c.converted||0),0),
  }
  const best = list.filter(c => leadsOf(c) > 0).sort((a,b) => (b.converted||0)-(a.converted||0))[0]

  const genMsg = async () => {
    if (!f.name.trim()) { setMsg({ ok:false, text:'Give the campaign a name/goal first.' }); return }
    setGenBusy(true)
    try { const r = await api.generateCampaignMessage(`Campaign: ${f.name}. Channel: ${f.channel}.`, f.tone, me?.org?.modules ? undefined : undefined); set('message', r?.message || r?.reply || '') }
    catch { setMsg({ ok:false, text:'Could not generate a message' }) } finally { setGenBusy(false) }
  }

  const create = async () => {
    if (!f.name.trim() || !f.message.trim()) { setMsg({ ok:false, text:'Name and message are required' }); return }
    if ((f.mediaType === 'image' || f.mediaType === 'video' || f.mediaType === 'link') && !f.media.trim()) { setMsg({ ok:false, text:`Add the ${f.mediaType} URL or pick "Text only"` }); return }
    setBusy(true); setMsg(null)
    try {
      // image/video → mediaUrl (sent as attachment + caption); link → appended to the text (WhatsApp previews it)
      let message = f.message.trim()
      let mediaUrl
      if (f.mediaType === 'image' || f.mediaType === 'video') mediaUrl = f.media.trim()
      else if (f.mediaType === 'link' && f.media.trim()) message = `${message}\n${f.media.trim()}`
      const c = await api.createCampaign({ name: f.name.trim(), message, type:'BROADCAST', status:'DRAFT', channelType: f.channel, ...(mediaUrl ? { mediaUrl } : {}), ...(estCost > 0 ? { cost: estCost } : {}) })
      // audience
      const filter = f.audience === 'all' ? { all:true } : f.audience === 'tag' ? { tag: f.tag } : { status: f.audience }
      await api.addCampaignAudience(c.id, filter).catch(()=>{})
      // send or schedule
      if (f.when === 'schedule' && f.scheduledAt) await api.scheduleCampaign(c.id, { scheduledAt: new Date(f.scheduledAt).toISOString() })
      else await api.launchCampaign(c.id)
      setMsg({ ok:true, text: f.when === 'schedule' ? 'Campaign scheduled ✓' : 'Campaign launched ✓' })
      setShow(false); setF({ name:'', channel:'whatsapp', message:'', mediaType:'none', media:'', audience:'all', tag:'', tone:'friendly', when:'now', scheduledAt:'' }); load()
    } catch (e) { setMsg({ ok:false, text: e?.message || 'Failed (channel may not be connected)' }) } finally { setBusy(false) }
  }

  return (
    <div>
      {msg && <div style={{ marginBottom:'12px', padding:'10px 14px', borderRadius:'8px', fontSize:'12px', background: msg.ok?'rgba(216,177,106,.1)':'rgba(239,68,68,.1)', border:`1px solid ${msg.ok?'rgba(216,177,106,.3)':'rgba(239,68,68,.3)'}`, color: msg.ok?'#D8B16A':'#ef4444' }}>{msg.text}</div>}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'12px' }}>
        {[['Campaigns',stats.total,'#D8B16A'],['Active',stats.active,'#16a34a'],['Scheduled',stats.scheduled,'#a78bfa'],['Recipients',stats.recipients,'#3b82f6'],['Leads',stats.leads,'#06b6d4'],['Converted',stats.converted,'#16a34a']].map(([l,v,c]) => (
          <div key={l} style={{ ...card, padding:'12px', textAlign:'center' }}><div style={{ fontSize:'22px', fontWeight:900, color:c }}>{v}</div><div style={{ fontSize:'10px', color:'#7a8fa6' }}>{l}</div></div>
        ))}
      </div>
      {best && (
        <div style={{ ...card, marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px', borderColor:'rgba(22,163,74,.3)' }}>
          <span style={{ fontSize:'22px' }}>🏆</span>
          <div><div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Best performing campaign</div><div style={{ fontSize:'14px', fontWeight:800 }}>{best.name} <span style={{ color:'#16a34a', fontSize:'12px' }}>· {best.converted||0} converted · {convRate(best)}% conv.</span></div></div>
        </div>
      )}

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
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px', gap:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Message</label>
              <div style={{ display:'flex', gap:'6px' }}>
                <select onChange={e=>{ if (TEMPLATES[e.target.value]) set('message', TEMPLATES[e.target.value]); e.target.value='' }} defaultValue="" style={{ ...inp, padding:'4px 8px', fontSize:'11px', cursor:'pointer' }}>
                  <option value="">📋 Template…</option>{Object.keys(TEMPLATES).filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={genMsg} disabled={genBusy} style={{ fontSize:'11px', padding:'3px 10px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'6px', color:'#a78bfa', fontWeight:700, cursor:'pointer' }}>{genBusy?'…':'✨ AI write'}</button>
              </div>
            </div>
            <textarea value={f.message} onChange={e=>set('message',e.target.value)} rows={3} placeholder="Use {{name}} for the lead's name…" style={{ ...inp, width:'100%', boxSizing:'border-box', resize:'vertical' }} />
          </div>
          {/* Attachment: text-only / image / video / link */}
          <div style={{ display:'grid', gridTemplateColumns:'150px 1fr', gap:'10px' }}>
            <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>Attachment</label>
              <select value={f.mediaType} onChange={e=>set('mediaType',e.target.value)} style={{ ...inp, width:'100%', cursor:'pointer' }}>
                <option value="none">📝 Text only</option><option value="image">🖼️ Image</option><option value="video">🎥 Video</option><option value="link">🔗 Link</option>
              </select>
            </div>
            {f.mediaType !== 'none' && (
              <div><label style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase' }}>{f.mediaType === 'link' ? 'Link URL' : `${f.mediaType} (paste URL or upload)`}</label>
                <div style={{ display:'flex', gap:'6px' }}>
                  <input value={f.media} onChange={e=>set('media',e.target.value)} placeholder={f.mediaType==='image' ? 'https://…/photo.jpg' : f.mediaType==='video' ? 'https://…/clip.mp4' : 'https://…'} style={{ ...inp, flex:1, boxSizing:'border-box' }} />
                  {(f.mediaType==='image' || f.mediaType==='video') && (
                    <label style={{ display:'flex', alignItems:'center', padding:'0 12px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'8px', color:'#D8B16A', fontSize:'11px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                      {upBusy ? '…' : '⬆ Upload'}
                      <input type="file" accept={f.mediaType==='image' ? 'image/*' : 'video/*'} onChange={e=>uploadMedia(e.target.files?.[0])} style={{ display:'none' }} />
                    </label>
                  )}
                </div>
                {f.media && (f.mediaType==='image') && <img src={f.media} alt="" style={{ marginTop:'6px', maxHeight:'70px', borderRadius:'6px', border:'1px solid #1e2d42' }} />}
              </div>
            )}
          </div>
          {(f.mediaType === 'image' || f.mediaType === 'video') && <div style={{ fontSize:'10px', color:'#475569', marginTop:'-4px' }}>WhatsApp sends the {f.mediaType} with your message as the caption. URL must be public (https). Image: jpg/png · Video: mp4.</div>}
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
          {/* Estimated cost preview */}
          <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'10px 14px', background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', fontSize:'12px', flexWrap:'wrap' }}>
            <span style={{ color:'#7a8fa6' }}>📊 <b style={{ color:'#e8eef5' }}>{audienceSize}</b> recipients</span>
            <span style={{ color:'#7a8fa6' }}>·</span>
            <span style={{ color:'#7a8fa6' }}>Est. send cost: <b style={{ color:'#D8B16A' }}>{estCost > 0 ? `${estCost} QAR` : 'Free'}</b></span>
            {f.channel === 'whatsapp' && <span style={{ fontSize:'10px', color:'#475569' }}>(~0.10 QAR/msg estimate)</span>}
          </div>
          {f.channel !== 'whatsapp' && (
            <div style={{ fontSize:'11px', color:'#d97706', background:'rgba(217,119,6,.08)', border:'1px solid rgba(217,119,6,.25)', borderRadius:'8px', padding:'8px 12px' }}>
              ⚠️ Outbound broadcast currently sends via <b>WhatsApp</b>. {f.channel === 'website' ? 'Website' : f.channel === 'instagram' ? 'Instagram' : f.channel === 'facebook' ? 'Facebook' : 'Email'} captures inbound leads + attribution today; live outbound on this channel activates once it is connected.
            </div>
          )}
          {f.channel === 'whatsapp' && audienceSize === 0 && (
            <div style={{ fontSize:'11px', color:'#d97706', background:'rgba(217,119,6,.08)', border:'1px solid rgba(217,119,6,.25)', borderRadius:'8px', padding:'8px 12px' }}>
              ⚠️ No reachable recipients — this audience has no contacts with a WhatsApp number yet.
            </div>
          )}
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
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <span style={{ fontWeight:700, fontSize:'13px' }}>{c.name}</span>
                <span style={{ fontSize:'10px', padding:'2px 9px', borderRadius:'10px', background:(ST_C[c.status]||'#64748b')+'22', color:ST_C[c.status]||'#64748b', fontWeight:700 }}>{c.status}</span>
              </div>
              <div style={{ display:'flex', gap:'14px', fontSize:'11px', color:'#7a8fa6', flexWrap:'wrap', marginBottom:'6px' }}>
                <span>👥 {c.totalRecipients||0} sent</span><span>💬 {respRate(c)}% replied</span><span>🧲 {leadsOf(c)} leads</span><span style={{ color:'#16a34a' }}>🎯 {c.converted||0} won · {convRate(c)}%</span>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center', fontSize:'11px', color:'#64748b' }}>
                <span>💰 Cost (QAR):</span>
                <input type="number" min="0" defaultValue={c.cost ?? ''} onBlur={e=>saveCost(c, e.target.value)} placeholder="—" style={{ ...inp, width:'80px', padding:'5px 8px', fontSize:'11px' }} />
                {costPerLead(c) != null && <span style={{ color:'#D8B16A', fontWeight:700 }}>= {costPerLead(c)} QAR / lead</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
