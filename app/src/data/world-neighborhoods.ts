/**
 * SIVRCE — World premium neighborhoods / districts for programmatic SEO.
 * 94 neighborhoods across 35 global cities.
 * ponytail: real coordinates, factual data where public.
 */

export type WorldNeighborhood = {
  slug: string
  city: string
  cc: string
  en: string
  ka: string
  lat: number
  lng: number
  avgPricePerSqm?: number
  currency?: string
  type: 'residential' | 'commercial' | 'mixed' | 'luxury' | 'suburban'
  highlights: string[]
  transitScore?: number
  walkScore?: number
}

export const WORLD_NEIGHBORHOODS: readonly WorldNeighborhood[] = [
  // ═══════════════════════════════════════════════════════════
  // EUROPE
  // ═══════════════════════════════════════════════════════════
  // London
  { slug: 'mayfair', city: 'London', cc: 'GB', en: 'Mayfair', ka: 'მეიფერი', lat: 51.5074, lng: -0.152, avgPricePerSqm: 25000, currency: 'GBP', type: 'luxury', highlights: ['Most expensive district in London', 'Park Lane', 'Grosvenor Square'], transitScore: 95, walkScore: 98 },
  { slug: 'kensington', city: 'London', cc: 'GB', en: 'Kensington', ka: 'კენსინგტონი', lat: 51.499, lng: -0.1946, avgPricePerSqm: 20000, currency: 'GBP', type: 'luxury', highlights: ['Royal Borough', 'Kensington Palace', 'Kensington Gardens'], transitScore: 95, walkScore: 97 },
  { slug: 'chelsea', city: 'London', cc: 'GB', en: 'Chelsea', ka: 'ჩელსი', lat: 51.4875, lng: -0.1687, avgPricePerSqm: 18000, currency: 'GBP', type: 'luxury', highlights: ['King\'s Road', 'Chelsea Flower Show', 'Thames Embankment'], transitScore: 93, walkScore: 96 },
  { slug: 'notting-hill', city: 'London', cc: 'GB', en: 'Notting Hill', ka: 'ნოტინგ-ჰილი', lat: 51.5112, lng: -0.2056, avgPricePerSqm: 15000, currency: 'GBP', type: 'residential', highlights: ['Portobello Road Market', 'Colorful houses', 'Carnival'], transitScore: 90, walkScore: 95 },
  { slug: 'canary-wharf', city: 'London', cc: 'GB', en: 'Canary Wharf', ka: 'კენერი-უორფი', lat: 51.5054, lng: -0.0235, avgPricePerSqm: 12000, currency: 'GBP', type: 'commercial', highlights: ['Major financial center', 'One Canada Square', 'Crossrail'], transitScore: 98, walkScore: 92 },
  { slug: 'shoreditch', city: 'London', cc: 'GB', en: 'Shoreditch', ka: 'შორდიჩი', lat: 51.5265, lng: -0.0799, avgPricePerSqm: 10000, currency: 'GBP', type: 'mixed', highlights: ['Tech hub', 'Street art', 'Brick Lane'], transitScore: 88, walkScore: 94 },

  // Paris
  { slug: 'saint-germain', city: 'Paris', cc: 'FR', en: 'Saint-Germain-des-Prés', ka: 'სენ-ჟერმენ-დე-პრე', lat: 48.854, lng: 2.3324, avgPricePerSqm: 14000, currency: 'EUR', type: 'luxury', highlights: ['Café culture', 'Luxembourg Gardens', 'Art galleries'], transitScore: 98, walkScore: 99 },
  { slug: 'le-marais', city: 'Paris', cc: 'FR', en: 'Le Marais', ka: 'ლე-მარე', lat: 48.8566, lng: 2.3622, avgPricePerSqm: 12000, currency: 'EUR', type: 'mixed', highlights: ['Historic quarter', 'Place des Vosges', 'Boutique shops'], transitScore: 96, walkScore: 98 },
  { slug: 'champs-elysees', city: 'Paris', cc: 'FR', en: 'Champs-Élysées', ka: 'შამზ-ელიზე', lat: 48.8698, lng: 2.3075, avgPricePerSqm: 15000, currency: 'EUR', type: 'commercial', highlights: ['World\'s most famous avenue', 'Arc de Triomphe', 'Luxury retail'], transitScore: 99, walkScore: 97 },
  { slug: 'montmartre', city: 'Paris', cc: 'FR', en: 'Montmartre', ka: 'მონმარტრი', lat: 48.8867, lng: 2.3431, avgPricePerSqm: 9000, currency: 'EUR', type: 'residential', highlights: ['Sacré-Cœur', 'Artistic heritage', 'Panoramic views'], transitScore: 92, walkScore: 96 },

  // Berlin
  { slug: 'mitte', city: 'Berlin', cc: 'DE', en: 'Mitte', ka: 'მიტე', lat: 52.52, lng: 13.405, avgPricePerSqm: 6500, currency: 'EUR', type: 'mixed', highlights: ['Brandenburg Gate', 'Museum Island', 'Alexanderplatz'], transitScore: 98, walkScore: 97 },
  { slug: 'charlottenburg', city: 'Berlin', cc: 'DE', en: 'Charlottenburg', ka: 'შარლოტენბურგი', lat: 52.5168, lng: 13.304, avgPricePerSqm: 5500, currency: 'EUR', type: 'residential', highlights: ['Kurfürstendamm', 'Charlottenburg Palace', 'Kaiser Wilhelm Memorial Church'], transitScore: 96, walkScore: 94 },
  { slug: 'kreuzberg', city: 'Berlin', cc: 'DE', en: 'Kreuzberg', ka: 'კროიცბერგი', lat: 52.4986, lng: 13.4039, avgPricePerSqm: 5000, currency: 'EUR', type: 'mixed', highlights: ['Multicultural', 'Street food', 'Nightlife'], transitScore: 94, walkScore: 96 },
  { slug: 'prenzlauer-berg', city: 'Berlin', cc: 'DE', en: 'Prenzlauer Berg', ka: 'პრენცლაუერ-ბერგი', lat: 52.5388, lng: 13.4245, avgPricePerSqm: 5800, currency: 'EUR', type: 'residential', highlights: ['Family-friendly', 'Mauerpark', 'Kulturbrauerei'], transitScore: 93, walkScore: 97 },

  // Munich
  { slug: 'schwabing', city: 'Munich', cc: 'DE', en: 'Schwabing', ka: 'შვაბინგი', lat: 48.1614, lng: 11.5865, avgPricePerSqm: 8000, currency: 'EUR', type: 'residential', highlights: ['English Garden proximity', 'Student quarter', 'Art scene'], transitScore: 92, walkScore: 95 },
  { slug: 'maxvorstadt', city: 'Munich', cc: 'DE', en: 'Maxvorstadt', ka: 'მაქსვორშტადტი', lat: 48.1535, lng: 11.579, avgPricePerSqm: 8500, currency: 'EUR', type: 'mixed', highlights: ['University district', 'Museum quarter', 'Königsplatz'], transitScore: 95, walkScore: 96 },
  { slug: 'bogenhausen', city: 'Munich', cc: 'DE', en: 'Bogenhausen', ka: 'ბოგენჰაუზენი', lat: 48.145, lng: 11.601, avgPricePerSqm: 9200, currency: 'EUR', type: 'luxury', highlights: ['Isar riverside villas', 'Arabella Hochhäuser', 'Friedensengel'], transitScore: 90, walkScore: 90 },

  // Hamburg
  { slug: 'eppendorf', city: 'Hamburg', cc: 'DE', en: 'Eppendorf', ka: 'ეპენდორფი', lat: 53.5936, lng: 9.9846, avgPricePerSqm: 7500, currency: 'EUR', type: 'luxury', highlights: ['Alster canals', 'Isemarkt', 'Jugendstil villas'], transitScore: 88, walkScore: 92 },
  { slug: 'altona-altstadt', city: 'Hamburg', cc: 'DE', en: 'Altona-Altstadt', ka: 'ალტონა', lat: 53.551, lng: 9.93, avgPricePerSqm: 5800, currency: 'EUR', type: 'mixed', highlights: ['Fischmarkt', 'Elbchaussee proximity', 'Palmaille'], transitScore: 93, walkScore: 95 },
  { slug: 'winterhude', city: 'Hamburg', cc: 'DE', en: 'Winterhude', ka: 'ვინტერჰუდე', lat: 53.5964, lng: 10.0128, avgPricePerSqm: 6200, currency: 'EUR', type: 'residential', highlights: ['Stadtpark', 'Kanalside living', 'Alster loops'], transitScore: 91, walkScore: 93 },

  // Frankfurt
  { slug: 'westend', city: 'Frankfurt', cc: 'DE', en: 'Westend', ka: 'ვესტენდი', lat: 50.131, lng: 8.674, avgPricePerSqm: 7800, currency: 'EUR', type: 'luxury', highlights: ['Grüneburgpark', 'Villa quarter', 'Bockenheimer Anlage'], transitScore: 94, walkScore: 93 },
  { slug: 'nordend', city: 'Frankfurt', cc: 'DE', en: 'Nordend', ka: 'ნორდენდი', lat: 50.1395, lng: 8.69, avgPricePerSqm: 6200, currency: 'EUR', type: 'residential', highlights: ['Gründerzeit blocks', 'Berger Straße', 'Holzhausenpark'], transitScore: 92, walkScore: 95 },

  // Cologne
  { slug: 'lindenthal', city: 'Cologne', cc: 'DE', en: 'Lindenthal', ka: 'ლინდენთალი', lat: 50.927, lng: 6.921, avgPricePerSqm: 4800, currency: 'EUR', type: 'residential', highlights: ['Universität proximity', 'Aachener Weiher', 'Villa quarter Lindenthal'], transitScore: 90, walkScore: 91 },

  // Düsseldorf
  { slug: 'oberkassel', city: 'Düsseldorf', cc: 'DE', en: 'Oberkassel', ka: 'ობერკასელი', lat: 51.2253, lng: 6.758, avgPricePerSqm: 6500, currency: 'EUR', type: 'luxury', highlights: ['Rhine promenade views', 'Japanese quarter', 'Belsenpark'], transitScore: 89, walkScore: 92 },

  // Stuttgart
  { slug: 'degerloch', city: 'Stuttgart', cc: 'DE', en: 'Degerloch', ka: 'დეგერლოხი', lat: 48.752, lng: 9.183, avgPricePerSqm: 5000, currency: 'EUR', type: 'residential', highlights: ['Weinsteige villas', 'Fernsehturm proximity', 'Uff-Kirchhof'], transitScore: 87, walkScore: 88 },

  // Leipzig
  { slug: 'plagwitz', city: 'Leipzig', cc: 'DE', en: 'Plagwitz', ka: 'პლაგვიცი', lat: 51.321, lng: 12.32, avgPricePerSqm: 3000, currency: 'EUR', type: 'mixed', highlights: ['Karl-Heine-Kanal', 'Industrial heritage lofts', 'Westwerk'], transitScore: 85, walkScore: 92 },

  // Dresden
  { slug: 'blasewitz', city: 'Dresden', cc: 'DE', en: 'Blasewitz', ka: 'ბლაზევიცი', lat: 51.049, lng: 13.796, avgPricePerSqm: 3900, currency: 'EUR', type: 'residential', highlights: ['Blue Wonder bridge', 'Elbe meadows', 'Schillerplatz'], transitScore: 88, walkScore: 90 },

  // Berlin
  { slug: 'dahlem', city: 'Berlin', cc: 'DE', en: 'Dahlem', ka: 'დალემი', lat: 52.458, lng: 13.29, avgPricePerSqm: 6000, currency: 'EUR', type: 'residential', highlights: ['Freie Universität', 'Museum Dahlem', 'Villa quarters'], transitScore: 84, walkScore: 85 },

  // Amsterdam
  { slug: 'jordaan', city: 'Amsterdam', cc: 'NL', en: 'Jordaan', ka: 'იორდაანი', lat: 52.3738, lng: 4.8816, avgPricePerSqm: 9000, currency: 'EUR', type: 'residential', highlights: ['Canal houses', 'Art galleries', 'Markt cafés'], transitScore: 94, walkScore: 99 },
  { slug: 'de-pijp', city: 'Amsterdam', cc: 'NL', en: 'De Pijp', ka: 'დე-პაიპი', lat: 52.3547, lng: 4.8952, avgPricePerSqm: 8000, currency: 'EUR', type: 'mixed', highlights: ['Albert Cuyp Market', 'Sarphatipark', 'Diverse dining'], transitScore: 92, walkScore: 97 },
  { slug: 'zuid-as', city: 'Amsterdam', cc: 'NL', en: 'Zuidas', ka: 'ზუიდასი', lat: 52.3347, lng: 4.8711, avgPricePerSqm: 7500, currency: 'EUR', type: 'commercial', highlights: ['Financial district', 'VU University', 'Modern architecture'], transitScore: 98, walkScore: 88 },

  // Barcelona
  { slug: 'eixample', city: 'Barcelona', cc: 'ES', en: 'Eixample', ka: 'ეიშამპლი', lat: 41.3918, lng: 2.1638, avgPricePerSqm: 5500, currency: 'EUR', type: 'residential', highlights: ['Gaudí architecture', 'Sagrada Família', 'Passeig de Gràcia'], transitScore: 96, walkScore: 97 },
  { slug: 'gracia', city: 'Barcelona', cc: 'ES', en: 'Gràcia', ka: 'გრასია', lat: 41.4036, lng: 2.1587, avgPricePerSqm: 4800, currency: 'EUR', type: 'residential', highlights: ['Bohemian village feel', 'Plaça del Sol', 'Festes Major'], transitScore: 90, walkScore: 98 },
  { slug: 'el-born', city: 'Barcelona', cc: 'ES', en: 'El Born', ka: 'ელ-ბორნი', lat: 41.3845, lng: 2.1842, avgPricePerSqm: 5200, currency: 'EUR', type: 'mixed', highlights: ['Gothic Quarter adjacency', 'PICASSO Museum', 'Boutiques'], transitScore: 94, walkScore: 99 },
  { slug: 'sarria-sant-gervasi', city: 'Barcelona', cc: 'ES', en: 'Sarrià-Sant Gervasi', ka: 'სარია-სანტ-ჯერვასი', lat: 41.4015, lng: 2.1286, avgPricePerSqm: 6000, currency: 'EUR', type: 'luxury', highlights: ['Tibidabo views', 'Premium schools', 'Park Güell proximity'], transitScore: 88, walkScore: 92 },

  // Madrid
  { slug: 'salamanca', city: 'Madrid', cc: 'ES', en: 'Salamanca', ka: 'სალამანკა', lat: 40.4312, lng: -3.689, avgPricePerSqm: 6000, currency: 'EUR', type: 'luxury', highlights: ['Golden Mile', 'Luxury boutiques', 'Embassy district'], transitScore: 96, walkScore: 97 },
  { slug: 'chamberi', city: 'Madrid', cc: 'ES', en: 'Chamberí', ka: 'ჩამბერი', lat: 40.432, lng: -3.702, avgPricePerSqm: 5000, currency: 'EUR', type: 'residential', highlights: ['Andén 0 metro museum', 'Tapas bars', 'Classic architecture'], transitScore: 94, walkScore: 96 },

  // Milan
  { slug: 'brera', city: 'Milan', cc: 'IT', en: 'Brera', ka: 'ბრერა', lat: 45.4722, lng: 9.1878, avgPricePerSqm: 7000, currency: 'EUR', type: 'mixed', highlights: ['Art district', 'Pinacoteca di Brera', 'Bohemian atmosphere'], transitScore: 94, walkScore: 98 },
  { slug: 'navigli', city: 'Milan', cc: 'IT', en: 'Navigli', ka: 'ნავილი', lat: 45.447, lng: 9.173, avgPricePerSqm: 5500, currency: 'EUR', type: 'mixed', highlights: ['Canal district', 'Aperitivo culture', 'Vintage shops'], transitScore: 90, walkScore: 97 },
  { slug: 'porta-nuova', city: 'Milan', cc: 'IT', en: 'Porta Nuova', ka: 'პორტა-ნუოვა', lat: 45.4836, lng: 9.19, avgPricePerSqm: 8000, currency: 'EUR', type: 'mixed', highlights: ['Modern skyline', 'Bosco Verticale', 'Piazza Gae Aulenti'], transitScore: 96, walkScore: 92 },

  // Rome
  { slug: 'trastevere', city: 'Rome', cc: 'IT', en: 'Trastevere', ka: 'ტრასტევერე', lat: 41.889, lng: 12.4693, avgPricePerSqm: 5000, currency: 'EUR', type: 'residential', highlights: ['Medieval streets', 'Universities', 'Nightlife'], transitScore: 88, walkScore: 96 },
  { slug: 'monti', city: 'Rome', cc: 'IT', en: 'Monti', ka: 'მონტი', lat: 41.8945, lng: 12.496, avgPricePerSqm: 5500, currency: 'EUR', type: 'mixed', highlights: ['Rome\'s oldest rione', 'Via del Boschetto', 'Artisan shops'], transitScore: 92, walkScore: 98 },

  // Vienna
  { slug: 'innere-stadt', city: 'Vienna', cc: 'AT', en: 'Innere Stadt', ka: 'ინერე-შტადტი', lat: 48.2092, lng: 16.3728, avgPricePerSqm: 8000, currency: 'EUR', type: 'luxury', highlights: ['Ringstraße', 'St. Stephen\'s Cathedral', 'Imperial palaces'], transitScore: 98, walkScore: 99 },
  { slug: 'leopoldstadt', city: 'Vienna', cc: 'AT', en: 'Leopoldstadt', ka: 'ლეოპოლდშტადტი', lat: 48.217, lng: 16.391, avgPricePerSqm: 5500, currency: 'EUR', type: 'mixed', highlights: ['Prater park', 'Danube Island', 'Diverse community'], transitScore: 94, walkScore: 92 },

  // Zurich
  { slug: 'altstadt', city: 'Zurich', cc: 'CH', en: 'Altstadt', ka: 'ალტშტადტი', lat: 47.3705, lng: 8.5422, avgPricePerSqm: 15000, currency: 'CHF', type: 'luxury', highlights: ['Old Town', 'Lindenhof', 'Grossmünster'], transitScore: 96, walkScore: 99 },
  { slug: 'seefeld', city: 'Zurich', cc: 'CH', en: 'Seefeld', ka: 'ზეეფელდი', lat: 47.358, lng: 8.561, avgPricePerSqm: 12000, currency: 'CHF', type: 'residential', highlights: ['Lake Zurich access', 'Zürichhorn park', 'Premium dining'], transitScore: 92, walkScore: 95 },

  // ═══════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ═══════════════════════════════════════════════════════════
  // Dubai
  { slug: 'downtown-dubai', city: 'Dubai', cc: 'AE', en: 'Downtown Dubai', ka: 'დაუნთაუნ-დუბაი', lat: 25.1972, lng: 55.2744, avgPricePerSqm: 5000, currency: 'AED', type: 'luxury', highlights: ['Burj Khalifa', 'Dubai Mall', 'Fountain shows'], transitScore: 80, walkScore: 75 },
  { slug: 'dubai-marina-2', city: 'Dubai', cc: 'AE', en: 'Dubai Marina', ka: 'დუბაი-მარინა', lat: 25.0805, lng: 55.1389, avgPricePerSqm: 4000, currency: 'AED', type: 'mixed', highlights: ['Waterfront living', 'JBR Beach', 'Marina Walk'], transitScore: 78, walkScore: 82 },
  { slug: 'palm-jumeirah-2', city: 'Dubai', cc: 'AE', en: 'Palm Jumeirah', ka: 'პალმ-ჯუმეირა', lat: 25.1124, lng: 55.139, avgPricePerSqm: 6000, currency: 'AED', type: 'luxury', highlights: ['Iconic island', 'Atlantis Hotel', 'Private beaches'], transitScore: 60, walkScore: 55 },
  { slug: 'jlt', city: 'Dubai', cc: 'AE', en: 'Jumeirah Lake Towers', ka: 'ჯუმეირა-ლეიქ-თაუერსი', lat: 25.078, lng: 55.141, avgPricePerSqm: 3000, currency: 'AED', type: 'commercial', highlights: ['Business cluster', 'Lake views', 'DMCC free zone'], transitScore: 75, walkScore: 78 },

  // Abu Dhabi
  { slug: 'saadiyat-island', city: 'Abu Dhabi', cc: 'AE', en: 'Saadiyat Island', ka: 'საადიატ-კუნძული', lat: 24.5339, lng: 54.3981, avgPricePerSqm: 4500, currency: 'AED', type: 'luxury', highlights: ['Louvre Abu Dhabi', 'Beach clubs', 'Cultural district'], transitScore: 55, walkScore: 50 },
  { slug: 'al-raha-beach', city: 'Abu Dhabi', cc: 'AE', en: 'Al Raha Beach', ka: 'ალ-რაჰა-ბიჩი', lat: 24.4539, lng: 54.6123, avgPricePerSqm: 3500, currency: 'AED', type: 'mixed', highlights: ['Waterfront living', 'Al Raha Mall', 'Beach access'], transitScore: 60, walkScore: 65 },

  // ═══════════════════════════════════════════════════════════
  // ASIA
  // ═══════════════════════════════════════════════════════════
  // Tokyo
  { slug: 'minato', city: 'Tokyo', cc: 'JP', en: 'Minato', ka: 'მინატო', lat: 35.658, lng: 139.7519, avgPricePerSqm: 1500000, currency: 'JPY', type: 'luxury', highlights: ['Roppongi Hills', 'Tokyo Tower', 'Azabu'], transitScore: 98, walkScore: 96 },
  { slug: 'shibuya', city: 'Tokyo', cc: 'JP', en: 'Shibuya', ka: 'შიბუია', lat: 35.658, lng: 139.7016, avgPricePerSqm: 1200000, currency: 'JPY', type: 'mixed', highlights: ['Shibuya Crossing', 'Harajuku', 'Scramble Square'], transitScore: 99, walkScore: 98 },
  { slug: 'shinjuku', city: 'Tokyo', cc: 'JP', en: 'Shinjuku', ka: 'შინჯუკუ', lat: 35.6896, lng: 139.7006, avgPricePerSqm: 1000000, currency: 'JPY', type: 'mixed', highlights: ['Business center', 'Kabukicho', 'Golden Gai'], transitScore: 99, walkScore: 97 },
  { slug: 'ginza', city: 'Tokyo', cc: 'JP', en: 'Ginza', ka: 'გინზა', lat: 35.6717, lng: 139.7649, avgPricePerSqm: 1800000, currency: 'JPY', type: 'commercial', highlights: ['Luxury shopping', 'Theater district', 'Ginza Six'], transitScore: 98, walkScore: 99 },

  // Seoul
  { slug: 'gangnam', city: 'Seoul', cc: 'KR', en: 'Gangnam', ka: 'განგნამი', lat: 37.4979, lng: 127.0276, avgPricePerSqm: 15000000, currency: 'KRW', type: 'luxury', highlights: ['K-pop district', 'COEX Mall', 'Apgujeong'], transitScore: 96, walkScore: 94 },
  { slug: 'songpa', city: 'Seoul', cc: 'KR', en: 'Songpa', ka: 'სონგპა', lat: 37.5046, lng: 127.106, avgPricePerSqm: 12000000, currency: 'KRW', type: 'residential', highlights: ['Lotte World Tower', 'Seokchon Lake', 'Olympic Park'], transitScore: 95, walkScore: 92 },
  { slug: 'yeouido', city: 'Seoul', cc: 'KR', en: 'Yeouido', ka: 'იეოიდო', lat: 37.5264, lng: 126.9256, avgPricePerSqm: 10000000, currency: 'KRW', type: 'commercial', highlights: ['Financial center', 'Han River parks', '63 Building'], transitScore: 94, walkScore: 88 },

  // Singapore
  { slug: 'marina-bay-2', city: 'Singapore', cc: 'SG', en: 'Marina Bay', ka: 'მარინა-ბეი', lat: 1.2834, lng: 103.8607, avgPricePerSqm: 20000, currency: 'SGD', type: 'luxury', highlights: ['Marina Bay Sands', 'Gardens by the Bay', 'Financial district'], transitScore: 98, walkScore: 95 },
  { slug: 'sentosa', city: 'Singapore', cc: 'SG', en: 'Sentosa', ka: 'სენტოზა', lat: 1.2494, lng: 103.82, avgPricePerSqm: 18000, currency: 'SGD', type: 'luxury', highlights: ['Beach resort', 'Universal Studios', 'Golf courses'], transitScore: 70, walkScore: 60 },
  { slug: 'orchard-road', city: 'Singapore', cc: 'SG', en: 'Orchard Road', ka: 'ორჩარდ-როდი', lat: 1.3048, lng: 103.8318, avgPricePerSqm: 15000, currency: 'SGD', type: 'commercial', highlights: ['Shopping belt', 'ION Orchard', 'Takashimaya'], transitScore: 98, walkScore: 98 },

  // Hong Kong
  { slug: 'central', city: 'Hong Kong', cc: 'HK', en: 'Central', ka: 'ცენტრალი', lat: 22.2819, lng: 114.1583, avgPricePerSqm: 250000, currency: 'HKD', type: 'commercial', highlights: ['Financial center', 'IFC', 'Victoria Peak tram'], transitScore: 99, walkScore: 98 },
  { slug: 'mid-levels', city: 'Hong Kong', cc: 'HK', en: 'Mid-Levels', ka: 'მიდ-ლეველსი', lat: 22.2783, lng: 114.1478, avgPricePerSqm: 200000, currency: 'HKD', type: 'residential', highlights: ['Escalator system', 'SoHo district', 'Expat community'], transitScore: 95, walkScore: 90 },
  { slug: 'tseung-kwan-o', city: 'Hong Kong', cc: 'HK', en: 'Tseung Kwan O', ka: 'ჩუნგ-კვან-ო', lat: 22.3133, lng: 114.26, avgPricePerSqm: 120000, currency: 'HKD', type: 'residential', highlights: ['New town', 'LOHAS Park', 'PopCorn Mall'], transitScore: 88, walkScore: 82 },

  // Bangkok
  { slug: 'sukhumvit', city: 'Bangkok', cc: 'TH', en: 'Sukhumvit', ka: 'სუხუმვიტი', lat: 13.737, lng: 100.5607, avgPricePerSqm: 200000, currency: 'THB', type: 'mixed', highlights: ['BTS line', 'Terminal 21', 'Expat hub'], transitScore: 92, walkScore: 88 },
  { slug: 'silom', city: 'Bangkok', cc: 'TH', en: 'Silom', ka: 'სილომი', lat: 13.7234, lng: 100.5345, avgPricePerSqm: 180000, currency: 'THB', type: 'commercial', highlights: ['Financial district', 'Patpong', 'Lumphini Park'], transitScore: 94, walkScore: 90 },
  { slug: 'riverside-bkk', city: 'Bangkok', cc: 'TH', en: 'Riverside',ka: 'რივერსაიდი', lat: 13.72, lng: 100.51, avgPricePerSqm: 150000, currency: 'THB', type: 'luxury', highlights: ['Chao Phraya River', 'Mandarin Oriental', 'Iconsiam'], transitScore: 80, walkScore: 75 },

  // Mumbai
  { slug: 'bandra', city: 'Mumbai', cc: 'IN', en: 'Bandra', ka: 'ბანდრა', lat: 19.0544, lng: 72.8403, avgPricePerSqm: 500000, currency: 'INR', type: 'luxury', highlights: ['Bollywood homes', 'Bandra-Worli Sea Link', 'BKC proximity'], transitScore: 88, walkScore: 85 },
  { slug: 'worli', city: 'Mumbai', cc: 'IN', en: 'Worli', ka: 'ვორლი', lat: 19.01, lng: 72.815, avgPricePerSqm: 450000, currency: 'INR', type: 'luxury', highlights: ['Sea views', 'Worli Sea Face', 'High-rise living'], transitScore: 82, walkScore: 78 },
  { slug: 'lower-parel', city: 'Mumbai', cc: 'IN', en: 'Lower Parel', ka: 'ლოვერ-პარელი', lat: 19.008, lng: 72.816, avgPricePerSqm: 350000, currency: 'INR', type: 'mixed', highlights: ['Palladium Mall', 'High Street Phoenix', 'Corporate towers'], transitScore: 90, walkScore: 82 },

  // ═══════════════════════════════════════════════════════════
  // AMERICAS
  // ═══════════════════════════════════════════════════════════
  // New York
  { slug: 'manhattan-midtown', city: 'New York', cc: 'US', en: 'Midtown Manhattan', ka: 'მიდტაუნ-მანჰეტენი', lat: 40.7549, lng: -73.984, avgPricePerSqm: 20000, currency: 'USD', type: 'commercial', highlights: ['Times Square', 'Empire State', 'Rockefeller Center'], transitScore: 99, walkScore: 99 },
  { slug: 'tribeca', city: 'New York', cc: 'US', en: 'Tribeca', ka: 'ტრიბეკა', lat: 40.7163, lng: -74.0086, avgPricePerSqm: 18000, currency: 'USD', type: 'luxury', highlights: ['Film festival', 'Hudson River Park', 'Celebrity homes'], transitScore: 96, walkScore: 98 },
  { slug: 'williamsburg', city: 'New York', cc: 'US', en: 'Williamsburg', ka: 'ვილიამსბურგი', lat: 40.7081, lng: -73.9571, avgPricePerSqm: 12000, currency: 'USD', type: 'mixed', highlights: ['Hipster culture', 'Domino Park', 'Brooklyn Brewery'], transitScore: 92, walkScore: 96 },
  { slug: 'chelsea-ny', city: 'New York', cc: 'US', en: 'Chelsea', ka: 'ჩელსი', lat: 40.7465, lng: -74.0014, avgPricePerSqm: 15000, currency: 'USD', type: 'mixed', highlights: ['High Line', 'Gallery district', 'Chelsea Market'], transitScore: 96, walkScore: 98 },

  // Miami
  { slug: 'brickell', city: 'Miami', cc: 'US', en: 'Brickell', ka: 'ბრიკელი', lat: 25.7617, lng: -80.1918, avgPricePerSqm: 8000, currency: 'USD', type: 'mixed', highlights: ['Financial district', 'Brickell City Centre', 'Waterfront'], transitScore: 85, walkScore: 90 },
  { slug: 'south-beach', city: 'Miami', cc: 'US', en: 'South Beach', ka: 'საუთ-ბიჩი', lat: 25.7907, lng: -80.13, avgPricePerSqm: 10000, currency: 'USD', type: 'luxury', highlights: ['Art Deco district', 'Ocean Drive', 'Nightlife'], transitScore: 75, walkScore: 88 },
  { slug: 'wynwood', city: 'Miami', cc: 'US', en: 'Wynwood',ka: 'ვინვუდი', lat: 25.8014, lng: -80.1996, avgPricePerSqm: 6000, currency: 'USD', type: 'mixed', highlights: ['Street art', 'Walls', 'Craft breweries'], transitScore: 70, walkScore: 85 },

  // Los Angeles
  { slug: 'beverly-hills', city: 'Los Angeles', cc: 'US', en: 'Beverly Hills', ka: 'ბევერლი-ჰილზი', lat: 34.0736, lng: -118.4004, avgPricePerSqm: 12000, currency: 'USD', type: 'luxury', highlights: ['Rodeo Drive', 'Celebrity homes', 'Golden Triangle'], transitScore: 55, walkScore: 70 },
  { slug: 'hollywood', city: 'Los Angeles', cc: 'US', en: 'Hollywood', ka: 'ჰოლივუდი', lat: 34.0928, lng: -118.3287, avgPricePerSqm: 7000, currency: 'USD', type: 'mixed', highlights: ['Hollywood Sign', 'Walk of Fame', 'Griffith Observatory'], transitScore: 65, walkScore: 75 },
  { slug: 'santa-monica', city: 'Los Angeles', cc: 'US', en: 'Santa Monica', ka: 'სანტა-მონიკა', lat: 34.0195, lng: -118.4912, avgPricePerSqm: 10000, currency: 'USD', type: 'residential', highlights: ['Beach', 'Pier', 'Third Street Promenade'], transitScore: 72, walkScore: 82 },

  // San Francisco
  { slug: 'pacific-heights', city: 'San Francisco', cc: 'US', en: 'Pacific Heights', ka: 'პასიფიკ-ჰაიტსი', lat: 37.792, lng: -122.435, avgPricePerSqm: 15000, currency: 'USD', type: 'luxury', highlights: ['Bay views', 'Marina District', 'Tech CEO homes'], transitScore: 80, walkScore: 88 },
  { slug: 'soma', city: 'San Francisco', cc: 'US', en: 'SoMa', ka: 'სომა', lat: 37.7785, lng: -122.395, avgPricePerSqm: 10000, currency: 'USD', type: 'mixed', highlights: ['Tech companies', 'Museum of Modern Art', 'AT&T Park'], transitScore: 92, walkScore: 94 },

  // Toronto
  { slug: 'distillery-district', city: 'Toronto', cc: 'CA', en: 'Distillery District', ka: 'დისტილერი-დისტრიქტი', lat: 43.6503, lng: -79.3593, avgPricePerSqm: 900, currency: 'CAD', type: 'mixed', highlights: ['Heritage buildings', 'Art galleries', 'Pedestrian zone'], transitScore: 88, walkScore: 92 },
  { slug: 'yorkville', city: 'Toronto', cc: 'CA', en: 'Yorkville', ka: 'იორკვილი', lat: 43.6708, lng: -79.3912, avgPricePerSqm: 1200, currency: 'CAD', type: 'luxury', highlights: ['Royal Ontario Museum', 'Mink Mile', 'Yorkville Village'], transitScore: 95, walkScore: 96 },

  // São Paulo
  { slug: 'jardins', city: 'São Paulo', cc: 'BR', en: 'Jardins', ka: 'ჟარდინსი', lat: -23.565, lng: -46.674, avgPricePerSqm: 8000, currency: 'BRL', type: 'luxury', highlights: ['Oscar Freire Street', 'JK Iguatemi Mall', 'Faria Lima'], transitScore: 85, walkScore: 90 },
  { slug: 'vila-olimpia', city: 'São Paulo', cc: 'BR', en: 'Vila Olímpia', ka: 'ვილა-ოლიმპია', lat: -23.596, lng: -46.685, avgPricePerSqm: 6000, currency: 'BRL', type: 'commercial', highlights: ['Tech hub', 'Shopping Vila Olímpia', 'Faria Lima corridor'], transitScore: 82, walkScore: 88 },

  // ═══════════════════════════════════════════════════════════
  // AUSTRALIA
  // ═══════════════════════════════════════════════════════════
  { slug: 'bondi', city: 'Sydney', cc: 'AU', en: 'Bondi Beach', ka: 'ბონდაი-ბიჩი', lat: -33.8915, lng: 151.2767, avgPricePerSqm: 18000, currency: 'AUD', type: 'residential', highlights: ['Iconic beach', 'Coastal walk', 'Bondi Icebergs'], transitScore: 78, walkScore: 92 },
  { slug: 'barangaroo-2', city: 'Sydney', cc: 'AU', en: 'Barangaroo', ka: 'ბარანგარუ', lat: -33.861, lng: 151.204, avgPricePerSqm: 20000, currency: 'AUD', type: 'mixed', highlights: ['Waterfront', 'International Towers', 'Crown Sydney'], transitScore: 90, walkScore: 88 },
  { slug: 'south-yarra', city: 'Melbourne', cc: 'AU', en: 'South Yarra', ka: 'საუთ-იარა', lat: -37.839, lng: 144.993, avgPricePerSqm: 12000, currency: 'AUD', type: 'residential', highlights: ['Chapel Street', 'Royal Botanic Gardens', 'Arts Centre'], transitScore: 94, walkScore: 95 },
  { slug: 'fitzroy', city: 'Melbourne', cc: 'AU', en: 'Fitzroy', ka: 'ფიცროი', lat: -37.799, lng: 144.978, avgPricePerSqm: 10000, currency: 'AUD', type: 'mixed', highlights: ['Brunswick Street', 'Vintage shops', 'Art galleries'], transitScore: 90, walkScore: 97 },

  // ═══════════════════════════════════════════════════════════
  // GEORGIA (Tbilisi)
  // ═══════════════════════════════════════════════════════════
  { slug: 'vake', city: 'Tbilisi', cc: 'GE', en: 'Vake', ka: 'ვაკე', lat: 41.716, lng: 44.783, avgPricePerSqm: 1500, currency: 'USD', type: 'residential', highlights: ['Axis Towers', 'Vake Park', 'Premium district'], transitScore: 82, walkScore: 85 },
  { slug: 'mtatsminda', city: 'Tbilisi', cc: 'GE', en: 'Mtatsminda', ka: 'მთაწმინდა', lat: 41.702, lng: 44.794, avgPricePerSqm: 1800, currency: 'USD', type: 'luxury', highlights: ['Panoramic views', 'Funicular', 'Old Tbilisi'], transitScore: 75, walkScore: 80 },
  { slug: 'sololaki', city: 'Tbilisi', cc: 'GE', en: 'Sololaki', ka: 'სოლოლაკი', lat: 41.693, lng: 44.788, avgPricePerSqm: 1200, currency: 'USD', type: 'mixed', highlights: ['Historic quarter', 'Boutique hotels', 'Wine bars'], transitScore: 70, walkScore: 90 },
  { slug: 'saburtalo', city: 'Tbilisi', cc: 'GE', en: 'Saburtalo', ka: 'საბურთალო', lat: 41.738, lng: 44.764, avgPricePerSqm: 1100, currency: 'USD', type: 'residential', highlights: ['Metro line 2', 'Student quarter', 'Saburtalo Park'], transitScore: 85, walkScore: 82 },
  { slug: 'batumi-boulevard', city: 'Batumi', cc: 'GE', en: 'Batumi Boulevard', ka: 'ბათუმის-ბულვარი', lat: 41.637, lng: 41.64, avgPricePerSqm: 1300, currency: 'USD', type: 'luxury', highlights: ['Seaside promenade', 'Alphabetic Tower', 'Beachfront towers'], transitScore: 65, walkScore: 92 },
  { slug: 'kutaisi-center', city: 'Kutaisi', cc: 'GE', en: 'Kutaisi Center', ka: 'ქუთაისის-ცენტრი', lat: 42.268, lng: 42.71, avgPricePerSqm: 600, currency: 'USD', type: 'residential', highlights: ['Colchis Fountain', 'White Bridge', 'Historic center'], transitScore: 60, walkScore: 88 },

  // ═══════════════════════════════════════════════════════════
  // TÜRKIYE
  // ═══════════════════════════════════════════════════════════
  // Istanbul
  { slug: 'besiktas', city: 'Istanbul', cc: 'TR', en: 'Beşiktaş', ka: 'ბეშიქთაში', lat: 41.043, lng: 29.007, avgPricePerSqm: 3000, currency: 'USD', type: 'mixed', highlights: ['Bosphorus waterfront', 'Vodafone Park', 'Fish markets'], transitScore: 90, walkScore: 92 },
  { slug: 'kadikoy', city: 'Istanbul', cc: 'TR', en: 'Kadıköy', ka: 'ქადიქოი', lat: 40.99, lng: 29.027, avgPricePerSqm: 2500, currency: 'USD', type: 'residential', highlights: ['Moda waterfront', 'Kadıköy market', 'Vibrant cafés'], transitScore: 88, walkScore: 94 },
  { slug: 'nisantasi', city: 'Istanbul', cc: 'TR', en: 'Nişantaşı', ka: 'ნიშანთაში', lat: 41.048, lng: 28.994, avgPricePerSqm: 3500, currency: 'USD', type: 'luxury', highlights: ['Luxury shopping', 'Nişantaşı City\'s', 'Art Nouveau blocks'], transitScore: 85, walkScore: 93 },
  { slug: 'beyoglu', city: 'Istanbul', cc: 'TR', en: 'Beyoğlu', ka: 'ბეიოღლუ', lat: 41.037, lng: 28.977, avgPricePerSqm: 2200, currency: 'USD', type: 'mixed', highlights: ['İstiklal Avenue', 'Galata Tower', 'Historic passages'], transitScore: 92, walkScore: 96 },
  { slug: 'uskudar', city: 'Istanbul', cc: 'TR', en: 'Üsküdar', ka: 'უსქუდარი', lat: 41.027, lng: 29.015, avgPricePerSqm: 2000, currency: 'USD', type: 'residential', highlights: ['Maiden\'s Tower views', 'Marmaray hub', 'Ottoman mosques'], transitScore: 87, walkScore: 86 },
  { slug: 'bakirkoy', city: 'Istanbul', cc: 'TR', en: 'Bakırköy', ka: 'ბაქირქოი', lat: 40.982, lng: 28.872, avgPricePerSqm: 1800, currency: 'USD', type: 'residential', highlights: ['Marmara seaside', 'Capacity Mall', 'Family districts'], transitScore: 84, walkScore: 85 },
  // Antalya
  { slug: 'konyaalti', city: 'Antalya', cc: 'TR', en: 'Konyaaltı', ka: 'კონიაალთი', lat: 36.862, lng: 30.639, avgPricePerSqm: 1800, currency: 'USD', type: 'residential', highlights: ['Konyaaltı Beach', 'Antalya Museum', 'Marina'], transitScore: 70, walkScore: 84 },
  { slug: 'lara', city: 'Antalya', cc: 'TR', en: 'Lara', ka: 'ლარა', lat: 36.872, lng: 30.725, avgPricePerSqm: 1600, currency: 'USD', type: 'luxury', highlights: ['Lara Beach', 'Resort hotels', 'Blue Flag coast'], transitScore: 62, walkScore: 78 },
  // Ankara
  { slug: 'cankaya', city: 'Ankara', cc: 'TR', en: 'Çankaya', ka: 'ჩანკაია', lat: 39.908, lng: 32.854, avgPricePerSqm: 1200, currency: 'USD', type: 'residential', highlights: ['Embassy quarter', 'Bahçelievler', 'Atakule'], transitScore: 82, walkScore: 84 },

  // ═══════════════════════════════════════════════════════════
  // CYPRUS
  // ═══════════════════════════════════════════════════════════
  { slug: 'germasogeia', city: 'Limassol', cc: 'CY', en: 'Germasogeia', ka: 'გერმასოგეია', lat: 34.706, lng: 33.08, avgPricePerSqm: 5500, currency: 'EUR', type: 'luxury', highlights: ['Tourist area', 'Dasoudi beach', 'Limassol Marina proximity'], transitScore: 62, walkScore: 80 },
  { slug: 'agios-tychonas', city: 'Limassol', cc: 'CY', en: 'Agios Tychonas', ka: 'აგიოს-ტიხონასი', lat: 34.694, lng: 33.043, avgPricePerSqm: 6000, currency: 'EUR', type: 'luxury', highlights: ['Amara area', 'Four Seasons beach', 'Ancient Amathus'], transitScore: 55, walkScore: 70 },
  { slug: 'kato-paphos', city: 'Paphos', cc: 'CY', en: 'Kato Paphos', ka: 'ქატო-პაფოსი', lat: 34.752, lng: 32.41, avgPricePerSqm: 3500, currency: 'EUR', type: 'mixed', highlights: ['UNESCO mosaics', 'Paphos Harbour', 'Archaeological park'], transitScore: 58, walkScore: 86 },
  { slug: 'nicosia-old-town', city: 'Nicosia', cc: 'CY', en: 'Nicosia Old Town', ka: 'ნიქოზიის-ძველი-ქალაქი', lat: 35.17, lng: 33.362, avgPricePerSqm: 2500, currency: 'EUR', type: 'mixed', highlights: ['Laiki Geitonia', 'Ledra Street', 'Venetian walls'], transitScore: 72, walkScore: 92 },
  { slug: 'mackenzie', city: 'Larnaca', cc: 'CY', en: 'Mackenzie', ka: 'მაკკენზი', lat: 34.925, lng: 33.628, avgPricePerSqm: 3000, currency: 'EUR', type: 'residential', highlights: ['Beachfront strip', 'Larnaca Marina', 'Phinikoudes proximity'], transitScore: 65, walkScore: 88 },
  { slug: 'protaras', city: 'Protaras', cc: 'CY', en: 'Protaras', ka: 'პროტარასი', lat: 34.986, lng: 34.004, avgPricePerSqm: 4500, currency: 'EUR', type: 'luxury', highlights: ['Fig Tree Bay', 'Blue Flag beaches', 'Holiday villas'], transitScore: 45, walkScore: 75 },

  // ═══════════════════════════════════════════════════════════
  // GREECE
  // ═══════════════════════════════════════════════════════════
  { slug: 'kolonaki', city: 'Athens', cc: 'GR', en: 'Kolonaki', ka: 'კოლონაკი', lat: 37.981, lng: 23.747, avgPricePerSqm: 6000, currency: 'EUR', type: 'luxury', highlights: ['Lycabettus slopes', 'Designer boutiques', 'Gallery scene'], transitScore: 88, walkScore: 95 },
  { slug: 'glyfada', city: 'Athens', cc: 'GR', en: 'Glyfada', ka: 'გლიფადა', lat: 37.863, lng: 23.752, avgPricePerSqm: 4500, currency: 'EUR', type: 'residential', highlights: ['Athens Riviera', 'Golf course', 'Marina'], transitScore: 74, walkScore: 85 },
  { slug: 'koukaki', city: 'Athens', cc: 'GR', en: 'Koukaki', ka: 'კუკაკი', lat: 37.965, lng: 23.722, avgPricePerSqm: 3200, currency: 'EUR', type: 'residential', highlights: ['Acropolis Museum next door', 'Fix district', 'Café scene'], transitScore: 90, walkScore: 93 },
  { slug: 'plaka', city: 'Athens', cc: 'GR', en: 'Plaka', ka: 'პლაკა', lat: 37.975, lng: 23.73, avgPricePerSqm: 5000, currency: 'EUR', type: 'mixed', highlights: ['Under the Acropolis', 'Neoclassical lanes', 'Anafiotika'], transitScore: 92, walkScore: 97 },
  { slug: 'ladadika', city: 'Thessaloniki', cc: 'GR', en: 'Ladadika', ka: 'ლადადიკა', lat: 40.638, lng: 22.938, avgPricePerSqm: 2500, currency: 'EUR', type: 'mixed', highlights: ['Restored market quarter', 'Aristotelous proximity', 'Waterfront'], transitScore: 86, walkScore: 95 },
]

/* ── Resolvers ── */

/** Hoods for a country code + city display name (WORLD_NEIGHBORHOODS.city, e.g. 'Istanbul'). */
export function hoodsByCity(cc: string, cityName: string): readonly WorldNeighborhood[] {
  const up = cc.toUpperCase()
  return WORLD_NEIGHBORHOODS.filter((n) => n.cc === up && n.city === cityName)
}

/** One hood by cc + city name + slug — path resolution for /{cc}/{city}/{hood}. */
export function hoodBySlug(cc: string, cityName: string, slug: string): WorldNeighborhood | null {
  return hoodsByCity(cc, cityName).find((n) => n.slug === slug) ?? null
}
