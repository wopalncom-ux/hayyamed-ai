'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const COUNTRIES = [
  ['QA', 'Qatar'], ['KW', 'Kuwait'], ['SA', 'Saudi Arabia'], ['AE', 'UAE'],
  ['BH', 'Bahrain'], ['OM', 'Oman'], ['EG', 'Egypt'], ['JO', 'Jordan'],
]
const CURRENCIES = ['QAR', 'KWD', 'SAR', 'AED', 'BHD', 'OMR', 'EGP', 'USD']

const inputStyle = { width: '100%', padding: '10px 12px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }

export default function PaymentsControl() {
  const [status, setStatus] = useState(null)
  const [apiToken, setApiToken] = useState('')
  const [isTest, setIsTest] = useState(true)
  const [country, setCountry] = useState('QA')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Test-payment form
  const [amount, setAmount] = useState('10')
  const [currency, setCurrency] = useState('QAR')
  const [custName, setCustName] = useState('Test Customer')
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState(null)

  // Platform billing account (collects tenant subscription payments)
  const [pfStatus, setPfStatus] = useState(null)
  const [pfToken, setPfToken] = useState('')
  const [pfTest, setPfTest] = useState(true)
  const [pfCountry, setPfCountry] = useState('QA')
  const [pfSaving, setPfSaving] = useState(false)
  const loadPf = () => api.getMyFatoorahPlatformStatus().then(s => { setPfStatus(s); if (s?.country) setPfCountry(s.country); setPfTest(s?.isTest ?? true) }).catch(() => setPfStatus({ configured: false }))

  // Payment history + summary
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [refreshing, setRefreshing] = useState(null)
  const loadPayments = () => {
    api.getMyFatoorahPayments().then(p => setPayments(Array.isArray(p) ? p : [])).catch(() => {})
    api.getMyFatoorahSummary().then(setSummary).catch(() => {})
  }
  const money = (obj) => { const e = Object.entries(obj || {}); return e.length ? e.map(([c, v]) => `${c} ${Number(v).toLocaleString()}`).join(' · ') : '—' }

  const showToast = (ok, msg) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 3500) }

  const loadStatus = () => api.getMyFatoorahStatus()
    .then(s => { setStatus(s); if (s?.country) setCountry(s.country); setIsTest(s?.isTest ?? true) })
    .catch(() => setStatus({ configured: false }))

  useEffect(() => { loadStatus(); loadPayments(); loadPf() }, [])

  const savePf = async () => {
    if (!pfToken.trim()) return showToast(false, 'Enter your platform MyFatoorah API token')
    setPfSaving(true)
    try { const s = await api.saveMyFatoorahPlatformConfig(pfToken.trim(), pfTest, pfCountry); setPfStatus(s); setPfToken(''); showToast(true, 'Platform billing connected') }
    catch (e) { showToast(false, e?.message || 'Save failed') }
    finally { setPfSaving(false) }
  }
  const disconnectPf = async () => {
    if (!confirm('Disconnect platform billing? Subscription checkout will stop working.')) return
    try { await api.disconnectMyFatoorahPlatform(); await loadPf(); showToast(true, 'Disconnected') }
    catch (e) { showToast(false, e?.message || 'Failed') }
  }

  const refreshPayment = async (id) => {
    setRefreshing(id)
    try {
      const updated = await api.refreshMyFatoorahPayment(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: updated?.status || p.status } : p))
    } catch (e) { showToast(false, e?.message || 'Could not refresh') }
    finally { setRefreshing(null) }
  }
  const statusColor = (s) => {
    const v = String(s || '').toLowerCase()
    if (v === 'paid') return '#D8B16A'
    if (v === 'failed' || v === 'expired' || v === 'canceled' || v === 'cancelled') return '#ef4444'
    return '#fbbf24'
  }

  const save = async () => {
    if (!apiToken.trim()) return showToast(false, 'Enter your MyFatoorah API token')
    setSaving(true)
    try {
      const s = await api.saveMyFatoorahConfig(apiToken.trim(), isTest, country)
      setStatus(s); setApiToken('')
      showToast(true, 'MyFatoorah connected')
    } catch (e) { showToast(false, e?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const disconnect = async () => {
    if (!confirm('Disconnect MyFatoorah? Payment links will stop working until reconnected.')) return
    try { await api.disconnectMyFatoorah(); await loadStatus(); showToast(true, 'Disconnected') }
    catch (e) { showToast(false, e?.message || 'Failed') }
  }

  const createLink = async () => {
    setPaying(true); setPayResult(null)
    try {
      const r = await api.createMyFatoorahPayment({ amount: Number(amount), currency, customerName: custName })
      setPayResult(r); loadPayments()
    } catch (e) { showToast(false, e?.message || 'Could not create payment') }
    finally { setPaying(false) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '760px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>PAYMENTS · OWNER ONLY</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>MyFatoorah Payments</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Accept payments across the GCC — KNET, mada, Visa/Mastercard, Apple Pay — via MyFatoorah.</p>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '12px',
            background: status?.configured ? 'rgba(216,177,106,.12)' : 'rgba(100,116,139,.12)',
            border: `1px solid ${status?.configured ? 'rgba(216,177,106,.3)' : 'rgba(100,116,139,.3)'}`,
            color: status?.configured ? '#D8B16A' : '#94a3b8' }}>
            {status == null ? '…' : status.configured ? `● Connected${status.isTest ? ' (Test mode)' : ' (Live)'}` : '○ Not connected'}
          </span>
          {status?.configured && <button onClick={disconnect} style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Disconnect</button>}
        </div>

        {/* Revenue summary */}
        {summary && summary.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Received', value: money(summary.paidByCurrency), color: '#D8B16A' },
              { label: 'This month', value: money(summary.monthByCurrency), color: '#a78bfa' },
              { label: 'Paid', value: String(summary.paidCount), color: '#3b82f6' },
              { label: 'Pending', value: String(summary.pendingCount), color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderTop: `2px solid ${s.color}`, borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Config card */}
        <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '14px' }}>API Configuration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>API TOKEN {status?.configured && <span style={{ color: '#475569', fontWeight: 400 }}>· leave blank to keep current</span>}</label>
              <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="Paste your MyFatoorah API key" style={inputStyle} />
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>MyFatoorah portal → API Key (Integration Settings). Use the Test token first, then switch to Live.</div>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={labelStyle}>COUNTRY</label>
                <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={labelStyle}>MODE</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[[true, 'Test'], [false, 'Live']].map(([val, lbl]) => (
                    <button key={lbl} onClick={() => setIsTest(val)}
                      style={{ flex: 1, padding: '9px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                        background: isTest === val ? (val ? 'rgba(251,191,36,.15)' : 'rgba(216,177,106,.15)') : '#111622',
                        border: `1px solid ${isTest === val ? (val ? '#fbbf24' : '#D8B16A') : '#1a2235'}`,
                        color: isTest === val ? (val ? '#fbbf24' : '#D8B16A') : '#64748b' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={save} disabled={saving} style={{ padding: '11px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'Saving…' : status?.configured ? 'Update configuration' : 'Connect MyFatoorah'}
            </button>
          </div>
        </div>

        {/* Platform billing account — collects tenant subscription payments */}
        <div style={{ background: '#0c0f1a', border: '1px solid rgba(167,139,250,.25)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#a78bfa' }}>Platform billing account</div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px',
              background: pfStatus?.configured ? 'rgba(216,177,106,.12)' : 'rgba(100,116,139,.12)',
              color: pfStatus?.configured ? '#D8B16A' : '#94a3b8' }}>
              {pfStatus == null ? '…' : pfStatus.configured ? `● Connected${pfStatus.isTest ? ' (Test)' : ''}` : '○ Not connected'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>The MyFatoorah account that <strong>your customers&apos; subscription payments</strong> (the 150 / 599 / 990 plans) are deposited into. Separate from the account above, which your business uses to collect from its own customers.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="password" value={pfToken} onChange={e => setPfToken(e.target.value)} placeholder={pfStatus?.configured ? 'Enter a new token to replace the current one' : 'Platform MyFatoorah API token'} style={inputStyle} />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={labelStyle}>COUNTRY</label>
                <select value={pfCountry} onChange={e => setPfCountry(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={labelStyle}>MODE</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[[true, 'Test'], [false, 'Live']].map(([val, lbl]) => (
                    <button key={lbl} onClick={() => setPfTest(val)} style={{ flex: 1, padding: '9px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: pfTest === val ? 'rgba(167,139,250,.15)' : '#111622', border: `1px solid ${pfTest === val ? '#a78bfa' : '#1a2235'}`, color: pfTest === val ? '#a78bfa' : '#64748b' }}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={savePf} disabled={pfSaving} style={{ flex: 1, padding: '11px', background: '#a78bfa', border: 'none', borderRadius: '8px', color: '#07090f', fontWeight: 800, fontSize: '13px', cursor: pfSaving ? 'wait' : 'pointer' }}>{pfSaving ? 'Saving…' : pfStatus?.configured ? 'Update platform account' : 'Connect platform billing'}</button>
              {pfStatus?.configured && <button onClick={disconnectPf} style={{ padding: '11px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Disconnect</button>}
            </div>
            <div style={{ fontSize: '11px', color: pfStatus?.configured ? '#D8B16A' : '#475569' }}>{pfStatus?.configured ? '✓ Subscription checkout is live — customers pay through MyFatoorah and are activated automatically.' : 'Until connected, subscription checkout falls back to simulated activation.'}</div>
          </div>
        </div>

        {/* Test a payment link */}
        <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', opacity: status?.configured ? 1 : 0.55 }}>
          <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>Generate a payment link</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>{status?.configured ? 'Creates a real MyFatoorah hosted payment page (test mode uses the sandbox).' : 'Connect MyFatoorah above to enable this.'}</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ width: '110px' }}><label style={labelStyle}>AMOUNT</label><input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0.1" step="0.1" style={inputStyle} /></div>
            <div style={{ width: '110px' }}><label style={labelStyle}>CURRENCY</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1, minWidth: '160px' }}><label style={labelStyle}>CUSTOMER NAME</label><input value={custName} onChange={e => setCustName(e.target.value)} style={inputStyle} /></div>
            <button onClick={createLink} disabled={paying || !status?.configured} style={{ padding: '10px 18px', height: '40px', background: status?.configured ? '#a78bfa' : '#1a2235', border: 'none', borderRadius: '8px', color: status?.configured ? '#07090f' : '#475569', fontWeight: 800, fontSize: '12px', cursor: paying ? 'wait' : status?.configured ? 'pointer' : 'not-allowed' }}>{paying ? '…' : 'Create link'}</button>
          </div>
          {payResult?.paymentUrl && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(216,177,106,.06)', border: '1px solid rgba(216,177,106,.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#D8B16A', fontWeight: 700, marginBottom: '6px' }}>✓ Payment link created (Invoice #{payResult.invoiceId})</div>
              <a href={payResult.paymentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#a78bfa', wordBreak: 'break-all' }}>{payResult.paymentUrl}</a>
            </div>
          )}
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={{ background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>Recent payments</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {payments.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{p.customerName || 'Customer'} · {p.currency} {Number(p.amount).toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#475569' }}>Invoice #{p.invoiceId || '—'} · {new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '10px', background: statusColor(p.status) + '22', color: statusColor(p.status) }}>{p.status}</span>
                  {p.paymentUrl && <a href={p.paymentUrl} target="_blank" rel="noreferrer" title="Open link" style={{ color: '#a78bfa', fontSize: '13px', textDecoration: 'none' }}>↗</a>}
                  <button onClick={() => refreshPayment(p.id)} disabled={refreshing === p.id} title="Re-check status"
                    style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}>
                    {refreshing === p.id ? '…' : '↻'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#D8B16A' : '#ef4444', color: toast.ok ? '#07090f' : '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', zIndex: 100 }}>{toast.msg}</div>
      )}
    </div>
  )
}
