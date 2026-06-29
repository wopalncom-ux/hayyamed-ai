'use client'
import { useState, useEffect, useRef } from 'react'
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
const ROLES = [
  ['sales', 'WhatsApp Sales Agent'], ['support', 'Customer Support Agent'], ['receptionist', 'Receptionist Agent'],
  ['marketing', 'Marketing Agent'], ['appointment', 'Appointment Agent'], ['campaign', 'Campaign Agent'], ['custom', 'Custom Agent'],
]
const AGENT_CHANNELS = [
  ['whatsapp_unipile', 'WhatsApp (Unipile)'], ['whatsapp_meta', 'WhatsApp (Meta Cloud)'],
  ['email', 'Email'], ['website', 'Website chatbot'], ['instagram', 'Instagram / Messenger'],
]
const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-3.5-turbo'] },
  { id: 'anthropic', label: 'Claude', models: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-8'] },
  { id: 'gemini', label: 'Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'groq', label: 'Groq', models: ['llama-3.3-70b-versatile'] },
]
const EMPTY_AGENT = { name: '', role: 'support', knowledgeBaseId: '', aiProvider: 'openai', aiModel: 'gpt-4o-mini', channels: [], isActive: false, escalationRules: { humanTakeover: true } }
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
  // Agents (Phase 3)
  const [agents, setAgents] = useState([])
  const [agentForm, setAgentForm] = useState(null)   // EMPTY_AGENT for new, or an agent for edit
  const [agentBusy, setAgentBusy] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testReply, setTestReply] = useState(null)
  const [testing, setTesting] = useState(false)

  const loadAgents = async (id) => { try { const a = await api.getClientAgents(id); setAgents(Array.isArray(a) ? a : []) } catch {} }
  const aset = (k, v) => setAgentForm(p => ({ ...p, [k]: v }))
  const toggleChannel = (c) => setAgentForm(p => ({ ...p, channels: p.channels.includes(c) ? p.channels.filter(x => x !== c) : [...p.channels, c] }))
  const saveAgent = async () => {
    if (!agentForm?.name?.trim() || !selected) { setMsg({ ok: false, text: 'Agent name is required' }); return }
    setAgentBusy(true); setMsg(null)
    const dto = { name: agentForm.name.trim(), role: agentForm.role, knowledgeBaseId: agentForm.knowledgeBaseId || null, aiProvider: agentForm.aiProvider, aiModel: agentForm.aiModel, channels: agentForm.channels, escalationRules: agentForm.escalationRules }
    try {
      if (agentForm.id) await api.updateClientAgent(selected.id, agentForm.id, dto)
      else await api.createClientAgent(selected.id, dto)
      setAgentForm(null); setTestReply(null); loadAgents(selected.id); openClient(selected.id)
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Save failed' }) } finally { setAgentBusy(false) }
  }
  const delAgent = async (agentId) => { if (!selected) return; try { await api.removeClientAgent(selected.id, agentId); loadAgents(selected.id); openClient(selected.id) } catch {} }
  const toggleAgent = async (a) => { if (!selected) return; try { await api.toggleClientAgent(selected.id, a.id, !a.isActive); loadAgents(selected.id) } catch {} }
  const runTest = async () => {
    if (!testMsg.trim() || !agentForm?.id || !selected) return
    setTesting(true)
    try { const r = await api.testClientAgent(selected.id, agentForm.id, testMsg.trim(), []); setTestReply(r?.reply || r?.message || JSON.stringify(r)) } catch (e) { setTestReply('⚠️ ' + (e?.message || 'Test failed')) } finally { setTesting(false) }
  }
  // Channels (Phase 4)
  const [channels, setChannels] = useState([])
  const [waPhone, setWaPhone] = useState('')
  const [pairing, setPairing] = useState(null)
  const [meta, setMeta] = useState({ phoneNumberId: '', accessToken: '', businessId: '', webhookSecret: '' })
  const [manual, setManual] = useState({ name: '', webhookUrl: '' })
  const [ig, setIg] = useState({ igAccountId: '', accessToken: '', username: '' })
  const connectInstagram = async () => {
    if (!selected || !ig.igAccountId || !ig.accessToken) { setMsg({ ok: false, text: 'IG Account ID and Access Token are required' }); return }
    setBusy(true); setMsg(null)
    try { await api.connectClientInstagram(selected.id, ig); setMsg({ ok: true, text: 'Instagram connected ✓' }); setIg({ igAccountId: '', accessToken: '', username: '' }); loadChannels(selected.id); openClient(selected.id) }
    catch (e) { setMsg({ ok: false, text: e?.message || 'Instagram connect failed' }) } finally { setBusy(false) }
  }
  const loadChannels = async (id) => { try { const c = await api.getClientChannels(id); setChannels(Array.isArray(c) ? c : []) } catch {} }
  const connectUnipile = async () => {
    if (!selected) return; setBusy(true); setMsg(null); setPairing(null)
    try { const r = await api.connectClientUnipile(selected.id, waPhone.replace(/[^0-9]/g, '') || undefined); setPairing(r); setMsg({ ok: true, text: r.code ? 'Enter the code in WhatsApp.' : 'Scan the QR string in WhatsApp.' }); loadChannels(selected.id); openClient(selected.id) }
    catch (e) { setMsg({ ok: false, text: e?.message || 'Connect failed' }) } finally { setBusy(false) }
  }
  const connectMeta = async () => {
    if (!selected || !meta.phoneNumberId || !meta.accessToken) { setMsg({ ok: false, text: 'Phone Number ID and Access Token are required' }); return }
    setBusy(true); setMsg(null)
    try { await api.connectClientMeta(selected.id, meta); setMsg({ ok: true, text: 'Meta WhatsApp connected ✓' }); setMeta({ phoneNumberId: '', accessToken: '', businessId: '', webhookSecret: '' }); loadChannels(selected.id); openClient(selected.id) }
    catch (e) { setMsg({ ok: false, text: e?.message || 'Meta connect failed' }) } finally { setBusy(false) }
  }
  const connectManual = async () => {
    if (!selected || !manual.name) return; setBusy(true)
    try { await api.connectClientManual(selected.id, manual); setMsg({ ok: true, text: 'Custom channel added' }); setManual({ name: '', webhookUrl: '' }); loadChannels(selected.id); openClient(selected.id) }
    catch (e) { setMsg({ ok: false, text: e?.message || 'Failed' }) } finally { setBusy(false) }
  }
  const disconnectChannel = async (chId) => { if (!selected) return; try { await api.disconnectClientChannel(selected.id, chId); loadChannels(selected.id); openClient(selected.id) } catch {} }
  // Automations (Phase 5)
  const [autos, setAutos] = useState([])
  const [autoTemplates, setAutoTemplates] = useState([])
  const [autoRuns, setAutoRuns] = useState([])
  const loadAutos = async (id) => {
    try { const [a, r] = await Promise.all([api.getClientAutomations(id).catch(() => []), api.getClientAutomationRuns(id).catch(() => [])]); setAutos(Array.isArray(a) ? a : []); setAutoRuns(Array.isArray(r) ? r : []) } catch {}
  }
  useEffect(() => { api.getAutomationTemplates().then(t => setAutoTemplates(Array.isArray(t) ? t : [])).catch(() => {}) }, [])
  const installTemplate = async (tid) => { if (!selected) return; try { await api.installClientTemplate(selected.id, tid); loadAutos(selected.id); openClient(selected.id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Install failed' }) } }
  const toggleAuto = async (w) => { if (!selected) return; try { await api.toggleClientAutomation(selected.id, w.id, !w.isActive); loadAutos(selected.id) } catch {} }
  const delAuto = async (wid) => { if (!selected) return; try { await api.removeClientAutomation(selected.id, wid); loadAutos(selected.id); openClient(selected.id) } catch {} }
  // Modules (Phase 6)
  const [modules, setModules] = useState([])
  const loadModules = async (id) => { try { const m = await api.getClientModules(id); setModules(Array.isArray(m) ? m : []) } catch {} }
  const toggleModule = async (key, enabled) => {
    if (!selected) return
    setModules(prev => prev.map(m => m.key === key ? { ...m, enabled } : m))
    try { await api.setClientModule(selected.id, key, enabled) } catch { loadModules(selected.id) }
  }
  const moduleCost = modules.filter(m => m.enabled && m.price > 0).reduce((s, m) => s + m.price, 0)
  // Wallet / billing (Phase 7)
  const [billing, setBilling] = useState(null)
  const [threshold, setThreshold] = useState('')
  const [campCost, setCampCost] = useState('')
  const [campDesc, setCampDesc] = useState('')
  const loadBilling = async (id) => { try { const b = await api.getClientBilling(id); setBilling(b); setThreshold(String(b?.lowBalanceThreshold ?? '')) } catch {} }
  const profitPct = Number(editing?.profitPercent) || 0
  const campProfit = +((Number(campCost) || 0) * profitPct / 100).toFixed(2)
  const campCharge = +((Number(campCost) || 0) + campProfit).toFixed(2)
  const chargeClient = async () => {
    if (!selected || !(Number(campCost) > 0)) return
    try { await api.chargeClient(selected.id, Number(campCost), campDesc || 'Campaign / usage'); setCampCost(''); setCampDesc(''); loadBilling(selected.id); openClient(selected.id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Charge failed' }) }
  }
  const saveThreshold = async () => { if (!selected) return; try { await api.setClientLowBalance(selected.id, Number(threshold) || 0); loadBilling(selected.id) } catch {} }

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
  const fileRef = useRef(null)
  const [uploadKb, setUploadKb] = useState(null)
  const [uploading, setUploading] = useState(false)
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file && selected && uploadKb) {
      setUploading(true)
      try { await api.uploadClientFile(selected.id, uploadKb, file); setMsg({ ok: true, text: `"${file.name}" uploaded — indexing started.` }); loadBrains(selected.id) }
      catch (err) { setMsg({ ok: false, text: err?.message || 'Upload failed' }) } finally { setUploading(false) }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const [overview, setOverview] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const loadClients = () => api.getAgencyClients().then(c => setClients(Array.isArray(c) ? c : [])).catch(() => {}).finally(() => setLoading(false))
  const loadOverview = () => { api.getAgencyOverview().then(setOverview).catch(() => {}); api.getAgencyAuditLogs().then(l => setAuditLogs(Array.isArray(l) ? l : [])).catch(() => {}) }
  useEffect(() => { loadClients(); loadOverview() }, [])
  const setClientActive = async (id, isActive) => { try { await api.setAgencyClientActive(id, isActive); loadClients(); loadOverview() } catch {} }

  const openClient = async (id) => {
    setMsg(null)
    try { const d = await api.getAgencyClient(id); setSelected(d); setEditing({ ...EMPTY, ...d, type: d.industry || '' }); setTab('profile'); loadBrains(id); loadAgents(id); loadChannels(id); loadAutos(id); loadModules(id); loadBilling(id) } catch (e) { setMsg({ ok: false, text: e?.message || 'Could not load client' }) }
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
      else { const r = await api.createAgencyClient(dto); await loadClients(); await openClient(r.id); setTab('resources'); setMsg({ ok: true, text: 'Client created ✓ — now add their AI Brain (train it on their business).' }) }
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
          <button onClick={newClient} style={{ width: '100%', padding: '9px', background: '#D8B16A', border: 'none', borderRadius: '7px', color: '#07090f', fontWeight: 800, fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>+ New Client</button>
          <button onClick={() => { setSelected(null); setEditing(null); loadOverview() }} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '7px', color: '#7a8fa6', fontWeight: 700, fontSize: '12px', cursor: 'pointer', marginBottom: '14px' }}>📊 Owner Overview</button>
          {loading ? <div style={{ color: '#64748b', fontSize: '12px' }}>Loading…</div>
            : clients.length === 0 ? <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>No clients yet. Create your first client to set up their AI brain, agents, automations and billing.</div>
            : clients.map(c => (
              <div key={c.id} onClick={() => openClient(c.id)}
                style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px', background: selected?.id === c.id ? 'rgba(216,177,106,.08)' : '#0f1520', border: `1px solid ${selected?.id === c.id ? 'rgba(216,177,106,.3)' : '#1a2235'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div style={{ maxWidth: '960px' }}>
              <div style={{ fontWeight: 900, fontSize: '22px', marginBottom: '4px' }}>📊 Owner Overview</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>Every client, their AI setup, costs and activity — at a glance.</div>
              {/* Totals */}
              {overview && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px', marginBottom: '18px' }}>
                  {[['Clients', overview.totals.clients, '#3b82f6'], ['Active', overview.totals.active, '#D8B16A'], ['Wallet (QAR)', overview.totals.wallet, '#fbbf24'], ['Agents', overview.totals.agents, '#a78bfa'], ['Automations', overview.totals.automations, '#06b6d4'], ['Low balance', overview.totals.lowBalance, '#ef4444']].map(([label, val, color]) => (
                    <div key={label} style={{ ...card, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color }}>{val}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Clients table */}
              <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 0.7fr) 1fr 0.9fr', padding: '10px 14px', borderBottom: '1px solid #1a2235', background: '#0c0f1a', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  <span>Client</span><span>Brains</span><span>Agents</span><span>Autos</span><span>Channels</span><span>Contacts</span><span>Balance</span><span>Status</span>
                </div>
                {(overview?.clients || []).length === 0 ? <div style={{ padding: '16px', fontSize: '12px', color: '#64748b' }}>No clients yet — create your first client.</div>
                  : overview.clients.map(c => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 0.7fr) 1fr 0.9fr', padding: '10px 14px', borderBottom: '1px solid #131a28', fontSize: '12px', alignItems: 'center', opacity: c.isActive ? 1 : 0.5 }}>
                      <span onClick={() => openClient(c.id)} style={{ cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>{c.logo || '🏢'} {c.name}</span>
                      <span>{c.knowledgeBases}</span><span>{c.agents}</span><span>{c.automations}</span><span>{c.channels}</span><span>{c.contacts}</span>
                      <span style={{ color: c.lowBalance ? '#ef4444' : '#fbbf24', fontWeight: 700 }}>{Number(c.balance || 0).toLocaleString()}</span>
                      <button onClick={() => setClientActive(c.id, !c.isActive)} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '10px', cursor: 'pointer', border: '1px solid', borderColor: c.isActive ? 'rgba(216,177,106,.3)' : 'rgba(239,68,68,.3)', background: 'transparent', color: c.isActive ? '#D8B16A' : '#ef4444', fontWeight: 700 }}>{c.isActive ? 'Active' : 'Disabled'}</button>
                    </div>
                  ))}
              </div>
              {/* Audit logs */}
              <div style={card}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>🛡️ Recent activity (audit log)</div>
                {auditLogs.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No activity yet.</div>
                  : auditLogs.slice(0, 20).map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '5px 0', borderBottom: '1px solid #131a28', color: '#94a3b8' }}>
                      <span><strong style={{ color: '#cbd5e1' }}>{l.action}</strong> {l.resource}{l.resourceId ? ` (${String(l.resourceId).slice(0, 8)})` : ''}</span>
                      <span style={{ color: '#64748b' }}>{new Date(l.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
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
              <div style={{ display: 'flex', gap: '6px', marginBottom: selected ? '18px' : '8px', flexWrap: 'wrap' }}>
                {[['profile', '👤 Profile'], ['resources', '🧠 AI Brain'], ['agents', '🤖 Agents'], ['channels', '📡 Channels'], ['automations', '⚡ Automations'], ['modules', '🧩 Modules'], ['billing', '💳 Billing & Profit']].map(([id, label]) => {
                  const locked = id !== 'profile' && !selected
                  return (
                    <button key={id} onClick={() => setTab(id)} disabled={locked}
                      title={locked ? 'Create the client profile first to unlock this' : ''}
                      style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: locked ? 'not-allowed' : 'pointer',
                        background: tab === id ? '#1a2235' : 'transparent', color: tab === id ? '#e2e8f0' : (locked ? '#3d4f63' : '#7a8fa6'), border: '1px solid #1a2235' }}>{locked ? `🔒 ${label}` : label}</button>
                  )
                })}
              </div>
              {!selected && (
                <div style={{ marginBottom: '18px', padding: '10px 14px', background: 'rgba(216,177,106,.08)', border: '1px solid rgba(216,177,106,.25)', borderRadius: '8px', fontSize: '12px', color: '#D8B16A' }}>
                  👉 Step 1: fill in the profile below and click <b>Create client</b>. The AI Brain, Agents, Channels, Automations, Modules &amp; Billing tabs unlock once the client exists.
                </div>
              )}

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
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                  <div><button onClick={save} disabled={busy} style={{ padding: '11px 26px', background: busy ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: busy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '14px', cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Saving…' : (selected ? 'Save changes' : 'Create client')}</button></div>
                </div>
              )}

              {/* RESOURCES */}
              {tab === 'resources' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                    {[['🧠', 'AI Brains', selected.counts?.knowledgeBases], ['🤖', 'AI Agents', selected.counts?.agents], ['⚡', 'Automations', selected.counts?.automations], ['📡', 'Channels', selected.counts?.channels], ['👥', 'Contacts', selected.counts?.contacts]].map(([icon, label, n]) => (
                      <div key={label} style={{ ...card, textAlign: 'center', padding: '14px' }}>
                        <div style={{ fontSize: '20px' }}>{icon}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#D8B16A' }}>{n ?? 0}</div>
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
                          <span style={{ color: ch.isActive ? '#D8B16A' : '#64748b' }}>{ch.isActive ? (ch.isVerified ? '🟢 Active' : '🟡 Pending') : '⚪ Off'}</span>
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
                          <div style={{ width: `${storage.pct}%`, height: '100%', background: storage.pct > 90 ? '#ef4444' : '#D8B16A' }} />
                        </div>
                      </div>
                    )}
                    {/* Create KB */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input style={{ ...input, flex: 1 }} value={newBrain} onChange={e => setNewBrain(e.target.value)} placeholder="New knowledge base name…" onKeyDown={e => e.key === 'Enter' && createBrain()} />
                      <button onClick={createBrain} disabled={!newBrain.trim()} style={{ padding: '0 16px', background: newBrain.trim() ? '#D8B16A' : '#1a2235', border: 'none', borderRadius: '6px', color: newBrain.trim() ? '#07090f' : '#64748b', fontWeight: 800, cursor: 'pointer' }}>+ Brain</button>
                    </div>
                    {brains.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No knowledge bases yet. Create one, then add sources (text, FAQ, website, catalog) to train this client's AI.</div>
                      : brains.map(kb => (
                        <div key={kb.id} style={{ border: '1px solid #1a2235', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{kb.name} <span style={{ fontSize: '10px', color: '#64748b' }}>· {kb.sources?.length || 0} sources</span></div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => setSrcModal({ kbId: kb.id })} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(216,177,106,.1)', border: '1px solid rgba(216,177,106,.3)', borderRadius: '6px', color: '#D8B16A', cursor: 'pointer' }}>+ Source</button>
                              <button onClick={() => { setUploadKb(kb.id); fileRef.current?.click() }} disabled={uploading} title="Upload PDF/TXT/CSV" style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '6px', color: '#7a8fa6', cursor: uploading ? 'wait' : 'pointer' }}>{uploading && uploadKb === kb.id ? '⏳' : '📎 Upload'}</button>
                              <button onClick={() => retrain(kb.id)} title="Re-train / sync" style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '6px', color: '#7a8fa6', cursor: 'pointer' }}>↻ Sync</button>
                            </div>
                          </div>
                          {(kb.sources || []).map(s => {
                            const sc = { ready: '#D8B16A', pending: '#fbbf24', processing: '#3b82f6', failed: '#ef4444' }[s.status] || '#64748b'
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

              {/* AGENTS */}
              {tab === 'agents' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!agentForm ? (
                    <>
                      <button onClick={() => { setAgentForm({ ...EMPTY_AGENT }); setTestReply(null) }} style={{ alignSelf: 'flex-start', padding: '9px 18px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>+ New AI Agent</button>
                      {agents.length === 0 ? <div style={{ ...card, fontSize: '12px', color: '#64748b' }}>No agents yet. Create an AI agent, give it a role and a knowledge base, assign channels, then test and publish.</div>
                        : agents.map(a => (
                          <div key={a.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '22px' }}>🤖</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{a.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{(ROLES.find(r => r[0] === a.role) || [, a.role])[1]} · {a.aiProvider}/{a.aiModel} · {(a.channels || []).length} channel{(a.channels || []).length === 1 ? '' : 's'}</div>
                            </div>
                            <button onClick={() => toggleAgent(a)} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: a.isActive ? 'rgba(216,177,106,.4)' : '#1a2235', background: a.isActive ? 'rgba(216,177,106,.12)' : 'transparent', color: a.isActive ? '#D8B16A' : '#64748b', fontWeight: 700 }}>{a.isActive ? '● Published' : '○ Draft'}</button>
                            <button onClick={() => { setAgentForm({ ...EMPTY_AGENT, ...a, escalationRules: a.escalationRules || { humanTakeover: true } }); setTestReply(null) }} style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '6px', color: '#7a8fa6', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => delAgent(a.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                          </div>
                        ))}
                    </>
                  ) : (
                    <>
                      <div style={card}>
                        <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>{agentForm.id ? 'Edit agent' : 'New AI agent'}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                          <Field label="Agent name"><input style={input} value={agentForm.name} onChange={e => aset('name', e.target.value)} placeholder="e.g. Reception Bot" /></Field>
                          <Field label="Role"><select style={{ ...input, cursor: 'pointer' }} value={agentForm.role} onChange={e => aset('role', e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
                          <Field label="AI Brain (knowledge base)"><select style={{ ...input, cursor: 'pointer' }} value={agentForm.knowledgeBaseId || ''} onChange={e => aset('knowledgeBaseId', e.target.value)}><option value="">— none —</option>{brains.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}</select></Field>
                          <Field label="AI Provider"><select style={{ ...input, cursor: 'pointer' }} value={agentForm.aiProvider} onChange={e => { const p = PROVIDERS.find(x => x.id === e.target.value); aset('aiProvider', e.target.value); aset('aiModel', p?.models[0]) }}>{PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
                          <Field label="Model"><select style={{ ...input, cursor: 'pointer' }} value={agentForm.aiModel} onChange={e => aset('aiModel', e.target.value)}>{(PROVIDERS.find(p => p.id === agentForm.aiProvider)?.models || []).map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <label style={lbl}>Channels</label>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {AGENT_CHANNELS.map(([v, l]) => (
                              <button key={v} onClick={() => toggleChannel(v)} style={{ fontSize: '11px', padding: '6px 11px', borderRadius: '7px', cursor: 'pointer', border: '1px solid', borderColor: agentForm.channels.includes(v) ? 'rgba(216,177,106,.4)' : '#1a2235', background: agentForm.channels.includes(v) ? 'rgba(216,177,106,.1)' : 'transparent', color: agentForm.channels.includes(v) ? '#D8B16A' : '#7a8fa6' }}>{agentForm.channels.includes(v) ? '✓ ' : ''}{l}</button>
                            ))}
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!agentForm.escalationRules?.humanTakeover} onChange={e => aset('escalationRules', { ...agentForm.escalationRules, humanTakeover: e.target.checked })} />
                          Allow human takeover (pause AI when a customer asks for a human)
                        </label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button onClick={saveAgent} disabled={agentBusy} style={{ padding: '9px 20px', background: agentBusy ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '7px', color: agentBusy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{agentBusy ? 'Saving…' : (agentForm.id ? 'Save agent' : 'Create agent')}</button>
                          <button onClick={() => { setAgentForm(null); setTestReply(null) }} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '7px', color: '#7a8fa6', fontSize: '13px', cursor: 'pointer' }}>Back</button>
                        </div>
                      </div>
                      {/* Test chat (existing agents) */}
                      {agentForm.id && (
                        <div style={card}>
                          <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>🧪 Test this agent</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input style={{ ...input, flex: 1 }} value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Type a customer message…" onKeyDown={e => e.key === 'Enter' && runTest()} />
                            <button onClick={runTest} disabled={testing || !testMsg.trim()} style={{ padding: '0 16px', background: testing ? '#1a2235' : '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{testing ? '…' : 'Send'}</button>
                          </div>
                          {testReply && <div style={{ marginTop: '12px', padding: '12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{testReply}</div>}
                        </div>
                      )}
                    </>
                  )}
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                </div>
              )}

              {/* CHANNELS */}
              {tab === 'channels' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Connected channels */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>Connected channels</div>
                    {channels.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No channels connected yet. Connect WhatsApp below so this client's published agents can message customers.</div>
                      : channels.map(ch => (
                        <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1a2235', fontSize: '12px' }}>
                          <span>📡 {ch.name} <span style={{ color: '#64748b' }}>· {ch.provider}</span></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: ch.isActive ? (ch.isVerified ? '#D8B16A' : '#fbbf24') : '#64748b' }}>{ch.isActive ? (ch.isVerified ? '🟢 Active' : '🟡 Pending') : '⚪ Off'}</span>
                            {ch.isActive && <button onClick={() => disconnectChannel(ch.id)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Disconnect</button>}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Option A: Unipile */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>💚 WhatsApp via Unipile (QR / code) <span style={{ fontSize: '10px', color: '#D8B16A' }}>· no Meta approval</span></div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Fast 2-way support inbox. Enter the client's WhatsApp number to get a pairing code.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input style={{ ...input, flex: 1 }} value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+974 5XXX XXXX" />
                      <button onClick={connectUnipile} disabled={busy} style={{ padding: '0 16px', background: '#25D366', border: 'none', borderRadius: '6px', color: '#07090f', fontWeight: 800, cursor: 'pointer' }}>Get code</button>
                    </div>
                    {pairing?.code && <div style={{ marginTop: '12px', textAlign: 'center', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px' }}><div style={{ fontSize: '10px', color: '#64748b' }}>PAIRING CODE</div><div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '5px', color: '#25D366' }}>{pairing.code}</div><div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>WhatsApp → Settings → Linked Devices → Link with phone number</div></div>}
                    {pairing?.qrCodeString && !pairing?.code && <div style={{ marginTop: '12px', fontSize: '10px', color: '#64748b', wordBreak: 'break-all' }}>QR: <code style={{ color: '#cbd5e1' }}>{pairing.qrCodeString}</code></div>}
                  </div>

                  {/* Option B: Meta Cloud API */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>📨 WhatsApp via Meta Cloud API</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Official business messaging + campaign templates. Verified against Meta on connect.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                      <Field label="Phone Number ID"><input style={input} value={meta.phoneNumberId} onChange={e => setMeta({ ...meta, phoneNumberId: e.target.value })} /></Field>
                      <Field label="WhatsApp Business Account ID"><input style={input} value={meta.businessId} onChange={e => setMeta({ ...meta, businessId: e.target.value })} /></Field>
                      <Field label="Access Token"><input type="password" style={input} value={meta.accessToken} onChange={e => setMeta({ ...meta, accessToken: e.target.value })} /></Field>
                      <Field label="Webhook Verify Token / App Secret"><input type="password" style={input} value={meta.webhookSecret} onChange={e => setMeta({ ...meta, webhookSecret: e.target.value })} /></Field>
                    </div>
                    <button onClick={connectMeta} disabled={busy} style={{ marginTop: '12px', padding: '9px 18px', background: '#3b82f6', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{busy ? 'Connecting…' : 'Connect Meta'}</button>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '10px', lineHeight: 1.7 }}>
                      In your Meta app webhook config:<br />
                      Callback URL <code style={{ color: '#cbd5e1' }}>https://api.hayyaai.com/api/v1/whatsapp/webhook</code><br />
                      Verify token <code style={{ color: '#cbd5e1' }}>hayyaai_webhook_prod</code> · subscribe to <code style={{ color: '#cbd5e1' }}>messages</code>
                    </div>
                  </div>

                  {/* Instagram DM (Meta) */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>📸 Instagram DM (Meta)</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>AI answers Instagram Direct Messages. Needs an IG professional account linked to a Meta app (instagram_manage_messages). Verified against Meta on connect.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                      <Field label="Instagram Account ID"><input style={input} value={ig.igAccountId} onChange={e => setIg({ ...ig, igAccountId: e.target.value })} /></Field>
                      <Field label="Username (optional)"><input style={input} value={ig.username} onChange={e => setIg({ ...ig, username: e.target.value })} placeholder="@brand" /></Field>
                      <div style={{ gridColumn: '1 / -1' }}><Field label="Page / IG Access Token"><input type="password" style={input} value={ig.accessToken} onChange={e => setIg({ ...ig, accessToken: e.target.value })} /></Field></div>
                    </div>
                    <button onClick={connectInstagram} disabled={busy} style={{ marginTop: '12px', padding: '9px 18px', background: '#E1306C', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{busy ? 'Connecting…' : 'Connect Instagram'}</button>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>Webhook (set in Meta app): <code style={{ color: '#cbd5e1' }}>https://api.hayyaai.com/api/v1/instagram/webhook</code></div>
                  </div>

                  {/* Option C: Manual */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '12px' }}>🔧 Manual / custom provider</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                      <Field label="Channel name"><input style={input} value={manual.name} onChange={e => setManual({ ...manual, name: e.target.value })} placeholder="e.g. Custom SMS gateway" /></Field>
                      <Field label="Webhook URL"><input style={input} value={manual.webhookUrl} onChange={e => setManual({ ...manual, webhookUrl: e.target.value })} placeholder="https://…" /></Field>
                    </div>
                    <button onClick={connectManual} disabled={busy || !manual.name} style={{ marginTop: '12px', padding: '9px 18px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '7px', color: '#7a8fa6', fontSize: '13px', cursor: 'pointer' }}>Add channel</button>
                  </div>
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                </div>
              )}

              {/* AUTOMATIONS */}
              {tab === 'automations' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Template gallery */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>Quick-install templates</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>One click adds a ready automation to this client. It runs on the client's contacts + channels.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                      {autoTemplates.map(t => (
                        <div key={t.id} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{t.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', flex: 1 }}>{t.desc}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#a78bfa', background: 'rgba(167,139,250,.1)', padding: '2px 7px', borderRadius: '10px' }}>{t.trigger}</span>
                            <button onClick={() => installTemplate(t.id)} style={{ fontSize: '11px', padding: '4px 12px', background: 'rgba(216,177,106,.1)', border: '1px solid rgba(216,177,106,.3)', borderRadius: '6px', color: '#D8B16A', fontWeight: 700, cursor: 'pointer' }}>+ Install</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Client's automations */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>This client's automations</div>
                    {autos.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No automations yet. Install a template above.</div>
                      : autos.map(w => (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #1a2235' }}>
                          <span style={{ fontSize: '16px' }}>⚡</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{w.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>trigger: {w.trigger} · {(Array.isArray(w.actions) ? w.actions.length : 0)} action(s) · {w.runCount || 0} runs</div>
                          </div>
                          <button onClick={() => toggleAuto(w)} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: w.isActive ? 'rgba(216,177,106,.4)' : '#1a2235', background: w.isActive ? 'rgba(216,177,106,.12)' : 'transparent', color: w.isActive ? '#D8B16A' : '#64748b', fontWeight: 700 }}>{w.isActive ? '● On' : '○ Off'}</button>
                          <button onClick={() => delAuto(w.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                  </div>

                  {/* Recent runs / logs */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>Recent runs (logs)</div>
                    {autoRuns.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b' }}>No runs yet.</div>
                      : autoRuns.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '5px 0', borderBottom: '1px solid #131a28' }}>
                          <span>{r.workflow?.name || r.workflowId} {r.error && <span style={{ color: '#ef4444' }}>· {r.error}</span>}</span>
                          <span style={{ color: r.status === 'failed' ? '#ef4444' : r.status === 'completed' ? '#D8B16A' : '#fbbf24' }}>{r.status} · {new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                </div>
              )}

              {/* MODULES */}
              {tab === 'modules' && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Enable or disable modules for <strong style={{ color: '#e2e8f0' }}>{selected.name}</strong>. Paid add-ons total below.</div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '10px', color: '#64748b' }}>ADD-ON COST</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>QAR {moduleCost}/mo</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                    {modules.map(m => (
                      <div key={m.key} style={{ ...card, border: `1px solid ${m.enabled ? 'rgba(216,177,106,.3)' : '#1a2235'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '22px' }}>{m.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{m.name}</div>
                            <div style={{ fontSize: '10px', color: m.price > 0 ? '#fbbf24' : '#64748b' }}>{m.price > 0 ? `QAR ${m.price}/mo add-on` : 'Included'}</div>
                          </div>
                          <button onClick={() => toggleModule(m.key, !m.enabled)} title={m.enabled ? 'Disable' : 'Enable'}
                            style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: m.enabled ? '#D8B16A' : '#1a2235', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                            <span style={{ position: 'absolute', top: '3px', left: m.enabled ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{m.desc}</div>
                        <div style={{ fontSize: '10px', color: m.enabled ? '#D8B16A' : '#64748b', fontWeight: 700 }}>{m.enabled ? '● Enabled for this client' : '○ Disabled'}</div>
                      </div>
                    ))}
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
                    <div style={{ marginTop: '12px' }}><button onClick={save} disabled={busy} style={{ padding: '9px 20px', background: busy ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '7px', color: busy ? '#64748b' : '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>{busy ? 'Saving…' : 'Save billing'}</button></div>
                  </div>
                  <div style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px' }}>Client wallet</div>
                      {billing?.lowBalance && <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '10px', background: 'rgba(239,68,68,.15)', color: '#ef4444', fontWeight: 700 }}>⚠ Low balance</span>}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: (billing?.lowBalance ? '#ef4444' : '#fbbf24'), marginBottom: '12px' }}>QAR {Number(billing?.balance ?? selected.balance ?? 0).toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="number" style={{ ...input, width: '120px' }} value={topup} onChange={e => setTopup(e.target.value)} placeholder="Top-up" />
                      <button onClick={topUp} style={{ padding: '9px 16px', background: '#3b82f6', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Top up</button>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Alert under</span>
                      <input type="number" style={{ ...input, width: '80px' }} value={threshold} onChange={e => setThreshold(e.target.value)} onBlur={saveThreshold} placeholder="50" />
                    </div>
                  </div>

                  {/* Campaign / usage charge calculator */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>Charge for a campaign / usage</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Enter the third-party cost. Your {profitPct}% profit is added automatically, then the client wallet is debited.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <Field label="Provider cost (QAR)"><input type="number" style={input} value={campCost} onChange={e => setCampCost(e.target.value)} placeholder="0.00" /></Field>
                      <Field label="Description"><input style={input} value={campDesc} onChange={e => setCampDesc(e.target.value)} placeholder="e.g. WhatsApp campaign — 500 msgs" /></Field>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#64748b' }}>Cost: <strong style={{ color: '#e2e8f0' }}>QAR {Number(campCost) || 0}</strong></span>
                      <span style={{ color: '#64748b' }}>+ Profit ({profitPct}%): <strong style={{ color: '#D8B16A' }}>QAR {campProfit}</strong></span>
                      <span style={{ color: '#64748b' }}>Client charge: <strong style={{ color: '#fbbf24' }}>QAR {campCharge}</strong></span>
                    </div>
                    <button onClick={chargeClient} disabled={!(Number(campCost) > 0)} style={{ padding: '9px 18px', background: Number(campCost) > 0 ? '#D8B16A' : '#1a2235', border: 'none', borderRadius: '7px', color: Number(campCost) > 0 ? '#07090f' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Charge wallet QAR {campCharge}</button>
                  </div>

                  {/* Ledger */}
                  <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>Wallet transactions</div>
                    {(!billing?.transactions || billing.transactions.length === 0) ? <div style={{ fontSize: '12px', color: '#64748b' }}>No transactions yet.</div>
                      : billing.transactions.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #131a28', fontSize: '12px' }}>
                          <span>{t.type === 'credit' ? '⬆️' : '⬇️'} {t.description} <span style={{ color: '#64748b', fontSize: '10px' }}>· {new Date(t.createdAt).toLocaleString()}</span></span>
                          <span style={{ color: t.type === 'credit' ? '#D8B16A' : '#ef4444', fontWeight: 700 }}>{t.type === 'credit' ? '+' : '−'}QAR {t.amount} <span style={{ color: '#64748b', fontWeight: 400 }}>→ {t.balanceAfter}</span></span>
                        </div>
                      ))}
                  </div>
                  {msg && <div style={{ fontSize: '13px', color: msg.ok ? '#D8B16A' : '#ef4444' }}>{msg.ok ? '✓ ' : '⚠️ '}{msg.text}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.md,.json" onChange={handleUpload} style={{ display: 'none' }} />

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
              <button onClick={addSource} disabled={!srcBody.trim()} style={{ padding: '8px 18px', background: srcBody.trim() ? '#D8B16A' : '#1a2235', border: 'none', borderRadius: '7px', color: srcBody.trim() ? '#07090f' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Add source</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
