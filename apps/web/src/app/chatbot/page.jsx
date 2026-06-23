'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

// ─── Node definitions ───────────────────────────────────────────────────────
const NODE_TYPES = [
  { type:'trigger',   icon:'⚡', label:'Trigger',       color:'#00e5a0', desc:'Starts the automation' },
  { type:'message',   icon:'💬', label:'Send Message',  color:'#3b82f6', desc:'WhatsApp/Instagram message' },
  { type:'condition', icon:'🔀', label:'Condition',     color:'#f97316', desc:'Branch based on data' },
  { type:'ai',        icon:'🤖', label:'AI Reply',      color:'#a78bfa', desc:'Generate smart response' },
  { type:'delay',     icon:'⏱',  label:'Delay',         color:'#fbbf24', desc:'Wait before next step' },
  { type:'tag',       icon:'🏷',  label:'Tag Contact',   color:'#ec4899', desc:'Add a tag to contact' },
  { type:'assign',    icon:'👤', label:'Assign Agent',  color:'#06b6d4', desc:'Route to human agent' },
  { type:'webhook',   icon:'🔗', label:'Webhook',       color:'#84cc16', desc:'Call external API' },
]

const TRIGGER_TYPES = [
  { id:'new_message',    label:'New incoming message' },
  { id:'keyword',        label:'Keyword match' },
  { id:'new_contact',    label:'New contact created' },
  { id:'tag_added',      label:'Tag added to contact' },
  { id:'booking_created',label:'Booking created' },
  { id:'time_based',     label:'Scheduled time' },
]

const INITIAL_NODES = [
  { id:'n1', type:'trigger',   title:'New WhatsApp Message', config:{ trigger:'new_message' }, x:60,  y:80,  color:'#00e5a0' },
  { id:'n2', type:'condition', title:'Check Intent',         config:{ field:'message', op:'contains', value:'مرحبا,hello,hi' }, x:300, y:80,  color:'#f97316' },
  { id:'n3', type:'ai',        title:'AI Welcome Reply',     config:{ provider:'openai', model:'gpt-4o', tone:'friendly' }, x:540, y:20,  color:'#a78bfa' },
  { id:'n4', type:'message',   title:'Generic Reply',        config:{ message:'شكراً لتواصلك معنا! كيف يمكنني مساعدتك؟' }, x:540, y:160, color:'#3b82f6' },
]

const INITIAL_EDGES = [
  { id:'e1', from:'n1', to:'n2' },
  { id:'e2', from:'n2', to:'n3', label:'Yes' },
  { id:'e3', from:'n2', to:'n4', label:'No' },
]

const NODE_W = 178
const NODE_H = 64

function nodeCenter(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 }
}

function edgePath(from, to) {
  const fc = nodeCenter(from)
  const tc = nodeCenter(to)
  const cx1 = fc.x + (tc.x - fc.x) * 0.5
  const cy1 = fc.y
  const cx2 = fc.x + (tc.x - fc.x) * 0.5
  const cy2 = tc.y
  return `M${fc.x},${fc.y} C${cx1},${cy1} ${cx2},${cy2} ${tc.x},${tc.y}`
}

// ─── Workflow Library Panel ──────────────────────────────────────────────────
function WorkflowLibrary({ workflows, activeId, onSelect, onCreate, onToggle, onDelete }) {
  return (
    <div style={{ width:'240px', borderRight:'1px solid #1a2235', background:'#0c0f1a', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'14px', borderBottom:'1px solid #1a2235' }}>
        <div style={{ fontSize:'10px', color:'#a78bfa', fontWeight:'700', letterSpacing:'0.05em', marginBottom:'4px' }}>AUTOMATIONS</div>
        <button onClick={onCreate}
          style={{ width:'100%', padding:'7px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer' }}
        >
          + New Automation
        </button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px' }}>
        {workflows.length === 0 ? (
          <div style={{ color:'#3d4f63', fontSize:'11px', textAlign:'center', padding:'20px 8px' }}>No automations yet</div>
        ) : workflows.map(wf => (
          <div key={wf.id} onClick={() => onSelect(wf)}
            style={{ padding:'10px 12px', background: activeId===wf.id ? 'rgba(0,229,160,.08)' : '#111622', border:`1px solid ${activeId===wf.id ? 'rgba(0,229,160,.25)' : '#1a2235'}`, borderRadius:'6px', marginBottom:'6px', cursor:'pointer' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'6px' }}>
              <div style={{ fontWeight:'600', fontSize:'12px', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wf.name}</div>
              <div
                onClick={e => { e.stopPropagation(); onToggle(wf) }}
                style={{ width:'28px', height:'16px', borderRadius:'8px', background: wf.isActive ? '#00e5a0' : '#1e2940', cursor:'pointer', position:'relative', flexShrink:0 }}
              >
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: wf.isActive ? '14px' : '2px', transition:'left .15s' }}></div>
              </div>
            </div>
            <div style={{ fontSize:'10px', color:'#64748b', marginTop:'3px' }}>
              {wf.trigger} · {wf.runCount || 0} runs
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(wf.id) }}
              style={{ marginTop:'6px', padding:'2px 8px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'3px', color:'#ef4444', fontSize:'9px', cursor:'pointer' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Node Properties Panel ──────────────────────────────────────────────────
function PropertiesPanel({ node, onChange, onDelete }) {
  if (!node) {
    return (
      <div style={{ width:'220px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <div style={{ fontSize:'11px', color:'#3d4f63', textAlign:'center', padding:'20px' }}>Select a node to edit its properties</div>
      </div>
    )
  }

  const nt = NODE_TYPES.find(t => t.type === node.type)

  return (
    <div style={{ width:'240px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', overflow:'auto', flexShrink:0 }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'16px' }}>{nt?.icon}</span>
        <div>
          <div style={{ fontSize:'10px', color: nt?.color, fontWeight:'700', letterSpacing:'0.04em' }}>{nt?.label?.toUpperCase()}</div>
          <div style={{ fontSize:'12px', fontWeight:'700' }}>{node.title}</div>
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>NODE LABEL</label>
          <input value={node.title} onChange={e => onChange({ ...node, title: e.target.value })}
            style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        {/* Trigger config */}
        {node.type === 'trigger' && (
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>TRIGGER EVENT</label>
            <select value={node.config?.trigger || 'new_message'}
              onChange={e => onChange({ ...node, config: { ...node.config, trigger: e.target.value } })}
              style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
            >
              {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {node.config?.trigger === 'keyword' && (
              <div style={{ marginTop:'8px' }}>
                <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'3px' }}>KEYWORDS (comma-separated)</label>
                <input value={node.config?.keywords || ''} onChange={e => onChange({ ...node, config: { ...node.config, keywords: e.target.value } })}
                  placeholder="price, موعد, booking"
                  style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Message config */}
        {node.type === 'message' && (
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>MESSAGE TEXT</label>
            <textarea value={node.config?.message || ''} onChange={e => onChange({ ...node, config: { ...node.config, message: e.target.value } })}
              rows={5} placeholder="Enter message to send..."
              style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
            />
            <div style={{ fontSize:'9px', color:'#3d4f63', marginTop:'3px' }}>
              Use {'{{contact.name}}'}, {'{{contact.phone}}'} for personalization
            </div>
          </div>
        )}

        {/* Condition config */}
        {node.type === 'condition' && (
          <>
            <div style={{ marginBottom:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>FIELD</label>
              <select value={node.config?.field || 'message'}
                onChange={e => onChange({ ...node, config: { ...node.config, field: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                {['message','contact.name','contact.tag','contact.status','contact.score'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>OPERATOR</label>
              <select value={node.config?.op || 'contains'}
                onChange={e => onChange({ ...node, config: { ...node.config, op: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                {['contains','equals','starts_with','not_contains','greater_than','less_than'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>VALUE</label>
              <input value={node.config?.value || ''} onChange={e => onChange({ ...node, config: { ...node.config, value: e.target.value } })}
                placeholder="hello, booking, price..."
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
          </>
        )}

        {/* AI config */}
        {node.type === 'ai' && (
          <>
            <div style={{ marginBottom:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>PROVIDER</label>
              <select value={node.config?.provider || 'openai'}
                onChange={e => onChange({ ...node, config: { ...node.config, provider: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                <option value="openai">OpenAI GPT</option>
                <option value="anthropic">Claude</option>
                <option value="google">Gemini</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div style={{ marginBottom:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>TONE</label>
              <select value={node.config?.tone || 'friendly'}
                onChange={e => onChange({ ...node, config: { ...node.config, tone: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                {['friendly','professional','formal','concise','empathetic'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>SYSTEM PROMPT (optional)</label>
              <textarea value={node.config?.systemPrompt || ''} onChange={e => onChange({ ...node, config: { ...node.config, systemPrompt: e.target.value } })}
                rows={4} placeholder="You are a helpful dental clinic receptionist..."
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
              />
            </div>
          </>
        )}

        {/* Delay config */}
        {node.type === 'delay' && (
          <div style={{ marginBottom:'12px', display:'flex', gap:'6px' }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>WAIT</label>
              <input type="number" value={node.config?.amount || 5} min={1}
                onChange={e => onChange({ ...node, config: { ...node.config, amount: +e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>UNIT</label>
              <select value={node.config?.unit || 'minutes'}
                onChange={e => onChange({ ...node, config: { ...node.config, unit: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                {['seconds','minutes','hours','days'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Tag config */}
        {node.type === 'tag' && (
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>TAG NAME</label>
            <input value={node.config?.tag || ''} onChange={e => onChange({ ...node, config: { ...node.config, tag: e.target.value } })}
              placeholder="e.g. interested, hot-lead, vip"
              style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box' }}
            />
          </div>
        )}

        {/* Webhook config */}
        {node.type === 'webhook' && (
          <>
            <div style={{ marginBottom:'8px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>URL</label>
              <input value={node.config?.url || ''} onChange={e => onChange({ ...node, config: { ...node.config, url: e.target.value } })}
                placeholder="https://api.example.com/webhook"
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'11px', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', color:'#64748b', display:'block', marginBottom:'4px', fontWeight:'700' }}>METHOD</label>
              <select value={node.config?.method || 'POST'}
                onChange={e => onChange({ ...node, config: { ...node.config, method: e.target.value } })}
                style={{ width:'100%', padding:'7px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'5px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
              >
                {['POST','GET','PUT'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </>
        )}

        <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
          <button onClick={() => onDelete(node.id)}
            style={{ flex:1, padding:'7px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.18)', borderRadius:'5px', color:'#ef4444', fontSize:'11px', cursor:'pointer' }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AutomationBuilder() {
  const [workflows, setWorkflows] = useState([])
  const [activeWF, setActiveWF] = useState(null)
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [edges, setEdges] = useState(INITIAL_EDGES)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  // Drag state
  const dragNodeId = useRef(null)
  const dragOffset = useRef({ x:0, y:0 })
  const canvasRef = useRef(null)

  // Edge drawing state
  const [drawingEdge, setDrawingEdge] = useState(null) // { fromId, mx, my }

  useEffect(() => {
    api.getWorkflows?.()
      .then(d => setWorkflows(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const loadWorkflow = (wf) => {
    setActiveWF(wf)
    const flow = wf.actions || {}
    setNodes(flow.nodes?.length ? flow.nodes : INITIAL_NODES)
    setEdges(flow.edges || INITIAL_EDGES)
    setSelected(null)
  }

  const createWorkflow = async () => {
    const name = prompt('Automation name:', 'New Automation')
    if (!name) return
    try {
      const wf = await api.createWorkflow({ name, trigger:'new_message', actions:{ nodes: INITIAL_NODES, edges: INITIAL_EDGES } })
      setWorkflows([wf, ...workflows])
      loadWorkflow(wf)
    } catch {}
  }

  const saveWorkflow = async () => {
    setSaving(true)
    setStatus('')
    try {
      const flow = { nodes, edges }
      if (activeWF) {
        const updated = await api.updateWorkflow(activeWF.id, { actions: flow })
        setWorkflows(workflows.map(w => w.id === activeWF.id ? updated : w))
        setActiveWF(updated)
      }
      setStatus('saved')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const toggleWorkflow = async (wf) => {
    try {
      const updated = await api.toggleWorkflow(wf.id, !wf.isActive)
      setWorkflows(workflows.map(w => w.id === wf.id ? updated : w))
      if (activeWF?.id === wf.id) setActiveWF(updated)
    } catch {}
  }

  const deleteWorkflow = async (id) => {
    if (!confirm('Delete this automation?')) return
    try {
      await api.deleteWorkflow(id)
      setWorkflows(workflows.filter(w => w.id !== id))
      if (activeWF?.id === id) { setActiveWF(null); setNodes(INITIAL_NODES); setEdges(INITIAL_EDGES) }
    } catch {}
  }

  const addNode = (nt) => {
    const id = `n${Date.now()}`
    const newNode = { id, type: nt.type, title: nt.label, config:{}, x: 80 + (nodes.length % 4) * 220, y: 60 + Math.floor(nodes.length / 4) * 120, color: nt.color }
    setNodes(prev => [...prev, newNode])
    setSelected(newNode)
  }

  const updateNode = (updated) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n))
    setSelected(updated)
  }

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id))
    setSelected(null)
  }

  // Drag
  const onNodeMouseDown = (e, node) => {
    e.stopPropagation()
    if (e.shiftKey) {
      // Shift+click = start drawing edge
      setDrawingEdge({ fromId: node.id, mx: e.clientX, my: e.clientY })
      return
    }
    dragNodeId.current = node.id
    const rect = canvasRef.current.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y }
    setSelected(node)
  }

  const onCanvasMouseMove = (e) => {
    if (drawingEdge) {
      setDrawingEdge(d => ({ ...d, mx: e.clientX, my: e.clientY }))
      return
    }
    if (!dragNodeId.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left - dragOffset.current.x)
    const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y)
    setNodes(prev => prev.map(n => n.id === dragNodeId.current ? { ...n, x, y } : n))
    setSelected(s => s?.id === dragNodeId.current ? { ...s, x, y } : s)
  }

  const onCanvasMouseUp = (e) => {
    if (drawingEdge) {
      // Find target node under cursor
      const rect = canvasRef.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const target = nodes.find(n => mx >= n.x && mx <= n.x + NODE_W && my >= n.y && my <= n.y + NODE_H && n.id !== drawingEdge.fromId)
      if (target) {
        const alreadyExists = edges.some(e => e.from === drawingEdge.fromId && e.to === target.id)
        if (!alreadyExists) {
          setEdges(prev => [...prev, { id:`e${Date.now()}`, from: drawingEdge.fromId, to: target.id }])
        }
      }
      setDrawingEdge(null)
      return
    }
    dragNodeId.current = null
  }

  const deleteEdge = (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }

  // Compute SVG dimensions
  const maxX = Math.max(...nodes.map(n => n.x + NODE_W + 60), 800)
  const maxY = Math.max(...nodes.map(n => n.y + NODE_H + 60), 500)

  const fromNode = drawingEdge ? nodes.find(n => n.id === drawingEdge.fromId) : null

  return (
    <div style={{ display:'flex', height:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif' }}>
      <NavSidebar />

      {/* Workflow Library */}
      <WorkflowLibrary
        workflows={workflows}
        activeId={activeWF?.id}
        onSelect={loadWorkflow}
        onCreate={createWorkflow}
        onToggle={toggleWorkflow}
        onDelete={deleteWorkflow}
      />

      {/* Builder Area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top Bar */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#0c0f1a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div>
              <div style={{ fontSize:'10px', color:'#a78bfa', fontWeight:'700', letterSpacing:'0.05em' }}>AUTOMATION BUILDER</div>
              <div style={{ fontSize:'14px', fontWeight:'800' }}>{activeWF?.name || 'Untitled Automation'}</div>
            </div>
            {activeWF && (
              <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'3px', background: activeWF.isActive ? 'rgba(0,229,160,.1)' : 'rgba(100,116,139,.1)', color: activeWF.isActive ? '#00e5a0' : '#64748b', border:`1px solid ${activeWF.isActive ? 'rgba(0,229,160,.2)' : 'rgba(100,116,139,.2)'}`, fontWeight:'700' }}>
                {activeWF.isActive ? '● LIVE' : '○ PAUSED'}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {status === 'saved' && <span style={{ fontSize:'10px', color:'#00e5a0' }}>✅ Saved</span>}
            {status === 'error' && <span style={{ fontSize:'10px', color:'#ef4444' }}>⚠️ Error</span>}
            <div style={{ fontSize:'10px', color:'#3d4f63', padding:'4px 8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px' }}>
              Shift+drag = draw edge
            </div>
            <button onClick={saveWorkflow} disabled={saving || !activeWF}
              style={{ padding:'7px 18px', background: activeWF ? '#00e5a0' : '#1a2235', border:'none', borderRadius:'6px', color: activeWF ? '#07090f' : '#3d4f63', fontWeight:'700', fontSize:'12px', cursor: activeWF ? 'pointer' : 'not-allowed' }}
            >
              {saving ? 'Saving...' : '💾 Save Flow'}
            </button>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Node Palette */}
          <div style={{ width:'156px', borderRight:'1px solid #1a2235', background:'#0c0f1a', padding:'10px', overflow:'auto', flexShrink:0 }}>
            <div style={{ fontSize:'9px', color:'#3d4f63', letterSpacing:'0.1em', marginBottom:'8px', fontWeight:'700' }}>ADD NODE</div>
            {NODE_TYPES.map(nt => (
              <div key={nt.type} onClick={() => addNode(nt)}
                style={{ padding:'8px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', marginBottom:'5px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = nt.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2235'}
              >
                <span style={{ fontSize:'14px' }}>{nt.icon}</span>
                <div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'#e2e8f0' }}>{nt.label}</div>
                  <div style={{ fontSize:'9px', color:'#3d4f63' }}>{nt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            style={{ flex:1, overflow:'auto', position:'relative', background:'#07090f', backgroundImage:'radial-gradient(circle, #1a2235 1px, transparent 1px)', backgroundSize:'24px 24px', cursor: drawingEdge ? 'crosshair' : 'default' }}
          >
            {/* Not active banner */}
            {!activeWF && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', pointerEvents:'none', zIndex:5 }}>
                <div style={{ fontSize:'32px', marginBottom:'12px' }}>⚡</div>
                <div style={{ fontSize:'14px', fontWeight:'700', color:'#64748b', marginBottom:'6px' }}>Select or create an automation</div>
                <div style={{ fontSize:'11px', color:'#3d4f63' }}>Use the panel on the left</div>
              </div>
            )}

            <svg
              width={maxX}
              height={maxY}
              style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }}
            >
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#3d4f63"/>
                </marker>
              </defs>
              {/* Permanent edges */}
              {edges.map(edge => {
                const fromN = nodes.find(n => n.id === edge.from)
                const toN   = nodes.find(n => n.id === edge.to)
                if (!fromN || !toN) return null
                const path = edgePath(fromN, toN)
                const mx = (nodeCenter(fromN).x + nodeCenter(toN).x) / 2
                const my = (nodeCenter(fromN).y + nodeCenter(toN).y) / 2
                return (
                  <g key={edge.id}>
                    <path d={path} stroke="#3d4f63" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" strokeDasharray="4 3"/>
                    {edge.label && (
                      <text x={mx} y={my - 5} fill="#64748b" fontSize="9" textAnchor="middle">{edge.label}</text>
                    )}
                  </g>
                )
              })}
              {/* Live drawing edge */}
              {drawingEdge && fromNode && (() => {
                const rect = canvasRef.current?.getBoundingClientRect()
                if (!rect) return null
                const fc = nodeCenter(fromNode)
                const tx = drawingEdge.mx - rect.left
                const ty = drawingEdge.my - rect.top
                return <line x1={fc.x} y1={fc.y} x2={tx} y2={ty} stroke="#00e5a0" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)"/>
              })()}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const nt = NODE_TYPES.find(t => t.type === node.type)
              const isSelected = selected?.id === node.id
              return (
                <div
                  key={node.id}
                  onMouseDown={e => onNodeMouseDown(e, node)}
                  onClick={() => setSelected(node)}
                  style={{
                    position:'absolute', left:node.x, top:node.y,
                    width:`${NODE_W}px`, height:`${NODE_H}px`,
                    background:'#0f1520',
                    border:`1px solid ${isSelected ? node.color : '#1e2940'}`,
                    borderLeft:`3px solid ${node.color}`,
                    borderRadius:'6px',
                    padding:'8px 12px',
                    cursor:'grab',
                    userSelect:'none',
                    boxShadow: isSelected ? `0 0 0 2px ${node.color}25` : '0 2px 8px rgba(0,0,0,.4)',
                    zIndex: isSelected ? 10 : 1,
                    boxSizing:'border-box',
                    display:'flex', flexDirection:'column', justifyContent:'center',
                  }}
                >
                  <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'3px' }}>
                    <span style={{ fontSize:'12px' }}>{nt?.icon}</span>
                    <span style={{ fontSize:'9px', color:node.color, fontWeight:'700', letterSpacing:'0.05em', textTransform:'uppercase' }}>{node.type}</span>
                  </div>
                  <div style={{ fontSize:'11px', fontWeight:'700', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.title}</div>
                  {node.config?.message && <div style={{ fontSize:'9px', color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.config.message}</div>}
                  {node.config?.trigger && <div style={{ fontSize:'9px', color:'#64748b' }}>{node.config.trigger}</div>}
                  {node.config?.amount && <div style={{ fontSize:'9px', color:'#64748b' }}>Wait {node.config.amount} {node.config.unit}</div>}
                </div>
              )
            })}

            {/* Edge delete buttons (tiny ×) */}
            {edges.map(edge => {
              const fromN = nodes.find(n => n.id === edge.from)
              const toN   = nodes.find(n => n.id === edge.to)
              if (!fromN || !toN) return null
              const mx = (nodeCenter(fromN).x + nodeCenter(toN).x) / 2
              const my = (nodeCenter(fromN).y + nodeCenter(toN).y) / 2
              return (
                <button key={`del-${edge.id}`} onClick={() => deleteEdge(edge.id)}
                  style={{ position:'absolute', left: mx - 8, top: my - 8, width:'16px', height:'16px', background:'#1a2235', border:'1px solid #2a3548', borderRadius:'50%', color:'#64748b', fontSize:'9px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, lineHeight:1, zIndex:20 }}
                >
                  ×
                </button>
              )
            })}
          </div>

          {/* Properties Panel */}
          <PropertiesPanel
            node={selected}
            onChange={updateNode}
            onDelete={deleteNode}
          />
        </div>
      </div>
    </div>
  )
}
