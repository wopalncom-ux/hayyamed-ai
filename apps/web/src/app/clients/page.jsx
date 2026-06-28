'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { getAuth, isOwnerRole } from '@/lib/auth'
import NavSidebar from '@/components/NavSidebar'

const EMPTY = {
  name: '', logo: '🏢', type: '', contactPerson: '', whatsappNumber: '', clientEmail: '',
  website: '', businessType: '', plan: 'STARTER', status: 'good', storageLimitMb: 500,
  paymentResponsibility: 'client', profitPercent: 0, campaignBilling: '', adminNotes: '', notes: '',
}
const PAYMENT = [
  { v: 'client', label: 'Client pays third-party cost directly' },
  { v: 'owner', label: 'I pay & charge the client' },
  { v: 'hybrid', label: 'Hybrid / shared cost' },
]
const card = { background: '#0f1520', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }
const input = { width: '100%', padding: '9px 11px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }

function Field({ label, children }) {
  return <div><label style={lbl}>{label}</label>{children}</div>
}

export default function ClientsConsole() {
  const owner = isOwnerRole(getAuth()?.role)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('profile')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [topup, setTopup] = useState('')
  // AI Brain (Phase 2)
  const [brains, setBrains] = useState([])
  const [storage, setStorage] = useState(null)
  const [newBrain, setNewBrain] = useState('')
  const [srcModal, setSrcModal] = useState(null)   // { kbId }
  const [srcType, setSrcType] = useState('text')
  const [srcName, setSrcName] = useState('')
  const [srcBody, setSrcBody] = useState('')

  const loadBrains = async (id) => {
    try {
      const [b, s] = await Promise.all([api.getClientBrains(id).catch(() => []), api.getClientStorage(id).catch(() => null)])
      setBrains(Array.isArray(b) ? b : [])
      setStorage(s)
    } catch {}
  }
  const createBrain = async () => {
    if (!newBrain.trim() || !selected) return
    try { await api.createClientBrain(selected.id, { name: newBrain.trim() }); setNewBrain(''); loadBrains(selected.id); openClient(selected.id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Failed' }) }
  }
  const addSource = async () => {
    if (!srcModal || !selected) return
    const name = srcName.trim() || (srcType === 'url' ? srcBody.trim() : 'Untitled')
    const dto = srcType === 'url' ? { type: 'url', name, url: srcBody.trim() } : { type: srcType, name, content: srcBody.trim() }
    try { await api.addClientSource(selected.id, srcModal.kbId, dto); setSrcModal(null); setSrcName(''); setSrcBody(''); setSrcType('text'); loadBrains(selected.id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Failed to add source' }) }
  }
  const delSource = async (kbId, sourceId) => {
    if (!selected) return
    try { await api.removeClientSource(selected.id, kbId, sourceId); loadBrains(selected.id) } catch {}
  }
  const retrain = async (kbId) => {
    if (!selected) return
    try { await api.retrainClientBrain(selected.id, kbId); loadBrains(selected.id) } catch {}
  }

  const loadClients = () => api.getAgencyClients().then(c => setClients(Array.isArray(c) ? c : [])).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { loadClients() }, [])

  const openClient = async (id) => {
    setMsg(null)
    try { const d = await api.getAgencyClient(id); setSelected(d); setEditing({ ...EMPTY, ...d, type: d.industry || '' }); setTab('profile'); loadBrains(id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Could not load client' }) }
  }
  const newClient = () => { setSelected(null); setEditing({ ...EMPTY }); setTab('profile'); setMsg(null) }
  const set = (k, v) => setEditing(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!editing.name) { setMsg({ ok: false, text: 'Client name is required' }); return }
    setBusy(true); setMsg(null)
    const dto = {
      name: editing.name, logo: editing.logo, type: editing.type, contactPerson: editing.contactPerson,
      whatsappNumber: editing.whatsappNumber, clientEmail: editing.clientEmail, website: editing.website,
      businessType: editing.businessType, status: editing.status, storageLimitMb: +editing.storageLimitMb || 0,
      paymentResponsibility: editing.paymentResponsibility, profitPercent: +editing.profitPercent || 0,
      campaignBilling: editing.campaignBilling, adminNotes: editing.adminNotes, notes: editing.notes,
    }
    try {
      if (selected?.id) { await api.updateAgencyClient(selected.id, dto); setMsg({ ok: true, text: 'Saved ✓' }); await openClient(selected.id); loadClients() }
      else { const r = await api.createAgencyClient(dto); setMsg({ ok: true, text: 'Client created ✓' }); await loadClients(); await openClient(r.id) }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Save failed' }) } finally { setBusy(false) }
  }

  const topUp = async () => {
    const amt = +topup; if (!amt || !selected?.id) return
    try { await api.topUpAgencyClient(selected.id, amt); setTopup(''); await openClient(selected.id); loadClients() } catch (e) { setMsg({ ok: false, text: e?.message || 'Top-up failed' }) }
  }

  if (!owner) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0' }}>
      <NavSidebar current="agency" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>🔒</div><div style={{ fontWeight: 800 }}>Owner access only</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="agency" />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Client list */}
        <div style={{ width: '280px', borderRight: '1px solid #1a2235', padding: '20px 16px', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 800, letterSpacing: '1px', marginBottom: '2px' }}>CLIENT AI OPERATING CENTER</div>
          <div style={{ fontWeight: 900, fontSize: '17px', marginBottom: '14px' }}>Clients</div>
          <button onClick={newClient} style={{ width: '100%', padding: '9px', background: '#00e5a0', border: 'none', borderRadius: '7px', color: '#07090f', fontWeight: 800, fontSize: '12px', cursor: 'pointer', marginBottom: '14px' }}>+ New Client</button>
          {loading ? <div style={{ color: '#64748b', fontSize: '12px' }}>Loading…</div>
            : clients.length === 0 ? <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>No clients yet. Create your first client to set up their AI brain, agents, automations and billing.</div>
            : clients.map(c => (
              <div key={c.id} onClick={() => openClient(c.id)}
                style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', background: selected?.id === c.id ? 'rgba(0,229,160,.08)' : '#0f1520', border: `1px solid ${selected?.id === c.id ? 'rgba(0,229,160,.3)' : '#1a2235'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{c.logo || '🏢'}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{c.type || '—'} · {c.wa === 'Connected' ? '🟢 WA' : '⚪ WA'}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Detail / editor */}
        <div style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }}>
          {!editing ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: '#64748b' }}>
              <div style={{ fontSize: '40px' }}>🏢</div>
              <div style={{ fontWeight: 700, color: '#94a3b8' }}>Select a client or create a new one</div>
              <div style={{ fontSize: '12px' }}>Set up each client's profile, AI brain, agents, automations and billing.</div>
            </div>
          ) : (
            <div style={{ maxWidth: '860px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <span style={{ fontSize: '30px' }}>{editing.logo || '🏢'}</span>
                <div style={{ fontWeight: 900, fontSize: '22px' }}>{selected ? editing.name : 'New Client'}</div>
              </div>
              {/* Step guidance */}
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                {selected ? 'Edit this client and manage their AI operating setup.' : 'Step 1 of 8 — create the client profile. Then add AI Brain, agents, channels, automations and billing.'}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {[['profile', '👤 Profile'], ['resources', '🧠 Resources'], ['billing', '💳 Billing & Profit']].map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} disabled={id !== 'profile' && !selected}
                    style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: id !== 'profile' && !selected ? 'not-allowed' : 'pointer',
                      background: tab === id ? '#1a2235' : 'transparent', color: tab === id ? '#e2e8f0' : (id !== 'profile' && !selected ? '#3d4f63' : '#7a8fa6'), border: '1px solid #1a2235' }}>{label}</button>
                ))}
              </div>

              {/* PROFILE */}
              {tab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>Business details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                      <Field label="Client name *"><input style={input} value={editing.name} onChange={e => set('name', e.target.value)} placeholder="Smile Dental Clinic" /></Field>
                      <Field label="Logo (emoji)"><input style={input} value={editing.logo} onChange={e => set('logo', e.target.value)} placeholder="🦷" /></Field>
                      <Field label="Industry"><input style={input} value={editing.type} onChange={e => set('type', e.target.value)} placeholder="Healthcare" /></Field>
                      <Field label="Business type"><input style={input} value={editing.businessType} onChange={e => set('businessType', e.target.value)} placeholder="Clinic" /></Field>
                      <Field label="Contact person"><input style={input} value={editing.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Dr. Sara" /></Field>
                      <Field label="WhatsApp number"><input style={input} value={editing.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="+974 5XXX XXXX" /></Field>
                      <Field label="Email"><input style={input} value={editing.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="hello@client.qa" /></Field>
                      <Field label="Website"><input style={input} value={editing.website} onChange={e => set('website', e.target.value)} placeholder="https://client.qa" /></Field>
                    </div>
                  </div>
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>Plan, storage & internal</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                      <Field label="Status">
                        <select style={{ ...input, cursor: 'pointer' }} value={editing.status} onChange={e => set('status', e.target.value)}>
                          {['good', 'at_risk', 'paused'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Storage limit (MB)"><input type="number" style={input} value={editing.storageLimitMb} onChange={e => set('storageLimitMb', e.target.value)} /></Field>
                      <div style={{ gridColumn: '1 / -1' }}><Field label="Internal admin notes"><textarea style={{ ...input, minHeight: '60px', resize: 'vertical' }} value={editing.adminNotes} onChange={e => set('adminNotes', e.target.value)} placeholder="Only you see this." /></Field></div>
                    </div>
                  </div>
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#00e5a0' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                  <div><button onClick={save} disabled={busy} style={{ padding: '11px 26px', background: busy ? '#1a2235' : '#00e5a0', border: 'none', borderRadius: '8px', color: busy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '14px', cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Saving…' : (selected ? 'Save changes' : 'Create client')}</button></div>
                </div>
              )}

              {/* RESOURCES */}
              {tab === 'resources' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                    {[['🧠', 'AI Brains', selected.counts?.knowledgeBases], ['🤖', 'AI Agents', selected.counts?.agents], ['⚡', 'Automations', selected.counts?.automations], ['📡', 'Channels', selected.counts?.channels], ['👥', 'Contacts', selected.counts?.contacts]].map(([icon, label, n]) => (
                      <div key={label} style={{ ...card, textAlign: 'center', padding: '14px' }}>
                        <div style={{ fontSize: '20px' }}>{icon}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#00e5a0' }}>{n ?? 0}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>Connected channels</div>
                    {(!selected.channels || selected.channels.length === 0) ? <div style={{ fontSize: '12px', color: '#64748b' }}>No channels connected yet.</div>
                      : selected.channels.map(ch => (
                        <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2235', fontSize: '12px' }}>
                          <span>{ch.type} — {ch.name}</span>
                          <span style={{ color: ch.isActive ? '#00e5a0' : '#64748b' }}>{ch.isActive ? (ch.isVerified ? '🟢 Active' : '🟡 Pending') : '⚪ Off'}</span>
                        </div>
                      ))}
                  </div>
                  {/* AI Brain (Phase 2) */}
                  <div style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px' }}>🧠 AI Brain — knowledge bases</div>
                    </div>
                    {/* Storage meter */}
                    {storage && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          <span>Storage</span><span>{storage.usedMb} / {storage.limitMb} MB · {storage.sources} source{storage.sources === 1 ? '' : 's'}</span>
                        </div>
                        <div style={{ height: '7px', background: '#1a2235', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${storage.pct}%`, height: '100%', background: storage.pct > 90 ? '#ef4444' : '#00e5a0' }} />
                        </div>
                      </div>
                    )}
                    {/* Create KB */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input style={{ ...input, flex: 1 }} value={newBrain} onChange={e => setNewBrain(e.target.value)} placeholder="New knowledge base name…" onKeyDown={e => e.key === 'Enter' && createBrain()} />
                      <button onClick={createBrain} disabled={!newBrain.trim()} style={{ padding: '0 16px', background: newBrain.trim() ? '#00e5a0' : '#1a2235', border: 'none', borderRadius: '6px', color: newBrain.trim() ? '#07090f' : '#64748b', fontWeight: 800, cursor: 'pointer' }}>+ Brain</button>
                    </div>
                    {brains.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No knowledge bases yet. Create one, then add sources (text, FAQ, website, catalog) to train this client's AI.</div>
                      : brains.map(kb => (
                        <div key={kb.id} style={{ border: '1px solid #1a2235', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{kb.name} <span style={{ fontSize: '10px', color: '#64748b' }}>· {kb.sources?.length || 0} sources</span></div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => setSrcModal({ kbId: kb.id })} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.3)', borderRadius: '6px', color: '#00e5a0', cursor: 'pointer' }}>+ Source</button>
                              <button onClick={() => retrain(kb.id)} title="Re-train / sync" style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '6px', color: '#7a8fa6', cursor: 'pointer' }}>↻ Sync</button>
                            </div>
                          </div>
                          {(kb.sources || []).map(s => {
                            const sc = { ready: '#00e5a0', pending: '#fbbf24', processing: '#3b82f6', failed: '#ef4444' }[s.status] || '#64748b'
                            return (
                              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '12px', borderTop: '1px solid #131a28' }}>
                                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{({ text: '📝', faq: '❓', url: '🌐', pdf: '📄', docx: '📄', product_list: '🏷️', pricing: '💲' }[s.type] || '📎')} {s.name}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '10px', background: `${sc}22`, color: sc, fontWeight: 700 }}>{s.status}</span>
                                  <button onClick={() => delSource(kb.id, s.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                  </div>

                  <div style={{ ...card, background: 'rgba(167,139,250,.05)', borderColor: 'rgba(167,139,250,.2)', fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>
                    🤖 Agent Manager and ⚡ client-scoped Automations are rolling out next (Phases 3–5). Each client's resources are already fully isolated.
                  </div>
                </div>
              )}

              {/* BILLING */}
              {tab === 'billing' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>Payment & profit</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                      <Field label="Who pays third-party costs?">
                        <select style={{ ...input, cursor: 'pointer' }} value={editing.paymentResponsibility} onChange={e => set('paymentResponsibility', e.target.value)}>
                          {PAYMENT.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
                        </select>
                      </Field>
                      <Field label="My profit % on top of third-party charges"><input type="number" style={input} value={editing.profitPercent} onChange={e => set('profitPercent', e.target.value)} /></Field>
                      <div style={{ gridColumn: '1 / -1' }}><Field label="Campaign billing settings"><textarea style={{ ...input, minHeight: '50px', resize: 'vertical' }} value={editing.campaignBilling} onChange={e => set('campaignBilling', e.target.value)} placeholder="e.g. WhatsApp campaign template cost passed through + profit %." /></Field></div>
                    </div>
                    <div style={{ marginTop: '12px' }}><button onClick={save} disabled={busy} style={{ padding: '9px 20px', background: busy ? '#1a2235' : '#00e5a0', border: 'none', borderRadius: '7px', color: busy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{busy ? 'Saving…' : 'Save billing'}</button></div>
                  </div>
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>Client wallet</div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#fbbf24', marginBottom: '12px' }}>QAR {Number(selected.balance || 0).toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="number" style={{ ...input, width: '140px' }} value={topup} onChange={e => setTopup(e.target.value)} placeholder="Amount" />
                      <button onClick={topUp} style={{ padding: '9px 16px', background: '#3b82f6', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Top up</button>
                    </div>
                  </div>
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#00e5a0' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Source modal */}
      {srcModal && (
        <div onClick={() => setSrcModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, width: '460px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>Add knowledge source</div>
              <button onClick={() => setSrcModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {[['text', '📝 Text'], ['faq', '❓ FAQ'], ['url', '🌐 Website'], ['product_list', '🏷️ Catalog'], ['pricing', '💲 Pricing']].map(([t, label]) => (
                <button key={t} onClick={() => setSrcType(t)} style={{ fontSize: '11px', padding: '5px 11px', borderRadius: '7px', cursor: 'pointer', background: srcType === t ? '#1a2235' : 'transparent', color: srcType === t ? '#e2e8f0' : '#7a8fa6', border: '1px solid #1a2235' }}>{label}</button>
              ))}
            </div>
            <Field label="Source name"><input style={input} value={srcName} onChange={e => setSrcName(e.target.value)} placeholder={srcType === 'faq' ? 'e.g. Common questions' : 'e.g. Services overview'} /></Field>
            <div style={{ marginTop: '10px' }}>
              {srcType === 'url'
                ? <Field label="Website URL"><input style={input} value={srcBody} onChange={e => setSrcBody(e.target.value)} placeholder="https://client.qa/about" /></Field>
                : <Field label={srcType === 'faq' ? 'FAQ content (Q&A)' : 'Content'}><textarea style={{ ...input, minHeight: '120px', resize: 'vertical' }} value={srcBody} onChange={e => setSrcBody(e.target.value)} placeholder={srcType === 'faq' ? 'Q: Do you open on Fridays?\nA: Yes, 4pm–10pm.' : 'Paste the text the AI should learn…'} /></Field>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setSrcModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '7px', color: '#7a8fa6', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addSource} disabled={!srcBody.trim()} style={{ padding: '8px 18px', background: srcBody.trim() ? '#00e5a0' : '#1a2235', border: 'none', borderRadius: '7px', color: srcBody.trim() ? '#07090f' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Add source</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
