import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../database/prisma.service'
import OpenAI from 'openai'

const CHUNK_SIZE = 400
const CHUNK_OVERLAP = 50
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIM = 1536

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name)
  private openai: OpenAI | null = null

  constructor(private prisma: PrismaService) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
  }

  // Knowledge gaps — questions the AI answered with no KB context (best-effort).
  async logGap(orgId: string, question: string, channel: string) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "knowledge_gaps" ("id","orgId","question","channel","createdAt")
        VALUES (${randomUUID()}, ${orgId}, ${question.slice(0, 500)}, ${channel}, NOW())
      `
    } catch { /* best-effort */ }
  }

  listGaps(orgId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM "knowledge_gaps" WHERE "orgId" = ${orgId} ORDER BY "createdAt" DESC LIMIT 50
    `
  }

  async clearGaps(orgId: string) {
    await this.prisma.$executeRaw`DELETE FROM "knowledge_gaps" WHERE "orgId" = ${orgId}`
    return { ok: true }
  }

  private chunkText(text: string): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(' '))
      i += CHUNK_SIZE - CHUNK_OVERLAP
    }
    return chunks.filter(c => c.trim().length > 20)
  }

  private async embedText(text: string): Promise<number[] | null> {
    if (!this.openai) return null
    try {
      const resp = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
      })
      return resp.data[0].embedding
    } catch (err) {
      this.logger.warn(`Embedding failed: ${err.message}`)
      return null
    }
  }

  async indexSource(sourceId: string): Promise<void> {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { knowledgeBase: { select: { orgId: true } } },
    })
    if (!source || !source.content) return
    const orgId = (source as any).knowledgeBase?.orgId || ''

    await this.prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: 'processing' },
    })

    try {
      // Delete old chunks for this source
      await this.prisma.knowledgeChunk.deleteMany({ where: { sourceId } })

      const chunks = this.chunkText(source.content)
      let indexed = 0

      for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i]
        const embedding = await this.embedText(text)

        if (embedding) {
          // Use raw SQL to insert the vector type (Prisma does not support Unsupported types in create)
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO knowledge_chunks (id, "sourceId", "knowledgeBaseId", "orgId", content, embedding, "chunkIndex", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, $6, now())`,
            sourceId,
            source.knowledgeBaseId,
            orgId,
            text,
            `[${embedding.join(',')}]`,
            i,
          )
        } else {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO knowledge_chunks (id, "sourceId", "knowledgeBaseId", "orgId", content, "chunkIndex", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())`,
            sourceId,
            source.knowledgeBaseId,
            orgId,
            text,
            i,
          )
        }
        indexed++
      }

      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'ready', chunkCount: indexed, lastIndexed: new Date() },
      })

      this.logger.log(`Indexed source ${sourceId}: ${indexed} chunks`)
    } catch (err) {
      this.logger.error(`Failed to index source ${sourceId}: ${err.message}`)
      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'failed' },
      })
    }
  }

  async semanticSearch(orgId: string, knowledgeBaseId: string, query: string, topK = 5): Promise<string[]> {
    if (!this.openai) {
      // Fallback: keyword search when no embedding key
      const chunks = await this.prisma.$queryRawUnsafe<{ content: string }[]>(
        `SELECT content FROM knowledge_chunks
         WHERE "knowledgeBaseId" = $1
         AND content ILIKE $2
         LIMIT $3`,
        knowledgeBaseId,
        `%${query.slice(0, 100)}%`,
        topK,
      )
      return chunks.map(c => c.content)
    }

    const queryEmbedding = await this.embedText(query)
    if (!queryEmbedding) return []

    // Cosine-distance threshold: drop clearly-irrelevant chunks so the AI isn't
    // fed unrelated context (and unanswered questions surface as knowledge gaps).
    const results = await this.prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT content
       FROM knowledge_chunks
       WHERE "knowledgeBaseId" = $1 AND (embedding <=> $2::vector) < 0.8
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      knowledgeBaseId,
      `[${queryEmbedding.join(',')}]`,
      topK,
    )

    return results.map(r => r.content)
  }

  async getContextForQuery(orgId: string, query: string, topK = 5): Promise<string> {
    // Find all KBs for this org (used by any active agent)
    const kbs = await this.prisma.knowledgeBase.findMany({ where: { orgId }, select: { id: true } })
    if (!kbs.length) return ''

    const allChunks: string[] = []
    for (const kb of kbs) {
      const chunks = await this.semanticSearch(orgId, kb.id, query, topK)
      allChunks.push(...chunks)
    }

    return allChunks.slice(0, topK).join('\n\n---\n\n')
  }
}
