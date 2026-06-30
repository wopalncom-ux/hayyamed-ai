'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const card = { background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'12px', padding:'18px' }
const SRC_C = { whatsapp:'#25D366', instagram:'#E1306C', facebook:'#3b82f6', messenger:'#3b82f6', website:'#06b6d4', webchat:'#06b6d4', live_chat:'#06b6d4', telegram:'#0088cc', email:'#fbbf24', manual:'#a78bfa', import:'#64748b', campaign:'#f97316' }
const SRC_L = { whatsapp:'WhatsApp', instagram:'Instagram', facebook:'Facebook', messenger:'Messenger', website:'Website', webchat:'Website', live_chat:'Website', telegram:'Telegram', email:'Email', manual:'Manual', import:'Import', campaign:'Campaign' }
const ST_C = { NEW:'#3b82f6', CONTACTED:'#06b6d4', QUALIFYING:'#f97316', QUALIFIED:'#D8B16A', NEGOTIATION:'#fbbf24', WON:'#16a34a', LOST:'#ef4444', UNQUALIFIED:'#64748b' }
const srcC = (s) => SRC_C[String(s||'').toLowerCase()] || '#64748b'
const srcL = (s) => SRC_L[String(s||'').toLowerCase()] || s

function Donut({ data, total }) {
  let acc = 0, R = 54, C = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 140 140" style={{ width:'150px', height:'150px' }}>
      <circle cx="70" cy="70" r={R} fill="none" stroke="#1a2740" strokeWidth="18" />
      {data.map((d, i) => { const frac = d.count/total; const dash = frac*C; const off = -acc*C; acc += frac
        return <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={srcC(d.source)} strokeWidth="18" strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={off} transform="rotate(-90 70 70)" /> })}
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="#e8eef5">{total}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#7a8fa6">LEADS</text>
    </svg>
  )
}

export default function ClientReports({ me }) {
  const can = (p) => !!me && Array.isArray(me.permissions) && me.permissions.includes(p) && me?.org?.modules?.portal_export?.enabled !== false
  const [full, setFull] = useState(null)
  const [days, setDays] = useState([])
  const [team, setTeam] = useState([])
  const [camps, setCamps] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getFullStats().catch(()=>null), api.getAnalytics('7days').catch(()=>null), api.getTeam().catch(()=>[]), api.getCampaigns({ limit: 100 }).catch(()=>({data:[]})), api.getContacts({ limit: 500 }).catch(()=>({data:[]}))])
      .then(([f, a, t, c, ct]) => { setFull(f); setDays(a?.days || []); setTeam(Array.isArray(t)?t:[]); setCamps(c?.data||c||[]); setContacts(ct?.data||ct||[]); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding:'30px', textAlign:'center', color:'#3d4f63' }}>Loading reports…</div>

  const sources = (full?.sources || []).filter(s => s.count > 0)
  const totalSrc = sources.reduce((a,s)=>a+s.count,0) || 0
  const pipeline = (full?.pipeline || []).filter(s => !['LOST'].includes(s.status))
  const pipeMax = Math.max(...(full?.pipeline||[]).map(s=>s.count), 1)
  const k = full?.kpis || {}
  const ls = full?.leadStats || {}
  const dayMax = Math.max(...days.map(d=>d.contacts||0), 1)

  // Campaign performance + ROI (leads counted from attributed contacts; revenue = won leads' value)
  const isWon = (s) => ['WON','CONVERTED','CLOSED'].includes(String(s||'').toUpperCase())
  const campRows = camps.map(c => {
    const leads = contacts.filter(ct => ct.campaignId === c.id)
    const won = leads.filter(ct => isWon(ct.status))
    const revenue = won.reduce((a,ct)=>a+(Number(ct.value)||0),0)
    const cost = Number(c.cost)||0
    return { id:c.id, name:c.name, leads:leads.length, converted: won.length || c.converted || 0, cost, cpl: leads.length&&cost?+(cost/leads.length).toFixed(1):null, revenue, roi: cost? Math.round((revenue-cost)/cost*100) : null }
  }).filter(r => r.leads>0 || r.cost>0).sort((a,b)=>b.leads-a.leads)
  const campTotals = campRows.reduce((a,r)=>({ leads:a.leads+r.leads, converted:a.converted+r.converted, cost:a.cost+r.cost, revenue:a.revenue+r.revenue }), { leads:0, converted:0, cost:0, revenue:0 })
  const totalRoi = campTotals.cost ? Math.round((campTotals.revenue-campTotals.cost)/campTotals.cost*100) : null

  const exportCsv = () => {
    const rows = [['Metric','Value'],
      ['Total leads', k.totalContacts ?? 0],['New (7d)', k.newContacts7d ?? 0],['Won', k.wonContacts ?? 0],['Lost', k.lostContacts ?? 0],
      ['Win rate %', k.winRate ?? 0],['Open conversations', k.openConvs ?? 0],['Avg response (min)', k.avgResponseMin ?? ''],
      [], ['Source','Leads'], ...sources.map(s=>[srcL(s.source), s.count]),
      [], ['Stage','Leads'], ...(full?.pipeline||[]).map(s=>[s.status, s.count]),
      [], ['Campaign','Leads','Converted','Cost','Cost/Lead','Revenue','ROI %'], ...campRows.map(r=>[r.name, r.leads, r.converted, r.cost, r.cpl??'', r.revenue, r.roi??'']),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'hayya-report.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="hm-print">
      <style>{`@media print{ body *{visibility:hidden} .hm-print,.hm-print *{visibility:visible} .hm-print{position:absolute;left:0;top:0;width:100%} .hm-noprint{display:none!important} }`}</style>
      <div className="hm-noprint" style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginBottom:'14px' }}>
        {can('export_reports') && <button onClick={exportCsv} style={{ padding:'8px 16px', background:'#1a2740', border:'1px solid #2a3d5c', borderRadius:'8px', color:'#e8eef5', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>⬇ Export CSV</button>}
        {can('export_reports') && <button onClick={()=>window.print()} style={{ padding:'8px 16px', background:'#D8B16A', border:'none', borderRadius:'8px', color:'#07090f', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>🖨 Print / PDF</button>}
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'12px', marginBottom:'16px' }}>
        {[
          { l:'Total leads', v:k.totalContacts ?? 0, c:'#D8B16A' },
          { l:'New (7 days)', v:k.newContacts7d ?? 0, c:'#3b82f6' },
          { l:'Converted', v:k.wonContacts ?? 0, c:'#16a34a' },
          { l:'Open chats', v:k.openConvs ?? 0, c:'#f97316' },
          { l:'Unanswered', v:ls.unassignedOpen ?? 0, c:'#ef4444' },
          { l:'Avg response', v:k.avgResponseMin!=null ? (k.avgResponseMin<60?`${k.avgResponseMin}m`:`${Math.round(k.avgResponseMin/60*10)/10}h`) : '—', c:'#a78bfa' },
        ].map(x => <div key={x.l} style={{ ...card, padding:'14px' }}><div style={{ fontSize:'22px', fontWeight:800, color:x.c }}>{x.v}</div><div style={{ fontSize:'10px', color:'#7a8fa6', marginTop:'3px', textTransform:'uppercase', letterSpacing:'.05em' }}>{x.l}</div></div>)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
        {/* Leads by source donut */}
        <div style={card}>
          <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'12px' }}>Leads by Source</div>
          {totalSrc===0 ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>No leads yet.</div> : (
            <div style={{ display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap' }}>
              <Donut data={sources} total={totalSrc} />
              <div style={{ flex:1, minWidth:'120px' }}>{sources.map(s => (
                <div key={s.source} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', padding:'3px 0' }}>
                  <span><span style={{ display:'inline-block', width:'9px', height:'9px', borderRadius:'2px', background:srcC(s.source), marginRight:'7px' }} />{srcL(s.source)}</span>
                  <span style={{ fontWeight:700 }}>{s.count} <span style={{ color:'#64748b' }}>({Math.round(s.count/totalSrc*100)}%)</span></span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
        {/* Leads over time */}
        <div style={card}>
          <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'12px' }}>Leads — last 7 days</div>
          {days.length===0 ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>No data yet.</div> : (
            <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'120px' }}>
              {days.map((d,i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                  <div style={{ fontSize:'9px', color:'#D8B16A', fontWeight:700 }}>{d.contacts||0}</div>
                  <div style={{ width:'100%', background:'#D8B16A', borderRadius:'4px 4px 0 0', height:`${(d.contacts||0)/dayMax*90}%`, minHeight:'3px', opacity:.85 }} />
                  <div style={{ fontSize:'9px', color:'#3d4f63', marginTop:'4px' }}>{['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d.date).getUTCDay()]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leads by Campaign — visual bar chart */}
      {campRows.length > 0 && (
        <div style={{ ...card, marginBottom:'16px' }}>
          <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'14px' }}>Leads by Campaign</div>
          {campRows.map(r => {
            const max = Math.max(...campRows.map(x => x.leads), 1)
            return (
              <div key={r.id} style={{ marginBottom:'11px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
                  <span style={{ color:'#e8eef5' }}>{r.name}</span>
                  <span style={{ color:'#7a8fa6' }}><b style={{ color:'#06b6d4' }}>{r.leads}</b> leads · <b style={{ color:'#16a34a' }}>{r.converted}</b> won{r.roi!=null && <> · <b style={{ color: r.roi>=0?'#16a34a':'#ef4444' }}>{r.roi>=0?'+':''}{r.roi}% ROI</b></>}</span>
                </div>
                <div style={{ height:'14px', background:'#0a121e', borderRadius:'7px', overflow:'hidden' }}>
                  <div style={{ width:`${r.leads/max*100}%`, height:'100%', background:'linear-gradient(90deg,#06b6d4,#D8B16A)', borderRadius:'7px', minWidth: r.leads>0?'6px':'0' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Campaign performance + ROI */}
      <div style={{ ...card, marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div style={{ fontWeight:800, fontSize:'13px' }}>Campaign Performance &amp; ROI</div>
          {totalRoi!=null && <span style={{ fontSize:'12px', fontWeight:800, color: totalRoi>=0?'#16a34a':'#ef4444' }}>Overall ROI {totalRoi>=0?'+':''}{totalRoi}%</span>}
        </div>
        {campRows.length===0 ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>No campaign leads yet. Set a cost on a campaign and attribute leads to see ROI.</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
              <thead><tr style={{ textAlign:'left', color:'#64748b', fontSize:'10px', textTransform:'uppercase' }}>
                {['Campaign','Leads','Won','Cost','Cost/Lead','Revenue','ROI'].map((h,i)=><th key={h} style={{ padding:'6px 8px', textAlign: i===0?'left':'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {campRows.map(r => (
                  <tr key={r.id} style={{ borderTop:'1px solid #1a2235' }}>
                    <td style={{ padding:'8px', fontWeight:700 }}>{r.name}</td>
                    <td style={{ padding:'8px', textAlign:'right', color:'#06b6d4', fontWeight:700 }}>{r.leads}</td>
                    <td style={{ padding:'8px', textAlign:'right', color:'#16a34a', fontWeight:700 }}>{r.converted}</td>
                    <td style={{ padding:'8px', textAlign:'right' }}>{r.cost?`${r.cost} QAR`:'—'}</td>
                    <td style={{ padding:'8px', textAlign:'right', color:'#D8B16A' }}>{r.cpl!=null?`${r.cpl}`:'—'}</td>
                    <td style={{ padding:'8px', textAlign:'right' }}>{r.revenue?`${r.revenue} QAR`:'—'}</td>
                    <td style={{ padding:'8px', textAlign:'right', fontWeight:800, color: r.roi==null?'#64748b':r.roi>=0?'#16a34a':'#ef4444' }}>{r.roi==null?'—':`${r.roi>=0?'+':''}${r.roi}%`}</td>
                  </tr>
                ))}
                <tr style={{ borderTop:'2px solid #2a3d5c', color:'#94a3b8' }}>
                  <td style={{ padding:'8px', fontWeight:800 }}>Total</td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:800 }}>{campTotals.leads}</td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:800 }}>{campTotals.converted}</td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:800 }}>{campTotals.cost?`${campTotals.cost} QAR`:'—'}</td>
                  <td style={{ padding:'8px' }}></td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:800 }}>{campTotals.revenue?`${campTotals.revenue} QAR`:'—'}</td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:800, color: totalRoi==null?'#64748b':totalRoi>=0?'#16a34a':'#ef4444' }}>{totalRoi==null?'—':`${totalRoi>=0?'+':''}${totalRoi}%`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status funnel */}
      <div style={{ ...card, marginBottom:'16px' }}>
        <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'12px' }}>Lead Status Funnel</div>
        {pipeline.map(s => (
          <div key={s.status} style={{ marginBottom:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'3px' }}><span style={{ color:'#94a3b8' }}>{s.status}</span><span style={{ fontWeight:700 }}>{s.count}</span></div>
            <div style={{ height:'10px', background:'#0a121e', borderRadius:'5px', overflow:'hidden' }}><div style={{ width:`${s.count/pipeMax*100}%`, height:'100%', background:ST_C[s.status]||'#64748b', borderRadius:'5px' }} /></div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        {/* Channel performance cards */}
        <div style={card}>
          <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'12px' }}>Channel performance</div>
          {sources.length===0 ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>No channels yet.</div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'8px' }}>
              {sources.map(s => <div key={s.source} style={{ background:'#0a121e', border:`1px solid ${srcC(s.source)}33`, borderTop:`2px solid ${srcC(s.source)}`, borderRadius:'8px', padding:'12px' }}><div style={{ fontSize:'20px', fontWeight:800 }}>{s.count}</div><div style={{ fontSize:'11px', color:'#7a8fa6' }}>{srcL(s.source)}</div></div>)}
            </div>
          )}
        </div>
        {/* Team performance */}
        <div style={card}>
          <div style={{ fontWeight:800, fontSize:'13px', marginBottom:'12px' }}>Team</div>
          {team.length===0 ? <div style={{ color:'#3d4f63', fontSize:'12px' }}>No team members yet.</div> : team.map(t => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 0', borderBottom:'1px solid #141d2e' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#D8B16A,#A07C3A)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#07090f', fontSize:'12px' }}>{(t.name||t.email||'?')[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:'12px', fontWeight:700 }}>{t.name||t.email}</div><div style={{ fontSize:'10px', color:'#7a8fa6' }}>{t.role || ''}</div></div>
              <div style={{ fontSize:'10px', color: t.lastSeen?'#16a34a':'#64748b' }}>{t.lastSeen ? 'active' : '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
