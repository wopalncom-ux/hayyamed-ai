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
      style={{ background: isSelected ? 'rgba(0,229,160,.06)' : '#111622', border:`1px solid ${isSelected ? 'rgba(0,229,160,.3)' : agent.isActive ? 'rgba(0,229,160,.15)' : '#1a2235'}`, borderRadius:'10px', padding:'14px', cursor:'pointer', transition:'border-color .15s' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <div style={{ width:'38px', height:'38px', borderRadius:'50%', background: agent.isActive ? 'rgba(0,229,160,.08)' : '#1a2235', border:`1px solid ${agent.isActive ? 'rgba(0,229,160,.25)' : '#1e2940'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
            {agent.avatar || '🤖'}
          </div>
          <div>
            <div style={{ fontWeight:'700', fontSize:'13px' }}>{agent.name}</div>
            <div style={{ fontSize:'10px', color:'#64748b', marginTop:'1px' }}>{role?.emoji} {role?.label}</div>
          </div>
        </div>
        <div
          onClick={e => { e.stopPropagation(); onToggle(agent) }}
          style={{ width:'36px', height:'20px', borderRadius:'10px', background: agent.isActive ? '#00e5a0' : '#1e2940', cursor:'pointer', position:'relative', transition:'background .2s', border:'1px solid transparent', flexShrink:0 }}
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
        <span style={{ color: agent.isActive ? '#00e5a0' : '#3d4f63', fontWeight:'700' }}>
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

  const runTest = async () => {
    const msg = testInput.trim()
    if (!msg || !editing?.id) return
    setTestInput('')
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
            <button onClick={openNew} style={{ padding:'6px 12px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer', flexShrink:0 }}>
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
              <button onClick={openNew} style={{ padding:'8px 16px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
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
                      onClick={() => toggleAgent(editing)}
                      style={{ padding:'7px 14px', background: editing.isActive ? 'rgba(239,68,68,.1)' : 'rgba(0,229,160,.1)', border:`1px solid ${editing.isActive ? 'rgba(239,68,68,.3)' : 'rgba(0,229,160,.3)'}`, borderRadius:'6px', color: editing.isActive ? '#ef4444' : '#00e5a0', fontSize:'11px', cursor:'pointer', fontWeight:'700' }}
                    >
                      {editing.isActive ? '⏹ Turn Off' : '▶ Go Live'}
                    </button>
                    <button onClick={deleteAgent} style={{ padding:'7px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'6px', color:'#ef4444', fontSize:'11px', cursor:'pointer' }}>
                      🗑 Delete
                    </button>
                  </>
                )}
                <button onClick={save} disabled={saving} style={{ padding:'7px 20px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
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
                  style={{ padding:'11px 18px', background:'none', border:'none', borderBottom: tab===t.id ? '2px solid #00e5a0' : '2px solid transparent', color: tab===t.id ? '#e2e8f0' : '#64748b', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
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
                            style={{ width:'36px', height:'36px', fontSize:'20px', background: editing.avatar===em ? 'rgba(0,229,160,.1)' : '#111622', border:`1px solid ${editing.avatar===em ? 'rgba(0,229,160,.4)' : '#1a2235'}`, borderRadius:'6px', cursor:'pointer' }}
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
                          <button key={r.id} onClick={() => setEditing({...editing, role:r.id})}
                            style={{ padding:'8px', background: editing.role===r.id ? 'rgba(0,229,160,.08)' : '#111622', border:`1px solid ${editing.role===r.id ? 'rgba(0,229,160,.25)' : '#1a2235'}`, borderRadius:'6px', color: editing.role===r.id ? '#00e5a0' : '#e2e8f0', fontSize:'11px', cursor:'pointer', fontWeight:'600', textAlign:'left' }}
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
                      <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>OBJECTIVE</label>
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
                          style={{ padding:'10px 8px', background: editing.aiProvider===p.id ? 'rgba(0,229,160,.08)' : '#111622', border:`1px solid ${editing.aiProvider===p.id ? 'rgba(0,229,160,.3)' : '#1a2235'}`, borderRadius:'6px', color: editing.aiProvider===p.id ? '#00e5a0' : '#64748b', fontSize:'10px', cursor:'pointer', fontWeight:'700', textAlign:'center' }}
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
                  </div>

                  <div>
                    <label style={{ fontSize:'11px', color:'#64748b', display:'block', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.04em' }}>🧠 KNOWLEDGE BASE (AI BRAIN)</label>
                    <select value={editing.knowledgeBaseId || ''} onChange={e => setEditing({...editing, knowledgeBaseId:e.target.value})}
                      style={{ width:'100%', padding:'10px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                    >
                      <option value="">— No knowledge base (general AI) —</option>
                      {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                    </select>
                    <div style={{ fontSize:'10px', color:'#3d4f63', marginTop:'4px' }}>
                      The agent answers using this knowledge base. Create one in <strong style={{color:'#a78bfa'}}>Knowledge</strong> (upload FAQ, pricing, services).
                    </div>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <label style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', letterSpacing:'0.04em' }}>TEMPERATURE (Creativity)</label>
                      <span style={{ fontSize:'12px', color:'#00e5a0', fontWeight:'700' }}>{editing.temperature}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={editing.temperature}
                      onChange={e => setEditing({...editing, temperature:+e.target.value})}
                      style={{ width:'100%', accentColor:'#00e5a0' }}
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
                        <label key={a.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background: (editing.allowedActions||[]).includes(a.id) ? 'rgba(0,229,160,.05)' : '#111622', border:`1px solid ${(editing.allowedActions||[]).includes(a.id) ? 'rgba(0,229,160,.2)' : '#1a2235'}`, borderRadius:'6px', cursor:'pointer' }}>
                          <input type="checkbox"
                            checked={(editing.allowedActions||[]).includes(a.id)}
                            onChange={() => toggleAction(a.id)}
                            style={{ accentColor:'#00e5a0', width:'14px', height:'14px' }}
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
                          <label key={ch} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background: isOn ? 'rgba(0,229,160,.05)' : '#111622', border:`1px solid ${isOn ? 'rgba(0,229,160,.2)' : '#1a2235'}`, borderRadius:'8px', cursor:'pointer' }}>
                            <input type="checkbox" checked={isOn} onChange={() => toggleChannel(ch)} style={{ accentColor:'#00e5a0', width:'14px', height:'14px' }} />
                            <span style={{ fontSize:'16px' }}>{icons[ch]}</span>
                            <span style={{ fontSize:'13px', fontWeight:'600' }}>{ch}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ background:'rgba(0,229,160,.04)', border:'1px solid rgba(0,229,160,.1)', borderRadius:'8px', padding:'14px', fontSize:'12px', color:'#64748b', lineHeight:'1.7' }}>
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
                          <Badge label={`Provider: ${testMeta.provider}`} color="#00e5a0" />
                          <Badge label={`Model: ${testMeta.model}`} color="#3b82f6" />
                          <Badge label={testMeta.kb ? `KB: ${testMeta.kb} (${testMeta.used} used)` : 'No knowledge base'} color={testMeta.kb ? '#a78bfa' : '#64748b'} />
                        </div>
                      )}

                      <div style={{ flex:1, minHeight:'300px', maxHeight:'440px', overflow:'auto', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
                        {testMsgs.length === 0 ? (
                          <div style={{ margin:'auto', textAlign:'center', color:'#3d4f63', fontSize:'12px' }}>
                            <div style={{ fontSize:'28px', marginBottom:'8px' }}>{editing.avatar || '🤖'}</div>
                            Send a message to test your agent.<br/>
                            e.g. "What are your opening hours?" / "كم سعر تنظيف الأسنان؟"
                          </div>
                        ) : testMsgs.map((m, i) => (
                          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'78%' }}>
                            <div style={{
                              padding:'9px 13px', borderRadius:'12px', fontSize:'13px', lineHeight:'1.55', whiteSpace:'pre-wrap',
                              background: m.role === 'user' ? '#00e5a0' : m.error ? 'rgba(239,68,68,.1)' : '#1a2235',
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
                        <button onClick={runTest} disabled={testLoading || !testInput.trim()}
                          style={{ padding:'11px 20px', background: testLoading || !testInput.trim() ? '#1a2235' : '#00e5a0', border:'none', borderRadius:'8px', color: testLoading || !testInput.trim() ? '#64748b' : '#07090f', fontWeight:'700', fontSize:'13px', cursor: testLoading || !testInput.trim() ? 'not-allowed' : 'pointer' }}>
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
