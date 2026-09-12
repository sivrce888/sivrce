/**
 * World landmark projects — iconic developments for map / SEO / directory.
 * ponytail: real coords, real prices where public, no invented data.
 */

export type WorldProject = {
  slug: string
  name: string
  developer?: string
  cc: string
  city: string
  district?: string
  lat: number
  lng: number
  priceFrom?: number
  priceCurrency?: string
  pricePerSqm?: number
  units?: number
  yearCompleted?: number
  status: 'completed' | 'under-construction' | 'planned' | 'sold-out'
  type: 'apartment' | 'villa' | 'townhouse' | 'mixed-use' | 'commercial' | 'hotel' | 'infra'
  floors?: number
  description: string
  website?: string
}

export const WORLD_PROJECTS: readonly WorldProject[] = [
  // ═══════════════════════════════════════════════════════════════
  // UAE — DUBAI
  // ═══════════════════════════════════════════════════════════════
  { slug: 'burj-khalifa', name: 'Burj Khalifa', developer: 'emaar-properties', cc: 'AE', city: 'Dubai', district: 'Downtown Dubai', lat: 25.1972, lng: 55.2744, priceFrom: 1000000, priceCurrency: 'AED', units: 900, yearCompleted: 2010, status: 'completed', type: 'mixed-use', floors: 163, description: 'The world\'s tallest building at 828m, featuring residences, Armani Hotel, and observation decks.', website: 'https://www.burjkhalifa.ae' },
  { slug: 'dubai-marina', name: 'Dubai Marina', developer: 'emaar-properties', cc: 'AE', city: 'Dubai', district: 'Dubai Marina', lat: 25.0805, lng: 55.1389, priceFrom: 800000, priceCurrency: 'AED', units: 12000, yearCompleted: 2012, status: 'completed', type: 'mixed-use', floors: 72, description: 'The world\'s largest man-made marina with over 200 residential towers and waterfront living.' },
  { slug: 'palm-jumeirah', name: 'Palm Jumeirah', developer: 'nakheel', cc: 'AE', city: 'Dubai', district: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390, priceFrom: 2000000, priceCurrency: 'AED', units: 4000, yearCompleted: 2006, status: 'completed', type: 'mixed-use', description: 'Iconic palm-tree shaped artificial island with luxury villas, apartments, and hotels.' },
  { slug: 'dubai-creek-tower', name: 'Dubai Creek Tower', developer: 'emaar-properties', cc: 'AE', city: 'Dubai', district: 'Dubai Creek Harbour', lat: 25.2048, lng: 55.3461, status: 'under-construction', type: 'mixed-use', floors: 130, description: 'Planned to surpass Burj Khalifa as the world\'s tallest structure upon completion.' },
  { slug: 'ain-dubai', name: 'Ain Dubai', developer: 'meraas', cc: 'AE', city: 'Dubai', district: 'Bluewaters Island', lat: 25.0827, lng: 55.1176, yearCompleted: 2021, status: 'completed', type: 'infra', floors: 1, description: 'The world\'s largest observation wheel at 250m, offering panoramic views of Dubai\'s skyline.' },
  { slug: 'dubai-frame', name: 'The Dubai Frame', developer: 'dubai-holding', cc: 'AE', city: 'Dubai', district: 'Zabeel Park', lat: 25.2349, lng: 55.3005, yearCompleted: 2018, status: 'completed', type: 'infra', floors: 1, description: 'An iconic 150m frame-shaped landmark offering views of old and new Dubai.' },
  { slug: 'cayan-tower', name: 'Cayan Tower', cc: 'AE', city: 'Dubai', district: 'Dubai Marina', lat: 25.0837, lng: 55.1385, priceFrom: 1200000, priceCurrency: 'AED', units: 495, yearCompleted: 2013, status: 'completed', type: 'apartment', floors: 73, description: 'A 73-story twisting tower with a 90-degree helix design in Dubai Marina.' },
  { slug: 'meydan-one', name: 'Meydan One', developer: 'meydan', cc: 'AE', city: 'Dubai', district: 'Meydan', lat: 25.1609, lng: 55.2712, status: 'planned', type: 'mixed-use', floors: 100, description: 'Mega mixed-use development with the world\'s longest ski slope and 1km shopping mall.' },
  { slug: 'bluewaters-residences', name: 'Bluewaters Residences', developer: 'meraas', cc: 'AE', city: 'Dubai', district: 'Bluewaters Island', lat: 25.0830, lng: 55.1182, priceFrom: 1500000, priceCurrency: 'AED', units: 698, yearCompleted: 2020, status: 'completed', type: 'apartment', description: 'Premium island living next to Ain Dubai with direct beach access.' },

  // ═══════════════════════════════════════════════════════════════
  // UAE — ABU DHABI
  // ═══════════════════════════════════════════════════════════════
  { slug: 'aldar-hq', name: 'Aldar HQ (The Disc)', developer: 'aldar-properties', cc: 'AE', city: 'Abu Dhabi', lat: 24.4539, lng: 54.6123, yearCompleted: 2010, status: 'completed', type: 'commercial', floors: 23, description: 'Iconic disc-shaped headquarters building on Al Raha Beach, an architectural landmark.' },
  { slug: 'louvre-abu-dhabi', name: 'Louvre Abu Dhabi', cc: 'AE', city: 'Abu Dhabi', district: 'Saadiyat Island', lat: 24.5339, lng: 54.3981, yearCompleted: 2017, status: 'completed', type: 'mixed-use', description: 'Museum and cultural district on Saadiyat Island, designed by Jean Nouvel.' },

  // ═══════════════════════════════════════════════════════════════
  // SAUDI ARABIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'jeddah-tower', name: 'Jeddah Tower', cc: 'SA', city: 'Jeddah', lat: 21.6166, lng: 39.1444, status: 'under-construction', type: 'mixed-use', floors: 100, description: 'Planned to be the world\'s first building over 1km tall, surpassing Burj Khalifa.' },
  { slug: 'red-sea-project', name: 'The Red Sea Project', developer: 'red-sea-global', cc: 'SA', city: 'Riyadh', lat: 25.2854, lng: 36.9189, status: 'under-construction', type: 'hotel', description: 'Luxury regenerative tourism destination spanning 28,000 sqkm on Saudi\'s Red Sea coast.' },
  { slug: 'amaala', name: 'AMAALA', developer: 'red-sea-global', cc: 'SA', city: 'Riyadh', lat: 26.5234, lng: 36.6543, status: 'under-construction', type: 'hotel', description: 'Ultra-luxury resort destination on the Red Sea coast, targeting wellness and art tourism.' },
  { slug: 'neom-the-line', name: 'NEOM — The Line', cc: 'SA', city: 'Riyadh', lat: 27.9849, lng: 35.5736, status: 'under-construction', type: 'mixed-use', floors: 1, description: 'Futuristic linear city stretching 170km, zero cars, zero emissions, 9 million residents planned.' },
  { slug: 'kafd', name: 'King Abdullah Financial District', developer: 'dar-al-arkan', cc: 'SA', city: 'Riyadh', lat: 24.7687, lng: 46.6506, yearCompleted: 2018, status: 'completed', type: 'commercial', floors: 60, description: 'KAFD — 30 towers spanning 1.6M sqm of premium office space.' },
  { slug: 'kingdom-tower-jeddah', name: 'Kingdom Tower', cc: 'SA', city: 'Jeddah', lat: 21.6180, lng: 39.1420, status: 'planned', type: 'commercial', floors: 252, description: 'Proposed supertall tower in Jeddah, part of the Kingdom City mega-project.' },

  // ═══════════════════════════════════════════════════════════════
  // UNITED STATES
  // ═══════════════════════════════════════════════════════════════
  { slug: 'one-vanderbilt', name: 'One Vanderbilt', cc: 'US', city: 'New York', district: 'Midtown', lat: 40.7527, lng: -73.9776, pricePerSqm: 25000, units: 272, yearCompleted: 2020, status: 'completed', type: 'mixed-use', floors: 93, description: 'The tallest office tower in Midtown at 427m, integrated with Grand Central Terminal.' },
  { slug: 'hudson-yards', name: 'Hudson Yards', developer: 'related-companies', cc: 'US', city: 'New York', district: 'Hudson Yards', lat: 40.7534, lng: -74.0006, priceFrom: 1500000, priceCurrency: 'USD', units: 4000, yearCompleted: 2019, status: 'completed', type: 'mixed-use', floors: 70, description: 'The largest private real estate development in US history, 28 acres of mixed-use on Manhattan\'s west side.' },
  { slug: '30-hudson-yards', name: '30 Hudson Yards', cc: 'US', city: 'New York', district: 'Hudson Yards', lat: 40.7539, lng: 74.0018, yearCompleted: 2019, status: 'completed', type: 'commercial', floors: 73, description: 'The tallest building at Hudson Yards with observation deck Edge at 345m.' },
  { slug: 'world-trade-center', name: 'World Trade Center', developer: 'silverstein-properties', cc: 'US', city: 'New York', district: 'FiDi', lat: 40.7127, lng: -74.0134, yearCompleted: 2018, status: 'completed', type: 'mixed-use', floors: 104, description: 'The rebuilt WTC complex including One WTC (1776ft), memorial, and transportation hub.' },
  { slug: 'manhattan-west', name: 'Manhattan West', developer: 'brookfield-us', cc: 'US', city: 'New York', district: 'Hudson Yards', lat: 40.7530, lng: -73.9956, yearCompleted: 2020, status: 'completed', type: 'mixed-use', floors: 65, description: '7-acre mixed-use development with office towers, residences, and public green space.' },
  { slug: 'central-park-tower', name: 'Central Park Tower', cc: 'US', city: 'New York', district: 'Midtown', lat: 40.7648, lng: -73.9746, priceFrom: 6000000, priceCurrency: 'USD', units: 179, yearCompleted: 2021, status: 'completed', type: 'apartment', floors: 98, description: 'The tallest residential building in the world at 472m with Central Park views.' },
  { slug: '432-park', name: '432 Park Avenue', cc: 'US', city: 'New York', district: 'Midtown', lat: 40.7639, lng: -73.9718, priceFrom: 7000000, priceCurrency: 'USD', units: 104, yearCompleted: 2015, status: 'completed', type: 'apartment', floors: 85, description: 'Rafael Viñoly\'s 426m supertall residential tower with grid facade and Central Park panoramas.' },
  { slug: 'one-bryant-park', name: 'One Bryant Park', cc: 'US', city: 'New York', district: 'Midtown', lat: 40.7554, lng: -73.9818, yearCompleted: 2009, status: 'completed', type: 'commercial', floors: 55, description: 'Bank of America Tower — the first LEED Platinum skyscraper in the US.' },
  { slug: 'vista-tower-chicago', name: 'St. Regis Chicago', cc: 'US', city: 'Chicago', district: 'Lakeshore East', lat: 41.8864, lng: -87.6194, priceFrom: 800000, priceCurrency: 'USD', units: 396, yearCompleted: 2022, status: 'completed', type: 'mixed-use', floors: 101, description: 'Jeanne Gang\'s undulating 363m skyscraper, the third-tallest building in Chicago.' },
  { slug: 'chicago-spire', name: 'Chicago Spire', cc: 'US', city: 'Chicago', lat: 41.8885, lng: -87.6180, status: 'planned', type: 'apartment', floors: 150, description: 'Planned 1,550ft twisting residential tower on the Chicago lakefront.' },
  { slug: 'salesforce-tower', name: 'Salesforce Tower', cc: 'US', city: 'San Francisco', district: 'SoMa', lat: 37.7897, lng: -122.3949, yearCompleted: 2018, status: 'completed', type: 'commercial', floors: 61, description: 'San Francisco\'s tallest building at 326m, the centerpiece of the Transbay Redevelopment.' },
  { slug: '181-fremont', name: '181 Fremont', cc: 'US', city: 'San Francisco', district: 'SoMa', lat: 37.7909, lng: -122.3958, priceFrom: 1500000, priceCurrency: 'USD', units: 67, yearCompleted: 2018, status: 'completed', type: 'apartment', floors: 56, description: 'Ultra-luxury residential tower with sky bridge to Salesforce Tower.' },
  { slug: 'apple-park', name: 'Apple Park', cc: 'US', city: 'San Francisco', district: 'Cupertino', lat: 37.3349, lng: -122.0091, yearCompleted: 2017, status: 'completed', type: 'commercial', description: 'Apple\'s 2.8M sqm circular headquarters, a landmark of sustainable corporate architecture.' },
  { slug: 'washington-wharf', name: 'The Wharf', cc: 'US', city: 'Washington', district: 'SW Waterfront', lat: 38.8785, lng: -77.0224, priceFrom: 400000, priceCurrency: 'USD', units: 1500, yearCompleted: 2022, status: 'completed', type: 'mixed-use', description: 'Revitalized DC waterfront with residences, hotels, restaurants, and marina along the Potomac.' },
  { slug: 'amazon-hq2', name: 'Amazon HQ2', cc: 'US', city: 'Washington', district: 'Crystal City', lat: 38.8547, lng: -77.0535, yearCompleted: 2025, status: 'under-construction', type: 'commercial', description: 'Amazon\'s second headquarters in Arlington, VA, with 25,000 jobs and 4M sqm of office space.' },
  { slug: 'one-thousand-museum', name: 'One Thousand Museum', cc: 'US', city: 'Miami', district: 'Downtown', lat: 25.7829, lng: -80.1883, priceFrom: 5000000, priceCurrency: 'USD', units: 84, yearCompleted: 2019, status: 'completed', type: 'apartment', floors: 62, description: 'Zaha Hadid\'s first residential tower in the Western Hemisphere, featuring exoskeleton architecture.' },
  { slug: 'brickell-heights', name: 'Brickell Heights', cc: 'US', city: 'Miami', district: 'Brickell', lat: 25.7617, lng: -80.1918, priceFrom: 400000, priceCurrency: 'USD', units: 800, yearCompleted: 2017, status: 'completed', type: 'apartment', floors: 48, description: 'Brickell\'s premier residential towers with rooftop pool deck and city views.' },
  { slug: '70-vestry', name: '70 Vestry', cc: 'US', city: 'New York', district: 'Tribeca', lat: 40.7183, lng: -74.0105, priceFrom: 5000000, priceCurrency: 'USD', units: 46, yearCompleted: 2018, status: 'completed', type: 'apartment', floors: 13, description: 'Ultra-luxury Tribeca waterfront condominiums designed by Robert A.M. Stern.' },

  // ═══════════════════════════════════════════════════════════════
  // UNITED KINGDOM
  // ═══════════════════════════════════════════════════════════════
  { slug: 'the-shard', name: 'The Shard', cc: 'GB', city: 'London', district: 'London Bridge', lat: 51.5045, lng: -0.0865, priceFrom: 1000000, priceCurrency: 'GBP', units: 12, yearCompleted: 2012, status: 'completed', type: 'mixed-use', floors: 95, description: 'Western Europe\'s tallest building at 310m, featuring offices, restaurants, hotel, and residences.' },
  { slug: 'battersea-power-station', name: 'Battersea Power Station', cc: 'GB', city: 'London', district: 'Battersea', lat: 51.4819, lng: -0.1464, priceFrom: 500000, priceCurrency: 'GBP', units: 2542, yearCompleted: 2022, status: 'completed', type: 'mixed-use', description: 'Iconic power station converted into 42-acre mixed-use district with Apple\'s UK HQ.' },
  { slug: 'one-blackfriars', name: 'One Blackfriars', cc: 'GB', city: 'London', district: 'South Bank', lat: 51.5089, lng: -0.1060, priceFrom: 700000, priceCurrency: 'GBP', units: 274, yearCompleted: 2022, status: 'completed', type: 'apartment', floors: 50, description: 'Signature vase-shaped tower on the South Bank with 360-degree London views.' },
  { slug: '22-bishopsgate', name: '22 Bishopsgate', cc: 'GB', city: 'London', district: 'City', lat: 51.5133, lng: -0.0880, yearCompleted: 2023, status: 'completed', type: 'commercial', floors: 62, description: 'A 62-story City of London office tower with sky gardens on every third floor.' },
  { slug: 'canada-water', name: 'Canada Water Masterplan', cc: 'GB', city: 'London', district: 'Canada Water', lat: 51.4978, lng: -0.0526, status: 'under-construction', type: 'mixed-use', floors: 35, description: '53-acre masterplan to create a new town center in London Docklands.' },
  { slug: 'elephant-park', name: 'Elephant Park', cc: 'GB', city: 'London', district: 'Elephant Castle', lat: 51.4921, lng: -0.0934, priceFrom: 400000, priceCurrency: 'GBP', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major regeneration of Elephant Castle with 2,500 homes, new park, and retail.' },
  { slug: 'manchester-noma', name: 'NOMA', cc: 'GB', city: 'Manchester', district: 'NOMA', lat: 53.4851, lng: -2.2388, priceFrom: 180000, priceCurrency: 'GBP', units: 2000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: '20-acre regeneration creating Manchester\'s new creative and digital neighborhood.' },
  { slug: 'liverpool-waters', name: 'Liverpool Waters', cc: 'GB', city: 'Liverpool', district: 'Pier Head', lat: 53.4084, lng: -2.9892, status: 'under-construction', type: 'mixed-use', floors: 55, description: '£5.5bn regeneration of Liverpool\'s waterfront with 9,000 homes and offices.' },
  { slug: 'birmingham-paradise', name: 'Paradise Birmingham', cc: 'GB', city: 'Birmingham', district: 'City Centre', lat: 52.4810, lng: -1.9130, yearCompleted: 2024, status: 'completed', type: 'mixed-use', floors: 26, description: '£700m transformation of Birmingham\'s city center with offices, retail, and public spaces.' },

  // ═══════════════════════════════════════════════════════════════
  // FRANCE
  // ═══════════════════════════════════════════════════════════════
  { slug: 'tour-montparnasse', name: 'Tour Montparnasse Renewal', cc: 'FR', city: 'Paris', district: 'Montparnasse', lat: 48.8421, lng: 2.3219, status: 'under-construction', type: 'commercial', floors: 59, description: '€300M renovation of the 210m tower including a 59th-floor rooftop garden and museum.' },
  { slug: 'la-defense', name: 'La Défense Grande Arche', cc: 'FR', city: 'Paris', district: 'La Défense', lat: 48.8924, lng: 2.2360, yearCompleted: 1989, status: 'completed', type: 'commercial', floors: 37, description: 'Europe\'s largest purpose-built business district with 180,000 professionals daily.' },
  { slug: 'lyon-confluence', name: 'Lyon Confluence', cc: 'FR', city: 'Lyon', district: 'Confluence', lat: 45.7441, lng: 4.8197, priceFrom: 300000, priceCurrency: 'EUR', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Europe\'s largest urban renewal project — 150 hectares at the confluence of the Rhône and Saône.' },
  { slug: 'lyon-part-dieu', name: 'Part-Dieu Transformation', cc: 'FR', city: 'Lyon', district: 'Part-Dieu', lat: 45.7606, lng: 4.8592, status: 'under-construction', type: 'mixed-use', floors: 40, description: 'Transformation of Lyon\'s business district with new towers and public spaces.' },
  { slug: 'bordeaux-bassins', name: 'Bassins à flot', cc: 'FR', city: 'Bordeaux', district: 'Bassins à flot', lat: 44.8570, lng: -0.5611, priceFrom: 250000, priceCurrency: 'EUR', units: 2000, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Waterfront regeneration of Bordeaux\'s former industrial port.' },
  { slug: 'nice-promenade', name: 'Promenade des Anglais Towers', cc: 'FR', city: 'Nice', district: 'Centre', lat: 43.6945, lng: 7.2668, priceFrom: 400000, priceCurrency: 'EUR', units: 800, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 30, description: 'Luxury residential towers along Nice\'s famous seaside promenade.' },
  { slug: 'marseille-euromed', name: 'Euroméditerranée', cc: 'FR', city: 'Marseille', district: 'Joliette', lat: 43.3000, lng: 5.3700, status: 'under-construction', type: 'mixed-use', description: 'Major urban renewal of Marseille\'s waterfront — one of Europe\'s largest renewal projects.' },

  // ═══════════════════════════════════════════════════════════════
  // GERMANY
  // ═══════════════════════════════════════════════════════════════
  { slug: 'europacity-berlin', name: 'Europacity', cc: 'DE', city: 'Berlin', district: 'Moabit', lat: 52.5251, lng: 13.3694, priceFrom: 400000, priceCurrency: 'EUR', units: 4000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'New neighborhood around Berlin Central Station with offices, housing, and cultural venues.' },
  { slug: 'alexanderplatz-turm', name: 'Alexanderplatz Tower', cc: 'DE', city: 'Berlin', district: 'Mitte', lat: 52.5219, lng: 13.4132, status: 'planned', type: 'mixed-use', floors: 60, description: 'Planned 150m tower at Alexanderplatz, part of Berlin\'s largest urban redevelopment.' },
  { slug: 'hafencity-hamburg', name: 'HafenCity', cc: 'DE', city: 'Hamburg', district: 'HafenCity', lat: 53.5414, lng: 9.9938, priceFrom: 500000, priceCurrency: 'EUR', units: 12000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Europe\'s largest inner-city development — doubling Hamburg\'s city center with 12,000 homes.' },
  { slug: 'elbphilharmonie', name: 'Elbphilharmonie', cc: 'DE', city: 'Hamburg', district: 'HafenCity', lat: 53.5413, lng: 9.9837, yearCompleted: 2017, status: 'completed', type: 'mixed-use', floors: 24, description: 'Iconic glass concert hall atop a historic warehouse, Hamburg\'s new landmark.' },
  { slug: 'four-frankfurt', name: 'Four Frankfurt', cc: 'DE', city: 'Frankfurt', district: 'Innenstadt', lat: 50.1109, lng: 8.6821, priceFrom: 500000, priceCurrency: 'EUR', units: 1400, yearCompleted: 2024, status: 'completed', type: 'mixed-use', floors: 233, description: 'Four skyscrapers transforming Frankfurt\'s skyline with offices, homes, and a hotel.' },
  { slug: 'munich-olympiapark', name: 'Olympiapark München', cc: 'DE', city: 'Munich', district: 'Milbertshofen', lat: 48.1796, lng: 11.5541, status: 'under-construction', type: 'mixed-use', description: 'Major redevelopment of the 1972 Olympics site with housing, innovation campus, and public park.' },
  { slug: 'leipzig-city-tunnel', name: 'Leipzig City Tunnel', cc: 'DE', city: 'Leipzig', lat: 51.3444, lng: 12.3734, yearCompleted: 2013, status: 'completed', type: 'infra', description: 'Rail tunnel connecting Leipzig\'s central stations, catalyzing €5B in surrounding development.' },

  // ═══════════════════════════════════════════════════════════════
  // SPAIN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'madrid-nuevo-norte', name: 'Madrid Nuevo Norte', cc: 'ES', city: 'Madrid', district: 'Chamartín', lat: 40.4720, lng: -3.6836, priceFrom: 300000, priceCurrency: 'EUR', units: 35000, status: 'under-construction', type: 'mixed-use', floors: 250, description: 'Spain\'s largest urban regeneration — €6B transformation of Chamartín station area.' },
  { slug: 'cuatro-torres', name: 'Cuatro Torres Business Area', cc: 'ES', city: 'Madrid', district: 'Chamartín', lat: 40.4665, lng: -3.6890, yearCompleted: 2009, status: 'completed', type: 'commercial', floors: 58, description: 'Madrid\'s iconic business district with four towers over 200m tall.' },
  { slug: 'barcelona-22@', name: '22@ Barcelona', cc: 'ES', city: 'Barcelona', district: 'Poblenou', lat: 41.4025, lng: 2.1942, priceFrom: 350000, priceCurrency: 'EUR', units: 4000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Innovation district transforming Poblenou\'s industrial area into a tech and creative hub.' },
  { slug: 'valencia-arts-sciences', name: 'City of Arts and Sciences', cc: 'ES', city: 'Valencia', district: 'Quatre Carreres', lat: 39.4522, lng: -0.3529, yearCompleted: 2005, status: 'completed', type: 'mixed-use', description: 'Santiago Calatrava\'s futuristic cultural complex — Valencia\'s most iconic landmark.' },
  { slug: 'bilbao-guggenheim', name: 'Abandoibarra', cc: 'ES', city: 'Bilbao', district: 'Abandoibarra', lat: 43.2678, lng: -2.9314, yearCompleted: 2010, status: 'completed', type: 'mixed-use', description: 'Waterfront renewal including the Guggenheim Museum and residential towers.' },
  { slug: 'seville-cartuja', name: 'Isla de la Cartuja', cc: 'ES', city: 'Seville', district: 'Cartuja', lat: 37.4059, lng: -6.0005, status: 'under-construction', type: 'mixed-use', description: 'Transforming the 1992 Expo site into a mixed-use innovation district.' },
  { slug: 'malaga-huelin', name: 'Huelin Waterfront', cc: 'ES', city: 'Málaga', district: 'Huelin', lat: 36.7050, lng: -4.4200, priceFrom: 200000, priceCurrency: 'EUR', units: 1500, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', description: 'Mediterranean waterfront regeneration with luxury apartments and public promenades.' },

  // ═══════════════════════════════════════════════════════════════
  // ITALY
  // ═══════════════════════════════════════════════════════════════
  { slug: 'porta-nuova', name: 'Porta Nuova', cc: 'IT', city: 'Milan', district: 'Isola', lat: 45.4836, lng: 9.1900, priceFrom: 400000, priceCurrency: 'EUR', units: 2000, yearCompleted: 2015, status: 'completed', type: 'mixed-use', floors: 50, description: 'Milan\'s modern skyline with Bosco Verticale, Piazza Gae Aulenti, and UniCredit Tower.' },
  { slug: 'citylife', name: 'CityLife', cc: 'IT', city: 'Milan', district: 'CityLife', lat: 45.4747, lng: 9.1586, priceFrom: 500000, priceCurrency: 'EUR', units: 1500, yearCompleted: 2022, status: 'completed', type: 'mixed-use', floors: 50, description: '366,000 sqm development with Isozaki, Hadid, and Libeskind towers and Europe\'s largest park.' },
  { slug: 'bosco-verticale', name: 'Bosco Verticale', cc: 'IT', city: 'Milan', district: 'Porta Nuova', lat: 45.4857, lng: 9.1908, priceFrom: 600000, priceCurrency: 'EUR', units: 180, yearCompleted: 2014, status: 'completed', type: 'apartment', floors: 27, description: 'Stefano Boeri\'s vertical forest — two residential towers with 900 trees and 20,000 plants.' },
  { slug: 'roma-eur', name: 'EUR District Revival', cc: 'IT', city: 'Rome', district: 'EUR', lat: 41.8310, lng: 12.4693, status: 'under-construction', type: 'mixed-use', description: 'Rome\'s modern business district with new metro line and mixed-use redevelopment.' },
  { slug: 'torre-unicredit', name: 'Torre Unicredit', cc: 'IT', city: 'Milan', district: 'Porta Nuova', lat: 45.4845, lng: 9.1893, yearCompleted: 2012, status: 'completed', type: 'commercial', floors: 31, description: 'Italy\'s tallest building at 231m, the centerpiece of Milan\'s Porta Nuova district.' },
  { slug: 'turin-lingotto', name: 'Lingotto Renovation', cc: 'IT', city: 'Turin', district: 'Lingotto', lat: 45.0311, lng: 7.6667, priceFrom: 200000, priceCurrency: 'EUR', units: 2000, status: 'under-construction', type: 'mixed-use', description: 'Major mixed-use development on Turin\'s historic Lingotto factory site.' },
  { slug: 'florence-rifredi', name: 'Firenze Rifredi', cc: 'IT', city: 'Florence', district: 'Rifredi', lat: 43.7886, lng: 11.2478, status: 'under-construction', type: 'mixed-use', description: 'Regeneration of Florence\'s Rifredi neighborhood with new housing and public spaces.' },
  { slug: 'naples-centrale', name: 'Napoli Centrale Revival', cc: 'IT', city: 'Naples', lat: 40.8518, lng: 14.2730, status: 'under-construction', type: 'mixed-use', description: 'Redevelopment of Naples\' central station area with commercial and residential projects.' },
  { slug: 'rome-testaccio', name: 'Testaccio Quarter', cc: 'IT', city: 'Rome', district: 'Testaccio', lat: 41.8800, lng: 12.4750, priceFrom: 300000, priceCurrency: 'EUR', units: 1000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Revitalization of Rome\'s historic Testaccio neighborhood with modern residences.' },

  // ═══════════════════════════════════════════════════════════════
  // JAPAN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'tokyo-station-city', name: 'Tokyo Station City', developer: 'mitsubishi-estate', cc: 'JP', city: 'Tokyo', district: 'Marunouchi', lat: 35.6812, lng: 139.7671, yearCompleted: 2017, status: 'completed', type: 'mixed-use', description: 'The redevelopment of Tokyo\'s historic station area into a world-class business and retail district.' },
  { slug: 'azabudai-hills', name: 'Azabudai Hills', developer: 'mitsubishi-estate', cc: 'JP', city: 'Tokyo', district: 'Minato', lat: 35.6592, lng: 139.7377, priceFrom: 200000000, priceCurrency: 'JPY', units: 900, yearCompleted: 2023, status: 'completed', type: 'mixed-use', floors: 54, description: 'Tokyo\'s newest landmark — a ¥400B mixed-use development with Mori Art Museum extension.' },
  { slug: 'tokyo-midtown', name: 'Tokyo Midtown', developer: 'mitsui-fudosan', cc: 'JP', city: 'Tokyo', district: 'Roppongi', lat: 35.6654, lng: 139.7307, yearCompleted: 2007, status: 'completed', type: 'mixed-use', floors: 37, description: 'Comprehensive development including offices, Ritz-Carlton hotel, residences, and art spaces.' },
  { slug: 'shinagawa-gateway', name: 'Shinagawa Gateway', cc: 'JP', city: 'Tokyo', district: 'Shinagawa', lat: 35.6284, lng: 139.7401, status: 'under-construction', type: 'mixed-use', floors: 30, description: 'Major redevelopment of Shinagawa station area for the Shinkansen extension.' },
  { slug: 'minato-mirai', name: 'Minato Mirai 21', cc: 'JP', city: 'Yokohama', district: 'Minato Mirai', lat: 35.4554, lng: 139.6336, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 70, description: 'Yokohama\'s futuristic waterfront district with the Landmark Tower and convention center.' },
  { slug: 'osaka-umeda', name: 'Umeda 2nd Period', cc: 'JP', city: 'Osaka', district: 'Umeda', lat: 34.7055, lng: 135.4957, status: 'under-construction', type: 'mixed-use', floors: 50, description: 'Major redevelopment of Osaka\'s northern hub with new towers and public spaces.' },
  { slug: 'fukuoka-hakata', name: 'Hakata Riverain', cc: 'JP', city: 'Fukuoka', district: 'Hakata', lat: 33.5898, lng: 130.4103, yearCompleted: 2020, status: 'completed', type: 'mixed-use', description: 'Waterfront development with Canal City Hakata and Fukuoka Art Museum.' },
  { slug: 'osaka-2025-expo', name: 'Osaka 2025 Expo Site', cc: 'JP', city: 'Osaka', district: 'Yumeshima', lat: 34.6500, lng: 135.3900, yearCompleted: 2025, status: 'completed', type: 'mixed-use', description: 'World Expo 2025 site on Yumeshima island, to be converted to an integrated resort.' },

  // ═══════════════════════════════════════════════════════════════
  // CHINA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'shanghai-tower', name: 'Shanghai Tower', cc: 'CN', city: 'Shanghai', district: 'Lujiazui', lat: 31.2336, lng: 121.5045, pricePerSqm: 100000, units: 1000, yearCompleted: 2015, status: 'completed', type: 'mixed-use', floors: 128, description: 'China\'s tallest building at 632m with twisted form and sky gardens every 12 floors.' },
  { slug: 'ping-an-finance', name: 'Ping An Finance Centre', cc: 'CN', city: 'Shenzhen', district: 'Futian', lat: 22.5347, lng: 114.0543, yearCompleted: 2017, status: 'completed', type: 'commercial', floors: 115, description: 'The tallest building in Shenzhen at 599m, housing Ping An Insurance headquarters.' },
  { slug: 'gz-ctf-finance', name: 'Guangzhou CTF Finance Centre', cc: 'CN', city: 'Guangzhou', district: 'Zhujiang New Town', lat: 23.1302, lng: 113.3216, yearCompleted: 2016, status: 'completed', type: 'mixed-use', floors: 111, description: 'The tallest building in Guangzhou at 530m, featuring offices, hotel, and apartments.' },
  { slug: 'beijing-cbd', name: 'Beijing CBD', cc: 'CN', city: 'Beijing', district: 'CBD', lat: 39.9087, lng: 116.4694, status: 'under-construction', type: 'mixed-use', floors: 108, description: 'China Zun tower and surrounding CBD development, Beijing\'s new business center.' },
  { slug: 'chengdu-tianfu', name: 'Chengdu Tianfu New Area', cc: 'CN', city: 'Chengdu', district: 'Tianfu', lat: 30.4927, lng: 104.0522, status: 'under-construction', type: 'mixed-use', description: 'China\'s largest new town development spanning 1,578 sqkm south of Chengdu.' },
  { slug: 'wuhan-greenland', name: 'Wuhan Greenland Center', cc: 'CN', city: 'Wuhan', district: 'Wuchang', lat: 30.5951, lng: 114.3073, status: 'under-construction', type: 'mixed-use', floors: 636, description: 'Planned as China\'s tallest building at 636m, currently under construction.' },
  { slug: 'shenzhen-bay', name: 'Shenzhen Bay Super HQ', cc: 'CN', city: 'Shenzhen', district: 'Nanshan', lat: 22.5184, lng: 113.9395, status: 'under-construction', type: 'mixed-use', floors: 400, description: 'Ultra-high-rise cluster on Shenzhen Bay with towers over 400m.' },
  { slug: 'hangzhou-qianjiang', name: 'Qianjiang New City', cc: 'CN', city: 'Hangzhou', district: 'Qianjiang', lat: 30.2457, lng: 120.2103, yearCompleted: 2023, status: 'completed', type: 'mixed-use', floors: 65, description: 'Hangzhou\'s new CBD with the Olympic Sports Center and financial district.' },
  { slug: 'nanjing-zifeng', name: 'Zifeng Tower', cc: 'CN', city: 'Nanjing', district: 'Gulou', lat: 32.0554, lng: 118.7753, yearCompleted: 2010, status: 'completed', type: 'mixed-use', floors: 66, description: 'Nanjing\'s tallest building at 450m, featuring a Ziggurat-inspired design.' },

  // ═══════════════════════════════════════════════════════════════
  // SOUTH KOREA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'lotte-world-tower', name: 'Lotte World Tower', cc: 'KR', city: 'Seoul', district: 'Songpa', lat: 37.5126, lng: 127.1026, pricePerSqm: 5000000, units: 555, yearCompleted: 2017, status: 'completed', type: 'mixed-use', floors: 123, description: 'South Korea\'s tallest building at 555m, with Lotte World Mall and observation deck.' },
  { slug: 'songdo-ibd', name: 'Songdo International Business District', cc: 'KR', city: 'Incheon', district: 'Songdo', lat: 37.3815, lng: 126.6600, priceFrom: 300000, priceCurrency: 'USD', units: 30000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Smart city built from scratch on 5,300 acres of reclaimed land.' },
  { slug: 'yongsan-masterplan', name: 'Yongsan IBD', cc: 'KR', city: 'Seoul', district: 'Yongsan', lat: 37.5255, lng: 126.9657, status: 'under-construction', type: 'mixed-use', floors: 100, description: 'Seoul\'s largest urban redevelopment with a 335m supertall tower and new central park.' },
  { slug: 'busan-haeundae', name: 'Haeundae LCT', cc: 'KR', city: 'Busan', district: 'Haeundae', lat: 35.1590, lng: 129.1605, priceFrom: 500000000, priceCurrency: 'KRW', units: 1400, yearCompleted: 2023, status: 'completed', type: 'apartment', floors: 101, description: 'Busan\'s tallest towers on Haeundae Beach with 101-floor luxury residences.' },
  { slug: 'gangnam-peak', name: 'Gangnam Luxury District', cc: 'KR', city: 'Seoul', district: 'Gangnam', lat: 37.4979, lng: 127.0276, priceFrom: 800000000, priceCurrency: 'KRW', status: 'completed', type: 'apartment', description: 'Seoul\'s most prestigious residential district with ultra-luxury apartment complexes.' },

  // ═══════════════════════════════════════════════════════════════
  // SINGAPORE
  // ═══════════════════════════════════════════════════════════════
  { slug: 'marina-bay-sands', name: 'Marina Bay Sands', cc: 'SG', city: 'Singapore', district: 'Marina Bay', lat: 1.2834, lng: 103.8607, yearCompleted: 2010, status: 'completed', type: 'hotel', floors: 57, description: 'Iconic three-tower hotel with SkyPark connecting the tops, Singapore\'s most recognizable landmark.' },
  { slug: 'capitaspring', name: 'Capitaspring', developer: 'capitaland', cc: 'SG', city: 'Singapore', district: 'CBD', lat: 1.2801, lng: 103.8486, yearCompleted: 2023, status: 'completed', type: 'mixed-use', floors: 51, description: 'A 51-story integrated development with offices, hotel, and a four-story Green Oasis.' },
  { slug: 'greater-southern-waterfront', name: 'Greater Southern Waterfront', cc: 'SG', city: 'Singapore', district: 'Sentosa', lat: 1.2494, lng: 103.8200, status: 'planned', type: 'mixed-use', description: 'Singapore\'s largest waterfront redevelopment — 6x the size of Marina Bay.' },
  { slug: 'paya-lebar-quarter', name: 'Paya Lebar Quarter', cc: 'SG', city: 'Singapore', district: 'Paya Lebar', lat: 1.3462, lng: 103.8917, yearCompleted: 2022, status: 'completed', type: 'mixed-use', floors: 42, description: 'New suburban CBD with Grade A offices, residences, and a landscaped park.' },
  { slug: 'sentosa-cove', name: 'Sentosa Cove', cc: 'SG', city: 'Singapore', district: 'Sentosa', lat: 1.2489, lng: 103.8422, priceFrom: 3000000, priceCurrency: 'SGD', units: 2000, yearCompleted: 2015, status: 'completed', type: 'villa', description: 'Exclusive waterfront residential enclave on Sentosa Island with private marina.' },

  // ═══════════════════════════════════════════════════════════════
  // AUSTRALIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'barangaroo', name: 'Barangaroo', cc: 'AU', city: 'Sydney', district: 'Barangaroo', lat: -33.8610, lng: 151.2040, priceFrom: 1000000, priceCurrency: 'AUD', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 71, description: 'Sydney\'s largest urban renewal — 22 hectares of waterfront with 3,000 homes and the International Towers.' },
  { slug: 'crown-sydney', name: 'Crown Sydney', cc: 'AU', city: 'Sydney', district: 'Barangaroo', lat: -33.8564, lng: 151.2046, priceFrom: 2000000, priceCurrency: 'AUD', units: 143, yearCompleted: 2021, status: 'completed', type: 'mixed-use', floors: 75, description: 'Sydney\'s tallest building at 271m with luxury hotel, residences, and Crown casino.' },
  { slug: 'fishermans-bend', name: 'Fishermans Bend', cc: 'AU', city: 'Melbourne', district: 'Fishermans Bend', lat: -37.8350, lng: 144.9350, status: 'under-construction', type: 'mixed-use', description: 'Australia\'s largest urban renewal — 480 hectares with 80,000 residents planned.' },
  { slug: 'queens-wharf', name: 'Queen\'s Wharf', cc: 'AU', city: 'Brisbane', district: 'CBD', lat: -27.4796, lng: 153.0223, yearCompleted: 2024, status: 'completed', type: 'mixed-use', floors: 55, description: 'Brisbane\'s new entertainment precinct with a $3.6B integrated resort and public riverwalk.' },
  { slug: 'southbank-melbourne', name: 'Southbank by Mirvac', cc: 'AU', city: 'Melbourne', district: 'Southbank', lat: -37.8254, lng: 144.9618, priceFrom: 500000, priceCurrency: 'AUD', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major mixed-use precinct transforming Melbourne\'s Southbank arts district.' },

  // ═══════════════════════════════════════════════════════════════
  // INDIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'palais-royale', name: 'Palais Royale', cc: 'IN', city: 'Mumbai', district: 'Lower Parel', lat: 19.0080, lng: 72.8163, priceFrom: 100000000, priceCurrency: 'INR', units: 300, yearCompleted: 2018, status: 'completed', type: 'apartment', floors: 75, description: 'India\'s tallest residential building at 320m with luxury apartments and sky gardens.' },
  { slug: 'lodha-world-one', name: 'Lodha World One', cc: 'IN', city: 'Mumbai', district: 'Worli', lat: 19.0100, lng: 72.8350, priceFrom: 50000000, priceCurrency: 'INR', units: 300, yearCompleted: 2020, status: 'completed', type: 'apartment', floors: 76, description: 'One of India\'s tallest residential towers with 76 floors and panoramic Arabian Sea views.' },
  { slug: 'dlf-cyber-city', name: 'DLF Cyber City', cc: 'IN', city: 'Gurugram', district: 'Cyber City', lat: 28.4949, lng: 77.0883, yearCompleted: 2008, status: 'completed', type: 'commercial', description: 'India\'s largest IT/ITES campus with 3M sqm of Grade A office space.' },
  { slug: 'bandra-worli-sealink', name: 'Bandra-Worli Sea Link', cc: 'IN', city: 'Mumbai', lat: 19.0300, lng: 72.8180, yearCompleted: 2010, status: 'completed', type: 'infra', description: 'India\'s first eight-lane bridge across the sea, connecting Bandra and Worli in Mumbai.' },
  { slug: 'mumbai-coastal-road', name: 'Mumbai Coastal Road', cc: 'IN', city: 'Mumbai', lat: 18.9432, lng: 72.8234, status: 'under-construction', type: 'infra', description: '10.58km coastal highway connecting Marine Drive to the Bandra-Worli Sea Link.' },
  { slug: 'bangalore-techvillage', name: 'Embassy TechVillage', cc: 'IN', city: 'Bangalore', district: 'Outer Ring Road', lat: 12.9170, lng: 77.6228, yearCompleted: 2016, status: 'completed', type: 'commercial', description: 'Major IT park on Bangalore\'s Outer Ring Road hosting global tech companies.' },
  { slug: 'delhi-aerocity', name: 'Aerocity', cc: 'IN', city: 'Delhi', district: 'Aerocity', lat: 28.5559, lng: 77.0980, yearCompleted: 2020, status: 'completed', type: 'mixed-use', description: 'Airport-adjacent hospitality district with luxury hotels and commercial space.' },

  // ═══════════════════════════════════════════════════════════════
  // TURKEY
  // ═══════════════════════════════════════════════════════════════
  { slug: 'istanbul-financial-center', name: 'Istanbul Financial Center', cc: 'TR', city: 'Istanbul', district: 'Ataşehir', lat: 40.9833, lng: 29.1167, yearCompleted: 2023, status: 'completed', type: 'commercial', floors: 55, description: 'Turkey\'s new financial capital with 1.5M sqm of office space in Ataşehir.' },
  { slug: 'galataport', name: 'Galataport', cc: 'TR', city: 'Istanbul', district: 'Karaköy', lat: 41.0234, lng: 28.9764, yearCompleted: 2022, status: 'completed', type: 'mixed-use', description: 'Istanbul\'s waterfront promenade — cruise port, retail, restaurants, and cultural spaces along the Bosphorus.' },
  { slug: 'taksim-1453', name: '1453 Taksim', cc: 'TR', city: 'Istanbul', district: 'Taksim', lat: 41.0370, lng: 28.9850, priceFrom: 2000000, priceCurrency: 'TRY', units: 2000, yearCompleted: 2018, status: 'completed', type: 'apartment', floors: 25, description: 'Large-scale residential complex near Taksim Square with 2,000 apartments.' },
  { slug: 'kanyon-levent', name: 'Kanyon', cc: 'TR', city: 'Istanbul', district: 'Levent', lat: 41.0819, lng: 29.0107, yearCompleted: 2006, status: 'completed', type: 'mixed-use', floors: 26, description: 'Award-winning mixed-use complex in Levent with offices, retail, and residences.' },
  { slug: 'istanbul-metro', name: 'Istanbul Metro Expansion', cc: 'TR', city: 'Istanbul', lat: 41.0082, lng: 28.9784, status: 'under-construction', type: 'infra', description: 'Major metro expansion with new lines connecting European and Asian sides.' },
  { slug: 'bursa-mudanya', name: 'Mudanya Waterfront', cc: 'TR', city: 'Bursa', district: 'Mudanya', lat: 40.3750, lng: 28.8800, priceFrom: 500000, priceCurrency: 'TRY', units: 1000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Bursa\'s Marmara Sea coastal development with luxury apartments and promenade.' },

  // ═══════════════════════════════════════════════════════════════
  // NETHERLANDS
  // ═══════════════════════════════════════════════════════════════
  { slug: 'amsterdam-zuidas', name: 'Zuidas', cc: 'NL', city: 'Amsterdam', district: 'Zuidas', lat: 52.3347, lng: 4.8711, priceFrom: 500000, priceCurrency: 'EUR', units: 20000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Amsterdam\'s new central business district — transforming the South Axis into a 24/7 neighborhood.' },
  { slug: 'amsterdam-houthaven', name: 'Houthaven', cc: 'NL', city: 'Amsterdam', district: 'Houthaven', lat: 52.3934, lng: 4.8851, priceFrom: 400000, priceCurrency: 'EUR', units: 4500, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Sustainable waterfront neighborhood built on former timber docks with climate-neutral homes.' },
  { slug: 'rotterdam-markthal', name: 'Markthal Rotterdam', cc: 'NL', city: 'Rotterdam', district: 'City Center', lat: 51.9200, lng: 4.4822, yearCompleted: 2014, status: 'completed', type: 'mixed-use', floors: 12, description: 'Horseshoe-shaped market hall with 228 apartments, restaurants, and market stalls.' },
  { slug: 'rotterdam-de-kuip', name: 'De Kuip', cc: 'NL', city: 'Rotterdam', district: 'Feijenoord', lat: 51.8939, lng: 4.5231, status: 'under-construction', type: 'mixed-use', description: 'Major redevelopment around Feyenoord\'s stadium with 4,000 homes and commercial space.' },
  { slug: 'the-hague-scheveningen', name: 'Scheveningen Boulevard', cc: 'NL', city: 'The Hague', district: 'Scheveningen', lat: 52.0980, lng: 4.2650, priceFrom: 350000, priceCurrency: 'EUR', units: 2000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Waterfront renewal of The Hague\'s famous beach resort with luxury apartments.' },
  { slug: 'utrecht-stationsgebied', name: 'Stationsgebied Utrecht', cc: 'NL', city: 'Utrecht', district: 'Station', lat: 52.0893, lng: 5.1087, priceFrom: 300000, priceCurrency: 'EUR', units: 10000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Utrecht\'s massive station area redevelopment with offices, homes, and cultural spaces.' },

  // ═══════════════════════════════════════════════════════════════
  // POLAND
  // ═══════════════════════════════════════════════════════════════
  { slug: 'varso-tower', name: 'Varso Tower', cc: 'PL', city: 'Warsaw', district: 'Wola', lat: 52.2287, lng: 20.9885, pricePerSqm: 15000, units: 70000, yearCompleted: 2024, status: 'completed', type: 'commercial', floors: 53, description: 'Poland\'s tallest building at 310m with observation deck and office space.' },
  { slug: 'warsaw-centralna', name: 'Warsaw Centralna Station', cc: 'PL', city: 'Warsaw', district: 'Śródmieście', lat: 52.2289, lng: 21.0035, status: 'under-construction', type: 'mixed-use', description: 'Major redevelopment of Warsaw\'s central station with offices and public space.' },
  { slug: 'krakow-nowa-huta', name: 'Nowa Huta Revival', cc: 'PL', city: 'Kraków', district: 'Nowa Huta', lat: 50.0694, lng: 20.0464, status: 'under-construction', type: 'mixed-use', description: 'Transforming the communist-era district into a modern mixed-use neighborhood.' },
  { slug: 'wroclaw-nowe-zerniki', name: 'Nowe Żerniki', cc: 'PL', city: 'Wrocław', district: 'Nowe Żerniki', lat: 51.1100, lng: 16.9600, priceFrom: 300000, priceCurrency: 'PLN', units: 5000, status: 'under-construction', type: 'mixed-use', description: 'Wrocław\'s new sustainable district with 5,000 homes on a former airfield.' },
  { slug: 'gdansk-motlawa', name: 'Motława Embankment', cc: 'PL', city: 'Gdańsk', district: 'Motława', lat: 54.3484, lng: 18.6534, priceFrom: 400000, priceCurrency: 'PLN', units: 1500, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Waterfront development on the Motława River with residential and commercial buildings.' },
  { slug: 'katowice-spodek', name: 'Katowice Spodek District', cc: 'PL', city: 'Katowice', district: 'Śródmieście', lat: 50.2649, lng: 19.0238, status: 'under-construction', type: 'mixed-use', description: 'Culture and business district around the iconic Spodek arena.' },

  // ═══════════════════════════════════════════════════════════════
  // SWEDEN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'hagastaden', name: 'Hagastaden', cc: 'SE', city: 'Stockholm', district: 'Hagastaden', lat: 59.3506, lng: 18.0309, priceFrom: 4000000, priceCurrency: 'SEK', units: 6000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Stockholm\'s largest urban development — a new science city connecting Solna and Stockholm.' },
  { slug: 'gothenburg-friggaleden', name: 'Friggaleden', cc: 'SE', city: 'Gothenburg', district: 'Friggaleden', lat: 57.7089, lng: 11.9745, priceFrom: 3000000, priceCurrency: 'SEK', units: 3000, status: 'under-construction', type: 'mixed-use', description: 'Major residential development near Gothenburg\'s new arena district.' },
  { slug: 'malmo-hollviken', name: 'Höllviken Centrum', cc: 'SE', city: 'Malmö', district: 'Höllviken', lat: 55.4500, lng: 12.9500, priceFrom: 2500000, priceCurrency: 'SEK', units: 1500, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Mixed-use development in southern Sweden with sustainable urban design.' },

  // ═══════════════════════════════════════════════════════════════
  // PORTUGAL
  // ═══════════════════════════════════════════════════════════════
  { slug: 'parque-das-nacoes', name: 'Parque das Nações', cc: 'PT', city: 'Lisbon', district: 'Parque das Nações', lat: 38.7681, lng: -9.0957, priceFrom: 300000, priceCurrency: 'EUR', units: 10000, yearCompleted: 2015, status: 'completed', type: 'mixed-use', description: 'Former Expo \'98 site transformed into Lisbon\'s most modern waterfront neighborhood.' },
  { slug: 'porto-ribeira', name: 'Ribeira Negra', cc: 'PT', city: 'Porto', district: 'Ribeira', lat: 41.1400, lng: -8.6300, status: 'under-construction', type: 'mixed-use', description: 'Cultural and residential regeneration of Porto\'s historic Ribeira waterfront.' },
  { slug: 'lisbon-beato', name: 'Beato Creative Hub', cc: 'PT', city: 'Lisbon', district: 'Beato', lat: 38.7280, lng: -9.1134, priceFrom: 350000, priceCurrency: 'EUR', units: 2000, status: 'under-construction', type: 'mixed-use', description: 'Transformation of the former military bakery into a creative and residential district.' },
  { slug: 'algarve-vilamoura', name: 'Vilamoura Marina', cc: 'PT', city: 'Faro', district: 'Vilamoura', lat: 37.0880, lng: -8.1170, priceFrom: 250000, priceCurrency: 'EUR', units: 3000, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Algarve\'s premier marina resort with luxury apartments, golf courses, and beach clubs.' },

  // ═══════════════════════════════════════════════════════════════
  // BRAZIL
  // ═══════════════════════════════════════════════════════════════
  { slug: 'faria-lima', name: 'Faria Lima Corridor', cc: 'BR', city: 'São Paulo', district: 'Itaim Bibi', lat: -23.5870, lng: -46.6820, pricePerSqm: 20000, units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'São Paulo\'s premier corporate corridor with luxury residences and Grade A offices.' },
  { slug: 'rio-para-so', name: 'Porto Maravilha', cc: 'BR', city: 'Rio de Janeiro', district: 'Porto', lat: -22.8900, lng: -43.1900, status: 'under-construction', type: 'mixed-use', description: 'Largest urban revitalization in Latin America — 5M sqm of waterfront redevelopment.' },
  { slug: 'curitiba-batel', name: 'Batel Renascença', cc: 'BR', city: 'Curitiba', district: 'Batel', lat: -25.4400, lng: -49.2900, priceFrom: 350000, priceCurrency: 'BRL', units: 800, yearCompleted: 2023, status: 'completed', type: 'apartment', description: 'Premium residential development in Curitiba\'s most upscale neighborhood.' },
  { slug: 'rio-vila-olimpica', name: 'Vila Olímpica Legacy', cc: 'BR', city: 'Rio de Janeiro', district: 'Barra da Tijuca', lat: -22.9730, lng: -43.3900, priceFrom: 300000, priceCurrency: 'BRL', units: 3000, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Olympic Village legacy project transformed into affordable housing.' },
  { slug: 'sao-paulo-agua-branca', name: 'Água Branca Park', cc: 'BR', city: 'São Paulo', district: 'Água Branca', lat: -23.5200, lng: -46.6900, priceFrom: 400000, priceCurrency: 'BRL', units: 1000, yearCompleted: 2023, status: 'completed', type: 'apartment', description: 'Residential development around São Paulo\'s largest urban park.' },
  { slug: 'brasilia-ponte', name: 'Ponte Estaiada', cc: 'BR', city: 'Brasília', district: 'Lago Norte', lat: -15.7900, lng: -47.8700, yearCompleted: 2016, status: 'completed', type: 'infra', description: 'Iconic cable-stayed bridge over Lake Paranoá, Brasília\'s newest landmark.' },

  // ═══════════════════════════════════════════════════════════════
  // MEXICO
  // ═══════════════════════════════════════════════════════════════
  { slug: 'nuevo-polanco', name: 'Nuevo Polanco', cc: 'MX', city: 'Mexico City', district: 'Polanco', lat: 19.4330, lng: -99.1980, priceFrom: 5000000, priceCurrency: 'MXN', units: 3000, yearCompleted: 2023, status: 'completed', type: 'mixed-use', description: 'Polanco\'s transformation with luxury residences, museums, and corporate offices.' },
  { slug: 'santa-fe', name: 'Santa Fe', cc: 'MX', city: 'Mexico City', district: 'Santa Fe', lat: 19.3600, lng: -99.2560, pricePerSqm: 40000, units: 10000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Mexico City\'s largest business district with 5M sqm of office space.' },
  { slug: 'cancun-hotel-zone', name: 'Cancún Hotel Zone', cc: 'MX', city: 'Cancún', district: 'Hotel Zone', lat: 21.1450, lng: -86.7860, priceFrom: 300000, priceCurrency: 'USD', units: 2000, yearCompleted: 2024, status: 'under-construction', type: 'hotel', description: 'Major resort development on Cancún\'s famous 14-mile hotel zone.' },
  { slug: 'san-pedro-garcia', name: 'San Pedro Garza García', cc: 'MX', city: 'Monterrey', district: 'San Pedro', lat: 25.6700, lng: -100.3300, priceFrom: 2000000, priceCurrency: 'MXN', units: 1500, yearCompleted: 2023, status: 'completed', type: 'apartment', description: 'Monterrey\'s most exclusive residential area with luxury towers and golf courses.' },
  { slug: 'guadalajara-andares', name: 'Andares', cc: 'MX', city: 'Guadalajara', district: 'Puerta de Hierro', lat: 20.7100, lng: -103.3900, priceFrom: 3000000, priceCurrency: 'MXN', units: 1000, yearCompleted: 2022, status: 'completed', type: 'apartment', description: 'Guadalajara\'s premier luxury residential and shopping district.' },

  // ═══════════════════════════════════════════════════════════════
  // SOUTH AFRICA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'waterfall-city', name: 'Waterfall City', cc: 'ZA', city: 'Johannesburg', district: 'Midrand', lat: -25.9900, lng: 28.0200, priceFrom: 1500000, priceCurrency: 'ZAR', units: 10000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Africa\'s largest mixed-use development — 2,000 hectares with Mall of Africa and corporate parks.' },
  { slug: 'cape-town-v-and-a', name: 'V&A Waterfront', cc: 'ZA', city: 'Cape Town', district: 'V&A Waterfront', lat: -33.9030, lng: 18.4220, priceFrom: 2000000, priceCurrency: 'ZAR', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Africa\'s most visited destination with luxury residences, hotels, and retail.' },
  { slug: 'sandton-city', name: 'Sandton City', cc: 'ZA', city: 'Johannesburg', district: 'Sandton', lat: -26.1080, lng: 28.0570, yearCompleted: 2019, status: 'completed', type: 'commercial', floors: 40, description: 'Africa\'s richest square mile — Grade A offices and premium retail in Sandton.' },
  { slug: 'durban-point', name: 'Durban Point Waterfront', cc: 'ZA', city: 'Durban', district: 'Point', lat: -29.8700, lng: 31.0200, priceFrom: 1000000, priceCurrency: 'ZAR', units: 2000, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', description: 'R5B waterfront regeneration with residential towers, hotel, and marina.' },
  { slug: 'nelson-mandela-bay', name: 'Nelson Mandela Bay Metro', cc: 'ZA', city: 'Port Elizabeth', district: 'Summerstrand', lat: -33.9600, lng: 25.6100, status: 'under-construction', type: 'mixed-use', description: 'Major waterfront development in South Africa\'s eighth-largest city.' },

  // ═══════════════════════════════════════════════════════════════
  // THAILAND
  // ═══════════════════════════════════════════════════════════════
  { slug: 'king-power-mahanakhon', name: 'King Power Mahanakhon', cc: 'TH', city: 'Bangkok', district: 'Silom', lat: 13.7234, lng: 100.5345, priceFrom: 15000000, priceCurrency: 'THB', units: 200, yearCompleted: 2016, status: 'completed', type: 'apartment', floors: 78, description: 'Bangkok\'s pixelated skyscraper at 314m with rooftop observation deck.' },
  { slug: 'one-bangkok', name: 'One Bangkok', cc: 'TH', city: 'Bangkok', district: 'Pathum Wan', lat: 13.7330, lng: 100.5430, priceFrom: 20000000, priceCurrency: 'THB', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 92, description: 'Thailand\'s largest integrated development — 1.8M sqm with offices, hotel, retail, and residences.' },
  { slug: 'iconsiam', name: 'Iconsiam', cc: 'TH', city: 'Bangkok', district: 'Bangkok Noi', lat: 13.7270, lng: 100.5090, yearCompleted: 2018, status: 'completed', type: 'mixed-use', floors: 7, description: 'Thailand\'s most luxurious riverside shopping and lifestyle destination.' },
  { slug: 'bangkok-sukhumvit', name: 'Sukhumvit Line Extension', cc: 'TH', city: 'Bangkok', district: 'Sukhumvit', lat: 13.7310, lng: 100.5700, status: 'under-construction', type: 'infra', description: 'Major BTS extension connecting Bangkok\'s eastern suburbs.' },
  { slug: 'phuket-andara', name: 'Andara Resort & Villas', cc: 'TH', city: 'Phuket', district: 'Kamala', lat: 7.9570, lng: 98.2950, priceFrom: 15000000, priceCurrency: 'THB', units: 200, yearCompleted: 2020, status: 'completed', type: 'villa', description: 'Luxury hillside resort overlooking Kamala Bay with private pool villas.' },

  // ═══════════════════════════════════════════════════════════════
  // HONG KONG
  // ═══════════════════════════════════════════════════════════════
  { slug: 'icc-hk', name: 'International Commerce Centre', cc: 'HK', city: 'Hong Kong', district: 'West Kowloon', lat: 22.3032, lng: 114.1601, yearCompleted: 2010, status: 'completed', type: 'commercial', floors: 118, description: 'Hong Kong\'s tallest building at 484m housing the Ritz-Carlton hotel.' },
  { slug: 'victoria-dockside', name: 'Victoria Dockside', cc: 'HK', city: 'Hong Kong', district: 'Tsim Sha Tsui', lat: 22.2950, lng: 114.1750, priceFrom: 30000000, priceCurrency: 'HKD', units: 321, yearCompleted: 2019, status: 'completed', type: 'apartment', floors: 65, description: 'Cultural and commercial hub on the Tsim Sha Tsui waterfront.' },
  { slug: 'west-kowloon', name: 'West Kowloon Cultural District', cc: 'HK', city: 'Hong Kong', district: 'West Kowloon', lat: 22.3040, lng: 114.1600, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major cultural development with M+ museum, Xiqu Centre, and public park.' },
  { slug: 'kowloon-east', name: 'Kowloon East Business District', cc: 'HK', city: 'Hong Kong', district: 'Kowloon Bay', lat: 22.3130, lng: 114.2100, status: 'under-construction', type: 'commercial', description: 'Transformation of former industrial area into Hong Kong\'s second CBD.' },

  // ═══════════════════════════════════════════════════════════════
  // CANADA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'concord-cityplace', name: 'Concord CityPlace', cc: 'CA', city: 'Toronto', district: 'CityPlace', lat: 43.6420, lng: -79.3890, priceFrom: 500000, priceCurrency: 'CAD', units: 10000, yearCompleted: 2025, status: 'under-construction', type: 'apartment', floors: 80, description: 'Canada\'s largest urban community with 80 towers and 10,000 residences.' },
  { slug: 'olympic-village-van', name: 'Olympic Village', cc: 'CA', city: 'Vancouver', district: 'Mount Pleasant', lat: 49.2764, lng: -123.1060, priceFrom: 800000, priceCurrency: 'CAD', units: 1600, yearCompleted: 2010, status: 'completed', type: 'apartment', description: '2010 Winter Olympics athlete\'s village converted to sustainable mixed-use neighborhood.' },
  { slug: 'sugar-wharf', name: 'Sugar Wharf', cc: 'CA', city: 'Toronto', district: 'Waterfront', lat: 43.6420, lng: -79.3740, priceFrom: 600000, priceCurrency: 'CAD', units: 8000, yearCompleted: 2028, status: 'under-construction', type: 'mixed-use', floors: 70, description: 'Canada\'s largest waterfront development with 8,000 homes and a new park.' },
  { slug: 'griffintown', name: 'Griffintown', cc: 'CA', city: 'Montreal', district: 'Griffintown', lat: 45.4860, lng: -73.5540, priceFrom: 300000, priceCurrency: 'CAD', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Montreal\'s fastest-growing neighborhood with 5,000 new residences.' },
  { slug: 'georgian-van', name: 'Georgian', cc: 'CA', city: 'Vancouver', district: 'Downtown', lat: 49.2827, lng: -123.1216, priceFrom: 600000, priceCurrency: 'CAD', units: 400, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 36, description: 'Luxury residential tower in the heart of downtown Vancouver.' },

  // ═══════════════════════════════════════════════════════════════
  // EGYPT
  // ═══════════════════════════════════════════════════════════════
  { slug: 'new-admin-capital', name: 'New Administrative Capital', cc: 'EG', city: 'Cairo', district: 'New Capital', lat: 29.9700, lng: 31.7700, status: 'under-construction', type: 'mixed-use', floors: 385, description: 'Egypt\'s new capital city 45km east of Cairo with Africa\'s tallest building (Iconic Tower).' },
  { slug: 'new-alamein', name: 'New Alamein', cc: 'EG', city: 'Cairo', district: 'Alamein', lat: 30.8400, lng: 28.9500, status: 'under-construction', type: 'mixed-use', description: 'Major coastal city development on the Mediterranean with towers and resorts.' },

  // ═══════════════════════════════════════════════════════════════
  // NIGERIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'eko-atlantic', name: 'Eko Atlantic', cc: 'NG', city: 'Lagos', district: 'Victoria Island', lat: 6.4100, lng: 3.3900, priceFrom: 200000, priceCurrency: 'USD', units: 5000, yearCompleted: 2030, status: 'under-construction', type: 'mixed-use', description: 'Africa\'s most ambitious project — a new city built on reclaimed land off Lagos Island.' },

  // ═══════════════════════════════════════════════════════════════
  // KENYA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'konza-technopolis', name: 'Konza Technopolis', cc: 'KE', city: 'Nairobi', district: 'Konza', lat: -1.7500, lng: 37.1200, status: 'under-construction', type: 'mixed-use', description: 'Kenya\'s Vision 2030 flagship project — a technology city 60km from Nairobi.' },
  { slug: 'nairobi-westlands', name: 'Westlands', cc: 'KE', city: 'Nairobi', district: 'Westlands', lat: -1.2670, lng: 36.8020, priceFrom: 80000, priceCurrency: 'USD', units: 2000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Nairobi\'s premier business and residential district with Grade A offices.' },

  // ═══════════════════════════════════════════════════════════════
  // VIETNAM
  // ═══════════════════════════════════════════════════════════════
  { slug: 'landmark-81', name: 'Landmark 81', cc: 'VN', city: 'Ho Chi Minh City', district: 'Bình Thạnh', lat: 10.7912, lng: 106.7210, priceFrom: 5000000000, priceCurrency: 'VND', units: 4000, yearCompleted: 2018, status: 'completed', type: 'mixed-use', floors: 81, description: 'Vietnam\'s tallest building at 461m with Vincom retail, hotel, and luxury residences.' },
  { slug: 'thu-thiem', name: 'Thủ Thiêm New Urban Area', cc: 'VN', city: 'Ho Chi Minh City', district: 'Thủ Thiêm', lat: 10.7700, lng: 106.7400, status: 'under-construction', type: 'mixed-use', description: 'Ho Chi Minh City\'s new financial district across the Saigon River.' },
  { slug: 'hanoi-west-lake', name: 'Tây Hồ', cc: 'VN', city: 'Hanoi', district: 'Tây Hồ', lat: 21.0700, lng: 105.8100, priceFrom: 2000000000, priceCurrency: 'VND', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Hanoi\'s most prestigious lakeside neighborhood with luxury apartments.' },

  // ═══════════════════════════════════════════════════════════════
  // PHILIPPINES
  // ═══════════════════════════════════════════════════════════════
  { slug: 'manila-bay-reclamation', name: 'Manila Bay New City', cc: 'PH', city: 'Manila', district: 'Paranaque', lat: 14.5000, lng: 120.9800, priceFrom: 3000000, priceCurrency: 'PHP', units: 5000, status: 'under-construction', type: 'mixed-use', description: 'Major reclaimed land development along Manila Bay with residential and commercial towers.' },
  { slug: 'new-clark-city', name: 'New Clark City', cc: 'PH', city: 'Manila', district: 'Clark', lat: 15.1800, lng: 120.5800, status: 'under-construction', type: 'mixed-use', description: 'Philippines\' new government center and smart city on 9,450 hectares.' },

  // ═══════════════════════════════════════════════════════════════
  // INDONESIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'kota-tua-revival', name: 'Kota Tua Revival', cc: 'ID', city: 'Jakarta', district: 'Kota Tua', lat: -6.1400, lng: 106.8200, status: 'under-construction', type: 'mixed-use', description: 'Regeneration of Jakarta\'s historic old town with museums, galleries, and residences.' },
  { slug: 'nusantara', name: 'Nusantara (New Capital)', cc: 'ID', city: 'Jakarta', district: 'East Kalimantan', lat: -0.5000, lng: 116.1000, status: 'under-construction', type: 'mixed-use', description: 'Indonesia\'s new capital city in East Kalimantan, planned to replace Jakarta.' },
  { slug: 'bsd-city', name: 'BSD City', cc: 'ID', city: 'Jakarta', district: 'Tangerang', lat: -6.3000, lng: 106.6500, priceFrom: 500000000, priceCurrency: 'IDR', units: 20000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Jakarta\'s largest planned city with 20,000 homes and industrial zones.' },

  // ═══════════════════════════════════════════════════════════════
  // MALAYSIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'merdeka-118', name: 'Merdeka 118', cc: 'MY', city: 'Kuala Lumpur', district: 'Bukit Bintang', lat: 3.1430, lng: 101.7100, yearCompleted: 2023, status: 'completed', type: 'mixed-use', floors: 118, description: 'Malaysia\'s tallest building at 678.9m, the second-tallest in the world.' },
  { slug: 'tun-razak-exchange', name: 'Tun Razak Exchange', cc: 'MY', city: 'Kuala Lumpur', district: 'TRX', lat: 3.1540, lng: 101.7200, priceFrom: 800000, priceCurrency: 'MYR', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 80, description: 'Kuala Lumpur\'s new financial district with the Exchange 106 tower.' },
  { slug: 'penang-south-islands', name: 'Penang South Islands', cc: 'MY', city: 'Penang', district: 'Bayan Lepas', lat: 5.2800, lng: 100.2700, status: 'under-construction', type: 'mixed-use', description: 'Major island reclamation project off Penang\'s southern coast.' },

  // ═══════════════════════════════════════════════════════════════
  // COLOMBIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'torre-bavaria', name: 'Torre Bavaria', cc: 'CO', city: 'Bogotá', district: 'Chicó Norte', lat: 4.6730, lng: -74.0500, yearCompleted: 2018, status: 'completed', type: 'commercial', floors: 38, description: 'Bogotá\'s tallest building, a landmark of Colombian modern architecture.' },
  { slug: 'medellin-lleras', name: 'Parque Lleras', cc: 'CO', city: 'Medellín', district: 'El Poblado', lat: 6.2070, lng: -75.5730, priceFrom: 200000, priceCurrency: 'USD', units: 3000, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', description: 'Medellín\'s entertainment and residential hub in the upscale El Poblado district.' },

  // ═══════════════════════════════════════════════════════════════
  // ARGENTINA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'puerto-madero', name: 'Puerto Madero', cc: 'AR', city: 'Buenos Aires', district: 'Puerto Madero', lat: -34.6100, lng: -58.3600, priceFrom: 300000, priceCurrency: 'USD', units: 10000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Waterfront regeneration with luxury condos, restaurants, and the Puente de la Mujer bridge.' },
  { slug: 'nuevo-puerto', name: 'Nuevo Puerto', cc: 'AR', city: 'Buenos Aires', district: 'La Boca', lat: -34.6200, lng: -58.3500, status: 'under-construction', type: 'mixed-use', description: 'Extension of Puerto Madero regeneration into La Boca neighborhood.' },

  // ═══════════════════════════════════════════════════════════════
  // RUSSIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'moscow-city', name: 'Moscow City', cc: 'RU', city: 'Moscow', district: 'Presnensky', lat: 55.7470, lng: 37.5360, pricePerSqm: 500000, units: 20000, yearCompleted: 2024, status: 'under-construction', type: 'mixed-use', floors: 97, description: 'Moscow\'s new business district with towers exceeding 300m including Federation Tower.' },
  { slug: 'lakhta-center', name: 'Lakhta Center', cc: 'RU', city: 'St. Petersburg', district: 'Lakhta', lat: 59.9970, lng: 30.2150, yearCompleted: 2019, status: 'completed', type: 'commercial', floors: 87, description: 'Europe\'s tallest building at 462m, Gazprom\'s new headquarters on the Gulf of Finland.' },
  { slug: 'olympic-sochi', name: 'Sochi Olympic Park', cc: 'RU', city: 'Sochi', district: 'Adler', lat: 43.4000, lng: 39.9500, priceFrom: 5000000, priceCurrency: 'RUB', units: 10000, yearCompleted: 2014, status: 'completed', type: 'mixed-use', description: '2014 Winter Olympics legacy with hotels, stadium, and residential developments.' },

  // ═══════════════════════════════════════════════════════════════
  // GREECE
  // ═══════════════════════════════════════════════════════════════
  { slug: 'ellinikon', name: 'Ellinikon', cc: 'GR', city: 'Athens', district: 'Elliniko', lat: 37.8800, lng: 23.7300, priceFrom: 250000, priceCurrency: 'EUR', units: 10000, status: 'under-construction', type: 'mixed-use', floors: 200, description: 'Europe\'s largest urban regeneration — former airport transforming into a €8B mixed-use metropolis.' },
  { slug: 'flisvos-marina', name: 'Flisvos Marina', cc: 'GR', city: 'Athens', district: 'Paleo Faliro', lat: 37.9400, lng: 23.6900, priceFrom: 500000, priceCurrency: 'EUR', units: 1500, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Marina expansion with luxury residences, yacht club, and commercial spaces.' },

  // ═══════════════════════════════════════════════════════════════
  // IRELAND
  // ═══════════════════════════════════════════════════════════════
  { slug: 'dublin-docklands', name: 'Dublin Docklands', cc: 'IE', city: 'Dublin', district: 'Docklands', lat: 53.3470, lng: -6.2280, priceFrom: 400000, priceCurrency: 'EUR', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major tech hub regeneration with Google, Facebook, and Amazon offices.' },
  { slug: 'grand-canal-square', name: 'Grand Canal Square', cc: 'IE', city: 'Dublin', district: 'Grand Canal', lat: 53.3380, lng: -6.2310, yearCompleted: 2018, status: 'completed', type: 'mixed-use', description: 'Modern waterfront square with Daniel Libeskind\'s Bord Gáis Theatre.' },

  // ═══════════════════════════════════════════════════════════════
  // CZECH REPUBLIC
  // ═══════════════════════════════════════════════════════════════
  { slug: 'smichov-city', name: 'Smíchov City', cc: 'CZ', city: 'Prague', district: 'Smíchov', lat: 50.0730, lng: 14.4050, priceFrom: 3000000, priceCurrency: 'CZK', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Prague\'s largest urban development — a new neighborhood on the Vltava River.' },
  { slug: 'vysoka-tower', name: 'Vysoká', cc: 'CZ', city: 'Prague', district: 'Jinonice', lat: 50.0580, lng: 14.3890, priceFrom: 10000000, priceCurrency: 'CZK', units: 120, yearCompleted: 2023, status: 'completed', type: 'apartment', floors: 25, description: 'Prague\'s tallest residential building with panoramic views of the city.' },

  // ═══════════════════════════════════════════════════════════════
  // HUNGARY
  // ═══════════════════════════════════════════════════════════════
  { slug: 'liget-budapest', name: 'Liget Budapest', cc: 'HU', city: 'Budapest', district: 'District XIV', lat: 47.5100, lng: 19.0840, status: 'under-construction', type: 'mixed-use', description: 'Major cultural quarter development in City Park with museums and public spaces.' },
  { slug: 'raday-revival', name: 'Ráday utca Revival', cc: 'HU', city: 'Budapest', district: 'Ferencváros', lat: 47.4870, lng: 19.0700, priceFrom: 200000000, priceCurrency: 'HUF', units: 2000, yearCompleted: 2024, status: 'completed', type: 'mixed-use', description: 'Revitalization of Budapest\'s cultural quarter with housing and restaurants.' },

  // ═══════════════════════════════════════════════════════════════
  // ROMANIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'bucharest-floreasca', name: 'Floreasca District', cc: 'RO', city: 'Bucharest', district: 'Floreasca', lat: 44.4500, lng: 26.1000, priceFrom: 100000, priceCurrency: 'EUR', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major mixed-use development in Bucharest\'s premium Floreasca district.' },
  { slug: 'cluj-center', name: 'Piata Muzeului', cc: 'RO', city: 'Cluj-Napoca', district: 'Center', lat: 46.7710, lng: 23.5890, priceFrom: 150000, priceCurrency: 'EUR', units: 1000, yearCompleted: 2023, status: 'completed', type: 'apartment', description: 'Historic center renewal with luxury apartments in Transylvania\'s tech capital.' },

  // ═══════════════════════════════════════════════════════════════
  // BULGARIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'sofia-lozenets', name: 'Lozenets Premium', cc: 'BG', city: 'Sofia', district: 'Lozenets', lat: 42.6750, lng: 23.3100, priceFrom: 100000, priceCurrency: 'EUR', units: 2000, yearCompleted: 2024, status: 'under-construction', type: 'apartment', description: 'Premium residential development in Sofia\'s most upscale neighborhood.' },

  // ═══════════════════════════════════════════════════════════════
  // CHILE
  // ═══════════════════════════════════════════════════════════════
  { slug: 'costanera-center', name: 'Costanera Center', cc: 'CL', city: 'Santiago', district: 'Providencia', lat: -33.4170, lng: -70.6020, yearCompleted: 2012, status: 'completed', type: 'mixed-use', floors: 64, description: 'South America\'s tallest building at 300m with shopping mall, offices, and observation deck.' },
  { slug: 'nueva-costanera', name: 'Nueva Costanera', cc: 'CL', city: 'Santiago', district: 'Vitacura', lat: -33.3900, lng: -70.5700, priceFrom: 200000, priceCurrency: 'USD', units: 1500, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Premium residential corridor along the Mapocho River in Vitacura.' },

  // ═══════════════════════════════════════════════════════════════
  // PERU
  // ═══════════════════════════════════════════════════════════════
  { slug: 'costa-verde-lima', name: 'Costa Verde', cc: 'PE', city: 'Lima', district: 'Miraflores', lat: -12.1200, lng: -77.0300, priceFrom: 150000, priceCurrency: 'USD', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'apartment', description: 'Cliffside residential development along Lima\'s famous Costa Verde highway.' },

  // ═══════════════════════════════════════════════════════════════
  // NEW ZEALAND
  // ═══════════════════════════════════════════════════════════════
  { slug: 'viaduct-harbour', name: 'Viaduct Harbour', cc: 'NZ', city: 'Auckland', district: 'Wynyard Quarter', lat: -36.8440, lng: 174.7580, priceFrom: 500000, priceCurrency: 'NZD', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Auckland\'s waterfront transformation with apartments, offices, and marine activities.' },
  { slug: 'shed-21-wellington', name: 'Shed 21', cc: 'NZ', city: 'Wellington', district: 'Aotea Quay', lat: -41.2780, lng: 174.7760, status: 'under-construction', type: 'mixed-use', description: 'Heritage warehouse conversion into apartments and commercial space on Wellington waterfront.' },

  // ═══════════════════════════════════════════════════════════════
  // QATAR
  // ═══════════════════════════════════════════════════════════════
  { slug: 'lusail-city', name: 'Lusail City', cc: 'QA', city: 'Doha', district: 'Lusail', lat: 25.4200, lng: 51.4900, priceFrom: 700000, priceCurrency: 'QAR', units: 20000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 50, description: 'Qatar\'s planned new city — 38 km² with 200,000 residents, hosted 2022 World Cup final.' },
  { slug: 'pearl-qatar', name: 'The Pearl-Qatar', cc: 'QA', city: 'Doha', district: 'The Pearl', lat: 25.3600, lng: 51.5600, priceFrom: 1000000, priceCurrency: 'QAR', units: 15000, yearCompleted: 2018, status: 'completed', type: 'mixed-use', description: 'Artificial island with Mediterranean-style waterfront apartments and a luxury marina.' },

  // ═══════════════════════════════════════════════════════════════
  // BAHRAIN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'bahrain-bay', name: 'Bahrain Bay', cc: 'BH', city: 'Manama', district: 'Bahrain Bay', lat: 26.2350, lng: 50.5800, yearCompleted: 2022, status: 'completed', type: 'mixed-use', floors: 50, description: 'Man-made island development with the Four Seasons Hotel and residential towers.' },
  { slug: 'amwaj-islands', name: 'Amwaj Islands', cc: 'BH', city: 'Manama', district: 'Amwaj', lat: 26.2600, lng: 50.6300, priceFrom: 100000, priceCurrency: 'BHD', units: 5000, yearCompleted: 2020, status: 'completed', type: 'mixed-use', description: 'Group of man-made islands with lagoons, marinas, and waterfront residences.' },

  // ═══════════════════════════════════════════════════════════════
  // OMAN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'al-mouj-muscat', name: 'Al Mouj Marina', cc: 'OM', city: 'Muscat', district: 'Al Mouj', lat: 23.6000, lng: 58.5400, priceFrom: 80000, priceCurrency: 'OMR', units: 3000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Premium waterfront development along Muscat\'s coast with apartments and retail.' },

  // ═══════════════════════════════════════════════════════════════
  // JORDAN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'the-abdali', name: 'The Abdali', cc: 'JO', city: 'Amman', district: 'Abdali', lat: 31.9550, lng: 35.9150, priceFrom: 100000, priceCurrency: 'JOD', units: 3000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 40, description: 'Amman\'s new downtown — a mixed-use development with offices, residences, and a boulevard.' },

  // ═══════════════════════════════════════════════════════════════
  // MOROCCO
  // ═══════════════════════════════════════════════════════════════
  { slug: 'casablanca-marina', name: 'Casablanca Marina', cc: 'MA', city: 'Casablanca', district: 'Marina', lat: 33.5900, lng: -7.6200, priceFrom: 100000, priceCurrency: 'MAD', units: 5000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', description: 'Major waterfront development with residential towers, hotels, and a marina.' },

  // ═══════════════════════════════════════════════════════════════
  // TUNISIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'carthage-thalassa', name: 'Carthage Thalassa', cc: 'TN', city: 'Tunis', district: 'Carthage', lat: 36.8500, lng: 10.3200, priceFrom: 80000, priceCurrency: 'TND', units: 2000, yearCompleted: 2024, status: 'completed', type: 'apartment', description: 'Luxury coastal development near ancient Carthage with Mediterranean views.' },

  // ═══════════════════════════════════════════════════════════════
  // UZBEKISTAN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'tashkent-city', name: 'Tashkent City', cc: 'UZ', city: 'Tashkent', district: 'Center', lat: 41.3000, lng: 69.2800, priceFrom: 50000, priceCurrency: 'USD', units: 10000, yearCompleted: 2025, status: 'under-construction', type: 'mixed-use', floors: 30, description: 'New city center development with offices, residences, and public spaces.' },

  // ═══════════════════════════════════════════════════════════════
  // KAZAKHSTAN
  // ═══════════════════════════════════════════════════════════════
  { slug: 'nurly-zhol', name: 'Nurly Zhol', cc: 'KZ', city: 'Astana', district: 'Nurly Zhol', lat: 51.1300, lng: 71.4100, status: 'under-construction', type: 'mixed-use', floors: 88, description: 'Kazakhstan\'s new capital development with the Bayterek Tower and government buildings.' },
  { slug: 'almaty-ibd', name: 'Almaty IBD', cc: 'KZ', city: 'Almaty', district: 'IBD', lat: 43.2400, lng: 76.9300, priceFrom: 100000, priceCurrency: 'USD', units: 5000, status: 'under-construction', type: 'mixed-use', description: 'Almaty\'s new international business district with office towers and residences.' },

  // ═══════════════════════════════════════════════════════════════
  // GEORGIA
  // ═══════════════════════════════════════════════════════════════
  { slug: 'axis-towers', name: 'Axis Towers', cc: 'GE', city: 'Tbilisi', district: 'Vake', lat: 41.7160, lng: 44.7830, priceFrom: 100000, priceCurrency: 'USD', units: 200, yearCompleted: 2020, status: 'completed', type: 'apartment', floors: 38, description: 'Tbilisi\'s most iconic premium twin towers on Chavchavadze Avenue.' },
  { slug: 'king-david-residences', name: 'King David Residences', cc: 'GE', city: 'Tbilisi', district: 'Mtatsminda', lat: 41.7020, lng: 44.7940, priceFrom: 150000, priceCurrency: 'USD', units: 100, yearCompleted: 2022, status: 'completed', type: 'apartment', floors: 25, description: 'Ultra-luxury residences on Mtatsminda with panoramic Old Tbilisi views.' },
  { slug: 'bamboo-tower', name: 'Bamboo Tower', cc: 'GE', city: 'Tbilisi', district: 'Mtatsminda', lat: 41.7080, lng: 44.7880, priceFrom: 80000, priceCurrency: 'USD', units: 150, yearCompleted: 2023, status: 'completed', type: 'apartment', floors: 20, description: 'Sustainable bamboo-wrapped tower near Mtatsminda Park.' },
  { slug: 'm2-highlight', name: 'm² Highlight', cc: 'GE', city: 'Tbilisi', district: 'Digomi', lat: 41.7450, lng: 44.7300, priceFrom: 40000, priceCurrency: 'USD', units: 500, yearCompleted: 2024, status: 'completed', type: 'apartment', floors: 15, description: 'Affordable modern housing in Digomi with energy-efficient design.' },
  { slug: 'alliance-residence-batumi', name: 'Alliance Residence', cc: 'GE', city: 'Batumi', district: 'New Boulevard', lat: 41.6300, lng: 41.6360, priceFrom: 30000, priceCurrency: 'USD', units: 300, yearCompleted: 2023, status: 'completed', type: 'apartment', floors: 28, description: 'Premium seafront apartments on Batumi\'s New Boulevard with resort amenities.' },
  { slug: 'orbi-palace', name: 'ORBI Palace', cc: 'GE', city: 'Batumi', district: 'Old Boulevard', lat: 41.6480, lng: 41.6340, priceFrom: 25000, priceCurrency: 'USD', units: 500, yearCompleted: 2019, status: 'completed', type: 'hotel', floors: 40, description: 'Batumi\'s largest hotel-residential complex on the first sea line.' },
  { slug: 'metropol-ortachala', name: 'Metropol Ortachala', cc: 'GE', city: 'Tbilisi', district: 'Ortachala', lat: 41.6900, lng: 44.7700, priceFrom: 60000, priceCurrency: 'USD', units: 800, yearCompleted: 2025, status: 'under-construction', type: 'apartment', floors: 30, description: 'Premium residential complex near the Mtkvari River with 6 active projects.' },
  { slug: 'barcelo-residences', name: 'Barceló Residences Tbilisi', cc: 'GE', city: 'Tbilisi', district: 'Chugureti', lat: 41.7200, lng: 44.7700, priceFrom: 80000, priceCurrency: 'USD', units: 200, yearCompleted: 2025, status: 'under-construction', type: 'apartment', floors: 22, description: 'Branded residences with Barceló hotel management in central Tbilisi.' },
]
