'use client'
import { useState } from 'react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id:'profile', icon:'👤', label:'Profile' },
    { id:'whatsapp', icon:'💬', label:'WhatsApp' },
    { id:'ai', icon:'🤖', label:'AI Settings' },
    { id:'team', icon:'👥', label:'Team' },
    { id:'billing', icon:'💳', label:'Billing' },
    { id:'security', icon:'🔐', label:'Security' },
  ]

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif'}}>

      {/* Topbar */}
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px', flexShrink:0}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Sidebar Nav */}
        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
          {['⊞','💬','👥','📊','🤖','⚙️'].map((icon, i) => (
            <div key={i} style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: i===5 ? 'rgba(0,229,160,.1)' : 'none', fontSize:'18px'}}>
              {icon}
            </div>
          ))}
        </div>

        {/* Settings Layout */}
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>

          {/* Settings Tabs */}
          <div style={{width:'200px', borderRight:'1px solid #1a2235', background:'#0c0f1a', padding:'20px 0', flexShrink:0}}>
            <div style={{padding:'0 16px', fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', marginBottom:'12px'}}>SETTINGS</div>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setActiveTab(t.id)} style={{padding:'10px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background: activeTab===t.id ? '#0f1520' : 'none', borderLeft: activeTab===t.id ? '2px solid #00e5a0' : '2px solid transparent', transition:'all .2s'}}>
                <span style={{fontSize:'15px'}}>{t.icon}</span>
                <span style={{fontSize:'12px', color: activeTab===t.id ? '#e2e8f0' : '#7a8fa6'}}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Settings Content */}
          <div style={{flex:1, overflowY:'auto', padding:'30px'}}>

            {activeTab === 'profile' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Profile Settings</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Manage your account information</div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px'}}>
                    <div style={{width:'60px', height:'60px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'700'}}>A</div>
                    <div>
                      <div style={{fontWeight:'600', marginBottom:'4px'}}>Abbas Al Masri</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>wopalncom@gmail.com</div>
                    </div>
                    <button style={{marginLeft:'auto', padding:'6px 14px', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', color:'#7a8fa6', fontSize:'11px', cursor:'pointer'}}>Change Photo</button>
                  </div>
                  {[
                    {label:'Full Name', value:'Abbas Al Masri'},
                    {label:'Email', value:'wopalncom@gmail.com'},
                    {label:'Phone', value:'+974 5555 0000'},
                    {label:'Company', value:'Hayyamed AI'},
                  ].map(f => (
                    <div key={f.label} style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                      <input defaultValue={f.value} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                    </div>
                  ))}
                </div>
                <button onClick={save} style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  {saved ? '✅ Saved!' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>WhatsApp Integration</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Connect your WhatsApp Business account</div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', padding:'14px', background:'rgba(0,229,160,.05)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'4px'}}>
                    <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#00e5a0'}}></div>
                    <div style={{fontSize:'12px', color:'#00e5a0', fontWeight:'600'}}>WhatsApp Connected</div>
                    <div style={{marginLeft:'auto', fontSize:'11px', color:'#7a8fa6'}}>+974 5555 0000</div>
                  </div>
                  {[
                    {label:'WhatsApp Business ID', value:'1234567890'},
                    {label:'Phone Number ID', value:'0987654321'},
                    {label:'Access Token', value:'EAABs...'},
                    {label:'Webhook Token', value:'hayyamed_webhook_2024'},
                  ].map(f => (
                    <div key={f.label} style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                      <input defaultValue={f.value} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                    </div>
                  ))}
                </div>
                <button onClick={save} style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  {saved ? '✅ Saved!' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'ai' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>AI Settings</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Configure your AI assistant</div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  {[
                    {label:'OpenAI API Key', value:'sk-...', type:'password'},
                    {label:'AI Model', value:'gpt-4-turbo'},
                    {label:'Bot Name', value:'Hayyamed Assistant'},
                    {label:'Default Language', value:'Arabic + English'},
                  ].map(f => (
                    <div key={f.label} style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                      <input defaultValue={f.value} type={f.type || 'text'} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                    </div>
                  ))}
                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>AI Personality / Instructions</div>
                    <textarea rows={4} defaultValue="You are a helpful assistant for Hayyamed AI. Always be polite and professional. Respond in the same language as the customer." style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none', resize:'vertical'}}/>
                  </div>
                </div>
                <button onClick={save} style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  {saved ? '✅ Saved!' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'billing' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Billing & Subscription</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Manage your plan and payments</div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                    <div>
                      <div style={{fontWeight:'700', fontSize:'14px', marginBottom:'4px'}}>Pro Plan</div>
                      <div style={{fontSize:'12px', color:'#7a8fa6'}}>QAR 299 / month</div>
                    </div>
                    <span style={{padding:'4px 12px', background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.2)', borderRadius:'2px', color:'#00e5a0', fontSize:'11px'}}>Active</span>
                  </div>
                  {[
                    {label:'Contacts', used:'2,847', total:'10,000', pct:28},
                    {label:'Messages/month', used:'14,230', total:'50,000', pct:28},
                    {label:'AI Responses', used:'8,940', total:'20,000', pct:45},
                  ].map(u => (
                    <div key={u.label} style={{marginBottom:'16px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                        <div style={{fontSize:'11px', color:'#7a8fa6'}}>{u.label}</div>
                        <div style={{fontSize:'11px', color:'#3d4f63'}}>{u.used} / {u.total}</div>
                      </div>
                      <div style={{height:'4px', background:'#1a2235', borderRadius:'2px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${u.pct}%`, background:'#00e5a0', borderRadius:'2px'}}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>Upgrade Plan</button>
              </div>
            )}

            {activeTab === 'team' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Team Members</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Manage your team access</div>
                {[
                  {name:'Abbas Al Masri', email:'wopalncom@gmail.com', role:'Owner', color:'#00e5a0'},
                  {name:'Sara Ahmed', email:'sara@hayyamed.ai', role:'Admin', color:'#3b82f6'},
                  {name:'Mohammed Ali', email:'m.ali@hayyamed.ai', role:'Agent', color:'#a78bfa'},
                ].map(m => (
                  <div key={m.email} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px', borderRadius:'4px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{width:'36px', height:'36px', borderRadius:'50%', background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#07090f'}}>{m.name[0]}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'12px', fontWeight:'600'}}>{m.name}</div>
                      <div style={{fontSize:'11px', color:'#7a8fa6'}}>{m.email}</div>
                    </div>
                    <span style={{fontSize:'10px', padding:'3px 8px', background:'#111622', border:'1px solid #1a2235', borderRadius:'2px', color:'#7a8fa6'}}>{m.role}</span>
                  </div>
                ))}
                <button style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer', marginTop:'8px'}}>+ Invite Member</button>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{maxWidth:'560px'}}>
                <div style={{fontWeight:'800', fontSize:'18px', marginBottom:'6px'}}>Security</div>
                <div style={{fontSize:'12px', color:'#7a8fa6', marginBottom:'24px'}}>Keep your account secure</div>
                <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'24px', borderRadius:'4px', marginBottom:'16px'}}>
                  {[
                    {label:'Current Password', type:'password'},
                    {label:'New Password', type:'password'},
                    {label:'Confirm Password', type:'password'},
                  ].map(f => (
                    <div key={f.label} style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'11px', color:'#7a8fa6', marginBottom:'6px'}}>{f.label}</div>
                      <input type={f.type} style={{width:'100%', background:'#111622', border:'1px solid #1a2235', borderRadius:'4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'12px', outline:'none'}}/>
                    </div>
                  ))}
                </div>
                <button onClick={save} style={{padding:'10px 24px', background:'#00e5a0', border:'none', borderRadius:'4px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>
                  {saved ? '✅ Saved!' : 'Update Password'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}