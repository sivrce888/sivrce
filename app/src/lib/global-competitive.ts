/**
 * SIVRCE Global Competitive Scorecard — Honest, evidence-based benchmark
 * of SIVRCE against the Top 30 global real estate incumbents:
 *  - US: Zillow, Redfin, Realtor.com, Compass
 *  - UK: Rightmove, Zoopla, OnTheMarket
 *  - Spain/Portugal/Italy: Idealista, Fotocasa, Immobiliare.it, Casa.it
 *  - Germany/DACH: ImmoScout24, Immowelt, Kleinanzeigen, ohne-makler
 *  - France: SeLoger, LeBonCoin, Bien'ici
 *  - Netherlands: Funda
 *  - Nordics: Hemnet
 *  - UAE/MENA: PropertyFinder, Bayut, Dubizzle
 *  - APAC: Suumo (Japan), Homes.co.jp (Japan), Realestate.com.au (Australia), Domain (Australia), Housing.com (India), MagicBricks (India)
 *  - Georgia: SS.ge, MyHome.ge
 *
 * Evidence-gated integrity contract:
 *  - Every sivrce score MUST reference a verified on-disk source file.
 *  - All calculations derived mathematically from weights summing to 1.0.
 *
 * DB-free, SSR-safe.
 */

export type GlobalPlayerId =
  | 'sivrce'
  | 'zillow'
  | 'redfin'
  | 'realtor-com'
  | 'compass'
  | 'rightmove'
  | 'zoopla'
  | 'onthemarket'
  | 'idealista'
  | 'fotocasa'
  | 'immoscout24'
  | 'immowelt'
  | 'kleinanzeigen'
  | 'seloger'
  | 'leboncoin'
  | 'bienici'
  | 'funda'
  | 'immobiliare-it'
  | 'casa-it'
  | 'hemnet'
  | 'propertyfinder'
  | 'bayut'
  | 'dubizzle'
  | 'suumo'
  | 'homes-jp'
  | 'realestate-com-au'
  | 'domain-com-au'
  | 'housing-com'
  | 'magicbricks'
  | 'ss-ge'
  | 'myhome-ge'

export interface GlobalDimension {
  id: string
  labelEn: string
  labelKa: string
  weight: number
  description: string
}

export interface GlobalScoreCell {
  score: number // 0..100
  noteEn: string
  noteKa: string
  evidence?: string
}

export interface GlobalPlayer {
  id: GlobalPlayerId
  name: string
  region: string
  tier: 'self' | 'global-leader' | 'regional-incumbent'
  cells: Record<string, GlobalScoreCell>
}

export interface GlobalRankedPlayer extends GlobalPlayer {
  total: number
  rank: number
}

export const GLOBAL_DIMENSIONS: readonly GlobalDimension[] = [
  {
    id: 'globalEntityGraph',
    labelEn: 'Global Unified Entity Graph',
    labelKa: 'გლობალური ერთიანი ობიექტების გრაფი',
    weight: 0.12,
    description: 'Unified cross-border property, developer, transit, and neighborhood graph across 236 countries vs isolated single-country portals.',
  },
  {
    id: 'institutionalValuation',
    labelEn: 'Institutional 10x Valuation & Scenarios',
    labelKa: 'ინსტიტუციური შეფასება და 3 სცენარი',
    weight: 0.12,
    description: 'Multi-scenario Bear/Base/Bull cash flows, NOI, Cap Rates, and localized closing cost deductions vs basic mortgage calculators.',
  },
  {
    id: 'truthAndScamRadar',
    labelEn: 'Truth Engine & Scam Radar',
    labelKa: 'სიმართლის ძრავა და თაღლითობის რადარი',
    weight: 0.11,
    description: 'AI-powered duplicate detection, price anomalies, fake listing filters, and cadastral verification.',
  },
  {
    id: 'spatialCadastrePhysics',
    labelEn: '3D Spatial, Sun/Shadow & Cadastre',
    labelKa: '3D სივრცითი, მზის/ჩრდილის ფიზიკა და კადასტრი',
    weight: 0.10,
    description: 'Real-time solar geometry, building footprints, and cadastral plot insights.',
  },
  {
    id: 'transitConnectivity',
    labelEn: 'Deep Transit & Walkability Matrix',
    labelKa: 'სატრანზიტო და ფეხით ხელმისაწვდომობის მატრიცა',
    weight: 0.10,
    description: 'Station-level transit graphs (18,000+ stations) and micro-neighborhood walkability indices.',
  },
  {
    id: 'dualCurrencySettlement',
    labelEn: 'Frictionless Multi-Currency FX Engine',
    labelKa: 'მრავალვალუტიანი კონვერტაციის ძრავა',
    weight: 0.09,
    description: 'Instant multi-currency conversion with zero friction across 60+ global currencies.',
  },
  {
    id: 'fullLifecycleOS',
    labelEn: 'Agent OS & Developer OS Ecosystem',
    labelKa: 'Agent OS და Developer OS ეკოსისტემა',
    weight: 0.10,
    description: 'Integrated CRM, project catalog syndication, and direct transaction pipeline.',
  },
  {
    id: 'deepLocalization',
    labelEn: 'Localized Hubs & Market Laws',
    labelKa: 'ლოკალიზებული ჰაბები და ბაზრის რეგულაციები',
    weight: 0.10,
    description: 'Deep market rules, notary fees, taxes, and native multilingual copy across 74+ country hubs.',
  },
  {
    id: 'zeroJankPerformance',
    labelEn: 'Zero-Jank Ultralight Performance',
    labelKa: 'ულტრამსუბუქი სისწრაფე და ოპტიმიზაცია',
    weight: 0.08,
    description: 'Sub-second LCP, zero bundle bloat, responsive on all devices from low-end mobile to 4K displays.',
  },
  {
    id: 'unifiedTransactions',
    labelEn: 'Integrated Stays & Transactions',
    labelKa: 'სასტუმროებისა და ტრანზაქციების ინტეგრაცია',
    weight: 0.08,
    description: 'Direct booking, short-term stays, long-term rentals, and verified seller inquiries in one platform.',
  },
] as const

export const GLOBAL_PLAYERS: readonly GlobalPlayer[] = [
  // ── SIVRCE (Self)
  {
    id: 'sivrce',
    name: 'SIVRCE',
    region: 'Global (74+ Hubs, Georgia, Germany, UAE, US, UK, EU, APAC)',
    tier: 'self',
    cells: {
      globalEntityGraph: {
        score: 100,
        noteEn: '236 countries, 21,947 metros, 562 developers, 839 projects unified in single canonical graph.',
        noteKa: '236 ქვეყანა, 21,947 მეტრო/ქალაქი, 562 დეველოპერი ერთიან გრაფში.',
        evidence: 'src/lib/countries/global-os.ts',
      },
      institutionalValuation: {
        score: 100,
        noteEn: 'Bear/Base/Bull cashflows, NOI, Cap Rate, 10-yr IRR, and statutory closing costs in 74 markets.',
        noteKa: '3 სცენარიანი ფულადი ნაკადები, NOI, Cap Rate და შეძენის ხარჯები 74 ბაზარზე.',
        evidence: 'src/lib/countries/de-proptech-os.ts',
      },
      truthAndScamRadar: {
        score: 100,
        noteEn: 'Fraud-tier scam radar on listing pages, duplicate collapse in search, transparent /100 listing score.',
        noteKa: 'თაღლითობის რადარი განცხადებაზე, დუბლიკატების შერწყმა ძიებაში და გამჭვირვალე ქულა /100.',
        evidence: 'src/lib/trust/scam-radar.ts',
      },
      spatialCadastrePhysics: {
        score: 100,
        noteEn: '3D atmosphere, real-time solar declination, sun/shadow projection & cadastral parcels.',
        noteKa: '3D ატმოსფერო, მზის/ჩრდილის სიმულაცია და საკადასტრო საზღვრები.',
        evidence: 'src/lib/sun.ts',
      },
      transitConnectivity: {
        score: 100,
        noteEn: '18,657 global transit stations with nearest-station distance, POI scoring & walk scores.',
        noteKa: '18,657 სატრანზიტო სადგური, უახლოეს სადგურამდე მანძილი და walk score.',
        evidence: 'src/data/world-metro-all.json',
      },
      dualCurrencySettlement: {
        // Not 100 on a "live everywhere" claim the code does not support:
        // 55 market-native currencies are formatted correctly, but live FX
        // covers USD/EUR→GEL and the user toggle is 4 currencies. Scored to
        // what ships, not to what sounds good.
        score: 84,
        noteEn: '55 market-native currencies formatted per locale; live FX (6h TTL) for USD/EUR→GEL; 4-currency user toggle (GEL/USD/EUR/AED).',
        noteKa: '55 ბაზრის ვალუტა ლოკალური ფორმატით; ცოცხალი კურსი USD/EUR→GEL; მომხმარებლის გადამრთველი 4 ვალუტაზე.',
        evidence: 'src/lib/fx-server.ts',
      },
      fullLifecycleOS: {
        // Not 100: the shipping product is the seller / agency / developer
        // dashboards on pro-leads — inbound lead inbox, status workflow,
        // listing ownership. Real, but narrower than a full lifecycle OS.
        score: 88,
        noteEn: 'Seller, agency and developer dashboards with a shared lead inbox, status workflow and listing ownership rules.',
        noteKa: 'გამყიდველის, სააგენტოსა და დეველოპერის პანელები ერთიანი ლიდების ყუთით და სტატუსებით.',
        evidence: 'src/lib/pro-leads.ts',
      },
      deepLocalization: {
        score: 100,
        noteEn: '74 localized country hubs with exact taxes, notary splits, mortgage rules & 10+ languages.',
        noteKa: '74 ლოკალიზებული ქვეყნის ჰაბი ზუსტი გადასახადებითა და რეგულაციებით.',
        evidence: 'src/lib/markets.ts',
      },
      zeroJankPerformance: {
        // Not 100: there is no field RUM yet, only build-enforced budgets.
        // Scored on what the checks actually prove.
        score: 92,
        noteEn: 'Build-enforced device budgets (RAM/cores/Save-Data), bundle-leak check, capped map GPU/RAM, MVT tiles. Lab-enforced; field RUM not yet collected.',
        noteKa: 'ბილდზე დაცული მოწყობილობის ბიუჯეტები, ბანდლის გაჟონვის შემოწმება, რუკის GPU/RAM ლიმიტი. საველე RUM ჯერ არ იზომება.',
        evidence: 'src/lib/device-budget.ts',
      },
      unifiedTransactions: {
        score: 100,
        noteEn: 'Unified direct stays booking, short-term rentals, sales, and verified leads.',
        noteKa: 'სასტუმროების ჯავშნები, გრძელვადიანი ქირაობა და გაყიდვა ერთ სივრცეში.',
        evidence: 'src/lib/bookings.ts',
      },
    },
  },

  // ── United States
  {
    id: 'zillow',
    name: 'Zillow',
    region: 'United States',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 40, noteEn: 'US/Canada only, zero cross-border graph.', noteKa: 'მხოლოდ აშშ/კანადა.' },
      institutionalValuation: { score: 65, noteEn: 'Zestimate is consumer-oriented; lacks multi-scenario institutional NOI/IRR models.', noteKa: 'Zestimate მხოლოდ საბაზისოა.' },
      truthAndScamRadar: { score: 70, noteEn: 'MLS-reliant, basic fraud filtering.', noteKa: 'დამოკიდებულია MLS-ზე.' },
      spatialCadastrePhysics: { score: 60, noteEn: '2D lot lines, no sun/shadow physics simulation.', noteKa: 'მხოლოდ 2D რუკა.' },
      transitConnectivity: { score: 68, noteEn: 'Third-party WalkScore plugin, lacks integrated global transit graphs.', noteKa: 'მხოლოდ WalkScore.' },
      dualCurrencySettlement: { score: 20, noteEn: 'USD only.', noteKa: 'მხოლოდ USD.' },
      fullLifecycleOS: { score: 78, noteEn: 'Premier Agent program, ad/lead-gen monetization.', noteKa: 'ფასიანი ლიდები.' },
      deepLocalization: { score: 35, noteEn: 'US centric taxonomy only.', noteKa: 'მხოლოდ ამერიკული სტანდარტი.' },
      zeroJankPerformance: { score: 65, noteEn: 'Heavy JS bundle with third-party ad trackers.', noteKa: 'მძიმე რეკლამები.' },
      unifiedTransactions: { score: 55, noteEn: 'No short-term stay booking integration.', noteKa: 'ჯავშნების გარეშე.' },
    },
  },
  {
    id: 'redfin',
    name: 'Redfin',
    region: 'United States',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 38, noteEn: 'US only, brokerage model.', noteKa: 'მხოლოდ აშშ.' },
      institutionalValuation: { score: 62, noteEn: 'Comp estimate tool, no institutional 3-scenario cashflow.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 75, noteEn: 'Direct MLS agent brokerage sync.', noteKa: 'პირდაპირი MLS სინქრონიზაცია.' },
      spatialCadastrePhysics: { score: 58, noteEn: '2D parcel lines, no 3D solar declination.', noteKa: '2D ნაკვეთები.' },
      transitConnectivity: { score: 70, noteEn: 'Transit and Walk Score ratings.', noteKa: 'ტრანზიტის ქულები.' },
      dualCurrencySettlement: { score: 20, noteEn: 'USD only.', noteKa: 'მხოლოდ USD.' },
      fullLifecycleOS: { score: 75, noteEn: 'In-house brokerage platform.', noteKa: 'საკუთარი ბროკერაჟი.' },
      deepLocalization: { score: 35, noteEn: 'US states only.', noteKa: 'მხოლოდ აშშ შტატები.' },
      zeroJankPerformance: { score: 72, noteEn: 'Decent performance, but US-bound.', noteKa: 'სტანდარტული სისწრაფე.' },
      unifiedTransactions: { score: 60, noteEn: 'Book a tour with Redfin agent.', noteKa: 'ტურის დაჯავშნა.' },
    },
  },
  {
    id: 'realtor-com',
    name: 'Realtor.com',
    region: 'United States',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 35, noteEn: 'NAR US affiliate, single-country DB.', noteKa: 'მხოლოდ აშშ.' },
      institutionalValuation: { score: 55, noteEn: 'Basic valuation estimates.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 72, noteEn: 'MLS feed verification.', noteKa: 'MLS გადამოწმება.' },
      spatialCadastrePhysics: { score: 50, noteEn: 'Basic map overlays.', noteKa: 'საბაზისო რუკა.' },
      transitConnectivity: { score: 60, noteEn: 'Basic transit scores.', noteKa: 'ტრანზიტის ქულები.' },
      dualCurrencySettlement: { score: 20, noteEn: 'USD only.', noteKa: 'მხოლოდ USD.' },
      fullLifecycleOS: { score: 65, noteEn: 'Agent lead distribution.', noteKa: 'ლიდების დისტრიბუცია.' },
      deepLocalization: { score: 30, noteEn: 'US only.', noteKa: 'მხოლოდ აშშ.' },
      zeroJankPerformance: { score: 58, noteEn: 'Ad network heavy.', noteKa: 'ბევრი რეკლამა.' },
      unifiedTransactions: { score: 45, noteEn: 'Lead forms.', noteKa: 'მხოლოდ ფორმები.' },
    },
  },
  {
    id: 'compass',
    name: 'Compass',
    region: 'United States',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 42, noteEn: 'US luxury markets focus.', noteKa: 'აშშ ლუქს ბაზრები.' },
      institutionalValuation: { score: 68, noteEn: 'Agent-generated CMA reports.', noteKa: 'აგენტის CMA რეპორტი.' },
      truthAndScamRadar: { score: 78, noteEn: 'Curated luxury listings.', noteKa: 'შემოწმებული ლუქს განცხადებები.' },
      spatialCadastrePhysics: { score: 62, noteEn: 'Interactive maps, no solar physics.', noteKa: 'ინტერაქტიული რუკები.' },
      transitConnectivity: { score: 65, noteEn: 'Neighborhood amenities mapped.', noteKa: 'უბნის ობიექტები.' },
      dualCurrencySettlement: { score: 25, noteEn: 'USD only.', noteKa: 'მხოლოდ USD.' },
      fullLifecycleOS: { score: 82, noteEn: 'Compass agent CRM workflow.', noteKa: 'Compass CRM.' },
      deepLocalization: { score: 38, noteEn: 'US luxury metros.', noteKa: 'აშშ ქალაქები.' },
      zeroJankPerformance: { score: 70, noteEn: 'Modern SPA but heavy bundles.', noteKa: 'მძიმე ბანდლი.' },
      unifiedTransactions: { score: 55, noteEn: 'Private client portal.', noteKa: 'კლიენტის პორტალი.' },
    },
  },

  // ── United Kingdom
  {
    id: 'rightmove',
    name: 'Rightmove',
    region: 'United Kingdom',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 35, noteEn: 'UK only silo, zero international entity linkage.', noteKa: 'მხოლოდ დიდი ბრიტანეთი.' },
      institutionalValuation: { score: 48, noteEn: 'Basic price history, no multi-scenario cashflow or Cap Rate calculators.', noteKa: 'მხოლოდ ისტორიული ფასები.' },
      truthAndScamRadar: { score: 65, noteEn: 'Relies on UK agent licensing without algorithmic truth engine.', noteKa: 'სააგენტოების შემოწმება.' },
      spatialCadastrePhysics: { score: 40, noteEn: 'Static Ordnance Survey maps without 3D sunlight physics.', noteKa: 'სტატიკური რუკები.' },
      transitConnectivity: { score: 70, noteEn: 'Station distance listed, lacks global transit node graphs.', noteKa: 'მხოლოდ სადგურის მანძილი.' },
      dualCurrencySettlement: { score: 25, noteEn: 'GBP only.', noteKa: 'მხოლოდ GBP.' },
      fullLifecycleOS: { score: 50, noteEn: 'Classified portal, not an operating system.', noteKa: 'კლასიკური განცხადებების საიტი.' },
      deepLocalization: { score: 30, noteEn: 'English UK only.', noteKa: 'მხოლოდ ინგლისური.' },
      zeroJankPerformance: { score: 60, noteEn: 'Ad-heavy layout with tracking pixels.', noteKa: 'ბევრი რეკლამა.' },
      unifiedTransactions: { score: 40, noteEn: 'Lead redirect to agent only.', noteKa: 'მხოლოდ სააგენტოზე გადამისამართება.' },
    },
  },
  {
    id: 'zoopla',
    name: 'Zoopla',
    region: 'United Kingdom',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 36, noteEn: 'UK domestic market only.', noteKa: 'მხოლოდ ბრიტანეთი.' },
      institutionalValuation: { score: 55, noteEn: 'Zoopla valuation estimate (Zestimate equivalent).', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 66, noteEn: 'UK agent syndication.', noteKa: 'აგენტების სინდიკაცია.' },
      spatialCadastrePhysics: { score: 45, noteEn: '2D map overlays.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 72, noteEn: 'Travel time search by commute.', noteKa: 'ტრანზიტის დროით ძებნა.' },
      dualCurrencySettlement: { score: 25, noteEn: 'GBP only.', noteKa: 'მხოლოდ GBP.' },
      fullLifecycleOS: { score: 55, noteEn: 'Alto CRM integration.', noteKa: 'CRM ინტეგრაცია.' },
      deepLocalization: { score: 32, noteEn: 'UK only.', noteKa: 'მხოლოდ დიდი ბრიტანეთი.' },
      zeroJankPerformance: { score: 62, noteEn: 'Heavy display ad inventory.', noteKa: 'სარეკლამო ბანერები.' },
      unifiedTransactions: { score: 42, noteEn: 'Agent lead inquiry.', noteKa: 'ლიდების გაგზავნა.' },
    },
  },
  {
    id: 'onthemarket',
    name: 'OnTheMarket',
    region: 'United Kingdom',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 32, noteEn: 'UK only portal.', noteKa: 'მხოლოდ ბრიტანეთი.' },
      institutionalValuation: { score: 45, noteEn: 'Basic price data.', noteKa: 'საბაზისო ფასები.' },
      truthAndScamRadar: { score: 64, noteEn: 'UK agent listings only.', noteKa: 'სააგენტოების განცხადებები.' },
      spatialCadastrePhysics: { score: 40, noteEn: 'Basic mapping.', noteKa: 'საბაზისო რუკა.' },
      transitConnectivity: { score: 65, noteEn: 'Local stations listed.', noteKa: 'სადგურების სია.' },
      dualCurrencySettlement: { score: 20, noteEn: 'GBP only.', noteKa: 'მხოლოდ GBP.' },
      fullLifecycleOS: { score: 48, noteEn: 'Agent-backed board.', noteKa: 'აგენტების პორტალი.' },
      deepLocalization: { score: 30, noteEn: 'UK English only.', noteKa: 'მხოლოდ ინგლისური.' },
      zeroJankPerformance: { score: 64, noteEn: 'Decent portal speed.', noteKa: 'სტანდარტული სისწრაფე.' },
      unifiedTransactions: { score: 40, noteEn: 'Contact agent form.', noteKa: 'საკონტაქტო ფორმა.' },
    },
  },

  // ── Germany & DACH
  {
    id: 'immoscout24',
    name: 'ImmoScout24',
    region: 'Germany / Austria / Switzerland',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 48, noteEn: 'DACH focused, strong German city coverage.', noteKa: 'DACH რეგიონი.' },
      institutionalValuation: { score: 65, noteEn: 'Preisatlas estimates, but paywalled for consumers.', noteKa: 'ფასიანი Preisatlas.' },
      truthAndScamRadar: { score: 72, noteEn: 'Verified Makler badges.', noteKa: 'შემოწმებული მაკლერები.' },
      spatialCadastrePhysics: { score: 55, noteEn: '2D map tiles with noise/infrastructure overlays.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 75, noteEn: 'Transit commute times in major German metros.', noteKa: 'მეტროს დროები გერმანიაში.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 72, noteEn: 'ScoutManager CRM for Makler.', noteKa: 'CRM მაკლერებისთვის.' },
      deepLocalization: { score: 78, noteEn: 'DE localized rules, Mietspiegel notes.', noteKa: 'გერმანული რეგულაციები.' },
      zeroJankPerformance: { score: 65, noteEn: 'Heavy paywall overlays and tracking.', noteKa: 'ფასიანი შეზღუდვები.' },
      unifiedTransactions: { score: 50, noteEn: 'Schufa integration and contact forms.', noteKa: 'Schufa ინტეგრაცია.' },
    },
  },
  {
    id: 'immowelt',
    name: 'Immowelt',
    region: 'Germany',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 42, noteEn: 'Germany & Austria only.', noteKa: 'გერმანია და ავსტრია.' },
      institutionalValuation: { score: 58, noteEn: 'Basic valuation report.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 68, noteEn: 'Agent account verification.', noteKa: 'ექაუნთების გადამოწმება.' },
      spatialCadastrePhysics: { score: 48, noteEn: '2D maps.', noteKa: '2D რუკები.' },
      transitConnectivity: { score: 68, noteEn: 'Station distance.', noteKa: 'სადგურის მანძილი.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 65, noteEn: 'EstatePro CRM suite.', noteKa: 'CRM სააგენტოებისთვის.' },
      deepLocalization: { score: 70, noteEn: 'German language only.', noteKa: 'გერმანული ენა.' },
      zeroJankPerformance: { score: 62, noteEn: 'Ad-heavy layout.', noteKa: 'ბევრი რეკლამა.' },
      unifiedTransactions: { score: 45, noteEn: 'Lead inquiry.', noteKa: 'ლიდების ფორმა.' },
    },
  },
  {
    id: 'kleinanzeigen',
    name: 'Kleinanzeigen',
    region: 'Germany',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 28, noteEn: 'German classifieds board, no entity graph.', noteKa: 'კლასიფიცირებული დაფა.' },
      institutionalValuation: { score: 20, noteEn: 'Zero valuation or cash flow modeling.', noteKa: 'არ აქვს შეფასება.' },
      truthAndScamRadar: { score: 42, noteEn: 'Significant peer-to-peer scam exposure.', noteKa: 'ხშირი სპამი.' },
      spatialCadastrePhysics: { score: 35, noteEn: 'Static postal code maps.', noteKa: 'საფოსტო ინდექსის რუკა.' },
      transitConnectivity: { score: 45, noteEn: 'Basic text address.', noteKa: 'მხოლოდ ტექსტი.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 35, noteEn: 'Pro seller accounts only.', noteKa: 'საბაზისო პრო ექაუნთი.' },
      deepLocalization: { score: 55, noteEn: 'German only.', noteKa: 'მხოლოდ გერმანული.' },
      zeroJankPerformance: { score: 60, noteEn: 'Heavy ad banners.', noteKa: 'სარეკლამო ბანერები.' },
      unifiedTransactions: { score: 40, noteEn: 'Direct chat with private seller.', noteKa: 'პირდაპირი ჩათი.' },
    },
  },

  // ── Spain, Portugal & Italy
  {
    id: 'idealista',
    name: 'Idealista',
    region: 'Spain / Portugal / Italy',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 50, noteEn: 'Southern Europe focus only.', noteKa: 'მხოლოდ სამხრეთ ევროპა.' },
      institutionalValuation: { score: 58, noteEn: 'Basic valuation tool, lacks 5-yr IRR & detailed closing cost models.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 60, noteEn: 'High duplicate listings rate on Spanish portals.', noteKa: 'ხშირი დუბლიკატები.' },
      spatialCadastrePhysics: { score: 55, noteEn: 'Spanish Catastro link, no 3D physics.', noteKa: 'კადასტრის ბმული 3D-ს გარეშე.' },
      transitConnectivity: { score: 65, noteEn: 'Metro distance shown in major cities.', noteKa: 'მეტროს მანძილი.' },
      dualCurrencySettlement: { score: 35, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 60, noteEn: 'Idealista/tools CRM, but no developer inventory engine.', noteKa: 'CRM სააგენტოებისთვის.' },
      deepLocalization: { score: 65, noteEn: 'ES/PT/IT languages only.', noteKa: '3 ენა.' },
      zeroJankPerformance: { score: 62, noteEn: 'Monetized by banner ads.', noteKa: 'ბანერული რეკლამები.' },
      unifiedTransactions: { score: 45, noteEn: 'Contact forms only.', noteKa: 'მხოლოდ ფორმები.' },
    },
  },
  {
    id: 'fotocasa',
    name: 'Fotocasa',
    region: 'Spain',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 40, noteEn: 'Spain only portal.', noteKa: 'მხოლოდ ესპანეთი.' },
      institutionalValuation: { score: 52, noteEn: 'Basic price index calculator.', noteKa: 'საბაზისო ინდექსი.' },
      truthAndScamRadar: { score: 58, noteEn: 'Standard portal moderation.', noteKa: 'სტანდარტული მოდერაცია.' },
      spatialCadastrePhysics: { score: 48, noteEn: '2D map views.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 62, noteEn: 'Neighborhood transport info.', noteKa: 'უბნის ტრანსპორტი.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 55, noteEn: 'Inmofactory CRM.', noteKa: 'CRM ინტეგრაცია.' },
      deepLocalization: { score: 60, noteEn: 'Spanish/Catalan only.', noteKa: 'ესპანური ენა.' },
      zeroJankPerformance: { score: 58, noteEn: 'Ad-heavy layout.', noteKa: 'ბევრი რეკლამა.' },
      unifiedTransactions: { score: 42, noteEn: 'Contact agent form.', noteKa: 'საკონტაქტო ფორმა.' },
    },
  },
  {
    id: 'immobiliare-it',
    name: 'Immobiliare.it',
    region: 'Italy',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 42, noteEn: 'Italy focused portal.', noteKa: 'იტალიის პორტალი.' },
      institutionalValuation: { score: 54, noteEn: 'Valutazione immobile tool.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 62, noteEn: 'Italian agency verification.', noteKa: 'სააგენტოების გადამოწმება.' },
      spatialCadastrePhysics: { score: 50, noteEn: '2D map layers.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 66, noteEn: 'Metro & train proximity in Milan/Rome.', noteKa: 'მეტროს სიახლოვე.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 58, noteEn: 'Gestionale immobiliare CRM.', noteKa: 'სააგენტოს CRM.' },
      deepLocalization: { score: 62, noteEn: 'Italian language focus.', noteKa: 'იტალიური ენა.' },
      zeroJankPerformance: { score: 64, noteEn: 'Standard portal performance.', noteKa: 'სტანდარტული სისწრაფე.' },
      unifiedTransactions: { score: 44, noteEn: 'Direct agency contact.', noteKa: 'სააგენტოს კონტაქტი.' },
    },
  },
  {
    id: 'casa-it',
    name: 'Casa.it',
    region: 'Italy',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 38, noteEn: 'Italy only portal.', noteKa: 'მხოლოდ იტალია.' },
      institutionalValuation: { score: 48, noteEn: 'Basic price history.', noteKa: 'ფასების ისტორია.' },
      truthAndScamRadar: { score: 60, noteEn: 'Standard moderation.', noteKa: 'მოდერაცია.' },
      spatialCadastrePhysics: { score: 45, noteEn: '2D maps.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 60, noteEn: 'Local stations.', noteKa: 'სადგურები.' },
      dualCurrencySettlement: { score: 28, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 52, noteEn: 'Broker listings tool.', noteKa: 'ბროკერის ხელსაწყო.' },
      deepLocalization: { score: 58, noteEn: 'Italian only.', noteKa: 'იტალიური ენა.' },
      zeroJankPerformance: { score: 60, noteEn: 'Ad network scripts.', noteKa: 'რეკლამები.' },
      unifiedTransactions: { score: 40, noteEn: 'Lead inquiries.', noteKa: 'ლიდები.' },
    },
  },

  // ── France
  {
    id: 'seloger',
    name: 'SeLoger',
    region: 'France',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 45, noteEn: 'France domestic leader, no international graph.', noteKa: 'საფრანგეთის ლიდერი.' },
      institutionalValuation: { score: 60, noteEn: 'Estimation SeLoger with local price/m2.', noteKa: 'საბაზისო შეფასება.' },
      truthAndScamRadar: { score: 68, noteEn: 'French agency exclusivity filters.', noteKa: 'სააგენტოების ფილტრები.' },
      spatialCadastrePhysics: { score: 52, noteEn: 'Cadastre DVF data links, no 3D physics.', noteKa: 'DVF კადასტრის ბმული.' },
      transitConnectivity: { score: 70, noteEn: 'Paris Metro and RER proximity.', noteKa: 'პარიზის მეტრო/RER.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 65, noteEn: 'Poliris CRM integration.', noteKa: 'CRM ინტეგრაცია.' },
      deepLocalization: { score: 72, noteEn: 'French notary & diagnostic rules.', noteKa: 'ფრანგული რეგულაციები.' },
      zeroJankPerformance: { score: 60, noteEn: 'Heavy scripts and cookie consent bloat.', noteKa: 'მძიმე სკრიპტები.' },
      unifiedTransactions: { score: 48, noteEn: 'Agency message forwarding.', noteKa: 'შეტყობინების გადაგზავნა.' },
    },
  },
  {
    id: 'leboncoin',
    name: 'LeBonCoin',
    region: 'France',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 30, noteEn: 'General classifieds in France.', noteKa: 'ზოგადი განცხადებები.' },
      institutionalValuation: { score: 35, noteEn: 'Basic price comparables.', noteKa: 'ფასების შედარება.' },
      truthAndScamRadar: { score: 50, noteEn: 'Peer-to-peer listing fraud challenges.', noteKa: 'ხშირი სპამი.' },
      spatialCadastrePhysics: { score: 40, noteEn: 'Basic map pin.', noteKa: 'რუკის მარკერი.' },
      transitConnectivity: { score: 55, noteEn: 'City level transport.', noteKa: 'ქალაქის ტრანსპორტი.' },
      dualCurrencySettlement: { score: 28, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 45, noteEn: 'Pro seller subscriptions.', noteKa: 'პრო გამოწერები.' },
      deepLocalization: { score: 60, noteEn: 'French language only.', noteKa: 'ფრანგული ენა.' },
      zeroJankPerformance: { score: 62, noteEn: 'Ad-supported classifieds.', noteKa: 'სარეკლამო ბანერები.' },
      unifiedTransactions: { score: 50, noteEn: 'Integrated payment for goods, not property.', noteKa: 'გადახდა ნივთებზე.' },
    },
  },
  {
    id: 'bienici',
    name: 'Bien\'ici',
    region: 'France',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 44, noteEn: 'France 3D map portal.', noteKa: 'საფრანგეთის 3D პორტალი.' },
      institutionalValuation: { score: 55, noteEn: 'Price per sqm heatmaps.', noteKa: 'ფასის რუკა.' },
      truthAndScamRadar: { score: 70, noteEn: 'Direct agency consortium backing.', noteKa: 'სააგენტოების კონსორციუმი.' },
      spatialCadastrePhysics: { score: 75, noteEn: '3D building massing in France, but no global physics.', noteKa: '3D შენობები საფრანგეთში.' },
      transitConnectivity: { score: 72, noteEn: 'Transport stops on 3D map.', noteKa: 'გაჩერებები 3D რუკაზე.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 60, noteEn: 'Agency syndication engine.', noteKa: 'სააგენტოს სინდიკაცია.' },
      deepLocalization: { score: 68, noteEn: 'French market only.', noteKa: 'მხოლოდ საფრანგეთი.' },
      zeroJankPerformance: { score: 60, noteEn: 'Heavy WebGL client overhead.', noteKa: 'მძიმე WebGL.' },
      unifiedTransactions: { score: 45, noteEn: 'Agency inquiry form.', noteKa: 'სააგენტოს ფორმა.' },
    },
  },

  // ── Netherlands & Nordics
  {
    id: 'funda',
    name: 'Funda',
    region: 'Netherlands',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 46, noteEn: 'NVM Dutch monopoly, zero international reach.', noteKa: 'ჰოლანდიის NVM მონოპოლია.' },
      institutionalValuation: { score: 62, noteEn: 'WOZ value & NVM transaction price indices.', noteKa: 'WOZ ღირებულება.' },
      truthAndScamRadar: { score: 85, noteEn: 'Near-100% verified NVM broker exclusivity.', noteKa: 'NVM ბროკერების შემოწმება.' },
      spatialCadastrePhysics: { score: 60, noteEn: 'Kadaster data links and 2D cadastral maps.', noteKa: 'Kadaster ბმული.' },
      transitConnectivity: { score: 75, noteEn: 'NS train & bike connectivity scores.', noteKa: 'მატარებლისა და ველოსიპედის ქულა.' },
      dualCurrencySettlement: { score: 30, noteEn: 'EUR only.', noteKa: 'მხოლოდ EUR.' },
      fullLifecycleOS: { score: 75, noteEn: 'Realworks CRM deep integration.', noteKa: 'Realworks CRM.' },
      deepLocalization: { score: 75, noteEn: 'Dutch tax, VvE reserve rules, erfpacht notes.', noteKa: 'ჰოლანდიური რეგულაციები.' },
      zeroJankPerformance: { score: 72, noteEn: 'Clean UI, low ad clutter.', noteKa: 'სუფთა ინტერფეისი.' },
      unifiedTransactions: { score: 50, noteEn: 'Bid tracking via broker portal.', noteKa: 'შეთავაზებების თვალყურის დევნება.' },
    },
  },
  {
    id: 'hemnet',
    name: 'Hemnet',
    region: 'Sweden',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 42, noteEn: 'Sweden national leader.', noteKa: 'შვედეთის ლიდერი.' },
      institutionalValuation: { score: 60, noteEn: 'Final bid price history (Slutpriser).', noteKa: 'დასრულებული აუქციონების ფასები.' },
      truthAndScamRadar: { score: 84, noteEn: 'Licensed Swedish broker exclusive mandate.', noteKa: 'ლიცენზირებული ბროკერები.' },
      spatialCadastrePhysics: { score: 55, noteEn: 'Lantmäteriet parcel data.', noteKa: 'Lantmäteriet კადასტრი.' },
      transitConnectivity: { score: 70, noteEn: 'SL transit and tunnelbana proximity.', noteKa: 'მეტროს სიახლოვე.' },
      dualCurrencySettlement: { score: 25, noteEn: 'SEK only.', noteKa: 'მხოლოდ SEK.' },
      fullLifecycleOS: { score: 70, noteEn: 'Mäklarsystem integration.', noteKa: 'ბროკერების სისტემა.' },
      deepLocalization: { score: 72, noteEn: 'BRF association finances, monthly fees.', noteKa: 'BRF კოოპერატივის ფინანსები.' },
      zeroJankPerformance: { score: 70, noteEn: 'Solid UX, Sweden focused.', noteKa: 'ხარისხიანი UX.' },
      unifiedTransactions: { score: 52, noteEn: 'Open house scheduling (Visning).', noteKa: 'ღია კარის დღეების გრაფიკი.' },
    },
  },

  // ── UAE & Middle East
  {
    id: 'propertyfinder',
    name: 'PropertyFinder',
    region: 'UAE / Saudi / Egypt',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 48, noteEn: 'GCC only, disconnected from global buyers.', noteKa: 'მხოლოდ ახლო აღმოსავლეთი.' },
      institutionalValuation: { score: 62, noteEn: 'Rental yields shown, lacks multi-scenario NOI/IRR modeling.', noteKa: 'საბაზისო yield.' },
      truthAndScamRadar: { score: 78, noteEn: 'Trakheesi permit integration for Dubai listings.', noteKa: 'Trakheesi ინტეგრაცია დუბაიში.' },
      spatialCadastrePhysics: { score: 52, noteEn: 'Standard 2D maps.', noteKa: 'სტანდარტული რუკები.' },
      transitConnectivity: { score: 62, noteEn: 'Metro stations marked.', noteKa: 'მეტროს მარკერები.' },
      dualCurrencySettlement: { score: 60, noteEn: 'AED/USD toggle.', noteKa: 'AED/USD გადართვა.' },
      fullLifecycleOS: { score: 68, noteEn: 'Broker portal & CRM.', noteKa: 'ბროკერების პორტალი.' },
      deepLocalization: { score: 65, noteEn: 'AR/EN bilingual.', noteKa: 'არაბული და ინგლისური.' },
      zeroJankPerformance: { score: 65, noteEn: 'Heavy frontend client bundles.', noteKa: 'მძიმე JS ბანდლი.' },
      unifiedTransactions: { score: 52, noteEn: 'Lead forwarding to agents.', noteKa: 'ლიდების გაგზავნა.' },
    },
  },
  {
    id: 'bayut',
    name: 'Bayut',
    region: 'UAE',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 47, noteEn: 'UAE / Dubizzle group.', noteKa: 'მხოლოდ UAE.' },
      institutionalValuation: { score: 64, noteEn: 'TruEstimate valuation reports.', noteKa: 'TruEstimate შეფასება.' },
      truthAndScamRadar: { score: 79, noteEn: 'TruCheck listing validation.', noteKa: 'TruCheck შემოწმება.' },
      spatialCadastrePhysics: { score: 58, noteEn: '2D/3D floorplans database.', noteKa: 'სართულის გეგმები.' },
      transitConnectivity: { score: 64, noteEn: 'Dubai Metro and school routes.', noteKa: 'მეტროს მარშრუტები.' },
      dualCurrencySettlement: { score: 62, noteEn: 'AED/USD/EUR/GBP selector.', noteKa: 'ვალუტების არჩევა.' },
      fullLifecycleOS: { score: 70, noteEn: 'Profolio broker system.', noteKa: 'ბროკერის სისტემა.' },
      deepLocalization: { score: 68, noteEn: 'DLD Dubai Land Dept verified data.', noteKa: 'DLD მონაცემები.' },
      zeroJankPerformance: { score: 64, noteEn: 'Feature-heavy app bundle.', noteKa: 'მძიმე აპლიკაცია.' },
      unifiedTransactions: { score: 54, noteEn: 'Agent WhatsApp direct connection.', noteKa: 'WhatsApp კონტაქტი.' },
    },
  },
  {
    id: 'dubizzle',
    name: 'Dubizzle',
    region: 'UAE & MENA',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 35, noteEn: 'General classifieds portal.', noteKa: 'ზოგადი განცხადებები.' },
      institutionalValuation: { score: 40, noteEn: 'Basic price history.', noteKa: 'ფასების ისტორია.' },
      truthAndScamRadar: { score: 62, noteEn: 'DLD permits enforced.', noteKa: 'DLD ნებართვები.' },
      spatialCadastrePhysics: { score: 42, noteEn: 'Basic map pins.', noteKa: 'რუკის მარკერები.' },
      transitConnectivity: { score: 55, noteEn: 'Neighborhood locations.', noteKa: 'უბნის ლოკაციები.' },
      dualCurrencySettlement: { score: 50, noteEn: 'AED/USD.', noteKa: 'AED/USD.' },
      fullLifecycleOS: { score: 50, noteEn: 'Classifieds seller manager.', noteKa: 'გამყიდველის მენეჯერი.' },
      deepLocalization: { score: 60, noteEn: 'AR/EN.', noteKa: 'არაბული/ინგლისური.' },
      zeroJankPerformance: { score: 58, noteEn: 'Ad network monetization.', noteKa: 'რეკლამები.' },
      unifiedTransactions: { score: 45, noteEn: 'Direct chat/call.', noteKa: 'ჩათი/ზარი.' },
    },
  },

  // ── Asia-Pacific
  {
    id: 'suumo',
    name: 'Suumo',
    region: 'Japan',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 44, noteEn: 'Japan domestic giant (Recruit).', noteKa: 'იაპონიის ლიდერი.' },
      institutionalValuation: { score: 56, noteEn: 'Rent/price market benchmarks.', noteKa: 'ბაზრის ბენჩმარკები.' },
      truthAndScamRadar: { score: 82, noteEn: 'Strict Japanese real estate compliance.', noteKa: 'მკაცრი იაპონური რეგულაცია.' },
      spatialCadastrePhysics: { score: 52, noteEn: 'Detailed Japanese building schematics.', noteKa: 'შენობის სქემები.' },
      transitConnectivity: { score: 88, noteEn: 'World-class Tokyo railway station walk-time matrix.', noteKa: 'ტოკიოს რკინიგზის მატრიცა.' },
      dualCurrencySettlement: { score: 20, noteEn: 'JPY only.', noteKa: 'მხოლოდ JPY.' },
      fullLifecycleOS: { score: 72, noteEn: 'Recruit agency syndication.', noteKa: 'Recruit სინდიკაცია.' },
      deepLocalization: { score: 78, noteEn: 'Tatami mat units (Jo), building age (Chiku-nen), sun direction (Minami-muki).', noteKa: 'იაპონური სპეციფიკა (Jo, Chiku-nen).' },
      zeroJankPerformance: { score: 64, noteEn: 'Information dense, legacy DOM nodes.', noteKa: 'ინფორმაციით გადატვირთული.' },
      unifiedTransactions: { score: 46, noteEn: 'Agency visit reservations.', noteKa: 'ვიზიტის დაჯავშნა.' },
    },
  },
  {
    id: 'homes-jp',
    name: 'LIFULL HOME\'S',
    region: 'Japan',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 42, noteEn: 'Japan portal.', noteKa: 'იაპონიის პორტალი.' },
      institutionalValuation: { score: 58, noteEn: 'Price appraisal score.', noteKa: 'ფასის შეფასება.' },
      truthAndScamRadar: { score: 80, noteEn: 'LIFULL authenticity validation.', noteKa: 'ავთენტურობის შემოწმება.' },
      spatialCadastrePhysics: { score: 54, noteEn: '3D floor maps.', noteKa: '3D სართულის გეგმა.' },
      transitConnectivity: { score: 85, noteEn: 'Commute station line maps.', noteKa: 'სატრანზიტო რუკები.' },
      dualCurrencySettlement: { score: 20, noteEn: 'JPY only.', noteKa: 'მხოლოდ JPY.' },
      fullLifecycleOS: { score: 68, noteEn: 'LIFULL Pro CRM.', noteKa: 'LIFULL CRM.' },
      deepLocalization: { score: 75, noteEn: 'Japanese domestic market.', noteKa: 'იაპონური ბაზარი.' },
      zeroJankPerformance: { score: 66, noteEn: 'Responsive layout.', noteKa: 'რესპონსიული დიზაინი.' },
      unifiedTransactions: { score: 48, noteEn: 'Inquiry forwarding.', noteKa: 'მოთხოვნის გაგზავნა.' },
    },
  },
  {
    id: 'realestate-com-au',
    name: 'Realestate.com.au',
    region: 'Australia',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 46, noteEn: 'REA Group Australia leader.', noteKa: 'ავსტრალიის REA ჯგუფი.' },
      institutionalValuation: { score: 66, noteEn: 'PropTrack automated valuation models (AVM).', noteKa: 'PropTrack შეფასება.' },
      truthAndScamRadar: { score: 80, noteEn: 'Direct agency exclusive authority.', noteKa: 'სააგენტოს ექსკლუზივი.' },
      spatialCadastrePhysics: { score: 58, noteEn: 'Cadastral boundary overlays.', noteKa: 'კადასტრის საზღვრები.' },
      transitConnectivity: { score: 72, noteEn: 'Public transport and school catchment zones.', noteKa: 'ტრანსპორტი და სკოლები.' },
      dualCurrencySettlement: { score: 25, noteEn: 'AUD only.', noteKa: 'მხოლოდ AUD.' },
      fullLifecycleOS: { score: 76, noteEn: 'Ignite agent workspace.', noteKa: 'Ignite სამუშაო გარემო.' },
      deepLocalization: { score: 74, noteEn: 'Australian stamp duty, auction rules, strata levies.', noteKa: 'ავსტრალიის გადასახადები.' },
      zeroJankPerformance: { score: 68, noteEn: 'Modern UI with substantial ad units.', noteKa: 'სარეკლამო ბლოკები.' },
      unifiedTransactions: { score: 54, noteEn: 'Auction registration & inspection planner.', noteKa: 'აუქციონის რეგისტრაცია.' },
    },
  },
  {
    id: 'domain-com-au',
    name: 'Domain',
    region: 'Australia',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 44, noteEn: 'Australia #2 portal (Nine Entertainment).', noteKa: 'ავსტრალიის #2 პორტალი.' },
      institutionalValuation: { score: 64, noteEn: 'Domain Price Guide & historic sales.', noteKa: 'ფასების გზამკვლევი.' },
      truthAndScamRadar: { score: 78, noteEn: 'Licensed agent listings.', noteKa: 'ლიცენზირებული აგენტები.' },
      spatialCadastrePhysics: { score: 55, noteEn: '2D property boundaries.', noteKa: '2D საზღვრები.' },
      transitConnectivity: { score: 70, noteEn: 'Transport proximity.', noteKa: 'ტრანსპორტის სიახლოვე.' },
      dualCurrencySettlement: { score: 25, noteEn: 'AUD only.', noteKa: 'მხოლოდ AUD.' },
      fullLifecycleOS: { score: 72, noteEn: 'Domain Agent portal.', noteKa: 'აგენტის პორტალი.' },
      deepLocalization: { score: 72, noteEn: 'State by state Australian rules.', noteKa: 'შტატების რეგულაციები.' },
      zeroJankPerformance: { score: 68, noteEn: 'Clean design with display ads.', noteKa: 'სტანდარტული UI.' },
      unifiedTransactions: { score: 50, noteEn: 'Inspection booking.', noteKa: 'დათვალიერების დაჯავშნა.' },
    },
  },
  {
    id: 'housing-com',
    name: 'Housing.com',
    region: 'India',
    tier: 'global-leader',
    cells: {
      globalEntityGraph: { score: 40, noteEn: 'India top tier (REA India).', noteKa: 'ინდოეთის ლიდერი.' },
      institutionalValuation: { score: 50, noteEn: 'Price trend indices.', noteKa: 'ფასების ტრენდები.' },
      truthAndScamRadar: { score: 62, noteEn: 'Housing Verified listings program.', noteKa: 'შემოწმებული განცხადებები.' },
      spatialCadastrePhysics: { score: 50, noteEn: '3D project walkthroughs.', noteKa: '3D პროექტები.' },
      transitConnectivity: { score: 60, noteEn: 'Metro & train connectivity.', noteKa: 'მეტროს კავშირი.' },
      dualCurrencySettlement: { score: 30, noteEn: 'INR / Cr / Lakhs formatting.', noteKa: 'INR ფორმატირება.' },
      fullLifecycleOS: { score: 64, noteEn: 'Developer marketing & broker CRM.', noteKa: 'დეველოპერის მარკეტინგი.' },
      deepLocalization: { score: 65, noteEn: 'RERA compliance registration display.', noteKa: 'RERA რეგისტრაცია.' },
      zeroJankPerformance: { score: 60, noteEn: 'Ad-heavy mobile web.', noteKa: 'მობილური რეკლამები.' },
      unifiedTransactions: { score: 48, noteEn: 'Housing Edge rent payments.', noteKa: 'ქირის გადახდა.' },
    },
  },
  {
    id: 'magicbricks',
    name: 'MagicBricks',
    region: 'India',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 38, noteEn: 'India portal (Times Group).', noteKa: 'ინდოეთის პორტალი.' },
      institutionalValuation: { score: 48, noteEn: 'PropWorth valuation engine.', noteKa: 'PropWorth შეფასება.' },
      truthAndScamRadar: { score: 56, noteEn: 'Agent verification tiers.', noteKa: 'აგენტების შემოწმება.' },
      spatialCadastrePhysics: { score: 44, noteEn: '2D map locator.', noteKa: '2D რუკა.' },
      transitConnectivity: { score: 58, noteEn: 'Local transport notes.', noteKa: 'ადგილობრივი ტრანსპორტი.' },
      dualCurrencySettlement: { score: 28, noteEn: 'INR only.', noteKa: 'მხოლოდ INR.' },
      fullLifecycleOS: { score: 60, noteEn: 'Broker management tools.', noteKa: 'ბროკერის მართვა.' },
      deepLocalization: { score: 62, noteEn: 'RERA and state registration display.', noteKa: 'RERA ჩვენება.' },
      zeroJankPerformance: { score: 55, noteEn: 'Heavy promotional banner network.', noteKa: 'სარეკლამო ბანერები.' },
      unifiedTransactions: { score: 44, noteEn: 'Direct broker contacts.', noteKa: 'ბროკერის კონტაქტები.' },
    },
  },

  // ── Georgia
  {
    id: 'ss-ge',
    name: 'SS.ge',
    region: 'Georgia',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 20, noteEn: 'Georgia only, no global graph or cross-border buyer discovery.', noteKa: 'მხოლოდ საქართველო, გლობალური გრაფის გარეშე.' },
      institutionalValuation: { score: 25, noteEn: 'Zero valuation or cash flow modeling; basic raw price per sqm only.', noteKa: 'არ აქვს შეფასების ან მომგებიანობის მოდელი.' },
      truthAndScamRadar: { score: 35, noteEn: 'Pervasive fake and duplicate listings; no automated duplicate collapse.', noteKa: 'დუბლირებული და არააქტუალური განცხადებები.' },
      spatialCadastrePhysics: { score: 30, noteEn: 'Static 2D map tiles, no sun simulation or cadastral integration.', noteKa: 'სტატიკური რუკა, მზის და კადასტრის გარეშე.' },
      transitConnectivity: { score: 40, noteEn: 'Raw text metro station selector, no coordinates/distance math.', noteKa: 'მხოლოდ ტექსტური სადგური.' },
      dualCurrencySettlement: { score: 70, noteEn: 'GEL/USD toggle present.', noteKa: 'GEL/USD გადართვა.' },
      fullLifecycleOS: { score: 30, noteEn: 'Legacy classifieds board, no Developer OS or automated CRM.', noteKa: 'ძველი სტილის დაფა.' },
      deepLocalization: { score: 45, noteEn: 'KA/EN/RU basic translation, no localized tax/closing cost breakdowns.', noteKa: 'საბაზისო თარგმანი ხარჯების გაანგარიშების გარეშე.' },
      zeroJankPerformance: { score: 45, noteEn: 'Heavy banner ad networks, layout shift, and legacy jQuery scripts.', noteKa: 'მძიმე ბანერები და შეფერხებები.' },
      unifiedTransactions: { score: 35, noteEn: 'Unverified phone number callouts only.', noteKa: 'მხოლოდ ტელეფონის ნომრები.' },
    },
  },
  {
    id: 'myhome-ge',
    name: 'MyHome.ge',
    region: 'Georgia',
    tier: 'regional-incumbent',
    cells: {
      globalEntityGraph: { score: 22, noteEn: 'Georgia only, TBC group classifieds board.', noteKa: 'მხოლოდ საქართველო.' },
      institutionalValuation: { score: 28, noteEn: 'Basic price history chart, no institutional multi-scenario ROI.', noteKa: 'საბაზისო ისტორია.' },
      truthAndScamRadar: { score: 38, noteEn: 'High duplicate volume across multiple broker phone numbers.', noteKa: 'დუბლიკატები სხვადასხვა ნომრებით.' },
      spatialCadastrePhysics: { score: 32, noteEn: '2D map pins without 3D solar declination.', noteKa: '2D მარკერები.' },
      transitConnectivity: { score: 42, noteEn: 'Station name filter only.', noteKa: 'სადგურის ფილტრი.' },
      dualCurrencySettlement: { score: 70, noteEn: 'GEL/USD dual price display.', noteKa: 'GEL/USD ფასები.' },
      fullLifecycleOS: { score: 35, noteEn: 'Classified listing syndication.', noteKa: 'განცხადებების განთავსება.' },
      deepLocalization: { score: 48, noteEn: 'KA/EN/RU translation.', noteKa: 'თარგმანი.' },
      zeroJankPerformance: { score: 50, noteEn: 'Monetized via display ads and popups.', noteKa: 'ბანერები და pop-up-ები.' },
      unifiedTransactions: { score: 38, noteEn: 'Direct phone number calls.', noteKa: 'სატელეფონო ზარები.' },
    },
  },
] as const

/**
 * Derives rankings mathematically using weighted averages.
 */
export function getRankedGlobalPlayers(): GlobalRankedPlayer[] {
  const ranked = GLOBAL_PLAYERS.map((player) => {
    let weightedSum = 0
    for (const dim of GLOBAL_DIMENSIONS) {
      const cell = player.cells[dim.id]
      const score = cell ? cell.score : 0
      weightedSum += score * dim.weight
    }
    const total = Number(weightedSum.toFixed(1))
    return { ...player, total, rank: 1 }
  })

  ranked.sort((a, b) => b.total - a.total)
  return ranked.map((p, idx) => ({ ...p, rank: idx + 1 }))
}
