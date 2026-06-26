'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function SuccessInner() {
  const params = useSearchParams()
  const paymentId = params.get('paymentId') || params.get('Id') || ''
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    if (!paymentId) { setState({ loading: false, error: 'No payment reference found.' }); return }
    api.verifySubscription(paymentId)
      .then(r => setState({ loading: false, ...r }))
      .catch(e => setState({ loading: false, error: e?.message || 'Could not verify payment' }))
  }, [paymentId])

  const ok = state.activated
  const pending = !state.loading && !ok && !state.error && state.status && state.status.toLowerCase() !== 'paid'

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '440px', textAlign: 'center', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '16px', padding: '40px 32px' }}>
        {state.loading ? (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Confirming your payment…</div>
          </>
        ) : ok ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px' }}>You&apos;re subscribed!</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Your <strong style={{ color: '#00e5a0' }}>{state.plan}</strong> plan is now active. Thank you!</p>
            <a href="/dashboard" style={{ display: 'inline-block', padding: '12px 28px', background: '#00e5a0', color: '#07090f', borderRadius: '8px', fontWeight: 800, fontSize: '14px', textDecoration: 'none' }}>Go to dashboard →</a>
          </>
        ) : pending ? (
          <>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🕓</div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Payment {state.status}</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>We haven&apos;t received confirmation yet. If you completed payment, refresh in a moment.</p>
            <a href="/settings?tab=billing" style={{ color: '#a78bfa', fontSize: '13px' }}>Back to plans</a>
          </>
        ) : (
          <>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Couldn&apos;t confirm payment</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>{state.error || 'Please contact support if you were charged.'}</p>
            <a href="/settings?tab=billing" style={{ color: '#a78bfa', fontSize: '13px' }}>Back to plans</a>
          </>
        )}
      </div>
    </div>
  )
}

export default function BillingSuccess() {
  return <Suspense fallback={null}><SuccessInner /></Suspense>
}
