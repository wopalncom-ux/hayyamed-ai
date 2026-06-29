'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

const inp = { background:'#0a121e', border:'1px solid #1e2d42', borderRadius:'8px', padding:'8px 10px', color:'#e8eef5', fontSize:'12px', outline:'none' }
// Target contact fields; name + (phone|email) required by backend
const FIELDS = [['name','Name *'],['phone','Phone (WhatsApp)'],['email','Email'],['source','Source'],['status','Status'],['city','City'],['country','Country'],['tags','Tags'],['notes','Notes'],['value','Deal value']]
const norm = (s) => String(s||'').toLowerCase().replace(/[^a-z]/g,'')
const GUESS = { name:['name','fullname','contact','client'], phone:['phone','mobile','whatsapp','number','tel','cell'], email:['email','mail'], source:['source','channel'], status:['status','stage'], city:['city','town'], country:['country'], tags:['tags','tag','labels'], notes:['notes','note','comment'], value:['value','amount','deal','price'] }

export default function ClientImport({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [sample, setSample] = useState([])
  const [mapping, setMapping] = useState({})
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [result, setResult] = useState(null)

  const pick = async (f) => {
    if (!f) return
    setFile(f); setErr(null); setBusy(true)
    try {
      const p = await api.previewImport(f)
      const hs = p.headers || []
      setHeaders(hs); setSample((p.rows || []).slice(0, 3))
      // auto-map by header name
      const m = {}
      for (const [field] of FIELDS) {
        const hit = hs.find(h => (GUESS[field] || []).some(g => norm(h).includes(g)))
        if (hit) m[field] = hit
      }
      setMapping(m); setStep(2)
    } catch (e) { setErr(e.message || 'Could not read file') } finally { setBusy(false) }
  }

  const run = async () => {
    if (!mapping.name) { setErr('Map the Name column first'); return }
    if (!mapping.phone && !mapping.email) { setErr('Map a Phone or Email column (needed to reach leads)'); return }
    setBusy(true); setErr(null)
    try {
      const r = await api.importContacts(file, mapping, { defaultSource: 'import', defaultStatus: 'NEW' })
      setResult(r); setStep(3); onDone?.()
    } catch (e) { setErr(e.message || 'Import failed') } finally { setBusy(false) }
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0f1622', border:'1px solid #1e2d42', borderRadius:'14px', width:'min(560px,100%)', maxHeight:'90vh', overflowY:'auto', padding:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div style={{ fontWeight:800, fontSize:'15px' }}>⬆ Import contacts (CSV)</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#7a8fa6', fontSize:'18px', cursor:'pointer' }}>×</button>
        </div>
        {err && <div style={{ marginBottom:'12px', padding:'9px 12px', borderRadius:'8px', fontSize:'12px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444' }}>{err}</div>}

        {step === 1 && (
          <div>
            <label style={{ display:'block', padding:'28px', border:'2px dashed #2a3d5c', borderRadius:'12px', textAlign:'center', cursor:'pointer', color:'#7a8fa6', fontSize:'13px' }}>
              {busy ? 'Reading…' : '📄 Choose a CSV file (name + phone/email columns)'}
              <input type="file" accept=".csv,text/csv" onChange={e=>pick(e.target.files?.[0])} style={{ display:'none' }} />
            </label>
            <div style={{ fontSize:'11px', color:'#64748b', marginTop:'10px' }}>Tip: for WhatsApp campaigns, include a <b>phone</b> column with country code (e.g. +974…).</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize:'12px', color:'#7a8fa6', marginBottom:'10px' }}>Map your columns → contact fields. We guessed where we could.</div>
            <div style={{ display:'grid', gap:'8px' }}>
              {FIELDS.map(([field,label]) => (
                <div key={field} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ width:'120px', fontSize:'12px', color: field==='name'?'#D8B16A':'#94a3b8' }}>{label}</span>
                  <select value={mapping[field]||''} onChange={e=>setMapping(m=>({ ...m, [field]: e.target.value || undefined }))} style={{ ...inp, flex:1, cursor:'pointer' }}>
                    <option value="">— skip —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {sample.length>0 && (
              <div style={{ marginTop:'12px', fontSize:'10px', color:'#64748b' }}>
                Preview: {sample.map((r,i)=><div key={i} style={{ color:'#7a8fa6', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mapping.name?r[mapping.name]:'—'} · {mapping.phone?r[mapping.phone]:(mapping.email?r[mapping.email]:'')}</div>)}
              </div>
            )}
            <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
              <button onClick={run} disabled={busy} style={{ padding:'9px 20px', background: busy?'#1a2235':'#D8B16A', border:'none', borderRadius:'8px', color: busy?'#64748b':'#07090f', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>{busy?'Importing…':'Import'}</button>
              <button onClick={()=>{ setStep(1); setFile(null) }} style={{ padding:'9px 16px', background:'transparent', border:'1px solid #1e2d42', borderRadius:'8px', color:'#7a8fa6', fontSize:'13px', cursor:'pointer' }}>Back</button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div style={{ textAlign:'center', padding:'10px' }}>
            <div style={{ fontSize:'32px', marginBottom:'6px' }}>✅</div>
            <div style={{ fontWeight:800, fontSize:'15px', marginBottom:'10px' }}>Import complete</div>
            <div style={{ display:'flex', justifyContent:'center', gap:'18px', fontSize:'13px', marginBottom:'14px' }}>
              <span style={{ color:'#16a34a' }}><b style={{ fontSize:'18px' }}>{result.imported||0}</b><br/>imported</span>
              <span style={{ color:'#fbbf24' }}><b style={{ fontSize:'18px' }}>{result.skipped||0}</b><br/>skipped</span>
              <span style={{ color:'#ef4444' }}><b style={{ fontSize:'18px' }}>{result.failed||0}</b><br/>failed</span>
            </div>
            {result.errors?.length>0 && <div style={{ fontSize:'11px', color:'#7a8fa6', maxHeight:'80px', overflowY:'auto', textAlign:'left' }}>{result.errors.slice(0,5).map((e,i)=><div key={i}>Row {e.row}: {e.reason}</div>)}</div>}
            <button onClick={onClose} style={{ marginTop:'14px', padding:'9px 24px', background:'#D8B16A', border:'none', borderRadius:'8px', color:'#07090f', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
