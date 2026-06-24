'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STATUS_COLOR = {
  NEW: '#64748b', CONTACTED: '#3b82f6', QUALIFYING: '#f97316',
  QUALIFIED: '#00e5a0', PROPOSAL: '#8b5cf6', NEGOTIATION: '#fbbf24',
  WON: '#22c55e', LOST: '#ef4444', UNQUALIFIED: '#94a3b8', ACTIVE: '#00e5a0',
  INACTIVE: '#64748b',
}
const CHANNEL_ICON = { WHATSAPP: '💬', INSTAGRAM: '📸', EMAIL: '📧', TELEGRAM: '✈️', FACEBOOK: '👤' }
const ALL_STATUSES = ['NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']

function Avatar({ name, size = 48 }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const hue = name ? name.charCodeAt(0) * 7 % 360 : 200
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},60%,25%)`, border: `2px solid hsl(${hue},60%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '700', color: `hsl(${hue},60%,80%)`, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function Field({ label, value, onSave, type = 'text', options }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const save = async () => { await onSave?.(val); setEditing(false) }
  if (!onSave) return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: value ? '#e2e8f0' : '#64748b' }}>{value || '—'}</div>
    </div>
  )
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', gap: '6px' }}>
          {options ? (
            <select value={val} onChange={e => setVal(e.target.value)} style={{ flex: 1, background: '#0a0f1a', border: '1px solid #3b82f6', borderRadius: '5px', padding: '5px 8px', color: '#e2e8f0', fontSize: '13px' }}>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input value={val} onChange={e => setVal(e.target.value)} type={type} autoFocus
              style={{ flex: 1, background: '#0a0f1a', border: '1px solid #3b82f6', borderRadius: '5px', padding: '5px 8px', color: '#e2e8f0', fontSize: '13px' }}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }} />
          )}
          <button onClick={save} style={{ padding: '5px 10px', background: '#00e5a0', border: 'none', borderRadius: '5px', color: '#0a0f1a', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✓</button>
          <button onClick={() => { setVal(value || ''); setEditing(false) }} style={{ padding: '5px 8px', background: '#1a2235', border: 'none', borderRadius: '5px', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} style={{ fontSize: '13px', color: value ? '#e2e8f0' : '#64748b', cursor: 'pointer', padding: '5px 8px', borderRadius: '5px', border: '1px solid transparent', display: 'inline-block', minWidth: '80px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2235'; e.currentTarget.style.background = '#111622' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}>
          {value || <span style={{ fontStyle: 'italic', color: '#64748b' }}>Click to set</span>}
        </div>
      )}
    </div>
  )
}

function TimelineItem({ item }) {
  const icons = { note_added: '📝', workflow: '⚡', message_sent: '💬', lead_created: '👤', stage_changed: '🔄', status_changed: '🔄', call: '📞', email: '📧' }
  return (
    <div style={{ display: 'flex', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #0f1624' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a2235', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>
        {icons[item.type] || '•'}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{item.type.replace(/_/g, ' ')}</div>
        {item.data && typeof item.data === 'object' && Object.keys(item.data).length > 0 && (
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {Object.entries(item.data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
          {item.user?.name && <span>{item.user.name} · </span>}
          {new Date(item.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

export default function ContactDetailPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [showMsgBox, setShowMsgBox] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getContactProfile(id)
      setProfile(data)
    } catch { showToast('Failed to load contact', false) }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const updateField = async (field, value) => {
    try {
      await api.updateContact(id, { [field]: value })
      setProfile(p => ({ ...p, contact: { ...p.contact, [field]: value } }))
      showToast('Saved')
    } catch { showToast('Save failed', false) }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const note = await api.addContactNote(id, { content: noteText })
      setProfile(p => ({ ...p, notes: [{ ...note, author: { name: 'You' } }, ...p.notes] }))
      setNoteText('')
      showToast('Note added')
    } catch { showToast('Failed to add note', false) }
    setAddingNote(false)
  }

  const sendWhatsApp = async () => {
    if (!msgText.trim() || !profile?.contact?.phone) return
    setSendingMsg(true)
    try {
      await api.sendWhatsApp({ to: profile.contact.phone, message: msgText })
      setMsgText(''); setShowMsgBox(false)
      showToast('Message sent')
    } catch (e) { showToast(e.message || 'Send failed', false) }
    setSendingMsg(false)
  }

  const scoreContact = async () => {
    setScoring(true)
    setScoreResult(null)
    try {
      const result = await api.scoreLead(id)
      setScoreResult(result)
      setProfile(p => ({ ...p, contact: { ...p.contact, score: result.score } }))
      showToast(`Lead scored: ${result.score}/100`)
    } catch (e) { showToast(e.message || 'Scoring failed', false) }
    setScoring(false)
  }

  const deleteContact = async () => {
    if (!confirm(`Delete ${profile?.contact?.name}? This cannot be undone.`)) return
    setDeleting(true)
    await api.deleteContact(id).catch(() => {})
    window.location.href = '/contacts'
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="contacts" />
      <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b' }}>Loading contact...</div>
      </main>
    </div>
  )

  if (!profile) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="contacts" />
      <main style={{ flex: 1, padding: '32px', textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
        <div style={{ fontWeight: '700' }}>Contact not found</div>
        <a href="/contacts" style={{ color: '#3b82f6', fontSize: '13px' }}>← Back to contacts</a>
      </main>
    </div>
  )

  const { contact, conversations, activities, notes, campaignCount } = profile
  const statusColor = STATUS_COLOR[contact.status] || '#64748b'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="contacts" />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header strip */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #1a2235', background: '#0c0f1a' }}>
          <div style={{ marginBottom: '10px' }}>
            <a href="/contacts" style={{ color: '#64748b', fontSize: '12px', textDecoration: 'none' }}>← All Contacts</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Avatar name={contact.name} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{contact.name}</h1>
                <select
                  value={contact.status}
                  onChange={e => updateField('status', e.target.value)}
                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', fontWeight: '700', background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`, cursor: 'pointer' }}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {contact.tags?.map(t => (
                  <span key={t} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633' }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {contact.phone && <span>📱 {contact.phone}</span>}
                {contact.email && <span>📧 {contact.email}</span>}
                {contact.city && <span>📍 {contact.city}</span>}
                {contact.source && <span>🔗 {contact.source}</span>}
                <span>Joined {new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Score badge */}
              {contact.score != null && contact.score > 0 && (() => {
                const sc = contact.score
                const scoreColor = sc >= 80 ? '#22c55e' : sc >= 60 ? '#00e5a0' : sc >= 40 ? '#fbbf24' : sc >= 20 ? '#f97316' : '#ef4444'
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: scoreColor + '15', border: `1px solid ${scoreColor}40`, borderRadius: '20px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>AI Score</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: scoreColor }}>{sc}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>/100</span>
                  </div>
                )
              })()}
              <button onClick={scoreContact} disabled={scoring}
                style={{ padding: '8px 16px', background: scoring ? '#1a2235' : 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', borderRadius: '7px', color: '#8b5cf6', cursor: scoring ? 'default' : 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {scoring ? <><span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Scoring...</> : '🤖 Score Lead'}
              </button>
              {contact.phone && (
                <button onClick={() => setShowMsgBox(v => !v)}
                  style={{ padding: '8px 16px', background: '#25D36622', border: '1px solid #25D36633', borderRadius: '7px', color: '#25D366', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  💬 WhatsApp
                </button>
              )}
              <button onClick={deleteContact} disabled={deleting}
                style={{ padding: '8px 14px', background: '#ef444411', border: '1px solid #ef444433', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
                Delete
              </button>
            </div>
          </div>

          {/* AI Score result panel */}
          {scoreResult && (
            <div style={{ marginTop: '14px', padding: '14px 16px', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {(() => {
                const sc = scoreResult.score
                const scoreColor = sc >= 80 ? '#22c55e' : sc >= 60 ? '#00e5a0' : sc >= 40 ? '#fbbf24' : sc >= 20 ? '#f97316' : '#ef4444'
                return (
                  <>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '36px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{sc}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>/100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>🤖 AI Analysis</div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '6px' }}>{scoreResult.reasoning}</div>
                      <div style={{ fontSize: '12px', color: '#8b5cf6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>→</span><strong>Next step:</strong> {scoreResult.recommended_action}
                      </div>
                    </div>
                    <button onClick={() => setScoreResult(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0 }}>×</button>
                  </>
                )
              })()}
            </div>
          )}

          {/* Quick WhatsApp send box */}
          {showMsgBox && (
            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder={`Message to ${contact.name}...`}
                onKeyDown={e => e.key === 'Enter' && sendWhatsApp()}
                style={{ flex: 1, background: '#0a0f1a', border: '1px solid #25D36644', borderRadius: '7px', padding: '9px 14px', color: '#e2e8f0', fontSize: '13px' }} />
              <button onClick={sendWhatsApp} disabled={sendingMsg}
                style={{ padding: '9px 18px', background: '#25D366', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                {sendingMsg ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #1a2235', padding: '0 28px', background: '#0c0f1a' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'conversations', label: `Conversations (${conversations.length})` },
            { id: 'activities', label: `Activity (${activities.length})` },
            { id: 'notes', label: `Notes (${notes.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#00e5a0' : 'transparent'}`,
              color: tab === t.id ? '#00e5a0' : '#64748b', cursor: 'pointer', fontWeight: tab === t.id ? '700' : '500', fontSize: '13px',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', flex: 1, overflow: 'auto' }}>

          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
              {/* Contact details */}
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '16px', color: '#94a3b8' }}>CONTACT DETAILS</div>
                <Field label="Full Name" value={contact.name} onSave={v => updateField('name', v)} />
                <Field label="Phone" value={contact.phone} onSave={v => updateField('phone', v)} type="tel" />
                <Field label="Email" value={contact.email} onSave={v => updateField('email', v)} type="email" />
                <Field label="City" value={contact.city} onSave={v => updateField('city', v)} />
                <Field label="Country" value={contact.country} onSave={v => updateField('country', v)} />
                <Field label="Language" value={contact.language} onSave={v => updateField('language', v)} />
                <Field label="Notes" value={contact.notes} onSave={v => updateField('notes', v)} />
              </div>

              {/* CRM details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '16px', color: '#94a3b8' }}>CRM DATA</div>
                  <Field label="Source" value={contact.source} onSave={v => updateField('source', v)} options={['whatsapp', 'instagram', 'web', 'referral', 'manual', 'import']} />
                  <Field label="Stage" value={contact.stage} onSave={v => updateField('stage', v)} />
                  <Field label="Score" value={contact.score?.toString()} onSave={v => updateField('score', parseInt(v) || 0)} type="number" />
                  <Field label="Value (QAR)" value={contact.value?.toString()} onSave={v => updateField('value', parseFloat(v) || null)} type="number" />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Conversations', value: conversations.length, color: '#3b82f6' },
                    { label: 'Activities', value: activities.length, color: '#8b5cf6' },
                    { label: 'Notes', value: notes.length, color: '#00e5a0' },
                    { label: 'Campaigns', value: campaignCount, color: '#fbbf24' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversations */}
          {tab === 'conversations' && (
            <div style={{ maxWidth: '700px' }}>
              {conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                  No conversations yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {conversations.map(c => (
                    <a key={c.id} href={`/inbox?conv=${c.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f644'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2235'}>
                        <span style={{ fontSize: '20px' }}>{CHANNEL_ICON[c.channel?.type] || '💬'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{c.channel?.name || 'Channel'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.lastMsgAt ? new Date(c.lastMsgAt).toLocaleString() : 'No messages yet'}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: c.status === 'OPEN' ? '#00e5a022' : '#1a2235', color: c.status === 'OPEN' ? '#00e5a0' : '#64748b', fontWeight: '700' }}>{c.status}</span>
                        <span style={{ color: '#64748b', fontSize: '16px' }}>›</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          {tab === 'activities' && (
            <div style={{ maxWidth: '600px' }}>
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                  No activity yet
                </div>
              ) : (
                <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                  {activities.map((a, i) => (
                    <TimelineItem key={a.id} item={a} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div style={{ maxWidth: '640px' }}>
              {/* Add note */}
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <textarea
                  value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder={`Add a note about ${contact.name}...`}
                  rows={3}
                  style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '7px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }}
                />
                <button onClick={addNote} disabled={addingNote || !noteText.trim()}
                  style={{ padding: '8px 18px', background: noteText.trim() ? '#00e5a0' : '#1a2235', border: 'none', borderRadius: '6px', color: noteText.trim() ? '#0a0f1a' : '#64748b', cursor: noteText.trim() ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px' }}>
                  {addingNote ? 'Saving...' : '+ Add Note'}
                </button>
              </div>

              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>No notes yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.map(n => (
                    <div key={n.id} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{n.content}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {n.author?.name} · {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px', background: toast.ok ? '#00e5a0' : '#ef4444', color: toast.ok ? '#0a0f1a' : '#fff', fontWeight: '700', fontSize: '14px', zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
