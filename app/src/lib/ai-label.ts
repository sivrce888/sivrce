/** Shared AI score → Georgian label (search cards + DB listing mapper). */
export function aiLabel(score: number): string {
  if (score >= 90) return 'შესანიშნავი ფასი'
  if (score >= 75) return 'კარგი შეთავაზება'
  return 'საშუალო'
}

