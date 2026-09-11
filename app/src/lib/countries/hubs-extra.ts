import type { CountryCopy } from '@/lib/country-copy'

type CityPack = {
  name: string
  hub: CountryCopy
  buy?: CountryCopy
  rent?: CountryCopy
}

function hub(
  title: string,
  description: string,
  h1: string,
  lede: string,
  body: string[],
  faqs: CountryCopy['faqs'],
): CountryCopy {
  return { title, description, h1, lede, body, faqs }
}

function city(name: string, lede: string, body: string[], faqs: CountryCopy['faqs']): CityPack {
  return {
    name,
    hub: {
      title: `${name} real estate — prices, areas & buying guide | sivrce`,
      description: lede,
      h1: `${name} real estate`,
      lede,
      body,
      faqs,
    },
  }
}

export const EXTRA_NAMES = {
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  gb: 'United Kingdom',
  us: 'United States',
  ca: 'Canada',
  tr: 'Turkey',
} as const

export const EXTRA_HUBS: Record<keyof typeof EXTRA_NAMES, CountryCopy> = {
  fr: hub(
    'France real estate — Paris & Lyon | sivrce',
    'Buying and renting in France: notaire, 7–8% acquisition costs, and rent control in tight cities. Paris and Lyon guides first.',
    'Real estate in France',
    'A French purchase is a two-contract notarial process, not a portal checkout. Budget roughly 7–8% on top of the price for notaire fees and transfer tax. sivrce opens with Paris and Lyon — unique law, not a copy of Georgia or Germany.',
    [
      'The compromis de vente locks the deal; the acte authentique at the notaire transfers title weeks later. Cooling-off exists for residential buyers. Diagnostics (DPE, asbestos, lead) sit in the file before you wire a deposit.',
      'Paris and some tight communes cap rents (encadrement des loyers). Yields are not German Mietspiegel and not Dubai service-charge math. Foreign buyers are not barred from freehold apartments.',
      'sivrce.com/fr is the canonical France URL. Listings publish only when we can verify them to the same standard as Georgia.',
    ],
    [
      {
        q: 'Can a non-resident buy in France?',
        a: 'Yes. You will need a French bank path for settlement and a notaire. There is no nationality ban on ordinary residential freehold.',
      },
      {
        q: 'Why is the path /fr not /france?',
        a: 'ISO-3166 country codes keep one URL per market. France is sivrce.com/fr.',
      },
    ],
  ),
  es: hub(
    'Spain real estate — Madrid & Barcelona | sivrce',
    'Buying in Spain: ITP versus IVA, nota simple, and regional tax. Madrid and Barcelona guides — not a scraped classifieds dump.',
    'Real estate in Spain',
    'Spain splits transfer tax by asset: resale homes usually pay ITP (regional, often 6–10%); new-build pays IVA plus AJD. The nota simple is the first document, not a brochure. sivrce starts with Madrid and Barcelona as different legal cities, not two skins of one page.',
    [
      'Non-residents buy freely in most residential stock. Golden-visa-by-property was shut in 2025 — do not underwrite residency on a purchase. NIE number and a Spanish bank account are still the practical path to completion.',
      'Catalonia and Madrid do not share the same rental rules or tourist-licence climate. Barcelona short-stay licences are scarce; Madrid is a different book. Service charges (comunidad) and plusvalía sit outside the headline price.',
      'Canonical URL is sivrce.com/es. Verified listings land when partners pass the same bar as Georgia.',
    ],
    [
      {
        q: 'ITP or IVA?',
        a: 'Resale homes: ITP at the regional rate. New-build from a developer: IVA (currently 10% residential) plus stamp (AJD). Your notario files the deed either way.',
      },
      {
        q: 'Is sivrce.com/es a copy of the Georgian site?',
        a: 'No. Currency is EUR, law is Spanish, and the copy is written for Spain. Georgia stays on sivrce.ge.',
      },
    ],
  ),
  it: hub(
    'Italy real estate — Rome & Milan | sivrce',
    'Buying in Italy: notaio, cadastral rendita, IMU, and agency fees. Rome and Milan first — two markets, one ISO path.',
    'Real estate in Italy',
    'An Italian sale completes in front of a notaio who reads the deed and files the transcription. The cadastral rendita — not the asking price — drives registration tax for many resales. sivrce opens Rome and Milan as separate cities, not a peninsula-wide doorway.',
    [
      'Foreigners can buy residential property. Budget notaio, agency (often 3% plus VAT each side unless agreed), and registration tax. First-home (prima casa) relief is for residents who move their anagrafe — tourists do not get it by default.',
      'Milan prices off finance and employment; Rome prices off scarcity inside the GRA and a slower rental court. IMU and condominio charges change the real yield. Off-plan is a different risk file than a tavola-certified resale.',
      'Canonical URL is sivrce.com/it. Inventory publishes only when verified.',
    ],
    [
      {
        q: 'Do I need an Italian tax code?',
        a: 'Yes, a codice fiscale, before the deed. The notaio will not complete without it.',
      },
      {
        q: 'Is /it Italian language or Italy the country?',
        a: 'On sivrce.com, /it is Italy. Georgian-site locales live on sivrce.ge.',
      },
    ],
  ),
  gb: hub(
    'UK real estate — London & Manchester | sivrce',
    'Buying in England: solicitors not notaries, Stamp Duty, freehold vs leasehold. London and Manchester guides. Path is /gb (ISO), /uk redirects here.',
    'Real estate in the United Kingdom',
    'England and Wales use solicitors and Land Registry, not a continental notaire. Stamp Duty Land Tax is paid by the buyer on a slice system; non-resident surcharges apply. sivrce uses /gb — the ISO code — so /uk never collides with Ukrainian locale on sivrce.ge. /uk 308s here.',
    [
      'Leasehold flats are a different product from freehold houses: ground rent, service charge, and remaining term change the price. Scotland has its own missives system; this hub is England-first (London, Manchester) until a Scotland page exists.',
      'Offers are not contracts. Gazumping is legal until exchange. Surveys (Homebuyer vs building survey) sit between offer and exchange. Foreign buyers are not banned; they pay the same SDLT bands plus the surcharge if non-resident.',
      'Canonical URL is sivrce.com/gb. sivrce.com/uk permanently redirects here.',
    ],
    [
      {
        q: 'Why /gb not /uk?',
        a: 'ISO-3166-1 alpha-2 for the UK is GB. /uk is a Ukrainian locale on sivrce.ge, so the country path cannot be /uk. Type /uk on sivrce.com and it 308s to /gb.',
      },
      {
        q: 'Can overseas buyers purchase in London?',
        a: 'Yes. Expect solicitor KYC, SDLT (plus non-resident surcharge), and — for flats — a lease-term check before you treat the price as comparable to freehold.',
      },
    ],
  ),
  us: hub(
    'US real estate — New York & Miami | sivrce',
    'Buying in the US: title insurance, state closing customs, FIRPTA for foreign sellers. New York and Miami first — not one American market.',
    'Real estate in the United States',
    'There is no US-wide property code. New York closings, Miami condos, and Texas houses are different machines. Title insurance is normal; a continental notaire is not. sivrce starts with New York and Miami because they are the two foreign-buyer magnets, not because America is two cities.',
    [
      'Foreign buyers can hold fee simple in both metros. FIRPTA withholds on foreign sellers, not on foreign buyers. Cash is common in Miami; NY co-ops can reject a board package that a condo would accept. Transfer taxes and mansion tax are local.',
      'HOA and condo docs are the yield. Insurance (especially Florida wind/flood) can reprice a “cheap” building overnight. Do not import Georgian cadastre habits — the US uses county records and title plants.',
      'Canonical URL is sivrce.com/us. Listings only when verified.',
    ],
    [
      {
        q: 'Need a US Social Security number to buy?',
        a: 'No. You need a closing attorney/title company, a way to wire, and an ITIN later if you rent it out. The deed does not require an SSN.',
      },
      {
        q: 'Is this Zillow for the whole country?',
        a: 'No. It is a sivrce country hub with unique NY and Miami copy. The live Georgian catalog stays on sivrce.ge.',
      },
    ],
  ),
  ca: hub(
    'Canada real estate — Toronto & Vancouver | sivrce',
    'Buying in Canada: land-transfer tax, foreign-buyer restrictions in BC and Ontario, CMHC for residents. Toronto and Vancouver first.',
    'Real estate in Canada',
    'Canada is provincial. Ontario and British Columbia have used foreign-buyer bans and extra taxes that do not exist in every province. CMHC insurance is for owner-occupier mortgages, not a tourist product. sivrce opens Toronto and Vancouver as two coastal/inland books, not a maple-leaf doorway.',
    [
      'Land transfer tax (and Toronto’s municipal extra) sits on top of the price. Title is land-titles based. Condos have reserve-fund risk that detached houses do not. Assignments and pre-con are a different due-diligence file than resale.',
      'Non-resident rules change with federal and provincial statutes — underwrite the current prohibition/tax, not a 2019 blog post. Banking and FINTRAC KYC are slow on purpose.',
      'Canonical URL is sivrce.com/ca. Verified listings when partners clear the same bar as Georgia.',
    ],
    [
      {
        q: 'Can a non-resident buy in Toronto?',
        a: 'Check the current federal prohibition and Ontario extras before you fly. The rule set has changed more than once; this page will not pretend a frozen yes.',
      },
      {
        q: 'CAD not USD?',
        a: 'Canada prices in Canadian dollars. sivrce.ge listings stay GEL/USD. Do not mix the two catalogs.',
      },
    ],
  ),
  tr: hub(
    'Turkey real estate — Istanbul & Antalya | sivrce',
    'Buying in Turkey: tapu title, military-zone checks, 4% title duty, citizenship-by-investment thresholds. Istanbul and Antalya first. Path /tr on sivrce.com is Turkey, not Turkish locale.',
    'Real estate in Turkey',
    'Title is the tapu. Some parcels still need a military clearance before a foreigner can complete. Title duty is typically 4% (often split). On sivrce.com, /tr is Turkey; on sivrce.ge, /tr is the Turkish-language Georgia UI. Same letters, different host.',
    [
      'Istanbul is a lira-and-dollar hybrid market with very different districts inside one city. Antalya is a second-home and residence-permit magnet with a different seasonal rental book. DASK earthquake insurance is not optional folklore.',
      'Citizenship-by-investment thresholds move; treat them as a government circular, not a developer slide. Off-plan should be a notary-contract plus building-permit check, not a WhatsApp invoice.',
      'Canonical URL is sivrce.com/tr. Listings publish only when verified.',
    ],
    [
      {
        q: 'Is sivrce.com/tr the Turkish translation of sivrce.ge?',
        a: 'No. sivrce.ge/tr is Georgian inventory in Turkish. sivrce.com/tr is the Turkey country market in English.',
      },
      {
        q: 'Can foreigners get tapu?',
        a: 'Yes in most residential zones, with exceptions around military and some village land. The land-registry appointment is the close, not the reservation form.',
      },
    ],
  ),
}

export const EXTRA_CITIES: Record<keyof typeof EXTRA_NAMES, Record<string, CityPack>> = {
  fr: {
    paris: city(
      'Paris',
      'Paris is a notaire-and-DPE market with rent caps in the city proper. Haussmann vs new-build vs inner-suburb (petite couronne) are three products, not one skyline.',
      [
        'Encadrement des loyers and DPE ratings change what you can charge. Parking and chambre de bonne are not rounding errors on the yield.',
        'The compromis is the hard moment. Diagnostics belong in the file before you celebrate the asking price. This page is a briefing until verified Paris listings are live.',
      ],
      [
        { q: 'Can foreigners buy in Paris?', a: 'Yes. Expect notaire, 7–8% costs, and a French settlement path.' },
        { q: 'Rent control?', a: 'Inside Paris, reference rents apply to many leases. Underwrite that, not Airbnb math.' },
      ],
    ),
    lyon: city(
      'Lyon',
      'Lyon prices off jobs, TGV time to Paris, and two rivers — not a discounted 9th arrondissement. Presqu’île, Croix-Rousse and Part-Dieu do not share a cap-rate.',
      [
        'The market is smaller and less foreign-buyer theatrical than Paris. Notaire process is the same national machine; micro-location is not.',
        'Student and medical employment support rent; tourist occupancy does not define the city. sivrce will not clone the Paris page with a different name.',
      ],
      [
        { q: 'Cheaper than Paris?', a: 'Usually per square metre. Not automatically higher yield once vacancy and works are honest.' },
        { q: 'Same notaire rules?', a: 'Yes — French national sale process. The city briefing is local; the deed is not.' },
      ],
    ),
  },
  es: {
    madrid: city(
      'Madrid',
      'Madrid is Spain’s jobs and liquidity hub: Salamanca vs Tetuán vs the south cone are different books. Tourist licences are a different climate than Barcelona.',
      [
        'ITP on resale, IVA on new-build. Comunidad fees and energy certificates belong in the first spreadsheet, not the last.',
        'Foreign buyers use NIE + notario. This page stays a briefing until verified Madrid listings are live.',
      ],
      [
        { q: 'Golden visa?', a: 'The property-for-residency route was closed in 2025. Buy for the asset, not a visa slide.' },
        { q: 'Short-term rent?', a: 'Municipal licence reality beats portal photos. Check the current Madrid rules before underwriting occupancy.' },
      ],
    ),
    barcelona: city(
      'Barcelona',
      'Barcelona is a licence-and-scarcity city. Eixample, Gràcia and the beachfront are not interchangeable, and tourist-rental stock is politically constrained.',
      [
        'Catalonia’s tax and rental rules are not Madrid’s. Plusvalía and comunidad still sit outside the asking price.',
        'A nota simple is cheaper than a surprise charge on the deed. sivrce will not invent listings to fill this page.',
      ],
      [
        { q: 'Can I tourist-rent a flat?', a: 'Assume no until you hold a current licence. Buying “for Airbnb” is how people buy a lawsuit.' },
        { q: 'Language of the deed?', a: 'Spanish and/or Catalan at the notario. Bring a translator if you cannot read the minuta.' },
      ],
    ),
  },
  it: {
    rome: city(
      'Rome',
      'Rome inside the GRA is scarcity and bureaucracy; outside it is a different commute. Historic centro vs EUR vs the coast are not one cap-rate.',
      [
        'Cadastral rendita drives tax on many resales. Condominio arrears transfer with the flat if you do not check.',
        'Tourist demand is real; eviction timelines are slow. Underwrite law, not Instagram occupancy.',
      ],
      [
        { q: 'Need codice fiscale?', a: 'Yes, before the notaio appointment.' },
        { q: 'Prima casa relief?', a: 'For residents who move their anagrafe. A holiday buyer typically pays the ordinary registration tax.' },
      ],
    ),
    milan: city(
      'Milan',
      'Milan is Italy’s finance and design employment market. Porta Nuova vs the old city vs the hinterland (Assago, Sesto) do not share a yield.',
      [
        'Prices follow jobs and infrastructure, not ruins. Agency fees plus notaio are a visible slice of equity on day one.',
        'Energy class (APE) and condominio special assessments change the bid. This is not a Rome page with a different skyline.',
      ],
      [
        { q: 'Good for yield?', a: 'Some peripheral stock cash-flows; Brera trophies do not. Run HOA + IMU before the brochure.' },
        { q: 'Foreign buyers allowed?', a: 'Yes for ordinary residential. The notaio still needs a tax code and KYC.' },
      ],
    ),
  },
  gb: {
    london: city(
      'London',
      'London is a stamp-duty, leasehold, and borough-planning market. Zone 1 trophy and Zone 4 terrace are different products with the same ISO path above them.',
      [
        'Check remaining lease term, ground rent, and service charge before you compare £/sq ft. SDLT (plus non-resident surcharge) is paid by the buyer on a slice system.',
        'Exchange is the contract. Until then, gazumping is legal. sivrce will not publish London listings we cannot verify.',
      ],
      [
        { q: 'Freehold or leasehold?', a: 'Most flats are leasehold. A short lease is a discount with a future bill attached.' },
        { q: 'Overseas buyer extra tax?', a: 'Non-resident SDLT surcharge applies on top of standard bands. Budget it before the offer.' },
      ],
    ),
    manchester: city(
      'Manchester',
      'Manchester is a northern employment and student-rental market, not a cheaper Mayfair. City-centre towers vs Victorian conversion vs tram-suburb houses are three books.',
      [
        'Build quality and cladding/EWS1 files have repriced whole buildings since 2017. Do not skip the building safety pack.',
        'Gross yields look kinder than London until voids, ground rent, and capex are honest. This page is not a London clone.',
      ],
      [
        { q: 'Better yield than London?', a: 'Often on paper. Check service charge, cladding, and actual achieved rent, not a developer spreadsheet.' },
        { q: 'Same solicitors as London?', a: 'England and Wales process, local firms. Still exchange-then-complete, not a notaire.' },
      ],
    ),
  },
  us: {
    'new-york': city(
      'New York',
      'New York City splits condo (easier foreign close) from co-op (board can say no). Transfer and mansion taxes are local; they are not Florida closing costs.',
      [
        'Manhattan, Brooklyn brownstone, and a Queens condo do not share a cap-rate. Sponsor units and resale have different disclosure.',
        'A co-op board package is a second underwriting. Budget attorney, title, and taxes before you treat the ask as the all-in number.',
      ],
      [
        { q: 'Can foreigners buy a co-op?', a: 'Sometimes. The board can reject without a continental-style “reason.” Condos are the more predictable foreign product.' },
        { q: 'FIRPTA?', a: 'Withholding on foreign sellers. Buyers still need a clean title policy and a real attorney.' },
      ],
    ),
    miami: city(
      'Miami',
      'Miami is a condo-insurance and HOA market with a large cash and foreign-buyer share. Brickell, the beach, and suburban Miami-Dade are not one yield.',
      [
        'Wind and flood insurance can move faster than the asking price. Read the HOA budget and special-assessment history before the inspection.',
        'Florida closings are not New York closings. Title companies run the table. This page is not a Manhattan brief with palm trees.',
      ],
      [
        { q: 'Cash only?', a: 'Cash is common, not mandatory. Lenders still re-underwrite insurance and HOA health.' },
        { q: 'Foreign buyer extra tax to purchase?', a: 'No FIRPTA on the way in. Budget documentary stamps, title, and HOA estoppel like a local.' },
      ],
    ),
  },
  ca: {
    toronto: city(
      'Toronto',
      'Toronto stacks provincial land-transfer tax with a municipal extra. Condos downtown and detached in the 416/905 are different debt products.',
      [
        'Reserve-fund studies and special assessments are the yield. Pre-construction assignments have their own contract risk.',
        'Foreign-buyer rules have flipped more than once. Underwrite the current statute, not a 2021 WhatsApp rumour.',
      ],
      [
        { q: 'Two land-transfer taxes?', a: 'Provincial plus Toronto municipal for property in the city. Budget both.' },
        { q: 'Non-resident allowed?', a: 'Check the live federal prohibition and Ontario extras before you book a viewing trip.' },
      ],
    ),
    vancouver: city(
      'Vancouver',
      'Vancouver is a British Columbia tax-and-constraint market: foreign-buyer measures, vacancy tax, and a mountain-and-ocean land shortage. It is not Toronto with better air.',
      [
        'Strata minutes and depreciation reports matter as much as the view. Detached in the west side is a different book from a Surrey condo.',
        'Completion and property-transfer tax are provincial. sivrce will not paste the Toronto FAQ onto this page.',
      ],
      [
        { q: 'Vacancy tax?', a: 'Empty-home taxes exist in Metro Vancouver. An overseas lock-up is not a free hold.', },
        { q: 'Same foreign-buyer ban as Ontario?', a: 'BC has used its own tools. Read the current BC and federal rules; they are not one Canadian switch.' },
      ],
    ),
  },
  tr: {
    istanbul: city(
      'Istanbul',
      'Istanbul is many cities on one tapu system: European-side apartments, Asian-side family stock, and Bosphorus trophies do not share a lira yield.',
      [
        'Earthquake code, DASK, and the building’s year are first-class due diligence. A cheap older building is not a bargain if the carcass is the risk.',
        'Title duty, translator at tapu, and military-zone checks (where they apply) sit between reservation and keys. This is not an Antalya holiday-home page.',
      ],
      [
        { q: 'USD or TRY?', a: 'Asks wander between both. The tapu and taxes are Turkish. Underwrite the currency you will actually settle in.' },
        { q: 'Citizenship via this flat?', a: 'Thresholds move by circular. Treat developer “passport included” slides as marketing until the gazette agrees.' },
      ],
    ),
    antalya: city(
      'Antalya',
      'Antalya is a second-home and residence-permit coast: Lara, Konyaaltı and the old town are different products from Istanbul employment stock.',
      [
        'Seasonal rent and property-management quality decide whether a “8% net” brochure survives winter. Site (HOA) fees on new compounds are a second mortgage.',
        'Tapu is still tapu. Off-plan should be notary-backed with a permit trail, not a Telegram invoice. sivrce will not invent inventory to fill the beach photos.',
      ],
      [
        { q: 'Residence permit with a house?', a: 'Possible under current immigration rules, with conditions. It is not automatic with every tapu.', },
        { q: 'Safer than Istanbul seismically?', a: 'Different fault map, not zero risk. Ask for the building’s code year and DASK either way.' },
      ],
    ),
  },
}
