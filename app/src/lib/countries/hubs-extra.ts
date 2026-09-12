/**
 * Country hubs + city briefings for every market outside DE/AE.
 *
 * House rule: a city page exists only when there is something true and local
 * to say on it — the statute, the tax authority, the geological or insurance
 * risk, the district split. No template with a swapped place name.
 * Rates quoted here are cross-checked against lib/countries/costs.ts.
 */

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

function city(
  name: string,
  lede: string,
  body: string[],
  faqs: CountryCopy['faqs'],
  extra?: { buy: CountryCopy; rent: CountryCopy },
): CityPack {
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
    ...extra,
  }
}

/**
 * Buy/rent split for a market's flagship city. Only these seven carry one:
 * the hero's For sale / For rent tabs link here, and MARKETS.intentCities
 * must list exactly the cities that have both (enforced by country-copy.check).
 */
function intent(
  kind: 'Buy' | 'Rent',
  name: string,
  title: string,
  description: string,
  lede: string,
  body: string[],
  faqs: CountryCopy['faqs'],
): CountryCopy {
  return { title, description, h1: `${kind} in ${name}`, lede, body, faqs }
}

export const EXTRA_NAMES = {
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  gb: 'United Kingdom',
  us: 'United States',
  ca: 'Canada',
  tr: 'Turkey',
  gr: 'Greece',
  cy: 'Cyprus',
  nl: 'Netherlands',
  pt: 'Portugal',
  ch: 'Switzerland',
  jp: 'Japan',
  cn: 'China',
  au: 'Australia',
  br: 'Brazil',
  mx: 'Mexico',
  sg: 'Singapore',
  hk: 'Hong Kong',
  kr: 'South Korea',
  in: 'India',
  th: 'Thailand',
  id: 'Indonesia',
  ph: 'Philippines',
  vn: 'Vietnam',
  my: 'Malaysia',
  sa: 'Saudi Arabia',
  ng: 'Nigeria',
  eg: 'Egypt',
  za: 'South Africa',
  ke: 'Kenya',
  ma: 'Morocco',
  pl: 'Poland',
  cz: 'Czech Republic',
  hu: 'Hungary',
  ro: 'Romania',
  bg: 'Bulgaria',
  rs: 'Serbia',
  hr: 'Croatia',
  se: 'Sweden',
  no: 'Norway',
  dk: 'Denmark',
  fi: 'Finland',
  at: 'Austria',
  be: 'Belgium',
  ie: 'Ireland',
  nz: 'New Zealand',
  co: 'Colombia',
  cl: 'Chile',
  ar: 'Argentina',
  pe: 'Peru',
  ec: 'Ecuador',
  pk: 'Pakistan',
  bd: 'Bangladesh',
  lk: 'Sri Lanka',
  np: 'Nepal',
  kh: 'Cambodia',
  mm: 'Myanmar',
  la: 'Laos',
  uz: 'Uzbekistan',
  kz: 'Kazakhstan',
  am: 'Armenia',
  az: 'Azerbaijan',
  ua: 'Ukraine',
  ee: 'Estonia',
  lt: 'Lithuania',
  lv: 'Latvia',
  is: 'Iceland',
  mt: 'Malta',
  lu: 'Luxembourg',
  sk: 'Slovakia',
  si: 'Slovenia',
} as const

export const EXTRA_HUBS: Record<keyof typeof EXTRA_NAMES, CountryCopy> = {
  fr: hub(
    'France real estate — Paris, Lyon & four more metros | sivrce',
    'Buying and renting in France: notaire, ~7% acquisition costs on an existing home, DPE lettings bans and encadrement des loyers. Six city guides.',
    'Real estate in France',
    'A French purchase is a two-contract notarial process, not a portal checkout. Budget roughly 7% on top of the price for an existing home — most of it departmental tax, not the notaire\'s fee. sivrce opens with six metros: Paris, Lyon, Marseille, Bordeaux, Nice and Toulouse.',
    [
      'The compromis de vente locks the deal; the acte authentique at the notaire transfers title weeks later. Residential buyers get a ten-day statutory cooling-off under the loi SRU. Diagnostics — DPE, asbestos, lead, électricité — sit in the file before you wire a deposit.',
      'Paris, Lyon, Bordeaux, Lille, Montpellier and Marseille apply encadrement des loyers: a reference rent per square metre that a new lease can only exceed with a justified supplement. Separately, the DPE is now a rentability test — class G has been barred from new lettings since 2025 and F follows in 2028.',
      'sivrce.com/fr is the canonical France URL. Listings publish only when we can verify them to the same standard as Georgia.',
    ],
    [
      {
        q: 'Can a non-resident buy in France?',
        a: 'Yes. You will need a French settlement path and a notaire. There is no nationality ban on ordinary residential freehold, and no extra foreigner transfer tax.',
      },
      {
        q: 'Are the frais de notaire really the notaire\'s fee?',
        a: 'Mostly not. On an existing home roughly 5.8 points of the ~7% are droits de mutation collected for the département and commune; the notaire\'s own émoluments are under 1%. New-build is nearer 2–3% because VAT is already inside the price.',
      },
      {
        q: 'Why is the path /fr and not /france?',
        a: 'ISO-3166 country codes keep one URL per market. France is sivrce.com/fr.',
      },
    ],
  ),
  es: hub(
    'Spain real estate — Madrid, Barcelona & four more | sivrce',
    'Buying in Spain: ITP by región (6% Madrid, 10% Catalonia), IVA plus AJD on new-build, NIE and nota simple. Six city guides, not a scraped feed.',
    'Real estate in Spain',
    'Spain splits transfer tax by asset and by región: a resale usually pays ITP — 6% in Madrid, 7% in Andalucía, 10% in Catalonia and Valencia — while a new-build from a developer pays IVA plus AJD instead. The nota simple is the first document, not the brochure. Six metros open: Madrid, Barcelona, Valencia, Málaga, Seville and Alicante.',
    [
      'Non-residents buy freely in most residential stock. Golden-visa-by-property was shut in 2025 — do not underwrite residency on a purchase. An NIE number and a Spanish settlement account are still the practical path to the deed.',
      'Rental and tourist-licence rules are regional and increasingly municipal. Catalonia applies the zonas tensionadas caps; most of Andalucía does not. Barcelona, Valencia, Málaga and Seville have all tightened or frozen new tourist licences. Assume no licence until you hold one.',
      'Comunidad fees, IBI and plusvalía municipal sit outside the headline price. Charges and embargoes travel with the property, not the seller — which is why the nota simple comes before the deposit.',
    ],
    [
      {
        q: 'ITP or IVA?',
        a: 'Resale homes pay ITP at the regional rate. A new-build bought from a developer pays IVA (10% residential) plus stamp duty (AJD, typically 0.5–1.5% regionally). Your notario files the deed either way.',
      },
      {
        q: 'How much does the región actually change the bill?',
        a: 'On a €300,000 flat, Madrid\'s 6% ITP is €18,000 and Catalonia\'s 10% is €30,000 — the same purchase, €12,000 apart, before any other cost.',
      },
      {
        q: 'Is sivrce.com/es a copy of the Georgian site?',
        a: 'No. Currency is EUR, law is Spanish, and every page is written for Spain. Georgia stays on sivrce.ge.',
      },
    ],
  ),
  it: hub(
    'Italy real estate — Rome, Milan & four more metros | sivrce',
    'Buying in Italy: notaio, imposta di registro on the cadastral rendita, prima casa relief, IMU and condominio. Six city guides.',
    'Real estate in Italy',
    'An Italian sale completes in front of a notaio who reads the deed and files the transcription. On a resale between private parties the registration tax is charged on the cadastral value under prezzo-valore, not on what you actually pay — 9% for a second home, 2% under prima casa relief. Six metros open: Rome, Milan, Florence, Turin, Naples and Bologna.',
    [
      'Foreigners can buy ordinary residential property. Budget notaio, agency (commonly 3% plus 22% IVA from each side unless agreed otherwise), and registration tax. Prima casa is for people who move their residenza within eighteen months — a holiday buyer does not get it by default.',
      'Milan prices off finance and employment; Rome prices off scarcity inside the GRA and a slow possession calendar; Naples prices off a geology file that the other two do not have. IMU, TARI and condominio arrears change the real yield — arrears follow the flat, not the seller.',
      'Canonical URL is sivrce.com/it. Inventory publishes only when verified.',
    ],
    [
      {
        q: 'Do I need an Italian tax code?',
        a: 'Yes, a codice fiscale, before the deed. The notaio will not complete without it, and you will need it for the utilities and the IMU filing afterwards.',
      },
      {
        q: 'What is prezzo-valore and why does it matter?',
        a: 'On a resale between private individuals you can elect to have registration tax computed on the cadastral value instead of the price. That base is usually well below the market price, which is why the headline 9% overstates the real bill.',
      },
      {
        q: 'Is /it Italian language or Italy the country?',
        a: 'On sivrce.com, /it is Italy. Georgian-site locales live on sivrce.ge.',
      },
    ],
  ),
  gb: hub(
    'UK real estate — London, Manchester, Edinburgh & more | sivrce',
    'Buying in the UK: SDLT in England, LBTT in Scotland, solicitors not notaries, freehold vs leasehold. Six city guides. /uk redirects to /gb.',
    'Real estate in the United Kingdom',
    'The UK is not one transaction. England and Northern Ireland use solicitors, SDLT slice bands and an exchange of contracts; Scotland uses LBTT, an 8% additional-dwelling supplement and missives that bind earlier. sivrce uses /gb — the ISO code — so /uk never collides with the Ukrainian locale on sivrce.ge. Six metros open, four English and two Scottish.',
    [
      'Leasehold flats are a different product from freehold houses: ground rent, service charge and a term that shortens every year. Since 2017 the cladding and EWS1 files have repriced whole buildings — the building safety pack is not optional reading.',
      'In England an offer binds nobody until exchange, so gazumping is legal and the survey comes before the celebration. Non-resident buyers pay a 2% SDLT surcharge on top of the standard bands; an additional dwelling adds a further 5% on the whole price. Scotland has no non-resident surcharge but its ADS is 8%.',
      'The Renters\' Rights Act ends assured shorthold fixed terms and section 21 no-fault eviction in England — possession now runs through stated statutory grounds. Underwrite that, not a 2019 landlord blog.',
    ],
    [
      {
        q: 'Why /gb not /uk?',
        a: 'ISO-3166-1 alpha-2 for the United Kingdom is GB. /uk is a Ukrainian locale on sivrce.ge, so the country path cannot be /uk. Type /uk on sivrce.com and it 308s to /gb.',
      },
      {
        q: 'How much extra does an overseas buyer pay?',
        a: 'In England and Northern Ireland, a 2% non-resident SDLT surcharge on the whole price, plus the 5% additional-dwelling surcharge if this will not be your only home. Scotland charges no non-resident surcharge but applies 8% ADS on an additional dwelling.',
      },
      {
        q: 'Is Scotland really a different system?',
        a: 'Yes. Different tax (LBTT), different conveyancing (missives), different letting regime (short-term let licensing since 2023). Edinburgh is not London with a different accent.',
      },
    ],
  ),
  us: hub(
    'US real estate — New York, Miami, LA, Chicago & more | sivrce',
    'Buying in the US: title insurance, city-level transfer taxes, HOA and insurance underwriting, FIRPTA for foreign sellers. Six metro guides.',
    'Real estate in the United States',
    'There is no US-wide property code. A New York co-op board, a Miami condo insurance file and an Austin property-tax bill are three different machines wearing one flag. Title insurance is normal; a continental notaire is not. sivrce opens six metros — New York, Miami, Los Angeles, Chicago, Austin and Seattle — because that is where the foreign-buyer questions actually land.',
    [
      'Foreign buyers can hold fee simple everywhere on this list, with no federal restriction and no Social Security number required to take title. FIRPTA withholds on foreign sellers, not on buyers. Buyer-agent compensation is negotiated in writing since the 2024 NAR settlement rather than assumed from the listing.',
      'Transfer tax is a city question. New York adds a buyer-side mansion tax above $1m; Chicago charges the buyer 0.75%; Texas charges nothing and collects it back annually in one of the highest effective property-tax rates in the country. Seattle and Los Angeles put the transfer tax on the seller instead.',
      'HOA and condo documents are the yield, and insurance is the variable that reprices a building overnight — Florida wind and flood, California wildfire and the FAIR Plan. Do not import Georgian cadastre habits: the US runs on county records and title plants.',
    ],
    [
      {
        q: 'Do I need a US Social Security number to buy?',
        a: 'No. You need a closing attorney or title company, a way to wire cleared funds, and an ITIN later if you rent the property out. The deed does not require an SSN.',
      },
      {
        q: 'Which costs actually hit the buyer?',
        a: 'Title insurance, lender and escrow fees, recording and prepaids — roughly 1.5–2% — plus whatever transfer tax your city puts on the buyer side. The seller\'s costs, including the brokerage fee, are a separate ledger.',
      },
      {
        q: 'Is this Zillow for the whole country?',
        a: 'No. It is a sivrce country hub with unique per-metro copy. The live Georgian catalog stays on sivrce.ge.',
      },
    ],
  ),
  ca: hub(
    'Canada real estate — Toronto, Vancouver, Montréal & more | sivrce',
    'Buying in Canada: provincial land transfer tax, Toronto\'s double levy, Alberta\'s none, FINTRAC KYC and condo reserve funds. Six city guides.',
    'Real estate in Canada',
    'Canada devolves the transaction to the province. Toronto stacks a municipal land transfer tax on the Ontario one; Alberta charges no transfer tax at all; Québec closes in front of a notaire under civil law. sivrce opens Toronto, Vancouver, Montréal, Calgary, Ottawa and Edmonton — six metros, not one maple-leaf doorway.',
    [
      'Land transfer tax is banded, so the effective rate depends on the price: inside the City of Toronto the two levies together land near 4% at the million-dollar mark, while a Calgary closing pays registration fees measured in hundreds of dollars. Budget the statute that applies on your closing date, not the one from a 2021 forum post.',
      'Title is land-titles based and reliable; the risk sits in the building. A condo reserve-fund study or a BC depreciation report outranks every projection in the brochure, and a special assessment can arrive the month after closing. Pre-construction assignments are their own contract file.',
      'Non-resident rules have flipped more than once between federal prohibitions and provincial surtaxes, and empty-home taxes now apply in Vancouver, Toronto and across Metro Vancouver. FINTRAC source-of-funds checks are slow on purpose.',
    ],
    [
      {
        q: 'Can a non-resident buy in Toronto?',
        a: 'Check the federal prohibition in force and the Ontario non-resident speculation tax before you fly. The rule set has changed more than once and this page will not pretend a frozen yes.',
      },
      {
        q: 'Why is Alberta so much cheaper to close?',
        a: 'Alberta levies no land transfer tax and no provincial sales tax — you pay land titles registration fees instead. On a $900,000 purchase that is a five-figure difference against Toronto.',
      },
      {
        q: 'CAD not USD?',
        a: 'Canada prices in Canadian dollars. sivrce.ge listings stay GEL/USD. Do not mix the two catalogs.',
      },
    ],
  ),
  tr: hub(
    'Turkey real estate — Istanbul, Antalya, İzmir & more | sivrce',
    'Buying in Turkey: tapu title deed, 4% deed fee, DASK earthquake cover, military-zone checks and building code year. Six city guides.',
    'Real estate in Turkey',
    'Title is the tapu, and the sale happens at the land registry — not at the reservation form. The deed fee is 4% of the declared value, legally split but in practice usually carried by the buyer. DASK earthquake cover is compulsory and the building\'s code year is first-class due diligence. On sivrce.com, /tr is Turkey; on sivrce.ge, /tr is the Turkish-language Georgia UI. Same letters, different host.',
    [
      'Istanbul, Ankara, İzmir and Bursa are employment markets that price in lira and rent on twelve-month CPI-linked contracts. Antalya and Bodrum are second-home and residence-permit coasts with a seasonal book and site (HOA) fees that behave like a second mortgage. They do not share a spreadsheet.',
      'Some parcels still require a military-zone clearance before a foreigner can complete, and foreign-ownership quotas apply per district. Under-declaring the deed value to shave the 4% fee is tax fraud and it caps your future capital-gains base.',
      'Citizenship-by-investment thresholds move by government circular. Treat a developer\'s "passport included" slide as marketing until the official gazette agrees, and insist that off-plan sits on a notarised contract with a building permit trail.',
    ],
    [
      {
        q: 'Is sivrce.com/tr the Turkish translation of sivrce.ge?',
        a: 'No. sivrce.ge/tr is Georgian inventory in Turkish. sivrce.com/tr is the Turkey country market in English.',
      },
      {
        q: 'Can foreigners get tapu?',
        a: 'Yes in most residential zones, with exceptions around military areas and some village land, plus a per-district foreign-ownership quota. The land-registry appointment is the close.',
      },
      {
        q: 'How exposed is the building to earthquake risk?',
        a: 'Ask for the construction year against the 1999, 2007 and 2018 code revisions, the DASK policy, and any urban-transformation (kentsel dönüşüm) status. A cheap older carcass is not a bargain.',
      },
    ],
  ),
  gr: hub(
    'Greece real estate — Athens & Thessaloniki | sivrce',
    'Buying in Greece: notary, 3.09% transfer tax, Ktimatologio title and the three-year lease. Athens and Thessaloniki guides.',
    'Real estate in Greece',
    'A Greek purchase closes at the notary with a 3.09% transfer tax on the assessed value — not a portal checkout. sivrce opens with Athens and Thessaloniki: two metros, one national deed, and a Golden Visa that repriced by zone in 2024.',
    [
      'The sale deed is signed before a symvolaiográfos, and title is only safe once the Ktimatologio cadastre shows your name. Objective (tax-assessed) values often sit below the agreed price, which is why the 3.09% applies to a number you did not negotiate.',
      'New-build from a developer may carry 24% VAT instead of transfer tax under repeatedly extended suspension schemes — confirm which regime your unit falls in. Lawyers are optional in Greek law and standard practice for foreign buyers, at around 1%.',
      'Golden Visa thresholds rose in September 2024 and now run €250,000 to €800,000 by municipality. sivrce.com/gr is the canonical Greece URL. Listings publish only when we can verify them to the same standard as Georgia.',
    ],
    [
      {
        q: 'Can a non-resident buy in Greece?',
        a: 'Yes. There is no nationality ban on ordinary residential property. You need a Greek tax number (AFM), a settlement account and a notary; most foreign buyers add a lawyer.',
      },
      {
        q: 'Transfer tax or VAT?',
        a: 'Resale pays 3.09% transfer tax on the assessed value. New-build may attract 24% VAT instead, depending on the permit date and the current suspension — ask which regime applies before you compare prices.',
      },
      {
        q: 'Why is the path /gr not /greece?',
        a: 'ISO-3166 country codes keep one URL per market. Greece is sivrce.com/gr.',
      },
    ],
  ),
  cy: hub(
    'Cyprus real estate — Nicosia & Limassol | sivrce',
    'Buying in Cyprus: District Lands Office, halved transfer fees on resale, title-deed diligence and the non-EU permit. Nicosia and Limassol guides.',
    'Real estate in Cyprus',
    'Cyprus sells at the District Lands Office, where resale transfer fees are permanently halved and VAT-charged new builds pay zero. sivrce opens with Nicosia and Limassol — an inland capital and a coastal second-home market that share a fee scale and almost nothing else.',
    [
      'The statute reads 3/5/8% on the Lands Office assessed value, but a resale pays half of that and a new build that attracted VAT pays nothing. Stamp duty was abolished in January 2026. Fees fall due when the title transfers — which, on a new build, can be years after you move in.',
      'The title deed is the whole transaction in Cyprus. Developments have a long history of selling before separate titles exist, so the diligence is the title: a separate title in hand, or the contract deposited at the Lands Office within six months for Specific Performance protection. Never pay in full without one of the two.',
      'Non-EU buyers need Council of Ministers permission — routinely granted for one residential unit, but a step with its own timeline. EU buyers do not. sivrce.com/cy is the canonical Cyprus URL, and listings publish only when verified like Georgia.',
    ],
    [
      {
        q: 'Do I pay transfer fees on a new build?',
        a: 'No, where VAT was charged — the exemption is total. Resales pay the 3/5/8% scale halved. Confirm which side of that line your unit sits on before you budget.',
      },
      {
        q: 'Can a non-EU citizen buy in Cyprus?',
        a: 'Yes, normally one residential unit with Council of Ministers permission, which is routinely granted but takes time. Start the application with your advocate; do not treat the sale contract as the permission.',
      },
      {
        q: 'Why is the path /cy?',
        a: 'ISO-3166 country codes keep one URL per market. Cyprus is sivrce.com/cy.',
      },
    ],
  ),
  nl: hub(
    'Netherlands real estate — Amsterdam & Rotterdam | sivrce',
    'Buying in the Netherlands: notaris, 2% transfer tax for residents (10.4% investors), Kadaster and the WWS points system. Amsterdam and Rotterdam guides.',
    'Real estate in the Netherlands',
    'Every Dutch sale closes at the notaris and lands in the Kadaster — but the transfer tax is two markets in one: 2% for qualifying residents, 10.4% for investors. sivrce opens with Amsterdam and Rotterdam under the same statute at very different prices.',
    [
      'The notaris drafts the deed, holds the funds and registers the title; without that registration you do not own the flat. Qualifying residents — including first-home buyers under 35, who may pay 0% up to an indexed ceiling — close near 3% all-in. Investors close above 11%.',
      'The seller pays the makelaar; a buyer\'s agent (aankoopmakelaar) is optional and paid by the buyer when engaged. Bidding above asking with conditions waived is common in Amsterdam and a risk decision, not a custom you must follow.',
      'Rent is a points system as much as a market: WWS points decide whether a home is regulated with a legal maximum or liberalized. Open-ended contracts are the default since July 2024. sivrce.com/nl is the canonical Netherlands URL.',
    ],
    [
      {
        q: 'Can a non-resident buy in the Netherlands?',
        a: 'Yes. There is no nationality restriction on residential property. Expect the 10.4% investor transfer tax unless you will genuinely occupy, plus Dutch-bank KYC that is slow on purpose.',
      },
      {
        q: 'What does the WWS points system change?',
        a: 'Whether the rent has a legal ceiling. Below the liberalization threshold the maximum rent follows the points score — the advert\'s number is challengeable at the Huurcommissie.',
      },
      {
        q: 'Why is the path /nl?',
        a: 'ISO-3166 country codes keep one URL per market. The Netherlands is sivrce.com/nl.',
      },
    ],
  ),
  pt: hub(
    'Portugal real estate — Lisbon & Porto | sivrce',
    'Buying in Portugal: escritura, sliced IMT plus 0.8% stamp duty, NIF and the AL licence freeze. Lisbon and Porto guides.',
    'Real estate in Portugal',
    'Portugal taxes the purchase in slices — IMT on the higher of price and VPT, plus 0.8% stamp duty — and closes it at the escritura. sivrce opens with Lisbon and Porto: the same IMT code, different licence maps and different buyers.',
    [
      'The schedule most foreign buyers fall in is Table III, the investment table taxed from the first euro; a primary-residence buyer uses a gentler table exempt to €106,346 in 2026, and first-home buyers under 35 are exempt to €330,539. Above roughly €634k a 6% flat rate replaces the slices.',
      'You need a NIF before the deed and a fiscal representative if you are non-EU. Charges travel with the property, so the land-registry certificate (certidão) comes before the deposit — the Portuguese cousin of the Spanish nota simple.',
      'Alojamento Local is commune politics: Lisbon and Porto froze new licences in containment zones, and the freeze is the model for any short-let arithmetic. sivrce.com/pt is the canonical Portugal URL.',
    ],
    [
      {
        q: 'Is there still a Golden Visa for buying a house?',
        a: 'Not for residential purchases — that route was removed in 2023. Fund and other routes continue; the flat must stand on its own yield.',
      },
      {
        q: 'IMT or stamp duty — which hurts more?',
        a: 'IMT, by an order of magnitude: on a €350,000 investment purchase it is about €15,300 against €2,800 of stamp duty. Both fall on the buyer before the deed.',
      },
      {
        q: 'Why is the path /pt?',
        a: 'ISO-3166 country codes keep one URL per market. Portugal is sivrce.com/pt.',
      },
    ],
  ),
  ch: hub(
    'Switzerland real estate — Zurich & Geneva | sivrce',
    'Buying in Switzerland: Lex Koller permits, cantonal notary, no Zurich transfer tax (~3% Geneva) and reference-rate rents. Zurich and Geneva guides.',
    'Real estate in Switzerland',
    'Switzerland is the tightest foreign-buyer regime on this site: Lex Koller permits, cantonal notaries and 26 rulebooks behind one franc. sivrce opens with Zurich and Geneva — the same currency, different cantons, different transactions.',
    [
      'Buyers without Swiss residence or establishment need cantonal authorization inside federal quotas, and some cantons add their own restrictions on top. EU/EFTA residents buying a main home are largely outside the permit; holiday flats and pure investments are inside it.',
      'Closing costs are cantonal: Zurich levies no transfer tax at all — registry fees only — while Geneva charges around 3% in cantonal and communal duties. Notary scales are cantonal too. One national average would be a number nobody pays.',
      'Rents track the federal reference mortgage rate, deposits cap at three months in a blocked account, and Geneva and Vaud require the official form for the initial rent and every increase. Lex Weber caps second homes at 20% per commune. sivrce.com/ch is the canonical Switzerland URL.',
    ],
    [
      {
        q: 'Can a foreigner buy in Switzerland?',
        a: 'Sometimes, with permission. A main home for a resident is straightforward; a holiday flat or an investment by a non-resident needs Lex Koller authorization inside quota — start with the canton, not the listing.',
      },
      {
        q: 'Why is Zurich cheaper to close than Geneva?',
        a: 'Zurich abolished its transfer tax; Geneva charges about 3%. Same franc, different canton, different cash at the notary.',
      },
      {
        q: 'Why is the path /ch?',
        a: 'ISO-3166 (Confoederatio Helvetica). Switzerland is sivrce.com/ch.',
      },
    ],
  ),
  jp: hub(
    'Japan real estate — Tokyo, Osaka & more | sivrce',
    'Buying in Japan: shoken koken tax, registration and license tax, 3% agent fee and the fixed-term lease system. Tokyo and Osaka guides.',
    'Real estate in Japan',
    'Japan uses a fixed-term building lease (shakuchi/shakka) alongside freehold, and a yen-denominated market that foreign buyers can enter without restriction. sivrce opens with Tokyo and Osaka — two metros, one legal system, very different yields.',
    [
      'Acquisition taxes are modest: 1–3% of assessed value for residential land and buildings, plus registration and license tax around 2%. Agent fees are legally capped at 3% plus consumption tax. The total closing cost is roughly 6–8%.',
      'Japan has no foreign-buyer restrictions and no capital-gains tax for non-residents selling after five years of ownership. The yen\'s weakness against the dollar makes entry attractive, but the exit yield must still pencil in yen.',
      'sivrce.com/jp is the canonical Japan URL. Listings publish only when we can verify them to the same standard as Georgia.',
    ],
    [
      {
        q: 'Can a non-resident buy in Japan?',
        a: 'Yes, with no restrictions. You need a registered seal (hanko) or a notarised signature, a Japanese bank account for ongoing costs, and a path for inheritance planning.',
      },
      {
        q: 'Is Tokyo property a good investment?',
        a: 'Central Tokyo offers 3–5% gross yields on residential, lower than emerging markets but backed by stable demand and limited new supply. Currency risk is the variable to model.',
      },
    ],
  ),
  cn: hub(
    'China real estate — Shanghai, Beijing & more | sivrce',
    'Buying in China: hukou restrictions, 70-year land-use rights, deed tax and the pre-sale escrow. Shanghai, Beijing and Shenzhen guides.',
    'Real estate in China',
    'China\'s residential market runs on 70-year land-use rights issued by the state, not freehold title in the Western sense. sivrce opens with Shanghai, Beijing, Guangzhou and Shenzhen — four tier-1 cities, one legal framework, very different buyer profiles.',
    [
      'Foreign buyers face purchase limits: one residential unit per person, typically occupied for at least one year, and mostly restricted to cities where you have worked or studied for over a year. The rules vary by city and tighten without notice.',
      'Deed tax is 1–3% depending on area and whether it is a first home. The developer\'s pre-sale licence and escrow arrangement are critical — pre-sale payments sit in a regulated account, not the developer\'s general funds.',
      'sivrce.com/cn is the canonical China URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Shanghai?',
        a: 'Yes, with restrictions: one unit, typically requiring one year of documented work or study in the city. The rules change by municipal notice.',
      },
      {
        q: 'What is the 70-year land-use right?',
        a: 'Residential land is granted by the state for 70 years. In practice renewals have been routine, but the legal framework is still evolving. The building sits on the right, not under freehold title.',
      },
    ],
  ),
  au: hub(
    'Australia real estate — Sydney, Melbourne & more | sivrce',
    'Buying in Australia: stamp duty by state, FIRB approval for foreigners, strata title and the auction system. Sydney and Melbourne guides.',
    'Real estate in Australia',
    'Australia devolves property transaction to the state. Sydney and Melbourne apply different stamp-duty scales, FIRB approval is required for foreign buyers, and strata title governs most apartments. sivrce opens with Sydney, Melbourne, Brisbane and Perth.',
    [
      'Foreign buyers need FIRB approval before signing a contract, pay a foreign-buyer surcharge on stamp duty (8% in NSW, 8% in Victoria), and face a vacancy fee if the property is left empty. The total premium over a local buyer is significant.',
      'Stamp duty is the big closing cost: in NSW it scales from 1.25% to 7% above $3.5m; in Victoria the rate is lower but the full land tax is charged on investment properties. Budget the state where you close, not a national average.',
      'sivrce.com/au is the canonical Australia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Australia?',
        a: 'Yes, with FIRB approval and a foreign-buyer surcharge. New-build is generally easier to obtain than established property. Apply before you sign, not after.',
      },
      {
        q: 'Is the auction system risky?',
        a: 'At auction you are legally bound with no cooling-off period. Do your building and pest inspection before auction day, not after.',
      },
    ],
  ),
  br: hub(
    'Brazil real estate — São Paulo, Rio & more | sivrce',
    'Buying in Brazil: cartório deed, ITBI transfer tax, CPF and the condômino regime. São Paulo and Rio guides.',
    'Real estate in Brazil',
    'Brazil closes at the cartório (notary) and records the deed publicly. Transfer tax (ITBI) is typically 2–3%, and condominium charges (condômino) are a real yield variable. sivrce opens with São Paulo, Rio de Janeiro, Brasília and Curitiba.',
    [
      'Foreign buyers need a CPF (tax ID) and a Brazilian bank account. There are no nationality restrictions on urban residential property, though border areas and rural land require additional authorization.',
      'ITBI varies by municipality: São Paulo charges 3%, Rio 2%. The notary fees are regulated and modest. The real cost differential is in the condominium regime and the building\'s reserve fund.',
      'sivrce.com/br is the canonical Brazil URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in São Paulo?',
        a: 'Yes, with a CPF and a Brazilian bank account. There are no nationality restrictions on urban residential property.',
      },
      {
        q: 'What is ITBI?',
        a: 'Imposto sobre Transmissão de Bens Imóveis — the municipal transfer tax, typically 2–3% of the declared value, payable at closing.',
      },
    ],
  ),
  mx: hub(
    'Mexico real estate — Mexico City, Cancún & more | sivrce',
    'Buying in Mexico: notario, 2–5% acquisition tax (ISAI), fideicomiso for coastal zones and the escrow system. Mexico City and Riviera Maya guides.',
    'Real estate in Mexico',
    'Mexico closes before a notario público and records the deed in the Registro Público de la Propiedad. Acquisition tax (ISAI) ranges from 2–5% by municipality, and a fideicomiso (bank trust) is required for coastal and border-zone properties. sivrce opens with Mexico City, Guadalajara, Monterrey, Cancún and Playa del Carmen.',
    [
      'Coastal and border-zone property requires a fideicomiso: a bank trust that gives the foreign buyer beneficial ownership for 50-year renewable terms. The trust fee is modest (roughly $500–1,000/year) but it is a permanent cost.',
      'ISAI rates vary by municipality: Mexico City charges 2–3% on a sliding scale; Cancún and Riviera Maya municipalities apply 2.5%. The notario\'s fee is regulated and typically 1–2%.',
      'sivrce.com/mx is the canonical Mexico URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Do I need a fideicomiso?',
        a: 'Yes, if the property is in a coastal or border zone (the restricted zone). Inland property can be held directly, but many foreign buyers use a fideicomiso everywhere for simplicity.',
      },
      {
        q: 'Can a foreigner own outright in Mexico?',
        a: 'Inland, yes — direct ownership. In the restricted zone (100km from the coast, 50km from a border), a fideicomiso bank trust is required.',
      },
    ],
  ),
  sg: hub(
    'Singapore real estate | sivrce',
    'Buying in Singapore: ABSD, BSD, the Additional Buyer\'s Stamp Duty that repriced the market, and the 99-year leasehold norm.',
    'Real estate in Singapore',
    'Singapore is a city-state where property tax is an instrument of housing policy. ABSD (Additional Buyer\'s Stamp Duty) hits foreign buyers at 60%, BSD (Buyer\'s Stamp Duty) adds 1–6% in slices, and 99-year leasehold is the norm for most private housing. sivrce opens with Singapore — one city, one land authority.',
    [
      'Foreign buyers pay 60% ABSD on residential property as of April 2023 — the highest in the world and the single largest cost in any transaction. Singapore citizens pay 0% on their first property. The differential is the policy.',
      'Most private housing is 99-year leasehold, with freehold commanding a significant premium. Lease decay is a real valuation factor: a 60-year remaining lease is not a 99-year lease at a discount.',
      'sivrce.com/sg is the canonical Singapore URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Singapore?',
        a: 'Yes, with 60% ABSD. Permanent residents pay 5%. The tax is the barrier, not the law.',
      },
      {
        q: 'Is 99-year leasehold a problem?',
        a: 'For the first 60 years, minimal impact. After that, lease decay affects financing, resale value and en-bloc potential. Budget the remaining term.',
      },
    ],
  ),
  hk: hub(
    'Hong Kong real estate | sivrce',
    'Buying in Hong Kong: BSD for non-permanent residents, stamp duty, and the super-premium Central market. One city, one market.',
    'Real estate in Hong Kong',
    'Hong Kong is among the world\'s most expensive property markets. Buyer\'s Stamp Duty (BSD) adds 15% for non-permanent residents, stamp duty scales up to 4.25%, and Central district commands some of the highest prices globally. sivrce opens with Hong Kong.',
    [
      'Non-permanent residents pay 15% BSD on top of the standard stamp duty — a deliberate cooling measure. The total acquisition cost for a foreign buyer can exceed 20% of the purchase price.',
      'Most private housing is leasehold with 50–99 year terms, though some older buildings sit on freehold or perpetual Crown leases. The remaining term is a key valuation factor.',
      'sivrce.com/hk is the canonical Hong Kong URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Hong Kong?',
        a: 'Yes, with 15% BSD. There is no nationality restriction, just the tax.',
      },
      {
        q: 'Is Central worth the premium?',
        a: 'Central commands Hong Kong\'s highest prices and lowest yields. For investment, look at Kowloon New Town or the New Territories for better yield-to-price.',
      },
    ],
  ),
  kr: hub(
    'South Korea real estate — Seoul & more | sivrce',
    'Buying in South Korea: jeonse deposit system, acquisition tax, the housing price ceiling zones and the real-name registration. Seoul and Busan guides.',
    'Real estate in South Korea',
    'South Korea\'s jeonse system lets tenants lend a large deposit to a landlord in lieu of monthly rent — a unique capital structure. Acquisition tax ranges from 1–3%, and Seoul applies housing-price ceiling zones that cap valuations. sivrce opens with Seoul, Busan and Incheon.',
    [
      'Jeonse is a deposit, not rent: the tenant lends the landlord a lump sum (typically 50–80% of the property value) and gets it back at lease end. The landlord invests the capital; the tenant avoids monthly rent. If the landlord defaults, the tenant has priority claims.',
      'Acquisition tax is 1–3% depending on property value and whether it is a first home. Seoul\'s housing-price ceiling zones (ghanji jeonggi) restrict mortgage lending and can cap resale prices.',
      'sivrce.com/kr is the canonical South Korea URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'What is jeonse?',
        a: 'A deposit-based lease: the tenant gives the landlord a lump sum (50–80% of property value) instead of paying monthly rent. The deposit is returned at lease end. The landlord uses the capital; the tenant avoids rent.',
      },
      {
        q: 'Can a foreigner buy in Seoul?',
        a: 'Yes, with real-name registration and a Korean bank account. There are no nationality restrictions on residential property.',
      },
    ],
  ),
  in: hub(
    'India real estate — Mumbai, Delhi & more | sivrce',
    'Buying in India: stamp duty, registration, RERA and the escrow requirement. Mumbai, Delhi, Bangalore and Chennai guides.',
    'Real estate in India',
    'India\'s property market is governed by state-level stamp duty (5–7%), RERA registration requirements, and an escrow system that holds buyer payments until construction milestones. sivrce opens with Mumbai, Delhi, Bangalore, Chennai, Kolkata and Hyderabad.',
    [
      'Stamp duty ranges from 5–7% depending on the state, plus a 1% registration fee. RERA (Real Estate Regulation and Development Act) requires developers to escrow 70% of project funds and deliver on time or face penalties.',
      'Foreign buyers need RBI approval and face restrictions on most residential property. NRI/PIO buyers have easier access. The market is overwhelmingly domestic.',
      'sivrce.com/in is the canonical India URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in India?',
        a: 'Non-residents face significant restrictions. NRIs and PIOs can buy residential property freely. Other foreign nationals need RBI approval.',
      },
      {
        q: 'What is RERA?',
        a: 'The Real Estate Regulation and Development Act: mandatory project registration, escrow of 70% of buyer funds, and penalties for delays. It is the primary buyer-protection law.',
      },
    ],
  ),
  th: hub(
    'Thailand real estate — Bangkok & more | sivrce',
    'Buying in Thailand: condo freehold for foreigners, the 49% foreign quota, transfer fees and the leasehold structure. Bangkok and Phuket guides.',
    'Real estate in Thailand',
    'Thailand lets foreigners own condo freehold within a 49% foreign quota per building, but restricts land ownership to leasehold or Thai-company structures. sivrce opens with Bangkok, Chiang Mai, Phuket and Pattaya.',
    [
      'Foreign buyers can own condo units freehold — but only within the 49% foreign ownership quota per building. Land and houses require a 30-year lease or a Thai company structure, both with their own risks.',
      'Transfer fees are 2% of appraised value, split between buyer and seller by convention. Specific Business Tax of 3.3% applies if sold within five years. Stamp duty is 0.5% if Specific Business Tax does not apply.',
      'sivrce.com/th is the canonical Thailand URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner own a condo in Bangkok?',
        a: 'Yes, freehold, within the 49% foreign quota per building. Foreign currency remittance must be documented.',
      },
      {
        q: 'Can a foreigner own a house in Thailand?',
        a: 'Not directly. Land requires a 30-year lease (renewable twice by law, though not guaranteed) or a Thai company structure with legal risks.',
      },
    ],
  ),
  id: hub(
    'Indonesia real estate — Jakarta, Bali & more | sivrce',
    'Buying in Indonesia: hak milik vs hak pakai, the 80% foreign ownership condo quota, and the leasehold norm. Jakarta and Bali guides.',
    'Real estate in Indonesia',
    'Indonesia restricts land ownership to Indonesian citizens (hak milik), but foreigners can hold hak pakai (right to use) for up to 80 years and own condo units within a 80% quota. sivrce opens with Jakarta, Surabaya, Bandung, Medan and Bali.',
    [
      'Hak pakai (right to use) is the primary vehicle for foreign buyers of landed property: up to 30 years, extendable to 80. Condo freehold is possible within the 80% foreign-ownership quota per building.',
      'Transfer fees are typically 5–10% of the transaction value, split between buyer and seller. Notary fees are regulated. The process is slower than in most comparable markets.',
      'sivrce.com/id is the canonical Indonesia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner own land in Bali?',
        a: 'Not hak milik (freehold). You can hold hak pakai (right to use) for up to 80 years, or buy a condo within the foreign quota. Leasehold is also common.',
      },
      {
        q: 'What is hak pakai?',
        a: 'Right to use: a tenure type that lets foreigners hold landed property for 30 years, extendable to 80. It is not freehold, but it is the closest equivalent.',
      },
    ],
  ),
  ph: hub(
    'Philippines real estate — Manila & more | sivrce',
    'Buying in Philippines: condo foreign ownership (60/40 rule), the condotel structure and the Philippine condo title. Manila and Cebu guides.',
    'Real estate in Philippines',
    'Philippines lets foreigners own condo units within the 60% Filipino / 40% foreign ownership ratio, but restricts land ownership. Condotels and long-term leases are the alternative. sivrce opens with Manila, Cebu, Davao and Quezon City.',
    [
      'Condo ownership is straightforward for foreigners within the 60/40 ratio. The title is a Condominium Certificate of Title (CCT), not a land title. Land and houses require a Filipino co-owner or a 50-year lease.',
      'Transfer taxes are modest: roughly 2–5% of the property value, split between buyer and seller. The Philippine RE market is active but bureaucratic, and documentation quality varies.',
      'sivrce.com/ph is the canonical Philippines URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner own a condo in Manila?',
        a: 'Yes, within the 60/40 foreign-ownership ratio. The Condominium Certificate of Title (CCT) is in the buyer\'s name.',
      },
      {
        q: 'Can a foreigner own land?',
        a: 'Not directly. Land requires a Filipino co-owner or a 50-year lease renewable for another 25 years.',
      },
    ],
  ),
  vn: hub(
    'Vietnam real estate — Ho Chi Minh City & more | sivrce',
    'Buying in Vietnam: 50-year leasehold condos for foreigners, the quota system and the emerging HCMC market. Ho Chi Minh City, Hanoi and Da Nang guides.',
    'Real estate in Vietnam',
    'Vietnam lets foreigners own condo units for 50 years (renewable once) within a 30% quota per building, but restricts land and houses. sivrce opens with Ho Chi Minh City, Hanoi, Da Nang and Nha Trang.',
    [
      'Foreign buyers can own condos for 50 years, renewable once, within the 30% foreign quota per building. Land and houses are restricted to Vietnamese citizens and Vietnamese-invested companies.',
      'Transfer taxes are modest: 0.5% registration fee, 2% VAT on new-build, and 2% personal income tax on resale (exempt if held over 5 years). The market is fast-growing but bureaucratic.',
      'sivrce.com/vn is the canonical Vietnam URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner own a condo in Ho Chi Minh City?',
        a: 'Yes, for 50 years (renewable once), within the 30% foreign quota per building. Land and houses are restricted.',
      },
      {
        q: 'How long does a purchase take?',
        a: 'Typically 1–3 months for a condo, depending on the developer and the quota availability. Cash purchases are faster.',
      },
    ],
  ),
  my: hub(
    'Malaysia real estate — Kuala Lumpur & more | sivrce',
    'Buying in Malaysia: MM2H visa, Bumiputera quota, the foreigner minimum price and the strata title. Kuala Lumpur, Penang and Johor Bahru guides.',
    'Real estate in Malaysia',
    'Malaysia attracts foreign buyers via the MM2H visa programme, but restricts purchases above a minimum price threshold (typically RM1m) and reserves certain units for Bumiputera buyers. sivrce opens with Kuala Lumpur, George Town, Johor Bahru and Kota Kinabalu.',
    [
      'Foreigners can buy condos above RM1m (varies by state), but not landed property below that threshold. Bumiputera quota units cannot be sold to non-Bumiputera buyers without state consent.',
      'Transfer taxes include stamp duty (1–4% on a sliding scale), legal fees (regulated), and RPGT (Real Property Gains Tax) on disposal. The MM2H visa programme is separate from property ownership.',
      'sivrce.com/my is the canonical Malaysia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Kuala Lumpur?',
        a: 'Yes, condos above RM1m. Landed property below that threshold is restricted to Malaysian citizens.',
      },
      {
        q: 'What is MM2H?',
        a: 'Malaysia My Second Home: a long-term visa programme that lets foreigners reside in Malaysia. It is separate from property ownership, which has its own rules.',
      },
    ],
  ),
  sa: hub(
    'Saudi Arabia real estate — Riyadh & more | sivrce',
    'Buying in Saudi Arabia: Vision 2030, NEOM, the freehold zones and the ejari registration. Riyadh and Jeddah guides.',
    'Real estate in Saudi Arabia',
    'Saudi Arabia is opening its real estate market under Vision 2030, with NEOM as the flagship mega-project. Foreign buyers can own freehold in designated zones. sivrce opens with Riyadh, Jeddah and Dammam.',
    [
      'Foreign buyers can own freehold property in designated areas: NEOM, The Line, parts of Riyadh and Jeddah. Ejari registration is required for rental agreements. The market is transforming rapidly under Vision 2030.',
      'Transfer fees are typically 5% of the property value. No annual property tax, but zakat applies to Saudi-owned entities. The market is primarily domestic.',
      'sivrce.com/sa is the canonical Saudi Arabia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Riyadh?',
        a: 'Yes, in designated freehold zones. The market is opening but still primarily domestic.',
      },
      {
        q: 'What is NEOM?',
        a: 'A $500bn mega-project on the Red Sea coast: The Line (linear city), Oxagon (industrial), Trojena (mountain resort) and Sindalah (island). The flagship of Vision 2030.',
      },
    ],
  ),
  ng: hub(
    'Nigeria real estate — Lagos & more | sivrce',
    'Buying in Nigeria: the Land Use Act, certificate of occupancy and the Lagos property market. Lagos and Abuja guides.',
    'Real estate in Nigeria',
    'Nigeria\'s property market is governed by the Land Use Act of 1978, which vests all land in the state governor. Certificates of occupancy (C of O) are the primary title document. sivrce opens with Lagos and Abuja.',
    [
      'The Land Use Act means all land is vested in the state governor, and buyers hold a Right of Occupancy or Certificate of C of O. Foreign buyers can hold these but face restrictions in some states.',
      'Transaction costs are high: legal fees (5–10%), agency fees (5–10%), stamp duty (1–3%), and registration fees (varies). The process is lengthy and documentation quality varies.',
      'sivrce.com/ng is the canonical Nigeria URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Lagos?',
        a: 'Yes, with a Certificate of Occupancy. The Land Use Act governs all land, and foreign ownership is subject to state consent.',
      },
      {
        q: 'What is a C of O?',
        a: 'Certificate of Occupancy: the primary land title document in Nigeria, issued by the state governor. It grants the right to use and develop the land for a specified purpose.',
      },
    ],
  ),
  eg: hub(
    'Egypt real estate — Cairo & more | sivrce',
    'Buying in Egypt: the New Administrative Capital, notarised contracts and the Egyptian property market. Cairo, Alexandria and Sharm El Sheikh guides.',
    'Real estate in Egypt',
    'Egypt\'s property market is dominated by the New Administrative Capital mega-project and a Cairo market that prices cheaply in USD. sivrce opens with Cairo, Alexandria, Giza and Sharm El Sheikh.',
    [
      'The New Administrative Capital is Egypt\'s flagship development: a new city 45km east of Cairo with government offices, financial district and residential compounds. Foreign buyers can purchase freehold in designated areas.',
      'Transfer fees are typically 3–5% of the property value. Notarised contracts are standard. The market is active but documentation and enforcement vary.',
      'sivrce.com/eg is the canonical Egypt URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Cairo?',
        a: 'Yes, in designated areas. The New Administrative Capital and most major compounds welcome foreign buyers.',
      },
      {
        q: 'What is the New Administrative Capital?',
        a: 'A planned city 45km east of Cairo: government district, financial hub, residential compounds and the Iconic Tower. Egypt\'s largest infrastructure project.',
      },
    ],
  ),
  za: hub(
    'South Africa real estate — Johannesburg, Cape Town & more | sivrce',
    'Buying in South Africa: transfer duty, conveyancing and the Sectional Title Act. Johannesburg, Cape Town, Durban and Pretoria guides.',
    'Real estate in South Africa',
    'South Africa has Africa\'s most developed property market, with Sandton and Camps Bay at the ultra-premium end. Transfer duty is banded, conveyancing is attorney-led, and sectional title governs most apartments. sivrce opens with Johannesburg, Cape Town, Durban and Pretoria.',
    [
      'Transfer duty is banded: 0% up to R1.1m, then scaling to 13% above R2.2m. Conveyancing fees are regulated. Sectional title (apartments) has its own governance under the Sectional Title Act.',
      'Foreign buyers face no restrictions but need a South African bank account for ongoing costs. Load-shedding (power cuts) is a real operational risk for buildings.',
      'sivrce.com/za is the canonical South Africa URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Cape Town?',
        a: 'Yes, with no restrictions. You need a South African bank account and a conveyancer (attorney).',
      },
      {
        q: 'What is transfer duty?',
        a: 'A government tax on property transfers, banded from 0% (under R1.1m) to 13% (above R2.2m). It is separate from conveyancing fees.',
      },
    ],
  ),
  ke: hub(
    'Kenya real estate — Nairobi & more | sivrce',
    'Buying in Kenya: the Land Control Act, title deed types and the Nairobi market. Nairobi and Mombasa guides.',
    'Real estate in Kenya',
    'Kenya\'s property market is governed by the Land Control Act and offers several title types. Nairobi\'s Karen and Runda are elite suburbs, while the tech hub drives demand. sivrce opens with Nairobi and Mombasa.',
    [
      'Foreign buyers can hold leasehold titles (up to 99 years) but not freehold on agricultural land. The Land Control Act requires consent for transactions involving agricultural land.',
      'Stamp duty is 4% in Nairobi (2% in other areas), legal fees are regulated, and the process involves the Ministry of Lands. Documentation quality varies significantly.',
      'sivrce.com/ke is the canonical Kenya URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Nairobi?',
        a: 'Yes, leasehold titles up to 99 years. Freehold on agricultural land requires Land Control Board consent.',
      },
      {
        q: 'What title type should I get?',
        a: 'For residential property, a leasehold title is standard for foreigners. For commercial property, a conveyance with a long lease is common.',
      },
    ],
  ),
  ma: hub(
    'Morocco real estate — Casablanca, Marrakech & more | sivrce',
    'Buying in Morocco: the notaire, the 4–6% acquisition tax and the Ampm system. Casablanca, Marrakech, Rabat and Tangier guides.',
    'Real estate in Morocco',
    'Morocco closes before a notaire and charges 4–6% acquisition tax. Marrakech attracts luxury buyers; Casablanca is the business hub. sivrce opens with Casablanca, Marrakech, Rabat and Tangier.',
    [
      'Acquisition tax is 4–6% depending on the property value and whether it is new-build or resale. The notaire\'s fees are regulated. Foreign buyers face no restrictions on residential property.',
      'Morocco\'s property market is active, with Marrakech popular with European buyers and Casablanca driving commercial demand. Documentation is improving but still varies.',
      'sivrce.com/ma is the canonical Morocco URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Marrakech?',
        a: 'Yes, with no restrictions. The notaire handles the transaction and the 4–6% acquisition tax applies.',
      },
      {
        q: 'What is the Ampm system?',
        a: 'The Moroccan land registry system: Ampm (Agence Nationale de la Conservation Foncière, du Cadastre et de la Cartographie) handles property registration.',
      },
    ],
  ),
  pl: hub(
    'Poland real estate — Warsaw, Kraków & more | sivrce',
    'Buying in Poland: PCC tax, the notarial deed and the KRS registration. Warsaw, Kraków, Wrocław and Gdańsk guides.',
    'Real estate in Poland',
    'Poland charges 2% PCC (civil transactions tax) on resale property or 23% VAT on new-build, and closes before a notary. sivrce opens with Warsaw, Kraków, Wrocław, Poznań and Gdańsk.',
    [
      'Resale property pays 2% PCC on the declared value; new-build from a developer pays 23% VAT (recoverable for businesses). The notarial deed is required and the buyer pays.',
      'Foreign EU buyers can purchase without permission; non-EU buyers need Interior Ministry consent for agricultural land. The process is relatively fast and transparent.',
      'sivrce.com/pl is the canonical Poland URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Warsaw?',
        a: 'EU citizens: yes, freely. Non-EU citizens need consent for agricultural land but not for residential property.',
      },
      {
        q: 'PCC or VAT?',
        a: 'Resale: 2% PCC. New-build from a developer: 23% VAT (recoverable). Your notary or tax advisor will confirm which applies.',
      },
    ],
  ),
  cz: hub(
    'Czech Republic real estate — Prague & more | sivrce',
    'Buying in Czech Republic: 4% acquisition tax, the notarial deed and the cadastral office. Prague, Brno and Ostrava guides.',
    'Real estate in Czech Republic',
    'Czech Republic charges 4% acquisition tax (nabytí nemovitých věcí) and closes before a notary. Prague prices have doubled in a decade. sivrce opens with Prague, Brno and Ostrava.',
    [
      'The 4% acquisition tax is the main closing cost. Notarial fees are regulated and modest. EU buyers can purchase freely; non-EU buyers need Ministry of Justice consent for agricultural land.',
      'Prague\'s Vinohrady and Hradčany are premium; Brno is more affordable and growing. The market is transparent and foreign-buyer friendly.',
      'sivrce.com/cz is the canonical Czech Republic URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Prague?',
        a: 'EU citizens: yes, freely. Non-EU citizens need consent for agricultural land but not for residential property.',
      },
      {
        q: 'What is the 4% tax?',
        a: 'Nabytí nemovitých věcí: a 4% acquisition tax on the higher of the declared price or the cadastral value, payable by the buyer.',
      },
    ],
  ),
  hu: hub(
    'Hungary real estate — Budapest & more | sivrce',
    'Buying in Hungary: 4% acquisition tax, the notarial deed and the Land Registry. Budapest, Debrecen and Szeged guides.',
    'Real estate in Hungary',
    'Hungary charges 4% acquisition tax (illeték) and closes before a notary. Budapest\'s District V and VII are premium. sivrce opens with Budapest, Debrecen, Szeged and Pécs.',
    [
      'The 4% illeték is the main closing cost. Notarial fees are regulated. EU buyers can purchase freely; non-EU buyers need government consent for agricultural land.',
      'Budapest is undervalued vs Western Europe, with strong demand from digital nomads. The ruin bar district (District VII) is trendy; District V is premium.',
      'sivrce.com/hu is the canonical Hungary URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Budapest?',
        a: 'EU citizens: yes, freely. Non-EU citizens need government consent for agricultural land but not for residential property.',
      },
      {
        q: 'What is the illeték?',
        a: 'A 4% acquisition tax on the declared value, payable by the buyer at closing.',
      },
    ],
  ),
  ro: hub(
    'Romania real estate — Bucharest & more | sivrce',
    'Buying in Romania: the notarial deed, 1–3% transaction tax and the Land Registry. Bucharest, Cluj-Napoca and Timișoara guides.',
    'Real estate in Romania',
    'Romania charges 1–3% transaction tax (depending on value) and closes before a notary. Bucharest and Cluj-Napoca are booming. sivrce opens with Bucharest, Cluj-Napoca, Timișoara, Iași and Brașov.',
    [
      'Transaction tax is 1–3% on a sliding scale. Notarial fees are regulated. EU buyers can purchase freely; non-EU buyers can buy apartments but not agricultural land.',
      'Bucharest CBD is booming; Cluj-Napoca is the IT hub. Yields of 6–7% are common in newer developments.',
      'sivrce.com/ro is the canonical Romania URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Bucharest?',
        a: 'EU citizens: yes, freely. Non-EU citizens can buy apartments but not agricultural land.',
      },
      {
        q: 'What is the transaction tax?',
        a: '1–3% on a sliding scale, payable by the buyer. Notarial fees are additional.',
      },
    ],
  ),
  bg: hub(
    'Bulgaria real estate — Sofia & more | sivrce',
    'Buying in Bulgaria: the notarial deed, 0.1–3% transfer tax and the Land Registry. Sofia, Plovdiv and Varna guides.',
    'Real estate in Bulgaria',
    'Bulgaria charges 0.1–3% transfer tax (varies by municipality) and closes before a notary. Sofia offers 8–10% yields. sivrce opens with Sofia, Plovdiv, Varna and Burgas.',
    [
      'Transfer tax is 0.1–3% depending on the municipality. Notarial fees are regulated. EU buyers can purchase freely; non-EU buyers need Council of Ministers consent for agricultural land.',
      'Sofia yields 8–10% — among the highest in Europe. Lozenets is premium; the IT sector drives demand. Black Sea coast attracts holiday buyers.',
      'sivrce.com/bg is the canonical Bulgaria URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Sofia?',
        a: 'EU citizens: yes, freely. Non-EU citizens need consent for agricultural land but not for residential property.',
      },
      {
        q: 'What yields can I expect?',
        a: 'Sofia residential yields 8–10%, among the highest in Europe. Black Sea holiday properties have seasonal yields.',
      },
    ],
  ),
  rs: hub(
    'Serbia real estate — Belgrade & more | sivrce',
    'Buying in Serbia: the notarial deed, 2.5% transaction tax and the Land Registry. Belgrade, Novi Sad and Niš guides.',
    'Real estate in Serbia',
    'Serbia charges 2.5% transaction tax and closes before a notary. Belgrade Waterfront is transforming the market. sivrce opens with Belgrade, Novi Sad and Niš.',
    [
      'Transaction tax is 2.5% on the declared value. Notarial fees are regulated. Foreign buyers can purchase residential property freely.',
      'Belgrade Waterfront is a major transformation; Dorcol and Vracar are trendy. The market is undervalued vs CEE peers.',
      'sivrce.com/rs is the canonical Serbia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Belgrade?',
        a: 'Yes, with no restrictions on residential property.',
      },
      {
        q: 'What is Belgrade Waterfront?',
        a: 'A major urban regeneration project along the Sava River: residential towers, commercial space and public amenities. Transforming the city center.',
      },
    ],
  ),
  hr: hub(
    'Croatia real estate — Zagreb, Split & more | sivrce',
    'Buying in Croatia: the notarial deed, 3% property transfer tax and the Land Registry. Zagreb, Split, Rijeka and Zadar guides.',
    'Real estate in Croatia',
    'Croatia charges 3% property transfer tax and closes before a notary. Coastal Croatia is booming post-EU entry. sivrce opens with Zagreb, Split, Rijeka and Zadar.',
    [
      'Property transfer tax is 3% on the declared value. Notarial fees are regulated. EU buyers can purchase freely; non-EU buyers need Ministry of Justice consent.',
      'Coastal Croatia is booming: Dubrovnik and Split attract luxury buyers; Zadar is emerging. Zagreb is the administrative capital.',
      'sivrce.com/hr is the canonical Croatia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Split?',
        a: 'EU citizens: yes, freely. Non-EU citizens need Ministry of Justice consent.',
      },
      {
        q: 'What is the transfer tax?',
        a: '3% on the declared value, payable by the buyer.',
      },
    ],
  ),
  se: hub(
    'Sweden real estate — Stockholm & more | sivrce',
    'Buying in Sweden: the bostadsrätt system, stamp duty and the broker-led market. Stockholm, Gothenburg and Malmö guides.',
    'Real estate in Sweden',
    'Sweden uses the bostadsrätt (tenant-owner association) system for most apartments, with a queue-based market and broker-led transactions. sivrce opens with Stockholm, Gothenburg and Malmö.',
    [
      'The bostadsrätt is a share in a housing association, not a traditional condo. You buy the right to occupy a specific unit, and the association manages the building. Stamp duty is 1.25% for legal entities; individuals pay none.',
      'Stockholm is expensive; a 10+ year housing queue is normal. Södermalm and Vasastan are popular. The system is unique globally.',
      'sivrce.com/se is the canonical Sweden URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'What is a bostadsrätt?',
        a: 'A tenant-owner share in a housing association: you buy the right to occupy a specific unit, not the land. The association manages the building and common areas.',
      },
      {
        q: 'Can a foreigner buy in Stockholm?',
        a: 'Yes, with no restrictions. The bostadsrätt system applies equally to all buyers.',
      },
    ],
  ),
  no: hub(
    'Norway real estate — Oslo & more | sivrce',
    'Buying in Norway: the document fee, the broker-led market and the oil-backed economy. Oslo, Bergen, Trondheim and Stavanger guides.',
    'Real estate in Norway',
    'Norway charges a document fee (2.5% of the mortgage amount) and closes with a boligkjøperforsikring (buyer protection insurance). Oslo is expensive. sivrce opens with Oslo, Bergen, Trondheim and Stavanger.',
    [
      'The document fee is 2.5% of the mortgage amount (not the purchase price), capped at a regulated maximum. Buyer protection insurance is standard. Oil-backed wealth supports the market.',
      'Frogner and Majorstuen are Oslo premium areas. Bergen and Trondheim are more affordable. The sovereign fund provides stability.',
      'sivrce.com/no is the canonical Norway URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'What is the document fee?',
        a: '2.5% of the mortgage amount (not the purchase price), payable to the broker. It is a regulated cost, not negotiable.',
      },
      {
        q: 'Can a foreigner buy in Oslo?',
        a: 'Yes, with no restrictions. EU/EEA citizens have the same rights as Norwegian citizens.',
      },
    ],
  ),
  dk: hub(
    'Denmark real estate — Copenhagen & more | sivrce',
    'Buying in Denmark: the ejerlejlighed, the strong tenant protections and the Tinglysning system. Copenhagen, Aarhus and Odense guides.',
    'Real estate in Denmark',
    'Denmark uses the ejerlejlighed (owner-occupied apartment) system with strong tenant protections and a digital land registry (Tinglysning). sivrce opens with Copenhagen, Aarhus and Odense.',
    [
      'The ejerlejlighed is a traditional condo title. Closing costs include a broker fee (typically 1–2%), a lawyer fee and the Tinglysning registration. Tenant protections are among the strongest in Europe.',
      'Copenhagen is expensive; Nyhavn and Amager are popular. The bike-friendly premium is real. Strong tenant protections affect rental yields.',
      'sivrce.com/dk is the canonical Denmark URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'What is an ejerlejlighed?',
        a: 'An owner-occupied apartment title: you own the unit and a share of the common areas. Similar to a condo but with stronger tenant protections.',
      },
      {
        q: 'Can a foreigner buy in Copenhagen?',
        a: 'Yes, with no restrictions for EU/EEA citizens. Non-EU citizens need permission for certain property types.',
      },
    ],
  ),
  fi: hub(
    'Finland real estate — Helsinki & more | sivrce',
    'Buying in Finland: the kiinteistö, the 4% transfer tax and the transparent market. Helsinki, Espoo and Tampere guides.',
    'Real estate in Finland',
    'Finland charges 4% transfer tax and closes with a notary. Helsinki is stable with moderate growth. sivrce opens with Helsinki, Espoo, Tampere and Vantaa.',
    [
      'Transfer tax is 4% on the purchase price, payable by the buyer. The market is transparent and stable. Helsinki\'s Töölö and Kamppi are premium.',
      'Finland offers excellent public infrastructure and a stable Nordic market. Yields are moderate but reliable.',
      'sivrce.com/fi is the canonical Finland URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Helsinki?',
        a: 'Yes, with no restrictions for EU/EEA citizens. Non-EU citizens can buy but may face restrictions on certain land types.',
      },
      {
        q: 'What is the transfer tax?',
        a: '4% on the purchase price, payable by the buyer.',
      },
    ],
  ),
  at: hub(
    'Austria real estate — Vienna & more | sivrce',
    'Buying in Austria: the Grundbucheintrag, the 3.5% transfer tax and the strong social housing system. Vienna, Graz and Salzburg guides.',
    'Real estate in Austria',
    'Austria charges 3.5% transfer tax and closes with a Grundbucheintrag (land register entry). Vienna consistently ranks among the world\'s most livable cities. sivrce opens with Vienna, Graz, Linz and Salzburg.',
    [
      'Transfer tax is 3.5% on the assessed value. Notarial fees are regulated. Vienna\'s social housing system (Gemeindewohnung) affects the private market.',
      'Vienna is stable with moderate growth. Wien Mitte and Innere Stadt are premium. Strong social housing keeps the market balanced.',
      'sivrce.com/at is the canonical Austria URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Vienna?',
        a: 'Yes, with no restrictions. EU/EEA citizens have the same rights as Austrian citizens.',
      },
      {
        q: 'What is the transfer tax?',
        a: '3.5% on the assessed value, payable by the buyer.',
      },
    ],
  ),
  be: hub(
    'Belgium real estate — Brussels & more | sivrce',
    'Buying in Belgium: the registration duty, the notarial deed and the EU capital. Brussels, Antwerp, Ghent and Bruges guides.',
    'Real estate in Belgium',
    'Belgium charges 12.5% registration duty on resale property (6% in some regions for first homes) and closes before a notary. Brussels is the EU capital. sivrce opens with Brussels, Antwerp, Ghent and Bruges.',
    [
      'Registration duty is 12.5% in Flanders and Wallonia (6% for first homes), and 12.5% in Brussels (3% for first homes). The notarial fee is regulated. EU institutions drive rental demand.',
      'Brussels and Antwerp lead rental yields. Ixelles and Uccle are premium in Brussels; Het Zuid in Antwerp.',
      'sivrce.com/be is the canonical Belgium URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Brussels?',
        a: 'Yes, with no restrictions. EU citizens have the same rights as Belgian citizens.',
      },
      {
        q: 'What is the registration duty?',
        a: '12.5% on resale property (6% for first homes in some regions). It is the main closing cost.',
      },
    ],
  ),
  ie: hub(
    'Ireland real estate — Dublin & more | sivrce',
    'Buying in Ireland: the stamp duty, the solicitor-led process and the severely undersupplied market. Dublin, Cork and Galway guides.',
    'Real estate in Ireland',
    'Ireland charges 1–2% stamp duty and closes with a solicitor. Dublin is severely undersupplied. sivrce opens with Dublin, Cork, Galway and Limerick.',
    [
      'Stamp duty is 1% on the first €1m, 2% above that. Solicitor fees are regulated. Dublin is severely undersupplied, driving premium rents.',
      'Tech MNC presence drives demand in Dublin 2 and 4. Cork and Galway are more affordable. The market is supply-constrained.',
      'sivrce.com/ie is the canonical Ireland URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Dublin?',
        a: 'Yes, with no restrictions. EU/EEA citizens have the same rights as Irish citizens.',
      },
      {
        q: 'Why is Dublin so expensive?',
        a: 'Severe undersupply, tech MNC presence (Google, Meta, Apple), and limited land for development. The market is supply-constrained.',
      },
    ],
  ),
  nz: hub(
    'New Zealand real estate — Auckland & more | sivrce',
    'Buying in New Zealand: the foreign-buyer ban, the LIM report and the auction system. Auckland, Wellington and Christchurch guides.',
    'Real estate in New Zealand',
    'New Zealand banned most foreign buyers in 2018, with exceptions for Australians and Singaporeans. The LIM report is essential due diligence. sivrce opens with Auckland, Wellington and Christchurch.',
    [
      'The Overseas Investment Amendment Act 2018 banned most non-resident foreign buyers from purchasing existing residential property. Australians and Singaporeans are exempt. New-build is generally allowed.',
      'The LIM (Land Information Memorandum) report is the critical due-diligence document: flood risk, contaminated land, building consents, rates arrears. Do not buy without it.',
      'sivrce.com/nz is the canonical New Zealand URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Auckland?',
        a: 'Most non-residents: no. Australians and Singaporeans are exempt. New-build is generally allowed for others.',
      },
      {
        q: 'What is a LIM report?',
        a: 'Land Information Memorandum: a council report covering flood risk, contaminated land, building consents, rates arrears and everything else the council knows about the property.',
      },
    ],
  ),
  co: hub(
    'Colombia real estate — Bogotá, Medellín & more | sivrce',
    'Buying in Colombia: the notaría, the 1.5–3% acquisition tax and the emerging Medellín market. Bogotá, Medellín, Cali and Cartagena guides.',
    'Real estate in Colombia',
    'Colombia closes before a notaría and charges 1.5–3% acquisition tax (impuesto de registro). Medellín is a digital nomad hub. sivrce opens with Bogotá, Medellín, Cali, Barranquilla and Cartagena.',
    [
      'Acquisition tax is 1.5–3% of the registered value. Notarial fees are regulated. Foreign buyers face no restrictions on residential property.',
      'Medellín is a digital nomad hub: Chapinero and Zona G trending. Bogotá REITs are emerging. Foreign buyer friendly.',
      'sivrce.com/co is the canonical Colombia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Medellín?',
        a: 'Yes, with no restrictions. The market is foreign-buyer friendly.',
      },
      {
        q: 'What is the acquisition tax?',
        a: '1.5–3% of the registered value, payable by the buyer.',
      },
    ],
  ),
  cl: hub(
    'Chile real estate — Santiago & more | sivrce',
    'Buying in Chile: the notaría, the 4% property tax and the well-established REIT market. Santiago, Valparaíso and Viña del Mar guides.',
    'Real estate in Chile',
    'Chile closes before a notaría and has a well-established REIT (FCI) market. Santiago and Viña del Mar are premium. sivrce opens with Santiago, Valparaíso, Viña del Mar and Concepción.',
    [
      'Property tax is 1–2% annually. Acquisition costs are modest: notarial fees (regulated), registration fees, and a 4% annual property tax. REITs (FCIs) are well established.',
      'Santiago\'s Las Condes and Vitacura are premium. Viña del Mar is a coastal resort. The market is stable and transparent.',
      'sivrce.com/cl is the canonical Chile URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Santiago?',
        a: 'Yes, with no restrictions. The market is transparent and REITs are well established.',
      },
      {
        q: 'What are FCIs?',
        a: 'Fondos de Inversión en Inmobiliario: Chilean REITs that invest in commercial and residential property. They are well established and liquid.',
      },
    ],
  ),
  ar: hub(
    'Argentina real estate — Buenos Aires & more | sivrce',
    'Buying in Argentina: the escribano, the 1.5% stamp duty and the currency volatility. Buenos Aires, Córdoba and Rosario guides.',
    'Real estate in Argentina',
    'Argentina closes before an escribano and charges 1.5% stamp duty. Buenos Aires is affordable in USD but currency volatile. sivrce opens with Buenos Aires, Córdoba, Rosario and Mendoza.',
    [
      'Stamp duty is 1.5% of the transaction value. Escritura (deed) fees are regulated. Currency volatility is the main risk: prices are quoted in USD but transactions may involve parallel exchange rates.',
      'Palermo and Recoleta are premium in Buenos Aires. The market is cheap in USD terms but carries currency risk.',
      'sivrce.com/ar is the canonical Argentina URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Buenos Aires?',
        a: 'Yes, with no restrictions. The market is open and prices are low in USD terms.',
      },
      {
        q: 'What is the currency risk?',
        a: 'Argentina has multiple exchange rates and capital controls. The official rate and the blue-chip swap rate can differ significantly. Factor this into your exit strategy.',
      },
    ],
  ),
  pe: hub(
    'Peru real estate — Lima & more | sivrce',
    'Buying in Peru: the notaría, the 3% municipal tax and the Miraflores premium. Lima, Arequipa, Cusco and Trujillo guides.',
    'Real estate in Peru',
    'Peru closes before a notaría and charges 3% municipal tax (impuesto municipal). Lima\'s Miraflores and Barranco are premium. sivrce opens with Lima, Arequipa, Cusco and Trujillo.',
    [
      'Municipal tax is 3% of the property value. Notarial fees are regulated. Foreign buyers face no restrictions on residential property.',
      'Lima\'s Miraflores and Barranco are premium; Cusco tourism RE; the market is stable.',
      'sivrce.com/pe is the canonical Peru URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Lima?',
        a: 'Yes, with no restrictions. The market is open and stable.',
      },
      {
        q: 'What is the municipal tax?',
        a: 'Impuesto municipal: 3% of the property value, payable at closing.',
      },
    ],
  ),
  ec: hub(
    'Ecuador real estate — Quito & more | sivrce',
    'Buying in Ecuador: the notaría, the 1.5% transfer tax and the USD economy. Quito, Guayaquil and Cuenca guides.',
    'Real estate in Ecuador',
    'Ecuador uses the USD as its currency, charges 1.5% transfer tax and closes before a notaría. Cuenca is popular with retirees. sivrce opens with Quito, Guayaquil and Cuenca.',
    [
      'Transfer tax is 1.5% of the registered value. Notarial fees are regulated. The USD economy eliminates currency risk for US-based buyers.',
      'Quito\'s historic center is UNESCO-listed; Cuenca is popular with retirees. The market is stable and affordable.',
      'sivrce.com/ec is the canonical Ecuador URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Quito?',
        a: 'Yes, with no restrictions. The USD economy eliminates currency risk.',
      },
      {
        q: 'Why Cuenca?',
        a: 'Cuenca is a UNESCO World Heritage city with a large expat community, moderate climate, and affordable living costs. Popular with North American retirees.',
      },
    ],
  ),
  pk: hub(
    'Pakistan real estate — Karachi, Lahore & more | sivrce',
    'Buying in Pakistan: the stamp duty, the CPEC corridor and the emerging market. Karachi, Lahore, Islamabad and Rawalpindi guides.',
    'Real estate in Pakistan',
    'Pakistan charges stamp duty and closes before a registrar. CPEC (China-Pakistan Economic Corridor) is driving infrastructure growth. sivrce opens with Karachi, Lahore, Islamabad and Rawalpindi.',
    [
      'Stamp duty is 1–3% depending on the province. Registration fees are modest. CPEC corridor drives infrastructure growth and property demand.',
      'Karachi and Lahore are huge markets; Islamabad is the administrative capital. The market is active but documentation varies.',
      'sivrce.com/pk is the canonical Pakistan URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Karachi?',
        a: 'Yes, with no restrictions on residential property.',
      },
      {
        q: 'What is CPEC?',
        a: 'China-Pakistan Economic Corridor: a $62bn infrastructure project connecting Gwadar Port to China via roads, rail and energy projects. Driving development.',
      },
    ],
  ),
  bd: hub(
    'Bangladesh real estate — Dhaka & more | sivrce',
    'Buying in Bangladesh: the stamp duty, the registration process and the world\'s densest city. Dhaka and Chittagong guides.',
    'Real estate in Bangladesh',
    'Bangladesh charges stamp duty and closes before a sub-registrar. Dhaka is among the world\'s densest cities. sivrce opens with Dhaka and Chittagong.',
    [
      'Stamp duty is 3–5% depending on the property value. Registration fees are modest. The market is active but bureaucratic.',
      'Dhaka is among the world\'s densest cities; garment sector drives worker housing demand. Chittagong is the port city.',
      'sivrce.com/bd is the canonical Bangladesh URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Dhaka?',
        a: 'Yes, with no restrictions on residential property.',
      },
      {
        q: 'What is the stamp duty?',
        a: '3–5% depending on the property value, payable at registration.',
      },
    ],
  ),
  lk: hub(
    'Sri Lanka real estate — Colombo & more | sivrce',
    'Buying in Sri Lanka: the stamp duty, the Port City project and the post-crisis recovery. Colombo, Kandy and Galle guides.',
    'Real estate in Sri Lanka',
    'Sri Lanka charges stamp duty and closes before a notary. Colombo Port City is a Chinese-funded project. sivrce opens with Colombo, Kandy and Galle.',
    [
      'Stamp duty is 4% on the property value. Registration fees are modest. Colombo Port City is a Chinese-funded free-trade zone.',
      'The market is recovering post-crisis. Colombo is the commercial center; Kandy is the cultural capital.',
      'sivrce.com/lk is the canonical Sri Lanka URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Colombo?',
        a: 'Yes, with no restrictions on residential property.',
      },
      {
        q: 'What is Port City?',
        a: 'Colombo Port City: a Chinese-funded $1.4bn reclaimed land project adjacent to the Galle Face Green. Mixed-use development with its own legal framework.',
      },
    ],
  ),
  np: hub(
    'Nepal real estate — Kathmandu & more | sivrce',
    'Buying in Nepal: the stamp duty, the earthquake risk and the growing market. Kathmandu, Pokhara and Lalitpur guides.',
    'Real estate in Nepal',
    'Nepal charges stamp duty and closes before a sub-registrar. Kathmandu valley is growing rapidly with earthquake risk. sivrce opens with Kathmandu, Pokhara and Lalitpur.',
    [
      'Stamp duty is 4% on the property value. Registration fees are modest. Earthquake risk affects construction standards.',
      'Kathmandu valley is growing rapidly; earthquake risk is real. Pokhara is a tourism hub.',
      'sivrce.com/np is the canonical Nepal URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Kathmandu?',
        a: 'Yes, with no restrictions on residential property.',
      },
      {
        q: 'What is the earthquake risk?',
        a: 'Nepal is in a seismic zone; the 2015 earthquake killed nearly 9,000 people. Building codes have been updated but enforcement varies.',
      },
    ],
  ),
  kh: hub(
    'Cambodia real estate — Phnom Penh & more | sivrce',
    'Buying in Cambodia: the hard title, the strata title and the Chinese investment cycle. Phnom Penh and Siem Reap guides.',
    'Real estate in Cambodia',
    'Cambodia offers hard title (freehold) and soft title (long-term lease) for property. Phnom Penh condo market boomed with Chinese investment. sivrce opens with Phnom Penh and Siem Reap.',
    [
      'Hard title is freehold and registered with the government. Soft title is a long-term transfer recognized locally but not registered. Condos can be foreign-owned within the 70/30 foreign quota.',
      'Phnom Penh condo boom peaked with Chinese investment; Sihanoukville saw a surge then pullback. The market is volatile.',
      'sivrce.com/kh is the canonical Cambodia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'What is the difference between hard and soft title?',
        a: 'Hard title: freehold, registered with the government, legally recognized. Soft title: long-term transfer, recognized locally but not registered. Hard title is safer.',
      },
      {
        q: 'Can a foreigner buy in Phnom Penh?',
        a: 'Condos: yes, within the 70/30 foreign quota. Landed property: soft title only, or through a Cambodian company.',
      },
    ],
  ),
  mm: hub(
    'Myanmar real estate — Yangon & more | sivrce',
    'Buying in Myanmar: the market under military rule and the limited transparency. Yangon and Mandalay guides.',
    'Real estate in Myanmar',
    'Myanmar\'s market is disrupted by military rule with limited transparency. Yangon is the largest city. sivrce opens with Yangon and Mandalay.',
    [
      'The market is frozen under military rule since the 2021 coup. Foreign investment is extremely limited. Yangon has underdeveloped potential.',
      'Transaction transparency is minimal. Legal protections for foreign buyers are weak.',
      'sivrce.com/mm is the canonical Myanmar URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Yangon?',
        a: 'In theory, condos within the foreign quota. In practice, the market is frozen under military rule.',
      },
      {
        q: 'Can a foreigner own land in Myanmar?',
        a: 'No. Land ownership is reserved for citizens; foreigners can at most hold long leases and quota condos.',
      },
    ],
  ),
  la: hub(
    'Laos real estate — Vientiane & more | sivrce',
    'Buying in Laos: the Land Law and the limited transparency. Vientiane and Luang Prabang guides.',
    'Real estate in Laos',
    'Laos has limited transparency and a Land Law that restricts foreign ownership. Vientiane is growing with Chinese rail link. sivrce opens with Vientiane and Luang Prabang.',
    [
      'Foreign ownership is restricted to leasehold (maximum 50 years). The market has limited transparency. Chinese investment is driving some development.',
      'Vientiane is growing with the China-Laos railway connection. Luang Prabang is a tourism hub.',
      'sivrce.com/la is the canonical Laos URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Vientiane?',
        a: 'Leasehold only, maximum 50 years. Freehold is restricted to Lao citizens.',
      },
      {
        q: 'Can foreigners own land in Laos?',
        a: 'No. Land stays state-owned for non-citizens; buyers hold renewable long leases, with condos possible only in approved developments.',
      },
    ],
  ),
  uz: hub(
    'Uzbekistan real estate — Tashkent & more | sivrce',
    'Buying in Uzbekistan: the reforming economy and the Silk Road tourism. Tashkent, Samarkand and Bukhara guides.',
    'Real estate in Uzbekistan',
    'Uzbekistan is reforming its economy and modernizing Tashkent. Silk Road cities attract tourism. sivrce opens with Tashkent, Samarkand and Bukhara.',
    [
      'Foreign buyers can own apartments but not land. The economy is reforming under President Mirziyoyev. Tashkent is modernizing rapidly.',
      'The market is emerging with growing transparency. Silk Road tourism drives demand in Samarkand and Bukhara.',
      'sivrce.com/uz is the canonical Uzbekistan URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Tashkent?',
        a: 'Apartments: yes. Land: restricted to leasehold.',
      },
      {
        q: 'What can foreigners own in Uzbekistan?',
        a: 'New-build apartments in Tashkent and regional centers, opened by the 2023 decree. Land remains leasehold.',
      },
    ],
  ),
  kz: hub(
    'Kazakhstan real estate — Almaty, Astana & more | sivrce',
    'Buying in Kazakhstan: the Land Code and the oil-backed economy. Almaty, Astana and Shymkent guides.',
    'Real estate in Kazakhstan',
    'Kazakhstan has a Land Code that governs property transactions. Almaty is the cultural center; Astana is the new capital. sivrce opens with Almaty, Astana and Shymkent.',
    [
      'Foreign buyers can own apartments but land is restricted to leasehold. The economy is oil-backed with a sovereign fund.',
      'Astana is the new capital; Almaty is the cultural center. Oil wealth supports development.',
      'sivrce.com/kz is the canonical Kazakhstan URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Almaty?',
        a: 'Apartments: yes. Land: leasehold only.',
      },
      {
        q: 'What can foreigners own in Kazakhstan?',
        a: 'Residential property with a residence basis; agricultural land is closed to non-citizens. Almaty and Astana dominate deals.',
      },
    ],
  ),
  am: hub(
    'Armenia real estate — Yerevan & more | sivrce',
    'Buying in Armenia: the notarial deed and the emerging market. Yerevan and Gyumri guides.',
    'Real estate in Armenia',
    'Armenia closes before a notary and has a relatively transparent market. Yerevan is the capital and largest city. sivrce opens with Yerevan and Gyumri.',
    [
      'Foreign buyers can own residential property with no restrictions. The market is emerging with growing transparency.',
      'Yerevan has a growing IT sector and a large diaspora investment. The market is affordable.',
      'sivrce.com/am is the canonical Armenia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Yerevan?',
        a: 'Yes, with no restrictions.',
      },
      {
        q: 'What can foreigners own in Armenia?',
        a: 'Apartments and houses freely; only agricultural land is off-limits. Registration is fast, cadastre-based.',
      },
    ],
  ),
  az: hub(
    'Azerbaijan real estate — Baku & more | sivrce',
    'Buying in Azerbaijan: the State Registry and the oil-backed economy. Baku, Ganja and Sumqayit guides.',
    'Real estate in Azerbaijan',
    'Azerbaijan has a State Registry for property transactions. Baku is the capital and oil hub. sivrce opens with Baku, Ganja and Sumqayit.',
    [
      'Foreign buyers can own apartments but land is restricted. The economy is oil-backed with significant infrastructure investment.',
      'Baku is modernizing rapidly; the oil-backed economy drives development. The market is emerging.',
      'sivrce.com/az is the canonical Azerbaijan URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Baku?',
        a: 'Apartments: yes. Land: restricted to leasehold.',
      },
      {
        q: 'What can foreigners own in Azerbaijan?',
        a: 'Apartments yes; land ownership is barred without special state permission.',
      },
    ],
  ),
  ua: hub(
    'Ukraine real estate — Kyiv & more | sivrce',
    'Buying in Ukraine: the notarial deed and the war-disrupted market. Kyiv, Kharkiv, Odesa and Lviv guides.',
    'Real estate in Ukraine',
    'Ukraine\'s market is war-disrupted since 2022, but Lviv and western cities remain more stable. sivrce opens with Kyiv, Kharkiv, Odesa and Lviv.',
    [
      'The market is disrupted by the ongoing war. Kyiv and eastern cities face significant risk; Lviv and western cities are more stable.',
      'Foreign buyers can own apartments but not agricultural land. The legal framework exists but enforcement is challenging.',
      'sivrce.com/ua is the canonical Ukraine URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Kyiv?',
        a: 'Apartments: technically yes, but the war makes this extremely risky. Lviv and western cities are more stable.',
      },
      {
        q: 'What can foreigners own in Ukraine?',
        a: 'Apartments and houses yes; agricultural land stays closed to non-citizens. Wartime deals carry extra due-diligence risk.',
      },
    ],
  ),
  ee: hub(
    'Estonia real estate — Tallinn & more | sivrce',
    'Buying in Estonia: the Land Register and the tech hub. Tallinn and Tartu guides.',
    'Real estate in Estonia',
    'Estonia has a transparent Land Register and a tech-hub economy. Tallinn is the capital and e-Residency centre. sivrce opens with Tallinn and Tartu.',
    [
      'The market is transparent with a digital Land Register. EU/EEA buyers have the same rights as Estonian citizens.',
      'Tallinn tech boom drives demand; e-Residency programme boosts foreign interest. Kalamaja and Telliskivi are trendy.',
      'sivrce.com/ee is the canonical Estonia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Tallinn?',
        a: 'EU/EEA citizens: yes, freely. Non-EU citizens: yes, with no restrictions on residential property.',
      },
      {
        q: 'What can foreigners own in Estonia?',
        a: 'Apartments freely; a house with land needs a notarized application that is routinely approved.',
      },
    ],
  ),
  lt: hub(
    'Lithuania real estate — Vilnius & more | sivrce',
    'Buying in Lithuania: the Land Register and the emerging tech hub. Vilnius and Kaunas guides.',
    'Real estate in Lithuania',
    'Lithuania has a transparent Land Register and a growing tech sector. Vilnius is the capital and largest city. sivrce opens with Vilnius and Kaunas.',
    [
      'The market is transparent with a digital Land Register. EU/EEA buyers have full rights.',
      'Vilnius is an emerging tech hub; affordable vs Baltic neighbours. Snipiskes is premium.',
      'sivrce.com/lt is the canonical Lithuania URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Vilnius?',
        a: 'EU/EEA citizens: yes, freely. Non-EU citizens: yes, with no restrictions on residential property.',
      },
      {
        q: 'What can foreigners own in Lithuania?',
        a: 'Apartments freely; non-EU buyers need government consent for land plots.',
      },
    ],
  ),
  lv: hub(
    'Latvia real estate — Riga & more | sivrce',
    'Buying in Latvia: the Land Register and the Art Nouveau capital. Riga and Daugavpils guides.',
    'Real estate in Latvia',
    'Latvia has a transparent Land Register and Art Nouveau architecture. Riga is the capital. sivrce opens with Riga and Daugavpils.',
    [
      'The market is transparent with a digital Land Register. EU/EEA buyers have full rights.',
      'Riga\'s Art Nouveau district is premium; Vecriga is the historic center. EU funds drive infrastructure growth.',
      'sivrce.com/lv is the canonical Latvia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Riga?',
        a: 'EU/EEA citizens: yes, freely. Non-EU citizens: yes, with no restrictions on residential property.',
      },
      {
        q: 'What can foreigners own in Latvia?',
        a: 'Apartments freely; non-EU buyers need consent for land. Property no longer grants automatic residence.',
      },
    ],
  ),
  is: hub(
    'Iceland real estate — Reykjavik & more | sivrce',
    'Buying in Iceland: the FME approval and the volcanic risk. Reykjavik guides.',
    'Real estate in Iceland',
    'Iceland requires FME (Financial Supervisory Authority) approval for foreign buyers. Reykjavik is the capital. sivrce opens with Reykjavik.',
    [
      'Foreign buyers need FME approval, which is usually granted for residential property. Limited supply and volcanic activity affect the market.',
      'Reykjavik has limited supply; volcanic activity affects insurance costs. The market is small and transparent.',
      'sivrce.com/is is the canonical Iceland URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Reykjavik?',
        a: 'Yes, with FME approval. Approval is usually granted for residential property.',
      },
      {
        q: 'What can foreigners own in Iceland?',
        a: 'Property with Ministry of Justice permission; EEA citizens get a lighter process than non-EEA buyers.',
      },
    ],
  ),
  mt: hub(
    'Malta real estate — Valletta & more | sivrce',
    'Buying in Malta: the notarial deed and the iGaming hub. Valletta, Sliema and St Julian\'s guides.',
    'Real estate in Malta',
    'Malta has a transparent property market driven by iGaming and crypto. Valletta is the capital. sivrce opens with Valletta, Sliema and St Julian\'s.',
    [
      'Foreign buyers need an AIP (Acquisition of Immovable Property) permit for most property, except in special areas. The process is straightforward.',
      'iGaming and crypto drive demand; limited island supply. Sliema and St Julian\'s are premium.',
      'sivrce.com/mt is the canonical Malta URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Valletta?',
        a: 'Yes, with an AIP permit. The process is straightforward and usually takes a few weeks.',
      },
      {
        q: 'What can foreigners own in Malta?',
        a: 'Most property with an AIP permit and one-home minimum-price thresholds; higher minimums apply in south and Gozo zones.',
      },
    ],
  ),
  lu: hub(
    'Luxembourg real estate — Luxembourg City & more | sivrce',
    'Buying in Luxembourg: the notarial deed and the world\'s highest GDP per capita. Luxembourg City guides.',
    'Real estate in Luxembourg',
    'Luxembourg has a transparent market with extreme housing shortage. Luxembourg City is the capital. sivrce opens with Luxembourg City.',
    [
      'The market is transparent with regulated notarial fees. Extreme housing shortage drives prices. World\'s highest GDP per capita.',
      'Luxembourg City is expensive; the financial sector and EU institutions drive demand. Limited supply.',
      'sivrce.com/lu is the canonical Luxembourg URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Luxembourg City?',
        a: 'Yes, with no restrictions for EU/EEA citizens. Non-EU citizens need authorization.',
      },
      {
        q: 'What can foreigners own in Luxembourg?',
        a: 'Apartments freely for EU/EEA citizens; non-EU buyers need authorization before the notarial deed.',
      },
    ],
  ),
  sk: hub(
    'Slovakia real estate — Bratislava & more | sivrce',
    'Buying in Slovakia: the Land Book and the Vienna spillover. Bratislava and Košice guides.',
    'Real estate in Slovakia',
    'Slovakia has a transparent Land Book and benefits from Vienna spillover. Bratislava is the capital. sivrce opens with Bratislava and Košice.',
    [
      'The market is transparent with a digital Land Book. EU/EEA buyers have full rights.',
      'Bratislava benefits from Vienna spillover; automotive sector drives jobs. Kosice is the second city.',
      'sivrce.com/sk is the canonical Slovakia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Bratislava?',
        a: 'EU/EEA citizens: yes, freely. Non-EU citizens: yes, with no restrictions on residential property.',
      },
      {
        q: 'What can foreigners own in Slovakia?',
        a: 'Apartments freely; non-EU buyers need consent only for agricultural or forest land.',
      },
    ],
  ),
  si: hub(
    'Slovenia real estate — Ljubljana & more | sivrce',
    'Buying in Slovenia: the notarial deed and the green capital. Ljubljana and Maribor guides.',
    'Real estate in Slovenia',
    'Slovenia has a transparent market and Ljubljana is the green capital. sivrce opens with Ljubljana and Maribor.',
    [
      'The market is transparent with regulated notarial fees. EU/EEA buyers have full rights.',
      'Ljubljana is green and compact; Maribor is the second city. EU fund flows drive development.',
      'sivrce.com/si is the canonical Slovenia URL. Listings publish only when verified.',
    ],
    [
      {
        q: 'Can a foreigner buy in Ljubljana?',
        a: 'EU/EEA citizens: yes, freely. Non-EU citizens: yes, with no restrictions on residential property.',
      },
      {
        q: 'What can foreigners own in Slovenia?',
        a: 'Apartments freely; non-EU buyers need reciprocity-based consent for houses and land.',
      },
    ],
  ),
}

const PARIS_BUY = intent(
  'Buy',
  'Paris',
  'Buy an apartment in Paris | sivrce',
  'Buying in Paris: the compromis, the acte authentique, ~7% frais de notaire, the ten-day cooling-off and the copropriété file that decides the real price.',
  'Buying in Paris is two contracts and a notaire, not a checkout. Sign the compromis, take the ten statutory days, then complete at the acte authentique weeks later. Budget roughly 7% on top — most of it departmental tax.',
  [
    'The compromis fixes the deal and the price; the acte transfers title. Between them sit the diagnostics, the pre-emption right of the commune where it applies, and the bank\'s offer period if you finance. Weeks, not days.',
    'The copropriété file is where a Paris purchase is won or lost. The état daté, the last three assemblée générale minutes and the fund balance tell you which works have been voted and who pays for them — the answer is the new owner.',
    'Non-residents buy on the same terms with no extra foreigner tax, but French banks ask for more equity and a settlement account. Paris applied the 2025 DMTO uplift, so confirm the rate on your own acte.',
  ],
  [
    { q: 'How long does a Paris purchase take?', a: 'Typically two to three months from compromis to acte, longer with a mortgage offer or a communal pre-emption right. The ten-day cooling-off is the buyer\'s, and it is not negotiable away.' },
    { q: 'Is the deposit at risk?', a: 'The dépôt de garantie, usually 5–10%, is held by the notaire. You recover it if a suspensive condition fails — a refused mortgage, for instance — and lose it if you simply change your mind after the cooling-off.' },
  ],
)

const PARIS_RENT = intent(
  'Rent',
  'Paris',
  'Rent an apartment in Paris | sivrce',
  'Renting in Paris: encadrement des loyers, the dossier and the garant, unfurnished three-year leases against furnished one-year, and the DPE that decides what can be let at all.',
  'Paris caps rents. Every lease has a reference rent per square metre for its quartier and room count, and anything above it needs a justified complément de loyer or the tenant can have it struck out — retroactively.',
  [
    'Unfurnished is a three-year lease with a one-month deposit; furnished is one year, or nine months for a student, with two months. The tenant can leave on one month\'s notice in a zone tendue, which Paris is. Underwrite the turnover.',
    'The dossier decides who gets the flat: proof of income around three times the rent, and a French garant or a Visale guarantee. Landlords cannot legally demand documents outside the statutory list.',
    'The DPE is now a letting test, not a label. Class G has been barred from new lettings since 2025 and F follows in 2028, which turns an unrenovated top-floor chambre into a capex decision.',
  ],
  [
    { q: 'Can the landlord charge above the reference rent?', a: 'Only with a complément de loyer justified by an exceptional feature, stated in the lease. Without that justification a tenant can demand a reduction and recover the overpayment.' },
    { q: 'What deposit is legal?', a: 'One month\'s rent excluding charges for unfurnished, two months for furnished. Anything more is not a market exception.' },
  ],
)

const MADRID_BUY = intent(
  'Buy',
  'Madrid',
  'Buy a home in Madrid | sivrce',
  'Buying in Madrid: 6% ITP on resale, IVA plus AJD on new-build, NIE, nota simple and the notario. Spain\'s cheapest big-city transfer tax.',
  'Madrid charges 6% ITP on a resale — the lowest headline rate of Spain\'s major cities, four points under Catalonia. A new-build from a developer pays IVA plus AJD instead. Get the NIE and the nota simple before anything else.',
  [
    'The nota simple from the Registro is the first document, not the brochure. Charges, mortgages and embargoes travel with the property rather than the seller, so a clean-looking flat can arrive with someone else\'s debt attached.',
    'Between the arras (deposit contract) and the escritura at the notario sit the bank valuation, the community certificate confirming no arrears, and the IBI receipt. The notario reads and files; the gestoría handles the tax and registration.',
    'Golden-visa-by-property closed in 2025. Buy the asset on its own numbers — comunidad fees, IBI and the energy certificate — not on a residency slide.',
  ],
  [
    { q: 'What do the costs add up to?', a: 'About 7.8% on top of a resale price in Madrid: 6% ITP plus notario, registro and gestoría. On a €300,000 flat that is roughly €23,400.' },
    { q: 'Do I need to be resident?', a: 'No. You need an NIE, a Spanish settlement account and a notario. There is no nationality restriction on ordinary residential property.' },
  ],
)

const MADRID_RENT = intent(
  'Rent',
  'Madrid',
  'Rent an apartment in Madrid | sivrce',
  'Renting in Madrid: five-year LAU terms, the one-month fianza lodged with the region, and a comunidad that Madrid has kept outside the national rent caps.',
  'A Madrid lease runs five years by statute — seven if the landlord is a company — with the tenant holding the renewal right. The fianza is one month and must be lodged with the regional housing body, not kept in the landlord\'s account.',
  [
    'The Comunidad de Madrid has not declared zonas tensionadas, so the national rent caps that bind in Catalonia do not apply here. That is a political position rather than a permanent feature of the law — it can change.',
    'Beyond the fianza a landlord may ask for a limited additional guarantee, commonly up to two further months. Demands well beyond that are not standard practice dressed up as market conditions.',
    'Comunidad charges are normally the owner\'s and IBI always is. Check which of the two the advertised rent is quietly assuming.',
  ],
  [
    { q: 'Can the landlord end the lease at five years?', a: 'The tenant holds the renewal right for the statutory term. A landlord can recover the property early only on stated grounds, such as documented need for their own household.' },
    { q: 'Is short-term letting an option?', a: 'It is a municipal licence question with an increasingly restrictive answer. Assume no licence until you hold one.' },
  ],
)

const ROME_BUY = intent(
  'Buy',
  'Rome',
  'Buy an apartment in Rome | sivrce',
  'Buying in Rome: the notaio, registration tax on the cadastral rendita under prezzo-valore, prima casa relief, and the condominio arrears that follow the flat.',
  'A Rome purchase completes in front of a notaio who reads the deed aloud and files the transcription. On a private resale you can elect prezzo-valore, which charges registration tax on the cadastral value rather than the price you actually pay.',
  [
    'That election is why the headline 9% overstates the real bill — the rendita base is usually well below market. Prima casa relief cuts it to 2%, but only if you move your residenza to the comune within eighteen months.',
    'Condominio arrears transfer with the flat. Ask for the administrator\'s statement, the last balance and any voted works before you sign the proposta, because a facade job decided last spring is now your facade job.',
    'You need a codice fiscale before the notaio will close, and again afterwards for the utilities and the IMU filing. Historic-centre buildings carry Soprintendenza constraints that cap what a renovation can legally deliver.',
  ],
  [
    { q: 'What is the real tax bill?', a: 'Registration tax is 9% of the cadastral value on a second home under prezzo-valore, or 2% with prima casa relief. Add the notaio at roughly 1.5% and agency at 3% plus IVA.' },
    { q: 'Can a foreigner buy?', a: 'Yes for ordinary residential property. You need a codice fiscale and full KYC at the notaio; there is no nationality bar and no extra foreigner tax.' },
  ],
)

const ROME_RENT = intent(
  'Rent',
  'Rome',
  'Rent an apartment in Rome | sivrce',
  'Renting in Rome: the 4+4 contract, canone concordato, cedolare secca, compulsory registration with the Agenzia delle Entrate, and a possession calendar that runs on court time.',
  'The default Rome lease is 4+4: four years, renewed for four more unless the landlord has a statutory reason not to. The alternative is the canone concordato 3+2, which caps the rent against a local agreement and pays back in tax relief.',
  [
    'Every lease must be registered with the Agenzia delle Entrate. An unregistered contract is void against the tenant, which means the landlord loses the terms and keeps the obligations.',
    'Cedolare secca lets a landlord swap progressive IRPEF for a flat substitute tax, at the cost of freezing ISTAT indexation for the term. On a long lease in an inflationary year that trade is not obviously good.',
    'Possession runs through the court calendar, not the contract. Any Rome yield model that assumes a fast recovery of the property is a marketing document.',
  ],
  [
    { q: '4+4 or canone concordato?', a: 'The 4+4 lets you set a market rent over a long horizon. The 3+2 concordato caps the rent to a locally agreed band and returns it through reduced registration tax and IMU. Run both.' },
    { q: 'What deposit is normal?', a: 'Up to three months\' rent, and it legally accrues interest to the tenant. Registration is the landlord\'s duty, not a favour.' },
  ],
)

const LONDON_BUY = intent(
  'Buy',
  'London',
  'Buy a property in London | sivrce',
  'Buying in London: SDLT slice bands plus a 2% non-resident surcharge, leasehold term and service charge, the exchange that finally makes it binding, and the EWS1 file.',
  'An offer in London binds nobody. Until exchange of contracts either side can walk, which is why gazumping is legal and why the survey and the searches happen before the celebration, not after.',
  [
    'SDLT is charged in slices: nothing to £125,000, then 2%, 5%, 10% and 12%. A non-resident buyer adds 2% on the whole price, and an additional dwelling adds a further 5%. On £500,000 the standard bill is £15,000 before either surcharge.',
    'Most London flats are leasehold. The remaining term, the ground rent and the service charge decide the price as much as the postcode does, and below roughly eighty years an extension starts costing real money that grows every year you wait.',
    'Since 2017 cladding and the EWS1 form have repriced whole buildings, and lenders treat the building safety pack as underwriting. Ask for it before the offer, not during the mortgage application.',
  ],
  [
    { q: 'How much stamp duty will I actually pay?', a: 'On £500,000 as an overseas buyer of an additional dwelling: £15,000 standard, plus £10,000 non-resident surcharge, plus £25,000 additional-dwelling surcharge. The surcharges apply to the whole price, not a slice.' },
    { q: 'Do I need a solicitor or a notary?', a: 'A solicitor or licensed conveyancer. England has no continental notaire; the Land Registry entry, not a deed reading, is what completes the transfer.' },
  ],
)

const LONDON_RENT = intent(
  'Rent',
  'London',
  'Rent a flat in London | sivrce',
  'Renting in London: the five-week deposit cap and its protection scheme, the Renters\' Rights Act ending section 21, right-to-rent checks and the EPC floor.',
  'A London deposit is capped at five weeks\' rent and must sit in a government-approved protection scheme within thirty days. An unprotected deposit costs the landlord up to three times the sum, and blocks possession.',
  [
    'The Renters\' Rights Act ends assured shorthold fixed terms and section 21 no-fault eviction. Possession now runs through stated statutory grounds, which changes how a buy-to-let underwrites an exit — model that, not a 2019 landlord blog.',
    'The Tenant Fees Act bars almost every charge beyond rent, deposit and a capped change-of-tenancy fee. A landlord must also run a right-to-rent immigration check, and cannot let a property below EPC band E.',
    'Service charge is where a leasehold yield goes to die. Read three years of accounts and the cladding file before you treat the gross figure as income.',
  ],
  [
    { q: 'How much deposit can be taken?', a: 'Five weeks\' rent where annual rent is under £50,000, six weeks above it, protected in an approved scheme within thirty days.' },
    { q: 'Can a landlord still evict without a reason?', a: 'No. Section 21 no-fault eviction is being removed; possession requires a stated statutory ground and, in most cases, a court.' },
  ],
)

const NEW_YORK_BUY = intent(
  'Buy',
  'New York',
  'Buy an apartment in New York | sivrce',
  'Buying in New York: condo against co-op, the buyer-side mansion tax from $1m, mortgage recording tax, and an attorney-driven closing that has no notary in it.',
  'The first decision in New York is not the neighbourhood, it is condo or co-op. A co-op board can reject you without giving a reason and can cap your financing; a condo is the predictable route for a foreign buyer, and it prices accordingly.',
  [
    'The mansion tax is the buyer\'s and starts at 1% of the whole price at $1m, stepping up from there. If you finance, mortgage recording tax adds roughly another two points. On a sponsor sale the buyer often absorbs the transfer tax as well.',
    'Closings run through attorneys and a title company, not a notaire. Title insurance, not a public register\'s guarantee, is what protects you — and it is bought once, at closing.',
    'No Social Security number is required to take title. FIRPTA withholding hits foreign sellers, not buyers, so it is an exit problem to plan for rather than an entry barrier.',
  ],
  [
    { q: 'Co-op or condo as a foreign buyer?', a: 'Condo, in most cases. Co-op boards commonly require US-based income, liquidity held domestically and a personal interview, and can decline without explanation.' },
    { q: 'What are the buyer\'s closing costs?', a: 'Roughly 2–4% depending on financing: title insurance, attorney, recording, mansion tax above $1m and mortgage recording tax if you borrow.' },
  ],
)

const NEW_YORK_RENT = intent(
  'Rent',
  'New York',
  'Rent an apartment in New York | sivrce',
  'Renting in New York: rent stabilization, the one-month security cap, the 40x income convention, and the FARE Act that moved the broker fee to whoever hired the broker.',
  'New York caps security at one month\'s rent and bars the old practice of stacking last month plus a deposit. Landlords conventionally want provable annual income around forty times the monthly rent, or a guarantor who clears a higher bar.',
  [
    'Rent stabilization covers a large share of the older housing stock and governs both the increase and the renewal right. Whether a specific unit is stabilized is a question with a documented answer — ask for the rent history rather than accepting a listing\'s word.',
    'The FARE Act moved the broker fee to the party who hired the broker, ending the long-standing practice of charging a tenant for the landlord\'s agent. Budget the first month and the one-month security, and query anything beyond that.',
    'Short-term letting under thirty days without the permanent occupant present is unlawful in most of the housing stock and is enforced through a registration regime. It is not a grey area.',
  ],
  [
    { q: 'How much cash do I need up front?', a: 'Typically first month plus a one-month security. The security cap is statutory, and a broker fee is now the responsibility of whoever engaged the broker.' },
    { q: 'How do I know if a unit is rent-stabilized?', a: 'Request the rent history from the state housing agency. Status follows the unit and its history, not the landlord\'s description of it.' },
  ],
)

const TORONTO_BUY = intent(
  'Buy',
  'Toronto',
  'Buy a home in Toronto | sivrce',
  'Buying in Toronto: two land transfer taxes, the non-resident speculation tax, the status certificate and reserve fund, and FINTRAC source-of-funds checks.',
  'Toronto is the only Canadian city that charges land transfer tax twice — once for Ontario and once for the city. Both are banded, both are payable in cash at closing, and together they land near 4% at the million-dollar mark.',
  [
    'Ontario applies a non-resident speculation tax on top for foreign buyers. First-time buyer rebates exist at both the provincial and municipal level; an investor qualifies for neither. Budget the statute in force on your closing date.',
    'In a condo the status certificate is the deal: the reserve fund study, the current balance, any special assessment and any litigation. A special assessment voted the month after closing is still yours.',
    'Pre-construction assignments are a separate contract file with occupancy fees, an interim closing and a builder\'s right to amend. They are not simply a cheaper resale.',
  ],
  [
    { q: 'How much are the two land transfer taxes?', a: 'Provincial plus the City of Toronto\'s municipal levy. On a $900,000 purchase inside the city they come to roughly 4% combined — the single largest closing line.' },
    { q: 'Can a non-resident buy?', a: 'Check the federal prohibition in force and Ontario\'s speculation tax before you commit. The rules have changed more than once and this page will not pretend a frozen answer.' },
  ],
)

const TORONTO_RENT = intent(
  'Rent',
  'Toronto',
  'Rent an apartment in Toronto | sivrce',
  'Renting in Toronto: the annual Ontario rent increase guideline, the post-2018 exemption that undoes it, last month\'s rent as the only lawful deposit, and the Landlord and Tenant Board queue.',
  'Ontario publishes an annual rent increase guideline, and it binds most older units. Units first occupied after 15 November 2018 are exempt from it, which means two identical apartments in the same neighbourhood can follow completely different rules.',
  [
    'The only deposit a landlord may lawfully collect is last month\'s rent, which must be applied to the final month and accrues interest. A damage deposit is not lawful in Ontario, whatever the listing calls it.',
    'A landlord can recover a unit for their own or a close family member\'s use, but that route carries compensation and a good-faith requirement, and bad-faith use of it is penalised.',
    'The Landlord and Tenant Board queue is long enough to be an underwriting assumption rather than a footnote. Price the time, not just the rent.',
  ],
  [
    { q: 'Is my unit covered by the rent guideline?', a: 'Only if it was first occupied as a residential unit on or before 15 November 2018. Newer units are exempt, and the increase is whatever the lease and the market allow.' },
    { q: 'Can I be asked for a damage deposit?', a: 'No. Last month\'s rent is the only permitted deposit, plus a key deposit limited to the replacement cost.' },
  ],
)

const ISTANBUL_BUY = intent(
  'Buy',
  'Istanbul',
  'Buy an apartment in Istanbul | sivrce',
  'Buying in Istanbul: the tapu, the 4% deed fee, building code year against the 1999, 2007 and 2018 revisions, DASK, military-zone clearance and district foreign-ownership quotas.',
  'The sale happens at the land registry and the tapu is the title. Nothing before the tapu appointment transfers anything — a reservation form, a payment plan and a developer\'s brochure are not ownership.',
  [
    'The deed fee is 4% of the declared value, legally 2% from each side and in practice usually carried by the buyer. Declaring below the real price to shave it is tax fraud, and it caps the cost base you will one day be taxed against on sale.',
    'Building code year is the first question in this city, not the last. Ask where the building sits against the 1999, 2007 and 2018 revisions, whether it has been through kentsel dönüşüm, and what its DASK policy actually covers. DASK is a legal minimum, not full cover.',
    'Some parcels still require military-zone clearance before a foreigner can complete, and each district has a foreign-ownership quota that can block a transfer outright. Both are checks to run before money moves, not after.',
  ],
  [
    { q: 'What does completion cost?', a: 'About 6% on top of the price: the 4% deed fee, registry service fees, sworn translator and notarised power of attorney, plus agency at 2% with KDV where an agent is engaged.' },
    { q: 'Does buying give me citizenship?', a: 'Thresholds are set by government circular and move. Treat a developer\'s "passport included" slide as marketing until the official gazette agrees.' },
  ],
)

const ISTANBUL_RENT = intent(
  'Rent',
  'Istanbul',
  'Rent an apartment in Istanbul | sivrce',
  'Renting in Istanbul: one-year leases that renew automatically, CPI-linked increase caps, a three-month deposit ceiling, and eviction that runs through a court.',
  'An Istanbul residential lease runs one year and renews automatically. The landlord cannot simply decline to renew — ending a tenancy requires a statutory ground, and in practice a court.',
  [
    'Annual increases are tied to the twelve-month average consumer price index. In a high-inflation year that is a real constraint on the landlord and a real exposure for the tenant, and it makes a lira yield a moving number rather than a fixed one.',
    'The deposit is capped at three months\' rent under the Turkish Code of Obligations. Rent paid in cash without a bank record is a dispute waiting to happen; transfers with a reference are the norm for good reason.',
    'European-side, Asian-side and Bosphorus-front lettings are three different tenant markets. Aidat — the building service charge — sits outside the quoted rent and rises with inflation like everything else.',
  ],
  [
    { q: 'How much can the rent rise at renewal?', a: 'Increases are bound to the twelve-month average CPI. A demand above that is challengeable, and the renewal itself is the tenant\'s right.' },
    { q: 'What deposit is lawful?', a: 'Up to three months\' rent. Anything beyond that is not a market exception, whatever the agent says.' },
  ],
)

const ATHENS_BUY = intent(
  'Buy',
  'Athens',
  'Buy an apartment in Athens | sivrce',
  'Buying in Athens: the notary, the AFM, 3.09% transfer tax on assessed value, the Ktimatologio entry and the Golden Visa tier of the municipality.',
  'Buying in Athens is a notary, an AFM tax number, a 3.09% transfer tax on the assessed value and a Ktimatologio entry — plus a Golden Visa tier that depends on the municipality. Weeks, not days.',
  [
    'Sign a pre-agreement with a deposit, then complete at the sale deed before the symvolaiográfos. Between them: the lawyer’s title search back twenty-plus years, the engineer’s legality certificate, the ENFIA clearance proving no property tax is owed, and the settlement path.',
    'Objective values lag the market, so the 3.09% often bites less than the headline suggests — but the engineer’s certificate can kill a deal the tax office would happily take. Unpermitted semi-outdoor conversions must be legalized before transfer, not after.',
    'Most of the Athens basin sits in the €800,000 Golden Visa tier. If residency is part of the thesis, the municipality boundary is the first line of diligence, and the notary will want the funds visibly wired from abroad.',
  ],
  [
    { q: 'How long does an Athens purchase take?', a: 'Six to ten weeks cash on a clean file, longer with a Greek mortgage — which non-residents get slowly and rarely. The title search and the engineer’s certificate set the pace.' },
    { q: 'Is the pre-agreement deposit at risk?', a: 'Commonly 10%, forfeit if the buyer walks without contractual cause. Title and legality suspensive clauses must be written in, not assumed.' },
  ],
)

const ATHENS_RENT = intent(
  'Rent',
  'Athens',
  'Rent an apartment in Athens | sivrce',
  'Renting in Athens: the three-year minimum lease, two-month deposits, and the AMA short-let registry that decides what the centre can earn.',
  'Athens rents on three-year minimum leases, two-month deposits and a short-let registry that removed thousands of central flats from the long-let book — then partially returned them under restriction.',
  [
    'The three-year minimum applies whether the contract says so or not; a one-year lease extends by law. Deposits cap at two months, and rent is typically paid monthly in advance with annual adjustment by agreement rather than statute.',
    'Central districts operate under short-let restrictions with AMA registration enforced through the platforms. A flat priced on nightly income without a registration number is a fine waiting for an owner.',
    'Student demand around the universities and professional demand in Marousi and the northern suburbs underwrite the long-let book. Underwrite the tenant, not the monuments.',
  ],
  [
    { q: 'Can the landlord end the lease early?', a: 'Only on statutory grounds with notice and compensation mechanics — a fixed term is a commitment in both directions.' },
    { q: 'What deposit is legal?', a: 'Two months’ rent. More is not a market exception.' },
  ],
)

const NICOSIA_BUY = intent(
  'Buy',
  'Nicosia',
  'Buy property in Nicosia | sivrce',
  'Buying in Nicosia: the advocate, the Lands Office search, halved transfer fees on resale and Specific Performance within six months.',
  'Buying in Nicosia is an advocate, a District Lands Office search, and a transfer fee that is halved on resale and zero on VAT-charged new build. The boring end of Cyprus is the safe end.',
  [
    'Reserve with a deposit, sign the sale contract, and deposit it at the District Lands Office within six months — that stamp is your Specific Performance shield against the seller mortgaging or reselling underneath you. Searches must confirm the seller holds what they are selling and that no memo or charge sits on it.',
    'Non-EU buyers file for Council of Ministers permission, routinely granted for one unit. Funds should arrive identifiably from abroad; the advocate’s source-of-funds file is not optional.',
    'Apartments in Strovolos and Engomi are the professional book; suburban houses are the family book. Neither needs a sea view to justify itself, which is precisely the point.',
  ],
  [
    { q: 'New build or resale?', a: 'New build with VAT pays no transfer fees but arrives with the title-deed wait; resale pays the halved scale with title usually in hand. Price the wait.' },
    { q: 'How long does it take?', a: 'Six to twelve weeks for a clean resale with permission in hand; longer where the permit or the title needs work.' },
  ],
)

const NICOSIA_RENT = intent(
  'Rent',
  'Nicosia',
  'Rent property in Nicosia | sivrce',
  'Renting in Nicosia: year-round demand, one to two months’ deposit, statutory tenancies that continue after expiry, and rent control on older stock.',
  'Nicosia rents year-round to people who work there — one to two months’ deposit, statutory tenancies that continue after expiry, and rent control that still bites pre-2000 stock in controlled areas.',
  [
    'A tenancy that expires does not end by itself: the statutory tenancy continues on the same terms unless a court orders possession. That cuts both ways — security for the tenant, patience for the landlord.',
    'Controlled tenancies in older buildings follow the statutory increase order, not the market. Check the building’s age and controlled status before you underwrite growth.',
    'Student demand around the universities fills small units each autumn with metronomic reliability. It is the closest thing Cyprus has to a guaranteed book.',
  ],
  [
    { q: 'What deposit is standard?', a: 'One to two months. More is not standard.' },
    { q: 'Can rent rise freely?', a: 'On uncontrolled stock, by agreement at renewal. On controlled stock, by the order — which has often meant a freeze.' },
  ],
)

const AMSTERDAM_BUY = intent(
  'Buy',
  'Amsterdam',
  'Buy an apartment in Amsterdam | sivrce',
  'Buying in Amsterdam: the notaris, 2% transfer tax for residents, bidding with conditions, and the erfpacht file that decides the real price.',
  'Buying in Amsterdam is a notaris, 2% transfer tax for residents, a bidding process with conditions to waive or keep, and an erfpacht file that decides the real price. Preparation beats speed.',
  [
    'View, bid in writing with your conditions — financing clause, structural survey, transfer date — sign the koopakte, then complete at the notaris weeks later when the Kadaster registers you. Waiving the financing clause wins bids and loses deposits: the standard 10% bank guarantee is forfeit if you cannot close.',
    'The VvE minutes and multi-year maintenance plan tell you whether the pretty facade hides a five-figure roof assessment. Active associations with funded reserves are worth paying for; dormant ones are a bill with a building attached.',
    'Under-35 first-home buyers may pay 0% transfer tax up to the year’s indexed ceiling. Investors pay 10.4% and should not run their math on the resident rate.',
  ],
  [
    { q: 'How fast must I bid?', a: 'Fast to view, slow to waive. A bouwkundige keuring costs hundreds and has saved buyers tens of thousands; keep the clause unless you can afford the building twice.' },
    { q: 'Financing as a foreigner?', a: 'Dutch banks lend to non-residents reluctantly and at lower loan-to-value. Cash or a home-country facility closes more deals.' },
  ],
)

const AMSTERDAM_RENT = intent(
  'Rent',
  'Amsterdam',
  'Rent an apartment in Amsterdam | sivrce',
  'Renting in Amsterdam: the WWS points system, the Huurcommissie, open-ended contracts by default and a licensed short-stay niche.',
  'Amsterdam rents under the points system: below the liberalization threshold the rent has a legal maximum, the Huurcommissie enforces it, and the advert’s number is an opening position.',
  [
    'Ask for the points calculation before you sign. Anything above the maximum for a regulated home is recoverable, and the challenge window is longer than most tenants think.',
    'Since July 2024 new contracts are open-ended by default. Temporary two-year contracts mostly ended with the reform; anything labelled temporary now needs a statutory ground.',
    'Furnished short-stay is a licensed niche with night caps and registration. A landlord offering rolling short cycles is describing a violation, not a product.',
  ],
  [
    { q: 'What deposit is legal?', a: 'Two months’ rent maximum.' },
    { q: 'Can the rent rise?', a: 'Annually within the statutory maximum percentage the government sets each year — above it only with Huurcommissie-proof justification.' },
  ],
)

const LISBON_BUY = intent(
  'Buy',
  'Lisbon',
  'Buy an apartment in Lisbon | sivrce',
  'Buying in Lisbon: the NIF, the CPCV with sinal, the escritura, IMT on the higher of price and VPT, and 0.8% stamp duty.',
  'Buying in Lisbon is a NIF, a CPCV promissory contract with a sinal deposit, then the escritura — with IMT on the higher of price and VPT and 0.8% stamp duty before the notary will close.',
  [
    'The CPCV locks price, parties and forfeits — commonly 10–20% sinal, doubled back if the seller walks. Between CPCV and escritura: the registry certificate, the caderneta predial, the utilisation licence and the energy certificate. No licence, no deed.',
    'IMT on a €350,000 investment purchase is about €15,300 plus €2,800 of stamp duty — both payable before completion, both on the buyer. A primary-residence buyer pays materially less; confirm which table you sit in.',
    'Lease-risk check: sitting tenants under old contracts still surface in historic stock. The registry certificate shows charges; only the tenancy file shows the tenant.',
  ],
  [
    { q: 'How long does it take?', a: 'Six to ten weeks from CPCV to escritura on a clean file; longer where licences or VPT disputes need work.' },
    { q: 'Is the sinal at risk?', a: 'Forfeit to the seller if the buyer walks without cause, doubled back if the seller walks. Suspensive clauses must be written, not assumed.' },
  ],
)

const LISBON_RENT = intent(
  'Rent',
  'Lisbon',
  'Rent an apartment in Lisbon | sivrce',
  'Renting in Lisbon: NRAU renewal rights, the three-month move-in ceiling, and the AL freeze that pushed stock back into long-let.',
  'Lisbon rents under NRAU with tenant renewal rights, a three-month total move-in cost ceiling, and a short-let freeze that pushed stock back into the long-let book — at higher rents.',
  [
    'Caução plus advance rent is capped at three months total. Contracts state their term and renewal; ending one early as a landlord needs a statutory ground, formal notice and often compensation.',
    'The AL freeze in containment zones returned units to long-let but did not return 2019 rents. University and tech-worker demand underwrites studios and one-bedrooms; families compete for two and three bedrooms in Alvalade and Benfica.',
    'Condomínio arrears follow the unit. Ask the building manager for the debt position before you sign — the discount for skipping this step is always negative.',
  ],
  [
    { q: 'Can the landlord refuse renewal?', a: 'Only on the statutory grounds with the statutory notice — opposition to renewal is a compensated procedure, not a letter.' },
    { q: 'What is due on move-in?', a: 'Caução plus advance rent, three months total ceiling.' },
  ],
)

const ZURICH_BUY = intent(
  'Buy',
  'Zurich',
  'Buy an apartment in Zurich | sivrce',
  'Buying in Zurich: the notarized deed, Grundbuch registration, no transfer tax, and the renewal-fund file that decides the real price.',
  'Buying in Zurich is a reservation, a notarized purchase contract and registration in the Grundbuch — with no transfer tax, cantonal notary scales, and a renewal-fund file that decides the real price.',
  [
    'The public deed before the cantonal notary is constitutive — without it there is no sale. Between reservation and deed: the register extract showing charges and easements, the renewal fund balance, the house rules and the last owners’ meeting minutes.',
    'Closing costs run around 1% all-in for notary and registry on a typical purchase — the lowest friction of any market on this site, which is exactly why the entry price is the highest.',
    'Mortgages are the Swiss specialty: 20% equity standard, affordability stress-tested at imputed rates near 5%, and amortization rules that reward advice before the reservation deposit.',
  ],
  [
    { q: 'How fast does it close?', a: 'Four to eight weeks from reservation to registration on a clean file. The notary’s diary, not the bank, is usually the constraint.' },
    { q: 'New-build risk?', a: 'Developer contracts with stage payments tied to construction progress; the developer’s solvency and the land charge securing your payments are the file.' },
  ],
)

const ZURICH_RENT = intent(
  'Rent',
  'Zurich',
  'Rent an apartment in Zurich | sivrce',
  'Renting in Zurich: reference-rate rules, three-month blocked deposits, fierce competition and a 30-day window to challenge the initial rent.',
  'Zurich rents under reference-rate rules, three-month blocked deposits and fierce competition — the application dossier decides who gets the flat, and the initial rent can be challenged where the official form applies.',
  [
    'Apply with the full dossier: employment contract, salary proof, debt-register extract and references. Landlords choose from dozens; completeness is the strategy.',
    'Notice runs three months to the customary local moving dates in many contracts — read the termination clause before you sign, because it also governs your exit.',
    'Where the canton mandates the official initial-rent form, an excessive starting rent is challengeable within 30 days. In the city of Zurich that form has applied since 2023 — use the window or lose it.',
  ],
  [
    { q: 'Where does the deposit go?', a: 'Up to three months in a blocked account in your name — never to the landlord’s private account.' },
    { q: 'Can the rent rise?', a: 'Only on the statutory grounds: reference-rate increases, inflation pass-through and value-adding improvements. Each is challengeable.' },
  ],
)

export const EXTRA_CITIES: Partial<Record<keyof typeof EXTRA_NAMES, Record<string, CityPack>>> = {
  fr: {
    paris: city(
      'Paris',
      'Paris is a notaire-and-DPE market with reference rents inside the périphérique. Haussmannian, post-war and petite couronne are three products, not one skyline.',
      [
        'Encadrement des loyers sets a reference rent per square metre by quartier and room count; a lease above it needs a justified complément de loyer or it is challengeable. The DPE decides whether you can let at all — class G is already barred from new lettings.',
        'A chambre de bonne, a parking space and a lift are not rounding errors on the yield in a city where the median flat is under 60 m². Copropriété charges and the état daté belong in the file before the compromis, not after.',
        'This page stays a buying briefing until verified Paris listings are live. sivrce does not publish a French listing it cannot source.',
      ],
      [
        { q: 'Can foreigners buy in Paris?', a: 'Yes. Expect a notaire, roughly 7% acquisition costs on an existing flat, and a French settlement path. No extra foreigner tax.' },
        { q: 'Does rent control really bite?', a: 'Inside Paris, yes. Reference rents apply to most new and renewed leases and a tenant can demand a reduction retroactively. Underwrite the grid, not short-let math.' },
      ],
      { buy: PARIS_BUY, rent: PARIS_RENT },
    ),
    lyon: city(
      'Lyon',
      'Lyon prices off jobs, two rivers and a two-hour TGV to Paris — not off being a discounted 9th arrondissement. Presqu’île, Croix-Rousse and Part-Dieu do not share a cap rate.',
      [
        'The market is smaller and far less foreign-buyer theatrical than Paris, and Lyon applies encadrement des loyers across the city plus Villeurbanne. The national notarial machine is the same; the micro-location is not.',
        'Student, pharmaceutical and back-office employment supports the long-let book. Tourist occupancy does not define this city, and the low-emission zone around the centre changes what a parking space is worth.',
      ],
      [
        { q: 'Cheaper than Paris?', a: 'Usually well below on a per-square-metre basis. Not automatically higher yield once vacancy, works and the rent grid are honest.' },
        { q: 'Same notaire rules?', a: 'Yes — one French national sale process. The city briefing is local; the deed is not.' },
      ],
    ),
    marseille: city(
      'Marseille',
      'Marseille is the cheapest large French metro per square metre and the one where the condominium file matters most. Sixteen arrondissements split hard between the southern coast and the northern quartiers.',
      [
        'The 2018 rue d’Aubagne collapse rewrote how this city treats degraded copropriétés: expect arrêtés de péril, habitat indigne procedures and syndic arrears to appear in real files. Read the assemblée générale minutes and the fund balance before the price.',
        'The 7th and 8th arrondissements, the Calanques edge and Vieux-Port frontage price like a different city from the 13th, 14th and 15th. Euroméditerranée is a genuine regeneration programme with a twenty-year horizon, not a launch slogan.',
        'Marseille applies encadrement des loyers. Short-let is concentrated and politically watched; the licence, not the photos, decides the model.',
      ],
      [
        { q: 'Why is Marseille so much cheaper than Nice?', a: 'A far larger and older housing stock, a wider income spread, and a real capex tail on pre-war buildings. The discount is mostly the condition of the building, not a market mispricing.' },
        { q: 'What is the one document to demand?', a: 'The last three assemblée générale minutes plus the état daté. Works voted and unpaid charges follow the lot to the new owner.' },
      ],
    ),
    bordeaux: city(
      'Bordeaux',
      'Bordeaux repriced when the LGV cut Paris to two hours in 2017, then digested it. Golden Triangle and Chartrons stone are a different asset from the incentive-era towers on the right bank.',
      [
        'Classified eighteenth-century stone in the UNESCO perimeter comes with Architecte des Bâtiments de France constraints on facades, windows and roofs — a cheap renovation quote is usually a quote for the wrong works.',
        'A decade of tax-incentive new-build left an identifiable stock of small investor flats in Bègles, Bassins à Flot and the Bastide. They rent, but they compete with each other. Bordeaux applies encadrement des loyers and runs a low-emission zone.',
        'The Garonne floodplain is mapped. Ask for the Plan de Prévention des Risques before you treat riverside frontage as free upside.',
      ],
      [
        { q: 'Is the TGV premium still there?', a: 'Partly. The 2016–2019 surge flattened and then corrected. Buy the street and the building, not the headline about the train.' },
        { q: 'Stone or new-build?', a: 'Stone carries ABF constraints and heavier capex; new-build carries lower notaire fees (~2–3%) and heavier supply competition. They are different trades.' },
      ],
    ),
    nice: city(
      'Nice',
      'Nice runs three overlapping markets on one seafront: residents, second homes and short-lets. The Carré d’Or, Mont Boron and the Old Town are not interchangeable.',
      [
        'Meublés de tourisme require registration and, in the tightened zones, a change-of-use authorisation with compensation. The city has been aggressive about enforcement — assume the licence is the asset, not the flat.',
        'Sea view, floor level and lift presence move price more than square metres do. Coastal exposure also means salt-air maintenance and rising insurance on older seafront copropriétés.',
        'The airport is the second busiest in France, which is why the second-home book here is genuinely international rather than Parisian weekend traffic.',
      ],
      [
        { q: 'Can I run it as a holiday let?', a: 'Only with registration and, in the restricted zones, an authorisation. Buying “for Airbnb” without checking the commune’s current rules is how people buy a fine.' },
        { q: 'Is a sea view worth the premium?', a: 'It is the most durable price factor on this coast and the least liquid to fake. It also carries the highest maintenance and insurance line.' },
      ],
    ),
    toulouse: city(
      'Toulouse',
      'Toulouse is the aerospace capital and one of the fastest-growing large French cities — brick, not Haussmann, and student demand that never switches off.',
      [
        'Airbus and its supply chain anchor the employment base, with a large university population on top. That combination supports small-unit long-let far more reliably than tourism does.',
        'The centre is compact and constrained; Compans-Caffarelli, Saint-Cyprien and the Canal du Midi belts absorb most of the professional demand. The third metro line under construction is a real location variable with a real completion risk.',
      ],
      [
        { q: 'Is Toulouse a student-let market?', a: 'Substantially. Underwrite the summer void and the furnished-lease regime rather than pasting a family-flat model onto a studio.' },
        { q: 'Does the aerospace cycle matter?', a: 'Yes. A single-employer region is a concentration risk. It has been a growth story for two decades, which is not the same as a guarantee.' },
      ],
    ),
  },
  es: {
    madrid: city(
      'Madrid',
      'Madrid is Spain’s jobs and liquidity hub and its cheapest big-city transfer tax at 6% ITP. Salamanca, Tetuán and the southern cone are three different books.',
      [
        'ITP on resale at 6%, IVA plus AJD on new-build. Comunidad fees, IBI and the energy certificate belong in the first spreadsheet, not the last. Foreign buyers use an NIE and a notario.',
        'The Comunidad de Madrid has not applied the national zonas tensionadas rent caps, which makes the letting model here materially different from Catalonia’s. That is a policy position, not a permanent law.',
        'This page stays a briefing until verified Madrid listings are live.',
      ],
      [
        { q: 'Golden visa?', a: 'The property-for-residency route closed in 2025. Buy the asset, not a visa slide.' },
        { q: 'Short-term rent?', a: 'A municipal licence question with an increasingly restrictive answer. Check the current Madrid rules before you underwrite occupancy.' },
      ],
      { buy: MADRID_BUY, rent: MADRID_RENT },
    ),
    barcelona: city(
      'Barcelona',
      'Barcelona is a licence-and-scarcity city paying Catalonia’s 10% ITP. Eixample, Gràcia and the beachfront are not interchangeable, and tourist stock is politically constrained.',
      [
        'Catalonia’s ITP is tiered above €600,000 and higher again for large holders — the 10% headline is a floor, not a ceiling. Plusvalía municipal and comunidad still sit outside the asking price.',
        'The city has announced the phase-out of tourist-apartment licences by 2028 and applies the zonas tensionadas rent caps. Any model that depends on short-let income needs the licence in hand and an exit assumption.',
        'A nota simple is cheaper than a surprise charge on the deed. sivrce will not invent listings to fill this page.',
      ],
      [
        { q: 'Can I tourist-rent a flat?', a: 'Assume no unless you hold a current HUT licence, and read the 2028 phase-out before you capitalise the income.' },
        { q: 'Language of the deed?', a: 'Spanish and/or Catalan at the notario. Bring a translator if you cannot read the minuta.' },
      ],
    ),
    valencia: city(
      'Valencia',
      'Valencia is the cheapest of Spain’s big three and still pays the same 10% ITP as Catalonia. Ruzafa, El Carmen and Cabanyal are distinct books — and since 2024, so is the flood map.',
      [
        'The October 2024 DANA flooding south and west of the city made hydrological risk an ordinary due-diligence item here, not a footnote. Check the parcel against the published flood zoning and the insurance position, including the Consorcio de Compensación de Seguros.',
        'The city has restricted new tourist-let licences in the central districts. Cabanyal’s regeneration is real but uneven street by street; the Turia gardens and the huerta edge are the structural amenities that will not change.',
        'ITP at 10% plus notario, registro and legal puts total acquisition cost near 12% on a resale. Run that before the yield.',
      ],
      [
        { q: 'Is Valencia still cheap?', a: 'Cheaper than Madrid and Barcelona per square metre, and no longer cheap against its own five-year history. The gap narrowed fast between 2021 and 2025.' },
        { q: 'How seriously should I take flood risk?', a: 'Seriously enough to pull the zoning map before the deposit. The 2024 event was catastrophic in the southern metropolitan belt and it changed pricing and insurance behaviour.' },
      ],
    ),
    malaga: city(
      'Málaga',
      'Málaga turned from a Costa del Sol gateway into a tech-employment city, and it pays Andalucía’s 7% ITP. The centre, Soho and the western beaches are separate markets from the inland barrios.',
      [
        'A large technology and shared-services cluster added year-round professional tenants to what used to be a seasonal book. That is the single biggest change in this market in a decade, and it is what makes long-let underwriting viable here.',
        'The city froze or restricted new tourist-let registrations across dozens of districts as saturation became a political issue. The 7% regional ITP is the friendliest headline rate of Spain’s big coastal metros; the licence risk is not.',
        'Comunidad fees on beachfront urbanizaciones — pools, lifts, security — are the line that quietly eats a gross yield.',
      ],
      [
        { q: 'Is Málaga only a holiday market now?', a: 'No, and that is the point. The tech and services base supports twelve-month tenants, which is a different asset from a summer flat.' },
        { q: 'Why is Andalucía cheaper to buy in?', a: 'The región sets ITP at 7% against 10% in Catalonia and Valencia. On €300,000 that is a €9,000 difference before anything else.' },
      ],
    ),
    seville: city(
      'Seville',
      'Seville is Andalucía’s capital and its most domestic big market — 7% ITP, a low foreign share, and a summer that is a genuine design constraint.',
      [
        'Triana, Nervión and Los Remedios are the established residential books; the historic centre is a small, constrained and heavily regulated stock. Heritage protection on the centro histórico limits what a renovation can legally do to a facade or a patio.',
        'Forty-plus degree summers make orientation, cross-ventilation and the energy certificate practical rather than cosmetic. A north-facing flat is a different product here than in Bilbao.',
        'Demand is driven by regional government, services and the university rather than by foreign second-home buying — which makes the rental book steadier and the resale liquidity thinner.',
      ],
      [
        { q: 'Is Seville a foreign-buyer market?', a: 'Much less than the coast. That means less speculative froth and also fewer buyers when you sell. Price the liquidity.' },
        { q: 'Does the heat affect value?', a: 'Yes, measurably. Orientation, shading, patio access and a working climate system move both rent and resale in this city.' },
      ],
    ),
    alicante: city(
      'Alicante',
      'Alicante is the Costa Blanca’s administrative and transport hub, with Spain’s deepest Northern-European second-home book behind it. Playa de San Juan and the old town are separate products from the urbanizaciones inland.',
      [
        'This is a resale-heavy market where the comunidad budget is the real yield: pools, lifts, gardens and security on a large urbanización can cost more per year than the IBI. Read the budget and the derrama history.',
        'Comunitat Valenciana charges 10% ITP, the same as Catalonia, which surprises buyers comparing headline prices with Andalucía. Total acquisition cost lands near 12% on a resale.',
        'The airport and the high-speed line make this a genuinely commutable second-home coast rather than a drive-only one — which is why the winter occupancy story differs street by street.',
      ],
      [
        { q: 'Is it a year-round market?', a: 'Partly. The city itself has year-round residents; many of the coastal urbanizaciones outside it empty between October and April. Do not average the two.' },
        { q: 'What kills the yield here?', a: 'Comunidad charges and special assessments on amenity-heavy complexes, plus the 10% ITP on the way in. Both are knowable before you bid.' },
      ],
    ),
  },
  it: {
    rome: city(
      'Rome',
      'Rome inside the GRA is scarcity plus bureaucracy; outside it is a different commute entirely. Centro storico, Prati, EUR and the coast do not share a cap rate.',
      [
        'Cadastral rendita drives registration tax on most private resales under prezzo-valore, so the headline 9% overstates the real bill. Condominio arrears transfer with the flat if you do not check the last balance.',
        'Tourist demand is real and the possession calendar is slow. A Rome yield model that ignores how long an eviction takes is a marketing document, not an underwriting.',
        'Historic-centre buildings carry Soprintendenza constraints and lift-installation limits that quietly cap what a renovation can deliver.',
      ],
      [
        { q: 'Need a codice fiscale?', a: 'Yes, before the notaio appointment, and again for the utilities and the IMU filing.' },
        { q: 'Prima casa relief?', a: 'For buyers who move their residenza to the comune within eighteen months. A holiday buyer pays the ordinary 9%.' },
      ],
      { buy: ROME_BUY, rent: ROME_RENT },
    ),
    milan: city(
      'Milan',
      'Milan is Italy’s finance, design and employment market — the one Italian city where jobs, not ruins, set the price. Porta Nuova, the old centre and the hinterland do not share a yield.',
      [
        'Prices follow employment and infrastructure. Agency fees plus notaio are a visible slice of equity on day one, and the APE energy class now moves the bid in a way it did not five years ago.',
        'Condominio special assessments — facade works, lift replacement, post-incentive balances — are the single most common unpleasant surprise in this market. Ask for the last three years of minutes.',
        'This is not a Rome page with a different skyline: the tenant profile, ticket size and vacancy behaviour are all different.',
      ],
      [
        { q: 'Good for yield?', a: 'Some peripheral and student stock cash-flows; Brera trophies do not. Run condominio plus IMU before the brochure.' },
        { q: 'Foreign buyers allowed?', a: 'Yes for ordinary residential. The notaio still needs a codice fiscale and full KYC.' },
      ],
    ),
    florence: city(
      'Florence',
      'Florence is a small UNESCO core wrapped in a normal Tuscan city, and since 2023 the historic centre has blocked new short-term tourist lets outright.',
      [
        'That restriction is the defining fact of this market. Inside the UNESCO perimeter the short-let model is closed to new entrants, which pushed value toward long-let, student housing and owner-occupation — and pushed short-let demand outward to Campo di Marte, Novoli and the Oltrarno fringe.',
        'The centre’s stock is protected, vertical and often liftless, with Soprintendenza approval required for visible works. A palazzo floor is a heritage asset with a heritage maintenance bill.',
        'Three universities and a large international-student population give the long-let book a depth that most tourist cities lack.',
      ],
      [
        { q: 'Can I short-let in the centre?', a: 'Not as a new operator inside the UNESCO area — the comune blocked new registrations. Check the current perimeter and any grandfathering before you model income.' },
        { q: 'Is a historic-centre flat a good investment?', a: 'It is a scarce asset with a constrained use-case and a real capex tail. Buy it for scarcity and occupation, not for a short-let spreadsheet.' },
      ],
    ),
    turin: city(
      'Turin',
      'Turin is the cheapest major northern Italian city — a former single-industry capital with grand Baroque stock and a student population that keeps the centre full.',
      [
        'The post-automotive transition is genuine but incomplete: the city added universities, aerospace and food industry while losing the manufacturing employment that built it. Price the labour market you can verify, not the one on the plaque.',
        'Crocetta and the Quadrilatero are the premium; San Salvario and Vanchiglia carry the student and young-professional book; the northern belts remain cheap for a reason. The renovation-incentive years left a trail of both restored facades and unresolved condominio balances.',
        'The Alps are an hour away, which supports a small but real weekend-second-home flow that Milan does not have.',
      ],
      [
        { q: 'Why is Turin cheaper than Milan?', a: 'A smaller and slower employment base, a larger stock, and less international demand. The discount is structural, not a temporary dislocation.' },
        { q: 'Renovation-incentive risk?', a: 'Ask whether works were completed, certified and fully financed. Unfinished or contested superbonus jobs left real liabilities inside some condomini.' },
      ],
    ),
    naples: city(
      'Naples',
      'Naples is the cheapest major Italian metro and the one with a live geological file. Chiaia, Vomero and Posillipo are a different market from the centro storico, and the western districts sit on the Campi Flegrei caldera.',
      [
        'The Campi Flegrei bradyseism — ground uplift and seismic swarms through 2023 to 2025 — is an ordinary due-diligence item in Bagnoli, Fuorigrotta and Pozzuoli, not folklore. Ask for the structural assessment and the civil-protection zoning.',
        'Building-permit history matters more here than in any other Italian city on this list. Unpermitted works and pending condono applications block a clean deed; the notaio will surface them, but late and expensively.',
        'Chiaia, Posillipo and the Vomero ridge carry a durable premium. The centro storico is UNESCO-listed, dense and, in parts, structurally tired.',
      ],
      [
        { q: 'Is the volcanic risk priced in?', a: 'Partly, and unevenly by district. Read the current civil-protection zoning for the parcel rather than the city average.' },
        { q: 'What is the most common deal-breaker?', a: 'Abusivismo — works done without permission. Demand the permit history and the conformità urbanistica before you pay a deposit.' },
      ],
    ),
    bologna: city(
      'Bologna',
      'Bologna runs on Europe’s oldest university and the Emilian logistics corridor. Kilometres of UNESCO porticoes, and a student rental book that is the real engine.',
      [
        'A large share of the resident population is students, which makes the per-room long-let the dominant investment product and makes September the only month that matters for leasing.',
        'The comune has tightened short-term letting inside the historic centre and pushed housing policy toward student and resident supply. Porticoed buildings carry shared maintenance obligations that show up in the condominio budget.',
        'The logistics and mechanical-engineering belt around the city gives a second, non-student demand base that Florence and Turin do not have in the same form.',
      ],
      [
        { q: 'Per-room or whole-flat letting?', a: 'Per-room is the local norm for student stock and yields more gross — with more management, more turnover and more regulatory attention.' },
        { q: 'Is the centre restricted?', a: 'Increasingly, for short lets. The long-let and student market is the policy-favoured direction. Model that, not a tourist calendar.' },
      ],
    ),
  },
  gb: {
    london: city(
      'London',
      'London is a stamp-duty, leasehold and borough-planning market. A Zone 1 trophy and a Zone 4 terrace are different products under one ISO path.',
      [
        'Check remaining lease term, ground rent and service charge before you compare price per square foot. Under about eighty years a lease starts costing real money to extend, and the premium grows every year you wait.',
        'SDLT is paid by the buyer on slice bands, plus 2% if you are non-resident and a further 5% if this will not be your only dwelling. Exchange is the contract — until then, gazumping is legal.',
        'Cladding and EWS1 files have repriced whole buildings since 2017. The building safety pack is not optional reading, and lenders treat it as underwriting.',
      ],
      [
        { q: 'Freehold or leasehold?', a: 'Most flats are leasehold. A short lease is a discount with a future bill attached — price the extension, not the asking price.' },
        { q: 'Overseas buyer extra tax?', a: 'A 2% non-resident SDLT surcharge on top of the standard bands, plus 5% more if it is an additional dwelling. Budget it before the offer.' },
      ],
      { buy: LONDON_BUY, rent: LONDON_RENT },
    ),
    manchester: city(
      'Manchester',
      'Manchester is a northern employment and student-rental market, not a cheaper Mayfair. City-centre towers, Victorian conversions and tram-suburb houses are three books.',
      [
        'Build quality and the cladding/EWS1 file have repriced whole buildings since 2017. Do not skip the building safety pack, and check who holds the freehold and what the ground rent does over the term.',
        'Gross yields look kinder than London until voids, ground rent, service charge and capex are honest. Off-plan city-centre stock competes directly with the next tower, which is usually already selling.',
        'The city operates selective licensing in parts of the borough — a let can require a licence the seller never mentioned.',
      ],
      [
        { q: 'Better yield than London?', a: 'Often on paper. Check service charge, cladding and actual achieved rent rather than a developer spreadsheet.' },
        { q: 'Same solicitors as London?', a: 'England and Wales process, local firms. Still exchange-then-complete, not a notaire.' },
      ],
    ),
    birmingham: city(
      'Birmingham',
      'Birmingham is the UK’s second-largest city economy with the youngest big-city population — and a council that issued a section 114 notice in 2023, which shows up in the council tax bill.',
      [
        'That financial distress is a genuine holding-cost variable: the city pushed council tax up by the maximum permitted amounts and cut discretionary services. Model the bill you will pay, not last year’s.',
        'City-centre build-to-rent towers around Broad Street and Eastside are the visible new stock; Selly Oak and Edgbaston carry the student book; Moseley and Harborne are the family premium. HS2’s truncation north of Birmingham changed the connectivity story some 2019 pitches were built on.',
        'Large parts of the city sit under selective licensing for private lets. Check the ward before you underwrite a tenancy.',
      ],
      [
        { q: 'Did the HS2 cancellation change the market?', a: 'The Birmingham leg survives; the northern legs did not. Buy the current timetable and the local employment base, not a 2019 regeneration deck.' },
        { q: 'Why does the council matter to a buyer?', a: 'Section 114 means maximum-permitted council tax rises and reduced services. That is a direct, recurring cost on every unit you own here.' },
      ],
    ),
    edinburgh: city(
      'Edinburgh',
      'Edinburgh is Scottish law end to end: LBTT instead of SDLT, 8% ADS on an additional home, missives that bind before an English exchange would, and a city-wide short-term let control area.',
      [
        'The short-term let licensing scheme plus the city-wide control area means a change of use is required to operate a whole-property holiday let. This is the most restrictive short-let regime of any city on sivrce — the licence, not the flat, is the constraint.',
        'Offers are usually made over a Home Report valuation, and once missives conclude you are bound. There is no gazumping window and no casual withdrawal; the survey work happens before the offer, not after.',
        'New Town and Old Town stock is conservation-area listed with common-repair obligations shared across a stair. A tenement roof is everyone’s bill.',
      ],
      [
        { q: 'Is buying here the same as in England?', a: 'No. Different tax (LBTT), different contract (missives), different survey model (Home Report), different letting rules. Treat it as a separate jurisdiction, because it is one.' },
        { q: 'Can I run a holiday let?', a: 'Only with a licence and, for a whole property in the control area, planning permission for change of use. Assume no until both are in hand.' },
      ],
    ),
    glasgow: city(
      'Glasgow',
      'Glasgow is Scotland’s largest city and the cheapest major UK metro per square metre — a tenement market where the common repair bill is the whole risk.',
      [
        'Most central stock is pre-1919 tenement flats. Roof, close and structural repairs are shared across the stair under the title deeds and the Tenements (Scotland) Act, and one absent or insolvent neighbour can stall a necessary job for years.',
        'The West End and the Southside carry the premium and the depth; the East End is cheap with a genuine condition tail. Glasgow also operates the Scottish short-term let licensing scheme.',
        'LBTT applies, with 8% ADS on an additional dwelling. There is no non-resident surcharge in Scotland, which makes the overseas maths here different from England.',
      ],
      [
        { q: 'Why are the yields so high on paper?', a: 'Low capital values against reasonable rents. The gap is common repairs, void risk and stock condition — all visible in the title deeds and the last factor’s statement.' },
        { q: 'What is a factor?', a: 'The property manager for a shared building. Their statement and arrears position tell you more about the real cost than the listing does.' },
      ],
    ),
    leeds: city(
      'Leeds',
      'Leeds is the UK’s largest financial and legal centre outside London, with a big student book and a river that has flooded the city centre in living memory.',
      [
        'The 2015 Boxing Day flood inundated riverside and Kirkstall Road areas; the Leeds Flood Alleviation Scheme has since raised defences in phases. Check the Environment Agency flood zone and the building’s own history — insurers do.',
        'Professional-services employment supports city-centre one- and two-bed demand; Headingley and Hyde Park carry the student market under a long-standing Article 4 direction that restricts new HMO conversions.',
        'Yields read better than the south until service charge, void and the licensing regime are priced honestly.',
      ],
      [
        { q: 'Can I convert a house to an HMO?', a: 'In the student belts, generally not without planning — Article 4 removed permitted development rights for that change of use. Verify the ward before you buy on that plan.' },
        { q: 'How real is the flood risk?', a: 'Real enough that it drives insurance pricing along the Aire corridor. The defences are better than in 2015; the flood zone map is still the document that matters.' },
      ],
    ),
  },
  us: {
    'new-york': city(
      'New York',
      'New York City splits condo from co-op, and the difference decides whether a foreign buyer closes at all. Buyer-side mansion tax starts at $1m; Florida closing customs are irrelevant here.',
      [
        'A co-op board can reject an application without giving a reason, and most impose financing caps, liquidity requirements and sublet restrictions. Condos are the predictable foreign-buyer product and they price accordingly.',
        'Manhattan, a Brooklyn brownstone and a Queens condo do not share a cap rate. Sponsor units carry different disclosure and different closing costs — the buyer often absorbs the transfer tax on a sponsor sale.',
        'The mansion tax is a buyer obligation that steps up from 1% at $1m, and mortgage recording tax adds roughly another two points if you finance. Budget attorney, title and taxes before you treat the ask as all-in.',
      ],
      [
        { q: 'Can foreigners buy a co-op?', a: 'Sometimes. The board decides and need not explain. Condos are the more reliable route for a non-resident buyer.' },
        { q: 'FIRPTA?', a: 'Withholding on foreign sellers, not buyers. As a buyer you still need a clean title policy and a real attorney.' },
      ],
      { buy: NEW_YORK_BUY, rent: NEW_YORK_RENT },
    ),
    miami: city(
      'Miami',
      'Miami is a condo-insurance and HOA market with a large cash and foreign-buyer share — and since Surfside, a statutory structural-reserve regime that has repriced older buildings.',
      [
        'Florida now requires milestone structural inspections and funded reserves on condominium buildings three storeys and up. The result has been large special assessments on aging stock. The reserve study and the assessment history are the deal.',
        'Wind and flood insurance can move faster than the asking price, and the state insurance market has been volatile for years. Get a quote before the inspection period ends, not after.',
        'Brickell, the beach and suburban Miami-Dade are not one yield. Florida closings run through title companies, not a New York-style attorney table.',
      ],
      [
        { q: 'Cash only?', a: 'Cash is common, not mandatory. Lenders re-underwrite insurance and HOA health, which is where financed deals fail here.' },
        { q: 'Foreign-buyer tax on the way in?', a: 'No FIRPTA on purchase. Budget documentary stamps, title and the HOA estoppel like a local.' },
      ],
    ),
    'los-angeles': city(
      'Los Angeles',
      'Los Angeles prices around three things a spreadsheet from elsewhere will miss: Proposition 13 reassessment on sale, the Measure ULA transfer tax on high-value sellers, and wildfire insurance.',
      [
        'Proposition 13 caps annual assessment growth but resets the base to market value when the property sells. The seller’s tax bill tells you nothing about yours — model the reassessed number.',
        'Measure ULA adds a multi-point transfer tax on sales above roughly $5m inside the City of Los Angeles, levied on the seller. It has visibly thinned high-end volume and it shapes how above-threshold deals are structured.',
        'Wildfire exposure has pushed carriers out of parts of the county and into the FAIR Plan. Older multifamily under the Rent Stabilization Ordinance — generally pre-October 1978 units — carries its own rent and eviction regime.',
      ],
      [
        { q: 'Who pays Measure ULA?', a: 'The seller, on qualifying sales inside the City of Los Angeles. It still affects you as a buyer through pricing and available inventory above the threshold.' },
        { q: 'What is the biggest underwriting mistake here?', a: 'Using the seller’s property-tax figure. Prop 13 reassesses on transfer and the jump can be substantial.' },
      ],
    ),
    chicago: city(
      'Chicago',
      'Chicago is one of the few large US cities where the buyer carries the bigger share of the transfer tax — 0.75% to the city — and where the county reassessment cycle is a real risk.',
      [
        'Cook County reassesses on a triennial cycle and appeals are a normal part of ownership. A recent reassessment can move a building’s tax line materially between listing and closing; read the assessment history, not just the current bill.',
        'Condominium assessments and deconversion politics matter in the older high-rise stock. Illinois preempts municipal rent control, so the letting model is unregulated in a way New York’s is not.',
        'The North Side lakefront, the West Loop and the South and West Sides are separate markets with separate liquidity. National price averages describe none of them.',
      ],
      [
        { q: 'How much transfer tax does the buyer pay?', a: 'The City of Chicago charges the buyer $3.75 per $500 — 0.75% of the price — with a further county and state portion customarily on the seller.' },
        { q: 'Is there rent control?', a: 'No. Illinois state law preempts local rent control, so the rent is a market number, not a regulated one.' },
      ],
    ),
    austin: city(
      'Austin',
      'Austin has no transfer tax and no state income tax, and takes it back through one of the highest effective property-tax rates in the country. The 2021 boom and the supply-driven correction after it both happened here.',
      [
        'Effective property tax typically lands around two percent of assessed value per year. On a $750,000 house that is a five-figure recurring cost that a buyer from a low-property-tax country will systematically underestimate.',
        'A large multifamily delivery wave after 2022 pushed rents down from the peak — the rare recent US metro where asking rents fell. Underwrite current achieved rent, not a 2021 comparable.',
        'Texas preempts municipal rent control and offers a homestead exemption plus an assessment cap to owner-occupiers that investors do not get. Central Austin, the eastern crescent and the suburban corridors behave very differently.',
      ],
      [
        { q: 'Is no transfer tax a real saving?', a: 'At closing, yes. Over a hold period the property-tax rate usually outweighs it. Compare total cost of ownership, not closing costs.' },
        { q: 'Did the market actually fall?', a: 'Asking rents and prices came off the 2022 peak as supply landed. That is a genuine correction, not a talking point — check current comparables.' },
      ],
    ),
    seattle: city(
      'Seattle',
      'Seattle puts the real-estate excise tax on the seller, has no state income tax, and gives tenants some of the strongest protections in the United States.',
      [
        'Washington’s REET is graduated and customarily the seller’s cost, which makes buyer closing costs here lighter than in New York or Chicago. The offset is a state condominium liability regime that historically suppressed new condo construction and left an older, litigation-shaped stock.',
        'Seattle tenant law includes winter and school-year eviction restrictions, relocation assistance on economic displacement, and just-cause requirements. Model that before you model a repositioning.',
        'Employment concentration in a handful of large technology employers is both the demand engine and the concentration risk. Ballard, Capitol Hill and the Eastside across the lake are separate markets.',
      ],
      [
        { q: 'Who pays the excise tax?', a: 'Customarily the seller. Budget title, escrow and lender costs on the buyer side instead.' },
        { q: 'Why are there so few new condos?', a: 'Washington’s construction-defect liability regime pushed developers toward apartments for years. It shapes the age and quality mix of what you can actually buy.' },
      ],
    ),
  },
  ca: {
    toronto: city(
      'Toronto',
      'Toronto is the only Canadian city that charges land transfer tax twice — Ontario’s levy plus the municipal one — which lands near 4% at the million-dollar mark.',
      [
        'Both taxes are banded and both are due at closing in cash. First-time buyer rebates exist at each level; an investor gets neither. Ontario also applies a non-resident speculation tax province-wide.',
        'Reserve-fund studies and special assessments are the yield in the condo stock, and pre-construction assignments carry their own contract risk — occupancy fees, interim closing, and a builder’s right to amend.',
        'The 416 and the 905 are different tax jurisdictions as well as different markets. The municipal levy stops at the city boundary.',
      ],
      [
        { q: 'Two land-transfer taxes?', a: 'Yes — provincial plus the City of Toronto’s own, for property inside the city. Budget both; together they are the largest single closing line.' },
        { q: 'Non-resident allowed?', a: 'Check the federal prohibition in force and Ontario’s speculation tax before you book a viewing trip.' },
      ],
      { buy: TORONTO_BUY, rent: TORONTO_RENT },
    ),
    vancouver: city(
      'Vancouver',
      'Vancouver is a British Columbia tax-and-constraint market: property transfer tax, a foreign-buyer levy, a provincial speculation tax and a municipal empty-homes tax — all at once.',
      [
        'BC’s property transfer tax is banded with an additional charge on high-value residential, and non-residents face a further foreign-buyer tax in the taxable regions. The speculation and vacancy tax plus Vancouver’s own empty-homes tax mean an overseas lock-up is not a free hold.',
        'Strata minutes and the depreciation report matter as much as the view. A leaky-condo legacy building and a 2020 tower are different assets with the same postcode.',
        'Geography is the supply constraint: mountains, ocean and the agricultural land reserve. The west side and a Surrey condo are not one market.',
      ],
      [
        { q: 'Vacancy tax?', a: 'Two of them — the provincial speculation and vacancy tax and the City of Vancouver empty-homes tax. They stack for an unoccupied city property.' },
        { q: 'Same foreign-buyer rules as Ontario?', a: 'No. BC uses its own additional property transfer tax and its own speculation tax. Read both the BC and federal rules; they are not one switch.' },
      ],
    ),
    montreal: city(
      'Montréal',
      'Montréal runs on Québec civil law: a notaire closes the sale, the droit de mutation is the “welcome tax”, and the plex — duplex, triplex, sixplex — is the signature asset.',
      [
        'Québec is the province where a notaire, not a solicitor, executes the deed. The droit de mutation is banded and municipal, with Montréal adding upper brackets above the provincial scale.',
        'The plex stock is the reason yields here read differently from Toronto: owner-occupied ground floor, rented upper units, and a rent-fixing regime at the Tribunal administratif du logement that constrains increases and makes vacancy assumptions hard to justify.',
        'A tenant in Québec has strong security of tenure. Repossessing a unit for personal use is a legal process with notice periods and compensation, not a notice on the door.',
      ],
      [
        { q: 'Why is Montréal cheaper than Toronto?', a: 'A larger rental share, tighter rent regulation, slower price growth and a smaller foreign-buyer flow. Different market, not a discount on the same one.' },
        { q: 'Can I raise the rent after buying?', a: 'Only within what the Tribunal will support. Buying with a plan to reset rents to market is the most common and most expensive mistake here.' },
      ],
    ),
    calgary: city(
      'Calgary',
      'Calgary charges no land transfer tax at all — Alberta collects registration fees instead — and has no provincial sales tax and no rent control.',
      [
        'That makes closing here dramatically cheaper than Toronto or Vancouver: land titles registration fees are measured in hundreds of dollars, not tens of thousands. It also means a shorter hold can pencil where it would not in Ontario.',
        'The offset is cyclicality. This is still an energy-linked economy, and the 2015–2020 downturn was severe. The interprovincial migration wave after 2022 was the strongest in the country and it moved rents fast in both directions.',
        'No rent control means the letting model is unregulated — which cuts both ways when the cycle turns.',
      ],
      [
        { q: 'Really no land transfer tax?', a: 'Correct. Alberta charges a land titles registration fee based on value and mortgage amount. On a $900,000 purchase it is a rounding error against Toronto’s bill.' },
        { q: 'How cyclical is it?', a: 'Genuinely. Energy prices, head-office decisions and migration flows drive this market. Underwrite a downturn, not just the last two good years.' },
      ],
    ),
    ottawa: city(
      'Ottawa',
      'Ottawa is a federal-government employment market with Ontario land transfer tax only — no municipal levy — and a provincial border running through its commuter shed.',
      [
        'Public-sector employment makes this the steadiest large market in Canada: shallower booms, shallower busts, and a tenant base with predictable income. Return-to-office policy is a genuine demand variable here in a way it is not elsewhere.',
        'Because there is no municipal land transfer tax, closing costs are roughly half of Toronto’s on the same price. The Glebe, Westboro and the Golden Triangle carry the premium; Orléans and Kanata are the family belts.',
        'Gatineau sits across the river in Québec with different tax, different civil law and a different rent regime. A commuter decision here is also a jurisdiction decision.',
      ],
      [
        { q: 'Is it cheaper to close than Toronto?', a: 'Yes — Ontario LTT applies but the City of Toronto municipal levy does not, which roughly halves the largest closing line.' },
        { q: 'What is the main risk?', a: 'Concentration in one employer. Federal headcount and office policy move this market more than interest rates do.' },
      ],
    ),
    edmonton: city(
      'Edmonton',
      'Edmonton is the most affordable major Canadian metro, with no land transfer tax, the highest big-city rental yields in the country, and a winter that is a maintenance line item.',
      [
        'Alberta’s absence of a transfer tax plus the lowest entry prices of any big Canadian city is why the gross yields here lead the national table. The discount reflects slower price appreciation, not a hidden bargain.',
        'Freeze-thaw cycles, foundation movement on clay soils and roof loading are ordinary inspection items. A cheap house with a bad foundation is not cheap.',
        'Provincial government, healthcare, the university and energy services anchor the employment base. No rent control applies, and the river valley is the structural amenity that will not change.',
      ],
      [
        { q: 'Why are yields higher here?', a: 'Low purchase prices against workable rents, with no transfer tax on the way in. The trade is weaker capital growth.' },
        { q: 'Toronto or Edmonton for an investor?', a: 'Different trades. Toronto is a capital-growth and high-friction market; Edmonton is a cash-flow and low-friction one. Pick the one your model actually needs.' },
      ],
    ),
  },
  tr: {
    istanbul: city(
      'Istanbul',
      'Istanbul is many cities on one tapu system: European-side apartments, Asian-side family stock and Bosphorus trophies do not share a lira yield — and all of them sit near the North Anatolian fault.',
      [
        'Building code year is the first question, not the last. The 1999, 2007 and 2018 revisions each raised seismic standards, and the kentsel dönüşüm urban-transformation programme is actively replacing pre-2000 stock. DASK is compulsory; it is also a minimum, not full cover.',
        'Title duty, a sworn translator at the tapu office, and a military-zone check where applicable sit between reservation and keys. Foreign-ownership quotas apply per district and can block a transfer outright.',
        'Rents are reset annually against the twelve-month CPI average, which makes a lira yield a moving target. This is not an Antalya holiday-home page.',
      ],
      [
        { q: 'USD or TRY?', a: 'Asks wander between both. The tapu and the taxes are Turkish. Underwrite the currency you will actually settle and receive rent in.' },
        { q: 'Citizenship via this flat?', a: 'Thresholds move by circular. Treat a developer’s “passport included” slide as marketing until the official gazette agrees.' },
      ],
      { buy: ISTANBUL_BUY, rent: ISTANBUL_RENT },
    ),
    antalya: city(
      'Antalya',
      'Antalya is a second-home and residence-permit coast. Lara, Konyaaltı and Kaleiçi are different products from Istanbul employment stock, and the site fee is the hidden mortgage.',
      [
        'Seasonal rent and property-management quality decide whether an eight-percent-net brochure survives winter. Site (HOA) fees on new compounds — pools, security, landscaping, lifts — compound annually with inflation and are quoted in lira.',
        'Residence-permit demand has been a real driver, and the districts closed to new foreign residence registrations have shifted more than once. Check the current district status before you buy on that basis.',
        'Tapu is still tapu. Off-plan should be a notarised contract with a permit trail, not a Telegram invoice. sivrce will not invent inventory to fill the beach photos.',
      ],
      [
        { q: 'Residence permit with a house?', a: 'Possible under current immigration rules and subject to valuation thresholds and district closures. It is not automatic with every tapu.' },
        { q: 'Safer than Istanbul seismically?', a: 'A different fault map, not zero risk. Ask for the building’s code year and the DASK policy either way.' },
      ],
    ),
    ankara: city(
      'Ankara',
      'Ankara is the capital and the most domestic large Turkish market — civil-service and university demand, lira long-lets, and almost none of the foreign speculation that shapes the coast.',
      [
        'Çankaya and the southern corridor carry the professional and diplomatic book; Keçiören and the northern districts are volume stock. Ministries, embassies and universities give this city a tenant base that does not follow the tourist calendar.',
        'Seismic exposure is lower than along the North Anatolian fault, which is one of the few genuine structural advantages Ankara has over Istanbul and İzmir. It is not zero, and the code-year question still applies.',
        'Because foreign demand is thin, resale liquidity for an overseas owner is thinner than in Antalya or Istanbul. Price that in.',
      ],
      [
        { q: 'Why is Ankara cheaper than Istanbul?', a: 'A smaller and less internationalised demand base, more buildable land, and no Bosphorus scarcity premium. The discount is structural.' },
        { q: 'Good for a foreign buyer?', a: 'Good for a yield-focused lira investor with local management. Weak for anyone who needs a quick foreign-currency exit.' },
      ],
    ),
    izmir: city(
      'İzmir',
      'İzmir is the Aegean’s commercial capital — Alsancak and Karşıyaka for urban living, Çeşme and Urla for the coast — and the 2020 earthquake made building age the first conversation.',
      [
        'The October 2020 Aegean earthquake collapsed buildings in Bayraklı and exposed how much of the pre-2000 stock was non-compliant. Urban transformation has been running hard since; a building’s code year and any kentsel dönüşüm status are the core diligence here.',
        'The city is more domestic and less speculative than Antalya, with a genuine year-round professional and student base. The Çeşme peninsula behaves as a separate seasonal second-home market with its own pricing.',
        'Coastal position and sea view carry a durable premium along the Kordon and in Karşıyaka, with the maintenance and insurance profile that implies.',
      ],
      [
        { q: 'How much does building age matter?', a: 'More than anywhere else on this list except Istanbul. Post-2018 construction, or a completed transformation project, is a materially different risk from a 1995 block.' },
        { q: 'Is Çeşme the same market?', a: 'No. Çeşme and Urla are seasonal second-home markets with different buyers, different yields and different winter occupancy. Do not blend them into an İzmir average.' },
      ],
    ),
    bodrum: city(
      'Bodrum',
      'Bodrum is a peninsula of villages, not a city — Yalıkavak, Türkbükü, Gümüşlük and Bodrum town each price differently, and almost none of it has a year-round rental book.',
      [
        'This is a villa and second-home market with a short, intense season. A twelve-month yield does not exist for most of the stock; the honest model is owner use plus a managed summer let, with management fees and wear priced in.',
        'Zoning and construction permissions on the peninsula are tightly and inconsistently enforced, with genuine history of unpermitted building. Demand the iskan — the occupancy permit — and the permit chain, not just the tapu.',
        'Site fees on gated compounds — pool, security, landscaping, private jetty — are the recurring cost that decides whether an off-season holding makes sense.',
      ],
      [
        { q: 'Can I rent it out all year?', a: 'Realistically, no. The peninsula largely empties between October and April. Model owner use plus a managed season, not a twelve-month tenancy.' },
        { q: 'What is the iskan and why does it matter?', a: 'The occupancy permit certifying the building was completed to its licence. Without it, utilities, resale and finance all become problems.' },
      ],
    ),
    bursa: city(
      'Bursa',
      'Bursa is Turkey’s automotive and textile industrial centre with a ferry link to Istanbul, an Ottoman-heritage core and a ski mountain on top of it — cheaper than Istanbul, and for structural reasons.',
      [
        'Nilüfer is the modern residential district and the one most new-build sells into; the historic core around the Grand Mosque and Cumalıkızık is heritage-constrained. Industrial employment, not tourism, is the demand engine.',
        'The high-speed ferry across the Marmara puts Istanbul within reach for some workers, which supports a real spillover demand — and exposes Bursa to Istanbul’s cycle.',
        'The city sits in an active seismic zone. Code year, soil conditions on the alluvial plain and any transformation status are the same first questions as in İzmir.',
      ],
      [
        { q: 'Is it an Istanbul commuter market?', a: 'Partially, via the ferry. Treat it as a spillover, not a substitute — the local industrial employment base is what actually sets the rent.' },
        { q: 'Does Uludağ affect the market?', a: 'It creates a small seasonal ski-let niche on the mountain that has little to do with the city’s residential stock. Keep the two models separate.' },
      ],
    ),
  },
  gr: {
    athens: city(
      'Athens',
      'Athens is a capital, a port economy and a tourism machine on one cadastre — Kolonaki, Koukaki and Glyfada are three different assets, and the Golden Visa repriced each of them in 2024.',
      [
        'The centre trades on scarcity and footfall: Plaka and Koukaki live off the Acropolis overflow, Exarchia and Kypseli off students and professionals. The southern suburbs — Glyfada, Voula, Ellinikon — are the coast market, repriced by the Ellinikon regeneration and the €800,000 Golden Visa tier that now covers much of Attica.',
        'Earthquake code is a real diligence line in Attica, and post-1985 construction with an electronic building identity is a different file from an older flat without one. Short-let is restricted in central municipal districts — the AMA registry, not the listing photos, decides the model.',
      ],
      [
        { q: 'Golden Visa in Athens?', a: 'Most of the Athens basin now sits in the €800,000 tier since September 2024 — the €250,000 entry survives only in designated areas. Check the municipality, not the marketing.' },
        { q: 'New or old stock?', a: 'New-build may carry VAT instead of transfer tax; older stock pays 3.09% on assessed value but needs the seismic and legality file checked. They are different trades.' },
      ],
      { buy: ATHENS_BUY, rent: ATHENS_RENT },
    ),
    thessaloniki: city(
      'Thessaloniki',
      'Thessaloniki is Greece’s second city and northern capital — Ladadika, Kalamaria and the waterfront are a different market from Athens at roughly half the ticket, driven by students, the port and Balkan weekend demand.',
      [
        'Aristotle University puts tens of thousands of students into the rental book, which makes small central units the most liquid asset in the city. Kalamaria and the eastern districts carry the family premium; the western districts are volume stock at the city’s lowest per-square-metre.',
        'The metro — opened at the end of 2024 after decades of delay — repriced stations along its single line, with extensions still moving. The same 3.09% transfer tax and the same notarial machine as Athens apply; the market around them does not.',
      ],
      [
        { q: 'Cheaper than Athens?', a: 'Substantially per square metre, with thinner foreign-buyer liquidity on exit.' },
        { q: 'Does the metro change the model?', a: 'Really along the opened line, speculatively on the extensions. Buy the station that exists.' },
      ],
    ),
  },
  cy: {
    nicosia: city(
      'Nicosia',
      'Nicosia is Europe’s last divided capital and Cyprus’s year-round market — Strovolos, Engomi and the old town inside the walls are three books, none of them seasonal.',
      [
        'Demand is domestic and institutional: government, university and professional tenants who rent twelve months a year. That makes Nicosia the island’s most boring market in the best sense — no season, no site-fee compounds, no holiday-let arithmetic.',
        'The buffer zone is geography, not a price input, for most transactions — but check the title’s history near it the way you would check any boundary. New-build inside the municipality sells with VAT and zero transfer fees; resale pays the halved scale.',
      ],
      [
        { q: 'Better yield than Limassol?', a: 'Often on paper, because entry is lower and occupancy is annual. Compare net of the management the coast requires.' },
        { q: 'Title risk?', a: 'Lower than on rushed coastal schemes, but the rule is the same: a separate title, or a contract deposited at the Lands Office within six months.' },
      ],
      { buy: NICOSIA_BUY, rent: NICOSIA_RENT },
    ),
    limassol: city(
      'Limassol',
      'Limassol is the island’s coastal money — the marina, the seafront tower cluster and the eastern tourist strip are a second-home market that happens to have a business district attached.',
      [
        'High-rise seafront stock trades on views and new-build premiums with VAT and zero transfer fees; the old town and the inland suburbs trade on Cypriot family demand with the halved resale scale. They share a coastline and little else about yield.',
        'Site and management fees on tower stock are the carry that decides whether a sea view pays. The marina berth is a separate asset with a separate queue — do not let it hide inside the flat’s price.',
      ],
      [
        { q: 'Is the tower stock overbuilt?', a: 'It is the most supply-sensitive segment on the island. Resale competes with the developer’s next phase, which sets the ceiling more firmly than any index.' },
        { q: 'Year-round rent?', a: 'In the business districts, yes. On the tourist strip, model owner use plus a managed season, not a twelve-month tenancy.' },
      ],
    ),
  },
  nl: {
    amsterdam: city(
      'Amsterdam',
      'Amsterdam is a canal belt, a ring of post-war stock and an IJ waterfront that became a district — priced like a capital, regulated like a social project, and short of land in every direction.',
      [
        'Grachtengordel and Jordaan are monument-constrained trophies where the VvE minutes matter more than the listing text; Noord, Nieuw-West and Zuidoost are the volume book where erfpacht ground-lease terms move the price as much as the bricks.',
        'Erfpacht is the Amsterdam-specific diligence: prepaid decades versus indexed canon changes the bid by real money. Conversion and buy-out schemes have shifted more than once; read the current canon, not an old explainer.',
      ],
      [
        { q: 'Erfpacht or eigen grond?', a: 'Owned land trades at a premium for a reason. Erfpacht with long prepaid terms is fine; an indexed canon with a reset coming is a repricing event.' },
        { q: 'New-build premium?', a: 'Large, and concentrated in Noord and the IJ banks. It rents well and resells into a thinner buyer pool.' },
      ],
      { buy: AMSTERDAM_BUY, rent: AMSTERDAM_RENT },
    ),
    rotterdam: city(
      'Rotterdam',
      'Rotterdam is Europe’s largest port wearing a housing market — Kop van Zuid, Katendrecht and the pre-war north price off jobs and the Erasmus student base, at a persistent discount to Amsterdam.',
      [
        'The post-war reconstruction city is an architectural experiment that keeps paying off: the Markthal and the Kop van Zuid waterfront turned former docklands into the city’s premium. The north — Hillegersberg, Kralingen — is the established family book.',
        'The same 2%/10.4% transfer tax and the same notaris-to-Kadaster machine as Amsterdam apply, with shorter bidding wars and fewer waived clauses. Sellers here still expect a financing condition; keep it.',
      ],
      [
        { q: 'Commutable to Amsterdam?', a: 'Forty minutes by intercity, and priced like it. Buy Rotterdam for the port economy first; the train is a bonus, not a thesis.' },
        { q: 'Erfpacht here too?', a: 'Far less than Amsterdam. One less file to read, not zero files.' },
      ],
    ),
  },
  pt: {
    lisbon: city(
      'Lisbon',
      'Lisbon is seven hills of tiled facades, miradouros and a riverfront that repriced twice — Alfama, Príncipe Real and Parque das Nações are three assets under one IMT code.',
      [
        'The historic centre trades scarcity: pombaline cages and tiled facades with renovation constraints and small footprints. Avenidas Novas and Alvalade are the professional long-let book; the Expo east is the new-build book with condomínio fees to match.',
        'Short-let containment zones froze new Alojamento Local licences across the historic city — any yield model needs the registration in hand. The 1755 pombaline cage is genuine seismic engineering; the pre-1755 and cheap 1960s–80s stock is a different file.',
      ],
      [
        { q: 'Still a Golden Visa city?', a: 'Not via residential purchase — that route closed in 2023. The flat must stand on its own yield.' },
        { q: 'Alfama premium?', a: 'Durable for views and scarcity, illiquid for exit. A trophy with a tourist queue, not a rental machine.' },
      ],
      { buy: LISBON_BUY, rent: LISBON_RENT },
    ),
    porto: city(
      'Porto',
      'Porto is granite, port lodges and a river gorge — Ribeira, Foz and Boavista are a different market from Lisbon at lower tickets, with the university and the Gaia cellars as demand anchors.',
      [
        'The UNESCO riverside trades views and scarcity in small, steep, often renovation-heavy stock; Foz is the seaside family premium; Boavista and the university belt are the year-round rental book. Gaia across the river is administratively separate and priced like it.',
        'Porto froze new AL licences in its own containment zones — later and narrower than Lisbon, but the same diligence applies. The same national IMT slices and stamp duty as the capital; lower prices, lower absolute closing costs.',
      ],
      [
        { q: 'Cheaper than Lisbon?', a: 'Meaningfully per square metre, with a smaller foreign-buyer exit pool.' },
        { q: 'Same short-let freeze?', a: 'Same mechanism, different map. Read Porto’s current containment zones, not Lisbon’s.' },
      ],
    ),
  },
  ch: {
    zurich: city(
      'Zurich',
      'Zurich is a banking capital that prices housing like a vault — Seefeld, Enge and Wiedikon are three books, and the cheapest part of closing is the transfer tax, because there is none.',
      [
        'Owner-occupier stock is scarce by policy and culture: most of Zurich rents, and large apartments convert slowly. Seefeld and the lake shore are the trophy book; Wiedikon, Aussersihl and Oerlikon are the professional book where bidding decides the price.',
        'Stockwerkeigentum dominates new supply, with renewal-fund health as the core diligence — the Swiss cousin of the service-charge file. Minergie certification moves both price and rentability.',
      ],
      [
        { q: 'Foreign buyer with a B permit?', a: 'An EU/EFTA resident buying a main home is largely outside Lex Koller. A holiday flat or a purchase without residence is inside it — permit first.' },
        { q: 'Why no transfer tax?', a: 'The canton abolished it; only notary and Grundbuch fees apply. Cantonal policy, not a national rule.' },
      ],
      { buy: ZURICH_BUY, rent: ZURICH_RENT },
    ),
    geneva: city(
      'Geneva',
      'Geneva is a diplomatic capital on a lake with a French border for a suburb — Champel, Eaux-Vives and Les Pâquis are three books, and half the workforce crosses that border daily.',
      [
        'International organizations and private banking create a tenant base that pays on time and leaves on rotation — premium furnished stock near the lake turns over with the diplomatic calendar. Around 3% droits de mutation make Geneva the dearest Swiss canton to close in.',
        'The official form for the initial rent is mandatory in Geneva: every lease states the previous rent, and an excessive increase is challengeable. LDTR rules restrict converting rental stock — check the building’s status before any pied-à-terre arithmetic.',
      ],
      [
        { q: 'Live in France instead?', a: 'Half of Geneva does, economically. Cross-border commuting is a tax and currency model of its own — price the franc salary against euro costs, not just the rent gap.' },
        { q: 'Same Lex Koller?', a: 'Federal law, cantonal practice. Geneva administers its own authorization queue with its own timelines.' },
      ],
    ),
  },
}
