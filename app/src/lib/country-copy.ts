/**
 * Unique copy for country hubs / city / buy / rent. English is canonical.
 * Arabic exists only where we wrote real AE copy (no phantom locales).
 */

import { MARKETS, type PathCountryId } from '@/lib/markets'
import { EXTRA_CITIES, EXTRA_HUBS, EXTRA_NAMES } from '@/lib/countries/hubs-extra'

export type CountryCopy = {
  title: string
  description: string
  h1: string
  lede: string
  body: string[]
  faqs: { q: string; a: string }[]
}

export type Intent = 'buy' | 'rent'

type CityPack = {
  name: string
  hub: CountryCopy
  buy?: CountryCopy
  rent?: CountryCopy
}

function city(
  name: string,
  lede: string,
  body: string[],
  faqs: CountryCopy['faqs'],
  extra?: { buy?: CountryCopy; rent?: CountryCopy },
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

export const COUNTRY_NAMES: Record<PathCountryId, string> = {
  de: 'Germany',
  ae: 'United Arab Emirates',
  ...EXTRA_NAMES,
}

export const DE_HUB: CountryCopy = {
  title: 'Germany real estate — Berlin & major cities | sivrce',
  description:
    'sivrce in Germany: Berlin-first guides for buying and renting apartments. Notary, Grundbuch and transfer tax explained. Listings as inventory lands.',
  h1: 'Real estate in Germany',
  lede:
    'Search Germany the way you search Georgia: buy or rent, pick a city, open the 3D map. Berlin first — notary, Grundbuch and transfer tax sit under the search. Verified listings as partners join.',
  body: [
    'Germany is a renter-majority market. Yield investors underwrite vacancy and Mietspiegel rules, not tourist occupancy. Berlin, Hamburg, Munich, Frankfurt and Cologne are the first metros on sivrce; each city page is a unique briefing, not a thin doorway.',
    'A purchase is not a handshake. An independent notary reads the contract, Grunderwerbsteuer (around 6% in Berlin) is due, plus notary and land-register fees. Foreign buyers are not barred from freehold apartments. sivrce will only publish listings we can verify to the same standard as Georgia.',
    'Until listings arrive, use the city guides for orientation — districts, commute, and the legal path — then follow sivrce.ge for the live Georgian inventory.',
  ],
  faqs: [
    {
      q: 'Can a non-resident buy an apartment in Germany?',
      a: 'Yes. There is no nationality ban on buying residential property. You will need a notary, a German bank account for settlement, and a budget for transfer tax, notary and registration — typically 8–12% on top of the price in Berlin.',
    },
    {
      q: 'Is sivrce.de a separate website?',
      a: 'No. sivrce.de permanently redirects to sivrce.com/de so Germany has one canonical URL. Georgia stays on sivrce.ge.',
    },
  ],
}

/** Native German hub — used when `lang=de`. Unique copy, not a translation of DE_HUB. */
export const DE_HUB_DE: CountryCopy = {
  title: 'Immobilien Deutschland — Berlin & Metropolen | sivrce',
  description:
    'sivrce in Deutschland: Berlin zuerst. Kauf und Miete mit Notar, Grundbuch und Grunderwerbsteuer. Inserate nur verifiziert.',
  h1: 'Immobilien in Deutschland',
  lede:
    'Deutschland durchsuchen wie Georgien: kaufen oder mieten, Stadt wählen, 3D-Karte öffnen. Berlin zuerst — Notar, Grundbuch und Grunderwerbsteuer stehen unter der Suche. Verifizierte Inserate sobald Partner stehen.',
  body: [
    'Deutschland ist ein Mietermarkt. Kapitalanleger rechnen mit Leerstand und Mietspiegel, nicht mit Touristenauslastung. Berlin, Hamburg, München, Frankfurt und Köln sind die ersten Metropolen — jede Stadtseite ist ein eigenes Briefing, keine Doorway-Seite.',
    'Ein Kauf ist kein Handschlag. Der Notar verliest den Vertrag, Grunderwerbsteuer (in Berlin 6 %) plus Notar- und Grundbuchkosten werden fällig. Ausländer dürfen Volleigentum erwerben. sivrce veröffentlicht nur, was sich so prüfen lässt wie in Georgien.',
    'Solange das Inventar wächst: Stadtguides für Lage, Pendeln und den rechtlichen Weg. Die Karte zeigt amtliche Geometrie (ALKIS, B-Plan, StEP Wohnen 2040) — keine erfundenen Gebäude.',
  ],
  faqs: [
    {
      q: 'Darf ein Nicht-Resident eine Wohnung in Deutschland kaufen?',
      a: 'Ja. Es gibt kein Staatsangehörigkeitsverbot. Sie brauchen einen Notar, ein Konto für die Abwicklung und Budget für Grunderwerbsteuer, Notar und Grundbuch — in Berlin typisch 8–12 % auf den Kaufpreis.',
    },
    {
      q: 'Ist sivrce.de eine eigene Website?',
      a: 'Nein. sivrce.de leitet dauerhaft auf sivrce.com/de um. Eine kanonische URL. Georgien bleibt auf sivrce.ge.',
    },
  ],
}

export const AE_HUB: CountryCopy = {
  title: 'UAE real estate — Dubai & Abu Dhabi | sivrce',
  description:
    'sivrce in the UAE: Dubai and Abu Dhabi guides for freehold buying and renting. RERA, service charges and off-plan escrow — listings as inventory lands.',
  h1: 'Real estate in the United Arab Emirates',
  lede:
    'The UAE market is freehold for designated zones, bilingual (English/Arabic), and priced in dirhams. sivrce starts with Dubai and Abu Dhabi guides — not a duplicate of Georgia, and not a scraped classifieds dump.',
  body: [
    'Dubai is the liquidity hub: off-plan towers, ready apartments in Marina, Downtown and JVC, and a rental market tied to visas and school calendars. Abu Dhabi is quieter, with more villa communities and a different transfer-fee schedule.',
    'Buying off-plan should go through RERA-registered escrow. Ready property transfers at the Dubai Land Department or Abu Dhabi DLD equivalent. Service charges can rival a second mortgage — read the form before the yield spreadsheet.',
    'sivrce.ae redirects to sivrce.com/ae. Arabic lives at /ar/ae for readers who want it; English at /ae is the default canonical.',
  ],
  faqs: [
    {
      q: 'Can foreigners buy in Dubai?',
      a: 'Yes, in designated freehold areas. The title is issued by the Dubai Land Department. Off-plan payments should sit in a RERA escrow account, not a developer’s personal account.',
    },
    {
      q: 'Is sivrce.ae a separate indexable site?',
      a: 'No. It is a defensive country TLD that 308s to sivrce.com/ae so Google and AI engines see one UAE URL set.',
    },
  ],
}

export const COUNTRY_HUBS: Record<PathCountryId, CountryCopy> = {
  de: DE_HUB,
  ae: AE_HUB,
  ...EXTRA_HUBS,
}

export const AE_HUB_AR: CountryCopy = {
  title: 'عقارات الإمارات — دبي وأبوظبي | sivrce',
  description:
    'sivrce في الإمارات: أدلة دبي وأبوظبي للشراء الحر والإيجار. ريرا والحسابات الضمانية — الإعلانات عند توفر المخزون.',
  h1: 'العقارات في الإمارات العربية المتحدة',
  lede:
    'سوق الإمارات يسمح بالتملك الحر في مناطق محددة، ويعمل بالإنجليزية والعربية، ويُسعَّر بالدرهم. sivrce يبدأ بأدلة دبي وأبوظبي — ليست نسخة من جورجيا.',
  body: [
    'دبي هي سوق السيولة: أبراج على المخطط، شقق جاهزة في المارينا وداون تاون وJVC، وإيجار مرتبط بالتأشيرة والمدارس. أبوظبي أهدأ، وفيها مجتمعات فلل ورسوم نقل مختلفة.',
    'شراء على المخطط يجب أن يمر عبر حساب ضمان مسجّل لدى ريرا. نقل الملكية الجاهزة يتم في دائرة الأراضي. رسوم الخدمات قد تعادل قسط تمويل — اقرأ الكشف قبل حساب العائد.',
  ],
  faqs: [
    {
      q: 'هل يمكن للأجانب الشراء في دبي؟',
      a: 'نعم في مناطق التملك الحر. الصك تصدره دائرة الأراضي في دبي. دفعات على المخطط تُحفظ في حساب ضمان ريرا.',
    },
    {
      q: 'هل sivrce.ae موقع مستقل للفهرسة؟',
      a: 'لا. النطاق يحول تحويلاً دائماً إلى sivrce.com/ae حتى لا تتكرر الصفحات.',
    },
  ],
}

const berlinBuy: CountryCopy = {
  title: 'Buy an apartment in Berlin | sivrce',
  description:
    'How buying in Berlin works: notary, Grundbuch, 6% transfer tax, and which Bezirke investors actually underwrite. sivrce listings as inventory lands.',
  h1: 'Buy in Berlin',
  lede:
    'Search Berlin apartments for sale — type, Bezirk, then the 3D map. Notary, 6% Grunderwerbsteuer and Grundbuch sit below the search. Foreign buyers are allowed.',
  body: [
    'Contracts are read aloud by a notary. Ownership moves when the Grundbuch is updated, not when you wire the deposit. Allow weeks, not hours. Banks may want a higher down payment from non-residents.',
    'Mitte, Prenzlauer Berg and Charlottenburg are expensive relative to yield. Neukölln, Lichtenberg and outer Bezirke still price as cash-flow first. sivrce will not invent listings — this page stays a buying briefing until verified inventory is live.',
  ],
  faqs: [
    {
      q: 'How long does a Berlin purchase take?',
      a: 'From signed notarial deed to Grundbuch entry is often 6–12 weeks, longer if a bank mortgage or pre-emption right is involved.',
    },
    {
      q: 'Are there extra taxes for foreigners?',
      a: 'No special foreigner tax. You pay the same transfer tax, notary and registration as a resident. Income from rent is taxable in Germany.',
    },
  ],
}

export const DE_BERLIN_HUB_DE: CountryCopy = {
  title: 'Immobilien Berlin — Bezirke, Kauf & Miete | sivrce',
  description:
    'Berlin: zwölf Bezirke, Notar, Grundbuch, 6 % Grunderwerbsteuer. sivrce zeigt amtliche Geometrie und verifizierte Neubauten — keine erfundenen Inserate.',
  h1: 'Immobilien in Berlin',
  lede:
    'Berlin durchsuchen: kaufen oder mieten oben, dann 3D-Karte und Bezirksguides. Inserate folgen, sobald sie sich prüfen lassen — Notar und Grundbuch bleiben das Kaufmodell.',
  body: [
    'Zwölf Bezirke (Mitte bis Treptow-Köpenick) plus Ortsteile wie Kreuzberg und Prenzlauer Berg. Preise und Mieten trennen sich scharf am S-Bahn-Ring.',
    'Kauf ist notariell: Grundbuch, 6 % Grunderwerbsteuer, Notar und Eintragung obendrauf. sivrce veröffentlicht kein Berliner Inserat, das sich nicht belegen lässt.',
    'Die 3D-Karte trägt ALKIS-Gebäude, Flurstücke, B-Pläne und StEP Wohnen 2040 — amtliche Quelle, mit Herkunft. Keine KI-Grundrisse.',
  ],
  faqs: [
    { q: 'Dürfen Ausländer in Berlin kaufen?', a: 'Ja. Kein Staatsangehörigkeitsverbot. Notar, rund 8–12 % Nebenkosten, Eigentum entsteht mit der Grundbucheintragung — nicht mit dem Portal.' },
    { q: 'Wann erscheinen Berliner Inserate auf sivrce?', a: 'Soft Launch mit Guides. Inserate kommen, sobald Makler und Eigentümer unter denselben Prüfregeln stehen wie in Georgien.' },
  ],
}

export const DE_BERLIN_BUY_DE: CountryCopy = {
  title: 'Wohnung kaufen in Berlin | sivrce',
  description:
    'Kauf in Berlin: Notar, Grundbuch, 6 % Grunderwerbsteuer, Nebenkosten. Keine erfundenen Angebote.',
  h1: 'Kaufen in Berlin',
  lede:
    'Berlin durchsuchen wie Tbilisi: Typ, Bezirk, dann die 3D-Karte. Notar, 6 % Grunderwerbsteuer und Grundbuch stehen unter der Suche. Ausländer dürfen kaufen.',
  body: [
    'Der Notar verliest den Vertrag. Eigentum wechselt mit der Grundbucheintragung, nicht mit der Anzahlung. Wochen, nicht Stunden. Banken verlangen von Nicht-Residenten oft mehr Eigenkapital.',
    'Mitte, Prenzlauer Berg und Charlottenburg sind teuer relativ zur Rendite. Neukölln, Lichtenberg und äußere Bezirke rechnen oft über Cashflow. sivrce erfindet keine Inserate — diese Seite bleibt ein Briefing, bis geprüftes Inventar da ist.',
  ],
  faqs: [
    { q: 'Wie lange dauert ein Berliner Kauf?', a: 'Vom notariellen Kaufvertrag bis zur Grundbucheintragung oft 6–12 Wochen, länger bei Finanzierung oder Vorkaufsrecht.' },
    { q: 'Gibt es eine Ausländersteuer?', a: 'Nein. Dieselbe Grunderwerbsteuer, dieselben Notar- und Grundbuchkosten. Mieteinnahmen sind in Deutschland steuerpflichtig.' },
  ],
}

export const DE_BERLIN_RENT_DE: CountryCopy = {
  title: 'Wohnung mieten in Berlin | sivrce',
  description:
    'Mieten in Berlin: Mietspiegel, Kaution, Kaltmiete und Warmmiete. Verifizierte Angebote, sobald sie vorliegen.',
  h1: 'Mieten in Berlin',
  lede:
    'Berlin ist eine Mietstadt. Die meisten Haushalte mieten, die Kaution ist gedeckelt (in der Regel drei Kaltmieten), die Angebotsmiete gehört gegen den Mietspiegel gehalten.',
  body: [
    'Warmmiete enthält Heizung und Betriebskosten, Kaltmiete nicht. SCHUFA und Einkommensnachweis sind Standard. Unmöbliert ist der Normalfall — möbliert oft befristet.',
    'Kurzzeit steht unter eigenen Regeln. Das georgische Tagesmiet-Produkt ist nicht das Berliner Modell. Wenn Mieten hier live gehen, zuerst als Langzeit.',
  ],
  faqs: [
    { q: 'Wie hoch darf die Kaution in Berlin sein?', a: 'In der Regel bis zu drei Kaltmieten, getrennt angelegt (§551 BGB). Mehr ist keine Marktausnahme.' },
    { q: 'Kann ich ohne SCHUFA mieten?', a: 'Manche Vermieter akzeptieren Alternativen (Arbeitgeber, höhere Kaution, Sperrkonto). Viele nicht. Zeit einplanen.' },
  ],
}

const berlinRent: CountryCopy = {
  title: 'Rent an apartment in Berlin | sivrce',
  description:
    'Renting in Berlin: Mietspiegel, deposits, and why most residents rent rather than buy. sivrce will list verified rentals as they arrive.',
  h1: 'Rent in Berlin',
  lede:
    'Berlin is a rental city. Most households rent, deposits are capped (usually three cold rents), and asking rents should be checked against the local Mietspiegel.',
  body: [
    'Warm rent (Warmmiete) includes heating and building costs; cold rent (Kaltmiete) does not. SCHUFA and proof of income are standard. Unfurnished is the default — “möbliert” is a different, often time-limited product.',
    'Short-lets sit under separate rules. sivrce’s Georgia daily-rent product is not the Berlin model. When rentals go live here they will be long-let first.',
  ],
  faqs: [
    {
      q: 'How much deposit is legal in Berlin?',
      a: 'Usually up to three months’ cold rent, held in a separate deposit account. Charging more is not a “market exception”.',
    },
    {
      q: 'Can I rent without a SCHUFA?',
      a: 'Some landlords accept alternatives (employer letter, higher deposit, blocked account). Many will not. Plan extra time.',
    },
  ],
}

export const DE_CITIES: Record<string, CityPack> = {
  berlin: city(
    'Berlin',
    'Berlin is Germany’s largest city and a renter-majority capital. Search buy or rent above, then the 3D map and Bezirke guides — listings follow as verified inventory lands.',
    [
      'Twelve Bezirke (Mitte to Treptow-Köpenick) plus well-known Ortsteile such as Kreuzberg and Prenzlauer Berg. Prices and rents split sharply between the S-Bahn ring and the outer east.',
      'A purchase is notarial: Grundbuch, ~6% transfer tax in Berlin, notary and registration on top. sivrce will not publish a Berlin listing we cannot verify.',
      'Until then this page is the orientation layer — linked from sivrce.com/de — not a duplicate of sivrce.ge.',
    ],
    [
      { q: 'Can foreigners buy in Berlin?', a: 'Yes. No nationality ban. Use a notary, budget ~8–12% extra costs, and expect the land register — not the portal — to complete the sale.' },
      { q: 'When will Berlin listings appear on sivrce?', a: 'The city is in a documented soft launch. Guides are live; listings are added as local agents join under the same verification rules as Georgia.' },
    ],
    { buy: berlinBuy, rent: berlinRent },
  ),
  hamburg: city(
    'Hamburg',
    'Hamburg is Germany’s second city and a port-driven housing market on the Elbe — typically dearer than Berlin, cheaper than Munich, with waterfront premiums in HafenCity and Blankenese.',
    [
      'Demand comes from the port, media and aerospace employers. Families often look at Eimsbüttel and Wandsbek; water views price like a different city.',
      'The legal path is the German standard: notary, Grundbuch, Land transfer tax. sivrce will list Hamburg after Berlin inventory, not before.',
    ],
    [
      { q: 'Is Hamburg more expensive than Berlin?', a: 'Generally yes on a per-square-metre basis, still below Munich. Waterfront and HafenCity sit at the top of the local range.' },
      { q: 'Can foreigners buy in Hamburg?', a: 'Yes — same notarial process as the rest of Germany.' },
    ],
  ),
  munich: city(
    'Munich',
    'Munich is Germany’s most expensive residential market, driven by BMW, Siemens and a tight inner-city land supply on the Isar.',
    [
      'Yields are low; vacancy is lower. Altstadt-Lehel and Maxvorstadt are trophy; Schwabing and Glockenbach absorb younger demand. Oktoberfest spikes short-stay, not the long-let book.',
      'Bavaria’s transfer tax and notary costs apply. sivrce’s Munich page is a briefing until listings exist.',
    ],
    [
      { q: 'Why is Munich so expensive?', a: 'High wages, limited inner land, and persistent inbound jobs. Vacancy is thin, so rents are predictable even when yields look modest.' },
      { q: 'Is Munich good for rental investors?', a: 'Cash yield is compressed. Investors buy scarcity and tenant quality, not a 7% cap rate.' },
    ],
  ),
  cologne: city(
    'Cologne',
    'Cologne is a million-plus Rhine city priced below Munich and Frankfurt, with student and media demand and a 40-minute link to Düsseldorf.',
    [
      'Belgisches Viertel and Ehrenfeld pull younger renters; Lindenthal and Marienburg price as family premium. The Rhine agglomeration functions as one labour market.',
      'Notary + Grundbuch as elsewhere in Germany. sivrce lists Cologne as a registered metro, not a doorway farm.',
    ],
    [
      { q: 'Which areas work for investors in Cologne?', a: 'Ehrenfeld and Nippes for entry pricing and students; Deutz for trade-fair and business stays.' },
      { q: 'Can a Georgian citizen buy in Cologne?', a: 'Yes. Citizenship is not a barrier. You still need a notary and a tax budget.' },
    ],
  ),
  frankfurt: city(
    'Frankfurt',
    'Frankfurt is Germany’s financial centre. Banking, the airport and ECB-related jobs support a small, expensive core and a wider Rhine-Main rental belt.',
    [
      'Westend and Sachsenhausen are the prestige book; Sachsenhausen-Süd and Bornheim are more lived-in. The airport is a real commute, not a marketing footnote.',
      'Hesse sets transfer tax. sivrce will not clone Berlin copy onto Frankfurt — the tenant mix and ticket size are different.',
    ],
    [
      { q: 'Is Frankfurt only for bankers?', a: 'No, but the core prices as if it were. Families often cross into Offenbach or the Taunus rather than shrinking the apartment.' },
      { q: 'Off-plan in Frankfurt?', a: 'Exists, but the legal wrap is still notarial. Escrow marketing from other countries does not replace Grundbuch.' },
    ],
  ),
  stuttgart: city(
    'Stuttgart',
    'Stuttgart is the automotive-engineering capital of Baden-Württemberg — Mercedes, Porsche and a hilly basin that constrains supply.',
    [
      'Prices follow engineering payrolls. Vineyard slopes and Killesberg price above the basin floor. Public transport is good; parking is not.',
      'Transfer tax is a Baden-Württemberg rate. sivrce treats Stuttgart as a jobs-driven city, not a tourist yield play.',
    ],
    [
      { q: 'Is Stuttgart cheaper than Munich?', a: 'Usually yes, still expensive by national standards. The employer base is deep, which keeps rents firm.' },
      { q: 'Foreign buyers?', a: 'Allowed. Same notary path as the rest of Germany.' },
    ],
  ),
  duesseldorf: city(
    'Düsseldorf',
    'Düsseldorf is a Rhine state capital with Japanese business ties, a strong Altstadt, and a 40-minute train to Cologne.',
    [
      'Oberkassel and Oberbilk sit at opposite ends of the price ladder. The Königsallee core is retail; people actually live in Bilk, Bilk-Süd and the river terraces.',
      'North Rhine-Westphalia transfer tax applies. sivrce will not treat Düsseldorf as a suburb of Cologne.',
    ],
    [
      { q: 'Cologne or Düsseldorf to buy?', a: 'Different cities. Düsseldorf’s core is smaller and often dearer per metre; Cologne has more volume stock.' },
      { q: 'Can foreigners buy?', a: 'Yes, via notary and Grundbuch.' },
    ],
  ),
  leipzig: city(
    'Leipzig',
    'Leipzig is eastern Germany’s growth city — cheaper entry than Berlin, with Gründerzeit stock and a student-driven rental core.',
    [
      'Plagwitz and Connewitz absorbed the creative wave; the centre and Schleußig price higher. Renovation of Altbau is the typical product, not a new glass tower.',
      'Saxony transfer tax. sivrce lists Leipzig because the in-migration story is real, not because a template needed another URL.',
    ],
    [
      { q: 'Is Leipzig still cheap vs Berlin?', a: 'Entry prices remain lower. The gap has narrowed in the popular Gründerzeit belts.' },
      { q: 'Altbau risks?', a: 'Check heating, windows and WEG minutes. Cheap purchase prices can hide a five-year capex plan.' },
    ],
  ),
  dortmund: city(
    'Dortmund',
    'Dortmund is a Ruhr city priced off the German average — more living space per euro than the south, with a football-and-university rental pulse.',
    [
      'The Kreuzviertel and the Phoenix See area are the local premiums. Much of the stock is post-war; yields look better on paper until vacancy and capex are honest.',
      'NRW transfer tax. sivrce will not pretend Dortmund is Munich with a discount.',
    ],
    [
      { q: 'Good for buy-to-let?', a: 'Possible where universities and the station hold demand. Underwrite vacancy; do not paste Berlin rents into the model.' },
      { q: 'Foreign buyers?', a: 'Allowed under the same notarial rules.' },
    ],
  ),
  essen: city(
    'Essen',
    'Essen is a Ruhr centre with a UNESCO Zollverein site, a rebuilt commercial core, and housing priced well below the German south.',
    [
      'Rüttenscheid is the sought-after inner belt; much of the city is still industrial-era stock. Commuting across the Ruhr is normal.',
      'NRW rules. sivrce registers Essen as a metro with its own page, not a doorway to “Ruhr apartments”.',
    ],
    [
      { q: 'Is Essen only industrial housing?', a: 'No. Rüttenscheid and Margarethenhöhe are residential products. The average still reflects the Ruhr wage base.' },
      { q: 'Foreign buyers?', a: 'Yes, notary and Grundbuch.' },
    ],
  ),
  bremen: city(
    'Bremen',
    'Bremen is a two-city Land on the Weser — a compact historic core, a large student population, and prices below Hamburg.',
    [
      'The Schnoor and the Bürgerpark belts are the premium. Bremerhaven is a different housing market and is not this page.',
      'Bremen’s transfer tax applies. sivrce keeps Bremen off Hamburg’s URL.',
    ],
    [
      { q: 'Bremen vs Hamburg to buy?', a: 'Hamburg is the jobs magnet and the dearer city. Bremen trades space and a slower market.' },
      { q: 'Foreign buyers?', a: 'Allowed. German notarial sale.' },
    ],
  ),
  dresden: city(
    'Dresden',
    'Dresden is Saxony’s baroque capital with a reconstructed centre, a technical university, and prices still below Leipzig’s hottest streets.',
    [
      'Neustadt is the rental engine; the reconstructed Altstadt is a smaller, dearer book. Flood geography on the Elbe is a real due-diligence item, not folklore.',
      'Saxony transfer tax. sivrce’s Dresden page does not recycle Leipzig copy.',
    ],
    [
      { q: 'Flood risk?', a: 'Parts of the Elbe meadows flood. Check the parcel, not the postcard of the Frauenkirche.' },
      { q: 'Foreign buyers?', a: 'Yes, via notary.' },
    ],
  ),
  hanover: city(
    'Hanover',
    'Hanover is Lower Saxony’s capital — a trade-fair city with a compact centre, strong S-Bahn, and prices between the Ruhr and Hamburg.',
    [
      'The List and Oststadt rent well to professionals; the fairgrounds create a short seasonal spike that should not drive a 30-year model.',
      'Lower Saxony transfer tax. sivrce treats Hanover as a capital market, not a suburb of Hamburg.',
    ],
    [
      { q: 'Fair weeks vs long-let?', a: 'Do not underwrite Messe weeks as occupancy. The long-let book is civil-service and services.' },
      { q: 'Foreign buyers?', a: 'Allowed.' },
    ],
  ),
  nuremberg: city(
    'Nuremberg',
    'Nuremberg is Franconia’s largest city — a still-industrial, still-historic market cheaper than Munich and tied to the Nuremberg-Erlangen-Fürth triangle.',
    [
      'The Altstadt is constrained; Gostenhof and St. Johannis are the lived-in belts. Siemens and industrial employers matter more than tourism.',
      'Bavarian transfer tax. sivrce will not fold Nuremberg into a “Munich commuter” URL.',
    ],
    [
      { q: 'Commutable from Munich?', a: 'The ICE exists; daily commuting is not the product. Price Nuremberg as its own labour market.' },
      { q: 'Foreign buyers?', a: 'Yes, notary and Grundbuch.' },
    ],
  ),
  duisburg: city(
    'Duisburg',
    'Duisburg is a Rhine-Ruhr port city — among the more affordable German metros, with a large harbour, a university, and a wide spread of post-war stock.',
    [
      'Homberg and the inner east still price as cash-flow. The port is an employer, not a waterfront lifestyle brand. Yields that look high need vacancy and capex stress.',
      'NRW transfer tax. sivrce publishes Duisburg as itself, not as “cheap Düsseldorf”.',
    ],
    [
      { q: 'Is Duisburg a bargain trap?', a: 'It can be if you buy the wrong block. Port jobs are real; tenant quality and building condition decide the deal.' },
      { q: 'Foreign buyers?', a: 'Allowed under German notarial law.' },
    ],
  ),
  bochum: city(
    'Bochum',
    'Bochum is a Ruhr university city with a theatre quarter, a large student rental book, and purchase prices well below the German south.',
    [
      'Ehrenfeld (Bochum) and the Bermuda3Eck nightlife belt are not Charlottenburg. Student turnover is the rental engine. Underwrite summer voids.',
      'NRW rules. sivrce will not merge Bochum into Essen or Dortmund URLs.',
    ],
    [
      { q: 'Student lets?', a: 'Yes, around the Ruhr-Universität. That is a different product from a family Wohnung — contracts, furnishing and vacancy all change.' },
      { q: 'Foreign buyers?', a: 'Yes.' },
    ],
  ),
}

const dubaiBuy: CountryCopy = {
  title: 'Buy property in Dubai | sivrce',
  description:
    'Buying in Dubai: freehold zones, Dubai Land Department title, RERA escrow for off-plan, and service charges that can rival a mortgage.',
  h1: 'Buy in Dubai',
  lede:
    'Foreigners can buy freehold in designated Dubai zones. Title comes from the Dubai Land Department. Off-plan money should sit in a RERA escrow account.',
  body: [
    'Ready transfers are a DLD appointment, not a screenshot of a contract. Off-plan is a construction schedule plus escrow — if there is no RERA account, walk away.',
    'Service charges, DLD transfer fees (commonly 4%) and agency commission sit on top of the ask. sivrce will not list a Dubai unit we cannot source and verify.',
  ],
  faqs: [
    { q: 'Which areas are freehold?', a: 'Marina, Downtown, JVC, Arabian Ranches, Palm Jumeirah and many other designated zones. Some older districts remain leasehold — check the title, not the brochure.' },
    { q: 'Off-plan vs ready?', a: 'Off-plan needs escrow and a delivery record. Ready is slower to appreciate in a soft market but you can inspect the actual apartment.' },
  ],
}

const dubaiRent: CountryCopy = {
  title: 'Rent in Dubai | sivrce',
  description:
    'Renting in Dubai: Ejari, typically 1–4 cheques, agency fees, and DEWA on top of the ask. Long-let first when sivrce inventory lands.',
  h1: 'Rent in Dubai',
  lede:
    'Dubai leases are usually one year, registered on Ejari. Landlords often want multiple cheques. Agency fees are commonly 5% of annual rent.',
  body: [
    'Budget DEWA (electricity and water) and, in many towers, chiller. “All-in” asking rents are rare. Summer vacancy in some communities is real.',
    'This is not Georgia’s daily-rent product. When sivrce lists Dubai rentals they will be tenancy-contract first.',
  ],
  faqs: [
    { q: 'How many cheques?', a: 'One cheque is cheapest; four is common. Monthly standing orders exist but are not universal.' },
    { q: 'Ejari?', a: 'The tenancy must be registered. Unregistered contracts are a dispute nightmare — do not skip it.' },
  ],
}

export const AE_CITIES: Record<string, CityPack> = {
  dubai: city(
    'Dubai',
    'Dubai is the UAE’s liquidity hub: freehold towers, villa communities, and a rental market tied to visas and schools. sivrce starts with a guide — listings as verified inventory lands.',
    [
      'Marina, Downtown, JVC, Business Bay and the villa belts (Arabian Ranches, Palm) are different products. Service charges and DLD fees change the real yield.',
      'Off-plan belongs in RERA escrow. Ready property transfers at the Land Department. sivrce.ae redirects here so the UAE has one canonical URL.',
    ],
    [
      { q: 'Can foreigners buy in Dubai?', a: 'Yes, in designated freehold areas, with a DLD title. Off-plan payments should be in RERA escrow.' },
      { q: 'AED or USD?', a: 'The market quotes dirhams. sivrce’s UAE architecture uses AED as the market currency; do not assume Georgian GEL pricing.' },
    ],
    { buy: dubaiBuy, rent: dubaiRent },
  ),
  'abu-dhabi': city(
    'Abu Dhabi',
    'Abu Dhabi is the UAE capital: slower than Dubai, more villa communities, and a different transfer-fee and planning regime. Not a Dubai clone.',
    [
      'Al Reem, Saadiyat, Yas and the Corniche are distinct books. Government and energy employers dominate demand more than tourism.',
      'Title and fees go through Abu Dhabi’s land authority, not Dubai’s DLD. sivrce keeps a separate page so the two cities do not share a canonical URL.',
    ],
    [
      { q: 'Is Abu Dhabi cheaper than Dubai?', a: 'Often for comparable villas; trophy Saadiyat and Corniche stock is not a bargain bin. Compare communities, not the emirate average.' },
      { q: 'Foreign freehold?', a: 'Yes in designated investment zones. Confirm the plot’s designation before you pay a reservation fee.' },
    ],
  ),
}

export const AE_CITIES_AR: Record<string, CountryCopy> = {
  dubai: {
    title: 'عقارات دبي — تملك حر وإيجار | sivrce',
    description:
      'دبي: مناطق التملك الحر، دائرة الأراضي، حسابات ريرا للمشاريع على المخطط، ورسوم الخدمات.',
    h1: 'العقارات في دبي',
    lede:
      'دبي سوق السيولة في الإمارات. الأجانب يشترون تملكاً حراً في مناطق محددة. الصك من دائرة الأراضي، ودفعات على المخطط في حساب ريرا.',
    body: [
      'المارينا وداون تاون وJVC ومجتمعات الفلل منتجات مختلفة. رسوم الخدمات ورسوم النقل تغيّر العائد الحقيقي.',
      'sivrce.ae يحول إلى sivrce.com/ae/dubai حتى لا تتكرر الصفحة.',
    ],
    faqs: [
      { q: 'هل يمكن للأجانب الشراء؟', a: 'نعم في مناطق التملك الحر مع صك دائرة الأراضي.' },
      { q: 'على المخطط؟', a: 'فقط عبر حساب ضمان ريرا. إن لم يوجد، لا تدفع.' },
    ],
  },
  'abu-dhabi': {
    title: 'عقارات أبوظبي | sivrce',
    description: 'أبوظبي: العاصمة، مجتمعات فلل، ونظام نقل ملكية مختلف عن دبي.',
    h1: 'العقارات في أبوظبي',
    lede:
      'أبوظبي أهدأ من دبي وتعتمد أكثر على وظائف الحكومة والطاقة. ليست نسخة من دبي.',
    body: [
      'الريم والسعديات وياس والكورنيش كتب مختلفة. الرسوم والسلطة العقارية محلية وليست دائرة أراضي دبي.',
    ],
    faqs: [
      { q: 'أرخص من دبي؟', a: 'غالباً للفلل المماثلة؛ السعديات والكورنيش ليسا سوق خصم.' },
      { q: 'تملك حر للأجانب؟', a: 'نعم في مناطق الاستثمار المحددة. تحقق من تصنيف القطعة.' },
    ],
  },
}

export function cityPack(country: string, slug: string): CityPack | null {
  if (country === 'de') return DE_CITIES[slug] ?? null
  if (country === 'ae') return AE_CITIES[slug] ?? null
  if (country in EXTRA_CITIES) return EXTRA_CITIES[country as keyof typeof EXTRA_CITIES][slug] ?? null
  return null
}

export function countrySitemapPaths(country: string): string[] {
  if (!country || !(country in MARKETS) || country === 'ge') return []
  const prefix = MARKETS[country as PathCountryId].pathPrefix
  if (!prefix) return []
  const out = [prefix]
  for (const slug of MARKETS[country as PathCountryId].citySlugs) {
    const pack = cityPack(country, slug)
    if (!pack) continue
    out.push(`${prefix}/${slug}`)
    if (pack.buy) out.push(`${prefix}/${slug}/buy`)
    if (pack.rent) out.push(`${prefix}/${slug}/rent`)
  }
  return out
}

/** Apple-style two-line H1: "Real estate" / "in Germany". Full string stays in title/schema. */
export function heroPair(h1: string): { lead: string; place: string } {
  const inEn = /^Real estate in (.+)$/i.exec(h1)
  if (inEn) return { lead: 'Real estate', place: `in ${inEn[1]}` }
  const cityEn = /^(.+) real estate$/i.exec(h1)
  if (cityEn) return { lead: cityEn[1]!, place: 'real estate' }
  const buy = /^Buy in (.+)$/i.exec(h1)
  if (buy) return { lead: 'Buy', place: `in ${buy[1]}` }
  const rent = /^Rent in (.+)$/i.exec(h1)
  if (rent) return { lead: 'Rent', place: `in ${rent[1]}` }
  const inDe = /^Immobilien in (.+)$/i.exec(h1)
  if (inDe) return { lead: 'Immobilien', place: `in ${inDe[1]}` }
  const kauf = /^Kaufen in (.+)$/i.exec(h1)
  if (kauf) return { lead: 'Kaufen', place: `in ${kauf[1]}` }
  const miet = /^Mieten in (.+)$/i.exec(h1)
  if (miet) return { lead: 'Mieten', place: `in ${miet[1]}` }
  const ar = /^العقارات في (.+)$/.exec(h1)
  if (ar) return { lead: 'العقارات', place: `في ${ar[1]}` }
  return { lead: h1, place: '' }
}
