'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { api } from '@/lib/api'
import { getAuth } from '@/lib/auth'
import { useIsMobile } from '@/lib/useIsMobile'

const COLORS = ['#00e5a0', '#3b82f6', '#a78bfa', '#f97316', '#ef4444', '#fbbf24', '#06b6d4']
const statusColors = { 'Hot Lead': '#ef4444', 'Cold Lead': '#3b82f6', 'New Lead': '#f97316', 'Customer': '#00e5a0' }

// Keyed by the backend ChannelType enum (what conversations actually return),
// not friendly labels — fixes blank icons + a channel filter that matched nothing.
const CHANNEL_META = {
  WHATSAPP:  { label: 'WhatsApp',  icon: '💬', color: '#00e5a0' },
  LIVE_CHAT: { label: 'Web Chat',  icon: '🌐', color: '#3b82f6' },
  TELEGRAM:  { label: 'Telegram',  icon: '✈️', color: '#06b6d4' },
  INSTAGRAM: { label: 'Instagram', icon: '📸', color: '#a78bfa' },
  MESSENGER: { label: 'Messenger', icon: '👤', color: '#3b82f6' },
  EMAIL:     { label: 'Email',     icon: '📧', color: '#fbbf24' },
}
const channelMeta = (type) => CHANNEL_META[type] || { label: type || 'Unknown', icon: '💬', color: '#64748b' }

function toUiConv(c) {
  const name = c.contact?.name || c.contactId?.slice(0, 8) || 'Unknown'
  return {
    id: c.id, _raw: c, name,
    phone: c.contact?.phone || '',
    msg: c.lastMessage || '—',
    time: c.lastMsgAt ? new Date(c.lastMsgAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
    unread: c.unreadCount || 0,
    avatar: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    color: COLORS[(name.charCodeAt(0) || 0) % COLORS.length],
    channel: c.channel?.type || c.channelType || 'WHATSAPP',
    status: c.contact?.status === 'WON' ? 'Customer' : c.contact?.status === 'QUALIFYING' ? 'Hot Lead' : c.contact?.status === 'CONTACTED' ? 'Cold Lead' : 'New Lead',
    score: c.contact?.score || 0,
    isNew: c.status === 'OPEN',
    convId: c.id,
    contactId: c.contact?.id,
    convStatus: c.status || 'OPEN',
    assigneeId: c.assigneeId || '',
    tags: c.tags || [],
    lastMsgAt: c.lastMsgAt,
    aiPaused: !!(c.metadata && c.metadata.aiPaused),
    escalated: !!(c.metadata && c.metadata.escalated),
    rating: (c.metadata && c.metadata.rating) || 0,
  }
}

function toUiMsg(m) {
  // senderId null means customer sent it (inbound); isAI/isFromBot = AI-generated reply
  const from = !m.senderId ? 'contact' : (m.isAI || m.isFromBot) ? 'ai' : 'agent'
  return {
    id: m.id,
    from,
    text: m.content || '',
    time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
  }
}

function InboxInner() {
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const targetConvId = searchParams.get('conv')

  const [contacts, setContacts] = useState([])
  const [convLoading, setConvLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [team, setTeam] = useState([])
  const [notes, setNotes] = useState([])
  const [newTag, setNewTag] = useState('')
  const [noteInput, setNoteInput] = useState('')

  useEffect(() => { api.getTeam().then(t => setTeam(Array.isArray(t) ? t : [])).catch(() => {}) }, [])

  // ── Saved Replies (canned responses) ──────────────────────────────────────
  const [quickReplies, setQuickReplies] = useState([])
  const [showReplies, setShowReplies] = useState(false)
  const [qrTitle, setQrTitle] = useState('')
  const [qrContent, setQrContent] = useState('')
  useEffect(() => { api.getQuickReplies().then(r => setQuickReplies(Array.isArray(r) ? r : [])).catch(() => {}) }, [])

  const insertReply = (content) => {
    const text = String(content || '').replace(/\{name\}/gi, selected?.name || 'there')
    setInput(prev => (prev ? prev + (prev.endsWith(' ') ? '' : ' ') + text : text))
    setShowReplies(false)
  }
  const saveQuickReply = async () => {
    const title = qrTitle.trim(); const content = qrContent.trim()
    if (!title || !content) return
    try {
      const created = await api.createQuickReply(title, content)
      if (created?.id) setQuickReplies(prev => [created, ...prev])
      setQrTitle(''); setQrContent('')
    } catch (e) { alert('Could not save: ' + (e?.message || 'error')) }
  }
  const deleteQuickReply = async (id) => {
    try { await api.deleteQuickReply(id); setQuickReplies(prev => prev.filter(q => q.id !== id)) } catch {}
  }

  // ── Request Payment (MyFatoorah) ──────────────────────────────────────────
  const [mfConfigured, setMfConfigured] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payCurrency, setPayCurrency] = useState('QAR')
  const [payLoading, setPayLoading] = useState(false)
  useEffect(() => { api.getMyFatoorahStatus().then(s => setMfConfigured(!!s?.configured)).catch(() => {}) }, [])

  // Send arbitrary text into the open conversation (used for the payment link).
  const sendText = async (text) => {
    if (!text || !selected) return
    const tmpId = `tmp-${Date.now()}`
    setMessages(prev => [...prev, { id: tmpId, from: 'agent', text, time: 'Now' }])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const saved = await api.sendMessage(selected.convId, text)
      setMessages(prev => prev.map(m => m.id === tmpId ? { ...m, id: saved.id } : m))
      setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, msg: text, time: 'Now' } : c))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tmpId))
    }
  }

  const requestPayment = async () => {
    const amt = Number(payAmount)
    if (!amt || amt <= 0 || !selected) return
    setPayLoading(true)
    try {
      const r = await api.createMyFatoorahPayment({
        amount: amt, currency: payCurrency,
        customerName: selected.name, customerMobile: selected.phone || undefined,
        reference: selected.contactId || selected.convId,
      })
      if (r?.paymentUrl) {
        await sendText(`💳 Here is your secure payment link for ${payCurrency} ${amt}:\n${r.paymentUrl}`)
        setShowPay(false); setPayAmount('')
      }
    } catch (e) {
      alert('Could not create payment: ' + (e?.message || 'error'))
    } finally { setPayLoading(false) }
  }

  const loadNotes = async (convId) => {
    try { setNotes(await api.getConversationNotes(convId) || []) } catch { setNotes([]) }
  }

  const assignTo = async (assigneeId) => {
    if (!selected) return
    try { await api.assignConversation(selected.convId, assigneeId || null); setSelected(s => ({ ...s, assigneeId })) } catch {}
  }

  const addTag = async () => {
    const t = newTag.trim()
    if (!t || !selected) return
    const tags = Array.from(new Set([...(selected.tags || []), t]))
    setNewTag('')
    try { await api.setConversationTags(selected.convId, tags); setSelected(s => ({ ...s, tags })) } catch {}
  }

  const removeTag = async (t) => {
    if (!selected) return
    const tags = (selected.tags || []).filter(x => x !== t)
    try { await api.setConversationTags(selected.convId, tags); setSelected(s => ({ ...s, tags })) } catch {}
  }

  const addNote = async () => {
    const c = noteInput.trim()
    if (!c || !selected) return
    setNoteInput('')
    try { const n = await api.addConversationNote(selected.convId, c); if (n) setNotes(prev => [n, ...prev]) } catch {}
  }

  const runSummary = async () => {
    if (!selected) return
    setSummaryLoading(true); setSummary(null)
    try {
      const r = await api.summarizeConversation(selected.convId)
      setSummary(r.summary)
    } catch (e) {
      setSummary('⚠️ ' + (e?.message || 'Summary failed'))
    } finally { setSummaryLoading(false) }
  }

  const suggestReply = async () => {
    if (!selected) return
    setSuggesting(true)
    try {
      const r = await api.generateReply(selected.convId)
      if (r?.reply) setInput(r.reply)
    } catch (e) {
      alert('AI suggestion failed: ' + (e?.message || 'unknown'))
    } finally { setSuggesting(false) }
  }

  const changeStatus = async (status) => {
    if (!selected) return
    try {
      await api.updateConversationStatus(selected.convId, status)
      const reset = status === 'RESOLVED' ? { aiPaused: false, escalated: false } : {}
      setSelected(s => ({ ...s, convStatus: status, ...reset }))
      if (status === 'RESOLVED') setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, aiPaused: false, escalated: false } : c))
    } catch {}
  }

  // Human takeover: pause/resume the AI for the open conversation.
  const toggleAi = async () => {
    if (!selected) return
    const paused = !selected.aiPaused
    setSelected(s => ({ ...s, aiPaused: paused }))
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, aiPaused: paused } : c))
    try { await api.setConversationAi(selected.convId, paused) }
    catch { setSelected(s => ({ ...s, aiPaused: !paused })) }
  }
  const [filterChannel, setFilterChannel] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [quickFilter, setQuickFilter] = useState('all') // all | unread | mine | unassigned
  const myUserId = getAuth().userId
  const [liveStatus, setLiveStatus] = useState('connecting')
  const [newMsgFlash, setNewMsgFlash] = useState(false)
  const bottomRef = useRef(null)
  const socketRef = useRef(null)
  const selectedRef = useRef(null)
  selectedRef.current = selected

  // ── Load conversations ────────────────────────────────────────────────────
  useEffect(() => {
    api.getConversations({ limit: 50 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || [])
        const ui = list.map(toUiConv)
        setContacts(ui)
        // If ?conv= param present, jump to that conversation; else open first
        const target = targetConvId ? ui.find(c => c.id === targetConvId) : null
        if (target) selectConversation(target)
        else if (ui.length) selectConversation(ui[0])
      })
      .catch(() => {})
      .finally(() => setConvLoading(false))
  }, [])

  // ── Socket.IO real-time connection ────────────────────────────────────────
  useEffect(() => {
    let socket
    let destroyed = false

    const connectSocket = async () => {
      const { io } = await import('socket.io-client')
      const auth = getAuth()
      if (!auth.accessToken || destroyed) return

      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      socket = io(`${BASE}/ws`, {
        auth: { token: auth.accessToken },
        transports: ['websocket', 'polling'],
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        if (destroyed) return
        setLiveStatus('live')
      })
      socket.on('disconnect', () => !destroyed && setLiveStatus('offline'))
      socket.on('connect_error', () => !destroyed && setLiveStatus('offline'))

      // New message in org — update conversation list
      socket.on('message:new', ({ conversationId, message }) => {
        if (destroyed) return
        setContacts(prev => {
          const idx = prev.findIndex(c => c.id === conversationId)
          if (idx === -1) return prev
          const updated = { ...prev[idx], msg: message.content || prev[idx].msg, time: 'Now', unread: prev[idx].unread + (!message.senderId ? 1 : 0), lastMsgAt: message.createdAt }
          const rest = prev.filter(c => c.id !== conversationId)
          return [updated, ...rest] // bump to top
        })
        // Flash indicator
        setNewMsgFlash(true)
        setTimeout(() => setNewMsgFlash(false), 2000)
      })

      // Message received in the open conversation thread
      socket.on('message:received', (message) => {
        if (destroyed) return
        const cur = selectedRef.current
        if (cur && message.conversationId === cur.convId) {
          setMessages(prev => {
            // Skip if already exists (optimistic update)
            if (prev.some(m => m.id === message.id)) return prev
            const ui = toUiMsg(message)
            return [...prev, ui]
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      })
    }

    connectSocket().catch(() => setLiveStatus('offline'))

    return () => {
      destroyed = true
      socket?.disconnect()
    }
  }, [])

  // ── Join/leave conversation room on selection change ──────────────────────
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selected) return
    socket.emit('join:conversation', { conversationId: selected.convId })
    return () => socket.emit('leave:conversation', { conversationId: selected.convId })
  }, [selected?.convId])

  const selectConversation = useCallback((c) => {
    setSelected(c)
    setMessages([])
    setSummary(null)
    setShowActions(false)
    loadNotes(c.convId)
    api.getMessages(c.convId)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || [])
        setMessages(list.map(toUiMsg))
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(() => {})
    // Clear unread badge
    setContacts(prev => prev.map(conv => conv.id === c.id ? { ...conv, unread: 0 } : conv))
  }, [])

  const filtered = contacts.filter(c => {
    if (!c.name.toLowerCase().includes(search.toLowerCase()) && !c.msg.toLowerCase().includes(search.toLowerCase())) return false
    if (filterChannel !== 'All' && c.channel !== filterChannel) return false
    if (filterStatus !== 'All' && c.status !== filterStatus) return false
    if (escalatedOnly && !c.escalated) return false
    if (quickFilter === 'unread' && !(c.unread > 0)) return false
    if (quickFilter === 'mine' && c.assigneeId !== myUserId) return false
    if (quickFilter === 'unassigned' && c.assigneeId) return false
    return true
  })
  const escalatedCount = contacts.filter(c => c.escalated).length

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return
    const text = input.trim()
    const tmpId = `tmp-${Date.now()}`
    const optimistic = { id: tmpId, from: 'agent', text, time: 'Now' }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const savedMsg = await api.sendMessage(selected.convId, text)
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === tmpId ? { ...m, id: savedMsg.id } : m))
      // Sending takes over → AI auto-pauses server-side; reflect it in the UI.
      setSelected(s => ({ ...s, aiPaused: true, escalated: false }))
      setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, msg: text, time: 'Now', aiPaused: true, escalated: false } : c))
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== tmpId))
    } finally {
      setSending(false)
    }
  }

  const unreadTotal = contacts.reduce((s, c) => s + c.unread, 0)

  const LiveDot = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px',
      background: liveStatus === 'live' ? 'rgba(0,229,160,.12)' : liveStatus === 'connecting' ? 'rgba(251,191,36,.12)' : 'rgba(239,68,68,.12)',
      color: liveStatus === 'live' ? '#00e5a0' : liveStatus === 'connecting' ? '#fbbf24' : '#ef4444',
      border: `1px solid ${liveStatus === 'live' ? 'rgba(0,229,160,.25)' : liveStatus === 'connecting' ? 'rgba(251,191,36,.25)' : 'rgba(239,68,68,.25)'}`,
    }}>
      <span style={{ animation: liveStatus === 'live' ? 'pulse 2s infinite' : 'none' }}>●</span>
      {liveStatus === 'live' ? 'LIVE' : liveStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
    </span>
  )

  return (
    <div style={{ background: '#0a0f1a', color: '#e2e8f0', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } @keyframes flashIn { 0%{background:'rgba(0,229,160,.15)'} 100%{background:'transparent'} }`}</style>

      {/* Topbar */}
      <div style={{ height: '50px', background: '#0c0f1a', borderBottom: '1px solid #1a2235', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontWeight: '800', fontSize: '15px' }}>Hayya<span style={{ color: '#00e5a0' }}>med</span> AI</div>
        <div style={{ marginLeft: 'auto' }}><LiveDot /></div>
        {newMsgFlash && <div style={{ fontSize: '11px', color: '#00e5a0', fontWeight: '700', animation: 'pulse .5s 3' }}>New message!</div>}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NavSidebar current="inbox" />

        {/* Conversation List — full width on mobile, hidden when a thread is open */}
        <div style={{ width: isMobile ? '100%' : '295px', borderRight: '1px solid #1a2235', display: (isMobile && selected) ? 'none' : 'flex', flexDirection: 'column', flexShrink: 0, background: '#0c0f1a' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #1a2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: '800', fontSize: '14px' }}>
                Inbox {unreadTotal > 0 && <span style={{ fontSize: '11px', background: '#00e5a0', color: '#0a0f1a', borderRadius: '10px', padding: '1px 7px', fontWeight: '800', marginLeft: '4px' }}>{unreadTotal}</span>}
              </div>
              <a href="/contacts" style={{ fontSize: '10px', color: '#475569', textDecoration: 'none', border: '1px solid #1a2235', padding: '3px 7px', borderRadius: '4px' }}>All Contacts →</a>
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{ width: '100%', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[['all', 'All'], ['unread', 'Unread'], ['mine', 'Mine'], ['unassigned', 'Unassigned']].map(([id, label]) => {
                const active = quickFilter === id
                const n = id === 'unread' ? contacts.filter(c => c.unread > 0).length
                  : id === 'mine' ? contacts.filter(c => c.assigneeId === myUserId).length
                  : id === 'unassigned' ? contacts.filter(c => !c.assigneeId).length : 0
                return (
                  <button key={id} onClick={() => setQuickFilter(id)}
                    style={{ flex: 1, padding: '5px 6px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                      background: active ? 'rgba(0,229,160,.15)' : '#111622', border: `1px solid ${active ? '#00e5a0' : '#1a2235'}`, color: active ? '#00e5a0' : '#64748b' }}>
                    {label}{id !== 'all' && n > 0 ? ` ${n}` : ''}
                  </button>
                )
              })}
            </div>
            {escalatedCount > 0 && (
              <button onClick={() => setEscalatedOnly(v => !v)}
                style={{ marginTop: '8px', width: '100%', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, textAlign: 'left',
                  background: escalatedOnly ? 'rgba(239,68,68,.18)' : 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.35)', color: '#ef4444' }}>
                ⚠ {escalatedCount} need{escalatedCount === 1 ? 's' : ''} a human {escalatedOnly ? '· showing only these' : '— tap to filter'}
              </button>
            )}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['All', ...Array.from(new Set(contacts.map(c => c.channel)))].map(ch => {
                const meta = ch === 'All' ? null : channelMeta(ch)
                const active = filterChannel === ch
                const col = meta ? meta.color : '#00e5a0'
                return (
                  <button key={ch} onClick={() => setFilterChannel(ch)}
                    style={{ padding: '3px 8px', background: active ? col + '22' : '#111622', border: `1px solid ${active ? col : '#1a2235'}`, borderRadius: '4px', color: active ? col : '#475569', fontSize: '10px', cursor: 'pointer' }}>
                    {ch === 'All' ? 'All' : meta.icon + ' ' + meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {convLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>No conversations</div>
            ) : (
              filtered.map(c => (
                <div key={c.id} onClick={() => selectConversation(c)}
                  style={{ padding: '11px 13px', borderBottom: '1px solid #111622', cursor: 'pointer', background: selected?.id === c.id ? '#111622' : 'transparent', borderLeft: `3px solid ${selected?.id === c.id ? '#00e5a0' : 'transparent'}`, transition: 'background .1s' }}
                  onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = '#0f1520' }}
                  onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#0a0f1a' }}>{c.avatar}</div>
                      <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', fontSize: '9px', background: '#0c0f1a', borderRadius: '50%', padding: '1px' }} title={channelMeta(c.channel).label}>{channelMeta(c.channel).icon}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: c.unread > 0 ? '#e2e8f0' : '#94a3b8' }}>{c.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.unread > 0 && <span style={{ minWidth: '16px', height: '16px', borderRadius: '8px', background: '#00e5a0', color: '#0a0f1a', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{c.unread}</span>}
                          <div style={{ fontSize: '9px', color: '#475569' }}>{c.time}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: c.unread > 0 ? '#94a3b8' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{c.msg}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: (statusColors[c.status] || '#64748b') + '22', color: statusColors[c.status] || '#64748b' }}>{c.status}</span>
                        {c.score > 0 && <span style={{ fontSize: '9px', color: '#475569' }}>★{c.score}</span>}
                        {c.escalated
                          ? <span title="Customer asked for a human" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(239,68,68,.15)', color: '#ef4444', fontWeight: 700 }}>⚠ Needs human</span>
                          : c.aiPaused && <span title="A human is handling this — AI paused" style={{ fontSize: '9px' }}>🙋</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: (isMobile && !selected) ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '14px' }}>
              Select a conversation to start
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2235', background: '#0c0f1a', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {isMobile && (
                  <button onClick={() => setSelected(null)} title="Back"
                    style={{ background: 'none', border: 'none', color: '#00e5a0', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
                )}
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#0a0f1a' }}>{selected.avatar}</div>
                  <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', fontSize: '10px', background: '#0c0f1a', borderRadius: '50%', padding: '1px' }} title={channelMeta(selected.channel).label}>{channelMeta(selected.channel).icon}</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selected.name}
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: (statusColors[selected.status] || '#64748b') + '22', color: statusColors[selected.status] || '#64748b' }}>{selected.status}</span>
                    {selected.rating > 0 && <span title="Customer rating" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(251,191,36,.15)', color: '#fbbf24', fontWeight: 700 }}>⭐ {selected.rating}/5</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{selected.phone}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Conversation status control */}
                  <select value={selected.convStatus || 'OPEN'} onChange={e => changeStatus(e.target.value)}
                    title="Conversation status"
                    style={{ padding: '6px 8px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>
                    <option value="OPEN">🟢 Open</option>
                    <option value="PENDING">🟡 Pending</option>
                    <option value="RESOLVED">✓ Resolved</option>
                    <option value="SNOOZED">💤 Snoozed</option>
                    <option value="SPAM">🚫 Spam</option>
                  </select>
                  <button onClick={runSummary} disabled={summaryLoading}
                    style={{ padding: '6px 11px', background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.25)', borderRadius: '6px', color: '#a78bfa', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
                    {summaryLoading ? '⟳ Summarizing…' : '✨ AI Summary'}
                  </button>
                  <button onClick={() => setShowActions(v => !v)}
                    style={{ padding: '6px 11px', background: showActions ? '#1a2235' : '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
                    ⚙ Manage
                  </button>
                  {selected.contactId && (
                    <a href={`/contacts/${selected.contactId}`}
                      style={{ padding: '6px 11px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', fontSize: '11px', textDecoration: 'none' }}>
                      View Profile
                    </a>
                  )}
                  <button onClick={toggleAi} title={selected.aiPaused ? 'AI is paused — you are handling this. Click to let AI resume.' : 'AI is auto-replying. Click to take over.'}
                    style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '700',
                      background: selected.aiPaused ? 'rgba(251,191,36,.12)' : '#00e5a0',
                      border: `1px solid ${selected.aiPaused ? 'rgba(251,191,36,.4)' : '#00e5a0'}`,
                      color: selected.aiPaused ? '#fbbf24' : '#0a0f1a' }}>
                    {selected.aiPaused ? '🙋 You’re handling' : '🤖 AI active'}
                  </button>
                </div>
              </div>

              {/* AI Summary banner */}
              {summary && (
                <div style={{ padding: '12px 16px', background: 'rgba(167,139,250,.06)', borderBottom: '1px solid rgba(167,139,250,.15)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.5px' }}>✨ AI CONVERSATION SUMMARY</span>
                    <button onClick={() => setSummary(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{summary}</div>
                </div>
              )}

              {/* Manage panel — assign, tags, internal notes, create lead */}
              {showActions && (
                <div style={{ padding: '14px 16px', background: '#0c0f1a', borderBottom: '1px solid #1a2235', flexShrink: 0, maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Assign + Create lead */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>ASSIGN</span>
                      <select value={selected.assigneeId || ''} onChange={e => assignTo(e.target.value)}
                        style={{ padding: '6px 8px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '11px', cursor: 'pointer' }}>
                        <option value="">Unassigned</option>
                        {team.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                      </select>
                    </div>
                    {selected.contactId && (
                      <a href={`/contacts/${selected.contactId}`}
                        style={{ padding: '6px 11px', background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.25)', borderRadius: '6px', color: '#00e5a0', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                        👤 Open lead in CRM →
                      </a>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>TAGS</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {(selected.tags || []).map(t => (
                        <span key={t} style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {t}<span onClick={() => removeTag(t)} style={{ cursor: 'pointer', color: '#64748b' }}>×</span>
                        </span>
                      ))}
                      <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                        placeholder="+ add tag"
                        style={{ padding: '5px 9px', background: '#111622', border: '1px solid #1a2235', borderRadius: '12px', color: '#e2e8f0', fontSize: '11px', outline: 'none', width: '100px' }} />
                    </div>
                  </div>

                  {/* Internal notes */}
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>INTERNAL NOTES (team-only)</span>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
                        placeholder="Add a private note…"
                        style={{ flex: 1, padding: '7px 10px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px', outline: 'none' }} />
                      <button onClick={addNote} style={{ padding: '0 14px', background: '#1a2235', border: 'none', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {notes.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#475569' }}>No notes yet.</div>
                      ) : notes.map(n => (
                        <div key={n.id} style={{ padding: '8px 10px', background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.12)', borderRadius: '6px' }}>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>{n.content}</div>
                          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>{n.author?.name || 'Agent'} · {new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0a0f1a' }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: m.from === 'agent' ? 'row-reverse' : 'row', gap: '7px', alignItems: 'flex-end' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: m.from === 'ai' ? '#8b5cf6' : m.from === 'agent' ? '#00e5a0' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                      {m.from === 'ai' ? 'AI' : m.from === 'agent' ? 'A' : 'C'}
                    </div>
                    <div style={{ maxWidth: '65%' }}>
                      <div style={{ padding: '9px 13px', borderRadius: m.from === 'agent' ? '12px 3px 12px 12px' : '3px 12px 12px 12px', background: m.from === 'agent' ? 'rgba(0,229,160,.1)' : m.from === 'ai' ? 'rgba(139,92,246,.1)' : '#111622', border: `1px solid ${m.from === 'agent' ? 'rgba(0,229,160,.2)' : m.from === 'ai' ? 'rgba(139,92,246,.2)' : '#1a2235'}`, fontSize: '13px', lineHeight: '1.5', color: '#e2e8f0' }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize: '9px', color: '#475569', marginTop: '3px', textAlign: m.from === 'agent' ? 'right' : 'left' }}>{m.time}</div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && !sending && (
                  <div style={{ textAlign: 'center', color: '#475569', fontSize: '13px', marginTop: '40px' }}>No messages yet</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2235', background: '#0c0f1a', flexShrink: 0, position: 'relative' }}>
                {selected?.aiPaused && <div style={{ padding: '5px 10px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)', borderRadius: '5px', marginBottom: '8px', fontSize: '11px', color: '#fbbf24' }}>🙋 You’ve taken over — the AI won’t auto-reply here until you switch it back to 🤖 AI active.</div>}

                {/* Request Payment popover */}
                {showPay && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', maxWidth: '360px', background: '#0c0f1a', border: '1px solid #253045', borderRadius: '10px', boxShadow: '0 -8px 30px rgba(0,0,0,.5)', padding: '12px', marginBottom: '8px', zIndex: 50 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>💳 Request payment from {selected?.name}</span>
                      <button onClick={() => setShowPay(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>AMOUNT</div>
                        <input value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" min="0.1" step="0.1" placeholder="0.00" autoFocus
                          style={{ width: '100%', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ width: '90px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>CURRENCY</div>
                        <select value={payCurrency} onChange={e => setPayCurrency(e.target.value)} style={{ width: '100%', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '8px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer' }}>
                          {['QAR','KWD','SAR','AED','BHD','OMR','EGP','USD'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={requestPayment} disabled={payLoading || !(Number(payAmount) > 0)}
                      style={{ width: '100%', marginTop: '10px', padding: '9px', background: payLoading || !(Number(payAmount) > 0) ? '#1a2235' : '#00e5a0', border: 'none', borderRadius: '6px', color: payLoading || !(Number(payAmount) > 0) ? '#475569' : '#07090f', fontWeight: 700, fontSize: '12px', cursor: payLoading ? 'wait' : 'pointer' }}>
                      {payLoading ? 'Creating link…' : 'Create & send payment link'}
                    </button>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>A MyFatoorah payment link is created and sent into this conversation.</div>
                  </div>
                )}

                {/* Saved Replies popover */}
                {showReplies && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', maxWidth: '420px', background: '#0c0f1a', border: '1px solid #253045', borderRadius: '10px', boxShadow: '0 -8px 30px rgba(0,0,0,.5)', padding: '12px', marginBottom: '8px', maxHeight: '320px', overflowY: 'auto', zIndex: 50 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>⚡ Saved Replies</span>
                      <button onClick={() => setShowReplies(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                    {quickReplies.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '10px' }}>No saved replies yet. Create one below — use <code style={{ color: '#a78bfa' }}>{'{name}'}</code> to insert the contact&apos;s name.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                        {quickReplies.map(q => (
                          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 9px' }}>
                            <button onClick={() => insertReply(q.content)} title="Insert into reply" style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>{q.title}</div>
                              <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.content}</div>
                            </button>
                            <button onClick={() => deleteQuickReply(q.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>🗑</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #1a2235', paddingTop: '9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input value={qrTitle} onChange={e => setQrTitle(e.target.value)} placeholder="Title — e.g. Greeting"
                        style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 9px', color: '#e2e8f0', fontSize: '12px', outline: 'none' }} />
                      <textarea value={qrContent} onChange={e => setQrContent(e.target.value)} placeholder="Message — Hi {name}, thanks for reaching out!" rows={2}
                        style={{ background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', padding: '7px 9px', color: '#e2e8f0', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                      <button onClick={saveQuickReply} disabled={!qrTitle.trim() || !qrContent.trim()}
                        style={{ padding: '7px', background: (!qrTitle.trim() || !qrContent.trim()) ? '#1a2235' : '#00e5a0', border: 'none', borderRadius: '6px', color: (!qrTitle.trim() || !qrContent.trim()) ? '#475569' : '#0a0f1a', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                        + Save reply
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    style={{ flex: 1, background: '#111622', border: '1px solid #1a2235', borderRadius: '8px', padding: '10px 13px', color: '#e2e8f0', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '80px', overflowY: 'auto' }}
                    onFocus={e => e.target.style.borderColor = '#253045'}
                    onBlur={e => e.target.style.borderColor = '#1a2235'}
                  />
                  {mfConfigured && (
                    <button onClick={() => { setShowPay(v => !v); setShowReplies(false) }} title="Request payment"
                      style={{ height: '40px', padding: '0 13px', background: showPay ? 'rgba(251,191,36,.18)' : 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)', borderRadius: '8px', color: '#fbbf24', fontWeight: '700', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}>
                      💳
                    </button>
                  )}
                  <button onClick={() => setShowReplies(v => !v)} title="Saved replies"
                    style={{ height: '40px', padding: '0 13px', background: showReplies ? 'rgba(0,229,160,.15)' : 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.3)', borderRadius: '8px', color: '#00e5a0', fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    ⚡
                  </button>
                  <button onClick={suggestReply} disabled={suggesting} title="Let AI draft a reply"
                    style={{ height: '40px', padding: '0 13px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: '8px', color: '#a78bfa', fontWeight: '700', fontSize: '12px', cursor: suggesting ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {suggesting ? '⟳' : '✨ Suggest'}
                  </button>
                  <button onClick={sendMessage} disabled={sending || !input.trim()}
                    style={{ height: '40px', padding: '0 18px', background: sending || !input.trim() ? '#111622' : '#00e5a0', border: '1px solid', borderColor: sending || !input.trim() ? '#1a2235' : '#00e5a0', borderRadius: '8px', color: sending || !input.trim() ? '#475569' : '#0a0f1a', fontWeight: '800', fontSize: '12px', cursor: sending ? 'wait' : 'pointer', flexShrink: 0, transition: 'all .15s' }}>
                    {sending ? '⟳' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Inbox() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', color: '#64748b', alignItems: 'center', justifyContent: 'center' }}>
        Loading inbox…
      </div>
    }>
      <InboxInner />
    </Suspense>
  )
}
