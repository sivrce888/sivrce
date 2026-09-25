/** Shared Sivrce Score → tier word. The score rates listing quality (verification,
 *  photos, amenities, documents) — never price, so no tier may claim "great price":
 *  price verdicts come only from real comps (price-scale.ts). Default ka keeps DB/mapper callers. */

const TIER = {
  ka: ['შესანიშნავი', 'ძალიან კარგი', 'საშუალო'],
  en: ['Excellent', 'Very good', 'Average'],
  de: ['Ausgezeichnet', 'Sehr gut', 'Durchschnitt'],
  ru: ['Отлично', 'Очень хорошо', 'Средне'],
  tr: ['Mükemmel', 'Çok iyi', 'Orta'],
  uk: ['Відмінно', 'Дуже добре', 'Середньо'],
  he: ['מצוין', 'טוב מאוד', 'בינוני'],
  ar: ['ممتاز', 'جيد جدًا', 'متوسط'],
  hy: ['Գերազանց', 'Շատ լավ', 'Միջին'],
  az: ['Əla', 'Çox yaxşı', 'Orta'],
} as const

export function aiLabel(score: number, lang: string = 'ka'): string {
  const row = TIER[lang as keyof typeof TIER] ?? TIER.en
  if (score >= 90) return row[0]
  if (score >= 75) return row[1]
  return row[2]
}
