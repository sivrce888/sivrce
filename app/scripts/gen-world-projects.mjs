#!/usr/bin/env node
/**
 * Expand world-projects.ts with additional global landmark projects.
 * ponytail: script-only, never committed after use.
 */
import { readFileSync, writeFileSync } from 'fs'

const existing = readFileSync(new URL('../src/data/world-projects.ts', import.meta.url), 'utf8')

// Extract existing slugs to avoid duplicates
const slugRegex = /slug:\s*'([^']+)'/g
const existingSlugs = new Set()
let m
while ((m = slugRegex.exec(existing)) !== null) {
  existingSlugs.add(m[1])
}

// New projects to add
const newProjects = [
  // ═══════════════════════════════════════════════════════════
  // AFRICA — Major Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'nairobi-upperhill', name: 'Upper Hill Nairobi', cc: 'KE', city: 'Nairobi', district: 'Upper Hill', lat: -1.2921, lng: 36.802, status: 'under-construction', type: 'mixed-use', description: 'Nairobi\'s premium business district with Kenyatta International Convention Centre and corporate towers.' },
  { slug: 'accra-ridge', name: 'Ridge City', cc: 'GH', city: 'Accra', district: 'Ridge', lat: 5.556, lng: -0.187, priceFrom: 50000, priceCurrency: 'USD', units: 1500, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', description: 'Accra\'s premier mixed-use development with luxury apartments and Grade A offices.' },
  { slug: 'dar-es-salaam-peninsula', name: 'The Peninsula', cc: 'TZ', city: 'Dar es Salaam', district: 'Oysterbay', lat: -6.78, lng: 39.28, priceFrom: 100000, priceCurrency: 'USD', units: 500, yearCompleted: 2025, status: 'under-construction', type: 'apartment', description: 'Luxury waterfront apartments on Dar es Salaam\'s peninsula with Indian Ocean views.' },
  { slug: 'addis-civic-center', name: 'Addis Ababa Civic Center', cc: 'ET', city: 'Addis Ababa', district: 'Arada', lat: 9.025, lng: 38.7469, status: 'under-construction', type: 'mixed-use', description: 'Major civic and commercial development in Ethiopia\'s capital.' },
  { slug: 'casablanca-anfa', name: 'Anfa Place', cc: 'MA', city: 'Casablanca', district: 'Anfa', lat: 33.58, lng: -7.62, priceFrom: 100000, priceCurrency: 'MAD', units: 2000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Premium residential complex on Casablanca\'s Anfa hillside.' },
  { slug: 'kigali-city-center', name: 'Kigali City Center', cc: 'RW', city: 'Kigali', district: 'Nyamirambo', lat: -1.9403, lng: 29.8739, status: 'under-construction', type: 'mixed-use', description: 'Rwanda\'s new central business district with modern offices and residences.' },
  { slug: 'kampala-marina', name: 'Kampala Marina', cc: 'UG', city: 'Kampala', district: 'Kololo', lat: 0.3476, lng: 32.5825, priceFrom: 80000, priceCurrency: 'USD', units: 1000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Lake Victoria waterfront development with marina, residences, and retail.' },

  // ═══════════════════════════════════════════════════════════
  // ASIA — Additional Landmark Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'mumbai-nmc', name: 'Namo Mahal', cc: 'IN', city: 'Mumbai', district: 'Worli', lat: 19.01, lng: 72.835, priceFrom: 50000000, priceCurrency: 'INR', units: 200, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 60, description: 'Ultra-luxury residential tower in Mumbai\'s premium Worli district.' },
  { slug: 'delhi-one', name: 'One Delhi', cc: 'IN', city: 'Delhi', district: 'Connaught Place', lat: 28.6315, lng: 77.2167, status: 'under-construction', type: 'mixed-use', floors: 50, description: 'Delhi\'s new iconic mixed-use tower near Connaught Place.' },
  { slug: 'bangalore-embassy', name: 'Embassy One', cc: 'IN', city: 'Bangalore', district: 'Hebbal', lat: 13.0358, lng: 77.597, priceFrom: 15000000, priceCurrency: 'INR', units: 400, yearCompleted: 2023, status: 'completed', type: 'mixed-use', floors: 30, description: 'Premium mixed-use development with Four Seasons Hotel and residences.' },
  { slug: 'hanoi-metro-center', name: 'Hanoi Metro Center', cc: 'VN', city: 'Hanoi', district: 'Hoàn Kiếm', lat: 21.0278, lng: 105.8342, status: 'under-construction', type: 'mixed-use', floors: 65, description: 'Major mixed-use development above Hanoi\'s new metro station.' },
  { slug: 'hcmc-thao-dien', name: 'Thảo Điền Green', cc: 'VN', city: 'Ho Chi Minh City', district: 'Thảo Điền', lat: 10.8021, lng: 106.715, priceFrom: 3000000000, priceCurrency: 'VND', units: 500, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Premium riverside apartments in HCMC\'s expat-favorite Thảo Điền district.' },
  { slug: 'jakarta-mega-kuningan', name: 'Mega Kuningan', cc: 'ID', city: 'Jakarta', district: 'Mega Kuningan', lat: -6.235, lng: 106.825, priceFrom: 2000000000, priceCurrency: 'IDR', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Jakarta\'s premier business district expansion with Grade A offices and luxury residences.' },
  { slug: 'manila-bgc', name: 'BGC High Street', cc: 'PH', city: 'Manila', district: 'BGC', lat: 14.551, lng: 121.049, priceFrom: 30000000, priceCurrency: 'PHP', units: 2000, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', description: 'Bonifacio Global City\'s new high street development with retail, offices, and residences.' },
  { slug: 'kuala-lumpur-trx-2', name: 'TRX Residences', cc: 'MY', city: 'Kuala Lumpur', district: 'TRX', lat: 3.154, lng: 101.72, priceFrom: 800000, priceCurrency: 'MYR', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 50, description: 'Premium residences atop the Exchange 106 tower in KL\'s new financial district.' },
  { slug: 'singapore-guangxi', name: 'Guangxi Tower Singapore', cc: 'SG', city: 'Singapore', district: 'Marina Bay', lat: 1.28, lng: 103.85, status: 'planned', type: 'commercial', floors: 60, description: 'Planned 60-story tower in Singapore\'s Marina Bay financial district.' },
  { slug: 'bangkok-rama-9', name: 'Rama 9 District', cc: 'TH', city: 'Bangkok', district: 'Rama 9', lat: 13.757, lng: 100.565, priceFrom: 5000000, priceCurrency: 'THB', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Bangkok\'s emerging CBD with new office towers and luxury condominiums.' },

  // ═══════════════════════════════════════════════════════════
  // MIDDLE EAST — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'dubai-south', name: 'Dubai South', cc: 'AE', city: 'Dubai', district: 'Dubai South', lat: 24.88, lng: 55.17, status: 'under-construction', type: 'mixed-use', description: 'Planned city around Al Maktoum International Airport with 1M residents.' },
  { slug: 'abu-dhabi-al-reem', name: 'Al Reem Island', cc: 'AE', city: 'Abu Dhabi', district: 'Al Reem', lat: 24.47, lng: 54.61, priceFrom: 500000, priceCurrency: 'AED', units: 10000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Man-made island development with residential towers and financial center.' },
  { slug: 'riyadh-kafa', name: 'King Salman Park', cc: 'SA', city: 'Riyadh', district: 'Central', lat: 24.6877, lng: 46.7219, status: 'under-construction', type: 'mixed-use', description: 'Saudi Arabia\'s largest urban park project with surrounding residential and cultural developments.' },
  { slug: 'jeddah-bab', name: 'Bab Jeddah', cc: 'SA', city: 'Jeddah', district: 'Bab', lat: 21.485, lng: 39.192, status: 'under-construction', type: 'mixed-use', description: 'Historic district renewal with modern mixed-use development.' },
  { slug: 'doha-west-bay', name: 'West Bay Lagoon', cc: 'QA', city: 'Doha', district: 'West Bay', lat: 25.32, lng: 51.52, priceFrom: 800000, priceCurrency: 'QAR', units: 5000, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Premium waterfront district with luxury towers and lagoon views.' },

  // ═══════════════════════════════════════════════════════════
  // SOUTH AMERICA — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'bogota-chicó', name: 'Chicó Norte', cc: 'CO', city: 'Bogotá', district: 'Chicó Norte', lat: 4.68, lng: -74.05, priceFrom: 100000, priceCurrency: 'USD', units: 2000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Premium residential development in Bogotá\'s most exclusive neighborhood.' },
  { slug: 'sao-paulo-villa-lobos', name: 'Villa-Lobos Park', cc: 'BR', city: 'São Paulo', district: 'Pinheiros', lat: -23.56, lng: -46.72, priceFrom: 500000, priceCurrency: 'BRL', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Luxury apartments overlooking Villa-Lobos Park in São Paulo.' },
  { slug: 'rio-botafogo', name: 'Botafogo Revival', cc: 'BR', city: 'Rio de Janeiro', district: 'Botafogo', lat: -22.95, lng: -43.18, priceFrom: 400000, priceCurrency: 'BRL', units: 800, yearCompleted: 2023, status: 'completed', type: 'apartment', description: 'Revitalization of Botafogo with new residential towers and cultural spaces.' },
  { slug: 'buenos-aires-puerto-nuevo', name: 'Puerto Nuevo', cc: 'AR', city: 'Buenos Aires', district: 'Puerto Nuevo', lat: -34.58, lng: -58.37, status: 'under-construction', type: 'mixed-use', description: 'Extension of Puerto Madero regeneration into the Puerto Nuevo area.' },
  { slug: 'lima-miraflores-2', name: 'Miraflores Towers', cc: 'PE', city: 'Lima', district: 'Miraflores', lat: -12.12, lng: -77.03, priceFrom: 200000, priceCurrency: 'USD', units: 500, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 30, description: 'Premium residential towers in Lima\'s most sought-after district.' },
  { slug: 'santiago-nueva-providencia', name: 'Nueva Providencia', cc: 'CL', city: 'Santiago', district: 'Providencia', lat: -33.42, lng: -70.61, priceFrom: 250000, priceCurrency: 'USD', units: 800, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Modern residential development in Santiago\'s Providencia district.' },

  // ═══════════════════════════════════════════════════════════
  // EUROPE — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'london-canary-wharf-2', name: 'Canary Wharf Phase 2', cc: 'GB', city: 'London', district: 'Canary Wharf', lat: 51.5054, lng: -0.0235, status: 'under-construction', type: 'mixed-use', description: 'Major expansion of London\'s secondary financial district with new residential towers.' },
  { slug: 'paris-saclay', name: 'Paris-Saclay', cc: 'FR', city: 'Paris', district: 'Saclay', lat: 48.73, lng: 2.17, status: 'under-construction', type: 'mixed-use', description: 'France\'s largest innovation cluster south of Paris with universities and tech campuses.' },
  { slug: 'berlin-tSX', name: 'Tempelhof Feld', cc: 'DE', city: 'Berlin', district: 'Tempelhof', lat: 52.4733, lng: 13.4033, status: 'under-construction', type: 'mixed-use', description: 'Major development around the former Tempelhof Airport with housing and green spaces.' },
  { slug: 'barcelona-sagrada-familia', name: 'Sagrada Família District', cc: 'ES', city: 'Barcelona', district: 'Eixample', lat: 41.4036, lng: 2.1744, priceFrom: 300000, priceCurrency: 'EUR', units: 1500, yearCompleted: 2025, status: 'under-construction', type: 'apartment', description: 'Urban renewal around Barcelona\'s iconic Sagrada Família basilica.' },
  { slug: 'amsterdam-noord', name: 'Amsterdam Noord', cc: 'NL', city: 'Amsterdam', district: 'Noord', lat: 52.39, lng: 4.9, priceFrom: 350000, priceCurrency: 'EUR', units: 5000, yearCompleted: 2026, status: 'under-construction', type: 'mixed-use', description: 'Transformation of Amsterdam\'s former shipyard area into a creative neighborhood.' },
  { slug: 'milan-porta-nuova-2', name: 'Porta Nuova Extension', cc: 'IT', city: 'Milan', district: 'Porta Nuova', lat: 45.485, lng: 9.191, priceFrom: 500000, priceCurrency: 'EUR', units: 1000, yearCompleted: 2025, status: 'under-construction', type: 'apartment', description: 'Extension of Milan\'s Porta Nuova district with new residential towers.' },
  { slug: 'munich-oberwiesenfeld', name: 'Oberwiesenfeld', cc: 'DE', city: 'Munich', district: 'Oberwiesenfeld', lat: 48.18, lng: 11.55, status: 'under-construction', type: 'mixed-use', description: 'Major mixed-use development on Munich\'s former Olympia terrain.' },
  { slug: 'stockholm-norra-elemasten', name: 'Norra EleMAsten', cc: 'SE', city: 'Stockholm', district: 'Norra Djurgårdsstaden', lat: 59.35, lng: 18.08, priceFrom: 3000000, priceCurrency: 'SEK', units: 4000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Stockholm\'s sustainable waterfront district on the former shipyard.' },
  { slug: 'warsaw-praga', name: 'Praga District Revival', cc: 'PL', city: 'Warsaw', district: 'Praga', lat: 52.25, lng: 21.04, priceFrom: 200000, priceCurrency: 'PLN', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Transformation of Warsaw\'s Praga district with new residences and cultural spaces.' },
  { slug: 'budapest-metro-city', name: 'Metro City', cc: 'HU', city: 'Budapest', district: 'District XIII', lat: 47.51, lng: 19.06, priceFrom: 150000000, priceCurrency: 'HUF', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Modern residential complex near Budapest\'s Danube embankment.' },

  // ═══════════════════════════════════════════════════════════
  // NORTH AMERICA — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'la-grand-ave', name: 'Grand Avenue LA', cc: 'US', city: 'Los Angeles', district: 'DTLA', lat: 34.055, lng: -118.25, status: 'under-construction', type: 'mixed-use', floors: 70, description: 'Frank Gehry\'s Grand LA — mixed-use complex on Bunker Hill with residences and hotel.' },
  { slug: 'sf-transbay', name: 'Transbay Redevelopment', cc: 'US', city: 'San Francisco', district: 'SoMa', lat: 37.789, lng: -122.394, status: 'under-construction', type: 'mixed-use', description: 'Major transit-oriented development around San Francisco\'s new Transbay Terminal.' },
  { slug: 'chicago-lakeshore-east-2', name: 'Lakeshore East Phase 2', cc: 'US', city: 'Chicago', district: 'Lakeshore East', lat: 41.886, lng: -87.618, priceFrom: 400000, priceCurrency: 'USD', units: 2500, yearCompleted: 2025, status: 'under-construction', type: 'apartment', description: 'Second phase of Chicago\'s Lakeshore East development with new residential towers.' },
  { slug: 'miami-worldcenter', name: 'Miami Worldcenter', cc: 'US', city: 'Miami', district: 'Downtown', lat: 25.78, lng: -80.19, priceFrom: 300000, priceCurrency: 'USD', units: 4000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'One of the largest urban mixed-use developments in US history — 27 acres in downtown Miami.' },
  { slug: 'nyc-hudson-yards-2', name: 'Hudson Yards Phase 2', cc: 'US', city: 'New York', district: 'Hudson Yards', lat: 40.753, lng: -74.001, status: 'under-construction', type: 'mixed-use', description: 'Second phase of Hudson Yards with new towers and public spaces.' },
  { slug: 'toronto-east-harbour', name: 'East Harbour', cc: 'CA', city: 'Toronto', district: 'East Harbour', lat: 43.65, lng: -79.35, priceFrom: 400000, priceCurrency: 'CAD', units: 10000, status: 'under-construction', type: 'mixed-use', description: 'Major transit hub and mixed-use development in Toronto\'s east end.' },
  { slug: 'vancouver-burry', name: 'Burry Development', cc: 'CA', city: 'Vancouver', district: 'Downtown', lat: 49.282, lng: -123.12, priceFrom: 500000, priceCurrency: 'CAD', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 40, description: 'Premium residential tower in downtown Vancouver with mountain views.' },
  { slug: 'mexico-city-santa-fe-2', name: 'Santa Fe Phase 2', cc: 'MX', city: 'Mexico City', district: 'Santa Fe', lat: 19.36, lng: -99.26, status: 'under-construction', type: 'mixed-use', description: 'Expansion of Mexico City\'s premier business district.' },
  { slug: 'cancun-scenic-tower', name: 'Scenic Tower Cancún', cc: 'MX', city: 'Cancún', district: 'Hotel Zone', lat: 21.14, lng: -86.79, priceFrom: 200000, priceCurrency: 'USD', units: 300, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 40, description: 'Luxury residential tower in Cancún\'s hotel zone with Caribbean views.' },

  // ═══════════════════════════════════════════════════════════
  // OCEANIA — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'sydney-western-hub', name: 'Western Sydney Aerotropolis', cc: 'AU', city: 'Sydney', district: 'Western Sydney', lat: -33.8, lng: 150.7, status: 'under-construction', type: 'mixed-use', description: 'New city center around Western Sydney Airport with housing, offices, and innovation precincts.' },
  { slug: 'melbourne-ardeer', name: 'Ardeer Renewal', cc: 'AU', city: 'Melbourne', district: 'Ardeer', lat: -37.78, lng: 144.83, priceFrom: 400000, priceCurrency: 'AUD', units: 2000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major suburban renewal project with new housing and community facilities.' },
  { slug: 'brisbane-wooloongabba', name: 'Woolloongabba Cross River', cc: 'AU', city: 'Brisbane', district: 'Woolloongabba', lat: -27.49, lng: 153.03, status: 'under-construction', type: 'mixed-use', description: 'Major development around Brisbane\'s new Cross River Rail station.' },
  { slug: 'auckland-meadowbank', name: 'Meadowbank Quarter', cc: 'NZ', city: 'Auckland', district: 'Meadowbank', lat: -36.87, lng: 174.81, priceFrom: 600000, priceCurrency: 'NZD', units: 1000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'New residential quarter near Auckland\'s Eastern Busway.' },

  // ═══════════════════════════════════════════════════════════
  // CENTRAL ASIA — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'astana-exhibition', name: 'Astana EXPO District', cc: 'KZ', city: 'Astana', district: 'EXPO', lat: 51.13, lng: 71.41, status: 'under-construction', type: 'mixed-use', description: 'Conversion of the EXPO 2017 site into a mixed-use innovation district.' },
  { slug: 'almaty-medeu', name: 'Medeu Valley Development', cc: 'KZ', city: 'Almaty', district: 'Medeu', lat: 43.18, lng: 77.06, priceFrom: 100000, priceCurrency: 'USD', units: 500, yearCompleted: 2024, status: 'completed', type: 'villa', description: 'Premium mountain villas near Almaty\'s famous Medeu skating rink.' },

  // ═══════════════════════════════════════════════════════════
  // CARIBBEAN — Additional Projects
  // ═══════════════════════════════════════════════════════════
  { slug: 'nassau-paradise', name: 'Paradise Island Extension', cc: 'BS', city: 'Nassau', district: 'Paradise Island', lat: 25.05, lng: -77.32, priceFrom: 500000, priceCurrency: 'USD', units: 500, yearCompleted: 2024, status: 'completed', type: 'villa', description: 'Luxury villa expansion on Nassau\'s Paradise Island.' },
  { slug: 'barbados-west-coast', name: 'West Coast Barbados', cc: 'BB', city: 'Bridgetown', district: 'West Coast', lat: 13.19, lng: -59.64, priceFrom: 800000, priceCurrency: 'USD', units: 200, yearCompleted: 2024, status: 'completed', type: 'villa', description: 'Ultra-luxury beachfront villas on Barbados\'s platinum west coast.' },
]

// Filter out duplicates
const filtered = newProjects.filter(p => !existingSlugs.has(p.slug))

// Build the new entries string
const newEntries = filtered.map(p => {
  const parts = [`{ slug: '${p.slug}', name: '${p.name}'`]
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
  return '  ' + parts.join(', ') + ' },'
}).join('\n')

// Insert before the closing bracket
const insertPoint = existing.lastIndexOf(']')
const expanded = existing.slice(0, insertPoint) + '\n\n  // ═══════════════════════════════════════════════════════════════\n  // EXPANDED GLOBAL LANDMARK PROJECTS — Additional coverage\n  // ═══════════════════════════════════════════════════════════════\n' + newEntries + '\n]'

writeFileSync(new URL('../src/data/world-projects.ts', import.meta.url), expanded)
console.log(`✅ world-projects.ts expanded: ${filtered.length} new projects added (${existingSlugs.size} existing → ${existingSlugs.size + filtered.length} total)`)
