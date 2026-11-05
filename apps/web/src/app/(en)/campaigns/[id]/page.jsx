'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const STATUS_COLOR = {
  DRAFT: '#64748b', SCHEDULED: '#3b82f6', RUNNING: '#D8B16A',
  PAUSED: '#fbbf24', COMPLETED: '#8b5cf6', FAILED: '#ef4444',
}
const STATUS_ICON = { DRAFT: '✏️', SCHEDULED: '🕐', RUNNING: '▶', PAUSED: '⏸', COMPLETED: '✓', FAILED: '✗' }

function StatBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: '6px', background: '#1a2235', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function RateCard({ label, rate, color }) {
  return (
    <div style={{ background: '#0a0f1a', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color }}>{rate}%</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{label}</div>
    </div>
  )
}

export default function CampaignDetailPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [contacts, setContacts] = useState([])
  const [contactTotal, setContactTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('overview') // overview | contacts | schedule
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [addingFilter, setAddingFilter] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const pollRef = useRef(null)

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    const [camp, ana, cont] = await Promise.all([
      api.getCampaign(id),
      api.getCampaignAnalytics(id),
      api.getCampaignContacts(id, { limit: 50 }),
    ])
    setCampaign(camp)
    setAnalytics(ana)
    setContacts(cont.data || [])
    setContactTotal(cont.total || 0)
    setLoading(false)
  }

  useEffect(() => {
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  // Poll stats every 3s while running
  useEffect(() => {
    if (campaign?.status === 'RUNNING') {
      pollRef.current = setInterval(() => {
        api.getCampaignAnalytics(id).then(setAnalytics).catch(() => {})
        api.getCampaign(id).then(setCampaign).catch(() => {})
      }, 3000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [campaign?.status])

  const doAction = async (action, fn) => {
    setActionLoading(action)
    try {
      await fn()
      await load()
      showToast(`Campaign ${action}ed`)
    } catch (e) {
      showToast(e.message || `${action} failed`, false)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddByFilter = async () => {
    setAddingFilter(true)
    try {
      const r = await api.addContactsByFilter(id, { status: filterStatus || undefined, source: filterSource || undefined })
      showToast(`Added ${r.added} contacts (${r.total} total)`)
      load()
    } catch (e) { showToast(e.message || 'Failed', false) }
    finally { setAddingFilter(false) }
  }

  const handleSchedule = async () => {
    if (!scheduleTime) return
    try {
      await api.scheduleCampaign(id, { scheduledAt: scheduleTime })
      showToast('Campaign scheduled')
      load()
    } catch (e) { showToast(e.message || 'Failed', false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="campaigns" />
      <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b' }}>Loading campaign...</div>
      </main>
    </div>
  )

  if (!campaign) return null

  const status = campaign.status
  const stats = analytics?.stats || {}
  const isRunning = status === 'RUNNING'
  const isPaused = status === 'PAUSED'
  const isDraft = status === 'DRAFT' || status === 'SCHEDULED'
  const isComplete = status === 'COMPLETED'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="campaigns" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '6px' }}>
          <a href="/campaigns" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Campaigns</a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>{campaign.name}</h1>
              <span style={{
                fontSize: '11px', padding: '3px 9px', borderRadius: '5px', fontWeight: '800',
                background: STATUS_COLOR[status] + '22', color: STATUS_COLOR[status],
              }}>{STATUS_ICON[status]} {status}</span>
              {isRunning && <span style={{ fontSize: '11px', color: '#D8B16A', animation: 'pulse 1.5s infinite' }}>● LIVE</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {campaign.scheduledAt && <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()} · </span>}
              {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleString()} · </span>}
              <span>{stats.total || 0} recipients</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isDraft && (
              <button onClick={() => doAction('launch', () => api.launchCampaign(id))}
                disabled={actionLoading === 'launch'}
                style={{ padding: '10px 20px', background: '#D8B16A', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                {actionLoading === 'launch' ? 'Launching...' : '▶ Launch Now'}
              </button>
            )}
            {isRunning && (
              <button onClick={() => doAction('pause', () => api.pauseCampaign(id))}
                style={{ padding: '10px 20px', background: '#fbbf2422', color: '#fbbf24', border: '1px solid #fbbf2433', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                {actionLoading === 'pause' ? '...' : '⏸ Pause'}
              </button>
            )}
            {isPaused && (
              <button onClick={() => doAction('resume', () => api.resumeCampaign(id))}
                style={{ padding: '10px 20px', background: '#D8B16A', color: '#0a0f1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                {actionLoading === 'resume' ? '...' : '▶ Resume'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[{ id: 'overview', label: '📊 Overview' }, { id: 'contacts', label: `👥 Recipients (${stats.total || 0})` }, { id: 'message', label: '💬 Message' }, { id: 'schedule', label: '🕐 Schedule' }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: view === t.id ? '#D8B16A' : '#1a2235', color: view === t.id ? '#0a0f1a' : '#94a3b8',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {view === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Delivery funnel */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Delivery Funnel</div>
              <StatBar label="Total Recipients" value={stats.total || 0} max={stats.total || 1} color="#64748b" />
              <StatBar label="Sent" value={stats.sent || 0} max={stats.total || 1} color="#3b82f6" />
              <StatBar label="Delivered" value={stats.delivered || 0} max={stats.total || 1} color="#D8B16A" />
              <StatBar label="Read" value={stats.read || 0} max={stats.total || 1} color="#8b5cf6" />
              {stats.failedCount > 0 && <StatBar label="Failed" value={stats.failedCount} max={stats.total || 1} color="#ef4444" />}
            </div>

            {/* Rate cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px' }}>Performance</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <RateCard label="Delivery Rate" rate={stats.deliveryRate || 0} color="#D8B16A" />
                  <RateCard label="Read Rate" rate={stats.readRate || 0} color="#8b5cf6" />
                </div>
              </div>

              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Progress</div>
                {isRunning && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ height: '8px', background: '#1a2235', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #D8B16A, #3b82f6)',
                        width: `${stats.total > 0 ? Math.round(((stats.sentCount || 0) / stats.total) * 100) : 0}%`,
                        transition: 'width 1s',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {stats.sentCount || 0} / {stats.total || 0} sent
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Pending: {stats.pendingCount || 0}</span>
                  <span>Sent: {stats.sentCount || 0}</span>
                  <span>Failed: {stats.failedCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipients */}
        {view === 'contacts' && (
          <div>
            {isDraft && (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Add Recipients by Segment</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      style={{ background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px' }}>
                      <option value="">All statuses</option>
                      {['NEW', 'ACTIVE', 'QUALIFIED', 'CONVERTED', 'LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Source</label>
                    <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                      style={{ background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px' }}>
                      <option value="">All sources</option>
                      {['whatsapp', 'instagram', 'web', 'manual', 'import'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddByFilter} disabled={addingFilter}
                    style={{ padding: '9px 18px', background: addingFilter ? '#1a2235' : '#D8B16A', color: addingFilter ? '#64748b' : '#0a0f1a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                    {addingFilter ? 'Adding...' : '+ Add Matching Contacts'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '13px' }}>
                {contactTotal.toLocaleString()} Recipients
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a2235' }}>
                    {['Name', 'Phone', 'Status', 'Sent At'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No recipients yet. Use the segment filter above to add contacts.</td></tr>
                  ) : contacts.map((cc, i) => (
                    <tr key={cc.id} style={{ borderBottom: i < contacts.length - 1 ? '1px solid #0f1624' : 'none' }}>
                      <td style={{ padding: '10px 16px', color: '#e2e8f0' }}>{cc.contact?.name}</td>
                      <td style={{ padding: '10px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{cc.contact?.phone}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: '700',
                          background: cc.status === 'sent' ? '#3b82f622' : cc.status === 'failed' ? '#ef444422' : '#1a2235',
                          color: cc.status === 'sent' ? '#3b82f6' : cc.status === 'failed' ? '#ef4444' : '#64748b',
                        }}>{cc.status}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px' }}>
                        {cc.sentAt ? new Date(cc.sentAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message */}
        {view === 'message' && (
          <div style={{ maxWidth: '560px' }}>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px' }}>
              <div style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Campaign Message</div>
              <div style={{ background: '#0a0f1a', borderRadius: '10px', padding: '16px 20px', border: '1px solid #1a2235', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#25D366', fontWeight: '700', marginBottom: '8px' }}>💬 WhatsApp Preview</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{campaign.message}</div>
              </div>
              {isDraft && (
                <textarea
                  defaultValue={campaign.message}
                  onBlur={e => api.updateCampaign(id, { message: e.target.value }).then(() => showToast('Message saved'))}
                  rows={5}
                  style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '12px', color: '#e2e8f0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Schedule */}
        {view === 'schedule' && (
          <div style={{ maxWidth: '480px' }}>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px' }}>
              <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px' }}>Schedule Campaign</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                Schedule this campaign to send automatically at a future date and time. Once scheduled, it will launch without manual intervention.
              </div>
              {campaign.scheduledAt && (
                <div style={{ padding: '10px 14px', background: '#3b82f622', borderRadius: '6px', color: '#3b82f6', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }}>
                  Currently scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <button onClick={handleSchedule} disabled={!scheduleTime}
                  style={{ padding: '10px 20px', background: scheduleTime ? '#3b82f6' : '#1a2235', color: scheduleTime ? '#fff' : '#64748b', border: 'none', borderRadius: '6px', cursor: scheduleTime ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '8px',
            background: toast.ok ? '#D8B16A' : '#ef4444', color: toast.ok ? '#0a0f1a' : '#fff',
            fontWeight: '700', fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>{toast.msg}</div>
        )}
      </main>
    </div>
  )
}
