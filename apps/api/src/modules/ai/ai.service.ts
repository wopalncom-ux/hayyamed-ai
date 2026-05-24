// ============================================
// AI SERVICE — OpenAI GPT-4 Integration
// apps/api/src/modules/ai/ai.service.ts
// ============================================

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name)
  private openai: OpenAI

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') })
  }

  // ─── GENERATE AI REPLY ───────────────────
  async generateReply(conversationId: string, orgId: string): Promise<string> {
    // Load business context
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true }
    })

    // Load conversation history
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    // Load contact info
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    })

    const systemPrompt = `
You are an AI customer service assistant for ${org?.name}, a ${org?.industry} business in Qatar.
You respond in the same language the customer uses (Arabic or English).
Be professional, friendly, and helpful. Keep replies concise (2-3 sentences max).
Your goal: answer questions, qualify leads, and book appointments.

Business context:
- Name: ${org?.name}
- Industry: ${org?.industry}
- Country: Qatar (QAR currency)

Customer: ${conversation?.contact?.name || 'Unknown'}
Lead status: ${conversation?.contact?.status || 'NEW'}

Important rules:
- If customer asks about pricing, give general info and offer to book a consultation
- If customer wants to book, ask for their preferred time
- Never promise specific prices without confirmation
- Always end with a clear call to action
- For Arabic messages, reply in Arabic
`

    const chatMessages = messages.map(m => ({
      role: m.senderId ? 'assistant' : 'user' as const,
      content: m.content || '',
    })).filter(m => m.content)

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatMessages,
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  }

  // ─── SCORE LEAD ──────────────────────────
  async scoreLead(contactId: string): Promise<{ score: number; reasoning: string }> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        conversations: {
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } }
        }
      }
    })

    if (!contact) return { score: 0, reasoning: 'Contact not found' }

    const recentMessages = contact.conversations
      .flatMap(c => c.messages)
      .map(m => m.content)
      .filter(Boolean)
      .join('\n')

    const prompt = `
Analyze this lead and score them from 0-100 based on their likelihood to convert.

Lead info:
- Name: ${contact.name}
- Source: ${contact.source}
- Status: ${contact.status}
- Recent messages: ${recentMessages || 'No messages yet'}

Score based on:
- Buying intent signals (asking about price, availability, booking)
- Engagement level (response speed, question quality)
- Lead source quality
- Stage in funnel

Return JSON only:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "signals": ["<signal1>", "<signal2>"],
  "recommended_action": "<what to do next>"
}
`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}')
      return { score: result.score || 0, reasoning: result.reasoning || '' }
    } catch {
      return { score: 50, reasoning: 'Unable to analyze' }
    }
  }

  // ─── CLASSIFY INTENT ─────────────────────
  async classifyIntent(message: string): Promise<{
    intent: string
    language: 'ar' | 'en'
    sentiment: 'positive' | 'neutral' | 'negative'
    topics: string[]
  }> {
    const prompt = `
Classify this customer message:
"${message}"

Return JSON:
{
  "intent": "booking | pricing | info | complaint | greeting | farewell | other",
  "language": "ar | en",
  "sentiment": "positive | neutral | negative",
  "topics": ["<topic1>", "<topic2>"]
}
`
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      response_format: { type: 'json_object' },
    })

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{}')
    } catch {
      return { intent: 'other', language: 'ar', sentiment: 'neutral', topics: [] }
    }
  }

  // ─── GENERATE CAMPAIGN MESSAGE ────────────
  async generateCampaignMessage(prompt: string, tone: string, language: string): Promise<string> {
    const systemPrompt = `
You are a WhatsApp marketing copywriter for Qatar/GCC market.
Write in ${language === 'ar' ? 'Arabic' : 'English'}.
Tone: ${tone}
Keep it under 300 characters for WhatsApp.
Include 1-2 relevant emojis.
End with a clear call to action.
`
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.8,
    })

    return response.choices[0]?.message?.content || ''
  }

  // ─── GENERATE REPORT INSIGHTS ────────────
  async generateInsights(metrics: Record<string, any>): Promise<string[]> {
    const prompt = `
Analyze these CRM metrics and provide 3 actionable business insights:
${JSON.stringify(metrics, null, 2)}

Return JSON array of exactly 3 insights:
["<insight 1>", "<insight 2>", "<insight 3>"]
Each insight should be specific and actionable (1-2 sentences).
`
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '[]')
      return Array.isArray(result) ? result : result.insights || []
    } catch {
      return []
    }
  }

  // ─── TRANSLATE MESSAGE ───────────────────
  async translate(text: string, targetLang: 'ar' | 'en'): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Translate to ${targetLang === 'ar' ? 'Arabic' : 'English'}. Return only the translation:\n${text}`
      }],
      max_tokens: 300,
    })
    return response.choices[0]?.message?.content || text
  }
}
