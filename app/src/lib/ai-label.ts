/** Shared AI score → label. Default ka keeps existing DB/mapper callers. */

const TIER = {
  ka: ['შესანიშნავი ფასი', 'კარგი შეთავაზება', 'საშუალო'],
  en: ['Great price', 'Good deal', 'Fair'],
  de: ['Top-Preis', 'Gutes Angebot', 'Durchschnitt'],
  ru: ['Отличная цена', 'Хорошее предложение', 'Средне'],
  tr: ['Harika fiyat', 'İyi fırsat', 'Orta'],
  uk: ['Чудова ціна', 'Гарна пропозиція', 'Середньо'],
  he: ['מחיר מצוין', 'עסקה טובה', 'בינוני'],
  ar: ['سعر ممتاز', 'عرض جيد', 'متوسط'],
  hy: ['Հիանալի գին', 'Լավ առաջարկ', 'Միջին'],
  az: ['Əla qiymət', 'Yaxşı təklif', 'Orta'],
} as const

export function aiLabel(score: number, lang: string = 'ka'): string {
  const row = TIER[lang as keyof typeof TIER] ?? TIER.en
  if (score >= 90) return row[0]
  if (score >= 75) return row[1]
  return row[2]
}
