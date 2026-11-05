'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

// Providers wired in the backend router today. The others are roadmap.
const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI',     icon: '🤖', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], wired: true },
  { id: 'anthropic', label: 'Anthropic Claude', icon: '🧠', models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'], wired: true },
  { id: 'gemini',    label: 'Google Gemini', icon: '✨', models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'], wired: true },
  { id: 'groq',      label: 'Groq (Llama)', icon: '⚡', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'], wired: true },
  { id: 'azure',     label: 'Microsoft Azure AI', icon: '☁️', models: [], wired: false },
  { id: 'meta',      label: 'Meta AI',    icon: '📘', models: [], wired: false },
  { id: 'xai',       label: 'xAI Grok',   icon: '✖️', models: [], wired: false },
  { id: 'deepseek',  label: 'DeepSeek',   icon: '🌊', models: [], wired: false },
]

export default function AICommandCenter() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({})       // providerId -> test result
  const [testing, setTesting] = useState({})       // providerId -> bool
  const [picked, setPicked] = useState('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [prompt, setPrompt] = useState('Reply with a one-sentence friendly greeting.')
  const [consoleRes, setConsoleRes] = useState(null)
  const [consoleLoading, setConsoleLoading] = useState(false)

  useEffect(() => {
    api.getAiProviders().then(s => setStatus(s || {})).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const quickTest = async (pid) => {
    setTesting(t => ({ ...t, [pid]: true }))
    try {
      const r = await api.testAiProvider(pid)
      setResults(x => ({ ...x, [pid]: r }))
    } catch (e) {
      setResults(x => ({ ...x, [pid]: { ok: false, error: e?.message || 'failed' } }))
    } finally {
      setTesting(t => ({ ...t, [pid]: false }))
    }
  }

  const runConsole = async () => {
    setConsoleLoading(true); setConsoleRes(null)
    try {
      const r = await api.testAiProvider(picked, model, prompt)
      setConsoleRes(r)
    } catch (e) {
      setConsoleRes({ ok: false, error: e?.message || 'failed' })
    } finally {
      setConsoleLoading(false)
    }
  }

  const pickedProvider = PROVIDERS.find(p => p.id === picked)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <NavSidebar current="admin" />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>MASTER CONTROL · OWNER ONLY</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0' }}>AI Command Center</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Control and diagnose every AI provider. No AI feature depends on a single provider — fallback is automatic.</p>
        </div>

        {/* Provider status grid */}
        <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>PROVIDERS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {PROVIDERS.map(p => {
            const keyPresent = status[p.id] === true
            const res = results[p.id]
            const liveOk = res?.ok
            return (
              <div key={p.id} style={{ background: '#111622', border: `1px solid ${liveOk ? 'rgba(216,177,106,.3)' : '#1a2235'}`, borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{p.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{p.label}</span>
                  </div>
                  {!p.wired
                    ? <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(100,116,139,.15)', color: '#64748b', fontWeight: 700 }}>ROADMAP</span>
                    : keyPresent
                      ? <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(216,177,106,.12)', color: '#D8B16A', fontWeight: 700 }}>KEY SET</span>
                      : <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontWeight: 700 }}>NO KEY</span>}
                </div>

                {res && (
                  <div style={{ fontSize: '11px', marginBottom: '8px', padding: '8px 10px', borderRadius: '6px', background: liveOk ? 'rgba(216,177,106,.06)' : 'rgba(239,68,68,.06)', color: liveOk ? '#D8B16A' : '#ef4444', lineHeight: 1.5 }}>
                    {liveOk ? `✓ Live · ${res.latencyMs}ms` : `✗ ${res.error || 'failed'}`}
                  </div>
                )}

                {p.wired && (
                  <button onClick={() => quickTest(p.id)} disabled={testing[p.id]}
                    style={{ width: '100%', padding: '7px', background: testing[p.id] ? '#1a2235' : '#0c0f1a', border: '1px solid #1e2d42', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px', fontWeight: 600, cursor: testing[p.id] ? 'wait' : 'pointer' }}>
                    {testing[p.id] ? 'Testing…' : '▶ Test connection'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Test console */}
        <h3 style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>TEST CONSOLE</h3>
        <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', padding: '20px', maxWidth: '760px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 700 }}>PROVIDER</label>
              <select value={picked} onChange={e => { setPicked(e.target.value); const np = PROVIDERS.find(p => p.id === e.target.value); setModel(np?.models[0] || '') }}
                style={{ width: '100%', padding: '9px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer' }}>
                {PROVIDERS.filter(p => p.wired).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 700 }}>MODEL</label>
              <select value={model} onChange={e => setModel(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer' }}>
                {(pickedProvider?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 700 }}>TEST PROMPT</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
            style={{ width: '100%', padding: '9px 12px', background: '#0c0f1a', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: '12px' }} />
          <button onClick={runConsole} disabled={consoleLoading}
            style={{ padding: '10px 22px', background: consoleLoading ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: consoleLoading ? '#64748b' : '#07090f', fontWeight: 700, fontSize: '13px', cursor: consoleLoading ? 'wait' : 'pointer' }}>
            {consoleLoading ? 'Running…' : '▶ Run test'}
          </button>

          {consoleRes && (
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: consoleRes.ok ? 'rgba(216,177,106,.05)' : 'rgba(239,68,68,.05)', border: `1px solid ${consoleRes.ok ? 'rgba(216,177,106,.2)' : 'rgba(239,68,68,.2)'}` }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: consoleRes.ok ? '#D8B16A' : '#ef4444' }}>{consoleRes.ok ? '✓ SUCCESS' : '✗ FAILED'}</span>
                {consoleRes.model && <span style={{ fontSize: '11px', color: '#64748b' }}>{consoleRes.model}</span>}
                {typeof consoleRes.latencyMs === 'number' && consoleRes.latencyMs > 0 && <span style={{ fontSize: '11px', color: '#64748b' }}>{consoleRes.latencyMs}ms</span>}
              </div>
              <div style={{ fontSize: '13px', color: consoleRes.ok ? '#e2e8f0' : '#ef4444', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {consoleRes.ok ? consoleRes.reply : (consoleRes.error || 'Unknown error')}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', background: 'rgba(167,139,250,.04)', border: '1px solid rgba(167,139,250,.12)', borderRadius: '10px', padding: '14px 18px', fontSize: '12px', color: '#64748b', lineHeight: 1.7, maxWidth: '760px' }}>
          💡 To enable a provider, add its API key to GCP Secret Manager (e.g. <code style={{ color: '#a78bfa' }}>hayyamed-openai-key</code>, <code style={{ color: '#a78bfa' }}>hayyamed-anthropic-key</code>) and redeploy. Per-agent provider/model is already configurable in <strong style={{ color: '#e2e8f0' }}>Agents → AI Behavior</strong>. Azure / Meta / xAI / DeepSeek are on the roadmap.
        </div>
      </main>
    </div>
  )
}
