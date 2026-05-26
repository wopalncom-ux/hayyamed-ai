'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState } from 'react'

const templates = [
  { id:1, name:'Ramadan Offer', channel:'WhatsApp', text:'🌙 Ramadan Kareem! We have a special offer for you this holy month. Get exclusive access to our services. Book now and let us serve you better. Reply YES to know more!', category:'Religious' },
  { id:2, name:'New Service Launch', channel:'WhatsApp', text:'🎉 Exciting News! We just launched a new service. Be the first to try it! Limited slots available. Reply INTERESTED to book your spot.', category:'Product' },
  { id:3, name:'Follow Up', channel:'WhatsApp', text:'Hello {name}! 👋 We noticed you were interested in our services. We would love to help you. Do you have any questions? Our team is ready to assist you right now!', category:'Follow Up' },
  { id:4, name:'Appointment Reminder', channel:'WhatsApp', text:'📅 Reminder: You have an appointment tomorrow. Please confirm your attendance by replying YES or contact us to reschedule.', category:'Reminder' },
  { id:5, name:'Instagram Caption', channel:'Instagram', text:'✨ Transform your experience with us! We bring the best quality service to Qatar. Book your appointment today. Link in bio! #Qatar #Doha #QatarBusiness', category:'Social' },
  { id:6, name:'Email Newsletter', channel:'Email', text:'Dear {name},\n\nWe hope this message finds you well. We wanted to share some exciting updates about our services.\n\nWe have been working hard to improve your experience and we would love for you to be among the first to benefit.\n\nClick below to learn more.\n\nBest regards,\nHayyamed AI Team', category:'Email' },
]

const campaigns = [
  { id:1, name:'Ramadan 2024', channel:'WhatsApp', status:'Completed', sent:1234, leads:89, bookings:34, openRate:'72%', clickRate:'34%', date:'2024-03-15' },
  { id:2, name:'Summer Sale', channel:'Instagram', status:'Active', sent:890, leads:56, bookings:18, openRate:'65%', clickRate:'28%', date:'2024-06-01' },
  { id:3, name:'Eid Special', channel:'Facebook', status:'Active', sent:456, leads:34, bookings:12, openRate:'58%', clickRate:'22%', date:'2024-04-10' },
  { id:4, name:'Monthly Newsletter', channel:'Email', status:'Completed', sent:2100, leads:45, bookings:8, openRate:'42%', clickRate:'18%', date:'2024-05-01' },
]

const statusColors = { Active:'#00e5a0', Completed:'#3b82f6', Draft:'#f97316', Scheduled:'#a78bfa' }
const channelIcons = { WhatsApp:'💬', Instagram:'📸', Facebook:'👤', Telegram:'✈️', Email:'📧' }
const channelColors = { WhatsApp:'#00e5a0', Instagram:'#a78bfa', Facebook:'#3b82f6', Telegram:'#f97316', Email:'#fbbf24' }

export default function Campaigns() {
  const [tab, setTab] = useState('list')
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState('WhatsApp')
  const [importedContacts, setImportedContacts] = useState([])
  const [sent, setSent] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewContacts, setPreviewContacts] = useState([])
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [advisorQuery, setAdvisorQuery] = useState('')
  const [advisorResponse, setAdvisorResponse] = useState('')
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')

  const generateAIText = async () => {
    if (!aiPrompt) return
    setGenerating(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a ${channel} campaign message for: ${aiPrompt}. 
          Make it engaging, professional and suitable for Qatar market. 
          Include relevant emojis. Keep it under 200 words.
          Do not mention any prices or amounts.
          For WhatsApp: conversational and personal.
          For Instagram: use hashtags.
          For Facebook: more detailed.
          For Email: formal with greeting and signature.`,
          history: [{ role:'system', content:'You are an expert marketing copywriter for Qatar and GCC market.' }]
        })
      })
      const data = await res.json()
      setMessage(data.reply)
    } catch {
      setMessage('Could not generate text. Please try again.')
    }
    setGenerating(false)
  }

  const askAdvisor = async (query) => {
    setAdvisorLoading(true)
    setAdvisorResponse('')
    try {
      const campaignData = campaigns.map(c => 
        `${c.name}: ${c.sent} sent, ${c.leads} leads, ${c.bookings} bookings, ${c.openRate} open rate`
      ).join('\n')
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${query}\n\nCampaign Data:\n${campaignData}`,
          history: [{ 
            role:'system', 
            content:'You are a campaign advisor for a Qatar CRM platform. Analyze campaign data and give specific actionable advice. Do not mention money or revenue amounts. Focus on leads, bookings, open rates and engagement.' 
          }]
        })
      })
      const data = await res.json()
      setAdvisorResponse(data.reply)
    } catch {
      setAdvisorResponse('Advisor is not available right now.')
    }
    setAdvisorLoading(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedFile(file)
    const mockContacts = [
      { phone:'+974 5551 2345', name:'Ahmed Al Rashid', email:'ahmed@email.com' },
      { phone:'+974 5552 3456', name:'Fatima Hassan', email:'' },
      { phone:'+974 5553 4567', name:'', email:'' },
      { phone:'+974 5554 5678', name:'Sara Al Kuwari', email:'sara@email.com' },
      { phone:'+974 5555 6789', name:'', email:'' },
    ]
    setPreviewContacts(mockContacts)
    setShowImportPreview(true)
  }

  const exportCSV = (campaign) => {
    const headers = ['Name', 'Phone', 'Status', 'Lead', 'Booked', 'Channel', 'Date']
    const rows = [
      ['Ahmed Al Rashid', '+974 5551 2345', 'Hot Lead', 'Yes', 'Yes', campaign.channel, campaign.date],
      ['Fatima Hassan', '+974 5552 3456', 'Customer', 'Yes', 'No', campaign.channel, campaign.date],
      ['Mohammed Al Ali', '+974 5553 4567', 'Cold Lead', 'No', 'No', campaign.channel, campaign.date],
    ]
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name}-report.csv`
    a.click()
  }

  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setMessage(template.text)
    setChannel(template.channel)
    setTab('create')
  }

  const sendCampaign = () => {
    if (!campaignName || !message) return
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        <NavSidebar current="campaigns" />

        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          <div style={{padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}>
            <div style={{fontWeight:'700', fontSize:'14px', marginRight:'8px'}}>Campaign Manager</div>
            {[
              {id:'list', label:'📋 Campaigns'},
              {id:'create', label:'✏️ New Campaign'},
              {id:'templates', label:'📝 Templates'},
              {id:'import', label:'📥 Import Contacts'},
              {id:'reports', label:'📊 Reports'},
              {id:'advisor', label:'🤖 AI Advisor'},
              {id:'comments', label:'💬 Comments'},
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'5px 10px', background: tab===t.id ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: tab===t.id ? '#07090f' : '#7a8fa6', fontSize:'10px', cursor:'pointer', fontWeight: tab===t.id ? '700' : '400'}}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{flex:1, overflowY:'auto', padding:'20px'}}>

            {/* Campaign List */}
            {tab === 'list' && (
              <div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px'}}>
                  {[
                    {label:'TOTAL CAMPAIGNS', value:campaigns.length, color:'#00e5a0'},
                    {label:'ACTIVE', value:campaigns.filter(c=>c.status==='Active').length, color:'#3b82f6'},
                    {label:'TOTAL LEADS', value:campaigns.reduce((s,c)=>s+c.leads,0), color:'#a78bfa'},
                    {label:'TOTAL BOOKINGS', value:campaigns.reduce((s,c)=>s+c.bookings,0), color:'#f97316'},
                  ].map((k,i) => (
                    <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderTop:`2px solid ${k.color}`}}>
                      <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'8px'}}>{k.label}</div>
                      <div style={{fontSize:'22px', fontWeight:'800'}}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
                    {['CAMPAIGN','CHANNEL','STATUS','SENT','LEADS','BOOKINGS','OPEN RATE'].map(h => (
                      <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{h}</div>
                    ))}
                  </div>
                  {campaigns.map(c => (
                    <div key={c.id} onClick={() => setSelectedCampaign(c)} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:'1px solid #1a2235', alignItems:'center', cursor:'pointer', background: selectedCampaign?.id===c.id ? '#0f1520' : 'none'}}>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{c.name}</div>
                      <div style={{fontSize:'12px'}}>{channelIcons[c.channel]}</div>
                      <div><span style={{fontSize:'10px', padding:'2px 7px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status]}}>{c.status}</span></div>
                      <div style={{fontSize:'12px', color:'#7a8fa6'}}>{c.sent.toLocaleString()}</div>
                      <div style={{fontSize:'12px', color:'#3b82f6', fontWeight:'600'}}>{c.leads}</div>
                      <div style={{fontSize:'12px', color:'#a78bfa', fontWeight:'600'}}>{c.bookings}</div>
                      <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'600'}}>{c.openRate}</div>
                    </div>
                  ))}
                </div>

                {selectedCampaign && (
                  <div style={{marginTop:'16px', background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                      <div style={{fontWeight:'700', fontSize:'14px'}}>{selectedCampaign.name} — Details</div>
                      <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => exportCSV(selectedCampaign)} style={{padding:'6px 12px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>📥 Export CSV</button>
                        <button onClick={() => { setTab('advisor'); setAdvisorQuery(`Analyze campaign: ${selectedCampaign.name}`); askAdvisor(`Analyze this campaign and give recommendations: ${selectedCampaign.name}, sent: ${selectedCampaign.sent}, leads: ${selectedCampaign.leads}, bookings: ${selectedCampaign.bookings}, open rate: ${selectedCampaign.openRate}`) }} style={{padding:'6px 12px', background:'#a78bfa', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>🤖 AI Analysis</button>
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
                      {[
                        {label:'Sent', value:selectedCampaign.sent.toLocaleString(), color:'#7a8fa6'},
                        {label:'Leads Generated', value:selectedCampaign.leads, color:'#3b82f6'},
                        {label:'Bookings', value:selectedCampaign.bookings, color:'#a78bfa'},
                        {label:'Open Rate', value:selectedCampaign.openRate, color:'#00e5a0'},
                      ].map(s => (
                        <div key={s.label} style={{textAlign:'center', padding:'14px', background:'#111622', borderRadius:'4px'}}>
                          <div style={{fontSize:'20px', fontWeight:'800', color:s.color}}>{s.value}</div>
                          <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'4px'}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create Campaign */}
            {tab === 'create' && (
              <div style={{maxWidth:'700px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Create New Campaign</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Send bulk messages to your contacts</div>

                {sent && (
                  <div style={{padding:'14px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.3)', borderRadius:'4px', marginBottom:'20px', color:'#00e5a0', fontWeight:'600'}}>
                    ✅ Campaign launched successfully!
                  </div>
                )}

                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>CAMPAIGN NAME</div>
                    <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Ramadan 2024 Offer" style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>CHANNEL</div>
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                      {['WhatsApp','Instagram','Facebook','Telegram','Email'].map(ch => (
                        <button key={ch} onClick={() => setChannel(ch)} style={{padding:'8px 14px', background: channel===ch ? channelColors[ch] : '#111622', border:'1px solid', borderColor: channel===ch ? channelColors[ch] : '#1a2235', borderRadius:'4px', color: channel===ch ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: channel===ch ? '700' : '400'}}>
                          {channelIcons[ch]} {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  {channel === 'Email' && (
                    <div style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>EMAIL SUBJECT</div>
                      <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="e.g. Special offer just for you!" style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                    </div>
                  )}

                  <div style={{marginBottom:'16px', padding:'14px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px'}}>
                    <div style={{fontSize:'11px', color:'#a78bfa', fontWeight:'600', marginBottom:'8px'}}>🤖 AI TEXT GENERATOR</div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key==='Enter' && generateAIText()} placeholder="Describe your campaign... e.g. 'Promote dental checkup service for families'" style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'8px 12px', color:'#e2e8f0', fontSize:'11px', outline:'none'}}/>
                      <button onClick={generateAIText} disabled={generating} style={{padding:'8px 14px', background: generating ? '#1a2235' : '#a78bfa', border:'none', borderRadius:'4px', color: generating ? '#7a8fa6' : '#07090f', fontWeight:'700', fontSize:'11px', cursor: generating ? 'not-allowed' : 'pointer', whiteSpace:'nowrap'}}>
                        {generating ? '...' : '✨ Generate'}
                      </button>
                    </div>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>MESSAGE <span style={{color:'#3d4f63'}}>(use {'{name}'} to personalize)</span></div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Type your message or use AI generator above..." style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', resize:'vertical'}}/>
                    <div style={{fontSize:'10px', color:'#3d4f63', marginTop:'4px'}}>{message.length} characters</div>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>ATTACH IMAGE (Optional)</div>
                    <div style={{border:'1px dashed #1a2235', borderRadius:'4px', padding:'16px', textAlign:'center', cursor:'pointer', background:'#111622'}} onClick={() => document.getElementById('imageUpload').click()}>
                      <div style={{fontSize:'20px', marginBottom:'4px'}}>🖼️</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>Upload image or post</div>
                      <input id="imageUpload" type="file" accept="image/*" style={{display:'none'}} onChange={e => alert(`✅ Image "${e.target.files[0]?.name}" ready to send!`)}/>
                    </div>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'8px'}}>RECIPIENTS</div>
                    {importedContacts.length > 0 ? (
                      <div style={{padding:'10px 14px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px', fontSize:'11px', color:'#00e5a0', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                        <span>✅ {importedContacts.length} contacts ready</span>
                        <button onClick={() => setTab('import')} style={{background:'none', border:'none', color:'#7a8fa6', fontSize:'10px', cursor:'pointer', textDecoration:'underline'}}>Change</button>
                      </div>
                    ) : (
                      <button onClick={() => setTab('import')} style={{width:'100%', padding:'10px', background:'#111622', border:'1px dashed #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>
                        📥 Import contacts from Excel/CSV
                      </button>
                    )}
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>SCHEDULE (Optional)</div>
                    <input type="datetime-local" style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                  </div>
                </div>

                <button onClick={sendCampaign} style={{width:'100%', padding:'12px', background: campaignName && message ? '#00e5a0' : '#1a2235', border:'none', borderRadius:'4px', color: campaignName && message ? '#07090f' : '#3d4f63', fontWeight:'700', fontSize:'13px', cursor:'pointer'}}>
                  🚀 Launch Campaign
                </button>
              </div>
            )}

            {/* Templates */}
            {tab === 'templates' && (
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Campaign Templates</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'20px'}}>Select a ready-made template to get started</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px'}}>
                  {templates.map(t => (
                    <div key={t.id} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'18px', borderRadius:'4px'}}>
                      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                        <div style={{fontWeight:'700', fontSize:'13px'}}>{t.name}</div>
                        <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                          <span style={{fontSize:'14px'}}>{channelIcons[t.channel]}</span>
                          <span style={{fontSize:'9px', padding:'2px 7px', background:'#111622', border:'1px solid #1a2235', borderRadius:'2px', color:'#7a8fa6'}}>{t.category}</span>
                        </div>
                      </div>
                      <div style={{fontSize:'11px', color:'#7a8fa6', lineHeight:'1.6', marginBottom:'14px', maxHeight:'80px', overflow:'hidden'}}>{t.text}</div>
                      <button onClick={() => applyTemplate(t)} style={{width:'100%', padding:'8px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>
                        Use Template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Contacts */}
            {tab === 'import' && (
              <div style={{maxWidth:'600px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Import Contacts</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Upload your contact list — phone number is required, name and email are optional</div>

                <div style={{border:'2px dashed #1a2235', borderRadius:'4px', padding:'40px', textAlign:'center', cursor:'pointer', background:'#0f1520', marginBottom:'20px'}} onClick={() => document.getElementById('csvUpload').click()}>
                  <div style={{fontSize:'40px', marginBottom:'12px'}}>📊</div>
                  <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'6px'}}>Upload Excel or CSV File</div>
                  <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'6px'}}>Drag and drop or click to browse</div>
                  <div style={{fontSize:'11px', color:'#3d4f63'}}>Supported: .xlsx, .xls, .csv</div>
                  <input id="csvUpload" type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={handleFileUpload}/>
                  {uploadedFile && <div style={{marginTop:'12px', fontSize:'12px', color:'#00e5a0'}}>✅ {uploadedFile.name} uploaded</div>}
                </div>

                <div style={{padding:'16px', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', marginBottom:'20px'}}>
                  <div style={{fontSize:'12px', fontWeight:'600', marginBottom:'8px'}}>📋 Column Format:</div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px'}}>
                    <div style={{padding:'10px', background:'#111622', border:'1px solid #00e5a0', borderRadius:'4px', textAlign:'center'}}>
                      <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'700'}}>phone</div>
                      <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'3px'}}>REQUIRED</div>
                    </div>
                    <div style={{padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', textAlign:'center'}}>
                      <div style={{fontSize:'12px', color:'#7a8fa6', fontWeight:'700'}}>name</div>
                      <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'3px'}}>optional</div>
                    </div>
                    <div style={{padding:'10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', textAlign:'center'}}>
                      <div style={{fontSize:'12px', color:'#7a8fa6', fontWeight:'700'}}>email</div>
                      <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'3px'}}>optional</div>
                    </div>
                  </div>
                  <button style={{padding:'7px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>
                    ⬇️ Download Sample Template
                  </button>
                </div>

                {showImportPreview && (
                  <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden', marginBottom:'16px'}}>
                    <div style={{padding:'12px 16px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', fontWeight:'700', fontSize:'13px'}}>
                      Preview — {previewContacts.length} contacts found
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'8px 16px', borderBottom:'1px solid #1a2235', background:'#0c0f1a'}}>
                      {['PHONE (Required)','NAME (Optional)','EMAIL (Optional)'].map(h => (
                        <div key={h} style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px'}}>{h}</div>
                      ))}
                    </div>
                    {previewContacts.map((c, i) => (
                      <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'10px 16px', borderBottom:'1px solid #1a2235', alignItems:'center'}}>
                        <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'600'}}>{c.phone}</div>
                        <div style={{fontSize:'12px', color: c.name ? '#e2e8f0' : '#3d4f63'}}>{c.name || '—'}</div>
                        <div style={{fontSize:'12px', color: c.email ? '#e2e8f0' : '#3d4f63'}}>{c.email || '—'}</div>
                      </div>
                    ))}
                    <div style={{padding:'12px 16px', display:'flex', gap:'10px'}}>
                      <button onClick={() => { setImportedContacts(previewContacts); setShowImportPreview(false); alert(`✅ ${previewContacts.length} contacts imported!`) }} style={{flex:1, padding:'10px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                        ✅ Import {previewContacts.length} Contacts
                      </button>
                      <button onClick={() => setShowImportPreview(false)} style={{padding:'10px 16px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'12px', cursor:'pointer'}}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reports */}
            {tab === 'reports' && (
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Campaign Reports</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'20px'}}>View and export detailed reports for each campaign</div>

                {campaigns.map(c => (
                  <div key={c.id} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px', marginBottom:'14px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                      <div>
                        <div style={{fontWeight:'700', fontSize:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
                          {channelIcons[c.channel]} {c.name}
                          <span style={{fontSize:'10px', padding:'2px 7px', borderRadius:'2px', background:`${statusColors[c.status]}20`, color:statusColors[c.status]}}>{c.status}</span>
                        </div>
                        <div style={{fontSize:'11px', color:'#3d4f63', marginTop:'3px'}}>{c.date}</div>
                      </div>
                      <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => exportCSV(c)} style={{padding:'6px 12px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>📥 CSV</button>
                        <button onClick={() => { setTab('advisor'); askAdvisor(`Analyze campaign ${c.name}: sent ${c.sent}, leads ${c.leads}, bookings ${c.bookings}, open rate ${c.openRate}. Give me detailed analysis and recommendations.`) }} style={{padding:'6px 12px', background:'#a78bfa', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'11px', cursor:'pointer'}}>🤖 Analyze</button>
                      </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px'}}>
                      {[
                        {label:'Sent', value:c.sent.toLocaleString(), color:'#7a8fa6'},
                        {label:'Leads', value:c.leads, color:'#3b82f6'},
                        {label:'Bookings', value:c.bookings, color:'#a78bfa'},
                        {label:'Open Rate', value:c.openRate, color:'#00e5a0'},
                        {label:'Click Rate', value:c.clickRate, color:'#f97316'},
                      ].map(s => (
                        <div key={s.label} style={{textAlign:'center', padding:'12px', background:'#111622', borderRadius:'4px'}}>
                          <div style={{fontSize:'18px', fontWeight:'800', color:s.color}}>{s.value}</div>
                          <div style={{fontSize:'9px', color:'#3d4f63', marginTop:'3px'}}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bars */}
                    <div style={{marginTop:'14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                          <div style={{fontSize:'10px', color:'#7a8fa6'}}>Lead Rate</div>
                          <div style={{fontSize:'10px', color:'#3b82f6'}}>{Math.round((c.leads/c.sent)*100)}%</div>
                        </div>
                        <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${Math.round((c.leads/c.sent)*100)}%`, background:'#3b82f6', borderRadius:'3px'}}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                          <div style={{fontSize:'10px', color:'#7a8fa6'}}>Booking Rate</div>
                          <div style={{fontSize:'10px', color:'#a78bfa'}}>{Math.round((c.bookings/c.leads)*100)}%</div>
                        </div>
                        <div style={{height:'6px', background:'#1a2235', borderRadius:'3px', overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${Math.round((c.bookings/c.leads)*100)}%`, background:'#a78bfa', borderRadius:'3px'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Advisor */}
            {tab === 'advisor' && (
              <div style={{maxWidth:'700px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>🤖 Campaign AI Advisor</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'20px'}}>Get AI-powered insights and recommendations for your campaigns</div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'20px'}}>
                  {[
                    'Analyze all my campaigns and give recommendations',
                    'Which campaign performed best and why?',
                    'How can I improve my open rate?',
                    'What is the best time to send campaigns?',
                    'Which channel should I focus on?',
                    'How to increase bookings from leads?',
                    'Suggest next campaign ideas for Qatar market',
                    'How to prove campaign results to my client?',
                  ].map(q => (
                    <button key={q} onClick={() => { setAdvisorQuery(q); askAdvisor(q) }} style={{padding:'10px 14px', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer', textAlign:'left', lineHeight:'1.4'}}>
                      💡 {q}
                    </button>
                  ))}
                </div>

                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'8px'}}>ASK ANYTHING ABOUT YOUR CAMPAIGNS:</div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <input
                      value={advisorQuery}
                      onChange={e => setAdvisorQuery(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && askAdvisor(advisorQuery)}
                      placeholder="e.g. Why are my leads not converting to bookings?"
                      style={{flex:1, background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}
                    />
                    <button onClick={() => askAdvisor(advisorQuery)} disabled={advisorLoading} style={{padding:'10px 18px', background: advisorLoading ? '#1a2235' : '#a78bfa', border:'none', borderRadius:'4px', color: advisorLoading ? '#7a8fa6' : '#07090f', fontWeight:'700', fontSize:'12px', cursor: advisorLoading ? 'not-allowed' : 'pointer'}}>
                      {advisorLoading ? '...' : 'Ask AI'}
                    </button>
                  </div>
                </div>

                {advisorLoading && (
                  <div style={{padding:'20px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'12px', color:'#a78bfa'}}>
                    🤖 Analyzing your campaign data...
                  </div>
                )}

                {advisorResponse && !advisorLoading && (
                  <div style={{padding:'20px', background:'rgba(167,139,250,.05)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'4px', fontSize:'12px', color:'#e2e8f0', lineHeight:'1.8', whiteSpace:'pre-wrap'}}>
                    <div style={{fontSize:'10px', color:'#a78bfa', fontWeight:'700', marginBottom:'10px'}}>🤖 AI ADVISOR RESPONSE:</div>
                    {advisorResponse}
                  </div>
                )}
              </div>
            )}

            {/* Comments Manager */}
            {tab === 'comments' && (
              <div>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Comments Manager</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'20px'}}>Manage Facebook and Instagram comments from one place</div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px', marginBottom:'20px'}}>
                  {[
                    {platform:'Facebook', icon:'👤', color:'#3b82f6'},
                    {platform:'Instagram', icon:'📸', color:'#a78bfa'},
                  ].map(p => (
                    <div key={p.platform} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'12px'}}>
                      <span style={{fontSize:'28px'}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'600', fontSize:'13px'}}>{p.platform} Page</div>
                        <div style={{fontSize:'11px', color:'#ef4444', marginTop:'2px'}}>● Not Connected</div>
                      </div>
                      <button style={{padding:'6px 14px', background:p.color, border:'none', borderRadius:'4px', color:'white', fontSize:'11px', cursor:'pointer', fontWeight:'600'}}>Connect</button>
                    </div>
                  ))}
                </div>

                <div style={{background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', overflow:'hidden'}}>
                  <div style={{padding:'12px 18px', borderBottom:'1px solid #1a2235', background:'#0c0f1a', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <div style={{fontWeight:'700', fontSize:'13px'}}>Recent Comments</div>
                    <div style={{display:'flex', gap:'6px'}}>
                      {['All','Unanswered','Leads','Spam'].map(f => (
                        <button key={f} style={{padding:'4px 8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'3px', color:'#7a8fa6', fontSize:'10px', cursor:'pointer'}}>{f}</button>
                      ))}
                    </div>
                  </div>

                  {[
                    { platform:'Instagram', user:'@ahmed_qa', post:'Summer Sale Post', comment:'How much does it cost?', time:'2 min ago', status:'Unanswered', isLead:true },
                    { platform:'Facebook', user:'Fatima Hassan', post:'New Service Launch', comment:'I am interested! Please contact me', time:'15 min ago', status:'Unanswered', isLead:true },
                    { platform:'Instagram', user:'@m_ali_doha', post:'Summer Sale Post', comment:'Great service! Highly recommended', time:'1 hour ago', status:'Answered', isLead:false },
                    { platform:'Facebook', user:'Sara Al Kuwari', post:'Ramadan Offer', comment:'What are your working hours?', time:'2 hours ago', status:'Unanswered', isLead:false },
                  ].map((c, i) => (
                    <div key={i} style={{padding:'14px 18px', borderBottom:'1px solid #1a2235'}}>
                      <div style={{display:'flex', gap:'12px', alignItems:'flex-start'}}>
                        <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#1a2235', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0}}>
                          {c.platform === 'Instagram' ? '📸' : '👤'}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap'}}>
                            <div style={{fontSize:'12px', fontWeight:'600'}}>{c.user}</div>
                            {c.isLead && <span style={{fontSize:'9px', padding:'2px 6px', background:'rgba(249,115,22,.2)', color:'#f97316', borderRadius:'2px'}}>LEAD</span>}
                            <span style={{fontSize:'9px', padding:'2px 6px', background: c.status==='Answered' ? 'rgba(0,229,160,.1)' : 'rgba(239,68,68,.1)', color: c.status==='Answered' ? '#00e5a0' : '#ef4444', borderRadius:'2px'}}>{c.status}</span>
                            <span style={{fontSize:'10px', color:'#3d4f63', marginLeft:'auto'}}>{c.time}</span>
                          </div>
                          <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'4px'}}>On: {c.post}</div>
                          <div style={{fontSize:'12px', color:'#e2e8f0', marginBottom:'10px'}}>{c.comment}</div>
                          <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                            <button style={{padding:'5px 10px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'3px', color:'#00e5a0', fontSize:'10px', cursor:'pointer'}}>💬 Reply</button>
                            <button style={{padding:'5px 10px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'3px', color:'#3b82f6', fontSize:'10px', cursor:'pointer'}}>👤 Add to CRM</button>
                            <button style={{padding:'5px 10px', background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'3px', color:'#a78bfa', fontSize:'10px', cursor:'pointer'}}>🤖 AI Reply</button>
                            <button style={{padding:'5px 10px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'3px', color:'#ef4444', fontSize:'10px', cursor:'pointer'}}>🗑️ Hide</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}