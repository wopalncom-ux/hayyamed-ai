'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'

const SOURCE_TYPES = [
  { id:'text',         label:'Plain Text',    emoji:'📝', hint:'Paste any text content — FAQ, policies, product descriptions' },
  { id:'faq',          label:'FAQ',           emoji:'❓', hint:'Q&A pairs — best format for customer questions' },
  { id:'product_list', label:'Products/Services', emoji:'🛒', hint:'Product catalog, service menu, pricing' },
  { id:'pricing',      label:'Pricing',       emoji:'💰', hint:'Pricing tables, packages, offers' },
  { id:'url',          label:'Website URL',   emoji:'🌐', hint:'Crawl a web page and extract content' },
]

const STATUS_COLORS = { pending:'#64748b', processing:'#f97316', ready:'#00e5a0', failed:'#ef4444' }
const STATUS_LABELS = { pending:'Pending', processing:'Processing...', ready:'Indexed ✓', failed:'Failed ✗' }

function KBCard({ kb, isSelected, onClick }) {
  const readyCount = (kb.sources || []).filter(s => s.status === 'ready').length
  const totalCount = kb._count?.sources ?? (kb.sources?.length ?? 0)
  return (
    <div onClick={onClick}
      style={{ background: isSelected ? 'rgba(0,229,160,.06)' : '#111622', border:`1px solid ${isSelected ? 'rgba(0,229,160,.3)' : '#1a2235'}`, borderRadius:'10px', padding:'14px', cursor:'pointer', transition:'border-color .15s' }}
    >
      <div style={{ fontSize:'14px', fontWeight:'700', marginBottom:'4px' }}>{kb.name}</div>
      {kb.description && <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'8px' }}>{kb.description}</div>}
      <div style={{ display:'flex', gap:'10px', fontSize:'11px', color:'#64748b' }}>
        <span>📄 {totalCount} sources</span>
        <span style={{ color:'#00e5a0' }}>✓ {readyCount} indexed</span>
        <span>🤖 {kb._count?.agents ?? 0} agents</span>
      </div>
    </div>
  )
}

export default function KnowledgeBasePage() {
  const isMobile = useIsMobile()
  const [kbs, setKbs] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKB, setNewKB] = useState({ name:'', description:'' })
  const [addSource, setAddSource] = useState(false)
  const [sourceType, setSourceType] = useState('text')
  const [sourceName, setSourceName] = useState('')
  const [sourceContent, setSourceContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [savingSource, setSavingSource] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setUploading(true)
    try {
      await api.uploadKnowledgeFile(selected.id, file)
      await api.getKnowledgeBases().then(d => {
        const list = Array.isArray(d) ? d : []
        setKbs(list)
        setSelected(list.find(k => k.id === selected.id) || selected)
      })
      alert(`✅ "${file.name}" uploaded and indexing started.`)
    } catch (err) {
      alert('❌ ' + (err?.message || 'Upload failed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const loadKBs = () => {
    api.getKnowledgeBases()
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setKbs(list)
        if (selected) {
          const refreshed = list.find(k => k.id === selected.id)
          if (refreshed) setSelected(refreshed)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadKBs() }, [])

  const createKB = async () => {
    if (!newKB.name) return alert('Name required')
    setCreating(true)
    try {
      const kb = await api.createKnowledgeBase(newKB)
      setKbs([kb, ...kbs])
      setSelected(kb)
      setNewKB({ name:'', description:'' })
    } catch (err) {
      alert('❌ ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const saveSource = async () => {
    if (!sourceName) return alert('Source name required')
    if (sourceType === 'url' && !sourceUrl) return alert('URL required')
    if (sourceType !== 'url' && !sourceContent) return alert('Content required')
    setSavingSource(true)
    try {
      await api.addKnowledgeSource(selected.id, {
        type: sourceType,
        name: sourceName,
        content: sourceType !== 'url' ? sourceContent : undefined,
        url: sourceType === 'url' ? sourceUrl : undefined,
      })
      setAddSource(false)
      setSourceName(''); setSourceContent(''); setSourceUrl(''); setSourceType('text')
      await api.getKnowledgeBases().then(d => {
        const list = Array.isArray(d) ? d : []
        setKbs(list)
        setSelected(list.find(k => k.id === selected.id) || selected)
      })
    } catch (err) {
      alert('❌ ' + err.message)
    } finally {
      setSavingSource(false)
    }
  }

  const deleteSource = async (sourceId) => {
    if (!confirm('Delete this source and its indexed chunks?')) return
    await api.deleteKnowledgeSource(selected.id, sourceId)
    loadKBs()
  }

  const reindexAll = async () => {
    if (!selected) return
    setReindexing(true)
    try {
      const r = await api.reindexKnowledge(selected.id)
      alert(`✅ ${r.message}`)
      setTimeout(loadKBs, 2000)
    } catch (err) {
      alert('❌ ' + err.message)
    } finally {
      setReindexing(false)
    }
  }

  const search = async () => {
    if (!selected || !searchQuery.trim()) return
    setSearching(true)
    setSearchResults(null)
    try {
      const r = await api.searchKnowledge(selected.id, searchQuery)
      setSearchResults(r)
    } catch {
      setSearchResults({ results: [], count: 0 })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : '100vh', minHeight:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif' }}>
      <NavSidebar />

      {/* Left: KB List */}
      <div style={{ width: isMobile ? '100%' : '300px', maxHeight: isMobile ? '38vh' : 'none', borderRight: isMobile ? 'none' : '1px solid #1a2235', borderBottom: isMobile ? '1px solid #1a2235' : 'none', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'16px', borderBottom:'1px solid #1a2235' }}>
          <div style={{ fontSize:'10px', color:'#a78bfa', fontWeight:'700', letterSpacing:'0.06em', marginBottom:'4px' }}>RAG KNOWLEDGE BASE</div>
          <div style={{ fontSize:'16px', fontWeight:'800', marginBottom:'12px' }}>Knowledge Library</div>
          <div style={{ display:'flex', gap:'8px' }}>
            <input
              value={newKB.name}
              onChange={e => setNewKB({...newKB, name:e.target.value})}
              placeholder="New KB name..."
              style={{ flex:1, padding:'7px 10px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none' }}
              onKeyDown={e => e.key === 'Enter' && createKB()}
            />
            <button onClick={createKB} disabled={creating || !newKB.name}
              style={{ padding:'7px 12px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', flexShrink:0 }}
            >
              {creating ? '...' : '+'}
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'10px' }}>
          {loading ? (
            <div style={{ color:'#64748b', textAlign:'center', padding:'40px', fontSize:'12px' }}>Loading...</div>
          ) : kbs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 16px' }}>
              <div style={{ fontSize:'28px', marginBottom:'10px' }}>🧠</div>
              <div style={{ fontSize:'12px', color:'#64748b' }}>Create your first knowledge base to power your AI agents with accurate information</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {kbs.map(kb => (
                <KBCard key={kb.id} kb={kb} isSelected={selected?.id === kb.id} onClick={() => setSelected(kb)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: KB Detail */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {selected ? (
          <>
            {/* KB Header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ fontSize:'16px', fontWeight:'800' }}>{selected.name}</div>
                {selected.description && <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{selected.description}</div>}
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={reindexAll} disabled={reindexing}
                  style={{ padding:'7px 14px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'6px', color:'#a78bfa', fontSize:'11px', cursor:'pointer', fontWeight:'700' }}
                >
                  {reindexing ? '⏳ Indexing...' : '🔄 Reindex All'}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.md,.json" onChange={handleFileUpload} style={{ display:'none' }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ padding:'7px 14px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.25)', borderRadius:'6px', color:'#00e5a0', fontSize:'12px', cursor: uploading ? 'wait' : 'pointer', fontWeight:'700' }}
                >
                  {uploading ? '⏳ Uploading…' : '📎 Upload File'}
                </button>
                <button onClick={() => setAddSource(true)}
                  style={{ padding:'7px 14px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}
                >
                  + Add Source
                </button>
              </div>
            </div>

            <div style={{ flex:1, overflow:'auto', padding:'20px' }}>
              {/* RAG Search Test */}
              <div style={{ background:'rgba(0,229,160,.04)', border:'1px solid rgba(0,229,160,.1)', borderRadius:'8px', padding:'16px', marginBottom:'20px' }}>
                <div style={{ fontSize:'11px', color:'#00e5a0', fontWeight:'700', letterSpacing:'0.05em', marginBottom:'10px' }}>🔍 TEST RAG SEARCH</div>
                <div style={{ display:'flex', gap:'8px', marginBottom: searchResults ? '12px' : '0' }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Enter a test query to see what your AI will retrieve..."
                    style={{ flex:1, padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none' }}
                    onKeyDown={e => e.key === 'Enter' && search()}
                  />
                  <button onClick={search} disabled={searching}
                    style={{ padding:'8px 16px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', cursor:'pointer' }}
                  >
                    {searching ? '...' : 'Search'}
                  </button>
                </div>

                {searchResults && (
                  <div>
                    <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'8px' }}>{searchResults.count} chunks retrieved</div>
                    {searchResults.results.map((chunk, i) => (
                      <div key={i} style={{ background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', padding:'10px 12px', marginBottom:'6px', fontSize:'11px', color:'#94a3b8', lineHeight:'1.6' }}>
                        <span style={{ color:'#64748b', marginRight:'8px' }}>#{i+1}</span>
                        {chunk.slice(0, 300)}{chunk.length > 300 ? '...' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sources List */}
              <div style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', letterSpacing:'0.05em', marginBottom:'12px' }}>
                SOURCES ({(selected.sources || []).length})
              </div>

              {(selected.sources || []).length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#64748b' }}>
                  <div style={{ fontSize:'28px', marginBottom:'10px' }}>📄</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'6px' }}>No sources yet</div>
                  <div style={{ fontSize:'11px', marginBottom:'16px' }}>Add text, FAQs, product lists, or URLs to power your AI agents</div>
                  <button onClick={() => setAddSource(true)}
                    style={{ padding:'8px 16px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}
                  >
                    Add First Source
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {(selected.sources || []).map(src => (
                    <div key={src.id} style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ display:'flex', gap:'12px', alignItems:'center', flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'20px', flexShrink:0 }}>
                          {SOURCE_TYPES.find(t => t.id === src.type)?.emoji || '📄'}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:'600', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{src.name}</div>
                          <div style={{ fontSize:'10px', color:'#64748b', marginTop:'2px' }}>
                            {src.type} · {src.chunkCount} chunks · {src.lastIndexed ? `Last indexed ${new Date(src.lastIndexed).toLocaleDateString()}` : 'Not indexed'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:`${STATUS_COLORS[src.status]}18`, color:STATUS_COLORS[src.status], fontWeight:'700' }}>
                          {STATUS_LABELS[src.status] || src.status}
                        </span>
                        <button onClick={() => deleteSource(src.id)}
                          style={{ width:'24px', height:'24px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'4px', color:'#ef4444', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'#3d4f63' }}>
            <div style={{ fontSize:'40px', marginBottom:'14px' }}>🧠</div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#64748b', marginBottom:'6px' }}>Select or create a knowledge base</div>
            <div style={{ fontSize:'11px', color:'#3d4f63' }}>Your AI agents will draw from these sources when answering questions</div>
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {addSource && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'12px', padding:'24px', width:'500px', maxHeight:'80vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'15px', fontWeight:'800' }}>Add Knowledge Source</div>
              <button onClick={() => setAddSource(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'18px' }}>×</button>
            </div>

            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'8px', fontWeight:'700' }}>SOURCE TYPE</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'6px' }}>
                {SOURCE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSourceType(t.id)}
                    style={{ padding:'8px 6px', background: sourceType===t.id ? 'rgba(0,229,160,.08)' : '#0c0f1a', border:`1px solid ${sourceType===t.id ? 'rgba(0,229,160,.3)' : '#1a2235'}`, borderRadius:'6px', color: sourceType===t.id ? '#00e5a0' : '#64748b', fontSize:'10px', cursor:'pointer', fontWeight:'600' }}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:'10px', color:'#64748b', marginTop:'6px' }}>
                {SOURCE_TYPES.find(t => t.id === sourceType)?.hint}
              </div>
            </div>

            <div style={{ marginBottom:'12px' }}>
              <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>SOURCE NAME *</div>
              <input value={sourceName} onChange={e => setSourceName(e.target.value)}
                placeholder="e.g. FAQ - Appointment Booking"
                style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
              />
            </div>

            {sourceType === 'url' ? (
              <div style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>URL *</div>
                <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/about"
                  style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            ) : (
              <div style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>CONTENT *</div>
                <textarea value={sourceContent} onChange={e => setSourceContent(e.target.value)}
                  placeholder={sourceType === 'faq' ? 'Q: What are your opening hours?\nA: We are open 8am-8pm Saturday to Thursday.\n\nQ: Do you take walk-ins?\nA: Yes, but appointments are preferred.' : 'Paste your content here...'}
                  rows={8}
                  style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }}
                />
                <div style={{ fontSize:'9px', color:'#3d4f63', marginTop:'4px' }}>{sourceContent.length} characters · ~{Math.ceil(sourceContent.length / 1600)} pages</div>
              </div>
            )}

            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button onClick={() => setAddSource(false)}
                style={{ flex:1, padding:'10px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', cursor:'pointer', fontSize:'13px' }}
              >
                Cancel
              </button>
              <button onClick={saveSource} disabled={savingSource}
                style={{ flex:2, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', cursor:'pointer', fontSize:'13px' }}
              >
                {savingSource ? 'Saving & Indexing...' : '🧠 Add & Index Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
