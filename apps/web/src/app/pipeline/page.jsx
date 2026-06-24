'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STAGES = [
  { key: 'NEW',          label: 'New Leads',      color: '#64748b', emoji: '✨' },
  { key: 'CONTACTED',    label: 'Contacted',       color: '#3b82f6', emoji: '📞' },
  { key: 'QUALIFYING',   label: 'Qualifying',      color: '#f97316', emoji: '🔍' },
  { key: 'QUALIFIED',    label: 'Qualified',       color: '#00e5a0', emoji: '✅' },
  { key: 'PROPOSAL',     label: 'Proposal Sent',   color: '#8b5cf6', emoji: '📄' },
  { key: 'NEGOTIATION',  label: 'Negotiation',     color: '#fbbf24', emoji: '🤝' },
  { key: 'WON',          label: 'Won',             color: '#22c55e', emoji: '🏆' },
  { key: 'LOST',         label: 'Lost',            color: '#ef4444', emoji: '❌' },
]

const SOURCE_ICON = { whatsapp: '💬', instagram: '📸', web: '🌐', referral: '👥', manual: '✏️', import: '📊', email: '📧', facebook: '👤' }

function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const hue = name ? name.charCodeAt(0) * 7 % 360 : 200
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},55%,22%)`, border: `1.5px solid hsl(${hue},55%,38%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: '700', color: `hsl(${hue},55%,75%)`, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function ContactCard({ contact, onDragStart, onClick, isDragging }) {
  const stage = STAGES.find(s => s.key === contact.status)
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(contact) }}
      onClick={() => onClick(contact)}
      style={{
        background: isDragging ? '#1a2235' : '#111622',
        border: '1px solid #1a2235',
        borderRadius: '8px', padding: '12px', cursor: 'grab', userSelect: 'none',
        opacity: isDragging ? 0.4 : 1,
        transition: 'box-shadow 0.15s, opacity 0.15s',
        boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => { if (!isDragging) { e.currentTarget.style.borderColor = '#253045'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2235'; e.currentTarget.style.boxShadow = isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.3)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Avatar name={contact.name} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.phone || contact.email || '—'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {contact.source && (
          <span style={{ fontSize: '11px', color: '#94a3b8' }} title={contact.source}>{SOURCE_ICON[contact.source] || '🔗'}</span>
        )}
        {contact.value > 0 && (
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#00e5a0' }}>
            {parseFloat(contact.value).toLocaleString('en-QA', { style: 'currency', currency: contact.currency || 'QAR', minimumFractionDigits: 0 })}
          </span>
        )}
        {contact.score > 0 && (
          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: contact.score > 70 ? '#00e5a022' : contact.score > 40 ? '#fbbf2422' : '#1a2235', color: contact.score > 70 ? '#00e5a0' : contact.score > 40 ? '#fbbf24' : '#64748b', fontWeight: '700' }}>
            {contact.score}pts
          </span>
        )}
        {contact.tags?.slice(0, 2).map(t => (
          <span key={t} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: '#3b82f622', color: '#3b82f6' }}>{t}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569' }}>
          {new Date(contact.updatedAt || contact.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

function PipelineColumn({ stage, contacts, onDrop, onDragStart, draggingId, onCardClick }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const totalValue = contacts.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0)

  return (
    <div
      style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(stage.key) }}>

      {/* Column header */}
      <div style={{
        padding: '10px 12px', borderRadius: '8px 8px 0 0',
        background: isDragOver ? stage.color + '22' : '#111622',
        border: `1px solid ${isDragOver ? stage.color + '55' : '#1a2235'}`,
        borderBottom: 'none', transition: 'all 0.15s', marginBottom: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px' }}>{stage.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: stage.color }}>{stage.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', color: '#fff', background: stage.color + '44', border: `1px solid ${stage.color}55`, borderRadius: '12px', padding: '1px 7px', minWidth: '22px', textAlign: 'center' }}>
            {contacts.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {totalValue.toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 })}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px',
        background: isDragOver ? stage.color + '08' : '#0c0f1a',
        border: `1px solid ${isDragOver ? stage.color + '44' : '#1a2235'}`,
        borderTop: 'none', borderRadius: '0 0 8px 8px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        minHeight: '120px', transition: 'all 0.15s',
      }}>
        {isDragOver && contacts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: stage.color, fontSize: '12px', fontWeight: '600', border: `2px dashed ${stage.color}44`, borderRadius: '6px' }}>
            Drop here
          </div>
        )}
        {contacts.map(c => (
          <ContactCard
            key={c.id}
            contact={c}
            onDragStart={onDragStart}
            onClick={onCardClick}
            isDragging={draggingId === c.id}
          />
        ))}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingContact, setDraggingContact] = useState(null)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [toast, setToast] = useState(null)
  const [totalValue, setTotalValue] = useState(0)
  const [winRate, setWinRate] = useState(0)

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    setLoading(true)
    const all = await api.getPipelineContacts().catch(() => [])
    setContacts(Array.isArray(all) ? all : [])
    const won = all.filter(c => c.status === 'WON').length
    const closed = all.filter(c => c.status === 'WON' || c.status === 'LOST').length
    setWinRate(closed > 0 ? Math.round((won / closed) * 100) : 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.phone?.includes(search)) return false
    if (filterSource && c.source !== filterSource) return false
    return true
  })

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = filtered.filter(c => c.status === s.key)
    return acc
  }, {})

  const handleDrop = useCallback(async (targetStatus) => {
    if (!draggingContact || draggingContact.status === targetStatus) {
      setDraggingContact(null)
      return
    }
    const oldStatus = draggingContact.status
    // Optimistic update
    setContacts(prev => prev.map(c => c.id === draggingContact.id ? { ...c, status: targetStatus } : c))
    setDraggingContact(null)
    try {
      await api.updateContact(draggingContact.id, { status: targetStatus })
      showToast(`Moved to ${STAGES.find(s => s.key === targetStatus)?.label}`)
    } catch (e) {
      // Rollback
      setContacts(prev => prev.map(c => c.id === draggingContact.id ? { ...c, status: oldStatus } : c))
      showToast('Move failed', false)
    }
  }, [draggingContact])

  const wonValue = contacts.filter(c => c.status === 'WON').reduce((s, c) => s + (parseFloat(c.value) || 0), 0)
  const pipelineValue = contacts.filter(c => !['WON', 'LOST'].includes(c.status)).reduce((s, c) => s + (parseFloat(c.value) || 0), 0)

  const sources = [...new Set(contacts.map(c => c.source).filter(Boolean))]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="pipeline" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a2235', background: '#0c0f1a', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Sales Pipeline</h1>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {contacts.length} contacts · Drag cards between stages to update status
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href="/contacts" style={{ padding: '8px 14px', background: '#1a2235', border: '1px solid #253045', borderRadius: '7px', color: '#94a3b8', fontSize: '13px', textDecoration: 'none', display: 'inline-block' }}>
                ☰ List View
              </a>
              <a href="/contacts/import" style={{ padding: '8px 14px', background: '#1a2235', border: '1px solid #253045', borderRadius: '7px', color: '#94a3b8', fontSize: '13px', textDecoration: 'none', display: 'inline-block' }}>
                📊 Import
              </a>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label: 'Pipeline Value', value: pipelineValue.toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 }), color: '#3b82f6' },
              { label: 'Won Value', value: wonValue.toLocaleString('en-QA', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 }), color: '#22c55e' },
              { label: 'Win Rate', value: `${winRate}%`, color: '#00e5a0' },
              { label: 'Total Contacts', value: contacts.length, color: '#64748b' },
            ].map(k => (
              <div key={k.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '7px', padding: '8px 14px', minWidth: '120px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 12px', color: '#e2e8f0', fontSize: '12px', width: '200px' }}
            />
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 12px', color: filterSource ? '#e2e8f0' : '#64748b', fontSize: '12px' }}>
              <option value="">All sources</option>
              {sources.map(s => <option key={s} value={s}>{SOURCE_ICON[s] || '🔗'} {s}</option>)}
            </select>
            {(search || filterSource) && (
              <button onClick={() => { setSearch(''); setFilterSource('') }}
                style={{ padding: '7px 12px', background: '#ef444422', border: '1px solid #ef444433', borderRadius: '6px', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
                ✕ Clear
              </button>
            )}
            {(search || filterSource) && (
              <div style={{ padding: '7px 12px', color: '#64748b', fontSize: '12px', alignSelf: 'center' }}>
                {filtered.length} of {contacts.length} contacts
              </div>
            )}
          </div>
        </div>

        {/* Kanban board */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Loading pipeline...
          </div>
        ) : (
          <div
            style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
            onDragEnd={() => setDraggingContact(null)}>
            {STAGES.map(stage => (
              <PipelineColumn
                key={stage.key}
                stage={stage}
                contacts={byStage[stage.key] || []}
                onDrop={handleDrop}
                onDragStart={c => setDraggingContact(c)}
                draggingId={draggingContact?.id}
                onCardClick={c => c.id && window.location.assign(`/contacts/${c.id}`)}
              />
            ))}
          </div>
        )}

        {toast && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px', background: toast.ok ? '#00e5a0' : '#ef4444', color: toast.ok ? '#0a0f1a' : '#fff', fontWeight: '700', fontSize: '14px', zIndex: 9999 }}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}
