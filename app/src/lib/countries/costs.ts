/**
 * Buyer-cost + rental-rule model for every launched market.
 *
 * One table, no per-country fan-out. Every number below is public statute or
 * a published fee schedule, not a market opinion — the page renders the line
 * items under their local legal names (DMTO, ITP, SDLT, tapu harcı, DLD) so a
 * French reader sees French law, not translated German copy.
 *
 * Germany is NOT re-declared here: it derives from `lib/countries/de.ts`, which
 * already carries the audited Grunderwerbsteuer table.
 *
 * Stand (as-of) 2026 — rates are stable for years but not forever. Re-check
 * yearly; per-line `note` flags anything actively moving.
 * ponytail: data + two pure functions. No calculator UI, no FX, no API.
 */

import {
  DE_CITIES,
  DE_MAKLER_BUYER_PCT,
  DE_NOTARY_PCT,
  DE_REGISTER_PCT,
} from '@/lib/countries/de'
import { MARKETS, type PathCountryId } from '@/lib/markets'

export const COSTS_AS_OF = '2026'

/** Progressive slice band. `upTo: null` = top slice. */
export interface Band {
  upTo: number | null
  pct: number
}

export interface CityFact {
  /** Short chip on the cities grid — '6.0%', 'SDLT', 'No LTT'. */
  chip: string
  /** `title` on the chip: what that number actually is. */
  chipTitle: string
  /** Sub-national authority that sets it (shown muted under the city name). */
  region: string
  /** Headline buyer-side local tax, % of price. null when banded. */
  pct: number | null
  /** Progressive table when the local tax is banded (UK). */
  bands?: Band[]
  /** Extra flat % that rides on the banded tax for cross-border buyers. */
  surchargePct?: number
  surchargeLabel?: string
}

export interface CountryCosts {
  /** Worked-example price in market currency. null = render percentages only. */
  sample: number | null
  /** Who closes the sale in this system. */
  closer: string
  /** Local legal name of the headline buyer tax. */
  taxLabel: string
  /** Buyer-side lines that do not vary by city, % of price. */
  extras: { label: string; pct: number }[]
  /** Agent commission the BUYER pays, % incl. local VAT. 0 = seller pays. */
  buyerAgentPct: number
  buyerAgentLabel?: string
  /** One honest sentence under the table. */
  note: string
  /** Rental-side card. */
  rentTitle: string
  rentRules: [string, string, string]
  rentNote: string
  /** Four facts for the band under the hero. */
  facts: { n: string; label: string }[]
  /** Hero trust row. */
  trust: [string, string, string]
  /** Cities band copy. */
  citiesTitle: string
  citiesSub: string
  defaultCity: CityFact
  cities: Record<string, CityFact>
}

const fr: CountryCosts = {
  sample: 400_000,
  closer: 'Notaire',
  taxLabel: 'Droits de mutation (DMTO)',
  extras: [
    { label: 'Émoluments du notaire (≈0.8%)', pct: 0.8 },
    { label: 'Formalités & débours (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'Roughly +7% on an existing home — that is the famous frais de notaire, most of which is departmental tax rather than the notaire’s fee. A new-build runs nearer 2–3% because VAT is already inside the price. Several départements, Paris included, applied the 2025 uplift toward ~6.3% DMTO — confirm the rate on your acte, not on a blog post.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposit caps at one month’s rent unfurnished and two months furnished (loi du 6 juillet 1989).',
    'Encadrement des loyers fixes a reference rent per m² in Paris, Lyon, Lille, Bordeaux, Montpellier and Marseille — a lease above it is challengeable.',
    'A DPE rating of G has been barred from new lettings since 2025 and F follows in 2028 — the energy label is a rentability test, not a sticker.',
  ],
  rentNote:
    'Qualitative anchors only. Live reference rents come from the préfecture’s published grid, never a hardcoded table.',
  facts: [
    { n: '≈7%', label: 'acquisition costs on an existing home' },
    { n: '2', label: 'contracts: compromis, then acte authentique' },
    { n: '10 days', label: 'statutory buyer cooling-off (loi SRU)' },
    { n: 'DPE A–G', label: 'energy label required in every file' },
  ],
  trust: ['Notaire-verified path', 'DPE & diagnostics', '3D map'],
  citiesTitle: 'Six metros, one notarial machine',
  citiesSub:
    'The deed is national; the money is not. DMTO is voted département by département, and rent control only bites in the designated zones tendues. Each city guide carries its own number.',
  defaultCity: { chip: '5.8%', chipTitle: 'Droits de mutation (DMTO)', region: 'France', pct: 5.8 },
  cities: {
    paris: { chip: '5.8%', chipTitle: 'Droits de mutation — Paris (75)', region: 'Paris (75)', pct: 5.8 },
    lyon: { chip: '5.8%', chipTitle: 'Droits de mutation — Rhône (69)', region: 'Rhône (69)', pct: 5.8 },
    marseille: { chip: '5.8%', chipTitle: 'Droits de mutation — Bouches-du-Rhône (13)', region: 'Bouches-du-Rhône (13)', pct: 5.8 },
    bordeaux: { chip: '5.8%', chipTitle: 'Droits de mutation — Gironde (33)', region: 'Gironde (33)', pct: 5.8 },
    nice: { chip: '5.8%', chipTitle: 'Droits de mutation — Alpes-Maritimes (06)', region: 'Alpes-Maritimes (06)', pct: 5.8 },
    toulouse: { chip: '5.8%', chipTitle: 'Droits de mutation — Haute-Garonne (31)', region: 'Haute-Garonne (31)', pct: 5.8 },
  },
}

const es: CountryCosts = {
  sample: 300_000,
  closer: 'Notario',
  taxLabel: 'ITP — resale transfer tax',
  extras: [
    { label: 'Notario (≈0.5%)', pct: 0.5 },
    { label: 'Registro de la Propiedad (≈0.3%)', pct: 0.3 },
    { label: 'Gestoría & legal (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'ITP is the resale rate and it is regional — the same flat costs four points more in Barcelona than in Madrid. A new-build from a developer pays IVA (10% residential) plus AJD instead, never ITP. Get the nota simple before the deposit: charges and embargoes travel with the property, not the seller.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposit is one month (fianza) plus a limited additional guarantee, and the fianza is lodged with the regional housing body.',
    'Long leases run five years, or seven if the landlord is a company, with statutory tenant renewal — not a one-year rollover.',
    'Zonas tensionadas under the 2023 housing law cap increases in designated municipalities; Catalonia applies them, most of Andalucía does not.',
  ],
  rentNote:
    'Tourist letting is a municipal licence question, never a portal assumption. Buy the asset, not an occupancy slide.',
  facts: [
    { n: '6–10%', label: 'ITP on resale, set by the región' },
    { n: '10% + AJD', label: 'IVA path on a new-build instead' },
    { n: 'NIE', label: 'foreign tax number required before the deed' },
    { n: 'Nota simple', label: 'the first document, not the brochure' },
  ],
  trust: ['Nota simple first', 'Regional ITP mapped', '3D map'],
  citiesTitle: 'Six metros, six tax regimes',
  citiesSub:
    'Spain devolves transfer tax to the comunidades autónomas. Madrid at 6% and Catalonia at 10% are the same purchase with a €12,000 difference on a €300,000 flat. Each city guide carries its own rate.',
  defaultCity: { chip: '8%', chipTitle: 'ITP — regional average', region: 'España', pct: 8 },
  cities: {
    madrid: { chip: '6%', chipTitle: 'ITP — Comunidad de Madrid', region: 'Comunidad de Madrid', pct: 6 },
    barcelona: { chip: '10%', chipTitle: 'ITP — Catalunya (tiered above €600k)', region: 'Catalunya', pct: 10 },
    valencia: { chip: '10%', chipTitle: 'ITP — Comunitat Valenciana', region: 'Comunitat Valenciana', pct: 10 },
    alicante: { chip: '10%', chipTitle: 'ITP — Comunitat Valenciana', region: 'Comunitat Valenciana', pct: 10 },
    malaga: { chip: '7%', chipTitle: 'ITP — Andalucía', region: 'Andalucía', pct: 7 },
    seville: { chip: '7%', chipTitle: 'ITP — Andalucía', region: 'Andalucía', pct: 7 },
  },
}

const it: CountryCosts = {
  sample: 300_000,
  closer: 'Notaio',
  taxLabel: 'Imposta di registro (second home)',
  extras: [
    { label: 'Notaio (≈1.5%)', pct: 1.5 },
    { label: 'Imposte ipotecaria & catastale', pct: 0.2 },
  ],
  buyerAgentPct: 3.66,
  buyerAgentLabel: 'Agency, buyer side (3% + 22% IVA)',
  note:
    'Registration tax is 9% for a second home and 2% under prima casa relief — and on a resale between private parties it is charged on the cadastral value (prezzo-valore), which is usually well below the price you pay. Prima casa is for people who move their residenza within eighteen months, not for holiday buyers.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'The 4+4 contract is the default: four years, renewed four more unless the landlord has a statutory reason.',
    'Cedolare secca lets a landlord swap progressive IRPEF for a flat substitute tax, but freezes the ISTAT indexation.',
    'Every lease must be registered with the Agenzia delle Entrate — an unregistered contract is void against the tenant.',
  ],
  rentNote:
    'Eviction runs through the court calendar, not the contract. Underwrite the timeline, not the brochure yield.',
  facts: [
    { n: '9% / 2%', label: 'registro: second home vs prima casa' },
    { n: 'Rendita', label: 'cadastral value is the tax base on resale' },
    { n: 'Codice fiscale', label: 'required before the notaio will close' },
    { n: 'IMU', label: 'annual municipal tax on non-primary homes' },
  ],
  trust: ['Notaio-verified path', 'Cadastral rendita checked', '3D map'],
  citiesTitle: 'Six metros, one national deed',
  citiesSub:
    'Registration tax is national; the base, the IMU rate and the condominio are local. A Milan yield and a Naples yield do not survive the same spreadsheet.',
  defaultCity: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Italia', pct: 9 },
  cities: {
    rome: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Lazio', pct: 9 },
    milan: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Lombardia', pct: 9 },
    florence: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Toscana', pct: 9 },
    turin: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Piemonte', pct: 9 },
    naples: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Campania', pct: 9 },
    bologna: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Emilia-Romagna', pct: 9 },
  },
}

/** SDLT, England & Northern Ireland, standard residential rates from 1 April 2025. */
const SDLT_BANDS: Band[] = [
  { upTo: 125_000, pct: 0 },
  { upTo: 250_000, pct: 2 },
  { upTo: 925_000, pct: 5 },
  { upTo: 1_500_000, pct: 10 },
  { upTo: null, pct: 12 },
]

/** LBTT, Scotland, residential rates. No non-resident surcharge; ADS is 8%. */
const LBTT_BANDS: Band[] = [
  { upTo: 145_000, pct: 0 },
  { upTo: 250_000, pct: 2 },
  { upTo: 325_000, pct: 5 },
  { upTo: 750_000, pct: 10 },
  { upTo: null, pct: 12 },
]

const sdlt = (region: string): CityFact => ({
  chip: 'SDLT',
  chipTitle: 'Stamp Duty Land Tax — England & NI, slice bands',
  region,
  pct: null,
  bands: SDLT_BANDS,
  surchargePct: 2,
  surchargeLabel: 'Non-resident surcharge (+2%)',
})

const lbtt = (region: string): CityFact => ({
  chip: 'LBTT',
  chipTitle: 'Land & Buildings Transaction Tax — Scotland, slice bands',
  region,
  pct: null,
  bands: LBTT_BANDS,
})

const gb: CountryCosts = {
  sample: 500_000,
  closer: 'Solicitor / conveyancer',
  taxLabel: 'Stamp duty (slice bands)',
  extras: [
    { label: 'Legal, searches & Land Registry (≈0.4%)', pct: 0.4 },
    { label: 'Survey (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Scotland is a different tax and a different contract: LBTT with 8% ADS, and missives that bind earlier than an English exchange. In England and Wales an offer binds nobody until exchange — gazumping is legal, which is why the survey and the searches come before the celebration. A second or additional dwelling adds 5% SDLT on the whole price.',
  rentTitle: 'The let side, in three lines',
  rentRules: [
    'A tenant deposit must sit in a government-approved protection scheme within 30 days — unprotected deposits cost the landlord up to three times the sum.',
    'The Renters’ Rights Act ends assured shorthold fixed terms and section 21 no-fault eviction; possession now runs through stated statutory grounds.',
    'An EPC of E or better is required to let, and a leasehold flat carries ground rent, service charge and a term that shortens every year.',
  ],
  rentNote:
    'Yield on a leasehold flat is service charge minus optimism. Read the last three years of accounts and the cladding/EWS1 file.',
  facts: [
    { n: '+2%', label: 'non-resident SDLT surcharge in England' },
    { n: '+5%', label: 'additional-dwelling surcharge on the whole price' },
    { n: 'Exchange', label: 'the moment an offer becomes a contract' },
    { n: 'Leasehold', label: 'most flats — term, ground rent, service charge' },
  ],
  trust: ['Land Registry path', 'Leasehold term checked', '3D map'],
  citiesTitle: 'Six metros, two tax systems',
  citiesSub:
    'England and Northern Ireland pay SDLT; Scotland pays LBTT on its own bands and binds at missives, not exchange. Edinburgh and London are not the same transaction with different weather.',
  defaultCity: sdlt('England'),
  cities: {
    london: sdlt('Greater London'),
    manchester: sdlt('Greater Manchester'),
    birmingham: sdlt('West Midlands'),
    leeds: sdlt('West Yorkshire'),
    edinburgh: lbtt('Scotland'),
    glasgow: lbtt('Scotland'),
  },
}

const us: CountryCosts = {
  sample: 750_000,
  closer: 'Title company or closing attorney',
  taxLabel: 'Local transfer tax, buyer share',
  extras: [
    { label: "Owner's title insurance (≈0.5%)", pct: 0.5 },
    { label: 'Lender, escrow & appraisal (≈1%)', pct: 1.0 },
    { label: 'Attorney, recording & prepaids (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'There is no national property code. Transfer tax is a city and county question — New York adds a buyer mansion tax above $1m, Chicago charges the buyer 0.75%, Texas charges nothing and takes it back in annual property tax. Since the 2024 NAR settlement, buyer-agent compensation is negotiated in writing rather than assumed from the listing.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposit caps, notice periods and eviction timelines are state law — one to two months is common, but New York and Florida are not the same statute.',
    'Rent stabilization is local: New York City has it, Miami and Austin sit under state preemption against it.',
    'Insurance is the variable that reprices a building — Florida wind and flood can move faster than the asking price.',
  ],
  rentNote:
    'HOA and condo documents are the yield. Read the reserve study and the special-assessment history before the inspection.',
  facts: [
    { n: '50', label: 'state codes — there is no one US market' },
    { n: 'Title', label: 'insurance, not a notary, protects the buyer' },
    { n: 'FIRPTA', label: 'withholding hits foreign sellers, not buyers' },
    { n: 'No SSN', label: 'needed to take title as a foreign buyer' },
  ],
  trust: ['County records path', 'HOA & insurance checked', '3D map'],
  citiesTitle: 'Six metros, six closing customs',
  citiesSub:
    'The buyer-side transfer tax is the fastest way to see how local this market is: 1%+ in Manhattan, 0.75% in Chicago, zero in Austin and Seattle where the seller pays instead.',
  defaultCity: { chip: 'Local', chipTitle: 'Transfer tax is set city by city', region: 'United States', pct: 0 },
  cities: {
    'new-york': { chip: '1%+', chipTitle: 'NY mansion tax, buyer, on $1m and up', region: 'New York, NY', pct: 1 },
    miami: { chip: 'Seller pays', chipTitle: 'Florida documentary stamps are customarily the seller’s', region: 'Miami-Dade, FL', pct: 0 },
    'los-angeles': { chip: 'Seller pays', chipTitle: 'Measure ULA transfer tax falls on the seller', region: 'Los Angeles, CA', pct: 0 },
    chicago: { chip: '0.75%', chipTitle: 'Chicago transfer tax, buyer share', region: 'Chicago, IL', pct: 0.75 },
    austin: { chip: 'None', chipTitle: 'Texas levies no real-estate transfer tax', region: 'Austin, TX', pct: 0 },
    seattle: { chip: 'Seller pays', chipTitle: 'Washington REET is customarily the seller’s', region: 'Seattle, WA', pct: 0 },
  },
}

const ca: CountryCosts = {
  sample: 900_000,
  closer: 'Real estate lawyer, or notaire in Québec',
  taxLabel: 'Land transfer tax',
  extras: [
    { label: 'Lawyer, title insurance & disbursements (≈0.4%)', pct: 0.4 },
    { label: 'Inspection & appraisal (≈0.15%)', pct: 0.15 },
  ],
  buyerAgentPct: 0,
  note:
    'Land transfer tax is provincial and, in Toronto, charged twice — once by Ontario and once by the city. Alberta charges none at all and takes registration fees instead. The rates are banded, so the percentages here are effective rates at the sample price, not a flat levy. Foreign-buyer prohibitions and provincial surtaxes have changed more than once — read the statute in force on your closing date.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Rent increase guidelines are provincial and annual — Ontario publishes a percentage, British Columbia publishes its own, Alberta publishes none.',
    'Deposit rules differ sharply: Ontario allows last month’s rent, British Columbia allows a half-month security plus a half-month pet deposit.',
    'Empty-home and speculation taxes apply in Vancouver, Toronto and across Metro Vancouver — an overseas lock-up is not a free hold.',
  ],
  rentNote:
    'In a condo the reserve fund study is the yield. A special assessment outranks every projection in the brochure.',
  facts: [
    { n: '2×', label: 'land transfer tax inside the City of Toronto' },
    { n: '0%', label: 'land transfer tax in Alberta' },
    { n: 'FINTRAC', label: 'source-of-funds KYC on every closing' },
    { n: 'Strata', label: 'reserve fund and depreciation report decide the deal' },
  ],
  trust: ['Land titles path', 'Reserve fund checked', '3D map'],
  citiesTitle: 'Six metros, ten provincial rulebooks',
  citiesSub:
    'Canada devolves the transaction to the province. Toronto stacks a municipal tax on the Ontario one; Alberta charges neither. The same price closes very differently in Calgary and in the 416.',
  defaultCity: { chip: 'Provincial', chipTitle: 'Land transfer tax is set province by province', region: 'Canada', pct: 1.5 },
  cities: {
    toronto: { chip: '≈4%', chipTitle: 'Ontario LTT + City of Toronto MLTT, effective at $900k', region: 'Ontario + City of Toronto', pct: 4 },
    ottawa: { chip: '≈1.7%', chipTitle: 'Ontario land transfer tax, effective at $900k', region: 'Ontario', pct: 1.7 },
    vancouver: { chip: '≈2%', chipTitle: 'BC property transfer tax, effective at $900k', region: 'British Columbia', pct: 2 },
    montreal: { chip: '≈1.5%', chipTitle: 'Droit de mutation (“welcome tax”), effective at $900k', region: 'Québec', pct: 1.5 },
    calgary: { chip: 'None', chipTitle: 'Alberta charges registration fees, not a transfer tax', region: 'Alberta', pct: 0 },
    edmonton: { chip: 'None', chipTitle: 'Alberta charges registration fees, not a transfer tax', region: 'Alberta', pct: 0 },
  },
}

const tr: CountryCosts = {
  sample: null,
  closer: 'Tapu ve Kadastro (land registry)',
  taxLabel: 'Tapu harcı (title deed fee)',
  extras: [
    { label: 'Döner sermaye & registry service fee', pct: 0.15 },
    { label: 'Sworn translator, notary & power of attorney', pct: 0.25 },
  ],
  buyerAgentPct: 2.4,
  buyerAgentLabel: 'Agency, buyer side (2% + 20% KDV)',
  note:
    'The deed fee is 4% of the declared value, legally 2% from each side and in practice usually carried by the buyer. Declaring below the real price to shave the fee is tax fraud and it caps your future capital-gains base. DASK earthquake cover is mandatory before utilities connect, and some parcels still need a military-zone clearance before a foreigner can complete.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Residential leases run one year and renew automatically; the landlord cannot simply decline to renew without a statutory ground.',
    'Annual increases are tied to the twelve-month average CPI — a headline lira rent is not a free-floating number.',
    'Deposit is capped at three months’ rent under the Turkish Code of Obligations.',
  ],
  rentNote:
    'Seasonal coast rent and Istanbul long-let are different products. A summer gross yield is not an annual one.',
  facts: [
    { n: '4%', label: 'tapu harcı on the declared deed value' },
    { n: 'DASK', label: 'compulsory earthquake insurance, not optional' },
    { n: 'Tapu', label: 'the title deed is the sale, not the reservation form' },
    { n: 'Military check', label: 'still required on some parcels for foreigners' },
  ],
  trust: ['Tapu-verified title', 'DASK & code year checked', '3D map'],
  citiesTitle: 'Six metros, one tapu system',
  citiesSub:
    'The deed fee is national, the risk is not. Building code year, fault geometry and site (HOA) fees decide whether a cheap lira price is a bargain or a liability.',
  defaultCity: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'Türkiye', pct: 4 },
  cities: {
    istanbul: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'İstanbul', pct: 4 },
    antalya: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'Antalya', pct: 4 },
    ankara: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'Ankara', pct: 4 },
    izmir: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'İzmir', pct: 4 },
    bodrum: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'Muğla', pct: 4 },
    bursa: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'Bursa', pct: 4 },
  },
}

const ae: CountryCosts = {
  sample: 1_500_000,
  closer: 'Land Department trustee office',
  taxLabel: 'Land Department transfer fee',
  extras: [
    { label: 'Trustee office & title issuance', pct: 0.15 },
    { label: 'NOC and developer admin', pct: 0.1 },
  ],
  buyerAgentPct: 2.1,
  buyerAgentLabel: 'Agency, buyer side (2% + 5% VAT)',
  note:
    'Dubai charges 4% at the Land Department; Abu Dhabi and the northern emirates charge 2%. There is no annual property tax, which is why the service charge — quoted in dirhams per square foot and revised yearly — is the number that actually decides a yield. Off-plan money belongs in a RERA escrow account; if there is no escrow, there is no deal.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Every tenancy must be registered on Ejari — an unregistered contract has no standing at the rental dispute centre.',
    'The RERA rental index sets how far a landlord may raise on renewal, and 90 days’ written notice is required to change any term.',
    'Rent is still commonly paid in one to four cheques, and DEWA plus district cooling sit outside the quoted rent.',
  ],
  rentNote:
    'Service charge is the second mortgage nobody quotes. Ask for the per-square-foot figure and the last two years of revisions.',
  facts: [
    { n: '4% / 2%', label: 'transfer fee: Dubai vs the other emirates' },
    { n: '0%', label: 'annual property tax — the service charge is the carry' },
    { n: 'RERA escrow', label: 'where off-plan money is legally required to sit' },
    { n: 'Ejari', label: 'tenancy registration that makes a lease enforceable' },
  ],
  trust: ['Freehold zones', 'RERA escrow', '3D map'],
  citiesTitle: 'Four emirates, four rulebooks',
  citiesSub:
    'Freehold is granted zone by zone and the transfer fee changes at the emirate border. Dubai’s DLD is not Abu Dhabi’s DMT, and a Sharjah title is a different instrument again.',
  defaultCity: { chip: '2%', chipTitle: 'Transfer fee outside Dubai', region: 'United Arab Emirates', pct: 2 },
  cities: {
    dubai: { chip: '4%', chipTitle: 'Dubai Land Department transfer fee', region: 'Dubai', pct: 4 },
    'abu-dhabi': { chip: '2%', chipTitle: 'Abu Dhabi Department of Municipalities transfer fee', region: 'Abu Dhabi', pct: 2 },
    sharjah: { chip: '2%', chipTitle: 'Sharjah Real Estate Registration transfer fee', region: 'Sharjah', pct: 2 },
    'ras-al-khaimah': { chip: '2%', chipTitle: 'RAK Municipality transfer fee', region: 'Ras Al Khaimah', pct: 2 },
  },
}

/** Germany derives from the audited Grunderwerbsteuer table — never re-typed. */
const de: CountryCosts = {
  sample: 500_000,
  closer: 'Notar',
  taxLabel: 'Grunderwerbsteuer',
  extras: [
    { label: `Notar (≈${DE_NOTARY_PCT}%)`, pct: DE_NOTARY_PCT },
    { label: `Grundbuch (≈${DE_REGISTER_PCT}%)`, pct: DE_REGISTER_PCT },
  ],
  buyerAgentPct: DE_MAKLER_BUYER_PCT,
  buyerAgentLabel: `Buyer agent share (${DE_MAKLER_BUYER_PCT}% incl. VAT)`,
  note:
    'Grunderwerbsteuer is state law — the same apartment costs a different surcharge in Munich and Cologne. Provisionsfrei listings drop the Makler line. The notary reads the contract aloud before signature: German law, not a formality.',
  rentTitle: 'Rentals run on rules',
  rentRules: [
    'Deposits cap at three months’ cold rent (§551 BGB) and must sit on a separate savings account.',
    'Mietpreisbremse caps new leases above local comparative rent in tight areas; Berlin’s Mietspiegel sets the benchmark.',
    'Modernization may be passed on at 8% of cost per year (§559 BGB) — check the Anpassung history before you underwrite.',
  ],
  rentNote:
    'Qualitative anchors only — live numbers come from the official city Mietspiegel, never a hardcoded table.',
  facts: [],
  trust: ['Street-verified new-builds', 'Notary & Grundbuch', '3D map'],
  citiesTitle: '16 metros, each with its own transfer tax',
  citiesSub:
    'Grunderwerbsteuer is state law — the same apartment costs a different surcharge in Munich and Cologne. City guides carry the local number.',
  defaultCity: { chip: '6.0%', chipTitle: 'Grunderwerbsteuer', region: 'Deutschland', pct: 6 },
  cities: Object.fromEntries(
    DE_CITIES.map((c) => [
      c.slug,
      {
        chip: `${c.transferTaxPct.toFixed(1)}%`,
        chipTitle: `Grunderwerbsteuer — ${c.state}`,
        region: c.state,
        pct: c.transferTaxPct,
      } satisfies CityFact,
    ]),
  ),
}

export const MARKET_COSTS: Record<PathCountryId, CountryCosts> = { de, ae, fr, es, it, gb, us, ca, tr }

/** Progressive slice tax — the UK model. Returns absolute currency. */
export function bandedTax(price: number, bands: Band[]): number {
  let owed = 0
  let floor = 0
  for (const b of bands) {
    const ceiling = b.upTo ?? Infinity
    if (price <= floor) break
    owed += ((Math.min(price, ceiling) - floor) * b.pct) / 100
    floor = ceiling
  }
  return Math.round(owed)
}

export function cityFact(country: PathCountryId, citySlug?: string): CityFact {
  const m = MARKET_COSTS[country]
  return (citySlug && m.cities[citySlug]) || m.defaultCity
}

export interface CostLine {
  label: string
  amount: number
  /** % of price, one decimal — what a percent-only market renders instead. */
  pct: number
}

export interface BuyerCosts {
  price: number
  lines: CostLine[]
  extraTotal: number
  total: number
  /** Surcharge over the price, %, one decimal. */
  totalPct: number
  currency: string
  locale: string
  /** Market has no stable nominal anchor — render percentages only. */
  percentOnly: boolean
}

/**
 * Buyer-side cash needed at completion for one market + city.
 * `price` defaults to the market's worked-example figure; markets with no
 * stable nominal anchor (TRY) fall back to 100 so every line reads as a percent.
 */
export function buyerCosts(
  country: PathCountryId,
  citySlug?: string,
  price?: number,
): BuyerCosts | null {
  const m = MARKET_COSTS[country]
  const percentOnly = m.sample === null
  const base = price ?? m.sample ?? 100
  if (!Number.isFinite(base) || base <= 0) return null
  const fact = cityFact(country, citySlug)
  const lines: CostLine[] = []

  const push = (label: string, amount: number) => {
    if (amount <= 0) return
    lines.push({ label, amount: Math.round(amount), pct: Math.round((amount / base) * 1000) / 10 })
  }

  if (fact.bands) {
    push(`${m.taxLabel} — ${fact.chip}`, bandedTax(base, fact.bands))
    if (fact.surchargePct && fact.surchargeLabel) {
      push(fact.surchargeLabel, (base * fact.surchargePct) / 100)
    }
  } else if (fact.pct) {
    push(`${m.taxLabel} (${fact.pct}%)`, (base * fact.pct) / 100)
  }

  for (const e of m.extras) push(e.label, (base * e.pct) / 100)
  if (m.buyerAgentPct > 0) {
    push(m.buyerAgentLabel ?? `Agency, buyer side (${m.buyerAgentPct}%)`, (base * m.buyerAgentPct) / 100)
  }

  const extraTotal = lines.reduce((n, l) => n + l.amount, 0)
  return {
    price: base,
    lines,
    extraTotal,
    total: base + extraTotal,
    totalPct: Math.round((extraTotal / base) * 1000) / 10,
    currency: MARKETS[country].currency,
    locale: MARKETS[country].locale,
    percentOnly,
  }
}

/** Grid rows for the cities band: name + local rate chip, in market order. */
export function cityRateRows(
  country: PathCountryId,
  names: (slug: string) => string | null,
): { slug: string; name: string; fact: CityFact }[] {
  const out: { slug: string; name: string; fact: CityFact }[] = []
  for (const slug of MARKETS[country].citySlugs) {
    const name = names(slug)
    if (!name) continue
    out.push({ slug, name, fact: cityFact(country, slug) })
  }
  return out
}

/** Country facts band. Germany computes its own from live catalog counts. */
export function countryFacts(country: PathCountryId): { n: string; label: string }[] {
  return MARKET_COSTS[country].facts
}

export function marketTrust(country: PathCountryId): [string, string, string] {
  return MARKET_COSTS[country].trust
}

/** Market-currency formatter — no decimals, market locale. */
export function marketMoney(country: PathCountryId): (n: number) => string {
  const m = MARKETS[country]
  const fmt = new Intl.NumberFormat(m.locale, {
    style: 'currency',
    currency: m.currency,
    maximumFractionDigits: 0,
  })
  return (n) => fmt.format(n)
}
