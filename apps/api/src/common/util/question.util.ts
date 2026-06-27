// Heuristic: is this customer message a substantive question worth logging as a
// knowledge gap (vs a greeting / filler)?
const FILLER = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no', 'bye',
  'salam', 'مرحبا', 'شكرا', 'أهلا', 'اهلا', 'السلام عليكم', 'تمام', 'حسنا']

export function isSubstantiveQuestion(text?: string): boolean {
  if (!text) return false
  const raw = text.trim()
  const t = raw.toLowerCase()
  if (t.length < 8) return false
  if (FILLER.some(g => t === g || (t.startsWith(g + ' ') && t.length < 16))) return false
  const words = t.split(/\s+/).filter(Boolean).length
  return words >= 3 || raw.includes('?') || raw.includes('؟')
}
