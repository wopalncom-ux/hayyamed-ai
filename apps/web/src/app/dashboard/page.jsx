'use client'

export default function Dashboard() {
  return (
    <div style={{background:'#07090f', color:'#e2e8f0', minHeight:'100vh', fontFamily:'sans-serif'}}>
      
      <div style={{height:'52px', background:'#0c0f1a', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px'}}>
        <div style={{fontWeight:'800', fontSize:'16px'}}>
          Hayya<span style={{color:'#00e5a0'}}>med</span> AI
        </div>
        <div style={{marginLeft:'auto', fontSize:'10px', padding:'4px 10px', border:'1px solid rgba(0,229,160,.2)', color:'#00e5a0', borderRadius:'2px'}}>● LIVE</div>
        <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>A</div>
      </div>

      <div style={{display:'flex', height:'calc(100vh - 52px)'}}>
        
        <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px'}}>
          {['⊞','💬','👥','📊','🤖','⚙️'].map((icon, i) => (
            <div key={i} style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: i===0 ? 'rgba(0,229,160,.1)' : 'none', fontSize:'18px'}}>
              {icon}
            </div>
          ))}
        </div>

        <div style={{flex:'1', overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'20px'}}>
          
          <div>
            <div style={{fontWeight:'800', fontSize:'20px'}}>Dashboard</div>
            <div style={{fontSize:'12px', color:'#7a8fa6', marginTop:'3px'}}>Welcome back — here is what is happening today</div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px'}}>
            {[
              {label:'TOTAL CONTACTS', value:'2,847', change:'+12% this week', color:'#00e5a0'},
              {label:'ACTIVE CHATS', value:'143', change:'+8% today', color:'#3b82f6'},
              {label:'AI RESPONSES', value:'89%', change:'+3% this month', color:'#a78bfa'},
              {label:'REVENUE', value:'$48.2K', change:'+21% this month', color:'#f97316'},
            ].map((kpi, i) => (
              <div key={i} style={{background:'#0f1520', border:'1px solid #1a2235', padding:'16px 18px', borderTop:`2px solid ${kpi.color}`}}>
                <div style={{fontSize:'9px', color:'#3d4f63', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px'}}>{kpi.label}</div>
                <div style={{fontSize:'26px', fontWeight:'800'}}>{kpi.value}</div>
                <div style={{fontSize:'11px', marginTop:'4px', color:'#00e5a0'}}>↑ {kpi.change}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px'}}>
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', marginBottom:'14px'}}>Messages This Week</div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'5px', height:'90px'}}>
                {[60,80,45,90,70,85,95].map((h,i) => (
                  <div key={i} style={{flex:'1', height:`${h}%`, background:'#00e5a0', borderRadius:'2px 2px 0 0', opacity:'0.7'}}></div>
                ))}
              </div>
            </div>
            <div style={{background:'#0f1520', border:'1px solid #1a2235', padding:'20px'}}>
              <div style={{fontWeight:'700', marginBottom:'14px'}}>Recent Activity</div>
              {[
                {color:'#00e5a0', text:'New lead from WhatsApp', time:'2m ago'},
                {color:'#3b82f6', text:'AI replied to 5 messages', time:'8m ago'},
                {color:'#a78bfa', text:'Campaign sent to 234 contacts', time:'1h ago'},
                {color:'#f97316', text:'New client onboarded', time:'2h ago'},
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