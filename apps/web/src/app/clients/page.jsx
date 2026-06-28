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

  const loadClients = () => api.getAgencyClients().then(c => setClients(Array.isArray(c) ? c : [])).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { loadClients() }, [])

  const openClient = async (id) => {
    setMsg(null)
    try { const d = await api.getAgencyClient(id); setSelected(d); setEditing({ ...EMPTY, ...d, type: d.industry || '' }); setTab('profile') } catch (e) { setMsg({ ok: false, text: e?.message || 'Could not load client' }) }
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
                  <div style={{ ...card, background: 'rgba(167,139,250,.05)', borderColor: 'rgba(167,139,250,.2)', fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>
                    🧠 Per-client AI Brain, 🤖 Agent Manager and ⚡ client-scoped Automations are rolling out next (Phases 2–5). Each client's resources are already fully isolated.
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
    </div>
  )
}
