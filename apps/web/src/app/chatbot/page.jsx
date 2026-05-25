'use client'
import { useState } from 'react'

const initialNodes = [
  { id:1, type:'trigger', title:'Customer Sends Message', preview:'WhatsApp incoming message', x:80, y:120, color:'#00e5a0' },
  { id:2, type:'condition', title:'Check Language', preview:'Arabic or English?', x:320, y:120, color:'#f97316' },
  { id:3, type:'message', title:'Send Welcome (AR)', preview:'أهلاً! كيف أقدر أساعدك؟', x:560, y:60, color:'#3b82f6' },
  { id:4, type:'message', title:'Send Welcome (EN)', preview:'Hello! How can I help you?', x:560, y:200, color:'#3b82f6' },
  { id:5, type:'ai', title:'AI Response', preview:'GPT-4 handles the conversation', x:800, y:120, color:'#a78bfa' },
]

const nodeTypes = [
  { type:'trigger', icon:'⚡', label:'Trigger', color:'#00e5a0' },
  { type:'message', icon:'💬', label:'Send Message', color:'#3b82f6' },
  { type:'condition', icon:'🔀', label:'Condition', color:'#f97316' },
  { type:'ai', icon:'🤖', label:'AI Response', color:'#a78bfa' },
  { type:'delay', icon:'⏱️', label:'Delay', color:'#fbbf24' },
  { type:'action', icon:'⚙️', label:'Action', color:'#ef4444' },
]

export default function Chatbot() {
  const [nodes] = useState(initialNodes)
  const [selected, setSelected] = useState(nodes[0])

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{fontSize:'12px', color:'#7a8fa6'}}>/ Chatbot Builder</div>
        <div style={{display:'flex', gap:'8px', marginLeft:'auto'}}>
          <button style={{padding:'6px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>▶ Test Bot</button>
          <button style={{padding:'6px 14px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>🚀 Publish</button>
        </div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{width:'200px', borderRight:'1px solid #1a2235', background:'#0c0f1a', padding:'14px', overflowY:'auto', flexShrink:0}}>
          <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'12px'}}>DRAG NODES</div>
          {nodeTypes.map(n => (
            <div key={n.type} style={{padding:'9px 12px', border:'1px solid #1a2235', borderRadius:'4px', marginBottom:'7px', cursor:'grab', fontSize:'11px', color:'#7a8fa6', display:'flex', alignItems:'center', gap:'8px', background:'#111622'}}>
              <span style={{fontSize:'14px'}}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>

        <div style={{flex:1, position:'relative', overflow:'hidden', background:'#07090f', backgroundImage:'radial-gradient(circle, #1a2235 1px, transparent 1px)', backgroundSize:'24px 24px'}}>
          <svg style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none'}}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#1a2235"/>
              </marker>
            </defs>
            <line x1="240" y1="150" x2="320" y2="150" stroke="#1a2235" strokeWidth="2" markerEnd="url(#arrow)"/>
            <line x1="480" y1="140" x2="560" y2="100" stroke="#1a2235" strokeWidth="2" markerEnd="url(#arrow)"/>
            <line x1="480" y1="160" x2="560" y2="230" stroke="#1a2235" strokeWidth="2" markerEnd="url(#arrow)"/>
            <line x1="720" y1="90" x2="800" y2="150" stroke="#1a2235" strokeWidth="2" markerEnd="url(#arrow)"/>
            <line x1="720" y1="230" x2="800" y2="160" stroke="#1a2235" strokeWidth="2" markerEnd="url(#arrow)"/>
          </svg>

          {nodes.map(n => (
            <div key={n.id} onClick={() => setSelected(n)} style={{position:'absolute', left:n.x, top:n.y, background:'#0f1520', border:`1px solid ${selected?.id===n.id ? n.color : '#1a2235'}`, borderRadius:'4px', padding:'12px 16px', minWidth:'160px', cursor:'pointer', boxShadow: selected?.id===n.id ? `0 0 0 2px ${n.color}30` : 'none'}}>
              <div style={{display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px'}}>
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:n.color, flexShrink:0}}></div>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', textTransform:'uppercase'}}>{n.type}</div>
              </div>
              <div style={{fontSize:'12px', fontWeight:'600', marginBottom:'4px'}}>{n.title}</div>
              <div style={{fontSize:'10px', color:'#7a8fa6'}}>{n.preview}</div>
            </div>
          ))}
        </div>

        <div style={{width:'240px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'16px', overflowY:'auto', flexShrink:0}}>
          <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'14px'}}>NODE PROPERTIES</div>
          {selected && (
            <>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
                <div style={{width:'10px', height:'10px', borderRadius:'50%', background:selected.color}}></div>
                <div style={{fontSize:'12px', fontWeight:'600'}}>{selected.title}</div>
              </div>
              <div style={{marginBottom:'12px'}}>
                <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'6px'}}>TITLE</div>
                <input defaultValue={selected.title} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
              </div>
              <div style={{marginBottom:'12px'}}>
                <div style={{fontSize:'10px', color:'#3d4f63', marginBottom:'6px'}}>MESSAGE / ACTION</div>
                <textarea defaultValue={selected.preview} rows={3} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 10px', color:'#e2e8f0', fontSize:'12px', outline:'none', resize:'vertical'}}/>
              </div>
              <button style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Save Node</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}