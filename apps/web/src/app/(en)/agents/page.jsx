'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'

const AI_PROVIDERS = [
  { id:'openai',    label:'OpenAI GPT',    models:['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id:'anthropic', label:'Claude',         models:['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-8'] },
  { id:'google',    label:'Gemini',         models:['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id:'groq',      label:'Groq (Fast)',    models:['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
]

const CHANNELS = ['WhatsApp', 'Instagram', 'Facebook', 'Email', 'Web Chat', 'Telegram']
const ROLES = [
  { id:'receptionist',      label:'Receptionist',      emoji:'🏥' },
  { id:'sales_agent',       label:'Sales Agent',        emoji:'💼' },
  { id:'customer_support',  label:'Support Agent',      emoji:'🎧' },
  { id:'booking_assistant', label:'Booking Assistant',  emoji:'📅' },
  { id:'faq_bot',           label:'FAQ Bot',            emoji:'❓' },
  { id:'lead_qualifier',    label:'Lead Qualifier',     emoji:'🎯' },
]

// Expert starter prompts per role — gives a non-technical owner a great agent
// instantly. Auto-applied when creating a fresh agent; re-appliable on demand.
const ROLE_TEMPLATES = {
  receptionist: {
    objective: 'Greet every visitor warmly, answer questions about our services, working hours, and location, help them book an appointment, and collect their name and contact number.',
    personality: 'Warm, polite, and professional. Replies in the customer’s language (Arabic or English). Opens with a friendly greeting, keeps answers short and clear, and always offers a helpful next step.',
  },
  sales_agent: {
    objective: 'Understand what the customer needs, recommend the right service or package, explain pricing and the value behind it, handle objections, and guide them toward a purchase or booking.',
    personality: 'Confident, persuasive, and genuinely helpful — never pushy. Leads with benefits, creates gentle urgency, and always moves the conversation toward a clear next step.',
  },
  customer_support: {
    objective: 'Resolve customer questions and issues quickly using the knowledge base, give accurate step-by-step help, and escalate to a human agent when the issue is complex.',
    personality: 'Patient, empathetic, and solution-focused. Acknowledges the concern first, gives clear instructions, and confirms the problem is fully resolved before closing.',
  },
  booking_assistant: {
    objective: 'Help customers book, reschedule, or cancel appointments. Collect the service, preferred date and time, and contact details, then confirm the booking back to them.',
    personality: 'Efficient and friendly. Asks one question at a time, repeats details back to avoid mistakes, and ends with a clear confirmation.',
  },
  faq_bot: {
    objective: 'Answer frequently asked questions accurately from the knowledge base — services, pricing, hours, location, and policies. If the answer isn’t known, say so rather than guessing.',
    personality: 'Concise, factual, and friendly. Gives direct answers, points to the next step, and never invents information.',
  },
  lead_qualifier: {
    objective: 'Qualify incoming leads by naturally asking about their needs, budget, timeline, and decision authority, then route hot leads to the sales team and collect contact details.',
    personality: 'Curious and professional. Weaves qualifying questions into a natural conversation without sounding like an interrogation.',
  },
}

const ALLOWED_ACTIONS = [
  { id:'reply',            label:'Send replies' },
  { id:'collect_info',     label:'Collect contact info' },
  { id:'book_appointment', label:'Create bookings' },
  { id:'qualify_lead',     label:'Score/qualify leads' },
  { id:'send_media',       label:'Send files/media' },
  { id:'escalate_human',   label:'Escalate to human agent' },
]

const DEFAULT_AGENT = {
  name: '',
  avatar: '🤖',
  role: 'receptionist',
  language: 'ar',
  objective: '',
  personality: '',
  aiProvider: 'openai',
  aiModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 500,
  channels: ['WhatsApp'],
  allowedActions: ['reply', 'collect_info'],
  costLimitDaily: '',
  knowledgeBaseId: '',
  isActive: false,
}

function Badge({ label, color }) {
  return (
    <span style={{ fontSize:'9px', padding:'2px 6px', borderRadius:'3px', background:`${color}18`, border:`1px solid ${color}33`, color, fontWeight:'700', flexShrink:0 }}>
      {label}
    </span>
  )
}

function AgentCard({ agent, isSelected, onClick, onToggle }) {
  const role = ROLES.find(r => r.id === agent.role)
  return (
    <div
      onClick={onClick}
      style={{ background: isSelected ? 'rgba(216,177,106,.06)' : '#111622', border:`1px solid ${isSelected ? 'rgba(216,177,106,.3)' : agent.isActive ? 'rgba(216,177,106,.15)' : '#1a2235'}`, borderRadius:'10px', padding:'14px', cursor:'pointer', transition:'border-color .15s' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <div style={{ width:'38px', height:'38px', borderRadius:'50%', background: agent.isActive ? 'rgba(216,177,106,.08)' : '#1a2235', border:`1px solid ${agent.isActive ? 'rgba(216,177,106,.25)' : '#1e2940'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
            {agent.avatar || '🤖'}
          </div>
          <div>
            <div style={{ fontWeight:'700', fontSize:'13px' }}>{agent.name}</div>
            <div style={{ fontSize:'10px', color:'#64748b', marginTop:'1px' }}>{role?.emoji} {role?.label}</div>
          </div>
        </div>
        <div
          onClick={e => { e.stopPropagation(); onToggle(agent) }}
          style={{ width:'36px', height:'20px', borderRadius:'10px', background: agent.isActive ? '#D8B16A' : '#1e2940', cursor:'pointer', position:'relative', transition:'background .2s', border:'1px solid transparent', flexShrink:0 }}
        >
          <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: agent.isActive ? '18px' : '2px', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }}></div>
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'8px' }}>
        {(agent.channels || []).slice(0,3).map(ch => (
          <Badge key={ch} label={ch} color="#3b82f6" />
        ))}
        {(agent.channels || []).length > 3 && <Badge label={`+${agent.channels.length - 3}`} color="#64748b" />}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'10px' }}>
        <span style={{ color:'#3d4f63' }}>
          {AI_PROVIDERS.find(p => p.id === agent.aiProvider)?.label || agent.aiProvider}
        </span>
        <span style={{ color: agent.isActive ? '#D8B16A' : '#3d4f63', fontWeight:'700' }}>
          {agent.isActive ? '● LIVE' : '○ OFF'}
        </span>
      </div>
    </div>
  )
}

export default function AIAgentBuilder() {
  const isMobile = useIsMobile()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('identity')
  const [knowledgeBases, setKnowledgeBases] = useState([])

  // Inline knowledge-base creation (so owners never leave the page)
  const [kbForm, setKbForm] = useState({ open: false, name: '', content: '', saving: false })

  // Test chat state
  const [testMsgs, setTestMsgs] = useState([])
  const [testInput, setTestInput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testMeta, setTestMeta] = useState(null)

  useEffect(() => {
    api.getAgents()
      .then(d => setAgents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
    api.getKnowledgeBases()
      .then(d => setKnowledgeBases(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const runTest = async (preset) => {
    // `preset` is a string when a suggested prompt is clicked; otherwise read the input.
    const msg = (typeof preset === 'string' ? preset : testInput).trim()
    if (!msg || !editing?.id || testLoading) return
    if (typeof preset !== 'string') setTestInput('')
    setTestMsgs(m => [...m, { role: 'user', content: msg }])
    setTestLoading(true)
    try {
      const history = testMsgs.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await api.testAgent(editing.id, msg, history)
      setTestMsgs(m => [...m, { role: 'assistant', content: res.reply }])
      setTestMeta({ provider: res.provider, model: res.model, kb: res.knowledgeBase, used: res.knowledgeUsed, testMode: res.testMode })
    } catch (e) {
      setTestMsgs(m => [...m, { role: 'assistant', content: '⚠️ ' + (e?.message || 'Agent failed to respond'), error: true }])
    } finally {
      setTestLoading(false)
    }
  }

  const openNew  = () => { setEditing({ ...DEFAULT_AGENT }); setTab('identity') }
  const openEdit = (a)  => { setEditing({ ...DEFAULT_AGENT, ...a }); setTab('identity') }

  // Selecting a role on a blank agent auto-fills an expert objective + personality.
  const selectRole = (roleId) => {
    setEditing(prev => {
      const t = ROLE_TEMPLATES[roleId]
      const blank = t && !(prev.objective || '').trim() && !(prev.personality || '').trim()
      return { ...prev, role: roleId, ...(blank ? { objective: t.objective, personality: t.personality } : {}) }
    })
  }

  // Explicit "use expert template" — overwrites objective + personality for the current role.
  const applyRoleTemplate = () => {
    const t = ROLE_TEMPLATES[editing.role]
    if (!t) return
    const hasContent = (editing.objective || '').trim() || (editing.personality || '').trim()
    if (hasContent && !confirm('Replace the current objective and personality with the expert template for this role?')) return
    setEditing({ ...editing, objective: t.objective, personality: t.personality })
  }

  // Create a knowledge base inline, seed it with pasted text, and select it.
  const createInlineKB = async () => {
    const name = kbForm.name.trim()
    const content = kbForm.content.trim()
    if (!name) return alert('Give the knowledge base a name.')
    setKbForm(f => ({ ...f, saving: true }))
    try {
      const kb = await api.createKnowledgeBase({ name, description: 'Created from agent builder' })
      if (content) {
        await api.addKnowledgeSource(kb.id, { type: 'text', name: 'Business info', content })
      }
      setKnowledgeBases(list => [kb, ...list])
      setEditing(e => ({ ...e, knowledgeBaseId: kb.id }))
      setKbForm({ open: false, name: '', content: '', saving: false })
    } catch (err) {
      setKbForm(f => ({ ...f, saving: false }))
      alert('❌ ' + (err?.message || 'Could not create knowledge base'))
    }
  }

  const save = async () => {
    if (!editing.name) return alert('Agent name is required')
    setSaving(true)
    try {
      const dto = { ...editing, costLimitDaily: editing.costLimitDaily ? +editing.costLimitDaily : null }
      let result
      if (editing.id) {
        result = await api.updateAgent(editing.id, dto)
        setAgents(agents.map(a => a.id === editing.id ? result : a))
      } else {
        result = await api.createAgent(dto)
        setAgents([result, ...agents])
      }
      setEditing({ ...result })
    } catch (err) {
      alert('❌ ' + (err?.message || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const toggleAgent = async (agent) => {
    try {
      const updated = await api.toggleAgent(agent.id, !agent.isActive)
      setAgents(agents.map(a => a.id === agent.id ? updated : a))
      if (editing?.id === agent.id) setEditing(e => ({ ...e, isActive: updated.isActive }))
    } catch {}
  }

  const deleteAgent = async () => {
    if (!editing?.id || !confirm('Delete this AI agent?')) return
    try {
      await api.deleteAgent(editing.id)
      setAgents(agents.filter(a => a.id !== editing.id))
      setEditing(null)
    } catch {}
  }

  const modelsForProvider = AI_PROVIDERS.find(p => p.id === editing?.aiProvider)?.models || []

  const toggleAction = (actionId) => {
    const actions = editing.allowedActions || []
    setEditing({ ...editing, allowedActions: actions.includes(actionId) ? actions.filter(a=>a!==actionId) : [...actions, actionId] })
  }

  const toggleChannel = (ch) => {
    const channels = editing.channels || []
    setEditing({ ...editing, channels: channels.includes(ch) ? channels.filter(c=>c!==ch) : [...channels, ch] })
  }

  // Launch-readiness checklist — what an agent needs before going live.
  const readiness = editing ? [
    { label: 'Agent name set',                ok: !!(editing.name || '').trim(),       required: true,  tab: 'identity' },
    { label: 'Objective defined',             ok: !!(editing.objective || '').trim(),  required: true,  tab: 'identity' },
    { label: 'Knowledge base linked',         ok: !!editing.knowledgeBaseId,           required: false, tab: 'behavior' },
    { label: 'At least one channel selected', ok: (editing.channels || []).length > 0, required: true,  tab: 'channels' },
    { label: 'Saved',                         ok: !!editing.id,                        required: true,  tab: 'identity' },
  ] : []
  const missingRequired = readiness.filter(r => r.required && !r.ok)

  // Guarded go-live: block + explain if requirements aren't met.
  const goLive = () => {
    if (missingRequired.length) {
      setTab('test')
      alert('Complete these before going live:\n' + missingRequired.map(r => '• ' + r.label).join('\n'))
      return
    }
    toggleAgent(editing)
  }

  return (
    <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : '100vh', minHeight:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif' }}>
      <NavSidebar />

      {/* Agent List Column */}
      <div style={{ width: isMobile ? '100%' : '320px', maxHeight: isMobile ? '40vh' : 'none', borderRight: isMobile ? 'none' : '1px solid #1a2235', borderBottom: isMobile ? '1px solid #1a2235' : 'none', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'16px', borderBottom:'1px solid #1a2235' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div>
              <div style={{ fontSize:'10px', color:'#a78bfa', fontWeight:'700', letterSpacing:'0.06em' }}>AI AGENTS</div>
              <div style={{ fontSize:'16px', fontWeight:'800' }}>Your AI Workforce</div>
            </div>
            <button onClick={openNew} style={{ padding:'6px 12px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer', flexShrink:0 }}>
              + New
            </button>
          </div>
          <div style={{ fontSize:'11px', color:'#64748b' }}>
            {agents.filter(a=>a.isActive).length} of {agents.length} agents live
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'12px' }}>
          {loading ? (
            <div style={{ color:'#64748b', textAlign:'center', padding:'40px', fontSize:'13px' }}>Loading...</div>
          ) : agents.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>🤖</div>
              <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'6px' }}>No AI Agents Yet</div>
              <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'16px' }}>Create your first AI agent to automate conversations across all channels</div>
              <button onClick={openNew} style={{ padding:'8px 16px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
                Create First Agent
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {agents.map(a => (
                <AgentCard key={a.id} agent={a} isSelected={editing?.id === a.id} onClick={() => openEdit(a)} onToggle={toggleAgent} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Main Area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {editing ? (
          <>
            {/* Editor Header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ fontSize:'24px' }}>{editing.avatar || '🤖'}</div>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:'800' }}>{editing.name || 'New Agent'}</div>
                  <div style={{ fontSize:'11px', color:'#64748b' }}>{editing.id ? 'Editing agent' : 'Configuring new agent'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {editing.id && (
                  <>
                    <button
                      onClick={() => editing.isActive ? toggleAgent(editing) : goLive()}
                      title={!editing.isActive && missingRequired.length ? 'Missing: ' + missingRequired.map(r=>r.label).join(', ') : ''}
                      style={{ padding:'7px 14px', background: editing.isActive ? 'rgba(239,68,68,.1)' : 'rgba(216,177,106,.1)', border:`1px solid ${editing.isActive ? 'rgba(239,68,68,.3)' : 'rgba(216,177,106,.3)'}`, borderRadius:'6px', color: editing.isActive ? '#ef4444' : '#D8B16A', fontSize:'11px', cursor:'pointer', fontWeight:'700' }}
                    >
                      {editing.isActive ? '⏹ Turn Off' : '▶ Go Live'}
                      {!editing.isActive && missingRequired.length > 0 && (
                        <span style={{ marginLeft:'6px', fontSize:'9px', background:'rgba(245,158,11,.2)', color:'#f59e0b', padding:'1px 5px', borderRadius:'8px' }}>{missingRequired.length}</span>
                      )}
                    </button>
                    <button onClick={deleteAgent} style={{ padding:'7px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'6px', color:'#ef4444', fontSize:'11px', cursor:'pointer' }}>
                      🗑 Delete
                    </button>
                  </>
                )}
                <button onClick={save} disabled={saving} style={{ padding:'7px 20px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
                  {saving ? 'Saving...' : (editing.id ? '✅ Save' : '🚀 Create')}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid #1a2235', flexShrink:0, paddingLeft:'20px' }}>
              {[
                { id:'identity', label:'🪪 Identity' },
                { id:'behavior', label:'🧠 AI Behavior' },
                { id:'channels', label:'📡 Channels' },
                { id:'limits',   label:'🛡 Limits' },
                { id:'test',     label:'🧪 Test Live' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding:'11px 18px', background:'none', border:'none', borderBottom: tab===t.id ? '2px solid #D8B16A' : '2px solid transparent', color: tab===t.id ? '#e2e8f0' : '#64748b', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
              {tab === 'identity' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', maxWidth:'720px' }}>
                  {/* Left Column */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div>
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>AGENT NAME *</label>
                      <input value={editing.name} onChange={e => setEditing({...editing, name:e.target.value})}
                        placeholder="e.g. Haya — Dental Receptionist"
                        style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>AVATAR EMOJI</label>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {['🤖','🧑‍⚕️','👩‍⚕️','🦾','💬','🏥','✨','🎯','📞','🌟'].map(em => (
                          <button key={em} onClick={() => setEditing({...editing, avatar:em})}
                            style={{ width:'36px', height:'36px', fontSize:'20px', background: editing.avatar===em ? 'rgba(216,177,106,.1)' : '#111622', border:`1px solid ${editing.avatar===em ? 'rgba(216,177,106,.4)' : '#1a2235'}`, borderRadius:'6px', cursor:'pointer' }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>ROLE</label>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                        {ROLES.map(r => (
                          <button key={r.id} onClick={() => selectRole(r.id)}
                            style={{ padding:'8px', background: editing.role===r.id ? 'rgba(216,177,106,.08)' : '#111622', border:`1px solid ${editing.role===r.id ? 'rgba(216,177,106,.25)' : '#1a2235'}`, borderRadius:'6px', color: editing.role===r.id ? '#D8B16A' : '#e2e8f0', fontSize:'11px', cursor:'pointer', fontWeight:'600', textAlign:'left' }}
                          >
                            {r.emoji} {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>LANGUAGE</label>
                      <select value={editing.language} onChange={e => setEditing({...editing, language:e.target.value})}
                        style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                      >
                        <option value="ar">Arabic (العربية) only</option>
                        <option value="en">English only</option>
                        <option value="ar+en">Arabic + English (bilingual)</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                        <label style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', letterSpacing:'0.04em' }}>OBJECTIVE</label>
                        <button type="button" onClick={applyRoleTemplate}
                          style={{ padding:'4px 10px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.3)', borderRadius:'5px', color:'#a78bfa', fontSize:'10px', fontWeight:'700', cursor:'pointer' }}
                          title="Fill with a professional template for the selected role">
                          ✨ Use expert template
                        </button>
                      </div>
                      <textarea value={editing.objective} onChange={e => setEditing({...editing, objective:e.target.value})}
                        placeholder="What is this agent's goal? e.g. Help patients book dental appointments, answer FAQ about services and pricing, and collect contact details."
                        rows={5}
                        style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>PERSONALITY & TONE</label>
                      <textarea value={editing.personality} onChange={e => setEditing({...editing, personality:e.target.value})}
                        placeholder="Warm, professional, speaks formal Gulf Arabic. Always starts with Islamic greeting. Patient and empathetic. Uses the patient's name when known."
                        rows={5}
                        style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'behavior' && (
                <div style={{ maxWidth:'600px', display:'flex', flexDirection:'column', gap:'20px' }}>
                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.04em' }}>AI PROVIDER</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px' }}>
                      {AI_PROVIDERS.map(p => (
                        <button key={p.id} onClick={() => setEditing({...editing, aiProvider:p.id, aiModel:p.models[0]})}
                          style={{ padding:'10px 8px', background: editing.aiProvider===p.id ? 'rgba(216,177,106,.08)' : '#111622', border:`1px solid ${editing.aiProvider===p.id ? 'rgba(216,177,106,.3)' : '#1a2235'}`, borderRadius:'6px', color: editing.aiProvider===p.id ? '#D8B16A' : '#64748b', fontSize:'10px', cursor:'pointer', fontWeight:'700', textAlign:'center' }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>MODEL</label>
                    <select value={editing.aiModel} onChange={e => setEditing({...editing, aiModel:e.target.value})}
                      style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                    >
                      {modelsForProvider.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div style={{ fontSize:'10px', color:'#64748b', marginTop:'6px', lineHeight:1.5 }}>
                      🛟 <strong style={{ color:'#7a8fa6' }}>Automatic fallback:</strong> if this provider is unavailable or its key fails, the engine retries your other connected providers (OpenAI → Claude → Gemini → Groq) so replies never stop.
                    </div>
                  </div>

                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                      <label style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', letterSpacing:'0.04em' }}>🧠 KNOWLEDGE BASE (AI BRAIN)</label>
                      <button type="button" onClick={() => setKbForm(f => ({ ...f, open: !f.open }))}
                        style={{ padding:'4px 10px', background:'rgba(216,177,106,.1)', border:'1px solid rgba(216,177,106,.3)', borderRadius:'5px', color:'#D8B16A', fontSize:'10px', fontWeight:'700', cursor:'pointer' }}>
                        {kbForm.open ? '✕ Cancel' : '+ Create new'}
                      </button>
                    </div>

                    {kbForm.open ? (
                      <div style={{ background:'#0c0f1a', border:'1px solid rgba(216,177,106,.2)', borderRadius:'8px', padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                        <input value={kbForm.name} onChange={e => setKbForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Knowledge base name — e.g. Clinic Info"
                          style={{ width:'100%', padding:'9px 11px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
                        />
                        <textarea value={kbForm.content} onChange={e => setKbForm(f => ({ ...f, content: e.target.value }))}
                          placeholder="Paste your business info: services, prices, working hours, location, FAQ… The agent will answer from this."
                          rows={5}
                          style={{ width:'100%', padding:'9px 11px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
                        />
                        <button onClick={createInlineKB} disabled={kbForm.saving}
                          style={{ padding:'9px', background: kbForm.saving ? '#1a2235' : '#D8B16A', border:'none', borderRadius:'6px', color: kbForm.saving ? '#64748b' : '#07090f', fontWeight:'700', fontSize:'12px', cursor: kbForm.saving ? 'wait' : 'pointer' }}>
                          {kbForm.saving ? 'Creating & indexing…' : '✓ Create & link to this agent'}
                        </button>
                        <div style={{ fontSize:'10px', color:'#3d4f63' }}>Tip: you can add more files later in <strong style={{color:'#a78bfa'}}>Knowledge</strong> (PDF, CSV, TXT).</div>
                      </div>
                    ) : (
                      <>
                        <select value={editing.knowledgeBaseId || ''} onChange={e => setEditing({...editing, knowledgeBaseId:e.target.value})}
                          style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                        >
                          <option value="">— No knowledge base (general AI) —</option>
                          {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                        </select>
                        <div style={{ fontSize:'10px', color:'#3d4f63', marginTop:'4px' }}>
                          {knowledgeBases.length === 0
                            ? 'No knowledge base yet — click “+ Create new” to give your agent a brain.'
                            : 'The agent answers using this knowledge base. Add more in Knowledge (upload FAQ, pricing, services).'}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <label style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', letterSpacing:'0.04em' }}>TEMPERATURE (Creativity)</label>
                      <span style={{ fontSize:'12px', color:'#D8B16A', fontWeight:'700' }}>{editing.temperature}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={editing.temperature}
                      onChange={e => setEditing({...editing, temperature:+e.target.value})}
                      style={{ width:'100%', accentColor:'#D8B16A' }}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#3d4f63', marginTop:'3px' }}>
                      <span>0 — Precise & deterministic</span>
                      <span>1 — Creative & varied</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>MAX TOKENS PER REPLY</label>
                    <input type="number" value={editing.maxTokens} min={50} max={2000}
                      onChange={e => setEditing({...editing, maxTokens:+e.target.value})}
                      style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                    />
                    <div style={{ fontSize:'10px', color:'#3d4f63', marginTop:'4px' }}>Shorter replies = faster + cheaper. Recommended: 300–600 for conversational agents.</div>
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'10px', fontWeight:'700', letterSpacing:'0.04em' }}>ALLOWED ACTIONS</label>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {ALLOWED_ACTIONS.map(a => (
                        <label key={a.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background: (editing.allowedActions||[]).includes(a.id) ? 'rgba(216,177,106,.05)' : '#111622', border:`1px solid ${(editing.allowedActions||[]).includes(a.id) ? 'rgba(216,177,106,.2)' : '#1a2235'}`, borderRadius:'6px', cursor:'pointer' }}>
                          <input type="checkbox"
                            checked={(editing.allowedActions||[]).includes(a.id)}
                            onChange={() => toggleAction(a.id)}
                            style={{ accentColor:'#D8B16A', width:'14px', height:'14px' }}
                          />
                          <span style={{ fontSize:'12px', color:'#e2e8f0' }}>{a.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'channels' && (
                <div style={{ maxWidth:'480px' }}>
                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'10px', fontWeight:'700', letterSpacing:'0.04em' }}>ACTIVE CHANNELS</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {CHANNELS.map(ch => {
                        const icons = { WhatsApp:'💬', Instagram:'📸', Facebook:'👤', Email:'📧', Telegram:'✈️', 'Web Chat':'🌐' }
                        const isOn = (editing.channels||[]).includes(ch)
                        return (
                          <label key={ch} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background: isOn ? 'rgba(216,177,106,.05)' : '#111622', border:`1px solid ${isOn ? 'rgba(216,177,106,.2)' : '#1a2235'}`, borderRadius:'8px', cursor:'pointer' }}>
                            <input type="checkbox" checked={isOn} onChange={() => toggleChannel(ch)} style={{ accentColor:'#D8B16A', width:'14px', height:'14px' }} />
                            <span style={{ fontSize:'16px' }}>{icons[ch]}</span>
                            <span style={{ fontSize:'13px', fontWeight:'600' }}>{ch}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ background:'rgba(216,177,106,.04)', border:'1px solid rgba(216,177,106,.1)', borderRadius:'8px', padding:'14px', fontSize:'12px', color:'#64748b', lineHeight:'1.7' }}>
                    💡 The agent automatically handles incoming messages on all selected channels. Make sure the corresponding channel is connected in <strong style={{color:'#e2e8f0'}}>Integrations</strong>.
                  </div>
                </div>
              )}

              {tab === 'limits' && (
                <div style={{ maxWidth:'480px', display:'flex', flexDirection:'column', gap:'20px' }}>
                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>DAILY AI COST LIMIT (USD)</label>
                    <input type="number" value={editing.costLimitDaily} min={0} step={0.5}
                      onChange={e => setEditing({...editing, costLimitDaily:e.target.value})}
                      placeholder="Leave blank for no limit"
                      style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                    />
                    <div style={{ fontSize:'10px', color:'#3d4f63', marginTop:'4px' }}>Agent stops responding for the day when this spend is reached to prevent runaway costs.</div>
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.04em' }}>WORKING HOURS</label>
                    <div style={{ background:'rgba(167,139,250,.04)', border:'1px solid rgba(167,139,250,.12)', borderRadius:'8px', padding:'14px', fontSize:'12px', color:'#64748b', lineHeight:'1.7' }}>
                      🕐 Working hours scheduling is coming in a future update. Agent currently responds 24/7.
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.04em' }}>ESCALATION RULES</label>
                    <div style={{ background:'rgba(249,115,22,.04)', border:'1px solid rgba(249,115,22,.12)', borderRadius:'8px', padding:'14px', fontSize:'12px', color:'#64748b', lineHeight:'1.7' }}>
                      🔄 Advanced escalation rules (after N tries, angry sentiment detection) are coming soon. Enable "Escalate to human agent" in Actions to route complex queries now.
                    </div>
                  </div>
                </div>
              )}

              {tab === 'test' && (
                <div style={{ maxWidth:'640px', display:'flex', flexDirection:'column', height:'100%' }}>
                  {!editing.id ? (
                    <div style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)', borderRadius:'8px', padding:'16px', fontSize:'13px', color:'#f59e0b' }}>
                      💾 Save the agent first, then come back here to test it live.
                    </div>
                  ) : (
                    <>
                      {/* Launch readiness */}
                      <div style={{ background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                          <div style={{ fontSize:'12px', fontWeight:'700', color:'#e2e8f0' }}>🚀 Launch readiness</div>
                          <span style={{ fontSize:'10px', fontWeight:'700', color: missingRequired.length ? '#f59e0b' : '#D8B16A' }}>
                            {missingRequired.length ? `${missingRequired.length} required item${missingRequired.length>1?'s':''} left` : '✓ Ready to go live'}
                          </span>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          {readiness.map(r => (
                            <button key={r.label} onClick={() => !r.ok && setTab(r.tab)}
                              style={{ display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', padding:'2px 0', cursor: r.ok ? 'default' : 'pointer', textAlign:'left' }}>
                              <span style={{ fontSize:'12px', width:'16px', color: r.ok ? '#D8B16A' : (r.required ? '#f59e0b' : '#64748b') }}>{r.ok ? '✓' : (r.required ? '○' : '·')}</span>
                              <span style={{ fontSize:'12px', color: r.ok ? '#94a3b8' : '#e2e8f0' }}>{r.label}</span>
                              {!r.required && <span style={{ fontSize:'9px', color:'#3d4f63' }}>(recommended)</span>}
                              {!r.ok && <span style={{ fontSize:'10px', color:'#3b82f6', marginLeft:'auto' }}>fix →</span>}
                            </button>
                          ))}
                        </div>
                        {missingRequired.length === 0 && !editing.isActive && (
                          <button onClick={goLive} style={{ marginTop:'12px', width:'100%', padding:'9px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
                            ▶ Go Live Now
                          </button>
                        )}
                        {editing.isActive && (
                          <div style={{ marginTop:'10px', fontSize:'11px', color:'#D8B16A', fontWeight:'700' }}>● This agent is LIVE and handling messages.</div>
                        )}
                      </div>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div style={{ fontSize:'12px', color:'#64748b' }}>
                          Talk to <strong style={{ color:'#e2e8f0' }}>{editing.name}</strong> exactly as a customer would. It replies using its provider + knowledge base.
                        </div>
                        {testMsgs.length > 0 && (
                          <button onClick={() => { setTestMsgs([]); setTestMeta(null) }}
                            style={{ padding:'5px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#64748b', fontSize:'11px', cursor:'pointer' }}>
                            Clear
                          </button>
                        )}
                      </div>

                      {testMeta && (
                        <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
                          {testMeta.testMode && <Badge label="⚙️ TEST MODE — no AI key" color="#f59e0b" />}
                          <Badge label={`Provider: ${testMeta.provider}`} color="#D8B16A" />
                          <Badge label={`Model: ${testMeta.model}`} color="#3b82f6" />
                          <Badge label={testMeta.kb ? `KB: ${testMeta.kb} (${testMeta.used} used)` : 'No knowledge base'} color={testMeta.kb ? '#a78bfa' : '#64748b'} />
                        </div>
                      )}

                      <div style={{ flex:1, minHeight:'300px', maxHeight:'440px', overflow:'auto', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
                        {testMsgs.length === 0 ? (
                          <div style={{ margin:'auto', textAlign:'center', color:'#3d4f63', fontSize:'12px' }}>
                            <div style={{ fontSize:'28px', marginBottom:'10px' }}>{editing.avatar || '🤖'}</div>
                            <div style={{ marginBottom:'14px' }}>Send a message to test your agent — or try one:</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center' }}>
                              {(editing.language === 'ar'
                                  ? ['ما هي ساعات العمل؟', 'كم التكلفة؟', 'أريد حجز موعد']
                                  : editing.language === 'fr'
                                  ? ['Quels sont vos horaires ?', 'Quels sont vos prix ?', 'Je veux prendre rendez-vous']
                                  : editing.language === 'ar+en'
                                  ? ['What are your opening hours?', 'كم التكلفة؟', 'I want to book an appointment']
                                  : ['What are your opening hours?', 'How much does it cost?', 'I want to book an appointment']
                              ).map(q => (
                                <button key={q} onClick={() => runTest(q)}
                                  style={{ padding:'7px 12px', background:'#111622', border:'1px solid #253045', borderRadius:'16px', color:'#94a3b8', fontSize:'12px', cursor:'pointer' }}>
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : testMsgs.map((m, i) => (
                          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'78%' }}>
                            <div style={{
                              padding:'9px 13px', borderRadius:'12px', fontSize:'13px', lineHeight:'1.55', whiteSpace:'pre-wrap',
                              background: m.role === 'user' ? '#D8B16A' : m.error ? 'rgba(239,68,68,.1)' : '#1a2235',
                              color: m.role === 'user' ? '#07090f' : m.error ? '#ef4444' : '#e2e8f0',
                              border: m.role === 'user' ? 'none' : `1px solid ${m.error ? 'rgba(239,68,68,.3)' : '#253045'}`,
                            }}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {testLoading && (
                          <div style={{ alignSelf:'flex-start', padding:'9px 13px', borderRadius:'12px', background:'#1a2235', border:'1px solid #253045', color:'#64748b', fontSize:'13px' }}>
                            {editing.avatar || '🤖'} typing…
                          </div>
                        )}
                      </div>

                      <div style={{ display:'flex', gap:'8px' }}>
                        <input value={testInput} onChange={e => setTestInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !testLoading && runTest()}
                          placeholder="Type a customer message…"
                          style={{ flex:1, padding:'11px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'8px', color:'#e2e8f0', fontSize:'13px', outline:'none' }}
                        />
                        <button onClick={() => runTest()} disabled={testLoading || !testInput.trim()}
                          style={{ padding:'11px 20px', background: testLoading || !testInput.trim() ? '#1a2235' : '#D8B16A', border:'none', borderRadius:'8px', color: testLoading || !testInput.trim() ? '#64748b' : '#07090f', fontWeight:'700', fontSize:'13px', cursor: testLoading || !testInput.trim() ? 'not-allowed' : 'pointer' }}>
                          {testLoading ? '…' : 'Send'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'#3d4f63' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🤖</div>
            <div style={{ fontSize:'15px', fontWeight:'700', marginBottom:'6px', color:'#64748b' }}>Select an agent to edit</div>
            <div style={{ fontSize:'12px', color:'#3d4f63' }}>or create a new one</div>
          </div>
        )}
      </div>
    </div>
  )
}
