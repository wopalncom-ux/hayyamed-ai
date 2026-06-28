'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'
import { useIsMobile } from '@/lib/useIsMobile'

const TRIGGERS = [
  { value: 'new_contact',    label: 'New Contact Created',      icon: '👤', desc: 'Fires when a contact is added manually or via WhatsApp' },
  { value: 'status_changed', label: 'Contact Status Changed',   icon: '🔄', desc: 'Fires when a contact status is updated' },
  { value: 'keyword',        label: 'Keyword Received',         icon: '💬', desc: 'Fires when a WhatsApp message matches a keyword' },
  { value: 'tag_added',      label: 'Tag Added to Contact',     icon: '🏷', desc: 'Fires when a tag is applied to a contact' },
  { value: 'time_based',     label: 'Scheduled (CRON)',         icon: '⏰', desc: 'Fires on a schedule via Cloud Scheduler' },
]

const ACTION_TYPES = [
  { type: 'send_whatsapp',   label: 'Send WhatsApp',     icon: '💬' },
  { type: 'send_email',      label: 'Send Email',        icon: '📧' },
  { type: 'update_contact',  label: 'Update Contact',    icon: '✏️' },
  { type: 'add_tag',         label: 'Add Tag',           icon: '🏷' },
  { type: 'remove_tag',      label: 'Remove Tag',        icon: '❌' },
  { type: 'wait',            label: 'Wait / Delay',      icon: '⏳' },
  { type: 'create_activity', label: 'Log Activity',      icon: '📝' },
  { type: 'assign_to',       label: 'Assign to Agent',   icon: '👤' },
  { type: 'stop',            label: 'Stop Workflow',     icon: '🛑' },
]

const STATUS_OPTIONS = ['NEW', 'ACTIVE', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'INACTIVE']
const CONTACT_FIELDS = ['status', 'stage', 'source', 'city', 'country', 'notes', 'score']

// Ready-to-use automation templates. Every action/trigger below maps to what the
// engine actually executes, so installed templates run immediately.
const TEMPLATES = [
  {
    id: 'welcome', icon: '👋', name: 'Welcome New Lead',
    desc: 'When a new contact arrives, instantly send a friendly WhatsApp welcome.',
    trigger: 'new_contact',
    actions: [{ type: 'send_whatsapp', message: 'Hello {{name}}! 👋 Thank you for reaching out. How can we help you today?' }],
  },
  {
    id: 'tag-greet', icon: '🏷', name: 'Auto-Tag & Greet New Lead',
    desc: 'Tag every new lead and send a greeting so your pipeline stays organised.',
    trigger: 'new_contact',
    actions: [
      { type: 'add_tag', tag: 'new-lead' },
      { type: 'send_whatsapp', message: 'Hi {{name}}! Welcome 🌟 A team member will be with you shortly.' },
    ],
  },
  {
    id: 'followup-24h', icon: '⏰', name: '24h No-Reply Follow-up',
    desc: 'If a new lead goes quiet, automatically follow up the next day.',
    trigger: 'new_contact',
    actions: [
      { type: 'wait', value: 1, unit: 'days', seconds: 86400 },
      { type: 'send_whatsapp', message: 'Hi {{name}}, just checking in 😊 Do you have any questions we can help with?' },
    ],
  },
  {
    id: 'sales-intent', icon: '🎯', name: 'Sales Intent → Hot Lead',
    desc: 'When a message mentions pricing/buying, tag the lead hot and log it for sales.',
    trigger: 'keyword', conditions: { keyword: 'price' },
    actions: [
      { type: 'add_tag', tag: 'hot-lead' },
      { type: 'create_activity', title: 'Sales intent detected — follow up to close' },
    ],
  },
  {
    id: 'complaint', icon: '🚨', name: 'Complaint Alert → Notify Team',
    desc: 'When a customer complains, flag it and log an escalation for a manager.',
    trigger: 'keyword', conditions: { keyword: 'complaint' },
    actions: [
      { type: 'add_tag', tag: 'complaint' },
      { type: 'create_activity', title: '⚠️ Complaint received — escalate to manager' },
    ],
  },
  {
    id: 'won-thanks', icon: '🎉', name: 'Won Customer Thank-You',
    desc: 'When a lead is marked WON, send a thank-you message automatically.',
    trigger: 'status_changed', conditions: { status: 'WON' },
    actions: [{ type: 'send_whatsapp', message: 'Thank you for choosing us, {{name}}! 🎉 We look forward to serving you.' }],
  },
  {
    id: 'support-request', icon: '🎧', name: 'Support Request → Ticket',
    desc: 'When a message mentions support/help, tag it and create a support activity.',
    trigger: 'keyword', conditions: { keyword: 'support' },
    actions: [
      { type: 'add_tag', tag: 'support' },
      { type: 'create_activity', title: 'Support request — create/assign ticket' },
    ],
  },
  {
    id: 'reengage-lost', icon: '🔄', name: 'Re-engage Cold Lead',
    desc: 'When a lead is marked LOST, wait a few days then send a re-engagement message.',
    trigger: 'status_changed', conditions: { status: 'LOST' },
    actions: [
      { type: 'wait', value: 3, unit: 'days', seconds: 259200 },
      { type: 'send_whatsapp', message: 'Hi {{name}}, we miss you! Is there anything we can help you with? We have new offers available.' },
    ],
  },
]

function ActionCard({ action, idx, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, members = [] }) {
  const meta = ACTION_TYPES.find(a => a.type === action.type) || {}
  return (
    <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px 16px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>{meta.icon}</span>
        <span style={{ fontWeight: '700', fontSize: '13px', flex: 1 }}>Step {idx + 1}: {meta.label}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {!isFirst && <button onClick={onMoveUp} style={btnSm}>↑</button>}
          {!isLast && <button onClick={onMoveDown} style={btnSm}>↓</button>}
          <button onClick={onRemove} style={{ ...btnSm, color: '#ef4444', borderColor: '#ef444433' }}>✕</button>
        </div>
      </div>

      {action.type === 'send_whatsapp' && (
        <textarea
          value={action.message || ''}
          onChange={e => onUpdate({ ...action, message: e.target.value })}
          placeholder="Message text. Use {{name}}, {{phone}}, {{email}} for dynamic values."
          rows={3}
          style={textareaStyle}
        />
      )}

      {action.type === 'send_email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={action.subject || ''} onChange={e => onUpdate({ ...action, subject: e.target.value })}
            placeholder="Email subject" style={inputStyle} />
          <textarea value={action.body || ''} onChange={e => onUpdate({ ...action, body: e.target.value })}
            placeholder="Email body text" rows={3} style={textareaStyle} />
        </div>
      )}

      {action.type === 'update_contact' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={action.field || 'status'} onChange={e => onUpdate({ ...action, field: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
            {CONTACT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {action.field === 'status' ? (
            <select value={action.value || ''} onChange={e => onUpdate({ ...action, value: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              <option value="">— pick status —</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={action.value || ''} onChange={e => onUpdate({ ...action, value: e.target.value })}
              placeholder="New value" style={{ ...inputStyle, flex: 1 }} />
          )}
        </div>
      )}

      {(action.type === 'add_tag' || action.type === 'remove_tag') && (
        <input value={action.tag || ''} onChange={e => onUpdate({ ...action, tag: e.target.value })}
          placeholder="Tag name" style={inputStyle} />
      )}

      {action.type === 'assign_to' && (
        <select value={action.userId || ''} onChange={e => onUpdate({ ...action, userId: e.target.value })} style={inputStyle}>
          <option value="">— pick a team member —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
        </select>
      )}

      {action.type === 'wait' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="number" min="1" value={action.value || 1} onChange={e => {
            const v = +e.target.value
            const unit = action.unit || 'hours'
            const seconds = unit === 'minutes' ? v * 60 : unit === 'hours' ? v * 3600 : v * 86400
            onUpdate({ ...action, value: v, unit, seconds })
          }} style={{ ...inputStyle, width: '80px' }} />
          <select value={action.unit || 'hours'} onChange={e => {
            const unit = e.target.value
            const v = action.value || 1
            const seconds = unit === 'minutes' ? v * 60 : unit === 'hours' ? v * 3600 : v * 86400
            onUpdate({ ...action, unit, seconds })
          }} style={{ ...inputStyle, flex: 1 }}>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      )}

      {action.type === 'create_activity' && (
        <input value={action.title || ''} onChange={e => onUpdate({ ...action, title: e.target.value })}
          placeholder="Activity title" style={inputStyle} />
      )}

      {action.type === 'stop' && (
        <div style={{ fontSize: '12px', color: '#64748b' }}>Workflow ends here. No further steps will run.</div>
      )}
    </div>
  )
}

const inputStyle = { background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '13px', width: '100%', boxSizing: 'border-box' }
const textareaStyle = { ...inputStyle, resize: 'vertical', display: 'block' }
const btnSm = { padding: '3px 7px', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }

export default function WorkflowsPage() {
  const isMobile = useIsMobile()
  const [workflows, setWorkflows] = useState([])
  const [runs, setRuns] = useState([])
  const [runStats, setRunStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | builder | runs | templates
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const [testLoading, setTestLoading] = useState(null)
  const [installing, setInstalling] = useState(null)

  // Builder state
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('new_contact')
  const [actions, setActions] = useState([])
  const [conditions, setConditions] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [members, setMembers] = useState([])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    setLoading(true)
    const [wfs, r, s] = await Promise.all([
      api.getWorkflows().catch(() => []),
      api.getWorkflowRuns().catch(() => ({ data: [] })),
      api.getWorkflowStats().catch(() => null),
    ])
    setWorkflows(Array.isArray(wfs) ? wfs : [])
    setRuns(r.data || [])
    setRunStats(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { api.getTeam().then(t => setMembers(Array.isArray(t) ? t : (t?.data || []))).catch(() => {}) }, [])

  const installTemplate = async (tpl) => {
    setInstalling(tpl.id)
    try {
      await api.createWorkflow({ name: tpl.name, trigger: tpl.trigger, actions: tpl.actions, conditions: tpl.conditions || {} })
      showToast(`"${tpl.name}" installed — enable it to go live`)
      await load()
      setView('list')
    } catch (e) {
      showToast(e?.message || 'Install failed', false)
    } finally {
      setInstalling(null)
    }
  }

  const openBuilder = (wf = null) => {
    if (wf) {
      setEditing(wf)
      setName(wf.name)
      setTrigger(wf.trigger)
      setActions(Array.isArray(wf.actions) ? wf.actions : [])
      setConditions(wf.conditions || {})
    } else {
      setEditing(null)
      setName(''); setTrigger('new_contact'); setActions([]); setConditions({})
    }
    setView('builder')
  }

  const addAction = (type) => setActions(a => [...a, { type }])

  const updateAction = (idx, updated) => setActions(a => a.map((x, i) => i === idx ? updated : x))
  const removeAction = (idx) => setActions(a => a.filter((_, i) => i !== idx))
  const moveAction = (idx, dir) => {
    const arr = [...actions]
    const other = idx + dir
    if (other < 0 || other >= arr.length) return
    ;[arr[idx], arr[other]] = [arr[other], arr[idx]]
    setActions(arr)
  }

  const save = async () => {
    if (!name.trim()) return showToast('Workflow name is required', false)
    if (actions.length === 0) return showToast('Add at least one action', false)
    setSavingId('saving')
    try {
      if (editing) {
        await api.updateWorkflow(editing.id, { name, trigger, actions, conditions })
        showToast('Workflow updated')
      } else {
        await api.createWorkflow({ name, trigger, actions, conditions })
        showToast('Workflow created')
      }
      await load()
      setView('list')
    } catch (e) { showToast(e.message || 'Save failed', false) }
    finally { setSavingId(null) }
  }

  const toggleWorkflow = async (id, isActive) => {
    await api.toggleWorkflow(id, !isActive)
    setWorkflows(w => w.map(x => x.id === id ? { ...x, isActive: !isActive } : x))
  }

  const testFire = async (id) => {
    setTestLoading(id)
    try {
      await api.testFireWorkflow(id, {})
      showToast('Workflow fired — check Runs tab')
    } catch (e) { showToast(e.message || 'Test failed', false) }
    finally { setTestLoading(null) }
  }

  const deleteWorkflow = async (id) => {
    if (!confirm('Delete this workflow?')) return
    await api.deleteWorkflow(id)
    setWorkflows(w => w.filter(x => x.id !== id))
    showToast('Deleted')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="workflows" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Workflow Automation</h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Automate follow-ups, status updates, and messaging sequences</p>
          </div>
          {view !== 'builder' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setView('templates')} style={{ padding: '10px 18px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: '8px', color: '#a78bfa', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
                📋 Templates
              </button>
              <button onClick={() => openBuilder()} style={{ padding: '10px 20px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#0a0f1a', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
                + New Workflow
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {runStats && view !== 'builder' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Runs', value: runStats.total, color: '#64748b' },
              { label: 'Running', value: runStats.running, color: '#3b82f6' },
              { label: 'Completed', value: runStats.completed, color: '#D8B16A' },
              { label: 'Failed', value: runStats.failed, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {view !== 'builder' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {[{ id: 'list', label: `⚡ Workflows (${workflows.length})` }, { id: 'templates', label: `📋 Templates (${TEMPLATES.length})` }, { id: 'runs', label: '📋 Run History' }].map(t => (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: view === t.id ? '#D8B16A' : '#1a2235', color: view === t.id ? '#0a0f1a' : '#94a3b8',
              }}>{t.label}</button>
            ))}
          </div>
        )}

        {/* Workflows List */}
        {view === 'list' && (
          <div>
            {loading ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading workflows...</div>
            ) : workflows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#111622', borderRadius: '12px', border: '1px solid #1a2235' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No workflows yet</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Create your first automation to start saving time</div>
                <button onClick={() => openBuilder()} style={{ padding: '10px 20px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#0a0f1a', fontWeight: '800', cursor: 'pointer' }}>
                  + Create First Workflow
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workflows.map(wf => {
                  const trigMeta = TRIGGERS.find(t => t.value === wf.trigger)
                  const actions = Array.isArray(wf.actions) ? wf.actions : []
                  return (
                    <div key={wf.id} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px' }}>{trigMeta?.icon || '⚡'}</span>
                          <span style={{ fontWeight: '700', fontSize: '14px' }}>{wf.name}</span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', background: wf.isActive ? '#D8B16A22' : '#1a2235', color: wf.isActive ? '#D8B16A' : '#64748b' }}>
                            {wf.isActive ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Trigger: {trigMeta?.label || wf.trigger} · {actions.length} step{actions.length !== 1 ? 's' : ''} · {wf.runCount || 0} runs
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => testFire(wf.id)} disabled={testLoading === wf.id}
                          style={{ padding: '6px 12px', background: '#3b82f622', border: '1px solid #3b82f633', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                          {testLoading === wf.id ? '...' : '▶ Test'}
                        </button>
                        <button onClick={() => openBuilder(wf)}
                          style={{ padding: '6px 12px', background: '#1a2235', border: '1px solid #253045', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>
                          Edit
                        </button>
                        <button onClick={() => toggleWorkflow(wf.id, wf.isActive)}
                          style={{ padding: '6px 12px', background: '#1a2235', border: '1px solid #253045', borderRadius: '6px', color: wf.isActive ? '#fbbf24' : '#D8B16A', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                          {wf.isActive ? '⏸ Pause' : '▶ Enable'}
                        </button>
                        <button onClick={() => deleteWorkflow(wf.id)}
                          style={{ padding: '6px 12px', background: '#ef444411', border: '1px solid #ef444433', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Templates Library */}
        {view === 'templates' && (
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              One-click automations every business needs. Install, then enable to go live. You can edit any installed workflow afterwards.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {TEMPLATES.map(tpl => {
                const trig = TRIGGERS.find(t => t.value === tpl.trigger)
                return (
                  <div key={tpl.id} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '22px' }}>{tpl.icon}</span>
                      <span style={{ fontWeight: '800', fontSize: '14px' }}>{tpl.name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '12px', flex: 1 }}>{tpl.desc}</div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(59,130,246,.12)', color: '#3b82f6', fontWeight: 700 }}>{trig?.icon} {trig?.label || tpl.trigger}</span>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#1a2235', color: '#64748b', fontWeight: 700 }}>{tpl.actions.length} action{tpl.actions.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => installTemplate(tpl)} disabled={installing === tpl.id}
                      style={{ padding: '9px', background: installing === tpl.id ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: installing === tpl.id ? '#64748b' : '#0a0f1a', fontWeight: '800', fontSize: '13px', cursor: installing === tpl.id ? 'wait' : 'pointer' }}>
                      {installing === tpl.id ? 'Installing…' : '+ Install'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Run History */}
        {view === 'runs' && (
          <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '13px' }}>Workflow Run History</div>
            {runs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No runs yet. Enable a workflow and trigger an event.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a2235' }}>
                    {['Workflow', 'Status', 'Step', 'Contact', 'Next Step At', 'Started'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < runs.length - 1 ? '1px solid #0f1624' : 'none' }}>
                      <td style={{ padding: '10px 14px' }}>{r.workflow?.name || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: '700',
                          background: r.status === 'completed' ? '#D8B16A22' : r.status === 'failed' ? '#ef444422' : '#3b82f622',
                          color: r.status === 'completed' ? '#D8B16A' : r.status === 'failed' ? '#ef4444' : '#3b82f6',
                        }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.currentStep}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>{r.contactId ? r.contactId.slice(0, 8) + '...' : '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>
                        {r.nextStepAt ? new Date(r.nextStepAt).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Workflow Builder */}
        {view === 'builder' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <button onClick={() => setView('list')} style={{ padding: '8px 14px', background: '#1a2235', border: 'none', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{editing ? 'Edit Workflow' : 'New Workflow'}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
              {/* Main builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Workflow Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Lead Welcome Sequence"
                    style={{ ...inputStyle, fontSize: '15px', fontWeight: '600' }} />
                </div>

                {/* Trigger */}
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>Trigger — when does this run?</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {TRIGGERS.map(t => (
                      <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '6px', background: trigger === t.value ? '#3b82f622' : '#0a0f1a', border: `1px solid ${trigger === t.value ? '#3b82f633' : '#1a2235'}` }}>
                        <input type="radio" value={t.value} checked={trigger === t.value} onChange={() => setTrigger(t.value)} style={{ accentColor: '#3b82f6' }} />
                        <span style={{ fontSize: '16px' }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{t.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{t.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Condition input for keyword / status triggers */}
                  {trigger === 'keyword' && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Keyword the customer message must contain</label>
                      <input value={conditions.keyword || ''} onChange={e => setConditions({ ...conditions, keyword: e.target.value })}
                        placeholder="e.g. price, booking, refund"
                        style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '9px 11px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  )}
                  {trigger === 'tag_added' && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Which tag triggers this? (leave blank for any)</label>
                      <input value={conditions.tag || ''} onChange={e => setConditions({ ...conditions, tag: e.target.value || undefined })}
                        placeholder="e.g. vip, hot-lead"
                        style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '9px 11px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  )}
                  {trigger === 'status_changed' && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Only when status becomes (optional)</label>
                      <select value={conditions.status || ''} onChange={e => setConditions({ ...conditions, status: e.target.value || undefined })}
                        style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '9px 11px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer' }}>
                        <option value="">Any status</option>
                        {['NEW','CONTACTED','QUALIFYING','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Actions</div>

                  {actions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px', border: '2px dashed #1a2235', borderRadius: '8px' }}>
                      Add your first action below
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {actions.map((action, idx) => (
                        <ActionCard
                          key={idx} action={action} idx={idx}
                          onUpdate={u => updateAction(idx, u)}
                          onRemove={() => removeAction(idx)}
                          onMoveUp={() => moveAction(idx, -1)}
                          onMoveDown={() => moveAction(idx, 1)}
                          isFirst={idx === 0}
                          isLast={idx === actions.length - 1}
                          members={members}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Save */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setView('list')} style={{ padding: '10px 20px', background: '#1a2235', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button onClick={save} disabled={!!savingId}
                    style={{ padding: '10px 24px', background: savingId ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: savingId ? '#64748b' : '#0a0f1a', cursor: savingId ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '14px' }}>
                    {savingId ? 'Saving...' : (editing ? 'Save Changes' : 'Create Workflow')}
                  </button>
                </div>
              </div>

              {/* Action palette */}
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px', position: 'sticky', top: '20px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>➕ Add Action</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ACTION_TYPES.map(a => (
                    <button key={a.type} onClick={() => addAction(a.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', cursor: 'pointer', color: '#e2e8f0', fontSize: '13px', textAlign: 'left' }}>
                      <span style={{ fontSize: '15px' }}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '20px', padding: '12px', background: '#0a0f1a', borderRadius: '6px', fontSize: '11px', color: '#64748b' }}>
                  <div style={{ fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>💡 Dynamic variables</div>
                  <div>Use in messages:</div>
                  <div style={{ fontFamily: 'monospace', marginTop: '4px', color: '#D8B16A' }}>
                    {'{{name}}'}<br />{'{{phone}}'}<br />{'{{email}}'}<br />{'{{city}}'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px', background: toast.ok ? '#D8B16A' : '#ef4444', color: toast.ok ? '#0a0f1a' : '#fff', fontWeight: '700', fontSize: '14px', zIndex: 9999 }}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  )
}
