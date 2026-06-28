'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useIsMobile } from '@/lib/useIsMobile'

const STATUS_COLORS = {
  PENDING:     '#f97316',
  CONFIRMED:   '#D8B16A',
  CANCELLED:   '#ef4444',
  COMPLETED:   '#3b82f6',
  NO_SHOW:     '#64748b',
  RESCHEDULED: '#a78bfa',
}

const STATUS_LABELS = {
  PENDING:     'Pending',
  CONFIRMED:   'Confirmed',
  CANCELLED:   'Cancelled',
  COMPLETED:   'Completed',
  NO_SHOW:     'No Show',
  RESCHEDULED: 'Rescheduled',
}

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 7
  return `${h.toString().padStart(2,'0')}:00`
})

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getWeekDates(startDate) {
  const start = new Date(startDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}

export default function BookingsPage() {
  const isMobile = useIsMobile()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('calendar') // calendar | list
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekDates, setWeekDates] = useState(getWeekDates(new Date()))
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [newBooking, setNewBooking] = useState({
    service: '',
    notes: '',
    status: 'PENDING',
    scheduledAt: '',
    durationMin: 60,
  })

  useEffect(() => {
    api.getBookings()
      .then(d => setBookings(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const prevWeek = () => {
    const d = new Date(weekDates[0])
    d.setDate(d.getDate() - 7)
    setWeekDates(getWeekDates(d))
  }

  const nextWeek = () => {
    const d = new Date(weekDates[0])
    d.setDate(d.getDate() + 7)
    setWeekDates(getWeekDates(d))
  }

  const goToday = () => setWeekDates(getWeekDates(new Date()))

  const bookingsForDay = (date) => {
    const dateStr = date.toDateString()
    return bookings.filter(b => {
      if (!b.scheduledAt) return false
      return new Date(b.scheduledAt).toDateString() === dateStr
    })
  }

  const bookingsForHour = (date, hour) => {
    return bookingsForDay(date).filter(b => {
      const h = new Date(b.scheduledAt).getHours()
      return h === parseInt(hour)
    })
  }

  const filteredList = statusFilter
    ? bookings.filter(b => b.status === statusFilter)
    : bookings

  const createBooking = async () => {
    if (!newBooking.service) return alert('Service is required')
    if (!newBooking.scheduledAt) return alert('Date & time is required')
    setSaving(true)
    try {
      const created = await api.createBooking(newBooking)
      setBookings([created, ...bookings])
      setShowNew(false)
      setNewBooking({ service:'', notes:'', status:'PENDING', scheduledAt:'', durationMin:60 })
    } catch (err) {
      alert('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (bookingId, status) => {
    try {
      const updated = await api.updateBooking(bookingId, { status })
      setBookings(bookings.map(b => b.id === bookingId ? updated : b))
      if (selected?.id === bookingId) setSelected(updated)
    } catch {}
  }

  const cancelBooking = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return
    try {
      const updated = await api.cancelBooking(bookingId)
      setBookings(bookings.map(b => b.id === bookingId ? updated : b))
      if (selected?.id === bookingId) setSelected(updated)
    } catch {}
  }

  const today = new Date()
  const totalThisWeek = bookings.filter(b => {
    if (!b.scheduledAt) return false
    const bd = new Date(b.scheduledAt)
    return weekDates.some(wd => wd.toDateString() === bd.toDateString())
  }).length

  return (
    <div style={{ display:'flex', height:'100vh', background:'#07090f', color:'#e2e8f0', fontFamily:'system-ui, sans-serif' }}>
      <NavSidebar />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #1a2235', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:'10px', color:'#3b82f6', fontWeight:'700', letterSpacing:'0.06em' }}>BOOKING SYSTEM</div>
            <div style={{ fontSize:'18px', fontWeight:'800' }}>
              {MONTHS[weekDates[0]?.getMonth()]} {weekDates[0]?.getFullYear()}
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {/* View toggle */}
            <div style={{ display:'flex', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', overflow:'hidden' }}>
              {['calendar','list'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding:'6px 14px', background: view===v ? '#1a2235' : 'transparent', border:'none', color: view===v ? '#e2e8f0' : '#64748b', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}
                >
                  {v === 'calendar' ? '📅 Calendar' : '☰ List'}
                </button>
              ))}
            </div>
            <button onClick={goToday} style={{ padding:'6px 12px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', fontSize:'11px', cursor:'pointer' }}>Today</button>
            <button onClick={prevWeek} style={{ padding:'6px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', fontSize:'11px', cursor:'pointer' }}>‹</button>
            <button onClick={nextWeek} style={{ padding:'6px 10px', background:'#111622', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', fontSize:'11px', cursor:'pointer' }}>›</button>
            <button onClick={() => setShowNew(true)}
              style={{ padding:'7px 16px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', fontSize:'12px', cursor:'pointer' }}
            >
              + New Booking
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{ display:'flex', gap:'0', borderBottom:'1px solid #1a2235', flexShrink:0 }}>
          {[
            { label:'This Week', value: totalThisWeek, color:'#3b82f6' },
            { label:'Pending', value: bookings.filter(b=>b.status==='PENDING').length, color:'#f97316' },
            { label:'Confirmed', value: bookings.filter(b=>b.status==='CONFIRMED').length, color:'#D8B16A' },
            { label:'Completed', value: bookings.filter(b=>b.status==='COMPLETED').length, color:'#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, padding:'10px 16px', borderRight:'1px solid #1a2235', textAlign:'center' }}>
              <div style={{ fontSize:'20px', fontWeight:'800', color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'10px', color:'#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ flex:1, display:'flex', flexDirection: isMobile ? 'column' : 'row', overflow: isMobile ? 'auto' : 'hidden' }}>
          {view === 'calendar' ? (
            /* Calendar View */
            <div style={{ flex:1, overflow:'auto' }}>
              {/* Day headers */}
              <div style={{ display:'grid', gridTemplateColumns:'56px repeat(7, 1fr)', borderBottom:'1px solid #1a2235', position:'sticky', top:0, background:'#07090f', zIndex:10 }}>
                <div></div>
                {weekDates.map((d, i) => {
                  const isToday = d.toDateString() === today.toDateString()
                  return (
                    <div key={i} style={{ padding:'8px', textAlign:'center', borderLeft:'1px solid #1a2235' }}>
                      <div style={{ fontSize:'10px', color:'#64748b' }}>{DAYS[d.getDay()]}</div>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: isToday ? '#3b82f6' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', margin:'2px auto 0', fontSize:'14px', fontWeight: isToday ? '800' : '400', color: isToday ? 'white' : '#e2e8f0' }}>
                        {d.getDate()}
                      </div>
                      <div style={{ fontSize:'9px', color:'#64748b', marginTop:'2px' }}>
                        {bookingsForDay(d).length > 0 && `${bookingsForDay(d).length} appt`}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Hour rows */}
              {HOURS.map(hour => (
                <div key={hour} style={{ display:'grid', gridTemplateColumns:'56px repeat(7, 1fr)', minHeight:'52px', borderBottom:'1px solid rgba(26,34,53,.6)' }}>
                  <div style={{ padding:'4px 8px', fontSize:'10px', color:'#3d4f63', flexShrink:0 }}>{hour}</div>
                  {weekDates.map((d, di) => {
                    const dayBookings = bookingsForHour(d, hour.split(':')[0])
                    return (
                      <div key={di} style={{ borderLeft:'1px solid rgba(26,34,53,.6)', padding:'2px', position:'relative', minHeight:'52px' }}>
                        {dayBookings.map(b => (
                          <div key={b.id} onClick={() => setSelected(b)}
                            style={{ background:`${STATUS_COLORS[b.status] || '#3b82f6'}18`, border:`1px solid ${STATUS_COLORS[b.status] || '#3b82f6'}40`, borderLeft:`3px solid ${STATUS_COLORS[b.status] || '#3b82f6'}`, borderRadius:'3px', padding:'3px 6px', marginBottom:'2px', cursor:'pointer', fontSize:'10px', overflow:'hidden' }}
                          >
                            <div style={{ fontWeight:'700', color: STATUS_COLORS[b.status] || '#3b82f6', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {formatTime(b.scheduledAt)} {b.service}
                            </div>
                            {b.contact?.name && <div style={{ color:'#64748b', fontSize:'9px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.contact.name}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
              {/* Filter bar */}
              <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
                {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    style={{ padding:'4px 12px', background: statusFilter===s ? '#1a2235' : 'transparent', border:`1px solid ${statusFilter===s ? '#1a2235' : 'transparent'}`, borderRadius:'20px', color: s ? STATUS_COLORS[s] : (statusFilter==='' ? '#e2e8f0' : '#64748b'), fontSize:'11px', cursor:'pointer', fontWeight:'600' }}
                  >
                    {s || 'All'} {s && `(${bookings.filter(b=>b.status===s).length})`}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ color:'#64748b', textAlign:'center', padding:'60px' }}>Loading...</div>
              ) : filteredList.length === 0 ? (
                <div style={{ color:'#64748b', textAlign:'center', padding:'60px' }}>No bookings found</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {filteredList.map(b => (
                    <div key={b.id} onClick={() => setSelected(b)}
                      style={{ background:'#111622', border:'1px solid #1a2235', borderLeft:`3px solid ${STATUS_COLORS[b.status] || '#64748b'}`, borderRadius:'8px', padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}
                    >
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'4px' }}>
                          <span style={{ fontWeight:'700', fontSize:'13px' }}>{b.service}</span>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'3px', background:`${STATUS_COLORS[b.status]}18`, color:STATUS_COLORS[b.status], fontWeight:'700' }}>
                            {STATUS_LABELS[b.status]}
                          </span>
                        </div>
                        <div style={{ fontSize:'11px', color:'#64748b' }}>
                          {b.contact?.name && <span>{b.contact.name} · </span>}
                          {b.scheduledAt ? `${formatDate(b.scheduledAt)} at ${formatTime(b.scheduledAt)}` : 'No time set'}
                          {b.durationMin && ` · ${b.durationMin}min`}
                        </div>
                        {b.notes && <div style={{ fontSize:'10px', color:'#3d4f63', marginTop:'3px' }}>{b.notes}</div>}
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                        {b.status === 'PENDING' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(b.id, 'CONFIRMED') }}
                            style={{ padding:'4px 10px', background:'rgba(216,177,106,.1)', border:'1px solid rgba(216,177,106,.2)', borderRadius:'4px', color:'#D8B16A', fontSize:'10px', cursor:'pointer', fontWeight:'700' }}
                          >
                            Confirm
                          </button>
                        )}
                        {['PENDING','CONFIRMED'].includes(b.status) && (
                          <button onClick={e => { e.stopPropagation(); cancelBooking(b.id) }}
                            style={{ padding:'4px 10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'4px', color:'#ef4444', fontSize:'10px', cursor:'pointer', fontWeight:'700' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Detail Sidebar */}
          {selected && (
            <div style={{ width: isMobile ? '100%' : '300px', borderLeft: isMobile ? 'none' : '1px solid #1a2235', borderTop: isMobile ? '1px solid #1a2235' : 'none', background:'#0c0f1a', padding:'16px', overflow:'auto', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <div style={{ fontWeight:'700', fontSize:'14px' }}>Booking Detail</div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'18px' }}>×</button>
              </div>

              <div style={{ background:`${STATUS_COLORS[selected.status]}18`, border:`1px solid ${STATUS_COLORS[selected.status]}30`, borderRadius:'6px', padding:'10px 12px', marginBottom:'16px', textAlign:'center' }}>
                <div style={{ fontSize:'16px', fontWeight:'800', color:STATUS_COLORS[selected.status] }}>{STATUS_LABELS[selected.status]}</div>
              </div>

              {[
                { label:'Service', value: selected.service },
                { label:'Date', value: selected.scheduledAt ? formatDate(selected.scheduledAt) : '—' },
                { label:'Time', value: selected.scheduledAt ? formatTime(selected.scheduledAt) : '—' },
                { label:'Duration', value: selected.durationMin ? `${selected.durationMin} min` : '—' },
                { label:'Contact', value: selected.contact?.name || '—' },
                { label:'Staff', value: selected.staff?.name || '—' },
                { label:'Branch', value: selected.branch?.name || '—' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #1a2235', fontSize:'12px' }}>
                  <span style={{ color:'#64748b' }}>{f.label}</span>
                  <span style={{ fontWeight:'600' }}>{f.value}</span>
                </div>
              ))}

              {selected.notes && (
                <div style={{ marginTop:'12px' }}>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>NOTES</div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', lineHeight:'1.6' }}>{selected.notes}</div>
                </div>
              )}

              {/* Status Actions */}
              <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'6px' }}>
                {selected.status === 'PENDING' && (
                  <button onClick={() => updateStatus(selected.id, 'CONFIRMED')}
                    style={{ padding:'9px', background:'rgba(216,177,106,.1)', border:'1px solid rgba(216,177,106,.2)', borderRadius:'6px', color:'#D8B16A', fontSize:'12px', cursor:'pointer', fontWeight:'700' }}
                  >
                    ✅ Confirm Booking
                  </button>
                )}
                {selected.status === 'CONFIRMED' && (
                  <button onClick={() => updateStatus(selected.id, 'COMPLETED')}
                    style={{ padding:'9px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'6px', color:'#3b82f6', fontSize:'12px', cursor:'pointer', fontWeight:'700' }}
                  >
                    ✓ Mark Completed
                  </button>
                )}
                {selected.status === 'CONFIRMED' && (
                  <button onClick={() => updateStatus(selected.id, 'NO_SHOW')}
                    style={{ padding:'9px', background:'rgba(100,116,139,.1)', border:'1px solid rgba(100,116,139,.2)', borderRadius:'6px', color:'#64748b', fontSize:'12px', cursor:'pointer', fontWeight:'700' }}
                  >
                    👻 Mark No-Show
                  </button>
                )}
                {['PENDING','CONFIRMED'].includes(selected.status) && (
                  <button onClick={() => cancelBooking(selected.id)}
                    style={{ padding:'9px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:'6px', color:'#ef4444', fontSize:'12px', cursor:'pointer', fontWeight:'700' }}
                  >
                    ✕ Cancel Booking
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Booking Modal */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#111622', border:'1px solid #1a2235', borderRadius:'12px', padding:'24px', width:'420px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'15px', fontWeight:'800' }}>New Booking</div>
              <button onClick={() => setShowNew(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'18px' }}>×</button>
            </div>

            {[
              { key:'service', label:'Service *', placeholder:'Dental Cleaning', type:'text' },
              { key:'scheduledAt', label:'Date & Time *', placeholder:'', type:'datetime-local' },
              { key:'durationMin', label:'Duration (minutes)', placeholder:'60', type:'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>{f.label}</div>
                <input type={f.type} value={newBooking[f.key]} onChange={e => setNewBooking({...newBooking, [f.key]: f.type==='number' ? +e.target.value : e.target.value})}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom:'12px' }}>
              <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'4px', fontWeight:'700' }}>NOTES</div>
              <textarea value={newBooking.notes} onChange={e => setNewBooking({...newBooking, notes:e.target.value})}
                placeholder="Any special requests or notes..."
                rows={3}
                style={{ width:'100%', padding:'8px 12px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#e2e8f0', fontSize:'12px', outline:'none', boxSizing:'border-box', resize:'none' }}
              />
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button onClick={() => setShowNew(false)} style={{ flex:1, padding:'10px', background:'#0c0f1a', border:'1px solid #1a2235', borderRadius:'6px', color:'#64748b', cursor:'pointer', fontSize:'13px' }}>
                Cancel
              </button>
              <button onClick={createBooking} disabled={saving} style={{ flex:2, padding:'10px', background:'#D8B16A', border:'none', borderRadius:'6px', color:'#07090f', fontWeight:'700', cursor:'pointer', fontSize:'13px' }}>
                {saving ? 'Creating...' : '📅 Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
