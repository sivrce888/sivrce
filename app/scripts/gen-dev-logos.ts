import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { DEVELOPERS } from '../src/data/professionals'

const dir = path.join(process.cwd(), 'public', 'images', 'developers')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const devLogos: { slug: string; text: string; bg: string; color: string }[] = [
  { slug: 'm2-development', text: 'm²', bg: '#1E293B', color: '#3B82F6' },
  { slug: 'alliance-group', text: 'ALLIANCE', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'orbi-group', text: 'ORBI', bg: '#1E1B4B', color: '#818CF8' },
  { slug: 'archi', text: 'ARCHI', bg: '#064E3B', color: '#34D399' },
  { slug: 'axis', text: 'AXIS', bg: '#701A75', color: '#F0ABFC' },
  { slug: 'blox', text: 'BLOX', bg: '#18181B', color: '#F43F5E' },
  { slug: 'anagi', text: 'ANAGI', bg: '#172554', color: '#60A5FA' },
  { slug: 'metropol', text: 'METROPOL', bg: '#312E81', color: '#A5B4FC' },
  { slug: 'white-square', text: 'WHITE SQR', bg: '#0F172A', color: '#F8FAFC' },
  { slug: 'biograpi', text: 'BIOGRAPI', bg: '#451A03', color: '#FDBA74' },
  { slug: 'redix', text: 'REDIX', bg: '#4C0519', color: '#FB7185' },
  { slug: 'redco', text: 'REDCO', bg: '#881337', color: '#FDA4AF' },
  { slug: 'domus-development', text: 'DOMUS', bg: '#14532D', color: '#4ADE80' },
  { slug: 'monolith-group', text: 'MONOLITH', bg: '#2E1065', color: '#C084FC' },
  { slug: 'york-towers', text: 'YORK', bg: '#1E293B', color: '#38BDF8' },
  { slug: 'silk-development', text: 'SILK', bg: '#0284C7', color: '#FFFFFF' },
  { slug: 'lisi-development', text: 'LISI', bg: '#15803D', color: '#BBF7D0' },
  { slug: 'elt-group', text: 'ELT GROUP', bg: '#0369A1', color: '#7DD3FC' },
  { slug: 'gumbati-holding', text: 'GUMBATI', bg: '#4338CA', color: '#C7D2FE' },
  { slug: 'tekto-group', text: 'TEKTO', bg: '#0F766E', color: '#99F6E4' },
  { slug: 'dirsi', text: 'DIRSI', bg: '#B91C1C', color: '#FECACA' },
  { slug: 'apart-group', text: 'APART', bg: '#1E293B', color: '#F1F5F9' },
  { slug: 'king-david', text: 'KING DAVID', bg: '#78350F', color: '#FDE68A' },
  { slug: 'next-group', text: 'NEXT', bg: '#0369A1', color: '#E0F2FE' },
  { slug: 'guru-holding', text: 'GURU', bg: '#3730A3', color: '#E0E7FF' },
  { slug: 'european-village', text: 'EURO VILLAGE', bg: '#164E63', color: '#A5F3FC' },
  { slug: 'x2-development', text: 'X2', bg: '#18181B', color: '#E4E4E7' },
  { slug: 'console', text: 'CONSOLE', bg: '#312E81', color: '#C7D2FE' },
  { slug: 'grg-development', text: 'GRG', bg: '#1E293B', color: '#CBD5E1' },
  { slug: 'horizon-group', text: 'HORIZON', bg: '#0C4A6E', color: '#7DD3FC' },
  { slug: 'solana-development', text: 'SOLANA', bg: '#9A3412', color: '#FFEDD5' },
  { slug: 'one-development', text: 'ONE', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'gulfstream-group', text: 'GULFSTREAM', bg: '#1E1B4B', color: '#A5B4FC' },
  { slug: 'symbol', text: 'SYMBOL', bg: '#27272A', color: '#FAFAFA' },
  { slug: 'like-house', text: 'LIKE HOUSE', bg: '#831843', color: '#FBCFE8' },
  { slug: 'milestone-development', text: 'MILESTONE', bg: '#1E293B', color: '#94A3B8' },
  { slug: 'mziuri-development', text: 'MZIURI', bg: '#B45309', color: '#FEF3C7' },
  { slug: 'build-group', text: 'BUILD', bg: '#334155', color: '#F1F5F9' },
  { slug: 'altergeo', text: 'ALTERGEO', bg: '#0F766E', color: '#CCFBF1' },
  { slug: 'as-group-investment', text: 'AS GROUP', bg: '#1E1B4B', color: '#C7D2FE' },
  { slug: 'royal-group', text: 'ROYAL', bg: '#713F12', color: '#FEF08A' },
  { slug: 'gbg-development', text: 'GBG', bg: '#0F172A', color: '#E2E8F0' },
  { slug: 'apex-development', text: 'APEX', bg: '#172554', color: '#BFDBFE' },
  { slug: 'davide', text: 'DAVIDE', bg: '#581C87', color: '#E9D5FF' },
  { slug: 'dona-group', text: 'DONA', bg: '#831843', color: '#FCE7F3' },
  { slug: 'tetra-development', text: 'TETRA', bg: '#1E293B', color: '#E2E8F0' },
  { slug: 'vinci-development', text: 'VINCI', bg: '#0F172A', color: '#93C5FD' },
  { slug: 'forms-construction', text: 'FORMS', bg: '#334155', color: '#E2E8F0' },
  { slug: 'new-group', text: 'NEW GROUP', bg: '#1E1B4B', color: '#818CF8' },
  { slug: 'stellar-property', text: 'STELLAR', bg: '#312E81', color: '#A5B4FC' },
  { slug: 'seven-group', text: 'SEVEN', bg: '#0F172A', color: '#F8FAFC' },
  { slug: 'eco-lisi', text: 'ECO LISI', bg: '#14532D', color: '#86EFAC' },
  { slug: 'grande-group', text: 'GRANDE', bg: '#1E293B', color: '#CBD5E1' },
  { slug: 'premium-house', text: 'PREMIUM', bg: '#701A75', color: '#F5D0FE' },
  { slug: 'maqro-development', text: 'MAQRO', bg: '#1E1B4B', color: '#C7D2FE' },
  { slug: 'index-wealth-management', text: 'INDEX', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'ambassadori-group', text: 'AMBASSADORI', bg: '#713F12', color: '#FEF08A' },
  { slug: 'mardi-holding', text: 'MARDI', bg: '#0369A1', color: '#BAE6FD' },
  { slug: 'real-palace', text: 'REAL PALACE', bg: '#1E293B', color: '#CBD5E1' },
  { slug: 'nexus-group', text: 'NEXUS', bg: '#1E1B4B', color: '#A5B4FC' },
  { slug: 'ds-group', text: 'DS GROUP', bg: '#0F766E', color: '#99F6E4' },
  { slug: 'tower-group', text: 'TOWER', bg: '#1E293B', color: '#E2E8F0' },
  { slug: 'pala-group', text: 'PALA', bg: '#312E81', color: '#C7D2FE' },
  { slug: 'citron-group', text: 'CITRON', bg: '#A16207', color: '#FEF08A' },
  { slug: 'arcon', text: 'ARCON', bg: '#0F172A', color: '#94A3B8' },
  { slug: 'tempo', text: 'TEMPO', bg: '#1E1B4B', color: '#818CF8' },
  { slug: 'kolos', text: 'KOLOS', bg: '#334155', color: '#E2E8F0' },
  { slug: 'ande-group', text: 'ANDE', bg: '#172554', color: '#BFDBFE' },
  { slug: 'reside-development', text: 'RESIDE', bg: '#0C4A6E', color: '#BAE6FD' },
  { slug: 'livin', text: 'LIVIN', bg: '#14532D', color: '#A7F3D0' },
  { slug: 'ltd-megobroba', text: 'MEGOBROBA', bg: '#1E293B', color: '#E2E8F0' },
  { slug: 'marshall-development', text: 'MARSHALL', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'ocean-capital', text: 'OCEAN', bg: '#0369A1', color: '#E0F2FE' },
  { slug: 'eagle-hills-georgia', text: 'EAGLE HILLS', bg: '#1E1B4B', color: '#C7D2FE' },
  { slug: 'mira-development', text: 'MIRA', bg: '#312E81', color: '#A5B4FC' },
  { slug: 'idea-development', text: 'IDEA', bg: '#0F766E', color: '#CCFBF1' },
  { slug: 'alpha-home', text: 'ALPHA HOME', bg: '#1E293B', color: '#CBD5E1' },
  { slug: 'next-door', text: 'NEXT DOOR', bg: '#0284C7', color: '#F0F9FF' },
  { slug: 'loft-development', text: 'LOFT', bg: '#18181B', color: '#E4E4E7' },
  { slug: 'apollo-gs', text: 'APOLLO', bg: '#334155', color: '#F1F5F9' },
  { slug: 'grada', text: 'GRADA', bg: '#15803D', color: '#DCFCE7' },
  { slug: 'chargali-residence', text: 'CHARGALI', bg: '#1E293B', color: '#94A3B8' },
  { slug: 'inn-development', text: 'INN', bg: '#1E1B4B', color: '#C7D2FE' },
  { slug: 'lider-development', text: 'LIDER', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'gg-group', text: 'G&G', bg: '#312E81', color: '#A5B4FC' },
  { slug: 'vr-holding', text: 'VR HOLDING', bg: '#0F766E', color: '#99F6E4' },
  { slug: 'moedani', text: 'MOEDANI', bg: '#831843', color: '#FCE7F3' },
  { slug: 'gtb-development', text: 'GTB', bg: '#1E293B', color: '#E2E8F0' },
  { slug: 'ig-development', text: 'IG', bg: '#172554', color: '#BFDBFE' },
  { slug: 'alliance-city', text: 'ALLIANCE CITY', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'simetria-group', text: 'SIMETRIA', bg: '#1E1B4B', color: '#C7D2FE' },
  { slug: 'devart-group', text: 'DEVART', bg: '#14532D', color: '#A7F3D0' },
  { slug: 'quadrum-global', text: 'QUADRUM', bg: '#1E293B', color: '#94A3B8' },
  { slug: 'ktw-development', text: 'KTW', bg: '#713F12', color: '#FEF08A' },
  { slug: 'structura-development', text: 'STRUCTURA', bg: '#0F172A', color: '#38BDF8' },
  { slug: 'eco-invest', text: 'ECO INVEST', bg: '#15803D', color: '#BBF7D0' },
  { slug: 'gradburg-development', text: 'GRADBURG', bg: '#312E81', color: '#A5B4FC' },
  { slug: 'urbanique-group', text: 'URBANIQUE', bg: '#1E293B', color: '#E2E8F0' },
  { slug: 'kolkhi-group', text: 'KOLKHI', bg: '#0C4A6E', color: '#BAE6FD' },
  // UAE seed (projects-new-uae.ts)
  { slug: 'danube-properties', text: 'DANUBE', bg: '#7C2D12', color: '#FED7AA' },
  { slug: 'deyaar', text: 'DEYAAR', bg: '#1E3A8A', color: '#BFDBFE' },
  { slug: 'tiger-properties', text: 'TIGER', bg: '#713F12', color: '#FDE68A' },
  { slug: 'nshama', text: 'NSHAMA', bg: '#065F46', color: '#A7F3D0' },
  { slug: 'dubai-properties', text: 'DP DUBAI', bg: '#0F172A', color: '#FCD34D' },
  { slug: 'wasl-properties', text: 'WASL', bg: '#155E75', color: '#A5F3FC' },
  { slug: 'ithra-dubai', text: 'ITHRA', bg: '#312E81', color: '#C7D2FE' },
  { slug: 'arada', text: 'ARADA', bg: '#134E4A', color: '#99F6E4' },
  { slug: 'shurooq', text: 'SHUROOQ', bg: '#3F6212', color: '#D9F99D' },
  { slug: 'reportage-properties', text: 'REPORTAGE', bg: '#1E293B', color: '#93C5FD' },
  { slug: 'eagle-hills', text: 'EAGLE HILLS', bg: '#1E1B4B', color: '#FCD34D' },
  { slug: 'bloom-holding', text: 'BLOOM', bg: '#14532D', color: '#BBF7D0' },
  { slug: 'modon-properties', text: 'MODON', bg: '#7F1D1D', color: '#FECACA' },
  { slug: 'q-properties', text: 'Q PROPERTIES', bg: '#0C4A6E', color: '#BAE6FD' },
  { slug: 'seven-tides', text: 'SEVEN TIDES', bg: '#0F172A', color: '#7DD3FC' },
  { slug: 'kleindienst-group', text: 'KLEINDIENST', bg: '#334155', color: '#E2E8F0' },
  { slug: 'al-hamra', text: 'AL HAMRA', bg: '#4C0519', color: '#FECDD3' },
  { slug: 'samana-developers', text: 'SAMANA', bg: '#701A75', color: '#F0ABFC' },
  // Germany national top-up (projects-new-germany.ts)
  { slug: 'bayerische-hausbau', text: 'BAY. HAUSBAU', bg: '#1E3A8A', color: '#DBEAFE' },
  { slug: 'ca-immo', text: 'CA IMMO', bg: '#0F172A', color: '#FCA5A5' },
  { slug: 'aroundtown', text: 'AROUNDTOWN', bg: '#292524', color: '#D6D3D1' },
  { slug: 'bauwens', text: 'BAUWENS', bg: '#1C1917', color: '#FCD34D' },
  { slug: 'ece', text: 'ECE', bg: '#0C4A6E', color: '#E0F2FE' },
  { slug: 'bueschl', text: 'BÜSCHL', bg: '#365314', color: '#D9F99D' }
]

function monogramSvg(text: string, bg: string, color: string, fontSize = 20): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="36" fill="${bg}"/>
  <rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke="${color}" stroke-opacity="0.25" stroke-width="3"/>
  <text x="100" y="${100 + fontSize * 0.36}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="${fontSize}" fill="${color}" text-anchor="middle" letter-spacing="2">${text}</text>
</svg>`
}

for (const d of devLogos) {
  fs.writeFileSync(path.join(dir, `${d.slug}.svg`), monogramSvg(d.text, d.bg, d.color))
}

// Auto-monogram pass: every catalog developer without a logo on disk gets a
// deterministic initials chip — the directory requests /images/developers/
// {slug}.webp and 404s otherwise. Curated rows above keep their brand chips.
const PALETTE: [string, string][] = [
  ['#0F172A', '#38BDF8'], ['#1E1B4B', '#A5B4FC'], ['#064E3B', '#34D399'],
  ['#701A75', '#F0ABFC'], ['#7C2D12', '#FDBA74'], ['#0C4A6E', '#7DD3FC'],
  ['#14532D', '#86EFAC'], ['#4C0519', '#FDA4AF'], ['#312E81', '#C7D2FE'],
  ['#713F12', '#FDE68A'], ['#134E4A', '#99F6E4'], ['#292524', '#D6D3D1'],
]
function slugHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean)
  const src = words.length > 1 ? words : name.split(/(?=[A-Z])|\s+/).filter(Boolean)
  return src.slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || 'S'
}
async function main() {
  let auto = 0
  for (const dev of DEVELOPERS) {
    const webp = path.join(dir, `${dev.slug}.webp`)
    const svg = path.join(dir, `${dev.slug}.svg`)
    if (fs.existsSync(webp) || fs.existsSync(svg)) continue
    const [bg, color] = PALETTE[slugHash(dev.slug) % PALETTE.length]!
    await sharp(Buffer.from(monogramSvg(initials(dev.name.en), bg, color, 72)))
      .webp({ quality: 90 })
      .toFile(webp)
    auto++
  }
  console.log('developer logos:', devLogos.length, 'curated SVG,', auto, 'auto monograms,', DEVELOPERS.length, 'catalog developers')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
