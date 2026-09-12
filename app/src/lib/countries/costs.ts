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
  /** Total-row label, in the local idiom ("at the notaire", "at completion"). */
  cashLabel: string
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
  cashLabel: 'Cash needed at the notaire',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '5.8%', chipTitle: 'Droits de mutation — Paris (75)', region: 'Paris (75)', pct: 5.8 },
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
  cashLabel: 'Cash needed at the notaría',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '6%', chipTitle: 'ITP — Comunidad de Madrid', region: 'Comunidad de Madrid', pct: 6 },
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
  cashLabel: 'Cash needed at the notaio',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '9%', chipTitle: 'Imposta di registro — second home', region: 'Lazio', pct: 9 },
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
  cashLabel: 'Cash needed at completion',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: sdlt('Greater London'),
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
  cashLabel: 'Cash needed at closing',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '1%+', chipTitle: 'NY mansion tax, buyer, on $1m and up', region: 'New York, NY', pct: 1 },
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
  closer: 'Real estate lawyer (notaire in Québec)',
  cashLabel: 'Cash needed at closing',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '≈4%', chipTitle: 'Ontario LTT + City of Toronto MLTT, effective at $900k', region: 'Ontario + City of Toronto', pct: 4 },
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
  cashLabel: 'Total at the tapu office',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '4%', chipTitle: 'Tapu harcı — national title deed fee', region: 'İstanbul', pct: 4 },
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
  cashLabel: 'Cash needed at the trustee office',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '4%', chipTitle: 'Dubai Land Department transfer fee', region: 'Dubai', pct: 4 },
  cities: {
    dubai: { chip: '4%', chipTitle: 'Dubai Land Department transfer fee', region: 'Dubai', pct: 4 },
    'abu-dhabi': { chip: '2%', chipTitle: 'Abu Dhabi Department of Municipalities transfer fee', region: 'Abu Dhabi', pct: 2 },
    sharjah: { chip: '2%', chipTitle: 'Sharjah Real Estate Registration transfer fee', region: 'Sharjah', pct: 2 },
    'ras-al-khaimah': { chip: '2%', chipTitle: 'RAK Municipality transfer fee', region: 'Ras Al Khaimah', pct: 2 },
  },
}

const gr: CountryCosts = {
  sample: 250_000,
  closer: 'Notary (symvolaiográfos)',
  cashLabel: 'Cash needed at the notary',
  taxLabel: 'Transfer tax (φόρος μεταβίβασης)',
  extras: [
    { label: 'Notary, Ktimatologio & fees (≈1.5%)', pct: 1.5 },
    { label: 'Lawyer (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Transfer tax is 3.09% on the tax-assessed (objective) value, which is often below the price you agree. New-build from a developer may carry 24% VAT instead of transfer tax under repeatedly extended suspension schemes — confirm which regime your unit falls in before you wire. Golden Visa thresholds rose in September 2024 and now run €250,000–€800,000 by municipality.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Residential leases run a three-year minimum — a shorter agreed term extends by law, not by negotiation.',
    'Deposits cap at two months’ rent.',
    'Short-let income needs an AMA registration number with AADE — unregistered listings face fines, and Athens has restricted new registrations in the centre.',
  ],
  rentNote:
    'Qualitative anchors only. Live rents come from signed leases, never a hardcoded table.',
  facts: [
    { n: '3.09%', label: 'transfer tax on the assessed value' },
    { n: 'Ktimatologio', label: 'the cadastre that must show your title' },
    { n: '3 years', label: 'minimum residential lease term' },
    { n: '€250k+', label: 'Golden Visa entry, by zone since 2024' },
  ],
  trust: ['Notary-verified path', 'Ktimatologio title checked', '3D map'],
  citiesTitle: 'Two metros, one national deed',
  citiesSub:
    'Transfer tax is national; demand is not. Athens prices off the capital, tourism and the port economy; Thessaloniki off northern industry and students. Each city guide carries the same rate with a different market.',
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '3.09%', chipTitle: 'Transfer tax — national (φόρος μεταβίβασης)', region: 'Attica', pct: 3.09 },
  cities: {
    athens: { chip: '3.09%', chipTitle: 'Transfer tax — national (φόρος μεταβίβασης)', region: 'Attica', pct: 3.09 },
    thessaloniki: { chip: '3.09%', chipTitle: 'Transfer tax — national (φόρος μεταβίβασης)', region: 'Central Macedonia', pct: 3.09 },
  },
}

/** Cyprus resale-effective bands: gross 3/5/8% halved by the permanent 50% cut. */
const CY_BANDS: Band[] = [
  { upTo: 85_000, pct: 1.5 },
  { upTo: 170_000, pct: 2.5 },
  { upTo: null, pct: 4 },
]

const cyResale = (region: string): CityFact => ({
  chip: '≈2.9%',
  chipTitle: 'Transfer fees, resale-effective at €300k (50% cut applied)',
  region,
  pct: null,
  bands: CY_BANDS,
})

const cy: CountryCosts = {
  sample: 300_000,
  closer: 'District Lands Office',
  cashLabel: 'Cash needed at the Lands Office',
  taxLabel: 'Transfer fees (Τέλη Μεταβίβασης)',
  extras: [
    { label: 'Advocate & disbursements (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'The statute reads 3/5/8% on the Lands Office assessed value — but resales carry a permanent 50% reduction, and new-builds that attracted VAT pay zero transfer fees. Stamp duty was abolished in January 2026. Title deeds on new builds can lag years behind handover: deposit the contract at the District Lands Office within six months for Specific Performance protection, and never pay in full without a separate title in sight.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Pre-2000 buildings in controlled areas fall under rent control — increases follow the statutory order, not the market.',
    'Deposits run one to two months; a statutory tenancy continues after expiry unless a court orders otherwise.',
    'Short-lets need registration with the Deputy Ministry of Tourism — the licence, not the photos, decides the model.',
  ],
  rentNote:
    'Nicosia rents off the capital year-round; Limassol rents off the coast and the season. Do not blend them.',
  facts: [
    { n: '−50%', label: 'transfer-fee cut on resales, permanent' },
    { n: '0%', label: 'transfer fees where VAT was charged' },
    { n: 'Title deed', label: 'separate title or Specific Performance first' },
    { n: 'Permit', label: 'Council of Ministers step for non-EU buyers' },
  ],
  trust: ['Lands Office path', 'Title deed checked', '3D map'],
  citiesTitle: 'Two cities, one fee scale',
  citiesSub:
    'Transfer fees are national and assessed by the District Lands Office, not the contract. Nicosia is an inland capital market; Limassol is a coastal second-home market. Same scale, different buyers.',
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: cyResale('Nicosia district'),
  cities: {
    nicosia: cyResale('Nicosia district'),
    limassol: cyResale('Limassol district'),
  },
}

const nl: CountryCosts = {
  sample: 450_000,
  closer: 'Notaris (civil-law notary)',
  cashLabel: 'Cash needed at the notaris',
  taxLabel: 'Overdrachtsbelasting',
  extras: [
    { label: 'Notaris & Kadaster (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Qualifying residents pay 2%; investors and second-home buyers pay 10.4% — the model prices the resident path, and an investor must add more than eight points to every line. First-home buyers under 35 may pay 0% up to a periodically indexed ceiling. A buyer’s agent (aankoopmakelaar) is optional and paid by the buyer when engaged.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Open-ended contracts are the default since July 2024 — the two-year starter contract is gone.',
    'Deposits cap at two months’ rent.',
    'The WWS points system decides regulated versus liberalized: below the threshold the rent has a legal maximum, whatever the advert says.',
  ],
  rentNote:
    'Amsterdam applies the points cap far more often than Rotterdam does. Price the regime, not the postcode average.',
  facts: [
    { n: '2% / 10.4%', label: 'transfer tax: residents vs investors' },
    { n: 'Notaris', label: 'closes every sale, no exceptions' },
    { n: 'Kadaster', label: 'the register that records your title' },
    { n: 'Indefinite', label: 'leases default to open-ended' },
  ],
  trust: ['Notaris-verified path', 'WWS points checked', '3D map'],
  citiesTitle: 'Two cities, one notarial machine',
  citiesSub:
    'Transfer tax and tenancy law are national; scarcity is not. Amsterdam’s canal belt and Rotterdam’s port districts are different products at different prices under the same statute.',
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '2%', chipTitle: 'Overdrachtsbelasting — qualifying residents', region: 'North Holland', pct: 2 },
  cities: {
    amsterdam: { chip: '2%', chipTitle: 'Overdrachtsbelasting — qualifying residents', region: 'North Holland', pct: 2 },
    rotterdam: { chip: '2%', chipTitle: 'Overdrachtsbelasting — qualifying residents', region: 'South Holland', pct: 2 },
  },
}

/**
 * IMT Table III (mainland, investment/second home) as marginal slices — the
 * official value×rate−deduction formula is arithmetically identical to slice
 * math. Above ~€634k a 6% flat rate replaces the slices (see note).
 */
const PT_BANDS: Band[] = [
  { upTo: 106_346, pct: 1 },
  { upTo: 145_470, pct: 2 },
  { upTo: 198_347, pct: 5 },
  { upTo: 330_539, pct: 7 },
  { upTo: null, pct: 8 },
]

const ptImt = (region: string): CityFact => ({
  chip: 'IMT slices',
  chipTitle: 'IMT Table III (investment) + 0.8% selo',
  region,
  pct: null,
  bands: PT_BANDS,
})

const pt: CountryCosts = {
  sample: 350_000,
  closer: 'Notário (escritura)',
  cashLabel: 'Cash needed at the escritura',
  taxLabel: 'IMT transfer tax',
  extras: [
    { label: 'Imposto do Selo (0.8%)', pct: 0.8 },
    { label: 'Escritura & registos (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'IMT is charged on the higher of the deed price and the VPT, and the model prices Table III — the investment/second-home schedule most foreign buyers fall in. A primary-residence buyer uses a gentler table (exempt to €106,346 in 2026), and first-home buyers under 35 are exempt to €330,539. Above ~€634k a 6% flat rate replaces the slices: confirm on the AT simulator, not on a blog post.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Urban leases (NRAU) run to the agreed term with tenant renewal rights — ending one early needs a statutory ground and formal notice.',
    'Caução plus advance rent is capped at three months in total.',
    'Alojamento Local needs municipal registration — Lisbon and Porto froze new licences in containment zones, and the freeze is the model.',
  ],
  rentNote:
    'Tourist licensing is commune politics, not national law. Read the current containment map before you underwrite occupancy.',
  facts: [
    { n: 'IMT + 0.8%', label: 'sliced transfer tax plus stamp duty' },
    { n: 'NIF', label: 'tax number required before the deed' },
    { n: 'VPT', label: 'the tax value IMT is measured against' },
    { n: 'AL freeze', label: 'new licences frozen in containment zones' },
  ],
  trust: ['Escritura-verified path', 'VPT & licence checked', '3D map'],
  citiesTitle: 'Two cities, one IMT code',
  citiesSub:
    'IMT is national; the licence map is not. Lisbon and Porto share the same slices and the same stamp duty, but short-let containment and tenant demand are local stories.',
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: ptImt('Lisbon'),
  cities: {
    lisbon: ptImt('Lisbon'),
    porto: ptImt('Porto'),
  },
}

const ch: CountryCosts = {
  sample: 1_000_000,
  closer: 'Notar / notaire (cantonal)',
  cashLabel: 'Cash needed at the notary',
  taxLabel: 'Transfer tax (Handänderungssteuer)',
  extras: [
    { label: 'Notary & land-register (cantonal scale ≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Lex Koller makes Switzerland the tightest foreign-buyer regime on this site: buyers without residence or establishment need cantonal authorization inside federal quotas, and some cantons add their own restrictions. Zurich levies no transfer tax at all — registry fees only — while Geneva charges around 3%. Notary scales are cantonal: confirm the canton’s schedule before wiring.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Rent increases track the federal reference mortgage rate — a rate cut entitles tenants to a reduction claim.',
    'Deposits cap at three months’ rent (art. 257e CO) and must sit in a blocked account in the tenant’s name.',
    'Geneva and Vaud require the official form for the initial rent and every increase — no form, no increase.',
  ],
  rentNote:
    'Tenants are organised and the law favours them. Underwrite the reference rate and the form, not the asking rent alone.',
  facts: [
    { n: 'Lex Koller', label: 'permit regime for non-resident buyers' },
    { n: '0% / ~3%', label: 'transfer tax: Zurich vs Geneva' },
    { n: 'Reference rate', label: 'the mortgage rate that moves rents' },
    { n: '20%', label: 'Lex Weber cap on second homes per commune' },
  ],
  trust: ['Cantonal notary path', 'Lex Koller checked', '3D map'],
  citiesTitle: 'Two cities, 26 cantonal rulebooks',
  citiesSub:
    'Transfer tax, notary scale and foreign-buyer practice are cantonal. Zurich and Geneva share a currency and almost nothing else about closing a purchase.',
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: 'None', chipTitle: 'Zurich levies no transfer tax — registry fees only', region: 'Canton of Zurich', pct: 0 },
  cities: {
    zurich: { chip: 'None', chipTitle: 'Zurich levies no transfer tax — registry fees only', region: 'Canton of Zurich', pct: 0 },
    geneva: { chip: '3%', chipTitle: 'Droits de mutation — Geneva (≈3% cantonal + communal)', region: 'Canton of Geneva', pct: 3 },
  },
}

/** Germany derives from the audited Grunderwerbsteuer table — never re-typed. */
const de: CountryCosts = {
  sample: 500_000,
  closer: 'Notar',
  cashLabel: 'Cash needed at the notary',
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
  // Fallback only — pages price the flagship city by name (see MarketHome).
  defaultCity: { chip: '6.0%', chipTitle: 'Grunderwerbsteuer — Berlin', region: 'Berlin', pct: 6 },
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

// ponytail: partial — new countries inherit global defaults where needed.

// ═══ World markets (60) — same table, same rules. National rate helper keeps cities DRY. ═══

const worldCity = (chip: string, pct: number, region: string, title: string): CityFact => ({ chip, chipTitle: title, region, pct })

const jp: CountryCosts = {
  sample: 60000000,
  closer: 'Shiho-shoshi (judicial scrivener)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration & stamp taxes',
  extras: [
    { label: 'Acquisition tax (billed later, ≈3%)', pct: 3.0 },
    { label: 'Agent fee — capped 3% + tax, both sides', pct: 3.3 },
  ],
  buyerAgentPct: 0,
  note:
    'Freehold is normal and titles are clean, but the bill arrives in stages: acquisition tax (≈3% of assessed value, with deductions for modest homes) is invoiced months after closing. Agent fees are legally capped at 3% plus consumption tax, paid by each side. A shiho-shoshi registers the title; a condo (mansion) carries a split land share.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Open-ended leases are the norm; renewal is expected and reikin (key money) survives in some buildings.',
    'Deposits (shikikin) run one to two months; guarantor companies have replaced personal guarantors in most cities.',
    'Renewal fees (kōshinryō, one month) are contractual, not statutory — strike them before signing.',
  ],
  rentNote:
    'Tokyo rents off wages and finance, Osaka off commerce. Deposit customs, not rent levels, decide your cash at signing.',
  facts: [
    { n: '≈3%', label: 'acquisition tax, billed after closing' },
    { n: '3%', label: 'statutory agent-fee cap' },
    { n: '1–2 mo', label: 'shikikin deposit' },
    { n: 'Freehold', label: 'with a split land share for condos' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Rates are national; demand is not. Tokyo prices off finance wages, Fukuoka off a tech corridor — same deed, different buyers.',
  defaultCity: worldCity('≈0.7%', 0.7, 'Kantō', 'Registration & stamp taxes — national'),
  cities: {
    tokyo: worldCity('≈0.7%', 0.7, 'Kantō', 'Registration & stamp taxes — national'),
    osaka: worldCity('≈0.7%', 0.7, 'Kansai', 'Registration & stamp taxes — national'),
    yokohama: worldCity('≈0.7%', 0.7, 'Kanagawa', 'Registration & stamp taxes — national'),
    nagoya: worldCity('≈0.7%', 0.7, 'Chūbu', 'Registration & stamp taxes — national'),
    fukuoka: worldCity('≈0.7%', 0.7, 'Kyūshū', 'Registration & stamp taxes — national'),
    kyoto: worldCity('≈0.7%', 0.7, 'Kansai', 'Registration & stamp taxes — national'),
  },
}
const cn: CountryCosts = {
  sample: 4000000,
  closer: 'Real Estate Registration Center',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Deed tax (qishui)',
  extras: [
    { label: 'Agent fee, typically 1% each side', pct: 1.0 },
    { label: 'Registration & stamping (≈0.1%)', pct: 0.1 },
  ],
  buyerAgentPct: 0,
  note:
    'Deed tax runs 1–3% by size and first/second home; the table prices the 1.5% first-home path. Foreigners need one year of work or study history and are limited to one home for own use. Urban land is state-owned — you buy a building title plus a land-use right of up to 70 years for homes.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months; one month is the Beijing/Shanghai norm.',
    'Residential leases cap at 20 years by statute, renewable.',
    'Rent increases are contractual — a fixed-term contract resets the price legally at renewal.',
  ],
  rentNote:
    'Tier-1 rents track hukou and salary ceilings; the same unit in Chengdu rents for half a Shanghai postcode.',
  facts: [
    { n: '1–3%', label: 'deed tax by home size and count' },
    { n: '70 yr', label: 'land-use right on residential land' },
    { n: '1 home', label: 'the foreigner cap, with work history' },
    { n: '20 yr', label: 'statutory lease maximum' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Deed tax is national; quotas are local. Shanghai and Shenzhen ration by hukou, Chengdu and Hangzhou still price by build quality.',
  defaultCity: worldCity('1–3%', 1.5, 'Municipality', 'Deed tax (qishui) — national'),
  cities: {
    shanghai: worldCity('1–3%', 1.5, 'Municipality', 'Deed tax (qishui) — national'),
    beijing: worldCity('1–3%', 1.5, 'Municipality', 'Deed tax (qishui) — national'),
    guangzhou: worldCity('1–3%', 1.5, 'Guangdong', 'Deed tax (qishui) — national'),
    shenzhen: worldCity('1–3%', 1.5, 'Guangdong', 'Deed tax (qishui) — national'),
    chengdu: worldCity('1–3%', 1.5, 'Sichuan', 'Deed tax (qishui) — national'),
    hangzhou: worldCity('1–3%', 1.5, 'Zhejiang', 'Deed tax (qishui) — national'),
  },
}
const kr: CountryCosts = {
  sample: 800000000,
  closer: 'Legal Affairs Office registration',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Acquisition tax (chwideungse)',
  extras: [
    { label: 'Agent fee — capped 0.4% each side (중개보수)', pct: 0.4 },
    { label: 'Registration & stamp (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Acquisition tax is 1% for one modest home and 3% above the ₩900M price cap, with punitive 8–12% rates for multiple homes in regulated areas — the table prices the single-home path. Jeonse (a large refundable deposit instead of monthly rent) remains distinctive: 40–60% of price is common, legally capped at 5% annual return in Seoul.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Jeonse replaces rent with a big refundable deposit — confirm the guarantee insurance before wiring.',
    'Monthly rent (wolse) pairs a smaller deposit with higher monthly payments.',
    'Deposit return is protected up to a statutory cap per city; the Guarantee Fund pays out only after registration of the date.',
  ],
  rentNote:
    'Seoul is a regulated market with tax-by-district; Busan and Incheon follow the same statutes at half the deposit sizes.',
  facts: [
    { n: '1–3%', label: 'acquisition tax by price and home count' },
    { n: 'Jeonse', label: 'the deposit-for-rent system' },
    { n: '₩900M', label: 'the 1% price cap (indexed)' },
    { n: '5%', label: 'annual return cap on jeonse in Seoul' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The acquisition tax is national with district-level regulation; jeonse deposits scale with the local price base.',
  defaultCity: worldCity('1–3%', 1.0, 'Capital area', 'Acquisition tax (chwideungse) — national'),
  cities: {
    seoul: worldCity('1–3%', 1.0, 'Capital area', 'Acquisition tax (chwideungse) — national'),
    busan: worldCity('1–3%', 1.0, 'Yeongnam', 'Acquisition tax (chwideungse) — national'),
    incheon: worldCity('1–3%', 1.0, 'Capital area', 'Acquisition tax (chwideungse) — national'),
    daegu: worldCity('1–3%', 1.0, 'Yeongnam', 'Acquisition tax (chwideungse) — national'),
    daejeon: worldCity('1–3%', 1.0, 'Hoseo', 'Acquisition tax (chwideungse) — national'),
  },
}
const hk: CountryCosts = {
  sample: 8000000,
  closer: 'Solicitor',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Ad valorem stamp duty (AVD)',
  extras: [
    { label: 'Solicitor & disbursements (≈1%)', pct: 1.0 },
    { label: 'Agent fee — typically 1%, negotiable', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'All the cooling measures — Buyer Stamp Duty, Special Stamp Duty, New Residential stamp — were scrapped in the February 2024 Budget; what remains is plain AVD at scaled rates from $100. Scale 2 rates run 1.5% to 4.25% at the top. Stamp duty rides on price or fair value, whichever is higher.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months; the norm is two.',
    'Leases are typically one or two years with a fixed break and a defined renewal uplift.',
    'Stamping the tenancy is legally required — an unstamped lease cannot be enforced in court.',
  ],
  rentNote:
    'Hong Kong Island, Kowloon and the New Territories are one legal market with three price tiers; rates do not vary by district.',
  facts: [
    { n: '1.5–4.25%', label: 'scaled ad valorem stamp duty' },
    { n: '2024', label: 'cooling measures scrapped' },
    { n: '2 mo', label: 'typical deposit' },
    { n: 'Stamped', label: 'leases or no court enforcement' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One market, one duty scale. District choice changes the price, never the tax.',
  defaultCity: { chip: '1.5–4.25%', chipTitle: 'Ad valorem stamp duty (AVD) — national bands', region: 'Hong Kong SAR', pct: null, bands: [{ upTo: 3000000, pct: 1.5 }, { upTo: 3528240, pct: 1.75 }, { upTo: 4500000, pct: 2.25 }, { upTo: 4935480, pct: 2.5 }, { upTo: 6000000, pct: 3.0 }, { upTo: 6642880, pct: 3.5 }, { upTo: 9000000, pct: 4.0 }, { upTo: 9942960, pct: 4.125 }, { upTo: null, pct: 4.25 }] },
  cities: {
    'hong-kong': { chip: '1.5–4.25%', chipTitle: 'Ad valorem stamp duty (AVD) — national bands', region: 'Hong Kong SAR', pct: null, bands: [{ upTo: 3000000, pct: 1.5 }, { upTo: 3528240, pct: 1.75 }, { upTo: 4500000, pct: 2.25 }, { upTo: 4935480, pct: 2.5 }, { upTo: 6000000, pct: 3.0 }, { upTo: 6642880, pct: 3.5 }, { upTo: 9000000, pct: 4.0 }, { upTo: 9942960, pct: 4.125 }, { upTo: null, pct: 4.25 }] },
  },
}
const sg: CountryCosts = {
  sample: 1800000,
  closer: 'Conveyancing lawyer',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Buyer’s Stamp Duty (BSD)',
  extras: [
    { label: 'Legal conveyancing (≈0.7%)', pct: 0.7 },
    { label: 'Agent fee — seller-paid on private sales', pct: 0.0 },
  ],
  buyerAgentPct: 0,
  note:
    'BSD is progressive 1–4%. The swing factor is ABSD: citizens pay nothing extra on a first home, while foreigners pay a flat 60% — the table prices the citizen path and flags the surcharge. Sellers of a second property within three years pay SSD, which shapes how much stock reaches the market.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month to sign the option and exercise within three weeks.',
    'Standard leases are one or two years with a diplomatic clause for expats.',
    'Renting out an HDB flat requires a minimum occupation period before the licence.',
  ],
  rentNote:
    'HDB resale and private condos are two different markets under the same duty scale — the grant, not the tax, differs.',
  facts: [
    { n: '1–4%', label: 'progressive BSD' },
    { n: '60%', label: 'ABSD for foreign buyers (2023)' },
    { n: '21 d', label: 'option-to-purchase exercise window' },
    { n: '3 yr', label: 'Seller’s Stamp Duty window' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One city, one scale: the citizen path is cheap and the foreign path is punitive. Model prices the citizen path.',
  defaultCity: { chip: '1–4%', chipTitle: 'Buyer’s Stamp Duty (BSD) — national bands', region: 'Singapore', pct: null, bands: [{ upTo: 180000, pct: 1.0 }, { upTo: 360000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }], surchargePct: 60, surchargeLabel: 'ABSD for foreign buyers' },
  cities: {
    singapore: { chip: '1–4%', chipTitle: 'Buyer’s Stamp Duty (BSD) — national bands', region: 'Singapore', pct: null, bands: [{ upTo: 180000, pct: 1.0 }, { upTo: 360000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }], surchargePct: 60, surchargeLabel: 'ABSD for foreign buyers' },
  },
}
const th: CountryCosts = {
  sample: 8000000,
  closer: 'Land Department (thi thī din)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer fee (2% of appraised)',
  extras: [
    { label: 'Withholding/SBT — seller side but negotiated', pct: 0.0 },
    { label: 'Legal & disbursements (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Transfer fee is 2% of the appraised value, commonly split 1% each side. Sellers face withholding or Specific Business Tax 3.4% if held under five years. Foreigners hold condos freehold inside a 49% quota per building — landed property needs a 30-year lease or a company structure the authorities scrutinize.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months; booking fees credit against rent.',
    'Standard leases are 12 months; the 30-year maximum applies to registered leases.',
    'Registered long leases (over three years) must be recorded at the Land Department to bind a new owner.',
  ],
  rentNote:
    'Bangkok rents off wages; Phuket and Pattaya rent off tourism seasons — the same unit changes model twice a year.',
  facts: [
    { n: '2%', label: 'transfer fee on appraised value, split' },
    { n: '49%', label: 'foreign condo quota per building' },
    { n: '30 yr', label: 'registered lease maximum' },
    { n: '3.4%', label: 'SBT if sold within five years' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The fee is national on the appraised value, which often sits below market — the cash gap surprises first-time buyers.',
  defaultCity: worldCity('2%', 2.0, 'Bangkok', 'Transfer fee (2% of appraised) — national'),
  cities: {
    bangkok: worldCity('2%', 2.0, 'Bangkok', 'Transfer fee (2% of appraised) — national'),
    'chiang-mai': worldCity('2%', 2.0, 'Chiang Mai', 'Transfer fee (2% of appraised) — national'),
    phuket: worldCity('2%', 2.0, 'Phuket', 'Transfer fee (2% of appraised) — national'),
    pattaya: worldCity('2%', 2.0, 'Chonburi', 'Transfer fee (2% of appraised) — national'),
  },
}
const id: CountryCosts = {
  sample: 2500000000,
  closer: 'PPAT (land deed official)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'BPHTB (land & building acquisition duty)',
  extras: [
    { label: 'PPAT fee (≈1%)', pct: 1.0 },
    { label: 'BPN registration (≈0.1%)', pct: 0.1 },
  ],
  buyerAgentPct: 0,
  note:
    'BPHTB is 5% of the transaction value above a regional threshold — Jakarta’s threshold was raised dramatically in 2024, cutting the effective bite on modest flats. Foreigners cannot hold freehold (Hak Milik); the realistic paths are Hak Pakai (right to use) on certified land or apartment units under the 2015 regulation. A PPAT draws and registers the deed at the National Land Agency (BPN).',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months; the Jakarta norm is two.',
    'Rent is typically paid annually in advance at a discount, or monthly at a premium.',
    'Leases under the civil code run up to 25 years with extension by agreement.',
  ],
  rentNote:
    'Jakarta prices off the new capital exodus; Bali rents off tourism and villas bill in dollars. Two markets, one statute.',
  facts: [
    { n: '5%', label: 'BPHTB above regional thresholds' },
    { n: 'Hak Pakai', label: 'the foreigner’s right to use' },
    { n: '25 yr', label: 'statutory lease ceiling' },
    { n: 'BPN', label: 'the registry that must show title' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'BPHTB thresholds are regional: the same price pays full duty in one province and nearly none in another.',
  defaultCity: worldCity('5%', 5.0, 'DKI Jakarta', 'BPHTB (land & building acquisition duty) — national'),
  cities: {
    jakarta: worldCity('5%', 5.0, 'DKI Jakarta', 'BPHTB (land & building acquisition duty) — national'),
    surabaya: worldCity('5%', 5.0, 'East Java', 'BPHTB (land & building acquisition duty) — national'),
    bandung: worldCity('5%', 5.0, 'West Java', 'BPHTB (land & building acquisition duty) — national'),
    medan: worldCity('5%', 5.0, 'North Sumatra', 'BPHTB (land & building acquisition duty) — national'),
    bali: worldCity('5%', 5.0, 'Bali', 'BPHTB (land & building acquisition duty) — national'),
  },
}
const ph: CountryCosts = {
  sample: 8000000,
  closer: 'Register of Deeds',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Doc stamp + transfer + registration',
  extras: [
    { label: 'Notarial & processing (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'The bundle: documentary stamp 1.5%, transfer tax 0.5%, registration ≈0.25% — all on price or zonal value, whichever is higher. Condos sit inside a 40% foreign ownership quota per project; landed property is effectively closed to foreign buyers. The capital-gains side (6%) is seller’s by law but negotiated in practice.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months; post-dated cheques are standard in Manila.',
    'Leases run one year minimum, two is common, with escalation built in.',
    'The Rent Control Act caps increases on lower-rent units in Metro Manila — know which side of the threshold you are on.',
  ],
  rentNote:
    'Makati and BGC price off BPO wages; Cebu and Davao follow the same statutes at a discount. The quota, not the tax, binds supply.',
  facts: [
    { n: '1.5%', label: 'documentary stamp' },
    { n: '40%', label: 'foreign condo quota per project' },
    { n: '6%', label: 'seller-side CGT, often negotiated' },
    { n: '1 yr', label: 'minimum standard lease' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Transfer costs are national; zonal values are local and drag the effective base above or below your price.',
  defaultCity: worldCity('≈2.25%', 2.25, 'Metro Manila', 'Doc stamp + transfer + registration — national'),
  cities: {
    manila: worldCity('≈2.25%', 2.25, 'Metro Manila', 'Doc stamp + transfer + registration — national'),
    cebu: worldCity('≈2.25%', 2.25, 'Central Visayas', 'Doc stamp + transfer + registration — national'),
    davao: worldCity('≈2.25%', 2.25, 'Davao Region', 'Doc stamp + transfer + registration — national'),
    'quezon-city': worldCity('≈2.25%', 2.25, 'Metro Manila', 'Doc stamp + transfer + registration — national'),
  },
}
const vn: CountryCosts = {
  sample: 4000000000,
  closer: 'Notary + Land Registration Office',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration fee (lệ phí trước bạ)',
  extras: [
    { label: 'Notary & registration (≈0.7%)', pct: 0.7 },
  ],
  buyerAgentPct: 0,
  note:
    'The buyer’s registration fee is 0.5% (apartments priced by area in some cities since 2024); the seller side carries 2% personal income tax. Foreigners may buy apartments up to 30% of units in a building (or 250 houses per ward) on 50-year ownership cards, renewable. Pink books (sổ hồng) are the title; notarization is mandatory before registration.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months; one is the Ho Chi Minh City norm.',
    'Standard leases are one year; shorter is common in expat districts.',
    'Handover and payment are staged against the pink-book process — never pay in full before notarization.',
  ],
  rentNote:
    'Ho Chi Minh City rents off manufacturing wages; Hanoi off government and tech. The foreign quota binds in central wards.',
  facts: [
    { n: '0.5%', label: 'buyer registration fee' },
    { n: '30%', label: 'foreign quota per apartment building' },
    { n: '50 yr', label: 'foreign ownership card, renewable' },
    { n: '2%', label: 'seller PIT' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The registration fee is national and tiny; the friction is the pink book. Central-ward quotas bind before budgets do.',
  defaultCity: worldCity('0.5%', 0.5, 'Southeast', 'Registration fee (lệ phí trước bạ) — national'),
  cities: {
    'ho-chi-minh-city': worldCity('0.5%', 0.5, 'Southeast', 'Registration fee (lệ phí trước bạ) — national'),
    hanoi: worldCity('0.5%', 0.5, 'Red River Delta', 'Registration fee (lệ phí trước bạ) — national'),
    'da-nang': worldCity('0.5%', 0.5, 'South Central Coast', 'Registration fee (lệ phí trước bạ) — national'),
    'nha-trang': worldCity('0.5%', 0.5, 'Khánh Hòa', 'Registration fee (lệ phí trước bạ) — national'),
  },
}
const my: CountryCosts = {
  sample: 800000,
  closer: 'Lawyer (stamp duty on MOT)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty on the Memorandum of Transfer',
  extras: [
    { label: 'Legal fee — statutory scale (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty scales 1% to 4% on the transfer (first RM100k free for first homes under the 2024-2025 budgets). Foreign buyers face state minimum prices — RM1M in most states, RM2M in Selangor for landed — and developer discounts are statutory-capped. The Real Property Gains Tax is seller-side and tapered to 0% after six years.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months; utilities deposits stack on top.',
    'Standard leases are one to two years with renewal at market, not capped.',
    'The stamping of the tenancy must be done at LHDN — an unstamped lease loses court teeth.',
  ],
  rentNote:
    'KL prices off government and oil wages; Penang and Johor Bahru price off Singapore spillover. Minimum-price floors, not taxes, gate foreigners.',
  facts: [
    { n: '1–4%', label: 'scaled stamp duty on transfer' },
    { n: 'RM1M+', label: 'foreign minimum price by state' },
    { n: '6 yr', label: 'RPGT taper to zero' },
    { n: '3 mo', label: 'typical deposit' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The duty scale is federal; the foreign price floor is state law. Selangor’s RM2M landed floor is the binding one.',
  defaultCity: { chip: '1–4%', chipTitle: 'Stamp duty on the Memorandum of Transfer — national bands', region: 'Federal Territory', pct: null, bands: [{ upTo: 100000, pct: 1.0 }, { upTo: 500000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }] },
  cities: {
    'kuala-lumpur': { chip: '1–4%', chipTitle: 'Stamp duty on the Memorandum of Transfer — national bands', region: 'Federal Territory', pct: null, bands: [{ upTo: 100000, pct: 1.0 }, { upTo: 500000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }] },
    'george-town': { chip: '1–4%', chipTitle: 'Stamp duty on the Memorandum of Transfer — national bands', region: 'Penang', pct: null, bands: [{ upTo: 100000, pct: 1.0 }, { upTo: 500000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }] },
    'johor-bahru': { chip: '1–4%', chipTitle: 'Stamp duty on the Memorandum of Transfer — national bands', region: 'Johor', pct: null, bands: [{ upTo: 100000, pct: 1.0 }, { upTo: 500000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }] },
    'kota-kinabalu': { chip: '1–4%', chipTitle: 'Stamp duty on the Memorandum of Transfer — national bands', region: 'Sabah', pct: null, bands: [{ upTo: 100000, pct: 1.0 }, { upTo: 500000, pct: 2.0 }, { upTo: 1000000, pct: 3.0 }, { upTo: null, pct: 4.0 }] },
  },
}
const mm: CountryCosts = {
  sample: 300000000,
  closer: 'Yangon City Development Committee registry',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration levy',
  extras: [
    { label: 'Advocate & disbursements', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Numbers here carry a coup-era caveat: the market has been frozen since 2021, the kyat is managed, and the IRD-assessed levy that once dominated closing sheets (historically quoted near 15%, later reduced in practice) is enforced unevenly. Treat every figure as pre-coup reference, verify with a local advocate, and expect title registration itself to be the bottleneck, not the tax rate.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run three to six months — landlords price in regime risk.',
    'Most leases are handshake-plus-contract; enforcement is uncertain.',
    'Hard currency clauses are common and legally grey — the kyat is not a store of value.',
  ],
  rentNote:
    'Yangon is the only liquid market; Mandalay and Naypyidaw are administrative. sivrce publishes verified listings only.',
  facts: [
    { n: '≈10%', label: 'IRD levy, unevenly enforced since 2021' },
    { n: '2021', label: 'coup froze the market' },
    { n: 'Frozens', label: 'foreign investment halted at source' },
    { n: 'Hard title', label: 'rare outside central Yangon' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One primate city carries the whole market. Rates are reference-grade until the registry functions again.',
  defaultCity: worldCity('≈10%', 10.0, 'Yangon', 'Registration levy — national'),
  cities: {
    yangon: worldCity('≈10%', 10.0, 'Yangon', 'Registration levy — national'),
    mandalay: worldCity('≈10%', 10.0, 'Mandalay', 'Registration levy — national'),
    naypyidaw: worldCity('≈10%', 10.0, 'Naypyidaw', 'Registration levy — national'),
  },
}
const in_: CountryCosts = {
  sample: 12000000,
  closer: 'Sub-registrar',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty + registration',
  extras: [
    { label: 'Registration (1% above ₹30 lakh)', pct: 1.0 },
    { label: 'Legal & due diligence (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty runs 5–7% by state (6% in Maharashtra, 5% in Delhi with a 1% concession for women buyers) plus 1% registration above ₹30 lakh. Circle rates (government minimums) set the floor for duty even when you pay less. Ready-possession from a builder adds GST at 5% without input credit.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to six months; three is the metro norm.',
    'The Model Tenancy Act caps deposits in adopting states — check your state has notified it.',
    'Registered leave-and-license agreements (11 months standard) carry the stamp duty, not the landlord’s goodwill.',
  ],
  rentNote:
    'Mumbai duty is 6% of a price set by the island city’s scarcity; the same flat in Hyderabad pays 7% on a third the base.',
  facts: [
    { n: '5–7%', label: 'stamp duty by state' },
    { n: '1%', label: 'registration above ₹30 lakh' },
    { n: '11 mo', label: 'the standard leave-and-license' },
    { n: 'Circle rate', label: 'the duty floor, whatever you pay' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Duty is state law: every metro in this grid sets its own rate and its own circle-rate floor.',
  defaultCity: worldCity('5–7%', 6.0, 'Maharashtra', 'Stamp duty + registration — national'),
  cities: {
    mumbai: worldCity('5–7%', 6.0, 'Maharashtra', 'Stamp duty + registration — national'),
    delhi: worldCity('5–7%', 6.0, 'NCT', 'Stamp duty + registration — national'),
    bangalore: worldCity('5–7%', 6.0, 'Karnataka', 'Stamp duty + registration — national'),
    chennai: worldCity('5–7%', 6.0, 'Tamil Nadu', 'Stamp duty + registration — national'),
    kolkata: worldCity('5–7%', 6.0, 'West Bengal', 'Stamp duty + registration — national'),
    hyderabad: worldCity('5–7%', 6.0, 'Telangana', 'Stamp duty + registration — national'),
  },
}
const pk: CountryCosts = {
  sample: 30000000,
  closer: 'Sub-registrar',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty + registration',
  extras: [
    { label: 'Society transfer fee where applicable', pct: 0.5 },
    { label: 'Legal (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp 2% + registration 1% is the standard bundle, but the collector rate (district valuation) sets the floor, and Lahore and Karachi each carry their own DC-rate tables that move annually. Capital gains on sellers (up to 15% for non-filers within a year) shape asking prices. Society transfers (DHA, Bahria, CDA sectors) add allocation and transfer fees unique to each scheme.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months plus separate utility deposits.',
    'Leases are commonly 11 months to avoid registration requirements.',
    'Unregistered tenancies are unenforceable — and most of the market is exactly that.',
  ],
  rentNote:
    'Karachi prices off a port economy and a security premium; Lahore off remittances; Islamabad plots are a different asset class.',
  facts: [
    { n: '2%+1%', label: 'stamp + registration bundle' },
    { n: 'DC rate', label: 'the collector’s valuation floor' },
    { n: '15%', label: 'CGT for non-filers within a year' },
    { n: 'Society fee', label: 'DHA/Bahria transfer cost extra' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The statutory bundle is national; the DC-rate tables and society fees are district- and scheme-specific.',
  defaultCity: worldCity('≈3%', 3.0, 'Sindh', 'Stamp duty + registration — national'),
  cities: {
    karachi: worldCity('≈3%', 3.0, 'Sindh', 'Stamp duty + registration — national'),
    lahore: worldCity('≈3%', 3.0, 'Punjab', 'Stamp duty + registration — national'),
    islamabad: worldCity('≈3%', 3.0, 'ICT', 'Stamp duty + registration — national'),
    rawalpindi: worldCity('≈3%', 3.0, 'Punjab', 'Stamp duty + registration — national'),
  },
}
const bd: CountryCosts = {
  sample: 12000000,
  closer: 'Sub-registrar',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp + registration + VAT',
  extras: [
    { label: 'Legal & processing (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'The Dhaka closing stack: stamp duty 1.5%, registration 1%, local government tax 3%, source tax 2% — with VAT at 2% on first sales from developers. Properties in Dhaka’s administrative zones carry the full stack; district rates differ. The deed must be registered within the statutory window or the sale is void against third parties.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months; advance rent is common.',
    'Leases commonly run 12 months, renewable with a negotiated uplift.',
    'The tenant’s registration of the tenancy is rare — courts treat unregistered leases accordingly.',
  ],
  rentNote:
    'Dhaka is a single-city market: Gulshan and Dhanmondi are two different asset classes under one stamp scale.',
  facts: [
    { n: '≈7%', label: 'the full Dhaka closing stack' },
    { n: '3%', label: 'local government tax component' },
    { n: '2%', label: 'VAT on first developer sales' },
    { n: 'Deed window', label: 'register or lose to third parties' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The stack is national on paper; Dhaka administrative zones carry the full load and districts discount.',
  defaultCity: worldCity('≈7%', 7.0, 'Dhaka', 'Stamp + registration + VAT — national'),
  cities: {
    dhaka: worldCity('≈7%', 7.0, 'Dhaka', 'Stamp + registration + VAT — national'),
    chittagong: worldCity('≈7%', 7.0, 'Chattogram', 'Stamp + registration + VAT — national'),
    sylhet: worldCity('≈7%', 7.0, 'Sylhet', 'Stamp + registration + VAT — national'),
  },
}
const lk: CountryCosts = {
  sample: 35000000,
  closer: 'Registrar General',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty (4%)',
  extras: [
    { label: 'Notary & disbursements (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty is 4% nationwide (2025), with a reduced 3% announced for first-time buyers of sub-LKR 5M homes. Foreigners buying condominiums from the primary market pay higher duties (2024 amendments), and the industry lobbied the 2025 budget for relief on new leases. Title is being digitized under Bim Saviya — insist on a scheme plan under the new system where available.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run three to six months; landlords price in currency risk.',
    'Leases commonly run one year with rupee escalation clauses.',
    'Lease duty applies on registered tenancies — many skip it and lose standing.',
  ],
  rentNote:
    'Colombo 3–7 prices off the port and expat NGOs; Kandy and Galle are tourism and retirement markets.',
  facts: [
    { n: '4%', label: 'stamp duty nationwide (2025)' },
    { n: '3%', label: 'first-home relief track (sub LKR 5M)' },
    { n: 'Bim Saviya', label: 'the digitizing title system' },
    { n: 'Condo duty', label: 'higher for foreign primary buyers' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One island, one duty scale: the relief track and the foreign surcharge, not geography, move the rate.',
  defaultCity: worldCity('4%', 4.0, 'Western', 'Stamp duty (4%) — national'),
  cities: {
    colombo: worldCity('4%', 4.0, 'Western', 'Stamp duty (4%) — national'),
    kandy: worldCity('4%', 4.0, 'Central', 'Stamp duty (4%) — national'),
    galle: worldCity('4%', 4.0, 'Southern', 'Stamp duty (4%) — national'),
  },
}
const np: CountryCosts = {
  sample: 20000000,
  closer: 'Land Revenue Office (Malpot)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration fee (4–5%)',
  extras: [
    { label: 'Legal & processing (≈0.7%)', pct: 0.7 },
  ],
  buyerAgentPct: 0,
  note:
    'Registration fees run 4–5% by municipality class (Kathmandu metro at the top), plus a small land revenue fee. Foreigners cannot buy land without government approval, effectively reserved for treaty arrangements — the market is domestic. Cadastral maps predate the earthquake; get a plot resurveyed before you pay.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases are commonly 12 months, renewable with an uplift.',
    'Unregistered leases are the norm outside Kathmandu — treat them as month-to-month.',
  ],
  rentNote:
    'Kathmandu valley plots price off remittances and seismic risk; Pokhara off tourism. The registry, not the tax, is the friction.',
  facts: [
    { n: '4–5%', label: 'registration by municipality class' },
    { n: 'Malpot', label: 'the Land Revenue Office that must show title' },
    { n: 'Approval', label: 'foreign purchases need cabinet-level consent' },
    { n: 'Resurvey', label: 'pre-earthquake maps are unreliable' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The rate steps with municipality class: Kathmandu metro pays the top rate, Pokhara one notch down.',
  defaultCity: worldCity('≈5%', 5.0, 'Bagmati', 'Registration fee (4–5%) — national'),
  cities: {
    kathmandu: worldCity('≈5%', 5.0, 'Bagmati', 'Registration fee (4–5%) — national'),
    pokhara: worldCity('≈5%', 5.0, 'Gandaki', 'Registration fee (4–5%) — national'),
    lalitpur: worldCity('≈5%', 5.0, 'Bagmati', 'Registration fee (4–5%) — national'),
  },
}
const kh: CountryCosts = {
  sample: 150000,
  closer: 'Cadastral office (LMAP cadastre)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax (4%)',
  extras: [
    { label: 'Legal & title conversion (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'A flat 4% transfer tax on the declared value, with hard titles the only fully registered chain. Soft titles dominate outside central Phnom Penh — they transfer at the sangkat level but carry no national registry protection. The 70/30 rule caps foreign ownership in a co-owned building at 30% of units (70% must stay Cambodian); landed property stays domestic.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months; one is common in Phnom Penh condos.',
    'Leases run one year minimum, longer for commercial.',
    'Soft-title tenancies enforce only locally — verify the hard title before relying on a lease.',
  ],
  rentNote:
    'Phnom Penh rents off garment wages and expat NGOs; Siem Reap off Angkor tourism. Hard title is the asset class.',
  facts: [
    { n: '4%', label: 'flat transfer tax on declared value' },
    { n: 'Hard title', label: 'the only nationally registered chain' },
    { n: '30%', label: 'foreign quota in co-owned buildings' },
    { n: 'Soft title', label: 'local recognition only' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate; the title class — hard or soft — is the real price of admission.',
  defaultCity: worldCity('4%', 4.0, 'Phnom Penh', 'Transfer tax (4%) — national'),
  cities: {
    'phnom-penh': worldCity('4%', 4.0, 'Phnom Penh', 'Transfer tax (4%) — national'),
    'siem-reap': worldCity('4%', 4.0, 'Siem Reap', 'Transfer tax (4%) — national'),
  },
}
const la: CountryCosts = {
  sample: 900000000,
  closer: 'Notary + Land Management Authority',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration (≈1%)',
  extras: [
    { label: 'Legal & title verification (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Land is state-owned; foreigners hold leases up to 50 years (renewable) or concessions, never freehold. Registration is nominal but the due diligence is not: maps and title books diverge outside Vientiane, and the Land Management Authority’s record is the only defense against overlapping claims. Chinese rail-linked speculation has repriced corridor land more than any statute.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases follow the civil code; registered leases bind successors.',
    'A lease over the statutory term without registration is void against third parties.',
  ],
  rentNote:
    'Vientiane prices off rail-corridor speculation; Luang Prabang off tourism and UNESCO limits.',
  facts: [
    { n: '50 yr', label: 'maximum renewable lease' },
    { n: '≈1%', label: 'nominal registration' },
    { n: 'LMA record', label: 'the only defense to overlapping claims' },
    { n: 'Concession', label: 'the other foreign structure' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The fee is noise; the lease term and the LMA record are the whole deal.',
  defaultCity: worldCity('≈1%', 1.0, 'Vientiane Capital', 'Registration (≈1%) — national'),
  cities: {
    vientiane: worldCity('≈1%', 1.0, 'Vientiane Capital', 'Registration (≈1%) — national'),
    'luang-prabang': worldCity('≈1%', 1.0, 'Luang Prabang', 'Registration (≈1%) — national'),
  },
}
const uz: CountryCosts = {
  sample: 900000000,
  closer: 'Notary (davlat notarial idorasi)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Notary & registration',
  extras: [
    { label: 'Legal & processing (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'A 2023 presidential decree opened new-build apartments in Tashkent to foreign buyers (resale needs residence). Costs are light — notary and registration under 1% — but payment must route through Uzbek banks, and the cadastre (kadastr) registration is the enforceable step. The soum floats: contract in hard currency where both sides agree.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases are commonly 11 months, renewable.',
    'Notarized tenancies are the enforceable ones — the notary, not the landlord, is your registry.',
  ],
  rentNote:
    'Tashkent absorbs nearly all liquidity; Samarkand and Bukhara price off tourism. New-build foreign rules bind only in the capital first.',
  facts: [
    { n: '2023', label: 'the decree opening new-builds to foreigners' },
    { n: '<1%', label: 'notary + registration bundle' },
    { n: 'Kadastr', label: 'the cadastre that makes title real' },
    { n: 'Bank route', label: 'payments must clear Uzbek banks' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Costs are trivial; the decree’s new-build scope is the gate. Tashkent first, regions later.',
  defaultCity: worldCity('≈0.5%', 0.5, 'Tashkent', 'Notary & registration — national'),
  cities: {
    tashkent: worldCity('≈0.5%', 0.5, 'Tashkent', 'Notary & registration — national'),
    samarkand: worldCity('≈0.5%', 0.5, 'Samarkand', 'Notary & registration — national'),
    bukhara: worldCity('≈0.5%', 0.5, 'Bukhara', 'Notary & registration — national'),
  },
}
const kz: CountryCosts = {
  sample: 80000000,
  closer: 'Notary + TsON registration',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Notary & state registration',
  extras: [
    { label: 'Notary (≈0.5%)', pct: 0.5 },
    { label: 'TsON registration (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'No transfer tax as such: the bill is notary plus TsON (Citizen Service Centre) registration, around 1% all-in. Foreigners may buy residential property but not land plots (lease instead). Escrow through a Kazakh bank is the standard settlement path — it is what makes a private sale safe.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases commonly run 12 months with renewal at market.',
    'Registered leases bind the new owner; handshake ones do not.',
  ],
  rentNote:
    'Almaty prices off banking and oil wages; Astana off government tenancy. Both clear through the same TsON.',
  facts: [
    { n: '<1%', label: 'notary + registration, no transfer tax' },
    { n: 'TsON', label: 'the citizen registry that perfects title' },
    { n: 'Escrow', label: 'the standard safe settlement' },
    { n: 'No land', label: 'foreigners lease plots, never own' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national process, two price tiers: Almaty the commercial capital, Astana the administrative one.',
  defaultCity: worldCity('≈1%', 1.0, 'Almaty', 'Notary & state registration — national'),
  cities: {
    almaty: worldCity('≈1%', 1.0, 'Almaty', 'Notary & state registration — national'),
    astana: worldCity('≈1%', 1.0, 'Astana', 'Notary & state registration — national'),
    shymkent: worldCity('≈1%', 1.0, 'Turkistan', 'Notary & state registration — national'),
  },
}
const am: CountryCosts = {
  sample: 120000000,
  closer: 'Notary + Cadastre Committee',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'State duty & notary',
  extras: [
    { label: 'Notary & processing (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'State duty is a token 0.5% (capped low) and notary fees are modest; the real work is the Cadastre Committee’s e-registration, which is fast and clean. Foreigners buy apartments and houses freely — only agricultural land is closed. Armenia ranks among the easiest registries in the region; title insurance is unnecessary.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases run one year minimum by custom, registered at will.',
    'Registration of a lease over one year is required to bind a new owner.',
  ],
  rentNote:
    'Yerevan is the market: IT wages and remittances price the center; Gyumri trades at a third.',
  facts: [
    { n: '0.5%', label: 'token state duty' },
    { n: 'E-cadastre', label: 'fast, clean, online' },
    { n: 'No agri', label: 'the only land closed to foreigners' },
    { n: '1 yr', label: 'lease registration threshold' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate and one dominant city: Yerevan is the market, Gyumri the value tail.',
  defaultCity: worldCity('≈0.5%', 0.5, 'Yerevan', 'State duty & notary — national'),
  cities: {
    yerevan: worldCity('≈0.5%', 0.5, 'Yerevan', 'State duty & notary — national'),
    gyumri: worldCity('≈0.5%', 0.5, 'Shirak', 'State duty & notary — national'),
  },
}
const az: CountryCosts = {
  sample: 350000,
  closer: 'Notary + State Registry',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'State fee & notary',
  extras: [
    { label: 'Notary & processing (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'State registration is 0.5% for individuals; notary rounds out under 1%. Foreigners may buy apartments and other immovables but not land (a presidential decree regime handles rare exceptions). Settlement runs through notary escrow accounts since the 2018 reforms — use them; the notary is the safety.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases commonly run 12 months, registered at the notary.',
    'Notarized leases are enforceable; private contracts are evidence only.',
  ],
  rentNote:
    'Baku is a single-city market: the Old City and White City price off oil; Ganja trails at a fraction.',
  facts: [
    { n: '0.5%', label: 'state fee for individuals' },
    { n: 'Notary escrow', label: 'the settlement safety since 2018' },
    { n: 'No land', label: 'the foreigner rule, decree exceptions aside' },
    { n: '1 yr', label: 'the standard lease' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national fee scale; Baku is effectively the whole market.',
  defaultCity: worldCity('≈0.5%', 0.5, 'Baku', 'State fee & notary — national'),
  cities: {
    baku: worldCity('≈0.5%', 0.5, 'Baku', 'State fee & notary — national'),
    ganja: worldCity('≈0.5%', 0.5, 'Ganja', 'State fee & notary — national'),
    sumqayit: worldCity('≈0.5%', 0.5, 'Sumqayit', 'State fee & notary — national'),
  },
}
const sa: CountryCosts = {
  sample: 1800000,
  closer: 'Notary (Wathiq)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Real estate transfer tax (5%)',
  extras: [
    { label: 'Notary & processing (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'A 5% real-estate transfer tax applies to disposals, with first-home relief below the SAR 1M threshold negotiated into law. Residential (not commercial) disposals between close relatives sit at half rates. Title moves through the Wathiq notarial platform — a digitized, same-week path. Foreign buyers are welcome in most developments except Mecca and Medina.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months, often paid annually in advance.',
    'Standard leases are one year, registered on the Ejar platform to be enforceable.',
    'The Ejar registration number is required for utilities — an unregistered lease is not a lease.',
  ],
  rentNote:
    'Riyadh prices off Vision-2030 jobs; Jeddah off pilgrimage and Red Sea projects; Dammam off energy wages.',
  facts: [
    { n: '5%', label: 'real-estate transfer tax (RET)' },
    { n: 'SAR 1M', label: 'first-home relief threshold' },
    { n: 'Wathiq', label: 'the digital notary platform' },
    { n: 'Ejar', label: 'the lease registry that unlocks utilities' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The RET is national; the relief track is what most Saudi first-home buyers actually pay.',
  defaultCity: worldCity('5%', 5.0, 'Riyadh', 'Real estate transfer tax (5%) — national'),
  cities: {
    riyadh: worldCity('5%', 5.0, 'Riyadh', 'Real estate transfer tax (5%) — national'),
    jeddah: worldCity('5%', 5.0, 'Makkah', 'Real estate transfer tax (5%) — national'),
    dammam: worldCity('5%', 5.0, 'Eastern', 'Real estate transfer tax (5%) — national'),
  },
}
const eg: CountryCosts = {
  sample: 12000000,
  closer: 'Notary Public (Shahr El Aqari)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration (3%)',
  extras: [
    { label: 'Notary & processing (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'The statutory registration fee is 3% of the higher of price or rent-capitalized value; in practice many sales sit on “receipt” registration (0.5%) for years, which saves money and costs enforceability. The 2024 mortgage-law amendments and new capital-gains treatment for unregistered land aim to kill the grey market. Sign at the notary, register properly, and the discount is not worth it.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months, often a full year in advance.',
    'Leases are commonly annual, paid quarterly or upfront.',
    'New Cairo and the North Coast are two markets: one prices in pounds, one in dollars.',
  ],
  rentNote:
    'Cairo’s new cities price off dollar-earning expats; Alexandria off a domestic port economy.',
  facts: [
    { n: '3%', label: 'statutory registration fee' },
    { n: '0.5%', label: 'the grey-market “receipt” alternative' },
    { n: '2024', label: 'mortgage-law amendments targeted the grey market' },
    { n: 'Shahr El Aqari', label: 'the real-estate notary' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One statute, two behaviors: registered (3%) or receipt (0.5% and risky). The new cities price in dollars.',
  defaultCity: worldCity('3%', 3.0, 'Cairo', 'Registration (3%) — national'),
  cities: {
    cairo: worldCity('3%', 3.0, 'Cairo', 'Registration (3%) — national'),
    alexandria: worldCity('3%', 3.0, 'Alexandria', 'Registration (3%) — national'),
    giza: worldCity('3%', 3.0, 'Giza', 'Registration (3%) — national'),
    'sharm-el-sheikh': worldCity('3%', 3.0, 'South Sinai', 'Registration (3%) — national'),
  },
}
const ng: CountryCosts = {
  sample: 150000000,
  closer: 'Governor’s Consent process',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Consent fee + stamp + registration',
  extras: [
    { label: 'Stamp + registration (≈3%)', pct: 3.0 },
    { label: 'Legal (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Lagos: governor’s consent 3% of assessed value, stamp 2%, registration ~1.5% (capped), plus neighborhood charges — the honest all-in is 6–8% and the consent itself can take months. A deed is void without consent: buy only with the consent process started and escrow held. New Certificate-of-Occupancy land in schemes (Lekki, Eko Atlantic) trades cleaner than old family land with customary title.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two years paid in advance — price the time value.',
    'Leases are annual, often with two years upfront demanded.',
    'A tenancy agreement without the landlord’s consent in process is a risk, not a contract.',
  ],
  rentNote:
    'Lagos is the market: Ikoyi and Lekki price off oil and tech; Abuja off government rent; Port Harcourt off energy majors.',
  facts: [
    { n: '3%', label: 'Lagos consent fee alone' },
    { n: '6–8%', label: 'honest all-in Lagos stack' },
    { n: 'Consent', label: 'the deed is void without it' },
    { n: 'C-of-O', label: 'the title class that trades clean' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The Lagos stack is the reference; FCT and states charge similar consent-style fees at their own assessed values.',
  defaultCity: worldCity('≈3%+', 3.0, 'Lagos', 'Consent fee + stamp + registration — national'),
  cities: {
    lagos: worldCity('≈3%+', 3.0, 'Lagos', 'Consent fee + stamp + registration — national'),
    abuja: worldCity('≈3%+', 3.0, 'FCT', 'Consent fee + stamp + registration — national'),
    kano: worldCity('≈3%+', 3.0, 'Kano', 'Consent fee + stamp + registration — national'),
    'port-harcourt': worldCity('≈3%+', 3.0, 'Rivers', 'Consent fee + stamp + registration — national'),
  },
}
const za: CountryCosts = {
  sample: 2500000,
  closer: 'Conveyancer',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer duty (progressive)',
  extras: [
    { label: 'Conveyancer & Deeds Office (≈1.2%)', pct: 1.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Transfer duty is progressive: 0% below R1.1M, then slices to 13% above R12.2M — the same scale for locals and foreigners. Sellers of a second property pay CGT in the income-tax system at inclusion rates up to 40%. A conveyancer (a specialized attorney) runs the Deeds Office registration; there is no sale without one.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run 1.5 to two months.',
    'Leases are commonly 12 months with a calendar-month notice cycle.',
    'The Rental Housing Act caps deposit investment rules — the deposit must sit in an interest-bearing account.',
  ],
  rentNote:
    'Cape Town prices off semigration and dollars; Johannesburg off corporate wages; Durban off the port at a discount.',
  facts: [
    { n: '0–13%', label: 'progressive transfer duty' },
    { n: 'R1.1M', label: 'the 0% threshold' },
    { n: 'Conveyancer', label: 'the attorney the law requires' },
    { n: 'Interest', label: 'must be paid on your deposit' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national scale from a clean deeds registry — the best-titled market on the continent.',
  defaultCity: { chip: '0–13%', chipTitle: 'Transfer duty (progressive) — national bands', region: 'Gauteng', pct: null, bands: [{ upTo: 1100000, pct: 0.0 }, { upTo: 1512500, pct: 2.0 }, { upTo: 2487500, pct: 5.0 }, { upTo: 5182500, pct: 8.0 }, { upTo: 12200000, pct: 11.0 }, { upTo: null, pct: 13.0 }] },
  cities: {
    johannesburg: { chip: '0–13%', chipTitle: 'Transfer duty (progressive) — national bands', region: 'Gauteng', pct: null, bands: [{ upTo: 1100000, pct: 0.0 }, { upTo: 1512500, pct: 2.0 }, { upTo: 2487500, pct: 5.0 }, { upTo: 5182500, pct: 8.0 }, { upTo: 12200000, pct: 11.0 }, { upTo: null, pct: 13.0 }] },
    'cape-town': { chip: '0–13%', chipTitle: 'Transfer duty (progressive) — national bands', region: 'Western Cape', pct: null, bands: [{ upTo: 1100000, pct: 0.0 }, { upTo: 1512500, pct: 2.0 }, { upTo: 2487500, pct: 5.0 }, { upTo: 5182500, pct: 8.0 }, { upTo: 12200000, pct: 11.0 }, { upTo: null, pct: 13.0 }] },
    durban: { chip: '0–13%', chipTitle: 'Transfer duty (progressive) — national bands', region: 'KwaZulu-Natal', pct: null, bands: [{ upTo: 1100000, pct: 0.0 }, { upTo: 1512500, pct: 2.0 }, { upTo: 2487500, pct: 5.0 }, { upTo: 5182500, pct: 8.0 }, { upTo: 12200000, pct: 11.0 }, { upTo: null, pct: 13.0 }] },
    pretoria: { chip: '0–13%', chipTitle: 'Transfer duty (progressive) — national bands', region: 'Gauteng', pct: null, bands: [{ upTo: 1100000, pct: 0.0 }, { upTo: 1512500, pct: 2.0 }, { upTo: 2487500, pct: 5.0 }, { upTo: 5182500, pct: 8.0 }, { upTo: 12200000, pct: 11.0 }, { upTo: null, pct: 13.0 }] },
  },
}
const ke: CountryCosts = {
  sample: 20000000,
  closer: 'Ministry of Lands registry',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty (4% municipal)',
  extras: [
    { label: 'Legal & registration (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty is 4% in municipalities, 2% on rural land. The Ministry of Lands’ Ardhisasa platform digitized searches and transfers — use it, because the paper-era fraud (double titles, ghost parcels) is the market’s real risk. A title search and a physical site visit are non-negotiable.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months.',
    'Leases commonly run 12 months, renewable with an uplift.',
    'Registered leases bind successors; unregistered ones are betting.',
  ],
  rentNote:
    'Nairobi prices off tech and NGO wages; Mombasa off the port and tourism.',
  facts: [
    { n: '4%', label: 'stamp duty in municipalities' },
    { n: '2%', label: 'rural rate' },
    { n: 'Ardhisasa', label: 'the digital registry that killed paper fraud' },
    { n: 'Search', label: 'title search before anything else' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The duty halves outside municipalities; the fraud risk halves only with an Ardhisasa search.',
  defaultCity: worldCity('4%', 4.0, 'Nairobi', 'Stamp duty (4% municipal) — national'),
  cities: {
    nairobi: worldCity('4%', 4.0, 'Nairobi', 'Stamp duty (4% municipal) — national'),
    mombasa: worldCity('4%', 4.0, 'Coast', 'Stamp duty (4% municipal) — national'),
    kisumu: worldCity('4%', 4.0, 'Nyanza', 'Stamp duty (4% municipal) — national'),
  },
}
const ma: CountryCosts = {
  sample: 1200000,
  closer: 'Adoul (notary) + ANCFCC',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration (4%) + land registry',
  extras: [
    { label: 'ANCFCC registry (1%)', pct: 1.0 },
    { label: 'Notary (0.5–1%)', pct: 0.75 },
  ],
  buyerAgentPct: 0,
  note:
    'Registration duty is 4% (2% for social housing), plus 1% for the ANCFCC land registry and 0.5% notary (1% from 2025’s Loi de Finances changes). Foreigners buy freely except agricultural land (needs a decree). The ANCFCC title is strong; “melkia” customary title in medinas converts only through a formal process — buy converted or not at all.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases commonly run 12 months; three years with registration.',
    'Registered leases over three years bind a new owner.',
  ],
  rentNote:
    'Casablanca prices off finance and offshoring; Marrakech off tourism and riads; Tangier off the port and Spain.',
  facts: [
    { n: '4%', label: 'registration duty (2% social)' },
    { n: '1%', label: 'ANCFCC registry fee' },
    { n: 'Melkia', label: 'medina customary title — convert first' },
    { n: 'Decree', label: 'the path for agricultural land' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national scale with a social-housing discount; the title class (titré vs melkia) is the real asset grade.',
  defaultCity: worldCity('4%', 4.0, 'Casablanca-Settat', 'Registration (4%) + land registry — national'),
  cities: {
    casablanca: worldCity('4%', 4.0, 'Casablanca-Settat', 'Registration (4%) + land registry — national'),
    marrakech: worldCity('4%', 4.0, 'Marrakech-Safi', 'Registration (4%) + land registry — national'),
    rabat: worldCity('4%', 4.0, 'Rabat-Salé', 'Registration (4%) + land registry — national'),
    tangier: worldCity('4%', 4.0, 'Tanger-Tétouan', 'Registration (4%) + land registry — national'),
  },
}
const au: CountryCosts = {
  sample: 1000000,
  closer: 'Conveyancer / solicitor',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty (state) + surcharge',
  extras: [
    { label: 'Conveyancer & disbursements (≈0.6%)', pct: 0.6 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty is state law — Sydney and Melbourne run 4–5.5% scaled; the table models NSW bands. Foreign buyers add a surcharge stamp duty of 7–8% in NSW/Victoria on top and need FIRB approval before bidding, with a fee scaled to price. First-home buyers get concessions in every state, and the ACT rolls duty into rates.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run four to six weeks’ rent as bond, held by a state bond authority.',
    'Standard leases are 12 months, then periodic.',
    'Rent increases are capped in frequency (12 months in most states), not amount.',
  ],
  rentNote:
    'Sydney prices off harbor scarcity; Melbourne off the world’s biggest suburban footprint; Perth off mining cycles.',
  facts: [
    { n: '4–5.5%', label: 'state stamp duty, scaled' },
    { n: '8%', label: 'NSW foreign surcharge' },
    { n: 'FIRB', label: 'federal approval before bidding' },
    { n: 'Bond authority', label: 'holds your deposit, not the landlord' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Duty is state law — every metro here sets its own scale and its own first-home concession.',
  defaultCity: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'NSW', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
  cities: {
    sydney: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'NSW', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
    melbourne: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'Victoria', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
    brisbane: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'Queensland', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
    perth: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'WA', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
    adelaide: { chip: '≈4–5%', chipTitle: 'Stamp duty (state) + surcharge — national bands', region: 'SA', pct: null, bands: [{ upTo: 17000, pct: 1.25 }, { upTo: 37000, pct: 1.5 }, { upTo: 99000, pct: 3.5 }, { upTo: 372000, pct: 4.5 }, { upTo: 1240000, pct: 5.5 }, { upTo: null, pct: 7.0 }], surchargePct: 8, surchargeLabel: 'foreign purchaser surcharge (NSW)' },
  },
}
const nz: CountryCosts = {
  sample: 900000,
  closer: 'Lawyer / conveyancer',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer duty — none',
  extras: [
    { label: 'Lawyer & LIM/title checks (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'New Zealand charges no transfer duty at all — the closing costs are lawyer (≈0.5%), LIM and title checks. The gate for foreigners is the Overseas Investment Act: residential land needs consent unless you are a citizen, resident, or Australian/Singaporean. Bright-line (capital gains on resale) tapered to two years from July 2024.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to four weeks as bond, held by Tenancy Services.',
    'Standard leases are 12 months, then periodic with 63-day notice.',
    'Healthy Homes standards are mandatory — a non-compliant rental is a discount, not a deal.',
  ],
  rentNote:
    'Auckland prices off a harbor and immigration; Christchurch off the rebuild stock; Wellington off government wages.',
  facts: [
    { n: '0%', label: 'no transfer duty' },
    { n: 'Consent', label: 'Overseas Investment Act for non-residents' },
    { n: '2 yr', label: 'bright-line from July 2024' },
    { n: 'Bond', label: 'held by Tenancy Services, not the landlord' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'No duty, anywhere: the lawyer’s bill is the tax bill. The foreign gate is consent, not cost.',
  defaultCity: worldCity('0%', 0.0, 'Auckland', 'Transfer duty — none — national'),
  cities: {
    auckland: worldCity('0%', 0.0, 'Auckland', 'Transfer duty — none — national'),
    wellington: worldCity('0%', 0.0, 'Wellington', 'Transfer duty — none — national'),
    christchurch: worldCity('0%', 0.0, 'Canterbury', 'Transfer duty — none — national'),
  },
}
const br: CountryCosts = {
  sample: 900000,
  closer: 'Cartório de Registro de Imóveis',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'ITBI (municipal, 2–3%)',
  extras: [
    { label: 'Registry & notary (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'ITBI runs 2–3% by municipality (3% in São Paulo) plus ≈1% registration and notary fees. Foreigners buy urban property freely; rural land needs alignment with size/usage rules. The matrícula (property’s registry file) is the title — your lawyer reads the chain of averbações (endorsements) for liens and marriage claims.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months (caução), often the fifteenth rent.',
    'Leases run 30 months (residential) to avoid reversion-to-locator rules.',
    'The fiador (guarantor) system is fading — seguro-fiança (rental insurance) is the modern path.',
  ],
  rentNote:
    'São Paulo and Rio price off finance-city wages; Curitiba and Belo Horizonte follow at a discount.',
  facts: [
    { n: '2–3%', label: 'ITBI by municipality' },
    { n: '3%', label: 'São Paulo’s rate' },
    { n: 'Matrícula', label: 'the registry file that IS the title' },
    { n: '30 mo', label: 'the residential lease pattern' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'ITBI is municipal: every metro sets its own rate on the municipal assessed value (venal), which can trail price.',
  defaultCity: worldCity('2–3%', 2.5, 'São Paulo', 'ITBI (municipal, 2–3%) — national'),
  cities: {
    'sao-paulo': worldCity('2–3%', 2.5, 'São Paulo', 'ITBI (municipal, 2–3%) — national'),
    'rio-de-janeiro': worldCity('2–3%', 2.5, 'Rio de Janeiro', 'ITBI (municipal, 2–3%) — national'),
    brasilia: worldCity('2–3%', 2.5, 'Federal District', 'ITBI (municipal, 2–3%) — national'),
    curitiba: worldCity('2–3%', 2.5, 'Paraná', 'ITBI (municipal, 2–3%) — national'),
    'belo-horizonte': worldCity('2–3%', 2.5, 'Minas Gerais', 'ITBI (municipal, 2–3%) — national'),
  },
}
const mx: CountryCosts = {
  sample: 5000000,
  closer: 'Notario Público',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Acquisition tax (2–4.5% by state)',
  extras: [
    { label: 'Notario fees (≈1%)', pct: 1.0 },
    { label: 'Fideicomiso setup in the restricted zone', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Acquisition tax runs ~2–4.5% by state (CDMX tops at 4.5% scaled, with 2025 relief debates ongoing). The restricted zone — 50km of coast, 100km of border — closes direct foreign ownership of land; the fideicomiso (50-year renewable bank trust) is the lawful path, costing setup plus annual bank fees. The notario is a public lawyer, not a scrivener: they certify title.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month, held against the lease.',
    'Standard leases are 12 months, renewable.',
    'Cancún and Playa del Carmen rent off tourism in dollars; the capital leases in pesos.',
  ],
  rentNote:
    'CDMX and Monterrey price off the corporate economy; the Riviera Maya is a dollar market with a bank-trust structure.',
  facts: [
    { n: '2–4.5%', label: 'acquisition tax by state' },
    { n: '50 km', label: 'coastal restricted zone for foreigners' },
    { n: 'Fideicomiso', label: 'the bank trust for the zone' },
    { n: 'Notario', label: 'a public lawyer certifying title' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The tax is state; the structure is federal: inside the zone you buy a trust, outside it a deed.',
  defaultCity: worldCity('2–4.5%', 3.0, 'CDMX', 'Acquisition tax (2–4.5% by state) — national'),
  cities: {
    'mexico-city': worldCity('2–4.5%', 3.0, 'CDMX', 'Acquisition tax (2–4.5% by state) — national'),
    guadalajara: worldCity('2–4.5%', 3.0, 'Jalisco', 'Acquisition tax (2–4.5% by state) — national'),
    monterrey: worldCity('2–4.5%', 3.0, 'Nuevo León', 'Acquisition tax (2–4.5% by state) — national'),
    cancun: worldCity('2–4.5%', 3.0, 'Quintana Roo', 'Acquisition tax (2–4.5% by state) — national'),
    'playa-del-carmen': worldCity('2–4.5%', 3.0, 'Quintana Roo', 'Acquisition tax (2–4.5% by state) — national'),
  },
}
const co: CountryCosts = {
  sample: 600000000,
  closer: 'Notaría + Oficina de Registro',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registry + notary (≈1.4%)',
  extras: [
    { label: 'Legal & due diligence (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Colombia has no transfer tax: notary fees (scaled to price) and registry ≈1.4% all-in on resales; new builds add IVA at 19% on the first 350 UVT of value. The certificado de tradición y libertad (certificate of tradition) is the title chain — your lawyer reads its liens before any deposit. The dollar rents of El Poblado quote in dollars but close in pesos.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months, often the last not the first.',
    'Leases commonly run 12 months, renewable with CPI uplift.',
    'Canon (rent) increases are contractual; regulated leases exist only for legacy contracts.',
  ],
  rentNote:
    'Bogotá prices off government and finance; Medellín off tourism and remittances; Cartagena off a walled-city premium.',
  facts: [
    { n: '≈1.4%', label: 'notary + registry on resales' },
    { n: '19%', label: 'IVA on new builds (first 350 UVT)' },
    { n: 'Tradición y libertad', label: 'the title certificate you read first' },
    { n: 'Pesos', label: 'close in pesos, whatever the advert says' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'No transfer tax — the certificate of tradition and the notary bill are the whole closing.',
  defaultCity: worldCity('≈1.4%', 1.4, 'Cundinamarca', 'Registry + notary (≈1.4%) — national'),
  cities: {
    bogota: worldCity('≈1.4%', 1.4, 'Cundinamarca', 'Registry + notary (≈1.4%) — national'),
    medellin: worldCity('≈1.4%', 1.4, 'Antioquia', 'Registry + notary (≈1.4%) — national'),
    cali: worldCity('≈1.4%', 1.4, 'Valle del Cauca', 'Registry + notary (≈1.4%) — national'),
    cartagena: worldCity('≈1.4%', 1.4, 'Bolívar', 'Registry + notary (≈1.4%) — national'),
    barranquilla: worldCity('≈1.4%', 1.4, 'Atlántico', 'Registry + notary (≈1.4%) — national'),
  },
}
const cl: CountryCosts = {
  sample: 300000000,
  closer: 'Notaría + Conservador de Bienes Raíces',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration & notary (≈1.2%)',
  extras: [
    { label: 'Legal & processing (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'Chile closes cheap: notary, Conservador registration and the stamp on the deed run ≈1.2% total. There is no transfer tax for the buyer. The Conservador’s registry is digital and fast. Foreigners buy freely; only border-adjacent land needs scrutiny. New builds add IVA only on the land share.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month (garantía), returned after inspection.',
    'Leases run 12 months, renewable by law on the same terms unless the owner needs the unit.',
    'The ley de arriendos lets tenants renew annually — price the first rent accordingly.',
  ],
  rentNote:
    'Santiago absorbs the corporate economy; Valparaíso and Viña trade heritage and ocean; Concepción prices off industry.',
  facts: [
    { n: '≈1.2%', label: 'the entire closing stack' },
    { n: 'Conservador', label: 'the digital deeds registry' },
    { n: 'Renewal', label: 'tenants may renew annually by statute' },
    { n: 'No tax', label: 'no buyer transfer tax exists' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national process, one price: the Conservador’s fee scale barely varies with the postcode.',
  defaultCity: worldCity('≈1.2%', 1.2, 'Región Metropolitana', 'Registration & notary (≈1.2%) — national'),
  cities: {
    santiago: worldCity('≈1.2%', 1.2, 'Región Metropolitana', 'Registration & notary (≈1.2%) — national'),
    valparaiso: worldCity('≈1.2%', 1.2, 'Valparaíso', 'Registration & notary (≈1.2%) — national'),
    'vina-del-mar': worldCity('≈1.2%', 1.2, 'Valparaíso', 'Registration & notary (≈1.2%) — national'),
    concepcion: worldCity('≈1.2%', 1.2, 'Biobío', 'Registration & notary (≈1.2%) — national'),
  },
}
const ar: CountryCosts = {
  sample: 120000000,
  closer: 'Escribano',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'ITI (2.57% CABA)',
  extras: [
    { label: 'Escribano fees (≈1.2%)', pct: 1.2 },
  ],
  buyerAgentPct: 0,
  note:
    'The Impuesto de Transferencia de Inmuebles is 2.57% in CABA (buyer-side as “sellos” varies by province — 3–4% in the provinces, CABA suspended sellos through 2025 for single homes). The escribano (notary) is central: they certify funds origin under AFIP rules — the blanco/fiscal gap is the market’s real variable. Title closes same-day at the escribano’s office with a certified cheque.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month plus a guarantee (garantía propietaria) from a third party.',
    'Leases run 24 or 36 months by law, with annual ICL uplift.',
    'The garantía (property-owning guarantor) is the market’s credit score — no garantía, no flat.',
  ],
  rentNote:
    'Buenos Aires prices off a dollar habit; Córdoba and Rosario price off the peso economy.',
  facts: [
    { n: '2.57%', label: 'ITI in CABA' },
    { n: 'Escribano', label: 'certifies origin of funds' },
    { n: '36 mo', label: 'the standard lease term' },
    { n: 'Garantía', label: 'a guarantor’s property as credit' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Sellos (stamp) is provincial and waived in CABA for single homes — the provinces still charge 3–4%.',
  defaultCity: worldCity('≈2.6%', 2.6, 'CABA', 'ITI (2.57% CABA) — national'),
  cities: {
    'buenos-aires': worldCity('≈2.6%', 2.6, 'CABA', 'ITI (2.57% CABA) — national'),
    cordoba: worldCity('≈2.6%', 2.6, 'Córdoba', 'ITI (2.57% CABA) — national'),
    rosario: worldCity('≈2.6%', 2.6, 'Santa Fe', 'ITI (2.57% CABA) — national'),
    mendoza: worldCity('≈2.6%', 2.6, 'Mendoza', 'ITI (2.57% CABA) — national'),
  },
}
const pe: CountryCosts = {
  sample: 600000,
  closer: 'Notary + SUNARP',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Alcabala (3% municipal)',
  extras: [
    { label: 'Notary & SUNARP (≈1.1%)', pct: 1.1 },
  ],
  buyerAgentPct: 0,
  note:
    'Alcabala is 3% of price or self-assessed value (whichever higher), with the first 10 UIT exempt. Registration at SUNARP and notary fees add ≈1.1%. Foreigners buy freely. The SUNARP partida (registry entry) is the title; formalization gaps in older districts mean the registry, not the deed, is the truth.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases commonly run 12 months, renewable.',
    'Registered leases bind a buyer of the building — unregistered ones do not.',
  ],
  rentNote:
    'Lima prices off a finance and NGO economy; Arequipa and Cusco price off regional commerce and tourism.',
  facts: [
    { n: '3%', label: 'alcabala, first 10 UIT free' },
    { n: 'SUNARP', label: 'the registry that is the title' },
    { n: 'UIT', label: 'the indexed unit exempt from alcabala' },
    { n: 'Partida', label: 'the registry entry you inspect first' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Alcabala is municipal but the rate is national; the exemption floor moves with the UIT index.',
  defaultCity: worldCity('3%', 3.0, 'Lima', 'Alcabala (3% municipal) — national'),
  cities: {
    lima: worldCity('3%', 3.0, 'Lima', 'Alcabala (3% municipal) — national'),
    arequipa: worldCity('3%', 3.0, 'Arequipa', 'Alcabala (3% municipal) — national'),
    cusco: worldCity('3%', 3.0, 'Cusco', 'Alcabala (3% municipal) — national'),
    trujillo: worldCity('3%', 3.0, 'La Libertad', 'Alcabala (3% municipal) — national'),
  },
}
const ec: CountryCosts = {
  sample: 120000,
  closer: 'Notary + Registro de la Propiedad',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Municipal transfer (≈0.5%) + registry',
  extras: [
    { label: 'Notary & registry (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Ecuador closes cheap: municipal transfer tax 0.5% plus registry and notary under 1% all-in. Dollarized since 2000, contracts quote in USD natively. Foreigners buy freely. The Registro de la Propiedad chain is the title; Quito’s historic-center properties carry heritage restrictions that bind renovations.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases commonly run 12 months, renewable with uplift.',
    'Registered leases survive a sale; verbal ones do not.',
  ],
  rentNote:
    'Quito prices off government and remittances; Guayaquil off the port; Cuenca off North American retirees.',
  facts: [
    { n: '0.5%', label: 'municipal transfer tax' },
    { n: 'USD', label: 'the native contract currency' },
    { n: 'Heritage', label: 'Quito center carries renovation limits' },
    { n: 'Registro', label: 'the property registry is the title' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One cheap national bundle and one currency: the dollar is not an option here, it is the unit.',
  defaultCity: worldCity('≈1%', 1.0, 'Pichincha', 'Municipal transfer (≈0.5%) + registry — national'),
  cities: {
    quito: worldCity('≈1%', 1.0, 'Pichincha', 'Municipal transfer (≈0.5%) + registry — national'),
    guayaquil: worldCity('≈1%', 1.0, 'Guayas', 'Municipal transfer (≈0.5%) + registry — national'),
    cuenca: worldCity('≈1%', 1.0, 'Azuay', 'Municipal transfer (≈0.5%) + registry — national'),
  },
}
const pl: CountryCosts = {
  sample: 800000,
  closer: 'Notariusz',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'PCC (2% civil transaction tax)',
  extras: [
    { label: 'Notariusz & court fees (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'PCC is 2% on the price or market value (whichever higher), exempt on the primary market where the developer charged VAT. The notariusz drafts the akt notarialny — the only form that transfers real estate. Foreigners from the EEA buy freely; others need Ministry of Interior permit only for certain plots (the 2024 Polish diaspora rules eased most cases).',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months, held often as “kaucja” in a deposit account.',
    'Leases commonly run 12 months with a 3-month notice.',
    'The najem okazjonalny (occasional lease) adds tenant-termination power for landlords — know which contract you sign.',
  ],
  rentNote:
    'Warsaw prices off finance and IT; Kraków off tourism and students; Tricity off the Baltic boom.',
  facts: [
    { n: '2%', label: 'PCC on resales, 0% on VAT primary' },
    { n: 'Akt notarialny', label: 'the notarial deed that transfers title' },
    { n: 'EEA free', label: 'permits only for non-EEA plots' },
    { n: 'Kaucja', label: 'the deposit, one to three months' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'PCC is national and flat; the primary market sidesteps it entirely because VAT already applied.',
  defaultCity: worldCity('2%', 2.0, 'Masovia', 'PCC (2% civil transaction tax) — national'),
  cities: {
    warsaw: worldCity('2%', 2.0, 'Masovia', 'PCC (2% civil transaction tax) — national'),
    krakow: worldCity('2%', 2.0, 'Lesser Poland', 'PCC (2% civil transaction tax) — national'),
    wroclaw: worldCity('2%', 2.0, 'Lower Silesia', 'PCC (2% civil transaction tax) — national'),
    poznan: worldCity('2%', 2.0, 'Greater Poland', 'PCC (2% civil transaction tax) — national'),
    gdansk: worldCity('2%', 2.0, 'Pomerania', 'PCC (2% civil transaction tax) — national'),
  },
}
const cz: CountryCosts = {
  sample: 8000000,
  closer: 'Notář + katastr nemovitostí',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax — abolished',
  extras: [
    { label: 'Notář & katastr (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'The 4% real-estate transfer tax was abolished for acquisitions effective April 2025 — the seller-paid era is over. What remains is notary plus katastr (cadastre) registration, well under 0.5%. The katastr’s entry is the title; the purchase contract needs notarization of signatures only.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months, often two.',
    'Leases commonly run 12 months with a 3-month notice period.',
    'Fixed-term leases end automatically — a Czech tenancy renews only if both sides agree.',
  ],
  rentNote:
    'Prague prices off tourism and tech wages; Brno off engineering; the spa towns off German retirees.',
  facts: [
    { n: '0%', label: 'transfer tax abolished 2025' },
    { n: 'Katastr', label: 'the cadastre entry is the title' },
    { n: 'Auto-end', label: 'fixed-term leases do not renew silently' },
    { n: '<0.5%', label: 'the real closing stack' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national cadastre and, since 2025, no transfer tax: the notary bill is the closing cost.',
  defaultCity: worldCity('0%', 0.0, 'Prague', 'Transfer tax — abolished — national'),
  cities: {
    prague: worldCity('0%', 0.0, 'Prague', 'Transfer tax — abolished — national'),
    brno: worldCity('0%', 0.0, 'South Moravia', 'Transfer tax — abolished — national'),
    ostrava: worldCity('0%', 0.0, 'Moravia-Silesia', 'Transfer tax — abolished — national'),
    plzen: worldCity('0%', 0.0, 'Plzeň', 'Transfer tax — abolished — national'),
  },
}
const hu: CountryCosts = {
  sample: 60000000,
  closer: 'Ügyvéd (attorney)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer duty (általános forgalmi adó)',
  extras: [
    { label: 'Ügyvéd & land registry (≈0.6%)', pct: 0.6 },
  ],
  buyerAgentPct: 0,
  note:
    'Hungary cut property transfer duty from 4% to 2% for 2025 onward. New builds from VAT-charging developers stay exempt. The ügyvéd drafts and countersigns the contract — Hungarian law requires attorney involvement for real estate. First-time buyers under 35 get a duty exemption up to HUF 15M.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months (kaució).',
    'Leases commonly run 12 months, fixed-term, with notice inside.',
    'Fixed-term ends on the date — Hungarian leases do not roll to indefinite automatically.',
  ],
  rentNote:
    'Budapest prices off a returning finance sector and Danube districts; Debrecen and Szeged are university markets.',
  facts: [
    { n: '2%', label: 'duty, cut from 4% for 2025' },
    { n: 'HUF 15M', label: 'the under-35 first-buyer exemption' },
    { n: 'Ügyvéd', label: 'the attorney the law requires' },
    { n: 'VAT', label: 'new-build path skips duty' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The 2% duty is national; the new-build VAT path and the under-35 exemption are where most buyers land.',
  defaultCity: worldCity('2%', 2.0, 'Budapest', 'Transfer duty (általános forgalmi adó) — national'),
  cities: {
    budapest: worldCity('2%', 2.0, 'Budapest', 'Transfer duty (általános forgalmi adó) — national'),
    debrecen: worldCity('2%', 2.0, 'Hajdú-Bihar', 'Transfer duty (általános forgalmi adó) — national'),
    szeged: worldCity('2%', 2.0, 'Csongrád-Csanád', 'Transfer duty (általános forgalmi adó) — national'),
    pecs: worldCity('2%', 2.0, 'Baranya', 'Transfer duty (általános forgalmi adó) — national'),
  },
}
const ro: CountryCosts = {
  sample: 400000,
  closer: 'Notar public + ANCPI',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Notary fee (scaled)',
  extras: [
    { label: 'ANCPI registration (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Romania has no transfer tax; the notary fee scales with price (capped) and ANCPI registration is token. New builds from VAT developers add the VAT component. The notarized deed is mandatory — private contracts do not transfer title. Foreigners (non-EEA) need a permit, granted routinely for apartments.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (gaj).',
    'Leases commonly run 12 months, notarized for enforcement.',
    'A notarized lease binds the buyer of the building — the notary is the registry of tenancies too.',
  ],
  rentNote:
    'Bucharest prices off IT wages and the largest office stock in the region; Cluj off tech; Brașov off tourism.',
  facts: [
    { n: '≈0.5–1%', label: 'notary scale, no transfer tax' },
    { n: 'ANCPI', label: 'the national cadastre' },
    { n: 'Notarized', label: 'deeds only — private paper does not transfer' },
    { n: 'EEA-free', label: 'permits only for non-EEA buyers' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'No tax, one national cadastre: the notary’s scale is the only variable between cities.',
  defaultCity: worldCity('≈0.5–1%', 0.75, 'Bucharest', 'Notary fee (scaled) — national'),
  cities: {
    bucharest: worldCity('≈0.5–1%', 0.75, 'Bucharest', 'Notary fee (scaled) — national'),
    'cluj-napoca': worldCity('≈0.5–1%', 0.75, 'Cluj', 'Notary fee (scaled) — national'),
    timisoara: worldCity('≈0.5–1%', 0.75, 'Timiș', 'Notary fee (scaled) — national'),
    iasi: worldCity('≈0.5–1%', 0.75, 'Iași', 'Notary fee (scaled) — national'),
    brasov: worldCity('≈0.5–1%', 0.75, 'Brașov', 'Notary fee (scaled) — national'),
  },
}
const bg: CountryCosts = {
  sample: 300000,
  closer: 'Notary + Property Register (RAP)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Municipal transfer tax (3%)',
  extras: [
    { label: 'Notary & register (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'A 3% municipal transfer tax on the higher of price or tax value, plus notary (scaled, ≈0.5–1%) and BULSTRAD-style entry fees at the Property Register. Foreigners (EEA and most non-EEA with reciprocity) buy apartments and buildings; land needs a Bulgarian company — a formality routinely used and routinely advised against for small deals.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month (depozit).',
    'Leases commonly run 12 months, registered for enforcement.',
    'Registered leases bind the new owner — Bulgarian tenancies hinge on the register, not possession.',
  ],
  rentNote:
    'Sofia prices off IT and government; Varna and Burgas are Black Sea resort markets with seasonal pricing.',
  facts: [
    { n: '3%', label: 'municipal transfer tax' },
    { n: 'Notary', label: 'scaled fee on the deed' },
    { n: 'Company route', label: 'the foreign path to land' },
    { n: 'Register', label: 'the Property Register entry is title' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The 3% is municipal but every municipality charges it; resort cities add seasonality, not tax.',
  defaultCity: worldCity('3%', 3.0, 'Sofia-Grad', 'Municipal transfer tax (3%) — national'),
  cities: {
    sofia: worldCity('3%', 3.0, 'Sofia-Grad', 'Municipal transfer tax (3%) — national'),
    plovdiv: worldCity('3%', 3.0, 'Plovdiv', 'Municipal transfer tax (3%) — national'),
    varna: worldCity('3%', 3.0, 'Varna', 'Municipal transfer tax (3%) — national'),
    burgas: worldCity('3%', 3.0, 'Burgas', 'Municipal transfer tax (3%) — national'),
  },
}
const rs: CountryCosts = {
  sample: 250000,
  closer: 'Notary + cadastre',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax (2.5%)',
  extras: [
    { label: 'Notary & cadastre (≈0.7%)', pct: 0.7 },
  ],
  buyerAgentPct: 0,
  note:
    'A 2.5% transfer tax on the higher of price or fiscal value; VAT-new builds skip it. The notarization reform made every real-estate deed pass a notary — signatures and the chain are certified. Foreigners need reciprocity or the buyer-of-apartment exception (land needs approval, granted routinely for EU citizens).',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (kaucija).',
    'Leases commonly run 12 months with registered status.',
    'Registered leases bind a new owner; the cadastre, not the paper, decides.',
  ],
  rentNote:
    'Belgrade prices off a rezoned riverfront and diaspora money; Novi Sad off the tech corridor to Hungary.',
  facts: [
    { n: '2.5%', label: 'transfer tax on fiscal value' },
    { n: 'Notary', label: 'the reform made deeds notarial' },
    { n: 'VAT path', label: 'new builds skip the tax' },
    { n: 'Cadastre', label: 'the registry that decides' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate; the fiscal value (what the tax office thinks) often exceeds the price you agreed — negotiate on the right base.',
  defaultCity: worldCity('2.5%', 2.5, 'Belgrade', 'Transfer tax (2.5%) — national'),
  cities: {
    belgrade: worldCity('2.5%', 2.5, 'Belgrade', 'Transfer tax (2.5%) — national'),
    'novi-sad': worldCity('2.5%', 2.5, 'Vojvodina', 'Transfer tax (2.5%) — national'),
    nis: worldCity('2.5%', 2.5, 'Niš', 'Transfer tax (2.5%) — national'),
  },
}
const hr: CountryCosts = {
  sample: 300000,
  closer: 'Notary + land registry (gruntovnica)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax (3%)',
  extras: [
    { label: 'Notary & registry (≈0.8%)', pct: 0.8 },
  ],
  buyerAgentPct: 0,
  note:
    'A 3% real-estate transfer tax on the contract price (market-value floors apply); VAT-new builds skip it. Croatia’s dual system —gruntovnica (land registry) and the newer cadastre — still produces the occasional mismatch: your lawyer clears both. EU citizens buy freely; non-EU need reciprocity.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month (kaucija).',
    'Leases commonly run 12 months, registered for enforcement.',
    'Tourism-zone leases carry seasonal terms — year-round contracts trade rent for security.',
  ],
  rentNote:
    'Zagreb prices off the capital economy; Split and Zadar price off the Adriatic season in euros.',
  facts: [
    { n: '3%', label: 'transfer tax, VAT builds skip' },
    { n: 'Gruntovnica', label: 'the land registry to clear' },
    { n: 'Dual system', label: 'registry AND cadastre must match' },
    { n: 'EUR', label: 'the euro since 2023' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One rate nationwide; the coast prices in euros against a tourist season, the capital against wages.',
  defaultCity: worldCity('3%', 3.0, 'Zagreb', 'Transfer tax (3%) — national'),
  cities: {
    zagreb: worldCity('3%', 3.0, 'Zagreb', 'Transfer tax (3%) — national'),
    split: worldCity('3%', 3.0, 'Split-Dalmatia', 'Transfer tax (3%) — national'),
    rijeka: worldCity('3%', 3.0, 'Primorje-Gorski Kotar', 'Transfer tax (3%) — national'),
    zadar: worldCity('3%', 3.0, 'Zadar', 'Transfer tax (3%) — national'),
  },
}
const ua: CountryCosts = {
  sample: 3000000,
  closer: 'Notary + Register of Property Rights',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Notary fee + 1% pension (exempt resales)',
  extras: [
    { label: 'Legal & due diligence (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Wartime caveat first: martial law changes procedures (notaries by power of attorney, curfews, relocation). Pre-war norms: notary ≈1%, and a 1% pension-fund contribution the seller owes on first sales — the table prices the buyer side. Title registers in the State Register of Property Rights; the “technical inventory” legacy system still muddies older flats. Do not close without a fresh register extract.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (zabezpechennia).',
    'Leases commonly run 12 months, notarized at will.',
    'Martial-law eviction rules protect certain categories — verify tenant status before taking a building.',
  ],
  rentNote:
    'Kyiv prices off a wartime economy that kept paying; Lviv off relocation; Odesa off the port at a discount.',
  facts: [
    { n: '≈1–2%', label: 'buyer-side closing, pre-war norms' },
    { n: 'Martial law', label: 'procedures move — verify fresh' },
    { n: 'Register extract', label: 'the only title truth' },
    { n: '1%', label: 'seller’s pension levy on first sales' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'The statute is national; the practice is wartime. A fresh register extract outranks every document the seller shows.',
  defaultCity: worldCity('≈1–2%', 1.5, 'Kyiv', 'Notary fee + 1% pension (exempt resales) — national'),
  cities: {
    kyiv: worldCity('≈1–2%', 1.5, 'Kyiv', 'Notary fee + 1% pension (exempt resales) — national'),
    kharkiv: worldCity('≈1–2%', 1.5, 'Kharkiv', 'Notary fee + 1% pension (exempt resales) — national'),
    odesa: worldCity('≈1–2%', 1.5, 'Odesa', 'Notary fee + 1% pension (exempt resales) — national'),
    lviv: worldCity('≈1–2%', 1.5, 'Lviv', 'Notary fee + 1% pension (exempt resales) — national'),
    dnipro: worldCity('≈1–2%', 1.5, 'Dnipropetrovsk', 'Notary fee + 1% pension (exempt resales) — national'),
  },
}
const se: CountryCosts = {
  sample: 4500000,
  closer: 'Fastighetsmäklare + bank',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty (lagfart, 1.5%)',
  extras: [
    { label: 'Mäklare is seller-paid', pct: 0.0 },
    { label: 'Bank & registration fees (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Lagfort — the title registration — costs 1.5% of price (1.5% apartments, 4.25% for organizations) plus a small fee. Agents (mäklare) are seller-paid and licensed. The purchase contract at the mäklare’s office binds; closing runs through the bank weeks later. First-home savers use ISK accounts; there is no transfer-tax relief.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months (deposition).',
    'Leases commonly run open-ended (tillsvidare) with 3-month notice.',
    'Second-hand rentals (andrahandsuthyrning) need the landlord’s written consent — the queue system governs first-hand.',
  ],
  rentNote:
    'Stockholm prices off HQ wages and an island topology; Gothenburg and Malmö follow at a discount.',
  facts: [
    { n: '1.5%', label: 'lagfort stamp duty' },
    { n: 'Tillsvidare', label: 'open-ended leases are the norm' },
    { n: '3 mo', label: 'standard notice' },
    { n: 'Queue', label: 'Stockholm’s first-hand rental years-long line' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate and one legendary rental queue: owning in Stockholm is easier than renting in it.',
  defaultCity: worldCity('1.5%', 1.5, 'Stockholm', 'Stamp duty (lagfart, 1.5%) — national'),
  cities: {
    stockholm: worldCity('1.5%', 1.5, 'Stockholm', 'Stamp duty (lagfart, 1.5%) — national'),
    goteborg: worldCity('1.5%', 1.5, 'Västra Götaland', 'Stamp duty (lagfart, 1.5%) — national'),
    malmo: worldCity('1.5%', 1.5, 'Skåne', 'Stamp duty (lagfart, 1.5%) — national'),
  },
}
const no: CountryCosts = {
  sample: 5000000,
  closer: 'Eiendomsmegler + bank',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Document tax (dokumentavgift, 2.5%)',
  extras: [
    { label: 'Bank & registration (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Dokumentavgift is 2.5% on the deed. Agents (eiendomsmegler) are seller-paid, licensed, and run the closing through their client account — Norwegian closings are fast and fraud-free. Foreigners buy freely. Borettslag (cooperative shares) skip the document tax but carry the same economics with a board approval instead of a title.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months (depositum in escrow).',
    'Leases commonly run 12 months, then 3-month notice.',
    'Husleiereguleringa (the 2020 rent act) caps increases to CPI in the first three years.',
  ],
  rentNote:
    'Oslo prices off oil-fund wages; Bergen and Trondheim follow at university-city prices.',
  facts: [
    { n: '2.5%', label: 'document tax on the deed' },
    { n: 'Escrow', label: 'agent client accounts close the risk' },
    { n: 'CPI cap', label: 'rent increases in the first 3 years' },
    { n: 'Borettslag', label: 'cooperative shares, board approval' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate; cooperatives sidestep it at the cost of a board’s yes instead of a registry’s stamp.',
  defaultCity: worldCity('2.5%', 2.5, 'Oslo', 'Document tax (dokumentavgift, 2.5%) — national'),
  cities: {
    oslo: worldCity('2.5%', 2.5, 'Oslo', 'Document tax (dokumentavgift, 2.5%) — national'),
    bergen: worldCity('2.5%', 2.5, 'Vestland', 'Document tax (dokumentavgift, 2.5%) — national'),
    trondheim: worldCity('2.5%', 2.5, 'Trøndelag', 'Document tax (dokumentavgift, 2.5%) — national'),
    stavanger: worldCity('2.5%', 2.5, 'Rogaland', 'Document tax (dokumentavgift, 2.5%) — national'),
  },
}
const dk: CountryCosts = {
  sample: 4000000,
  closer: 'Advokat/agent + Tingbogen',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Deed fee (tingbogsafgift, 0.6%)',
  extras: [
    { label: 'Buyer agent/lawyer (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'Denmark cut the deed registration fee to 0.6% in 2024 (mortgages the same 0.6%). Buyers pay their own agent or lawyer — seller pays theirs. The tingbogen (land register) is digital and same-day. Foreigners need police permission to buy except EU workers and summer houses in designated zones for non-residents.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases commonly run 12 months with 3-month notice (indskud, capped at 3 months’ rent, in a bank).',
    'Rent regulation splits regulated/liberalized by construction year — the split decides everything.',
  ],
  rentNote:
    'Copenhagen prices off pharma and finance; Aarhus off students; the co-op (andelsbolig) market runs on waiting lists.',
  facts: [
    { n: '0.6%', label: 'deed fee, cut in 2024' },
    { n: 'Indskud', label: 'deposit capped, bank-held' },
    { n: 'Regulated', label: 'pre-1992 stock has rent caps' },
    { n: 'Andelsbolig', label: 'the co-op with a waiting list' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate, one digital registry; the co-op sector is where the queue, not the price, allocates homes.',
  defaultCity: worldCity('0.6%', 0.6, 'Capital Region', 'Deed fee (tingbogsafgift, 0.6%) — national'),
  cities: {
    copenhagen: worldCity('0.6%', 0.6, 'Capital Region', 'Deed fee (tingbogsafgift, 0.6%) — national'),
    aarhus: worldCity('0.6%', 0.6, 'Central Jutland', 'Deed fee (tingbogsafgift, 0.6%) — national'),
    odense: worldCity('0.6%', 0.6, 'Southern Denmark', 'Deed fee (tingbogsafgift, 0.6%) — national'),
  },
}
const fi: CountryCosts = {
  sample: 400000,
  closer: 'Asianajaja + kiinteistörekisteri',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax (varainsiirtovero, 4%)',
  extras: [
    { label: 'Lawyer & registry (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'Finland raised varainsiirtovero from 1.5% to 4% in January 2024 — the table prices the new rate (first homes under 50% ownership of a housing company are exempt). Housing-company shares (bostadsaktier style) transfer like shares, with the company board’s consent. Foreigners buy freely.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months, escrowed at the bank.',
    'Leases commonly run open-ended; rent increases to the CPI-plus cap.',
    'First-hand rentals queue for years in Helsinki — an indexed private lease beats the queue.',
  ],
  rentNote:
    'Helsinki prices off the capital grind; Tampere and Espoo price off tech. Owning beats the rental queue in every metro.',
  facts: [
    { n: '4%', label: 'transfer tax, raised 2024' },
    { n: 'First home', label: 'the exemption path' },
    { n: 'CPI cap', label: 'statutory rent-rise ceiling' },
    { n: 'Share deal', label: 'housing-company shares, board consent' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate, one big change: the 2024 rise doubled-plus the tax; the first-home exemption is the planning lever.',
  defaultCity: worldCity('4%', 4.0, 'Uusimaa', 'Transfer tax (varainsiirtovero, 4%) — national'),
  cities: {
    helsinki: worldCity('4%', 4.0, 'Uusimaa', 'Transfer tax (varainsiirtovero, 4%) — national'),
    espoo: worldCity('4%', 4.0, 'Uusimaa', 'Transfer tax (varainsiirtovero, 4%) — national'),
    tampere: worldCity('4%', 4.0, 'Pirkanmaa', 'Transfer tax (varainsiirtovero, 4%) — national'),
    vantaa: worldCity('4%', 4.0, 'Uusimaa', 'Transfer tax (varainsiirtovero, 4%) — national'),
  },
}
const is_: CountryCosts = {
  sample: 70000000,
  closer: 'Lögmaður (attorney)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration levy (1.6%)',
  extras: [
    { label: 'Lögmaður & disbursements (≈0.6%)', pct: 0.6 },
  ],
  buyerAgentPct: 0,
  note:
    'A 1.6% registration levy ( Registry fee + tryggingargjald) applies above ISK 5M of price; the lögmaður handles conveyancing. Non-EEA buyers need Ministry of Justice permission — EEA citizens file a lighter notification. The 2008-era indexed loans are history; today’s market is inflation-indexed rents and a krona you price at signing.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases commonly run 12 months with CPI-linked escalation.',
    'Rents may be inflation-indexed — read the indexation clause before the view, not after.',
  ],
  rentNote:
    'Reykjavik is the market; the rest of the country prices off tourism and fisheries.',
  facts: [
    { n: '1.6%', label: 'registration levy above ISK 5M' },
    { n: 'Permission', label: 'non-EEA buyers need the Ministry' },
    { n: 'CPI', label: 'rents index to inflation legally' },
    { n: 'Lögmaður', label: 'the attorney who closes' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One city, one levy: the krona’s indexation clause, not the levy, is the financial planning item.',
  defaultCity: worldCity('1.6%', 1.6, 'Capital Region', 'Registration levy (1.6%) — national'),
  cities: {
    reykjavik: worldCity('1.6%', 1.6, 'Capital Region', 'Registration levy (1.6%) — national'),
  },
}
const at: CountryCosts = {
  sample: 500000,
  closer: 'Notar + Grundbuch',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Grunderwerbsteuer (3.5%) + registry',
  extras: [
    { label: 'Notary & Grundbuch (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'Austria charges 3.5% Grunderwerbsteuer plus 1.1% registration — uniform nationally (the old family-exemption loopholes were cut). New builds from VAT developers carry 20% VAT on the build share instead. Foreigners (EEA) buy freely; Vienna’s cooperative/gemeindebauten stock is rental-only heritage, which shrinks the sale stock.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months.',
    'Leases commonly run 3 years (fixed-term needs a reason since 2021 reforms).',
    'Richter’s clause: indexation must be in the contract — verbal indexation is void.',
  ],
  rentNote:
    'Vienna prices off the world’s most livable ranking; Innsbruck off Alpine scarcity; Salzburg off festival tourism.',
  facts: [
    { n: '3.5%', label: 'Grunderwerbsteuer, national' },
    { n: '1.1%', label: 'registration on top' },
    { n: '3 yr', label: 'standard lease term' },
    { n: 'Reason', label: 'fixed-terms need statutory cause' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One rate nationally; Vienna’s protected rental stock shrinks what ever reaches the sale market.',
  defaultCity: worldCity('3.5%', 3.5, 'Vienna', 'Grunderwerbsteuer (3.5%) + registry — national'),
  cities: {
    vienna: worldCity('3.5%', 3.5, 'Vienna', 'Grunderwerbsteuer (3.5%) + registry — national'),
    graz: worldCity('3.5%', 3.5, 'Styria', 'Grunderwerbsteuer (3.5%) + registry — national'),
    salzburg: worldCity('3.5%', 3.5, 'Salzburg', 'Grunderwerbsteuer (3.5%) + registry — national'),
    innsbruck: worldCity('3.5%', 3.5, 'Tyrol', 'Grunderwerbsteuer (3.5%) + registry — national'),
  },
}
const be: CountryCosts = {
  sample: 400000,
  closer: 'Notaris',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration duty (12.5% south, 6% Flanders)',
  extras: [
    { label: 'Notaris fees — statutory scale (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Flanders cut its registration duty to 6% (2024, above a €100k exemption band for all buyers; first-homes get further reductions), while Brussels and Wallonia keep 12.5% with own first-home abatements. The notaris is mandatory and runs the cadastre check. Foreigners buy freely; the cadastral income (kadastraal inkomen) drives annual property tax, not price.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two months (waarborg) in a regulated account.',
    'Leases commonly run 3 years (renew 3+3) or 9-year commercial style for flats.',
    'Indexation to health index is automatic if contracted — Belgian leases escalate on a formula, not the landlord’s mood.',
  ],
  rentNote:
    'Brussels prices off EU-institution wages; Antwerp off port money; Ghent off students.',
  facts: [
    { n: '6%', label: 'Flanders, above the €100k band' },
    { n: '12.5%', label: 'Brussels & Wallonia' },
    { n: 'Waarborg', label: 'two months, regulated account' },
    { n: 'Health index', label: 'the legal rent escalator' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'Two regimes one border apart: a Flemish flat pays 6% where a Brussels one pays 12.5% on the same euro.',
  defaultCity: worldCity('6–12.5%', 6.0, 'Brussels', 'Registration duty (12.5% south, 6% Flanders) — national'),
  cities: {
    brussels: worldCity('6–12.5%', 6.0, 'Brussels', 'Registration duty (12.5% south, 6% Flanders) — national'),
    antwerp: worldCity('6–12.5%', 6.0, 'Flanders', 'Registration duty (12.5% south, 6% Flanders) — national'),
    ghent: worldCity('6–12.5%', 6.0, 'Flanders', 'Registration duty (12.5% south, 6% Flanders) — national'),
    bruges: worldCity('6–12.5%', 6.0, 'Flanders', 'Registration duty (12.5% south, 6% Flanders) — national'),
  },
}
const ie: CountryCosts = {
  sample: 400000,
  closer: 'Solicitor + Property Registration Authority',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Stamp duty (1% residential)',
  extras: [
    { label: 'Solicitor & registration (≈0.8%)', pct: 0.8 },
  ],
  buyerAgentPct: 0,
  note:
    'Residential stamp duty is 1% (non-residential 7.5%). New builds add VAT at 13.5%. The solicitor runs the closed period between contract and closing; the PRA (Tailte Éireann) registers. Foreigners buy freely; the RTB (Residential Tenancies Board) governs the rental side with rent-pressure zones capping increases.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month (typically) held by the solicitor.',
    'Leases commonly run 12 months, then part IV tenancy security after 6 months.',
    'Rent-pressure zones cap increases at 2% annually — most of Dublin is one.',
  ],
  rentNote:
    'Dublin prices off tech wages and a construction deficit; Cork and Galway follow at a discount.',
  facts: [
    { n: '1%', label: 'residential stamp duty' },
    { n: 'RPZ', label: 'rent-pressure zones, 2% caps' },
    { n: 'Part IV', label: 'tenancy security after 6 months' },
    { n: '13.5%', label: 'VAT on new builds' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national rate; the RPZ map, not the tax map, is what renters need to know.',
  defaultCity: worldCity('1%', 1.0, 'Leinster', 'Stamp duty (1% residential) — national'),
  cities: {
    dublin: worldCity('1%', 1.0, 'Leinster', 'Stamp duty (1% residential) — national'),
    cork: worldCity('1%', 1.0, 'Munster', 'Stamp duty (1% residential) — national'),
    galway: worldCity('1%', 1.0, 'Connacht', 'Stamp duty (1% residential) — national'),
    limerick: worldCity('1%', 1.0, 'Munster', 'Stamp duty (1% residential) — national'),
  },
}
const lu: CountryCosts = {
  sample: 1000000,
  closer: 'Notaire',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Registration (6%) + transcription',
  extras: [
    { label: 'Notaire — statutory scale (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Registration duty runs 6% (4% duty + 2% transcription) with the Bëllegen Steier credit doubling the first €40k per buyer of the 2% share (2025 changes index it); global contracts can restructure to 0.8%+VAT for qualifying investment. The notaire is mandatory. Foreigners buy freely; Luxembourg’s stock is small and the market is thin by construction.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run two to three months (caution) at the notaire.',
    'Leases commonly run 12 months with indexation.',
    'Rent caps: annual increases limited to index, and some older contracts ride controlled rent.',
  ],
  rentNote:
    'The city-state is the market: Luxembourg City is the country’s price-setter, full stop.',
  facts: [
    { n: '6%', label: '4% duty + 2% transcription' },
    { n: 'Bëllegen', label: 'the first-buyer credit doubling' },
    { n: '0.8%+VAT', label: 'the global-contract alternative' },
    { n: 'Thin market', label: 'stock is small by geography' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One city, one scale: the credit and the global-contract path decide what you actually pay.',
  defaultCity: worldCity('≈6.4%', 6.4, 'Luxembourg', 'Registration (6%) + transcription — national'),
  cities: {
    luxembourg: worldCity('≈6.4%', 6.4, 'Luxembourg', 'Registration (6%) + transcription — national'),
  },
}
const ee: CountryCosts = {
  sample: 200000,
  closer: 'Notar + Land Register',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'State fee (0.5%) + notary',
  extras: [
    { label: 'Notary (≈0.3%)', pct: 0.3 },
  ],
  buyerAgentPct: 0,
  note:
    'Estonia is cheap and digital: state fee ~0.5% capped modestly and notary scaled to price; no transfer tax. The Land Register is the title and the e-land register entries happen same-week. Foreigners buy apartments freely; a house with land needs a notarized application to the police board that is routinely approved.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to three months (tagatis).',
    'Leases commonly run 12 months, registered for enforcement.',
    'Law of Obligations act caps deposit at 3 months and interest must be paid on it.',
  ],
  rentNote:
    'Tallinn prices off a fintech and e-state economy; Tartu off the university.',
  facts: [
    { n: '≈0.5%', label: 'state fee, capped' },
    { n: 'Same-week', label: 'digital registry transfers' },
    { n: '3 mo', label: 'deposit cap with interest' },
    { n: 'Approval', label: 'the land-owning foreigner step' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One digital registry, one small rate: the notary’s scale is the only moving part.',
  defaultCity: worldCity('≈0.8%', 0.8, 'Harju', 'State fee (0.5%) + notary — national'),
  cities: {
    tallinn: worldCity('≈0.8%', 0.8, 'Harju', 'State fee (0.5%) + notary — national'),
    tartu: worldCity('≈0.8%', 0.8, 'Tartu', 'State fee (0.5%) + notary — national'),
  },
}
const lt: CountryCosts = {
  sample: 200000,
  closer: 'Notaras + Registrų centras',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Notary fee + registry (no transfer tax)',
  extras: [
    { label: 'Notary & registry (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'No transfer tax in Lithuania — notary fees scale with price and the Registrų centras entry is token. New builds from VAT developers add 21% VAT. Foreigners buy apartments freely; non-EU need government consent for land. The registry is digital and fast; the notarial deed is mandatory.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (užstatas).',
    'Leases commonly run 12 months with 3-month notice.',
    'Deposit cap of two months applies where the law of obligations governs.',
  ],
  rentNote:
    'Vilnius prices off a fintech boom; Kaunas off industry and the students.',
  facts: [
    { n: '0%', label: 'no transfer tax' },
    { n: 'Registrų centras', label: 'the digital registry' },
    { n: 'Consent', label: 'non-EU landbuyer step' },
    { n: 'VAT 21%', label: 'on new builds' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One national process, no tax: Vilnius and Kaunas differ by market, never by statute.',
  defaultCity: worldCity('≈0.7%', 0.7, 'Vilnius', 'Notary fee + registry (no transfer tax) — national'),
  cities: {
    vilnius: worldCity('≈0.7%', 0.7, 'Vilnius', 'Notary fee + registry (no transfer tax) — national'),
    kaunas: worldCity('≈0.7%', 0.7, 'Kaunas', 'Notary fee + registry (no transfer tax) — national'),
  },
}
const lv: CountryCosts = {
  sample: 200000,
  closer: 'Notary + Zemesgrāmata',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'State fee (up to 2%)',
  extras: [
    { label: 'Notary & land book (≈0.5%)', pct: 0.5 },
  ],
  buyerAgentPct: 0,
  note:
    'The state fee runs up to 2% of cadastral value (which trails market), so the real bite is well under 2% of price; notary adds a scaled fee. Foreigners buy apartments freely; land needs... only agricultural land is restricted. The Zemesgrāmata (land book) is the title; cadastral lag is the planning item.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (drošības nauda).',
    'Leases commonly run 12 months, registered for enforcement.',
    'Registered leases bind the new owner — the land book is the tenancy shield too.',
  ],
  rentNote:
    'Riga prices off a port-and-IT economy; Daugavpils trails at a fraction.',
  facts: [
    { n: '≤2%', label: 'state fee on cadastral value' },
    { n: 'Cadastral lag', label: 'the base trails price' },
    { n: 'Zemesgrāmata', label: 'the land book is title' },
    { n: 'Agri land', label: 'the one restricted class' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One scale on a lagging base: the fee reads 2% but lands far under that on market price.',
  defaultCity: worldCity('≈2%', 2.0, 'Riga', 'State fee (up to 2%) — national'),
  cities: {
    riga: worldCity('≈2%', 2.0, 'Riga', 'State fee (up to 2%) — national'),
    daugavpils: worldCity('≈2%', 2.0, 'Latgale', 'State fee (up to 2%) — national'),
  },
}
const mt: CountryCosts = {
  sample: 350000,
  closer: 'Notary + Public Registry',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Duty on documents (5%)',
  extras: [
    { label: 'Notary & searches — statutory (≈1%)', pct: 1.0 },
  ],
  buyerAgentPct: 0,
  note:
    'Stamp duty (duty on documents) is 5% — with the 3.5% band on the first €150k for first-time buyers of their sole residence and reduced schedules for certain inheritor-purchases (2024-25 tweaks continue). The notary runs searches at the Public Registry; AIP (Acquisition of Immovable Property) permit needed for non-first-time EU and all non-EU buyers, with higher minimums in Gozo and the south.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one month (depositu) at contract stage.',
    'Leases commonly run 12 months with registered status.',
    'The private residential lease rules cap deposits at one month and registration is mandatory.',
  ],
  rentNote:
    'Sliema and St Julian’s price off iGaming and English-language schooling; Valletta off heritage stock.',
  facts: [
    { n: '5%', label: 'duty, 3.5% first €150k first-home' },
    { n: 'AIP', label: 'the permit for non-first-time EU and non-EU' },
    { n: '1 mo', label: 'the private-lease deposit cap' },
    { n: 'Registered', label: 'tenancies must be filed' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One scale with one lever: the first-home 3.5% band and the AIP minimums move the real cost.',
  defaultCity: worldCity('5%', 5.0, 'Malta', 'Duty on documents (5%) — national'),
  cities: {
    valletta: worldCity('5%', 5.0, 'Malta', 'Duty on documents (5%) — national'),
    sliema: worldCity('5%', 5.0, 'Northern Harbour', 'Duty on documents (5%) — national'),
    'st-julians': worldCity('5%', 5.0, 'Northern Harbour', 'Duty on documents (5%) — national'),
  },
}
const sk: CountryCosts = {
  sample: 250000,
  closer: 'Notár + kataster',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'No transfer tax + notary & registry',
  extras: [
    { label: 'Notary & kataster (≈0.2%)', pct: 0.2 },
  ],
  buyerAgentPct: 0,
  note:
    'Slovakia abolished the real-estate transfer tax decades ago and never reintroduced it — the closing is notary plus kataster, under 0.5% all-in. New builds add VAT where the developer charges it. Foreigners (EEA) buy freely; non-EEA need consent only for agricultural or forest land. The kataster entry perfects title.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months (kaucia).',
    'Leases commonly run 12 months with 3-month notice; fixed terms end on the date.',
    'Registered leases bind a buyer of the building.',
  ],
  rentNote:
    'Bratislava prices off Vienna spillover and automotive; Košice off steel and the east.',
  facts: [
    { n: '0%', label: 'no transfer tax' },
    { n: 'Kataster', label: 'perfects title same-week' },
    { n: 'Consent', label: 'only for non-EU agri/forest buyers' },
    { n: '<0.5%', label: 'the whole stack' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One of Europe’s cheapest closings: notary and kataster, nothing else.',
  defaultCity: worldCity('≈0.3%', 0.3, 'Bratislava', 'No transfer tax + notary & registry — national'),
  cities: {
    bratislava: worldCity('≈0.3%', 0.3, 'Bratislava', 'No transfer tax + notary & registry — national'),
    kosice: worldCity('≈0.3%', 0.3, 'Košice', 'No transfer tax + notary & registry — national'),
  },
}
const si: CountryCosts = {
  sample: 300000,
  closer: 'Notary + Land Register (ZKN)',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax (2%)',
  extras: [
    { label: 'Notary & register (≈0.4%)', pct: 0.4 },
  ],
  buyerAgentPct: 0,
  note:
    'A 2% transfer tax where the seller is not VAT-registered (VAT deals skip it). The Land Register (zemljiška knjiga) is digital under the ZKN reform. Foreigners buy with reciprocity — EU citizens freely. Energy-efficiency certificates (NZS) are mandatory at sale.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposits run one to two months.',
    'Leases commonly run 12 months, registered for open-ended protection.',
    'Open-ended leases cap increases to inflation-linked formulas.',
  ],
  rentNote:
    'Ljubljana prices off the capital and a shortage of buildable land; Maribor trades at half.',
  facts: [
    { n: '2%', label: 'transfer tax, VAT deals skip' },
    { n: 'ZKN', label: 'the digital land register' },
    { n: 'NZS', label: 'energy certificate required at sale' },
    { n: 'Half', label: 'Maribor vs the capital' },
  ],
  trust: ['Registry path', 'Title checked', '3D map'],
  citiesTitle: 'National rates, local markets',
  citiesSub:
    'One rate, one register: Ljubljana’s land scarcity, not the tax, sets the payment plan.',
  defaultCity: worldCity('2%', 2.0, 'Osrednjeslovenska', 'Transfer tax (2%) — national'),
  cities: {
    ljubljana: worldCity('2%', 2.0, 'Osrednjeslovenska', 'Transfer tax (2%) — national'),
    maribor: worldCity('2%', 2.0, 'Podravska', 'Transfer tax (2%) — national'),
  },
}

export const MARKET_COSTS = { de, ae, fr, es, it, gb, us, ca, tr, gr, cy, nl, pt, ch, jp, cn, kr, hk, sg, th, id, ph, vn, my, mm, in: in_, pk, bd, lk, np, kh, la, uz, kz, am, az, sa, eg, ng, za, ke, ma, au, nz, br, mx, co, cl, ar, pe, ec, pl, cz, hu, ro, bg, rs, hr, ua, se, no, dk, fi, is: is_, at, be, ie, lu, ee, lt, lv, mt, sk, si } as Record<string, CountryCosts>

/**
 * Generic model for markets whose local table is pending — percent-only,
 * no invented rates (same convention as TRY: sample null → percentages).
 */
const GENERIC: CountryCosts = {
  sample: null,
  closer: 'A licensed local notary or conveyancer',
  cashLabel: 'Cash needed at closing',
  taxLabel: 'Transfer tax',
  extras: [],
  buyerAgentPct: 0,
  note:
    'The full buyer-cost model for this market is still being verified against official sources. Budget roughly 3–7% of the price for closing costs until the local table lands, and confirm every line with the closing professional before you commit.',
  rentTitle: 'The rent side, in three lines',
  rentRules: [
    'Deposit caps are set locally — never hand over more than local law allows.',
    'Register the lease where the jurisdiction requires it; an unregistered lease is hard to enforce.',
    'Check the energy performance certificate where one is mandatory — in much of Europe it is a habitability test.',
  ],
  rentNote: 'Generic guidance only. This market’s rental rules land with its verified cost model.',
  facts: [
    { n: '3–7%', label: 'typical closing-cost range while the local model is verified' },
    { n: '1', label: 'licensed closer signs the deed (the title varies by jurisdiction)' },
    { n: '—', label: 'local transfer-tax table pending verification' },
    { n: '3D map', label: 'every listing placed on the ground' },
  ],
  trust: ['Licensed closer', 'Verified listings', '3D map'],
  citiesTitle: 'Metros we cover',
  citiesSub:
    'City-level rates land with this market’s verified cost model — until then each guide sticks to what is officially published.',
  defaultCity: { chip: '—', chipTitle: 'Local transfer tax — table pending verification', region: 'National', pct: null },
  cities: {},
}

/** Cost model for a market; GENERIC until the local table is verified. */
export function marketCosts(country: PathCountryId): CountryCosts {
  return MARKET_COSTS[country] ?? GENERIC
}

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
  const m = marketCosts(country)
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
  const m = marketCosts(country)
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
  return marketCosts(country).facts
}

export function marketTrust(country: PathCountryId): [string, string, string] {
  return marketCosts(country).trust
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
