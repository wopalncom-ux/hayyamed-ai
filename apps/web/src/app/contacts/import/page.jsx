'use client'
import { useState, useRef, useCallback } from 'react'
import NavSidebar from '@/components/NavSidebar'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getAuth() {
  try { return JSON.parse(localStorage.getItem('hayyamed_auth') || '{}') } catch { return {} }
}

const CONTACT_FIELDS = [
  { key: 'name', label: 'Name *', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'tags', label: 'Tags (comma-separated)', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'notes', label: 'Notes', required: false },
]

function Step({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: active || done ? 1 : 0.4 }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800',
        background: done ? '#D8B16A' : active ? '#3b82f6' : '#1a2235',
        color: done ? '#0a0f1a' : active ? '#fff' : '#64748b',
        flexShrink: 0,
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: '13px', fontWeight: active ? '700' : '500', color: active ? '#e2e8f0' : '#64748b' }}>{label}</span>
    </div>
  )
}

export default function ContactImportPage() {
  const [step, setStep] = useState(1) // 1: Upload, 2: Map, 3: Options, 4: Result
  const [file, setFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [previewRows, setPreviewRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [overwrite, setOverwrite] = useState(false)
  const [defaultSource, setDefaultSource] = useState('import')
  const [defaultStatus, setDefaultStatus] = useState('NEW')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (f) => {
    if (!f) return
    if (!f.name.match(/\.(csv|tsv)$/i)) {
      alert('Please upload a CSV or TSV file')
      return
    }
    setFile(f)
    setLoading(true)
    const auth = getAuth()
    const form = new FormData()
    form.append('file', f)
    try {
      const res = await fetch(`${BASE}/api/v1/contacts/import/preview`, {
        method: 'POST', body: form,
        headers: {
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
          ...(auth.orgId ? { 'x-org-id': auth.orgId } : {}),
          ...(auth.userId ? { 'x-user-id': auth.userId } : {}),
        },
      })
      const data = await res.json()
      setHeaders(data.headers || [])
      setPreviewRows(data.rows || [])
      // Auto-map obvious column names
      const autoMap = {}
      const h = data.headers || []
      CONTACT_FIELDS.forEach(f => {
        const match = h.find(col => col.toLowerCase().replace(/[\s_-]/g, '') === f.key.toLowerCase())
        if (match) autoMap[f.key] = match
      })
      setMapping(autoMap)
      setStep(2)
    } catch (e) { alert('Failed to parse file: ' + e.message) }
    finally { setLoading(false) }
  }

  const doImport = async () => {
    if (!mapping.name) { alert('You must map the Name column'); return }
    if (!mapping.phone && !mapping.email) { alert('Map at least Phone or Email'); return }
    setLoading(true)
    const auth = getAuth()
    const form = new FormData()
    form.append('file', file)
    form.append('mapping', JSON.stringify(mapping))
    form.append('overwriteDuplicates', String(overwrite))
    form.append('defaultSource', defaultSource)
    form.append('defaultStatus', defaultStatus)
    try {
      const res = await fetch(`${BASE}/api/v1/contacts/import`, {
        method: 'POST', body: form,
        headers: {
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
          ...(auth.orgId ? { 'x-org-id': auth.orgId } : {}),
          ...(auth.userId ? { 'x-user-id': auth.userId } : {}),
        },
      })
      const data = await res.json()
      setResult(data)
      setStep(4)
    } catch (e) { alert('Import failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <NavSidebar current="contacts" />
      <main style={{ flex: 1, padding: '32px', maxWidth: '820px', margin: '0 auto', overflow: 'auto' }}>

        <div style={{ marginBottom: '8px' }}>
          <a href="/contacts" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Contacts</a>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Import Contacts</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
          Upload a CSV file to bulk-import contacts. Supports up to 50,000 rows.
        </p>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <Step n={1} label="Upload File" active={step === 1} done={step > 1} />
          <div style={{ color: '#1a2235', fontSize: '18px', alignSelf: 'center' }}>›</div>
          <Step n={2} label="Map Columns" active={step === 2} done={step > 2} />
          <div style={{ color: '#1a2235', fontSize: '18px', alignSelf: 'center' }}>›</div>
          <Step n={3} label="Options" active={step === 3} done={step > 3} />
          <div style={{ color: '#1a2235', fontSize: '18px', alignSelf: 'center' }}>›</div>
          <Step n={4} label="Done" active={step === 4} done={false} />
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#D8B16A' : '#1a2235'}`,
                borderRadius: '12px', padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? '#D8B16A10' : '#111622', transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>
                {loading ? 'Parsing file...' : 'Drop your CSV file here'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>or click to browse · CSV, TSV · Max 10MB</div>
              <input ref={fileRef} type="file" accept=".csv,.tsv" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files?.[0])} />
            </div>

            <div style={{ marginTop: '24px', background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>📋 Required CSV format</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', background: '#0a0f1a', padding: '12px', borderRadius: '6px', overflowX: 'auto' }}>
                name,phone,email,source,status,tags,city<br/>
                Ahmed Al Rashid,+97412345678,ahmed@example.com,whatsapp,NEW,vip;healthcare,Doha<br/>
                Sara Mohammed,+97498765432,sara@clinic.qa,referral,ACTIVE,doctor,Lusail
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                ✓ Name is required. At least phone or email is required. Tags can be comma or semicolon-separated.
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>
                Map your CSV columns → Contact fields
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {CONTACT_FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      {f.label}
                    </label>
                    <select
                      value={mapping[f.key] || ''}
                      onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value || undefined }))}
                      style={{ width: '100%', background: '#0a0f1a', border: `1px solid ${f.required && !mapping[f.key] ? '#ef444444' : '#1a2235'}`, borderRadius: '6px', padding: '8px 10px', color: mapping[f.key] ? '#e2e8f0' : '#64748b', fontSize: '13px' }}>
                      <option value="">— not mapped —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '13px' }}>
                Preview — first {previewRows.length} rows
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a2235' }}>
                      {headers.map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < previewRows.length - 1 ? '1px solid #0f1624' : 'none' }}>
                        {headers.map(h => (
                          <td key={h} style={{ padding: '8px 12px', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {String(row[h] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep(1); setFile(null) }}
                style={{ padding: '10px 20px', background: '#1a2235', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
              <button onClick={() => setStep(3)}
                disabled={!mapping.name || (!mapping.phone && !mapping.email)}
                style={{ padding: '10px 20px', background: (mapping.name && (mapping.phone || mapping.email)) ? '#3b82f6' : '#1a2235', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Options */}
        {step === 3 && (
          <div>
            <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '20px' }}>Import Options</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Default Source</label>
                  <select value={defaultSource} onChange={e => setDefaultSource(e.target.value)}
                    style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px' }}>
                    {['import', 'whatsapp', 'instagram', 'referral', 'web', 'manual'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Default Status</label>
                  <select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)}
                    style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1a2235', borderRadius: '6px', padding: '10px 12px', color: '#e2e8f0', fontSize: '13px' }}>
                    {['NEW', 'ACTIVE', 'QUALIFIED', 'CONVERTED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setOverwrite(v => !v)} style={{
                  width: '40px', height: '22px', borderRadius: '11px', background: overwrite ? '#D8B16A' : '#1a2235',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: '3px', left: overwrite ? '21px' : '3px', width: '16px', height: '16px',
                    borderRadius: '50%', background: overwrite ? '#0a0f1a' : '#64748b', transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Overwrite existing contacts (matched by phone or email)</span>
              </label>
            </div>

            {/* Summary */}
            <div style={{ background: '#3b82f611', border: '1px solid #3b82f633', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#3b82f6', marginBottom: '10px' }}>Import Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                <div>📄 File: <span style={{ color: '#e2e8f0' }}>{file?.name}</span></div>
                <div>🔗 Column mapping: <span style={{ color: '#D8B16A' }}>{Object.keys(mapping).filter(k => mapping[k]).length} fields mapped</span></div>
                <div>📊 Preview rows: <span style={{ color: '#e2e8f0' }}>{previewRows.length} (of full file)</span></div>
                <div>🔄 Duplicates: <span style={{ color: '#e2e8f0' }}>{overwrite ? 'Update existing' : 'Skip'}</span></div>
                <div>📌 Default source: <span style={{ color: '#e2e8f0' }}>{defaultSource}</span></div>
                <div>📌 Default status: <span style={{ color: '#e2e8f0' }}>{defaultStatus}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)}
                style={{ padding: '10px 20px', background: '#1a2235', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
              <button onClick={doImport} disabled={loading}
                style={{ padding: '10px 24px', background: loading ? '#1a2235' : '#D8B16A', border: 'none', borderRadius: '8px', color: loading ? '#64748b' : '#0a0f1a', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '14px' }}>
                {loading ? '⏳ Importing...' : '⬆ Import Now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && result && (
          <div>
            <div style={{
              background: result.imported > 0 ? '#D8B16A11' : '#ef444411',
              border: `1px solid ${result.imported > 0 ? '#D8B16A33' : '#ef444433'}`,
              borderRadius: '12px', padding: '28px', textAlign: 'center', marginBottom: '24px',
            }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>{result.imported > 0 ? '✅' : '❌'}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px', color: result.imported > 0 ? '#D8B16A' : '#ef4444' }}>
                {result.imported > 0 ? `${result.imported.toLocaleString()} contacts imported` : 'Import failed'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Total Rows', value: result.total, color: '#64748b' },
                { label: 'Imported', value: result.imported, color: '#D8B16A' },
                { label: 'Skipped (Duplicate)', value: result.duplicates, color: '#fbbf24' },
                { label: 'Failed', value: result.failed, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {result.errors?.length > 0 && (
              <div style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2235', fontWeight: '700', fontSize: '13px', color: '#ef4444' }}>
                  {result.errors.length} row{result.errors.length > 1 ? 's' : ''} failed
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #0f1624', fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                      <span style={{ color: '#64748b', minWidth: '60px' }}>Row {e.row}</span>
                      <span>{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="/contacts" style={{ padding: '10px 20px', background: '#D8B16A', border: 'none', borderRadius: '8px', color: '#0a0f1a', fontWeight: '800', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}>
                View Contacts →
              </a>
              <button onClick={() => { setStep(1); setFile(null); setResult(null); setMapping({}) }}
                style={{ padding: '10px 20px', background: '#1a2235', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                Import More
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
