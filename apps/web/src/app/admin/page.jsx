'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const PLAN_COLORS = { STARTER:'#3b82f6', GROWTH:'#00e5a0', ENTERPRISE:'#a78bfa', SUSPENDED:'#ef4444' }
const PLAN_LABELS = { STARTER:'Starter', GROWTH:'Growth', ENTERPRISE:'Enterprise', SUSPENDED:'Suspended' }

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'8px', padding:'16px', minWidth:'140px' }}>
      <div style={{ fontSize:'22px', marginBottom:'6px' }}>{icon}</div>
      <div style={{ fontSize:'22px', fontWeight:'800', color: color || '#e2e8f0' }}>{value ?? '—'}</div>
      <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{label}</div>
    </div>
  )
}

function EmailTestPanel() {
  const [to, setTo] = useState('')
  const [template, setTemplate] = useState('welcome')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const send = async () => {
    if (!to) return
    setSending(true)
    try {
      const r = await api.testEmail({ to, template })
      setResult({ ok: true, msg: `Sent "${template}" to ${to}` })
    } catch (e) {
      setResult({ ok: false, msg: e.message || 'Failed' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ paddingTop: '8px', maxWidth: '560px' }}>
      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>📧 Email System</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
        Powered by Postmark. Set <code style={{ background: '#1a2235', padding: '1px 5px', borderRadius: '3px', color: '#00e5a0' }}>POSTMARK_SERVER_TOKEN</code> in GCP Secret Manager to activate. Without it, emails are logged to console only.
      </div>

      <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px' }}>
        <div style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px' }}>Send Test Email</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient email address"
            style={{ background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px' }} />
          <select value={template} onChange={e => setTemplate(e.target.value)}
            style={{ background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px' }}>
            <option value="welcome">Welcome Email</option>
            <option value="passwordReset">Password Reset</option>
            <option value="invite">Team Invitation</option>
            <option value="billing">Subscription Confirmed</option>
            <option value="all">All Templates (4 emails)</option>
          </select>
          <button onClick={send} disabled={sending || !to} style={{
            padding: '10px 20px', background: sending || !to ? '#1a2235' : '#00e5a0',
            color: sending || !to ? '#64748b' : '#0a0f1a', border: 'none', borderRadius: '6px', cursor: sending || !to ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px',
          }}>{sending ? 'Sending...' : 'Send Test'}</button>
          {result && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', background: result.ok ? '#00e5a022' : '#ef444422', color: result.ok ? '#00e5a0' : '#ef4444', fontSize: '13px', fontWeight: '600' }}>
              {result.ok ? '✓' : '✗'} {result.msg}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '13px' }}>Templates Available</div>
        {[
          { name: 'Welcome Email', trigger: 'User registers', tag: 'welcome' },
          { name: 'Password Reset', trigger: 'Forgot password flow', tag: 'password-reset' },
          { name: 'Team Invitation', trigger: 'User invite', tag: 'invite' },
          { name: 'Subscription Confirmed', trigger: 'Checkout success', tag: 'billing' },
          { name: 'Subscription Cancelled', trigger: 'Paddle cancellation webhook', tag: 'billing' },
          { name: 'Payment Failed', trigger: 'Stripe invoice.payment_failed', tag: 'billing' },
          { name: 'Agency Client Invite', trigger: 'Agency creates client org', tag: 'agency' },
          { name: 'AI Agent Alert', trigger: 'Agent error / escalation', tag: 'ai-alert' },
        ].map((t, i, arr) => (
          <div key={t.name} style={{ padding: '11px 18px', borderBottom: i < arr.length - 1 ? '1px solid #0f1624' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{t.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{t.trigger}</div>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#00e5a022', color: '#00e5a0', fontWeight: '700' }}>{t.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MasterAdminPanel() {
  const [stats, setStats] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrg, setNewOrg] = useState({ name:'', slug:'', industry:'Healthcare', country:'QA', adminName:'', adminEmail:'' })
  const [tab, setTab] = useState('orgs') // orgs | audit | settings

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getMasterStats(),
      api.getMasterOrgs({ search, plan: planFilter, page, limit: 15 }),
    ]).then(([s, o]) => {
      setStats(s)
      setOrgs(o.data || [])
      setTotal(o.total || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, planFilter, page])

  const createOrg = async () => {
    if (!newOrg.name || !newOrg.slug || !newOrg.adminEmail) return alert('Name, slug, and admin email required')
    setCreating(true)
    try {
      const res = await api.createMasterOrg(newOrg)
      alert(`✅ Organization created!\nAdmin login: ${newOrg.adminEmail}\nTemp password: ${res.tempPassword}`)
      setShowCreate(false)
      setNewOrg({ name:'', slug:'', industry:'Healthcare', country:'QA', adminName:'', adminEmail:'' })
      load()
    } catch (err) {
      alert('❌ ' + (err.message || 'Failed to create'))
    } finally {
      setCreating(false)
    }
  }

  const suspendOrg = async (orgId) => {
    if (!confirm('Suspend this organization?')) return
    try {
      await api.suspendMasterOrg(orgId)
      load()
    } catch (err) {
      alert('❌ ' + err.message)
    }
  }

  const loadOrgDetails = async (org) => {
    try {
      const details = await api.getMasterOrg(org.id)
      setSelected(details)
    } catch {}
  }

  const totalPages = Math.ceil(total / 15)

  return (
    <div style={{ display:'flex', height:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif' }}>
      <NavSidebar />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#a78bfa' }}></div>
              <span style={{ fontSize:'13px', color:'#a78bfa', fontWeight:'700', letterSpacing:'0.05em' }}>MASTER ADMIN</span>
            </div>
            <div style={{ fontSize:'20px', fontWeight:'800', marginTop:'2px' }}>Platform Control Center</div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding:'8px 16px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'13px', cursor:'pointer' }}
          >
            + New Organization
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ padding:'0 24px', borderBottom:'1px solid #1a2235', display:'flex', gap:'0', flexShrink:0 }}>
          {[
            { id:'orgs', label:'Organizations' },
            { id:'flags', label:'🚩 Feature Flags' },
            { id:'ai', label:'🔭 AI Observability' },
            { id:'health', label:'💚 Customer Health' },
            { id:'quality', label:'⭐ AI Quality' },
            { id:'audit', label:'📋 Audit Log' },
            { id:'email', label:'📧 Email' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ padding:'12px 20px', background:'none', border:'none', borderBottom: tab===t.id ? '2px solid #00e5a0' : '2px solid transparent', color: tab===t.id ? '#e2e8f0' : '#64748b', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'20px 24px' }}>
          {/* Stats Row */}
          {stats && (
            <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
              <StatCard label="Total Orgs" value={stats.totalOrgs} icon="🏢" color="#00e5a0" />
              <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="#3b82f6" />
              <StatCard label="Total Contacts" value={stats.totalContacts} icon="📇" color="#a78bfa" />
              <StatCard label="Total Messages" value={stats.totalMessages?.toLocaleString()} icon="💬" color="#f97316" />
              <StatCard label="Total Campaigns" value={stats.totalCampaigns} icon="📣" color="#fbbf24" />
            </div>
          )}

          {tab === 'orgs' && (
            <>
              {/* Search + Filter */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search organizations..."
                  style={{ flex:1, minWidth:'200px', padding:'8px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none' }}
                />
                <select
                  value={planFilter}
                  onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
                  style={{ padding:'8px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', cursor:'pointer' }}
                >
                  <option value="">All Plans</option>
                  <option value="STARTER">Starter</option>
                  <option value="GROWTH">Growth</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Orgs Table */}
              <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'8px', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 80px 80px 80px 120px', padding:'10px 16px', background:'#0c0f1a', fontSize:'10px', color:'#64748b', fontWeight:'700', letterSpacing:'0.05em' }}>
                  <div>ORGANIZATION</div>
                  <div>PLAN</div>
                  <div>USERS</div>
                  <div>CONTACTS</div>
                  <div>CONVS</div>
                  <div>CAMPAIGNS</div>
                  <div>ACTIONS</div>
                </div>
                {loading ? (
                  <div style={{ padding:'40px', textAlign:'center', color:'#64748b' }}>Loading...</div>
                ) : orgs.length === 0 ? (
                  <div style={{ padding:'40px', textAlign:'center', color:'#64748b' }}>No organizations found</div>
                ) : orgs.map((org, i) => (
                  <div
                    key={org.id}
                    style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 80px 80px 80px 120px', padding:'12px 16px', borderTop:'1px solid #1a2235', alignItems:'center', cursor:'pointer', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.01)' }}
                    onClick={() => loadOrgDetails(org)}
                  >
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'13px' }}>{org.name}</div>
                      <div style={{ fontSize:'10px', color:'#64748b', marginTop:'1px' }}>{org.slug} · {org.country}</div>
                    </div>
                    <div>
                      <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'3px', background: `${PLAN_COLORS[org.plan]}20`, color: PLAN_COLORS[org.plan], fontWeight:'700' }}>
                        {PLAN_LABELS[org.plan] || org.plan}
                      </span>
                    </div>
                    <div style={{ fontSize:'13px', color:'#e2e8f0' }}>{org._count?.users}</div>
                    <div style={{ fontSize:'13px', color:'#e2e8f0' }}>{org._count?.contacts}</div>
                    <div style={{ fontSize:'13px', color:'#e2e8f0' }}>{org._count?.conversations}</div>
                    <div style={{ fontSize:'13px', color:'#e2e8f0' }}>{org._count?.campaigns}</div>
                    <div style={{ display:'flex', gap:'6px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => loadOrgDetails(org)}
                        style={{ padding:'4px 8px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'4px', color:'#3b82f6', fontSize:'10px', cursor:'pointer', fontWeight:'600' }}
                      >
                        View
                      </button>
                      {org.plan !== 'SUSPENDED' && (
                        <button
                          onClick={() => suspendOrg(org.id)}
                          style={{ padding:'4px 8px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'4px', color:'#ef4444', fontSize:'10px', cursor:'pointer', fontWeight:'600' }}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'16px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page === 1}
                    style={{ padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color: page===1 ? '#1a2235' : '#e2e8f0', cursor: page===1 ? 'default' : 'pointer', fontSize:'12px' }}
                  >
                    ← Prev
                  </button>
                  <span style={{ padding:'6px 12px', fontSize:'12px', color:'#64748b' }}>
                    Page {page} of {totalPages} ({total} orgs)
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p+1))}
                    disabled={page === totalPages}
                    style={{ padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color: page===totalPages ? '#1a2235' : '#e2e8f0', cursor: page===totalPages ? 'default' : 'pointer', fontSize:'12px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'audit' && (
            <AuditLogTab />
          )}

          {tab === 'ai' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>AI Observability</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Track AI cost, latency, provider usage, and quality across all orgs.</div>
                </div>
                <a href="/admin/ai-observability" style={{ padding: '8px 16px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  Open Dashboard →
                </a>
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Click "Open Dashboard" to see full AI metrics: cost per provider, tokens, latency, escalation rates, and recent calls.
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>Audit Dashboard</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Complete append-only audit trail — auth, user, AI, billing, admin, and security events.</div>
                </div>
                <a href="/admin/audit" style={{ padding: '8px 16px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  Open Log →
                </a>
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Click "Open Log" to view the full audit stream with search, filtering by org, action, and time.
              </div>
            </div>
          )}

          {tab === 'quality' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>AI Quality Engine</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Success rate, escalation rate, user feedback, and model performance — graded A–F.</div>
                </div>
                <a href="/admin/ai-quality" style={{ padding: '8px 16px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  Open Dashboard →
                </a>
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Click "Open Dashboard" to view AI quality scores by module, model, and organization.
              </div>
            </div>
          )}

          {tab === 'health' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>Customer Health Engine</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Engagement, adoption, automation and AI scores per org — identify churn risk early.</div>
                </div>
                <a href="/admin/customer-health" style={{ padding: '8px 16px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  Open Dashboard →
                </a>
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Click "Open Dashboard" to view health scores, churn risk, and signals for every organization.
              </div>
            </div>
          )}

          {tab === 'flags' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>Feature Flags</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Control platform features globally. Changes take effect within 30s.</div>
                </div>
                <a href="/admin/feature-flags" style={{ padding: '8px 16px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  Open Full Editor →
                </a>
              </div>
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Click "Open Full Editor" to manage all {'{18}'} feature flags with toggle controls, plan gating, and beta settings.
              </div>
            </div>
          )}

          {tab === 'email' && <EmailTestPanel />}
        </div>
      </div>

      {/* Org Detail Sidebar */}
      {selected && (
        <div style={{ width:'340px', borderLeft:'1px solid #1a2235', background:'#0c0f1a', padding:'20px', overflowY:'auto', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800' }}>{selected.name}</div>
            <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'16px' }}>×</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
            {[
              { label:'Contacts', value: selected._count?.contacts },
              { label:'Conversations', value: selected._count?.conversations },
              { label:'Campaigns', value: selected._count?.campaigns },
              { label:'AI Agents', value: selected._count?.aiAgents },
            ].map(s => (
              <div key={s.label} style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', padding:'10px' }}>
                <div style={{ fontSize:'16px', fontWeight:'800' }}>{s.value ?? 0}</div>
                <div style={{ fontSize:'10px', color:'#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'6px', fontWeight:'700', letterSpacing:'0.05em' }}>DETAILS</div>
          {[
            { label:'Slug', value: selected.slug },
            { label:'Plan', value: selected.plan },
            { label:'Industry', value: selected.industry || '—' },
            { label:'Country', value: selected.country },
            { label:'Created', value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '—' },
            { label:'AI Enabled', value: selected.settings?.aiEnabled ? '✅ Yes' : '❌ No' },
          ].map(f => (
            <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a2235', fontSize:'12px' }}>
              <span style={{ color:'#64748b' }}>{f.label}</span>
              <span style={{ fontWeight:'600' }}>{f.value}</span>
            </div>
          ))}

          <div style={{ marginTop:'16px' }}>
            <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.05em' }}>TEAM ({selected.users?.length || 0})</div>
            {(selected.users || []).map(u => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0', borderBottom:'1px solid #1a2235' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#1a2235', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:'#64748b', flexShrink:0 }}>
                  {u.name?.slice(0,2).toUpperCase() || '??'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize:'10px', color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                </div>
                <div style={{ fontSize:'9px', padding:'2px 6px', background:'#111622', border:'1px solid #1a2235', borderRadius:'3px', color:'#64748b', flexShrink:0 }}>{u.role}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
            <button
              onClick={() => suspendOrg(selected.id)}
              style={{ flex:1, padding:'8px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'6px', color:'#ef4444', fontSize:'12px', cursor:'pointer', fontWeight:'600' }}
            >
              Suspend Org
            </button>
          </div>
        </div>
      )}

      {/* Create Org Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'12px', padding:'24px', width:'420px' }}>
            <div style={{ fontSize:'16px', fontWeight:'800', marginBottom:'20px' }}>Create New Organization</div>

            {[
              { key:'name', label:'Company Name *', placeholder:'Clinic Al Rayyan' },
              { key:'slug', label:'Slug / Subdomain *', placeholder:'clinic-alrayyan' },
              { key:'industry', label:'Industry', placeholder:'Healthcare' },
              { key:'country', label:'Country Code', placeholder:'QA' },
              { key:'adminName', label:'Admin Full Name', placeholder:'Ahmed Al Rashid' },
              { key:'adminEmail', label:'Admin Email *', placeholder:'admin@clinic.qa' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'600' }}>{f.label}</div>
                <input
                  value={newOrg[f.key]}
                  onChange={e => setNewOrg({ ...newOrg, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            ))}

            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button onClick={() => setShowCreate(false)} style={{ flex:1, padding:'10px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', cursor:'pointer', fontSize:'13px' }}>
                Cancel
              </button>
              <button onClick={createOrg} disabled={creating} style={{ flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', cursor:'pointer', fontSize:'13px' }}>
                {creating ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditLogTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMasterAuditLogs({ limit: 100 })
      .then(res => setLogs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color:'#64748b', padding:'40px', textAlign:'center' }}>Loading audit logs...</div>
  if (logs.length === 0) return <div style={{ color:'#64748b', padding:'40px', textAlign:'center' }}>No audit logs yet</div>

  return (
    <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'8px', overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 100px', padding:'10px 16px', background:'#0c0f1a', fontSize:'10px', color:'#64748b', fontWeight:'700', letterSpacing:'0.05em' }}>
        <div>TIME</div>
        <div>ACTION</div>
        <div>RESOURCE</div>
        <div>USER</div>
      </div>
      {logs.map(log => (
        <div key={log.id} style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 100px', padding:'10px 16px', borderTop:'1px solid #1a2235', alignItems:'center', fontSize:'12px' }}>
          <div style={{ color:'#64748b', fontSize:'10px' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
          <div style={{ color:'#e2e8f0' }}>{log.action}</div>
          <div style={{ color:'#a78bfa' }}>{log.resource}</div>
          <div style={{ color:'#64748b', fontSize:'10px' }}>{log.userId?.slice(0,8) || '—'}</div>
        </div>
      ))}
    </div>
  )
}
