'use client'
import { useState, useEffect } from 'react'
import { getAuth } from '@/lib/auth'
import NavSidebar from '@/components/NavSidebar'

export default function WebsiteChatSetup() {
  const [orgId, setOrgId] = useState('')
  const [bizName, setBizName] = useState('My Business')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const a = getAuth()
    setOrgId(a.orgId || '')
    if (a.userName) setBizName(a.userName)
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.hayyaai.com'
  const snippet = `<script src="${origin}/widget.js"\n  data-org="${orgId}"\n  data-name="${bizName}"></script>`

  const copy = () => {
    navigator.clipboard?.writeText(snippet)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const loadPreview = () => {
    if (document.getElementById('hmw-preview')) { document.getElementById('hmw-preview').remove(); document.querySelector('.hmw-win')?.remove(); document.querySelector('.hmw-btn')?.remove() }
    const s = document.createElement('script')
    s.id = 'hmw-preview'; s.src = `${origin}/widget.js`
    s.setAttribute('data-org', orgId); s.setAttribute('data-name', bizName)
    document.body.appendChild(s)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="integrations" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: '820px' }}>
        <div style={{ marginBottom: '8px' }}>
          <a href="/integrations" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Integrations</a>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 6px' }}>🌐 Website Chat Widget</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
          Add an AI-powered chat bubble to any website. Visitor messages land in your <strong style={{ color: '#e2e8f0' }}>Inbox</strong> as a live conversation, and the AI replies using your <strong style={{ color: '#a78bfa' }}>Knowledge Base</strong>.
        </p>

        <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>BUSINESS NAME (shown in the widget)</label>
          <input value={bizName} onChange={e => setBizName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />

          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>EMBED CODE — paste before <code style={{ color: '#D8B16A' }}>&lt;/body&gt;</code> on your site</label>
          <pre style={{ background: '#0a121e', border: '1px solid #1a2235', borderRadius: '8px', padding: '14px', color: '#D8B16A', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{snippet}</pre>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={copy} style={{ padding: '9px 18px', background: copied ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: copied ? '#D8B16A' : '#07090f', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '📋 Copy code'}
            </button>
            <button onClick={loadPreview} style={{ padding: '9px 18px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: '8px', color: '#a78bfa', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              👁 Preview on this page
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(216,177,106,.04)', border: '1px solid rgba(216,177,106,.12)', borderRadius: '10px', padding: '16px 18px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
          <strong style={{ color: '#e2e8f0' }}>How it works</strong>
          <ol style={{ margin: '8px 0 0 18px' }}>
            <li>Paste the code on your website (or click Preview to try it here).</li>
            <li>Visitors chat with the AI, grounded in your Knowledge Base.</li>
            <li>Every conversation appears in your <strong style={{ color: '#D8B16A' }}>Inbox</strong> — your team can take over anytime.</li>
          </ol>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>💡 Tip: add content in <strong style={{ color: '#a78bfa' }}>Knowledge</strong> so the AI answers accurately about your services, pricing, and hours.</div>
        </div>
      </main>
    </div>
  )
}
