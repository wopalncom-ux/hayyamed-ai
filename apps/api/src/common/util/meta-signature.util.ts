import { createHmac, timingSafeEqual } from 'crypto'
import { Logger } from '@nestjs/common'

const logger = new Logger('MetaSignature')

// Verifies Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw request
// body, keyed by the Meta App Secret) on inbound WhatsApp/Facebook/Instagram
// webhooks. Without this, anyone who finds the webhook URL can post fake
// payloads that get processed as real customer messages.
export function verifyMetaSignature(rawBody: Buffer | undefined, signatureHeader: string | string[] | undefined, appSecret: string | undefined): boolean {
  if (!appSecret) {
    logger.error('META_APP_SECRET is not configured — rejecting webhook (cannot verify authenticity)')
    return false
  }
  if (!rawBody || !signatureHeader || Array.isArray(signatureHeader)) return false

  const [scheme, receivedSig] = signatureHeader.split('=')
  if (scheme !== 'sha256' || !receivedSig) return false

  const expectedSig = createHmac('sha256', appSecret).update(rawBody).digest('hex')

  const expected = Buffer.from(expectedSig, 'utf8')
  const received = Buffer.from(receivedSig, 'utf8')
  if (expected.length !== received.length) return false

  return timingSafeEqual(expected, received)
}
