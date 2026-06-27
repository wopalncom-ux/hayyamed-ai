// Lightweight negative-sentiment / frustration detector (English + Arabic).
// Catches unhappy customers who are complaining even if they don't ask for a
// human. Phrase/word based to keep false positives reasonable.
const EN = [
  'terrible', 'awful', 'worst', 'horrible', 'useless', 'rubbish', 'disgusting',
  'angry', 'furious', 'frustrated', 'annoyed', 'unacceptable', 'ridiculous',
  'scam', 'cheated', 'rip off', 'rip-off', 'refund', 'money back', 'complaint',
  'complain', 'never again', 'very bad', 'so bad', 'waste of', 'disappointed',
  'not working', "doesn't work", 'broken', 'cancel my', 'want to cancel',
]
const AR = [
  'سيء', 'سيئة', 'زفت', 'فاشل', 'فاشلة', 'غاضب', 'زعلان', 'مستاء', 'استرجاع',
  'استرداد', 'ارجاع فلوسي', 'نصب', 'احتيال', 'شكوى', 'مقرف', 'تعبان منكم', 'الغاء',
]

export function detectNegative(text?: string): boolean {
  if (!text) return false
  const lower = String(text).toLowerCase()
  if (EN.some(w => lower.includes(w))) return true
  return AR.some(w => text.includes(w))
}
