'use client'
import { useState, useEffect } from 'react'
import { getAuth, ROLE_NAV } from '@/lib/auth'

const ALL_NAV = [
  { page:'dashboard',    href:'/dashboard',    icon:'⊞' },
  { page:'inbox',        href:'/inbox',        icon:'💬' },
  { page:'contacts',     href:'/contacts',     icon:'👥' },
  { page:'analytics',    href:'/analytics',    icon:'📈' },
  { page:'reports',      href:'/reports',      icon:'📊' },
  { page:'campaigns',    href:'/campaigns',    icon:'📣' },
  { page:'agents',       href:'/agents',       icon:'🤖' },
  { page:'knowledge',    href:'/knowledge',    icon:'🧠' },
  { page:'bookings',     href:'/bookings',     icon:'📅' },
  { page:'chatbot',      href:'/chatbot',      icon:'⚡' },
  { page:'notifications',href:'/notifications',icon:'🔔' },
  { page:'agency',       href:'/agency',       icon:'🏢' },
  { page:'integrations', href:'/integrations', icon:'🔌' },
  { page:'admin',        href:'/admin',        icon:'👑' },
  { page:'settings',     href:'/settings',     icon:'⚙️' },
]

export default function NavSidebar({ current }) {
  const [allowed, setAllowed] = useState(ALL_NAV.map(n => n.page))

  useEffect(() => {
    const { role = 'owner' } = getAuth()
    setAllowed(ROLE_NAV[role] || ROLE_NAV.owner)
  }, [])

  return (
    <div style={{width:'56px', background:'#0c0f1a', borderRight:'1px solid #1a2235', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:'8px', flexShrink:0}}>
      {ALL_NAV.filter(n => allowed.includes(n.page)).map(n => (
        <a key={n.href} href={n.href} title={n.page}
          style={{width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', textDecoration:'none', background: current===n.page ? 'rgba(0,229,160,.12)' : 'transparent', border: current===n.page ? '1px solid rgba(0,229,160,.2)' : '1px solid transparent'}}>
          {n.icon}
        </a>
      ))}
    </div>
  )
}
