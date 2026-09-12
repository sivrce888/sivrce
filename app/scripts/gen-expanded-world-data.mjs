#!/usr/bin/env node
/**
 * Expand world-developers.ts and world-projects.ts with rich global data.
 * ponytail: script-only execution.
 */
import { readFileSync, writeFileSync } from 'fs'

const devPath = new URL('../src/data/world-developers.ts', import.meta.url)
const projPath = new URL('../src/data/world-projects.ts', import.meta.url)

const devExisting = readFileSync(devPath, 'utf8')
const projExisting = readFileSync(projPath, 'utf8')

// Extract existing slugs
const devSlugRegex = /slug:\s*'([^']+)'/g
const devExistingSlugs = new Set()
let m
while ((m = devSlugRegex.exec(devExisting)) !== null) {
  devExistingSlugs.add(m[1])
}

const projSlugRegex = /slug:\s*'([^']+)'/g
const projExistingSlugs = new Set()
while ((m = projSlugRegex.exec(projExisting)) !== null) {
  projExistingSlugs.add(m[1])
}

// ─── NEW GLOBAL DEVELOPERS ────────────────────────────────────
const newDevelopers = [
  // JAPAN
  { slug: 'mitsui-fudosan', name: 'Mitsui Fudosan', nameLocal: '三井不動産', cc: 'JP', city: 'Tokyo', founded: 1941, type: 'mixed', scale: 'mega', projectsCount: 450, website: 'https://www.mitsuifudosan.co.jp', notable: ['Tokyo Midtown', 'Nihonbashi再生計画', 'Kashiwa-no-ha Smart City'], description: 'Japan\'s premier real estate developer, leading large-scale urban developments, luxury residential towers, and smart cities.', verified: true, color: '#002B49' },
  { slug: 'mitsubishi-estate', name: 'Mitsubishi Estate', nameLocal: '三菱地所', cc: 'JP', city: 'Tokyo', founded: 1937, type: 'mixed', scale: 'mega', projectsCount: 400, website: 'https://www.mec.co.jp', notable: ['Marunouchi Business District', 'Torch Tower Tokyo', 'Parkhouse Residences'], description: 'Major Japanese real estate developer famous for transforming Tokyo\'s Marunouchi district and landmark skyscrapers.', verified: true, color: '#C8102E' },
  { slug: 'mori-building', name: 'Mori Building', nameLocal: '森ビル', cc: 'JP', city: 'Tokyo', founded: 1959, type: 'mixed', scale: 'mega', projectsCount: 120, website: 'https://www.mori.co.jp', notable: ['Roppongi Hills', 'Toranomon Hills', 'Azabudai Hills'], description: 'Pioneer of Vertical Garden Cities in Tokyo, creating world-renowned mixed-use urban complexes.', verified: true, color: '#1B365D' },
  { slug: 'sumitomo-realty', name: 'Sumitomo Realty & Development', nameLocal: '住友不動産', cc: 'JP', city: 'Tokyo', founded: 1949, type: 'residential', scale: 'mega', projectsCount: 380, website: 'https://www.sumitomo-rd.co.jp', notable: ['City Tower Tokyo', 'Grand Sky Shinagawa', 'Roppongi Grand Tower'], description: 'Leading Japanese condominium developer known for its high-rise City Tower brand across metropolitan Tokyo.', verified: true, color: '#0055A5' },
  { slug: 'tokyu-land', name: 'Tokyu Land Corporation', nameLocal: '東急不動産', cc: 'JP', city: 'Tokyo', founded: 1953, type: 'mixed', scale: 'mega', projectsCount: 300, website: 'https://www.tokyu-fudosan.co.jp', notable: ['Shibuya Tokyu Plaza', 'Shibuya Upper West', 'Bramare Tokyu'], description: 'Major Japanese real estate developer leading high-profile urban transformations in Shibuya and metropolitan Tokyo.', verified: true, color: '#0055A5' },
  { slug: 'diriyah-gate', name: 'Diriyah Gate Development Authority', cc: 'SA', city: 'Riyadh', founded: 2017, type: 'mixed', scale: 'mega', projectsCount: 40, website: 'https://www.dgda.gov.sa', notable: ['Diriyah Gate Phase 1', 'Bujairi Terrace', 'Diriyah Residences'], description: 'Saudi Arabia\'s giga-project developer transforming historic Diriyah into a global cultural and luxury residential capital.', verified: true, color: '#C8102E' },


  // CHINA & HONG KONG
  { slug: 'sun-hung-kai', name: 'Sun Hung Kai Properties', nameLocal: '新鴻基地產', cc: 'HK', city: 'Hong Kong', founded: 1972, type: 'mixed', scale: 'mega', projectsCount: 350, website: 'https://www.shkp.com', notable: ['International Commerce Centre (ICC)', 'IFC Hong Kong', 'Shanghai ITC'], description: 'Hong Kong\'s largest property developer, renowned for world-class skyscrapers, premium shopping malls, and transit-oriented hubs.', verified: true, color: '#C8102E' },
  { slug: 'ck-asset', name: 'CK Asset Holdings', nameLocal: '長實集團', cc: 'HK', city: 'Hong Kong', founded: 1950, type: 'mixed', scale: 'mega', projectsCount: 300, website: 'https://www.ckah.com', notable: ['Cheung Kong Center', 'The Center', 'Harbourfront Horizon'], description: 'Li Ka-shing\'s flagship property empire developing iconic commercial and residential landmarks globally.', verified: true, color: '#003366' },
  { slug: 'china-vanke', name: 'China Vanke', nameLocal: '万科集团', cc: 'CN', city: 'Shenzhen', founded: 1984, type: 'residential', scale: 'mega', projectsCount: 800, website: 'https://www.vanke.com', notable: ['Vanke City', 'Vanke Metropolis', 'Shenzhen Vanke Center'], description: 'One of China\'s largest residential developers focused on high-quality housing and sustainable urban development.', verified: true, color: '#E30613' },
  { slug: 'china-overseas', name: 'China Overseas Land & Investment', nameLocal: '中国海外发展', cc: 'CN', city: 'Hong Kong', founded: 1979, type: 'residential', scale: 'mega', projectsCount: 600, website: 'https://www.coli.com.hk', notable: ['COLI One Center', 'The Glorious City', 'COLI Plaza'], description: 'State-backed premier real estate enterprise in China, building modern residential complexes in top tier cities.', verified: true, color: '#0057B8' },

  // SOUTH KOREA
  { slug: 'samsung-c-t', name: 'Samsung C&T Corporation', nameLocal: '삼성물산', cc: 'KR', city: 'Seoul', founded: 1938, type: 'mixed', scale: 'mega', projectsCount: 250, website: 'https://www.seoulraemian.co.kr', notable: ['Raemian Firstige', 'Raemian One Bailey', 'Burj Khalifa (Contractor)'], description: 'South Korea\'s premier construction and property firm, famous for the ultra-luxury Raemian residential brand.', verified: true, color: '#07485B' },
  { slug: 'hyundai-eng', name: 'Hyundai Engineering & Construction', nameLocal: '현대건설', cc: 'KR', city: 'Seoul', founded: 1947, type: 'mixed', scale: 'mega', projectsCount: 300, website: 'https://www.hdec.kr', notable: ['Hillstate Gangnam', 'THE H Banpo', 'Hyundai Hyperion'], description: 'Pioneer of modern Korean urban housing, building premier Hillstate and THE H luxury residential developments.', verified: true, color: '#002C6C' },
  { slug: 'gs-e-c', name: 'GS E&C (Xi)', nameLocal: 'GS건설', cc: 'KR', city: 'Seoul', founded: 1969, type: 'residential', scale: 'mega', projectsCount: 280, website: 'https://www.xi.co.kr', notable: ['Banpo Xi', 'Gran Xi Seoul', 'Xi Riverview'], description: 'Top tier South Korean residential developer building iconic Xi brand luxury apartment complexes nationwide.', verified: true, color: '#0083C8' },

  // SINGAPORE
  { slug: 'capitaland', name: 'CapitaLand Development', cc: 'SG', city: 'Singapore', founded: 2000, type: 'mixed', scale: 'mega', projectsCount: 320, website: 'https://www.capitaland.com', notable: ['Jewel Changi', 'CapitaSpring', 'CanningHill Piers'], description: 'Asia\'s largest diversified real estate developer headquartered in Singapore with global landmark assets.', verified: true, color: '#ED1B2D' },
  { slug: 'city-developments', name: 'City Developments Limited (CDL)', cc: 'SG', city: 'Singapore', founded: 1963, type: 'residential', scale: 'mega', projectsCount: 200, website: 'https://www.cdl.com.sg', notable: ['Boulevard 88', 'Amber Park', 'Sengkang Grand Residences'], description: 'Leading Singapore international real estate company with extensive residential, commercial, and hospitality projects.', verified: true, color: '#002B49' },
  { slug: 'guocoland', name: 'GuocoLand', cc: 'SG', city: 'Singapore', founded: 1976, type: 'mixed', scale: 'mega', projectsCount: 90, website: 'https://www.guocoland.com.sg', notable: ['Guoco Tower', 'Midtown Modern', 'Martin Modern'], description: 'Pioneer of integrated mixed-use luxury developments transforming Singapore\'s prime skylines.', verified: true, color: '#1B365D' },

  // UNITED KINGDOM
  { slug: 'ballymore', name: 'Ballymore', cc: 'GB', city: 'London', founded: 1982, type: 'residential', scale: 'mega', projectsCount: 85, website: 'https://www.ballymoregroup.com', notable: ['Embassy Gardens', 'Wardian London', 'Royal Wharf'], description: 'International property development company creating large-scale urban regeneration projects in London and Dublin.', verified: true, color: '#003366' },
  { slug: 'mount-anvil', name: 'Mount Anvil', cc: 'GB', city: 'London', founded: 1991, type: 'residential', scale: 'large', projectsCount: 50, website: 'https://www.mountanvil.com', notable: ['The Silk District', 'Three Waters', 'Royal Eden Docks'], description: 'London-focused residential developer creating high-quality, architecturally striking homes.', verified: true, color: '#D4AF37' },

  // GERMANY & EUROPE
  { slug: 'zabel-property', name: 'Zabel Property / JLL Germany', cc: 'DE', city: 'Berlin', founded: 1990, type: 'residential', scale: 'large', projectsCount: 65, website: 'https://www.jll.de', notable: ['Grand Tower Frankfurt', 'Crown House Berlin', 'No.1 Charlottenburg'], description: 'Premier high-end residential real estate developer and advisory firm operating across Germany.', verified: true, color: '#002B49' },
  { slug: 'cg-elementum', name: 'CG Elementum AG', cc: 'DE', city: 'Leipzig', founded: 1995, type: 'mixed', scale: 'mega', projectsCount: 110, website: 'https://www.cg-elementum.de', notable: ['Plagwitz Höfe Leipzig', 'Cobiax Berlin', 'OTTO Quartier'], description: 'German pioneer of digitalized, sustainable, and energy-efficient commercial and residential construction.', verified: true, color: '#E30613' },
  { slug: 'ubm-development', name: 'UBM Development AG', cc: 'AT', city: 'Vienna', founded: 1873, type: 'mixed', scale: 'mega', projectsCount: 140, website: 'https://www.ubm-development.com', notable: ['Timber Peak Mainz', 'Leopold Quartier Vienna', 'Frankfurt Westville'], description: 'Europe\'s leading developer of timber hybrid construction for eco-friendly modern living and offices.', verified: true, color: '#0055A5' },

  // MIDDLE EAST & INDIA
  { slug: 'sobha-realty', name: 'Sobha Realty', cc: 'AE', city: 'Dubai', founded: 1976, type: 'mixed', scale: 'mega', projectsCount: 150, website: 'https://www.sobharealty.com', notable: ['Sobha Hartland', 'Sobha Reserve', 'Sobha One'], description: 'Luxury real estate developer in Dubai known for backward integrated precision engineering and fine finishes.', verified: true, color: '#A37E2C' },
  { slug: 'binghatti', name: 'Binghatti Developers', cc: 'AE', city: 'Dubai', founded: 2008, type: 'residential', scale: 'mega', projectsCount: 75, website: 'https://www.binghatti.com', notable: ['Bugatti Residences by Binghatti', 'Mercedes-Benz Places', 'Binghatti Jacob & Co Residences'], description: 'Innovative Dubai developer famous for architectural automotive and luxury brand branded towers.', verified: true, color: '#000000' },
  { slug: 'dlf-limited', name: 'DLF Limited', cc: 'IN', city: 'Gurugram', founded: 1946, type: 'mixed', scale: 'mega', projectsCount: 300, website: 'https://www.dlf.in', notable: ['DLF Cyber City', 'DLF The Camellias', 'DLF Phase 5'], description: 'India\'s largest commercial and residential real estate company, developing integrated smart townships and luxury high-rises.', verified: true, color: '#003366' },

  // AUSTRALIA & AMERICAS
  { slug: 'mirvac', name: 'Mirvac', cc: 'AU', city: 'Sydney', founded: 1972, type: 'mixed', scale: 'mega', projectsCount: 220, website: 'https://www.mirvac.com', notable: ['Green Square', 'Yarra\'s Edge', 'Quay Quarter Lanes'], description: 'Leading Australian property group creating vibrant master-planned residential communities and Grade A commercial precincts.', verified: true, color: '#0083C8' },
  { slug: 'jbg-smith', name: 'JBG SMITH', cc: 'US', city: 'Bethesda', founded: 1962, type: 'mixed', scale: 'mega', projectsCount: 140, website: 'https://www.jbgsmith.com', notable: ['National Landing (Amazon HQ2)', '799 Bell Street', 'Water Street'], description: 'Major US developer shaping National Landing in Metro DC, tech hubs, and modern residential urban neighborhoods.', verified: true, color: '#002C6C' },
]

// ─── NEW GLOBAL ONGOING PROJECTS ──────────────────────────────
const newProjects = [
  // TOKYO / JAPAN ONGOING
  { slug: 'torch-tower-tokyo', name: 'Torch Tower Tokyo', developer: 'mitsubishi-estate', cc: 'JP', city: 'Tokyo', district: 'Chiyoda', lat: 35.6845, lng: 139.769, status: 'under-construction', type: 'mixed-use', floors: 63, units: 300, yearCompleted: 2028, description: 'Set to become Japan\'s tallest skyscraper at 390 meters, featuring luxury hotel, observatory, and Grade A office space.', website: 'https://www.mec.co.jp' },
  { slug: 'azabudai-hills-residences', name: 'Azabudai Hills Residences', developer: 'mori-building', cc: 'JP', city: 'Tokyo', district: 'Minato', lat: 35.6606, lng: 139.7408, status: 'under-construction', type: 'apartment', floors: 64, units: 1400, priceFrom: 300000000, priceCurrency: 'JPY', yearCompleted: 2024, description: 'Tokyo\'s new landmark vertical garden city featuring Aman Residences Tokyo and lush elevated green parks.', website: 'https://www.azabudai-hills.com' },
  { slug: 'shibuya-upper-west', name: 'Shibuya Upper West', developer: 'tokyu-land', cc: 'JP', city: 'Tokyo', district: 'Shibuya', lat: 35.6601, lng: 139.6975, status: 'under-construction', type: 'mixed-use', floors: 36, units: 250, yearCompleted: 2027, description: 'Boutique luxury residential and cultural tower in Shibuya designed by Snøhetta.', website: 'https://www.tokyu-fudosan.co.jp' },

  // HONG KONG & SHENZHEN ONGOING
  { slug: 'high-top-icc-west', name: 'West Kowloon Cultural Tower', developer: 'sun-hung-kai', cc: 'HK', city: 'Hong Kong', district: 'West Kowloon', lat: 22.3034, lng: 114.1602, status: 'under-construction', type: 'mixed-use', floors: 48, units: 600, priceFrom: 18000000, priceCurrency: 'HKD', yearCompleted: 2026, description: 'Premier transit-oriented development atop High Speed Rail West Kowloon terminus.' },
  { slug: 'shenzhen-bay-super-hq', name: 'Shenzhen Bay Super HQ Tower', developer: 'china-vanke', cc: 'CN', city: 'Shenzhen', district: 'Nanshan', lat: 22.525, lng: 113.978, status: 'under-construction', type: 'mixed-use', floors: 75, units: 500, yearCompleted: 2025, description: 'Futuristic headquarters and luxury residential complex overlooking Shenzhen Bay skyline.' },

  // SEOUL ONGOING
  { slug: 'raemian-one-bailey', name: 'Raemian One Bailey', developer: 'samsung-c-t', cc: 'KR', city: 'Seoul', district: 'Seocho-gu', lat: 37.505, lng: 127.005, status: 'under-construction', type: 'apartment', floors: 35, units: 2990, priceFrom: 2500000000, priceCurrency: 'KRW', yearCompleted: 2025, description: 'Ultra-prime Han River waterfront residential complex in Banpo, Seoul\'s most sought-after district.' },
  { slug: 'the-h-firstier-banpo', name: 'THE H Banpo', developer: 'hyundai-eng', cc: 'KR', city: 'Seoul', district: 'Seocho-gu', lat: 37.508, lng: 126.998, status: 'under-construction', type: 'apartment', floors: 40, units: 1800, priceFrom: 2800000000, priceCurrency: 'KRW', yearCompleted: 2026, description: 'Hyundai\'s flagship THE H hyper-luxury residences featuring private spa, sky lounges, and river views.' },

  // SINGAPORE ONGOING
  { slug: 'canninghill-piers', name: 'CanningHill Piers', developer: 'capitaland', cc: 'SG', city: 'Singapore', district: 'Clarke Quay', lat: 1.291, lng: 103.844, status: 'under-construction', type: 'apartment', floors: 48, units: 696, priceFrom: 1600000, priceCurrency: 'SGD', yearCompleted: 2025, description: 'Iconic integrated waterfront residence by Bjarke Ingels Group (BIG) overlooking Fort Canning Hill and Singapore River.' },
  { slug: 'guoco-midtown-modern', name: 'Midtown Modern', developer: 'guocoland', cc: 'SG', city: 'Singapore', district: 'Bugis', lat: 1.298, lng: 103.856, status: 'under-construction', type: 'mixed-use', floors: 30, units: 558, priceFrom: 1400000, priceCurrency: 'SGD', yearCompleted: 2025, description: 'Garden city luxury residences in Bugis integrated with Grade A office towers and underground MRT connectivity.' },

  // DUBAI & RIYADH ONGOING
  { slug: 'sobha-hartland-ii', name: 'Sobha Hartland II', developer: 'sobha-realty', cc: 'AE', city: 'Dubai', district: 'Sobha Hartland', lat: 25.178, lng: 55.312, status: 'under-construction', type: 'mixed-use', floors: 55, units: 4000, priceFrom: 1300000, priceCurrency: 'AED', yearCompleted: 2026, description: 'Eight million sq.ft. waterfront sanctuary featuring luxury villas, crystal lagoons, and green parks.' },
  { slug: 'bugatti-residences-binghatti', name: 'Bugatti Residences by Binghatti', developer: 'binghatti', cc: 'AE', city: 'Dubai', district: 'Business Bay', lat: 25.185, lng: 55.27, status: 'under-construction', type: 'apartment', floors: 42, units: 182, priceFrom: 19000000, priceCurrency: 'AED', yearCompleted: 2026, description: 'World\'s first Bugatti-branded luxury residential tower featuring private Riviera-inspired beach and car lifts to penthouses.' },
  { slug: 'diriyah-gate-residences', name: 'Diriyah Gate Residences', developer: 'diriyah-gate', cc: 'SA', city: 'Riyadh', district: 'Diriyah', lat: 24.733, lng: 46.572, status: 'under-construction', type: 'villa', units: 3000, priceFrom: 3500000, priceCurrency: 'SAR', yearCompleted: 2027, description: 'UNESCO World Heritage Najdi-style luxury residential and cultural destination in Riyadh.' },

  // LONDON ONGOING
  { slug: 'the-silk-district-london', name: 'The Silk District', developer: 'mount-anvil', cc: 'GB', city: 'London', district: 'Whitechapel', lat: 51.518, lng: -0.061, status: 'under-construction', type: 'apartment', floors: 25, units: 564, priceFrom: 520000, priceCurrency: 'GBP', yearCompleted: 2025, description: 'Modern east London development with private rooftop gardens, cinema, and Elizabeth Line access.' },
  { slug: 'embassy-gardens-nine-elms', name: 'Embassy Gardens', developer: 'ballymore', cc: 'GB', city: 'London', district: 'Nine Elms', lat: 51.482, lng: -0.132, status: 'under-construction', type: 'mixed-use', floors: 23, units: 1500, priceFrom: 750000, priceCurrency: 'GBP', yearCompleted: 2024, description: 'Waterfront luxury development famous for the world-first transparent Sky Pool suspended between two towers.' },

  // GERMANY ONGOING
  { slug: 'timber-peak-mainz', name: 'Timber Peak', developer: 'ubm-development', cc: 'DE', city: 'Frankfurt', district: 'Zollhafen', lat: 50.005, lng: 8.261, status: 'under-construction', type: 'mixed-use', floors: 12, units: 180, priceFrom: 450000, priceCurrency: 'EUR', yearCompleted: 2025, description: 'Smart timber-hybrid smart tower with photovoltaic facade and zero-carbon smart energy grid.' },
  { slug: 'otto-quartier-esslingen', name: 'OTTO Quartier', developer: 'cg-elementum', cc: 'DE', city: 'Stuttgart', district: 'Esslingen', lat: 48.74, lng: 9.308, status: 'under-construction', type: 'mixed-use', floors: 10, units: 600, priceFrom: 380000, priceCurrency: 'EUR', yearCompleted: 2026, description: 'Regeneration of historic industrial precinct into carbon-neutral smart residential quarter.' },

  // AUSTRALIA & US ONGOING
  { slug: 'green-square-town-centre', name: 'Green Square Town Centre', developer: 'mirvac', cc: 'AU', city: 'Sydney', district: 'Green Square', lat: -33.906, lng: 151.203, status: 'under-construction', type: 'mixed-use', floors: 28, units: 1200, priceFrom: 780000, priceCurrency: 'AUD', yearCompleted: 2025, description: 'Sydney\'s premier urban renewal precinct with subterranean library, aquatic center, and eco-towers.' },
  { slug: 'national-landing-amazon-hq2', name: 'National Landing Hub', developer: 'jbg-smith', cc: 'US', city: 'Washington D.C.', district: 'Arlington', lat: 38.862, lng: -77.054, status: 'under-construction', type: 'mixed-use', floors: 22, units: 1800, priceFrom: 550000, priceCurrency: 'USD', yearCompleted: 2025, description: 'Transformational smart urban neighborhood surrounding Amazon HQ2 campus with parks and metro transit.' },
]

// Filter out existing developer slugs
const filteredDevs = newDevelopers.filter(d => !devExistingSlugs.has(d.slug))

// Filter out existing project slugs
const filteredProjs = newProjects.filter(p => !projExistingSlugs.has(p.slug))

// Generate developers code
if (filteredDevs.length > 0) {
  const devEntries = filteredDevs.map(d => {
    const parts = [
      `    slug: '${d.slug}',`,
      `    name: '${d.name.replace(/'/g, "\\'")}',`,
      d.nameLocal ? `    nameLocal: '${d.nameLocal.replace(/'/g, "\\'")}',` : null,
      `    cc: '${d.cc}',`,
      `    city: '${d.city}',`,
      `    founded: ${d.founded},`,
      `    type: '${d.type}',`,
      `    scale: '${d.scale}',`,
      `    projectsCount: ${d.projectsCount},`,
      `    website: '${d.website}',`,
      `    notable: [${d.notable.map(n => `'${n.replace(/'/g, "\\'")}'`).join(', ')}],`,
      `    description: '${d.description.replace(/'/g, "\\'")}',`,
      `    verified: ${d.verified},`,
      d.color ? `    color: '${d.color}',` : null,
    ].filter(Boolean).join('\n')
    return `  {\n${parts}\n  },`
  }).join('\n')

  const devInsertPoint = devExisting.lastIndexOf(']')
  const devExpanded = devExisting.slice(0, devInsertPoint) +
    '\n  // ═══════════════════════════════════════════════════════════════\n' +
    '  // EXPANDED GLOBAL DEVELOPERS — APAC, EMEA, Americas\n' +
    '  // ═══════════════════════════════════════════════════════════════\n' +
    devEntries + '\n]'

  writeFileSync(devPath, devExpanded)
  console.log(`✅ world-developers.ts expanded: ${filteredDevs.length} developers added (${devExistingSlugs.size} → ${devExistingSlugs.size + filteredDevs.length})`)
} else {
  console.log(`ℹ️ world-developers.ts already up-to-date (${devExistingSlugs.size} developers)`)
}

// Generate projects code
if (filteredProjs.length > 0) {
  const projEntries = filteredProjs.map(p => {
    const parts = [`slug: '${p.slug}', name: '${p.name.replace(/'/g, "\\'")}'`]
    if (p.developer) parts.push(`developer: '${p.developer}'`)
    parts.push(`cc: '${p.cc}'`)
    parts.push(`city: '${p.city}'`)
    if (p.district) parts.push(`district: '${p.district}'`)
    parts.push(`lat: ${p.lat}, lng: ${p.lng}`)
    if (p.priceFrom) parts.push(`priceFrom: ${p.priceFrom}`)
    if (p.priceCurrency) parts.push(`priceCurrency: '${p.priceCurrency}'`)
    if (p.pricePerSqm) parts.push(`pricePerSqm: ${p.pricePerSqm}`)
    if (p.units) parts.push(`units: ${p.units}`)
    if (p.yearCompleted) parts.push(`yearCompleted: ${p.yearCompleted}`)
    parts.push(`status: '${p.status}'`)
    parts.push(`type: '${p.type}'`)
    if (p.floors) parts.push(`floors: ${p.floors}`)
    parts.push(`description: '${p.description.replace(/'/g, "\\'")}'`)
    if (p.website) parts.push(`website: '${p.website}'`)
    return '  { ' + parts.join(', ') + ' },'
  }).join('\n')

  const projInsertPoint = projExisting.lastIndexOf(']')
  const projExpanded = projExisting.slice(0, projInsertPoint) +
    '\n  // ═══════════════════════════════════════════════════════════════\n' +
    '  // EXPANDED GLOBAL ONGOING PROJECTS — Tokyo, Seoul, London, Dubai, SG\n' +
    '  // ═══════════════════════════════════════════════════════════════\n' +
    projEntries + '\n]'

  writeFileSync(projPath, projExpanded)
  console.log(`✅ world-projects.ts expanded: ${filteredProjs.length} ongoing projects added (${projExistingSlugs.size} → ${projExistingSlugs.size + filteredProjs.length})`)
} else {
  console.log(`ℹ️ world-projects.ts already up-to-date (${projExistingSlugs.size} projects)`)
}
