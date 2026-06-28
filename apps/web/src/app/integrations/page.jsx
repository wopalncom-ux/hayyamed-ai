'use client'
import { useState, useEffect } from 'react'
import { getAuth, isOwnerRole } from '@/lib/auth'
import { api } from '@/lib/api'
import NavSidebar from '@/components/NavSidebar'

const INTEGRATIONS = [
  {
    id:'meta', category:'Social & Messaging', color:'#3b82f6',
    name:'Meta Business Suite', icon:'📘',
    desc:'Connect Facebook Pages and Instagram accounts. Receive messages, post comments, and run campaigns via the Meta API.',
    badge:'Official API', fields:[
      { key:'app_id',     label:'APP ID',           placeholder:'Your Meta App ID', type:'text' },
      { key:'app_secret', label:'APP SECRET',        placeholder:'Your App Secret',   type:'password' },
      { key:'page_token', label:'PAGE ACCESS TOKEN', placeholder:'Long-lived page token', type:'password' },
    ],
    docs:'https://developers.facebook.com',
  },
  {
    id:'whatsapp', category:'Social & Messaging', color:'#00e5a0',
    name:'WhatsApp Business API', icon:'💬',
    desc:'Official WhatsApp Cloud API. Send and receive messages, templates, and media at scale.',
    badge:'Cloud API', fields:[
      { key:'wa_token',   label:'ACCESS TOKEN',      placeholder:'WhatsApp Cloud API token', type:'password' },
      { key:'phone_id',   label:'PHONE NUMBER ID',   placeholder:'Your WhatsApp number ID',  type:'text' },
      { key:'waba_id',    label:'WABA ID',           placeholder:'WhatsApp Business Account ID', type:'text' },
    ],
    docs:'https://developers.facebook.com/docs/whatsapp',
  },
  {
    id:'whatsapp-unipile', category:'Social & Messaging', color:'#25D366', setupUrl:'/integrations/whatsapp-unipile',
    name:'WhatsApp (QR connect)', icon:'💚',
    desc:'Connect your own WhatsApp number by scanning a QR / entering a pairing code — no Meta Business approval. Powered by Unipile. Best for two-way support chat.',
    badge:'Recommended', fields:[],
    docs:'https://www.unipile.com/whatsapp-api-documentation/',
  },
  {
    id:'website', category:'Social & Messaging', color:'#00e5a0', setupUrl:'/integrations/website',
    name:'Website Chat Widget', icon:'🌐',
    desc:'Add an AI chat bubble to any website. Visitor messages land in your inbox; AI replies from your knowledge base. Live now — no credentials needed.',
    badge:'Live', fields:[],
    docs:'',
  },
  {
    id:'telegram', category:'Social & Messaging', color:'#229ED9', setupUrl:'/integrations/telegram',
    name:'Telegram', icon:'✈️',
    desc:'Connect a Telegram bot in 2 minutes with a free @BotFather token — no app review. AI replies from your knowledge base.',
    badge:'Live', fields:[],
    docs:'',
  },
  {
    id:'webhooks', category:'Developer', color:'#a78bfa', setupUrl:'/integrations/webhooks',
    name:'Webhooks', icon:'🔗',
    desc:'Send real-time events (new lead, escalation, payment) to your own systems — Zapier, Make, Slack, or your backend. Live now.',
    badge:'Live', fields:[],
    docs:'',
  },
  {
    id:'apikeys', category:'Developer', color:'#00e5a0', setupUrl:'/integrations/api',
    name:'API & Keys', icon:'🔑',
    desc:'Push leads into your CRM from website forms, landing pages, or ad platforms using the public API. Generate a key and go. Live now.',
    badge:'Live', fields:[],
    docs:'',
  },
  {
    id:'instagram', category:'Social & Messaging', color:'#ec4899',
    name:'Instagram Messaging', icon:'📸',
    desc:'Receive and reply to Instagram DMs and story mentions directly from your inbox.',
    badge:'Meta Graph API', fields:[
      { key:'ig_token',  label:'INSTAGRAM TOKEN', placeholder:'Instagram Graph API token', type:'password' },
      { key:'ig_acct',   label:'ACCOUNT ID',      placeholder:'Instagram Business Account ID', type:'text' },
    ],
    docs:'https://developers.facebook.com/docs/instagram-api',
  },
  {
    id:'google_cal', category:'Calendar & Booking', color:'#f97316',
    name:'Google Calendar', icon:'📅',
    desc:'Sync appointments automatically. When a booking is confirmed in CRM, a Google Calendar event is created for your team.',
    badge:'Google API', fields:[
      { key:'gc_client_id',     label:'CLIENT ID',     placeholder:'OAuth 2.0 Client ID', type:'text' },
      { key:'gc_client_secret', label:'CLIENT SECRET', placeholder:'OAuth 2.0 Client Secret', type:'password' },
      { key:'gc_calendar_id',   label:'CALENDAR ID',   placeholder:'primary or specific calendar ID', type:'text' },
    ],
    docs:'https://developers.google.com/calendar',
  },
  {
    id:'calendly', category:'Calendar & Booking', color:'#06b6d4',
    name:'Calendly', icon:'🗓️',
    desc:'Embed Calendly booking links in chatbot flows. New bookings automatically create a contact and conversation.',
    badge:'Calendly API v2', fields:[
      { key:'calendly_token', label:'PERSONAL ACCESS TOKEN', placeholder:'Your Calendly API token', type:'password' },
      { key:'calendly_uri',   label:'ORGANIZATION URI',      placeholder:'https://api.calendly.com/organizations/...', type:'text' },
    ],
    docs:'https://developer.calendly.com',
  },
  {
    id:'google_biz', category:'Calendar & Booking', color:'#fbbf24',
    name:'Google My Business', icon:'🏪',
    desc:'Receive and respond to Google Business Messages and reviews. Sync location data and business hours.',
    badge:'GBM API', fields:[
      { key:'gmb_key',     label:'API KEY',       placeholder:'Google My Business API Key', type:'password' },
      { key:'gmb_acct_id', label:'ACCOUNT ID',    placeholder:'Your GBM Account ID', type:'text' },
    ],
    docs:'https://developers.google.com/my-business',
  },
  {
    id:'stripe', category:'Payments', color:'#a78bfa',
    name:'Stripe', icon:'💳',
    desc:'Collect payments from clients via the portal. Top-up balance, subscription billing, and invoicing — all automated.',
    badge:'Stripe API v2', fields:[
      { key:'stripe_pk', label:'PUBLISHABLE KEY', placeholder:'pk_live_...', type:'text' },
      { key:'stripe_sk', label:'SECRET KEY',      placeholder:'sk_live_...', type:'password' },
      { key:'stripe_wh', label:'WEBHOOK SECRET',  placeholder:'whsec_...', type:'password' },
    ],
    docs:'https://stripe.com/docs/api',
  },
  {
    id:'hubspot', category:'CRM', color:'#f97316',
    name:'HubSpot CRM', icon:'🔶',
    desc:'Two-way sync contacts, deals, and conversations between Hayya AI and HubSpot.',
    badge:'HubSpot API v3', fields:[
      { key:'hs_access_token', label:'PRIVATE APP TOKEN', placeholder:'pat-na1-...', type:'password' },
      { key:'hs_portal_id',    label:'PORTAL ID',         placeholder:'Your HubSpot portal ID', type:'text' },
    ],
    docs:'https://developers.hubspot.com',
  },
  {
    id:'salesforce', category:'CRM', color:'#3b82f6',
    name:'Salesforce', icon:'☁️',
    desc:'Sync leads and opportunities. Auto-create Salesforce records from incoming WhatsApp conversations.',
    badge:'Salesforce REST API', fields:[
      { key:'sf_client_id',     label:'CLIENT ID (CONSUMER KEY)', placeholder:'Your connected app client ID', type:'text' },
      { key:'sf_client_secret', label:'CLIENT SECRET',            placeholder:'Your connected app secret', type:'password' },
      { key:'sf_instance_url',  label:'INSTANCE URL',             placeholder:'https://yourorg.salesforce.com', type:'text' },
    ],
    docs:'https://developer.salesforce.com',
  },
  {
    id:'freshdesk', category:'Ticketing', color:'#00e5a0',
    name:'Freshdesk', icon:'🎫',
    desc:'Convert WhatsApp and inbox conversations into Freshdesk tickets. Agents can reply from either platform.',
    badge:'Freshdesk API v2', fields:[
      { key:'fd_api_key', label:'API KEY',   placeholder:'Your Freshdesk API key', type:'password' },
      { key:'fd_domain',  label:'SUBDOMAIN', placeholder:'yourcompany.freshdesk.com', type:'text' },
    ],
    docs:'https://developers.freshdesk.com',
  },
  {
    id:'zendesk', category:'Ticketing', color:'#fbbf24',
    name:'Zendesk', icon:'🎧',
    desc:'Create and update Zendesk tickets from conversations. Keep support and CRM in sync.',
    badge:'Zendesk REST API', fields:[
      { key:'zd_email',  label:'AGENT EMAIL',  placeholder:'admin@yourdomain.com', type:'text' },
      { key:'zd_token',  label:'API TOKEN',    placeholder:'Your Zendesk API token', type:'password' },
      { key:'zd_domain', label:'SUBDOMAIN',    placeholder:'yourcompany.zendesk.com', type:'text' },
    ],
    docs:'https://developer.zendesk.com',
  },
  {
    id:'openai', category:'AI & Automation', color:'#a78bfa',
    name:'OpenAI / GPT', icon:'🤖',
    desc:'Power AI auto-replies, chatbot responses, and the AI advisor with OpenAI GPT-4. Required for all AI features.',
    badge:'OpenAI API', fields:[
      { key:'openai_key',   label:'API KEY',   placeholder:'sk-proj-...', type:'password' },
      { key:'openai_model', label:'MODEL',     placeholder:'gpt-4o', type:'text' },
    ],
    docs:'https://platform.openai.com',
  },
  {
    id:'sendgrid', category:'Email', color:'#3b82f6',
    name:'SendGrid', icon:'📧',
    desc:'Send transactional emails — invitations, invoices, balance alerts — through your branded domain.',
    badge:'SendGrid v3 API', fields:[
      { key:'sg_key',    label:'API KEY',        placeholder:'SG.xxxxx', type:'password' },
      { key:'sg_sender', label:'VERIFIED SENDER',placeholder:'noreply@yourdomain.com', type:'text' },
    ],
    docs:'https://docs.sendgrid.com',
  },
]

const CATEGORIES = [...new Set(INTEGRATIONS.map(i => i.category))]
const inp = { width:'100%', background:'#111622', border:'1px solid #1e2d42', borderRadius:'6px', padding:'9px 12px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box' }
const lbl = { fontSize:'9px', color:'#7a8fa6', marginBottom:'5px', display:'block', letterSpacing:'1px' }
const btn = (extra={}) => ({ padding:'8px 16px', border:'none', borderRadius:'6px', fontWeight:'700', fontSize:'12px', cursor:'pointer', transition:'all .15s', ...extra })

function buildInitialState() {
  return INTEGRATIONS.reduce((m, i) => ({ ...m, [i.id]: { status:'disconnected', values:{}, showKeys:false } }), {})
}

export default function Integrations() {
  const [authorized,   setAuthorized]   = useState(true)
  const [integrations, setIntegrations] = useState(buildInitialState)
  const [expandedId,   setExpandedId]   = useState(null)
  const [filterCat,    setFilterCat]    = useState('All')
  const [saved,        setSaved]        = useState('')
  const [saving,       setSaving]       = useState(null)

  useEffect(() => {
    const { role } = getAuth()
    if (role && !isOwnerRole(role)) { setAuthorized(false); return }

    api.getIntegrations().then(list => {
      if (!Array.isArray(list)) return
      setIntegrations(prev => {
        const next = { ...prev }
        list.forEach(row => {
          if (next[row.type]) {
            next[row.type] = {
              ...next[row.type],
              status: row.status === 'active' ? 'connected' : 'disconnected',
              values: (row.config && typeof row.config === 'object') ? row.config : {},
            }
          }
        })
        return next
      })
    }).catch(() => {})
  }, [])

  if (!authorized) return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px', fontFamily:'sans-serif'}}>
      <div style={{fontSize:'48px'}}>🔒</div>
      <div style={{fontSize:'20px', fontWeight:'800'}}>Owner Access Only</div>
      <div style={{fontSize:'13px', color:'#7a8fa6', textAlign:'center', maxWidth:'320px', lineHeight:'1.6'}}>The Integrations page is restricted to the account owner.</div>
      <a href="/login" style={{marginTop:'8px', padding:'10px 24px', background:'#00e5a0', color:'#07090f', borderRadius:'6px', fontWeight:'700', fontSize:'13px', textDecoration:'none'}}>Go to Login</a>
    </div>
  )

  const saveMsg = (m) => { setSaved(m); setTimeout(() => setSaved(''), 2500) }

  const updateValue = (id, key, val) => {
    setIntegrations(prev => ({ ...prev, [id]: { ...prev[id], values: { ...prev[id].values, [key]: val } } }))
  }

  const saveKeys = async (id) => {
    const intg = INTEGRATIONS.find(i => i.id === id)
    const vals = integrations[id]?.values || {}
    setSaving(id)
    try {
      await api.saveIntegration(id, intg.name, vals)
      setIntegrations(prev => ({ ...prev, [id]: { ...prev[id], status: 'connected' } }))
      saveMsg(`${intg.name} keys saved!`)
    } catch {
      saveMsg('Failed to save — check your API keys')
    } finally {
      setSaving(null)
      setExpandedId(null)
    }
  }

  const toggleConnect = async (id) => {
    const intg = INTEGRATIONS.find(i => i.id === id)
    const isConn = integrations[id]?.status === 'connected'
    if (isConn) {
      try {
        await api.disconnectIntegration(id)
        setIntegrations(prev => ({ ...prev, [id]: { ...prev[id], status: 'disconnected' } }))
        saveMsg(`${intg.name} disconnected`)
      } catch {
        saveMsg('Disconnect failed')
      }
    } else {
      setExpandedId(id)
    }
  }

  const filtered = INTEGRATIONS.filter(i => filterCat === 'All' || i.category === filterCat)
  const connectedCount = Object.values(integrations).filter(v => v.status === 'connected').length

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif'}}>

      {/* Top bar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1e2d42', display:'flex', alignItems:'center', padding:'0 20px', gap:'14px', flexShrink:0}}>
        <div style={{fontWeight:'900', fontSize:'16px', letterSpacing:'-0.5px'}}>Hayya<span style={{color:'#00e5a0'}}> AI</span></div>
        <div style={{fontSize:'11px', color:'#3d4f63'}}>/ Integrations</div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'10px'}}>
          {saved && <span style={{fontSize:'11px', color:'#00e5a0', fontWeight:'600'}}>✓ {saved}</span>}
          <span style={{fontSize:'10px', padding:'4px 10px', background:'rgba(0,229,160,.08)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', color:'#00e5a0', fontWeight:'700'}}>{connectedCount} Connected</span>
          <div style={{fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.25)', color:'#00e5a0', borderRadius:'4px', fontWeight:'700'}}>● LIVE</div>
        </div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        <NavSidebar current="integrations" />

        {/* Main */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {/* Header + category filter */}
          <div style={{padding:'18px 24px', borderBottom:'1px solid #1e2d42', background:'#0c0f1a', flexShrink:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
              <div>
                <div style={{fontWeight:'900', fontSize:'18px'}}>Integrations Hub</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'2px'}}>Connect your tools — calendars, CRMs, ticketing, payments, and APIs</div>
              </div>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {['All', ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    style={btn({background: filterCat===c ? '#00e5a0' : '#111622', color: filterCat===c ? '#07090f' : '#7a8fa6', border:'1px solid', borderColor: filterCat===c ? '#00e5a0' : '#1e2d42', padding:'6px 12px', fontSize:'11px', borderRadius:'5px'})}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integration grid */}
          <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
            {CATEGORIES.filter(c => filterCat === 'All' || filterCat === c).map(cat => {
              const items = filtered.filter(i => i.category === cat)
              if (!items.length) return null
              return (
                <div key={cat} style={{marginBottom:'32px'}}>
                  <div style={{fontSize:'11px', color:'#3d4f63', letterSpacing:'2px', fontWeight:'700', marginBottom:'14px'}}>{cat.toUpperCase()}</div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px'}}>
                    {items.map(intg => {
                      const state    = integrations[intg.id]
                      const isConn   = state?.status === 'connected'
                      const isOpen   = expandedId === intg.id
                      const isSaving = saving === intg.id
                      return (
                        <div key={intg.id} style={{background:'#0f1520', border:'1px solid', borderColor: isConn ? intg.color+'40' : '#1e2d42', borderRadius:'10px', overflow:'hidden', transition:'border-color .2s'}}>
                          {/* Card header */}
                          <div style={{padding:'18px', display:'flex', alignItems:'flex-start', gap:'12px'}}>
                            <div style={{width:'44px', height:'44px', borderRadius:'10px', background:intg.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0}}>{intg.icon}</div>
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px'}}>
                                <div style={{fontWeight:'800', fontSize:'13px'}}>{intg.name}</div>
                                <span style={{fontSize:'8px', padding:'2px 6px', borderRadius:'3px', background:intg.color+'18', color:intg.color, fontWeight:'700', whiteSpace:'nowrap'}}>{intg.badge}</span>
                              </div>
                              <div style={{fontSize:'11px', color:'#7a8fa6', lineHeight:'1.5'}}>{intg.desc}</div>
                            </div>
                          </div>

                          {/* Status + action bar */}
                          <div style={{padding:'12px 18px', borderTop:'1px solid #1e2d42', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0c0f1a'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                              <div style={{width:'7px', height:'7px', borderRadius:'50%', background: isConn ? '#00e5a0' : '#3d4f63'}}></div>
                              <span style={{fontSize:'11px', color: isConn ? '#00e5a0' : '#7a8fa6', fontWeight: isConn ? '700' : '400'}}>{isConn ? 'Connected' : 'Not connected'}</span>
                            </div>
                            <div style={{display:'flex', gap:'8px'}}>
                              {(intg.setupUrl || intg.id === 'whatsapp') ? (
                                <a href={intg.setupUrl || '/integrations/whatsapp'}
                                  style={{...btn({background:`${intg.color}22`, color:intg.color, padding:'5px 12px', fontSize:'11px', border:`1px solid ${intg.color}44`, borderRadius:'5px'}), textDecoration:'none'}}>
                                  {intg.badge === 'Live' ? 'Open Setup →' : '⚙ Full Setup →'}
                                </a>
                              ) : (
                                <>
                                  <button onClick={() => setExpandedId(isOpen ? null : intg.id)}
                                    style={btn({background:'rgba(167,139,250,.1)', color:'#a78bfa', padding:'5px 12px', fontSize:'11px', border:'1px solid rgba(167,139,250,.2)', borderRadius:'5px'})}>
                                    {isOpen ? '▲ Hide' : '⚙ Configure'}
                                  </button>
                                  <button onClick={() => toggleConnect(intg.id)}
                                    style={btn({background: isConn ? 'rgba(239,68,68,.1)' : intg.color, color: isConn ? '#ef4444' : '#07090f', border: isConn ? '1px solid rgba(239,68,68,.25)' : 'none', padding:'5px 12px', fontSize:'11px', borderRadius:'5px'})}>
                                    {isConn ? 'Disconnect' : 'Connect'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Config panel (expanded) */}
                          {isOpen && (
                            <div style={{padding:'18px', borderTop:'1px solid #1e2d42', background:'#07090f', display:'flex', flexDirection:'column', gap:'12px'}}>
                              {intg.fields.map(f => (
                                <div key={f.key}>
                                  <label style={lbl}>{f.label}</label>
                                  <input
                                    type={state?.showKeys ? 'text' : f.type}
                                    value={state?.values?.[f.key] || ''}
                                    onChange={e => updateValue(intg.id, f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    style={inp}
                                  />
                                </div>
                              ))}
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'4px'}}>
                                <a href={intg.docs} target="_blank" rel="noopener noreferrer"
                                  style={{fontSize:'11px', color:'#7a8fa6', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}>
                                  📖 View API docs ↗
                                </a>
                                <div style={{display:'flex', gap:'8px'}}>
                                  <button onClick={() => setIntegrations(prev => ({...prev,[intg.id]:{...prev[intg.id],showKeys:!prev[intg.id]?.showKeys}}))}
                                    style={btn({background:'#111622', color:'#7a8fa6', padding:'6px 12px', fontSize:'11px', border:'1px solid #1e2d42'})}>
                                    {state?.showKeys ? '🙈 Hide' : '👁 Show'}
                                  </button>
                                  <button onClick={() => saveKeys(intg.id)} disabled={isSaving}
                                    style={btn({background: isSaving ? '#1e2d42' : 'linear-gradient(135deg,#00e5a0,#00c98a)', color: isSaving ? '#7a8fa6' : '#07090f', padding:'6px 16px', fontSize:'11px'})}>
                                    {isSaving ? 'Saving…' : 'Save Keys'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
