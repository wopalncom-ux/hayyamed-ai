'use client'
import { useState } from 'react'

const translations = {
  en: {
    title: 'Dashboard',
    subtitle: 'Welcome back — here is what is happening today',
    contacts: 'TOTAL CONTACTS',
    chats: 'ACTIVE CHATS',
    ai: 'AI RESPONSES',
    revenue: 'REVENUE',
    messages: 'Messages This Week',
    activity: 'Recent Activity',
    a1: 'New lead from WhatsApp',
    a2: 'AI replied to 5 messages',
    a3: 'Campaign sent to 234 contacts',
    a4: 'New client onboarded',
  },
  ar: {
    title: 'لوحة التحكم',
    subtitle: 'مرحباً بعودتك — إليك ما يحدث اليوم',
    contacts: 'إجمالي جهات الاتصال',
    chats: 'المحادثات النشطة',
    ai: 'ردود الذكاء الاصطناعي',
    revenue: 'الإيرادات',
    messages: 'الرسائل هذا الأسبوع',
    activity: 'النشاط الأخير',
    a1: 'عميل جديد من واتساب',
    a2: 'الذكاء الاصطناعي رد على 5 رسائل',
    a3: 'تم إرسال حملة لـ 234 جهة اتصال',
    a4: 'تم تأهيل عميل جديد',
  }
}

export default function Dashboard() {
  const [lang, setLang] = useState('en')
  const [showMenu, setShowMenu] = useState(false)
  const t = translations[lang]
  const isAr = lang === 'ar'

  const logout = () => {
    localStorage.removeItem('hayyamed_auth')
    window.location.href = '/login'
  }

  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'sans-serif', direction: isAr ? 'rtl' : 'ltr'}}>

      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px'}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>Hayya<span style={{color:'#00e5a0'}}>med</span> AI</div>
        <div style={{marginLeft: isAr ? '0' : 'auto', marginRight: isAr ? 'auto' : '0', display:'flex', gap:'6px'}}>
          <button onClick={() => setLang('en')} style={{padding:'4px 10px', background: lang==='en' ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: lang==='en' ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: lang==='en' ? '700' : '400'}}>EN</button>
          <button onClick={() => setLang('ar')} style={{padding:'4px 10px', background: lang==='ar' ? '#00e5a0' : '#111622', border:'1px solid #1a2235', borderRadius:'4px', color: lang==='ar' ? '#07090f' : '#7a8fa6', fontSize:'11px', cursor:'pointer', fontWeight: lang==='ar' ? '700' : '400'}}>عربي</button>
        </div>
        <div style={{fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>

        {/* Avatar with logout */}
        <div style={{position:'relative'}}>
          <div onClick={() => setShowMenu(!showMenu)} style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', cursor:'pointer'}}>A</div>
          {showMenu && (
            <div style={{position:'absolute', top:'38px', right:'0', background:'#0f1520', border:'1px solid #1a2235', borderRadius:'4px', minWidth:'160px', zIndex:100, padding:'8px'}}>
              <div style={{padding:'8px 12px', fontSize:'12px', color:'#7a8fa6', borderBottom:'1px solid #1a2235', marginBottom:'4px'}}>Abbas Al Masri</div>
              <a href="/settings" style={{display:'block', padding:'8px 12px', fontSize:'12px', color:'#e2e8f0', textDecoration:'none', borderRadius:'3px'}}>⚙️ Settings</a>
              <a href="/profile" style={{display:'block', padding:'8px 12px', fontSize:'12px', color:'#e2e8f0', textDecoration:'none', borderRadius:'3px'}}>👤 Profile</a>
              <div onClick={logout} style={{padding:'8px 12px', fontSize:'12px', color:'#ef4444', cursor:'pointer', borderTop:'1px solid #1a2235', marginTop:'4px', borderRadius:'3px'}}>🚪 Logout</div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex', height:'calc(100vh - 52px)'}}>

        <div style={{width:'56px', background:'#0c0f1a', borderRight: isAr ? 'none' : '1px solid #1a2235', borderLeft: isAr ? '1px solid #1a2235' : 'none', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px'}}>
          <a href="/dashboard" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,229,160,.1)', fontSize:'18px', textDecoration:'none'}}>⊞</a>
          <a href="/inbox" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>💬</a>
          <a href="/contacts" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>👥</a>
          <a href="/analytics" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📈</a>
          <a href="/reports" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📊</a>
          <a href="/campaigns" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>📣</a>
          <a href="/chatbot" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🤖</a>
          <a href="/agency" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🏢</a>
          <a href="/notifications" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>🔔</a>
          <a href="/settings" style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none'}}>⚙️</a>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'20px'}}>

          <div>
            <div style={{fontWeight:'800', fontSize:'20px'}}>{t.title}</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>{t.subtitle}</div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
            {[
              {label:t.contacts, value:'2,847', change:'+12%', color:'#00e5a0'},
              {label:t.chats, value:'143', change:'+8%', color:'#3b82f6'},
              {label:t.ai, value:'89%', change:'+3%', color:'#a78bfa'},
              {label:t.revenue, value:'$48.2K', change:'+21%', color:'#f97316'},
            ].map((kpi, i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px 18px', borderTop:`2px solid ${kpi.color}`}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px'}}>{kpi.label}</div>
                <div style={{fontSize:'26px', fontWeight:'800'}}>{kpi.value}</div>
                <div style={{fontSize:'11px', marginTop:'4px', color:'#00e5a0'}}>↑ {kpi.change}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px'}}>
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', marginBottom:'14px'}}>{t.messages}</div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'5px', height:'90px'}}>
                {[60,80,45,90,70,85,95].map((h,i) => (
                  <div key={i} style={{flex:'1', height:`${h}%`, background:'#00e5a0', borderRadius:'2px 2px 0 0', opacity:'0.7'}}></div>
                ))}
              </div>
            </div>
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', marginBottom:'14px'}}>{t.activity}</div>
              {[
                {color:'#00e5a0', text:t.a1, time:'2m'},
                {color:'#3b82f6', text:t.a2, time:'8m'},
                {color:'#a78bfa', text:t.a3, time:'1h'},
                {color:'#f97316', text:t.a4, time:'2h'},
              ].map((a,i) => (
                <div key={i} style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background:a.color, marginTop:'5px', flexShrink:'0'}}></div>
                  <div>
                    <div style={{fontSize:'11px', color:'#7a8fa6'}}>{a.text}</div>
                    <div style={{fontSize:'9px', color:'#3d4f63'}}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}