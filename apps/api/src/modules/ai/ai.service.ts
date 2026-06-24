import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaService } from '../../database/prisma.service'
import { AIObservabilityService } from '../ai-observability/ai-observability.service'

type Provider = 'openai' | 'anthropic' | 'gemini' | 'groq'

interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string }

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name)
  private openai?: OpenAI
  private anthropic?: Anthropic
  private gemini?: GoogleGenerativeAI
  private groq?: OpenAI // Groq uses OpenAI-compatible SDK

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private obs: AIObservabilityService,
  ) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY')
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey })

    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY')
    if (anthropicKey) this.anthropic = new Anthropic({ apiKey: anthropicKey })

    const geminiKey = this.config.get<string>('GEMINI_API_KEY') || this.config.get<string>('GOOGLE_AI_API_KEY')
    if (geminiKey) this.gemini = new GoogleGenerativeAI(geminiKey)

    const groqKey = this.config.get<string>('GROQ_API_KEY')
    if (groqKey) this.groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' })

    this.logger.log(`AI providers initialized: ${[
      openaiKey ? 'openai' : null,
      anthropicKey ? 'anthropic' : null,
      geminiKey ? 'gemini' : null,
      groqKey ? 'groq' : null,
    ].filter(Boolean).join(', ') || 'none'}`)
  }

  // ─── Multi-provider router ────────────────────────────────────────────────
  async complete(
    messages: ChatMessage[],
    opts: { provider?: Provider; model?: string; maxTokens?: number; temperature?: number; orgId?: string; module?: string; action?: string } = {},
  ): Promise<string> {
    const { provider, model, maxTokens = 400, temperature = 0.7, orgId, module = 'ai', action = 'complete' } = opts

    const systemMsg = messages.find(m => m.role === 'system')?.content || ''
    const chatMsgs  = messages.filter(m => m.role !== 'system')

    const priority: Provider[] = provider
      ? [provider, 'openai', 'anthropic', 'gemini', 'groq']
      : ['openai', 'anthropic', 'gemini', 'groq']

    for (const p of priority) {
      try {
        const start = Date.now()
        let result = ''
        let usedModel = model || ''
        let promptTokens = 0, completionTokens = 0

        if (p === 'anthropic' && this.anthropic) {
          usedModel = model || 'claude-haiku-4-5-20251001'
          const resp = await this.anthropic.messages.create({
            model: usedModel, max_tokens: maxTokens, system: systemMsg,
            messages: chatMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          })
          result = (resp.content[0] as any)?.text || ''
          promptTokens = resp.usage.input_tokens
          completionTokens = resp.usage.output_tokens
        } else if (p === 'gemini' && this.gemini) {
          usedModel = model || 'gemini-1.5-flash'
          const genModel = this.gemini.getGenerativeModel({ model: usedModel })
          const history = chatMsgs.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
          const lastMsg = chatMsgs.at(-1)?.content || ''
          const chat = genModel.startChat({ history, systemInstruction: systemMsg })
          const r = await chat.sendMessage(lastMsg)
          result = r.response.text()
          const meta = r.response.usageMetadata
          promptTokens = meta?.promptTokenCount ?? 0
          completionTokens = meta?.candidatesTokenCount ?? 0
        } else if (p === 'groq' && this.groq) {
          usedModel = model || 'llama-3.1-8b-instant'
          const resp = await this.groq.chat.completions.create({ model: usedModel, messages: messages as any, max_tokens: maxTokens, temperature })
          result = resp.choices[0]?.message?.content || ''
          promptTokens = resp.usage?.prompt_tokens ?? 0
          completionTokens = resp.usage?.completion_tokens ?? 0
        } else if (p === 'openai' && this.openai) {
          usedModel = model || 'gpt-4o-mini'
          const resp = await this.openai.chat.completions.create({ model: usedModel, messages: messages as any, max_tokens: maxTokens, temperature })
          result = resp.choices[0]?.message?.content || ''
          promptTokens = resp.usage?.prompt_tokens ?? 0
          completionTokens = resp.usage?.completion_tokens ?? 0
        } else {
          continue
        }

        const latencyMs = Date.now() - start
        if (orgId) {
          this.obs.log({ orgId, module, action, provider: p, model: usedModel, promptTokens, completionTokens, latencyMs, success: true }).catch(() => {})
        }
        return result
      } catch (err: any) {
        this.logger.warn(`AI provider ${p} failed: ${err.message}`)
        if (orgId) {
          this.obs.log({ orgId, module, action, provider: p, model: model || p, latencyMs: 0, success: false, errorType: err.message?.slice(0, 100) }).catch(() => {})
        }
      }
    }

    throw new ServiceUnavailableException('All AI providers unavailable')
  }

  // ─── GENERATE AI REPLY ────────────────────────────────────────────────────
  async generateReply(conversationId: string, orgId: string): Promise<string> {
    const [org, messages, conversation] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId }, include: { settings: true } }),
      this.prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 20 }),
      this.prisma.conversation.findUnique({ where: { id: conversationId }, include: { contact: true } }),
    ])

    const systemPrompt = `You are an AI customer service assistant for ${org?.name}, a ${org?.industry} business in Qatar.
You respond in the same language the customer uses (Arabic or English).
Be professional, friendly, and helpful. Keep replies concise (2-3 sentences max).
Your goal: answer questions, qualify leads, and book appointments.
Customer: ${conversation?.contact?.name || 'Unknown'} — Lead status: ${conversation?.contact?.status || 'NEW'}
Never promise specific prices without confirmation. Always end with a clear call to action.`

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: (m.senderId ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content || '',
      })).filter(m => m.content),
    ]

    return this.complete(chatMessages, { provider: 'groq', maxTokens: 300, temperature: 0.7, orgId, module: 'chatbot', action: 'reply' })
  }

  // ─── SCORE LEAD ───────────────────────────────────────────────────────────
  async scoreLead(contactId: string): Promise<{ score: number; reasoning: string; recommended_action: string }> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        conversations: {
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
          orderBy: { lastMsgAt: 'desc' },
          take: 3,
        },
      },
    })
    if (!contact) return { score: 0, reasoning: 'Contact not found', recommended_action: 'Verify contact exists' }

    const msgCount = contact.conversations.reduce((n, c) => n + c.messages.length, 0)
    const recentMessages = contact.conversations
      .flatMap(c => c.messages)
      .slice(0, 8)
      .map(m => `[${m.senderId ? 'OUTBOUND' : 'INBOUND'}] ${m.content || `(${m.type})`}`)
      .join('\n')
    const daysSinceCreated = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / 86_400_000)

    const prompt = `You are a CRM lead scoring engine. Score this lead 0-100 for conversion likelihood.

Contact data:
- Name: ${contact.name}
- Source: ${contact.source || 'unknown'}
- Status: ${contact.status || 'NEW'}
- Tags: ${(contact as any).tags?.join(', ') || 'none'}
- Value estimate: ${(contact as any).value || 0} ${(contact as any).currency || 'QAR'}
- Days since created: ${daysSinceCreated}
- Conversations: ${contact.conversations.length}
- Total messages: ${msgCount}
- Recent messages: ${recentMessages || 'none'}

Scoring guide:
- 80-100: High engagement, clear intent, ready to close
- 60-79: Interested, responding, needs nurturing
- 40-59: Some engagement, unclear intent
- 20-39: Low engagement, cold
- 0-19: No activity, likely unqualified

Return ONLY valid JSON (no markdown, no explanation outside the JSON):
{"score":<0-100>,"reasoning":"<1-2 sentences>","recommended_action":"<specific next step>"}`

    let raw = ''
    try {
      raw = await this.complete(
        [{ role: 'user', content: prompt }],
        { maxTokens: 250, temperature: 0.3, module: 'lead-scoring', action: 'score' },
      )
      // Strip markdown code blocks if present
      const cleaned = raw.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0))
      const reasoning = parsed.reasoning || 'Scored based on activity data'
      const recommended_action = parsed.recommended_action || 'Follow up with contact'

      // Persist score to DB
      await this.prisma.contact.update({ where: { id: contactId }, data: { score } })

      return { score, reasoning, recommended_action }
    } catch {
      // Fallback: regex extract score from raw response
      const match = raw.match(/"score"\s*:\s*(\d+)/)
      const score = match ? Math.min(100, Number(match[1])) : 50
      await this.prisma.contact.update({ where: { id: contactId }, data: { score } }).catch(() => {})
      return { score, reasoning: 'Scored based on engagement signals', recommended_action: 'Follow up with contact' }
    }
  }

  // ─── SCORE ALL CONTACTS (batch, fire-and-forget) ──────────────────────────
  async scoreAllContacts(orgId: string): Promise<{ queued: number }> {
    const contacts = await this.prisma.contact.findMany({
      where: { orgId },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })
    // Process in background — don't await
    ;(async () => {
      for (const c of contacts) {
        try {
          await this.scoreLead(c.id)
          await new Promise(r => setTimeout(r, 300)) // ~3/sec to avoid rate limiting
        } catch { /* continue */ }
      }
      this.logger.log(`Scored ${contacts.length} contacts for org ${orgId}`)
    })()
    return { queued: contacts.length }
  }

  // ─── CLASSIFY INTENT ──────────────────────────────────────────────────────
  async classifyIntent(message: string): Promise<{
    intent: string; language: 'ar' | 'en'; sentiment: 'positive' | 'neutral' | 'negative'; topics: string[]
  }> {
    const prompt = `Classify this customer message: "${message}"
Return JSON: {"intent":"booking|pricing|info|complaint|greeting|farewell|other","language":"ar|en","sentiment":"positive|neutral|negative","topics":[]}`

    const result = await this.complete(
      [{ role: 'user', content: prompt }],
      { provider: 'groq', model: 'llama-3.1-8b-instant', maxTokens: 120 },
    )
    try { return JSON.parse(result) }
    catch { return { intent: 'other', language: 'ar', sentiment: 'neutral', topics: [] } }
  }

  // ─── GENERATE CAMPAIGN MESSAGE ────────────────────────────────────────────
  async generateCampaignMessage(prompt: string, tone: string, language: string): Promise<string> {
    const system = `You are a WhatsApp marketing copywriter for Qatar/GCC market.
Write in ${language === 'ar' ? 'Arabic' : 'English'}. Tone: ${tone}.
Keep under 300 characters. Include 1-2 relevant emojis. End with a clear CTA.`

    return this.complete(
      [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', maxTokens: 200, temperature: 0.8 },
    )
  }

  // ─── GENERATE REPORT INSIGHTS ─────────────────────────────────────────────
  async generateInsights(metrics: Record<string, any>): Promise<string[]> {
    const prompt = `Analyze these CRM metrics and provide 3 actionable business insights:
${JSON.stringify(metrics, null, 2)}
Return JSON array of exactly 3 insights: ["<insight1>","<insight2>","<insight3>"]`

    const result = await this.complete(
      [{ role: 'user', content: prompt }],
      { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 300 },
    )
    try {
      const parsed = JSON.parse(result)
      return Array.isArray(parsed) ? parsed : parsed.insights || []
    } catch { return [] }
  }

  // ─── TRANSLATE ────────────────────────────────────────────────────────────
  async translate(text: string, targetLang: 'ar' | 'en'): Promise<string> {
    return this.complete(
      [{ role: 'user', content: `Translate to ${targetLang === 'ar' ? 'Arabic' : 'English'}. Return only the translation:\n${text}` }],
      { provider: 'gemini', model: 'gemini-1.5-flash', maxTokens: 300 },
    )
  }

  // ─── PROVIDER STATUS ──────────────────────────────────────────────────────
  getProviderStatus(): Record<Provider, boolean> {
    return {
      openai:    !!this.openai,
      anthropic: !!this.anthropic,
      gemini:    !!this.gemini,
      groq:      !!this.groq,
    }
  }
}
