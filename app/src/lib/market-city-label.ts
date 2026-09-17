/**
 * Display label for each market's default city — the only city string the
 * always-mounted chrome (Navbar/Footer) needs.
 *
 * Why a leaf and not `cityBySlug()`: `lib/map/user-place` builds its table from
 * `data/world-places` (88 KB of city rows). Footer and Navbar render on ~208
 * routes, so importing it for one label put a measured 106 KB chunk in the
 * shared client bundle of every page. 74 rows cost ~4 KB instead.
 *
 * Keyed by slug (not country) so several markets can share a city. Drift from
 * the real catalog is asserted in `market-city-label.check.ts`, which runs in
 * node and may import the full catalog freely.
 *
 * ponytail: default cities only. If chrome ever needs an arbitrary city label,
 * pass it down from the server instead of widening this table.
 */

/** `[ka, en]` */
export const MARKET_CITY_LABEL: Record<string, readonly [string, string]> = {
  'almaty': ['ალმატი', 'Almaty'],
  'amsterdam': ['ამსტერდამი', 'Amsterdam'],
  'athens': ['ათენი', 'Athens'],
  'auckland': ['ოკლენდი', 'Auckland'],
  'baku': ['ბაქო', 'Baku'],
  'bangkok': ['ბანგკოკი', 'Bangkok'],
  'belgrade': ['ბელგრადი', 'Belgrade'],
  'berlin': ['ბერლინი', 'Berlin'],
  'bogota': ['ბოგოტა', 'Bogotá'],
  'bratislava': ['ბრატისლავა', 'Bratislava'],
  'brussels': ['ბრიუსელი', 'Brussels'],
  'bucharest': ['ბუქარესტი', 'Bucharest'],
  'budapest': ['ბუდაპეშტი', 'Budapest'],
  'buenos-aires': ['ბუენოს-აირესი', 'Buenos Aires'],
  'cairo': ['კაირო', 'Cairo'],
  'casablanca': ['კასაბლანკა', 'Casablanca'],
  'colombo': ['კოლომბო', 'Colombo'],
  'copenhagen': ['კოპენჰაგენი', 'Copenhagen'],
  'dhaka': ['დაკა', 'Dhaka'],
  'dubai': ['დუბაი', 'Dubai'],
  'dublin': ['დუბლინი', 'Dublin'],
  'helsinki': ['ჰელსინკი', 'Helsinki'],
  'ho-chi-minh-city': ['ჰო-ჩი-მინჰი', 'Ho Chi Minh City'],
  'hong-kong': ['ჰონგ-კონგი', 'Hong Kong'],
  'istanbul': ['სტამბოლი', 'Istanbul'],
  'jakarta': ['ჯაკარტა', 'Jakarta'],
  'johannesburg': ['იოჰანესბურგი', 'Johannesburg'],
  'karachi': ['კარაჩი', 'Karachi'],
  'kathmandu': ['კატმანდუ', 'Kathmandu'],
  'kuala-lumpur': ['კუალა-ლუმპური', 'Kuala Lumpur'],
  'kyiv': ['კიევი', 'Kyiv'],
  'lagos': ['ლაგოსი', 'Lagos'],
  'lima': ['ლიმა', 'Lima'],
  'lisbon': ['ლისაბონი', 'Lisbon'],
  'ljubljana': ['ლიუბლიანა', 'Ljubljana'],
  'london': ['ლონდონი', 'London'],
  'luxembourg': ['ლუქსემბურგი', 'Luxembourg'],
  'madrid': ['მადრიდი', 'Madrid'],
  'manila': ['მანილა', 'Manila'],
  'mexico-city': ['მეხიკო', 'Mexico City'],
  'mumbai': ['მუმბაი', 'Mumbai'],
  'nairobi': ['ნაირობი', 'Nairobi'],
  'new-york': ['ნიუ-იორკი', 'New York'],
  'nicosia': ['ნიქოზია', 'Nicosia'],
  'oslo': ['ოსლო', 'Oslo'],
  'paris': ['პარიზი', 'Paris'],
  'phnom-penh': ['ფნომ-პენი', 'Phnom Penh'],
  'prague': ['პრაღა', 'Prague'],
  'quito': ['კიტო', 'Quito'],
  'reykjavik': ['რეიკიავიკი', 'Reykjavik'],
  'riga': ['რიგა', 'Riga'],
  'riyadh': ['რიადი', 'Riyadh'],
  'rome': ['რომი', 'Rome'],
  'santiago': ['სანტიაგო', 'Santiago'],
  'sao-paulo': ['სან-პაულუ', 'São Paulo'],
  'seoul': ['სეული', 'Seoul'],
  'shanghai': ['შანხაი', 'Shanghai'],
  'singapore': ['სინგაპური', 'Singapore'],
  'sofia': ['სოფია', 'Sofia'],
  'stockholm': ['სტოკჰოლმი', 'Stockholm'],
  'sydney': ['სიდნეი', 'Sydney'],
  'tallinn': ['ტალინი', 'Tallinn'],
  'tashkent': ['ტაშკენტი', 'Tashkent'],
  'tbilisi': ['თბილისი', 'Tbilisi'],
  'tokyo': ['ტოკიო', 'Tokyo'],
  'toronto': ['ტორონტო', 'Toronto'],
  'valletta': ['ვალეტა', 'Valletta'],
  'vienna': ['ვენა', 'Vienna'],
  'vientiane': ['ვიენტიანი', 'Vientiane'],
  'vilnius': ['ვილნიუსი', 'Vilnius'],
  'warsaw': ['ვარშავა', 'Warsaw'],
  'yangon': ['იანგონი', 'Yangon'],
  'yerevan': ['ერევანი', 'Yerevan'],
  'zagreb': ['ზაგრები', 'Zagreb'],
  'zurich': ['ციურიხი', 'Zurich'],
}

/** Localized default-city label, or '' when the slug is not a market default. */
export function marketCityLabel(slug: string | null | undefined, lang: string): string {
  if (!slug) return ''
  const row = MARKET_CITY_LABEL[slug]
  return row ? (lang === 'ka' ? row[0] : row[1]) : ''
}
