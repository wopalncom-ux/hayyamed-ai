'use client'
import NavSidebar from '@/components/NavSidebar'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { api } from '@/lib/api'
import { getAuth } from '@/lib/auth'

const COLORS = ['#00e5a0', '#3b82f6', '#a78bfa', '#f97316', '#ef4444', '#fbbf24', '#06b6d4']
const statusColors = { 'Hot Lead': '#ef4444', 'Cold Lead': '#3b82f6', 'New Lead': '#f97316', 'Customer': '#00e5a0' }
const channelIcons = { 'WhatsApp': '💬', 'Instagram': '📸', 'Facebook': '👤', 'Telegram': '✈️', 'Email': '📧' }
const channelColors = { 'WhatsApp': '#00e5a0', 'Instagram': '#a78bfa', 'Facebook': '#3b82f6', 'Telegram': '#f97316', 'Email': '#fbbf24' }

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
    channel: c.channel?.type || c.channelType || 'WhatsApp',
    status: c.contact?.status === 'WON' ? 'Customer' : c.contact?.status === 'QUALIFYING' ? 'Hot Lead' : c.contact?.status === 'CONTACTED' ? 'Cold Lead' : 'New Lead',
    score: c.contact?.score || 0,
    isNew: c.status === 'OPEN',
    convId: c.id,
    contactId: c.contact?.id,
    lastMsgAt: c.lastMsgAt,
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
  const [filterChannel, setFilterChannel] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
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
    return true
  })

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
      // Update conversation preview
      setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, msg: text, time: 'Now' } : c))
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

        {/* Conversation List */}
        <div style={{ width: '295px', borderRight: '1px solid #1a2235', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#0c0f1a' }}>
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
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['All', 'WhatsApp', 'Instagram', 'Facebook'].map(ch => (
                <button key={ch} onClick={() => setFilterChannel(ch)}
                  style={{ padding: '3px 8px', background: filterChannel === ch ? (channelColors[ch] || '#00e5a0') + '22' : '#111622', border: `1px solid ${filterChannel === ch ? channelColors[ch] || '#00e5a0' : '#1a2235'}`, borderRadius: '4px', color: filterChannel === ch ? channelColors[ch] || '#00e5a0' : '#475569', fontSize: '10px', cursor: 'pointer' }}>
                  {ch === 'All' ? 'All' : channelIcons[ch] + ' ' + ch}
                </button>
              ))}
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
                      <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', fontSize: '9px', background: '#0c0f1a', borderRadius: '50%', padding: '1px' }}>{channelIcons[c.channel]}</div>
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
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '14px' }}>
              Select a conversation to start
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2235', background: '#0c0f1a', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#0a0f1a' }}>{selected.avatar}</div>
                  <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', fontSize: '10px', background: '#0c0f1a', borderRadius: '50%', padding: '1px' }}>{channelIcons[selected.channel]}</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selected.name}
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: (statusColors[selected.status] || '#64748b') + '22', color: statusColors[selected.status] || '#64748b' }}>{selected.status}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{selected.phone}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {selected.contactId && (
                    <a href={`/contacts/${selected.contactId}`}
                      style={{ padding: '6px 11px', background: '#111622', border: '1px solid #1a2235', borderRadius: '6px', color: '#94a3b8', fontSize: '11px', textDecoration: 'none' }}>
                      View Profile
                    </a>
                  )}
                  <button onClick={() => setAiMode(!aiMode)}
                    style={{ padding: '6px 11px', background: aiMode ? '#00e5a0' : 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.2)', borderRadius: '6px', color: aiMode ? '#0a0f1a' : '#00e5a0', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
                    🤖 {aiMode ? 'AI ON' : 'AI'}
                  </button>
                </div>
              </div>

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
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2235', background: '#0c0f1a', flexShrink: 0 }}>
                {aiMode && <div style={{ padding: '5px 10px', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', borderRadius: '5px', marginBottom: '8px', fontSize: '11px', color: '#8b5cf6' }}>🤖 AI Mode — messages will also trigger AI reply</div>}
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
