// Detects when a customer is explicitly asking to reach a human (English + Arabic).
// Phrase-based to keep false positives low — we only escalate on clear intent.
const EN_PHRASES = [
  'talk to a human', 'talk to human', 'speak to a human', 'speak to human',
  'real person', 'live person', 'human agent', 'human please', 'a human',
  'talk to an agent', 'talk to agent', 'speak to an agent', 'speak to agent',
  'talk to someone', 'speak to someone', 'talk to a person', 'speak to a person',
  'speak to a representative', 'a representative', 'customer service', 'customer support',
  'connect me to', 'i want a human', 'i need a human', 'need a human', 'want a human',
  'talk to your team', 'speak to your team', 'talk to staff', 'speak to staff',
]
const AR_PHRASES = [
  'موظف', 'بشري', 'شخص حقيقي', 'ممثل', 'خدمة العملاء', 'اكلم حد', 'أكلم حد',
  'اكلم موظف', 'أكلم موظف', 'اريد التحدث', 'أريد التحدث', 'محتاج اكلم', 'ابغى اكلم',
]

export function wantsHuman(text?: string): boolean {
  if (!text) return false
  const lower = String(text).toLowerCase()
  if (EN_PHRASES.some(p => lower.includes(p))) return true
  return AR_PHRASES.some(p => text.includes(p))
}
