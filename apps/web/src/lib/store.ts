// ============================================
// FRONTEND API CLIENT + ZUSTAND STORE
// apps/web/src/lib/
// ============================================

// ─── api.ts ─────────────────────────────────
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── store/auth.store.ts ─────────────────────
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  logo?: string
}

interface AuthStore {
  user: User | null
  org: Org | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, org: Org, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, org, accessToken) =>
        set({ user, org, accessToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, org: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'hayyamed-auth' }
  )
)

// ─── store/inbox.store.ts ────────────────────
interface Conversation {
  id: string
  contactId: string
  contact: { name: string; phone: string; avatar?: string }
  channelType: string
  status: string
  lastMessage: string
  lastMsgAt: string
  isRead: boolean
  assigneeId?: string
  tags: string[]
  unreadCount?: number
}

interface Message {
  id: string
  content: string
  type: string
  senderId?: string
  isAI: boolean
  isFromBot: boolean
  status: string
  mediaUrl?: string
  createdAt: string
}

interface InboxStore {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]>
  filters: { status: string; channel: string; assignee: string }

  setConversations: (convs: Conversation[]) => void
  setActiveConversation: (id: string) => void
  addMessage: (convId: string, msg: Message) => void
  setMessages: (convId: string, msgs: Message[]) => void
  updateConversation: (id: string, data: Partial<Conversation>) => void
  setFilters: (filters: Partial<InboxStore['filters']>) => void
  markAsRead: (id: string) => void
}

export const useInboxStore = create<InboxStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  filters: { status: 'open', channel: 'all', assignee: 'all' },

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (convId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), msg],
      }
    })),
  setMessages: (convId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [convId]: msgs } })),
  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) => c.id === id ? { ...c, ...data } : c)
    })),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  markAsRead: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, isRead: true, unreadCount: 0 } : c
      )
    })),
}))

// ─── hooks/useSocket.ts ──────────────────────
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken } = useAuthStore()
  const { addMessage, updateConversation } = useInboxStore()

  useEffect(() => {
    if (!accessToken) return

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/ws`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    })

    socket.on('connect', () => console.log('🔗 Connected to Hayyamed AI'))
    socket.on('disconnect', () => console.log('🔌 Disconnected'))

    socket.on('message:new', ({ conversationId, message }) => {
      addMessage(conversationId, message)
      updateConversation(conversationId, {
        lastMessage: message.content,
        lastMsgAt: message.createdAt,
        isRead: false,
      })
    })

    socket.on('lead:new', (contact) => {
      console.log('🔥 New lead:', contact.name)
    })

    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [accessToken])

  return socketRef.current
}

// ─── hooks/useConversations.ts ───────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useConversations(filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      const { data } = await api.get('/conversations', { params: filters })
      return data
    },
    refetchInterval: 30000,
  })
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`)
      return data
    },
    enabled: !!conversationId,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, { content })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    }
  })
}

export function useAISuggest(conversationId: string) {
  return useQuery({
    queryKey: ['ai-suggest', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/ai/suggest/${conversationId}`)
      return data
    },
    enabled: !!conversationId,
    staleTime: 10000,
  })
}
