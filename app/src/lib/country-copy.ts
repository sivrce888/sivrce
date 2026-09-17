/**
 * Unique copy for country hubs / city / buy / rent. English is canonical.
 * Arabic exists only where we wrote real AE copy (no phantom locales).
 */

import { MARKETS, type PathCountryId } from '@/lib/markets'
import { hoodsByCity } from '@/data/world-neighborhoods'
import { EXTRA_CITIES, EXTRA_HUBS, EXTRA_NAMES } from '@/lib/countries/hubs-extra'
import {
  buyerCostBreakdown,
  grossYieldPct,
  type DeCity,
  DE_CITIES as DE_CITY_ROWS,
} from '@/lib/countries/de'

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
    'sivrce in Germany: Berlin-first marketplace for buying and renting apartments, houses, commercial and land. Notary, Grundbuch and transfer tax explained. Prices in EUR.',
  h1: 'Real estate in Germany',
  lede:
    'Search Germany the way you search Georgia: buy or rent, pick a city, open the 3D map. Berlin first — notary, Grundbuch and transfer tax sit under the search. Live listings in EUR, plus street-verified new-builds.',
  body: [
    'Germany is a renter-majority market. Yield investors underwrite vacancy and Mietspiegel rules, not tourist occupancy. Berlin, Hamburg, Munich, Frankfurt and Cologne are the first metros on sivrce; each city page is a unique briefing, not a thin doorway.',
    'A purchase is not a handshake. An independent notary reads the contract, Grunderwerbsteuer (around 6% in Berlin) is due, plus notary and land-register fees. Foreign buyers are not barred from freehold apartments. sivrce publishes listings we can verify to the same standard as Georgia.',
    'Use the city guides for districts, commute and the legal path. The map shows official geometry (ALKIS, B-Plan, StEP Wohnen 2040). Super VIP and VIP+ rails are live inventory — developers and Neubau sit below.',
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
    'Kaufen oder mieten, Stadt wählen, 3D-Karte öffnen. Berlin zuerst — Notar, Grundbuch und Grunderwerbsteuer stehen unter der Suche. Live-Inserate in Euro, plus straßenverifizierte Neubauten.',
  body: [
    'Deutschland ist ein Mietermarkt. Kapitalanleger rechnen mit Leerstand und Mietspiegel, nicht mit Touristenauslastung. Berlin, Hamburg, München, Frankfurt und Köln sind die ersten Metropolen — jede Stadtseite ist ein eigenes Briefing, keine Doorway-Seite.',
    'Ein Kauf ist kein Handschlag. Der Notar verliest den Vertrag, Grunderwerbsteuer (in Berlin 6 %) plus Notar- und Grundbuchkosten werden fällig. Ausländer dürfen Volleigentum erwerben. sivrce veröffentlicht nur Inserate, die sich amtlich belegen lassen — Notar, Grundbuch, Energieausweis.',
    'Stadtguides für Lage, Pendeln und den rechtlichen Weg. Die Karte zeigt amtliche Geometrie (ALKIS, B-Plan, StEP Wohnen 2040). Super-VIP- und VIP+-Schienen sind Live-Inventar — Bauträger und Neubau folgen darunter.',
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
  title: 'UAE real estate — Dubai, Abu Dhabi, Sharjah & RAK | sivrce',
  description:
    'sivrce in the UAE: four emirates, four rulebooks. Dubai freehold at a 4% DLD fee, Abu Dhabi and the north at 2%, Sharjah on a 100-year usufruct. RERA escrow and service charges explained.',
  h1: 'Real estate in the United Arab Emirates',
  lede:
    'The UAE is a federation of separate property regimes priced in dirhams: Dubai issues freehold in designated zones at a 4% Land Department fee, Abu Dhabi and the northern emirates charge 2%, and Sharjah grants a 100-year usufruct rather than a freehold deed. Four emirate guides, not one scraped classifieds dump.',
  body: [
    'Dubai is the liquidity hub: off-plan towers, ready apartments in Marina, Downtown and JVC, and a rental market tied to visas and school calendars. Abu Dhabi is quieter, with more villa communities and its own land authority. Sharjah is the commuter emirate on a different instrument, and Ras Al Khaimah is being repriced by the Al Marjan resort pipeline.',
    'Buying off-plan should go through a RERA-registered escrow account. Ready property transfers at the emirate’s own land authority — Dubai’s DLD is not Abu Dhabi’s DMT and neither is Sharjah’s registration department. There is no annual property tax here, which is why the service charge, quoted per square foot and revised yearly, is the number that decides a yield.',
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
    { q: 'Wann erscheinen Berliner Inserate auf sivrce?', a: 'Live-Inventar steht, sobald Makler und Eigentümer unter denselben Prüfregeln stehen: amtliche Adresse, Energieausweis, nachvollziehbarer Preis.' },
  ],
}

export const DE_BERLIN_BUY_DE: CountryCopy = {
  title: 'Wohnung kaufen in Berlin | sivrce',
  description:
    'Kauf in Berlin: Notar, Grundbuch, 6 % Grunderwerbsteuer, Nebenkosten. Keine erfundenen Angebote.',
  h1: 'Kaufen in Berlin',
  lede:
    'Berlin durchsuchen: Typ, Bezirk, dann die 3D-Karte. Notar, 6 % Grunderwerbsteuer und Grundbuch stehen unter der Suche. Ausländer dürfen kaufen.',
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
    'Kurzzeit steht unter eigenen Regeln — Touristensteuer, Mindestaufenthalt, keine Parties. Langzeitmiete bleibt das Berliner Normalmodell: unbefristet, unmöbliert, Mietspiegel.',
  ],
  faqs: [
    { q: 'Wie hoch darf die Kaution in Berlin sein?', a: 'In der Regel bis zu drei Kaltmieten, getrennt angelegt (§551 BGB). Mehr ist keine Marktausnahme.' },
    { q: 'Kann ich ohne SCHUFA mieten?', a: 'Manche Vermieter akzeptieren Alternativen (Arbeitgeber, höhere Kaution, Sperrkonto). Viele nicht. Zeit einplanen.' },
  ],
}

/** Native German hub — München. */
export const DE_MUNICH_HUB_DE: CountryCopy = {
  title: 'Immobilien München — Kauf & Miete | sivrce',
  description:
    'München: teuerster Wohnungsmarkt Deutschlands. Notar, Grundbuch, 3,5 % Grunderwerbsteuer (Bayern). sivrce zeigt verifizierte Neubauten — keine erfundenen Inserate.',
  h1: 'Immobilien in München',
  lede:
    'München durchsuchen: kaufen oder mieten oben, dann die 3D-Karte. Enges Angebot, hohe Nachfrage — Notar und Grundbuch bleiben das Kaufmodell, auch hier.',
  body: [
    'München ist Deutschlands teuerster Markt: knappes Bauland an der Isar, BMW, Siemens und ein tiefer Arbeitsmarkt halten die Nachfrage hoch. Altstadt-Lehel und Maxvorstadt sind die Spitzenlagen, Schwabing und das Glockenbachviertel ziehen jüngere Mieter.',
    'Bayern erhebt die niedrigste Grunderwerbsteuer im Bundesvergleich (3,5 %) — Notar und Grundbucheintragung kommen trotzdem oben drauf, wie überall in Deutschland.',
    'sivrce veröffentlicht in München nur, was sich amtlich belegen lässt — Notar, Grundbuch, Energieausweis.',
  ],
  faqs: [
    { q: 'Warum ist München so teuer?', a: 'Hohe Löhne, knappes Bauland und anhaltender Zuzug. Der Leerstand ist niedrig, deshalb bleiben Mieten stabil, auch wenn die Rendite gering wirkt.' },
    { q: 'Dürfen Ausländer in München kaufen?', a: 'Ja. Kein Staatsangehörigkeitsverbot — derselbe notarielle Weg wie im Rest Deutschlands.' },
  ],
}

export const DE_MUNICH_BUY_DE: CountryCopy = {
  title: 'Wohnung kaufen in München — 3,5 % Grunderwerbsteuer & Lagen | sivrce',
  description:
    'Kauf in München: Bayerns günstige 3,5 % Grunderwerbsteuer, Notarablauf, Grundbucheintrag und Renditen von Schwabing bis Bogenhausen.',
  h1: 'Kaufen in München',
  lede:
    'Münchener Eigentumswohnungen durchsuchen: Typ, Stadtviertel, dann 3D-Karte. Bayerns bundesweit niedrigste Grunderwerbsteuer (3,5 %) und notarieller Eigentumsübergang im Überblick.',
  body: [
    'Bayern hält die Grunderwerbsteuer bei 3,5 % — der niedrigste Steuersatz aller Bundesländer. Mit Notar- und Grundbuchgebühren liegen die gesetzlichen Kaufnebenkosten bei ca. 5,0–5,5 % vor etwaiger Maklerprovision.',
    'Altstadt-Lehel, Maxvorstadt, Bogenhausen und Schwabing bilden das Hochpreissegment. Geringe Leerstandsquoten und erstklassige Mieterbonität (DAX-Konzerne, Tech-Hubs, Universitäten) sorgen für verlässliche Cashflows trotz komprimierter Anfangsrenditen.',
  ],
  faqs: [
    {
      q: 'Warum lohnt sich der Immobilienkauf in München trotz hoher Quadratmeterpreise?',
      a: 'München profitiert von kontinuierlichem Zuzug qualifizierter Fachkräfte, minimalem Leerstand (< 0,5 %) und hoher Wertbeständigkeit bei der niedrigsten Grunderwerbsteuer Deutschlands (3,5 %).',
    },
    {
      q: 'Wie läuft die Kaufabwicklung beim Münchner Notar ab?',
      a: 'Der Notar verliest den vollständigen Kaufvertrag, beurkundet die Einigung, veranlasst die Auflassungsvormerkung im Grundbuch und fordert den Kaufpreis erst nach Absicherung der Fälligkeitsvoraussetzungen an.',
    },
  ],
}

export const DE_MUNICH_RENT_DE: CountryCopy = {
  title: 'Wohnung mieten in München — Mietspiegel & Kaution | sivrce',
  description:
    'Mieten in München: Münchner Mietspiegel, Kaution, SCHUFA-Bonitätsnachweis und Stadtviertelvergleich. Verifizierte Mietangebote.',
  h1: 'Mieten in München',
  lede:
    'München ist Deutschlands anspruchsvollster Mietmarkt. Mietverträge orientieren sich am qualifizierten Münchner Mietspiegel mit strengem Mieterschutz nach BGB.',
  body: [
    'Wohnungsbesichtigungen in München erfordern vollständige Bewerbungsunterlagen: SCHUFA-Bonitätsauskunft, Selbstauskunft, Einkommensnachweise und Vorvermieterbestätigung.',
    'Die Kaution beträgt maximal drei Nettokaltmieten (§ 551 BGB), die auf einem insolvenzfesten Mietkautionskonto verwahrt werden müssen. Die Mietpreisbremse findet im gesamten Stadtgebiet Anwendung.',
  ],
  faqs: [
    {
      q: 'Welche Unterlagen verlangen Vermieter in München?',
      a: 'Standard sind: ausgefüllte Mieterselbstauskunft, aktuelle SCHUFA-Auskunft, Gehaltsnachweise der letzten 3 Monate und Nachweis über Mietschuldenfreiheit.',
    },
    {
      q: 'Was ist der Unterschied zwischen Kaltmiete und Gesamtmiete?',
      a: 'Die Kaltmiete (Nettokaltmiete) vergütet den Wohnraum. Die Gesamtmiete (Warmmiete) beinhaltet monatliche Betriebskosten- und Heizkostenvorauszahlungen.',
    },
  ],
}

/** Native German hub — Hamburg. */
export const DE_HAMBURG_HUB_DE: CountryCopy = {
  title: 'Immobilien Hamburg — Kauf & Miete | sivrce',
  description:
    'Hamburg: Hafenstadt an der Elbe, teurer als Berlin, günstiger als München. Notar, Grundbuch, 5,5 % Grunderwerbsteuer. Verifizierte Neubauten, keine erfundenen Inserate.',
  h1: 'Immobilien in Hamburg',
  lede:
    'Hamburg durchsuchen: kaufen oder mieten oben, dann die 3D-Karte. Hafen, Medien und Luftfahrt tragen die Nachfrage — der Kaufweg bleibt notariell wie überall in Deutschland.',
  body: [
    'Der Hafen, Medienunternehmen und die Luftfahrtindustrie treiben die Nachfrage. HafenCity und Blankenese liegen an der Spitze, Eimsbüttel und Wandsbek sind die Familienlagen mit mehr Fläche fürs Geld.',
    'Hamburgs Grunderwerbsteuer liegt bei 5,5 % — Notar und Grundbucheintragung kommen wie in ganz Deutschland hinzu.',
    'sivrce veröffentlicht Hamburger Inserate, sobald sie sich amtlich belegen lassen — Notar, Grundbuch, Energieausweis.',
  ],
  faqs: [
    { q: 'Ist Hamburg teurer als Berlin?', a: 'In der Regel ja pro Quadratmeter, aber günstiger als München. Wasserlagen und HafenCity markieren die Spitze.' },
    { q: 'Dürfen Ausländer in Hamburg kaufen?', a: 'Ja — derselbe notarielle Ablauf wie im übrigen Deutschland.' },
  ],
}

export const DE_HAMBURG_BUY_DE: CountryCopy = {
  title: 'Wohnung kaufen in Hamburg — Grunderwerbsteuer & Lagen | sivrce',
  description:
    'Kauf in Hamburg: 5,5 % Grunderwerbsteuer, Notar, Grundbuch und Quartierspreise von HafenCity bis Eimsbüttel. Verifizierte Angebote.',
  h1: 'Kaufen in Hamburg',
  lede:
    'Hamburgs Kaufmarkt durchsuchen: Eigentumswohnungen nach Stadtteil, Typ und 3D-Karte. Notar, 5,5 % Grunderwerbsteuer und Grundbuch stehen unter der Suche.',
  body: [
    'Hamburg erhebt 5,5 % Grunderwerbsteuer. Notar- und Grundbuchkosten schlagen mit rund 1,5–2,0 % zu Buche, sodass die Kaufnebenkosten vor Maklerprovision bei etwa 7–8 % liegen. Eigentum geht mit der Umschreibung im Grundbuch über.',
    'HafenCity, Harvestehude und Blankenese markieren das Premiumsegment; Eimsbüttel, Winterhude und Altona bieten lebendige innerstädtische Quartiere mit stabiler Wertentwicklung. Für Lagen an Elbe und Alsterkanälen sind Hochwasserschutz und Deichverbandsbeiträge relevant.',
  ],
  faqs: [
    {
      q: 'Wie hoch ist die Grunderwerbsteuer in Hamburg?',
      a: 'Hamburg erhebt 5,5 % Grunderwerbsteuer auf den notariell beurkundeten Kaufpreis, fällig nach Erhalt des Steuerbescheids vom Finanzamt Hamburg (ca. 4–6 Wochen nach Beurkundung).',
    },
    {
      q: 'Dürfen Nicht-EU-Bürger in Hamburg Eigentum erwerben?',
      a: 'Ja. Das deutsche Immobilienrecht unterscheidet nicht nach Staatsangehörigkeit. Ausländische Käufer durchlaufen die standardmäßige Identitätsprüfung (GwG) beim Notar.',
    },
  ],
}

export const DE_HAMBURG_RENT_DE: CountryCopy = {
  title: 'Wohnung mieten in Hamburg — Mietenspiegel & Kaution | sivrce',
  description:
    'Mieten in Hamburg: Hamburger Mietenspiegel, Mietkaution nach §551 BGB, Kalt- und Warmmiete sowie Mietpreisbremse. Verifizierte Langzeitmieten.',
  h1: 'Mieten in Hamburg',
  lede:
    'Hamburg ist ein nachfragestarker Mietmarkt unter dem Hamburger Mietenspiegel. Die Kaution ist gesetzlich auf drei Nettokaltmieten gedeckelt, Standardverträge sind unbefristet.',
  body: [
    'Die Kaltmiete deckt die reine Raumnutzung; Nebenkosten für Heizung, Wasser und Gebäudereinigung werden als monatliche Vorauszahlung geleistet und jährlich per Betriebskostenabrechnung abgerechnet.',
    'Vermieter verlangen üblicherweise SCHUFA-Auskunft, die letzten drei Gehaltsnachweise sowie eine Mietschuldenfreiheitsbescheinigung. In neueren Objekten sind Index- oder Staffelmietvereinbarungen verbreitet.',
  ],
  faqs: [
    {
      q: 'Wie hoch darf die Kaution in Hamburg sein?',
      a: 'Gemäß § 551 BGB darf die Mietkaution maximal das Dreifache der monatlichen Nettokaltmiete betragen und kann in drei gleichen Monatsraten gezahlt werden.',
    },
    {
      q: 'Gilt die Mietpreisbremse in Hamburg?',
      a: 'Ja, Hamburg hat das gesamte Stadtgebiet als angespannten Wohnungsmarkt ausgewiesen. Wiedervermietungsmieten dürfen maximal 10 % über der ortsüblichen Vergleichsmiete liegen (Ausnahme: Neubau nach Okt. 2014).',
    },
  ],
}

/** Native German hub — Frankfurt am Main. */
export const DE_FRANKFURT_HUB_DE: CountryCopy = {
  title: 'Immobilien Frankfurt — Bankenviertel, Westend, Kauf & Miete | sivrce',
  description:
    'Frankfurt am Main: Finanzzentrum, EZB, Notar, Grundbuch, 6,0 % Grunderwerbsteuer (Hessen). Verifizierte Neubauten und Markttransparenz.',
  h1: 'Immobilien in Frankfurt',
  lede:
    'Frankfurt durchsuchen: kaufen oder mieten oben, dann 3D-Karte. Bankenviertel, Westend und Sachsenhausen — Notar und Grundbuch bleiben das Kaufmodell.',
  body: [
    'Frankfurt ist das kontinentaleuropäische Finanzzentrum: EZB, Bundesbank, Großbanken und der Flughafen prägen die kaufkräftige Nachfrage nach hochwertigen City-Wohnungen und Neubauprojekten.',
    'Hessen erhebt 6,0 % Grunderwerbsteuer. Notar und Grundbucheintragung schließen den Kauf rechtskräftig ab.',
    'sivrce veröffentlicht in Frankfurt nur verifizierte Objekte — amtliche Adresse, Energieausweis, nachvollziehbarer Preis.',
  ],
  faqs: [
    { q: 'Ist Frankfurt nur für Banker attraktiv?', a: 'Nein. Neben dem Bankensektor sorgen IT-, Beratungs- und Kreativbranchen sowie internationale Institutionen für eine breite, liquide Mieternachfrage.' },
    { q: 'Wie hoch sind die Kaufnebenkosten in Frankfurt?', a: 'Rund 7,5–8,0 % gesetzliche Nebenkosten (6,0 % Grunderwerbsteuer + 1,5 % Notar/Grundbuch), zzgl. ggf. 3,57 % Makleranteil.' },
  ],
}

export const DE_FRANKFURT_BUY_DE: CountryCopy = {
  title: 'Wohnung kaufen in Frankfurt — 6,0 % Grunderwerbsteuer & Lagen | sivrce',
  description:
    'Kauf in Frankfurt: 6,0 % Grunderwerbsteuer (Hessen), Notar, Grundbuch, Bauträgerverordnung (MaBV) und Lagen von Westend bis Sachsenhausen.',
  h1: 'Kaufen in Frankfurt',
  lede:
    'Frankfurter Eigentumswohnungen durchsuchen: Typ, Stadtteil, dann 3D-Karte. Hessens 6,0 % Grunderwerbsteuer und notarielle Absicherung nach BGB und MaBV.',
  body: [
    'In Hessen beträgt die Grunderwerbsteuer 6,0 %. Zusammen mit Notar- und Grundbuchgebühren (ca. 1,5–2,0 %) ergeben sich gesetzliche Erwerbsnebenkosten von rund 7,5–8,0 % vor Vermittlungsprovision.',
    'Westend, Nordend, Holzhausenviertel und Sachsenhausen bilden die gefragtesten Wohnlagen. Neubauprojekte unterliegen der Makler- und Bauträgerverordnung (MaBV), die Ratenzahlungen an den Baufortschritt bindet.',
  ],
  faqs: [
    {
      q: 'Sind Neubauprojekte in Frankfurt für Anleger sicher abgesichert?',
      a: 'Ja. Deutsche Bauträgerprojekte sind durch die MaBV streng reguliert: Zahlungen erfolgen ausschließlich nach testierten Bauabschnitten oder gegen Fertigstellungsbürgschaft.',
    },
    {
      q: 'Welche Stadtteile in Frankfurt bieten beste Vermietbarkeit?',
      a: 'Westend, Nordend, Bornheim, Sachsenhausen und das Europaviertel verfügen über höchste Vermietungsquoten bei überdurchschnittlichen Quadratmetermieten.',
    },
  ],
}

export const DE_FRANKFURT_RENT_DE: CountryCopy = {
  title: 'Wohnung mieten in Frankfurt — Mietspiegel & Warmmiete | sivrce',
  description:
    'Mieten in Frankfurt: Frankfurter Mietspiegel, Kalt- und Warmmiete, Kaution nach BGB und Stadtteilübersicht. Verifizierte Mietangebote.',
  h1: 'Mieten in Frankfurt',
  lede:
    'Frankfurt ist ein international geprägter Mietmarkt mit hoher Fluktuation und solider Nachfrage nach möbliertem und unmöbliertem Wohnraum unter dem Frankfurter Mietspiegel.',
  body: [
    'Die Nachfrage nach modernen Wohnungen im Einzugsbereich von Bankenviertel, Westend und Hauptbahnhof ist kontinuierlich hoch. Für unbefristete Standardmietverträge gilt das deutsche Mietrecht mit drei Monaten gesetzlicher Kündigungsfrist für Mieter.',
    'Die Mietkaution ist auf drei Nettokaltmieten limitiert (§ 551 BGB). Nebenkostenvorauszahlungen werden nach Heizkostenverordnung und Betriebskostenverordnung jährlich präzise abgerechnet.',
  ],
  faqs: [
    {
      q: 'Können Expats vor ihrem Umzug nach Frankfurt mieten?',
      a: 'Ja, häufig über Firmenrelocation-Verträge oder zunächst über temporäres möbliertes Wohnen (Wohnen auf Zeit) bis zum Einzug in ein unbefristetes Mietverhältnis.',
    },
    {
      q: 'Was regelt der Frankfurter Mietspiegel?',
      a: 'Der Frankfurter Mietspiegel liefert die amtliche Übersicht der ortsüblichen Vergleichsmieten differenziert nach Baujahr, Wohnfläche, Ausstattung und Lage.',
    },
  ],
}

/** Native German hub — Köln. */
export const DE_COLOGNE_HUB_DE: CountryCopy = {
  title: 'Immobilien Köln — Belgisches Viertel, Ehrenfeld, Kauf & Miete | sivrce',
  description:
    'Köln: Millionenstadt am Rhein, Notar, Grundbuch, 6,5 % Grunderwerbsteuer (NRW). Verifizierte Neubauten und Marktübersicht.',
  h1: 'Immobilien in Köln',
  lede:
    'Köln durchsuchen: kaufen oder mieten oben, dann 3D-Karte. Belgisches Viertel, Ehrenfeld, Lindenthal und Deutz — Notar und Grundbuch bilden das Kaufmodell.',
  body: [
    'Köln ist die bevölkerungsreichste Stadt Nordrhein-Westfalens mit lebendiger Medien-, Hochschul- und Unternehmenslandschaft. Die Rheinschiene Köln–Düsseldorf bildet eine zusammenhängende Wirtschaftsregion.',
    'In NRW gilt eine Grunderwerbsteuer von 6,5 %. Der Eigentumserwerb erfolgt über Notarbeurkundung und Grundbucheintragung.',
    'sivrce erfasst Kölner Projekte und Inserate nach strengen Transparenzkriterien ohne unvollständige Lockangebote.',
  ],
  faqs: [
    { q: 'Welche Kölner Veedel sind bei Mietern besonders beliebt?', a: 'Ehrenfeld, Nippes und das Belgische Viertel ziehen junge Berufstätige und Studierende an; Lindenthal, Sülz und Marienburg sind gefragte Familienlagen.' },
    { q: 'Dürfen Ausländer in Köln Eigentum kaufen?', a: 'Ja, uneingeschränkt über denselben notariellen Weg wie deutsche Staatsbürger.' },
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

const hamburgBuy: CountryCopy = {
  title: 'Buy an apartment in Hamburg | sivrce',
  description:
    'Buying in Hamburg: 5.5% Grunderwerbsteuer, notary, Grundbuch, and neighborhood pricing from HafenCity to Eimsbüttel. sivrce verified inventory.',
  h1: 'Buy in Hamburg',
  lede:
    'Search Hamburg apartments for sale: type, district, then the 3D map. Notary, 5.5% Grunderwerbsteuer and Grundbuch sit under the search. Foreign buyers are allowed.',
  body: [
    'Hamburg applies a 5.5% property transfer tax (Grunderwerbsteuer). Notary and land-registry fees add roughly 1.5–2.0%, bringing buyer closing costs to around 7–8% before any broker fee. The contract is executed before a notary and legal ownership transfers upon Grundbuch registration.',
    'HafenCity and Harvestehude command prime price tags, while Eimsbüttel, Winterhude and Altona provide family-focused and mixed residential stock. Check flood zoning and polder associations (Deichverbände) for properties close to the Elbe and Alster canals.',
  ],
  faqs: [
    {
      q: 'What is the transfer tax rate in Hamburg?',
      a: 'Hamburg levies a 5.5% Grunderwerbsteuer on the notarised purchase price, payable directly to the Finanzamt Hamburg within roughly 4–6 weeks of contract signing.',
    },
    {
      q: 'Can non-residents buy freehold property in Hamburg?',
      a: 'Yes. Germany imposes no nationality restrictions on residential freehold ownership. Non-residents undergo standard KYC and AML identification before the notary.',
    },
  ],
}

const hamburgRent: CountryCopy = {
  title: 'Rent an apartment in Hamburg | sivrce',
  description:
    'Renting in Hamburg: Mietenspiegel, deposit caps (§551 BGB), Kaltmiete vs Warmmiete, and district tenancy trends. sivrce long-term rentals.',
  h1: 'Rent in Hamburg',
  lede:
    'Hamburg is a high-demand rental market governed by the Hamburger Mietenspiegel. Deposits are capped at 3 months cold rent, and standard leases are open-ended.',
  body: [
    'Most leases in Hamburg are unfurnished and indefinite. Cold rent (Kaltmiete) covers the space; heating and operating costs (Nebenkosten) are paid monthly as an advance and settled annually via the Betriebskostenabrechnung.',
    'Tenants must provide SCHUFA credit records, 3 months of salary slips, and landlord references (Mietschuldenfreiheitsbescheinigung). Indexmiete (inflation-linked) and Staffelmiete (scheduled step increases) are common in newer buildings.',
  ],
  faqs: [
    {
      q: 'How much deposit is legal in Hamburg?',
      a: 'Under §551 BGB, the security deposit (Mietkaution) cannot exceed three months cold rent (Nettokaltmiete), payable in three equal monthly instalments.',
    },
    {
      q: 'Does the rent cap (Mietpreisbremse) apply in Hamburg?',
      a: 'Yes. Hamburg enforces the rent brake across the entire city territory, capping new leases at a maximum of 10% above the local comparative rent (Mietenspiegel), with exemptions for newly constructed buildings (first use after Oct 2014).',
    },
  ],
}

const munichBuy: CountryCopy = {
  title: 'Buy an apartment in Munich | sivrce',
  description:
    'Buying in Munich: Bavaria’s 3.5% Grunderwerbsteuer (lowest in Germany), notary, Grundbuch, and district yields from Schwabing to Bogenhausen.',
  h1: 'Buy in Munich',
  lede:
    'Search Munich property for sale: Bavaria offers Germany’s lowest transfer tax at 3.5%. Notary, Grundbuch, and prime district dynamics sit under the search.',
  body: [
    'Bavaria charges 3.5% Grunderwerbsteuer — the lowest rate among all German federal states. With notary and Grundbuch registration adding roughly 1.5%, total buyer ancillary costs start at just ~5% before broker commission.',
    'Munich is Germany’s premier capital-preservation market. Yields in Altstadt-Lehel, Maxvorstadt and Schwabing average 2.5–3.2% gross, backed by global corporate headquarters (BMW, Siemens, Allianz) and structural housing supply constraints.',
  ],
  faqs: [
    {
      q: 'Why are ancillary purchase costs lower in Munich?',
      a: 'Bavaria maintains a 3.5% Grunderwerbsteuer, compared to 6.0% in Berlin and 6.5% in North Rhine-Westphalia, saving buyers tens of thousands of euros on closing.',
    },
    {
      q: 'Is Munich property suitable for yield or capital growth?',
      a: 'Munich is primarily a wealth-preservation and long-term equity growth market. Low vacancy rates (<0.3%) ensure dependable occupancy and stable rental cashflow.',
    },
  ],
}

const munichRent: CountryCopy = {
  title: 'Rent an apartment in Munich | sivrce',
  description:
    'Renting in Munich: Münchner Mietspiegel, 3 months deposit cap, documentation checklist, and neighborhood rental profiles.',
  h1: 'Rent in Munich',
  lede:
    'Munich is Germany’s tightest rental market. Vacancies are under 0.5%, leases are open-ended, and asking rents are benchmarked against the Münchner Mietspiegel.',
  body: [
    'Rental demand in Munich is exceptionally competitive. Standard application files (Bewerbungsmappe) require SCHUFA credit reports, employment contracts, identity verification, and proof of income.',
    'Contracts distinguish clearly between Nettokaltmiete and Warmmiete. Shared apartments (WGs) and furnished corporate flats exist, but unfurnished open-ended contracts remain the gold standard for long-term residents.',
  ],
  faqs: [
    {
      q: 'What documents are required to rent an apartment in Munich?',
      a: 'Landlords expect a complete application package: photo ID, last 3 salary statements, SCHUFA-Bonitätsauskunft, and a debt-free confirmation from your previous landlord.',
    },
    {
      q: 'How does the Munich rent index work?',
      a: 'The Münchner Mietspiegel sets official reference rents based on location, building age, energy performance, and interior amenities, updated biennially.',
    },
  ],
}

const frankfurtBuy: CountryCopy = {
  title: 'Buy an apartment in Frankfurt | sivrce',
  description:
    'Buying in Frankfurt: 6.0% Hessen Grunderwerbsteuer, notary process, financial district towers, and residential belts from Westend to Sachsenhausen.',
  h1: 'Buy in Frankfurt',
  lede:
    'Search Frankfurt real estate for sale: financial district skyline, Westend villas, and suburban commuter belts. Notary, 6.0% transfer tax, and Grundbuch details.',
  body: [
    'Hesse imposes a 6.0% Grunderwerbsteuer. Notary and land-registry fees add roughly 1.5–2.0%. Frankfurt offers liquid 1- to 3-room apartments popular with banking, ECB, and management consulting professionals.',
    'Westend, Holzhausenviertel, and Diplonatenviertel represent the high-end freehold segment, while Sachsenhausen, Nordend, and Bornheim provide lively urban character with strong tenant retention.',
  ],
  faqs: [
    {
      q: 'What are the total buyer closing costs in Frankfurt?',
      a: 'Expect roughly 7.5–8.0% in statutory closing costs (6.0% transfer tax + 1.5% notary/registry), plus buyer broker commission (up to 3.57% incl. VAT) when applicable.',
    },
    {
      q: 'Is Frankfurt off-plan property safe for foreign investors?',
      a: 'Yes. German developer projects are strictly regulated by the Makler- und Bauträgerverordnung (MaBV), ensuring payments are released only upon certified construction milestones.',
    },
  ],
}

const frankfurtRent: CountryCopy = {
  title: 'Rent an apartment in Frankfurt | sivrce',
  description:
    'Renting in Frankfurt: banking hub rental demand, Frankfurter Mietspiegel, corporate furnished vs long-term unfurnished leases.',
  h1: 'Rent in Frankfurt',
  lede:
    'Frankfurt is Germany’s financial capital with high corporate mobility, steady expat inflows, and strong rental yields across inner and commuter districts.',
  body: [
    'Frankfurt exhibits high demand for high-spec apartments near the banking quarter (Bankenviertel), Westend, and the central train corridor. Corporate leases and furnished flats command premium yields.',
    'Standard private tenancies follow German federal tenancy law with open-ended contracts, three months statutory notice for tenants, and deposit caps at three months cold rent.',
  ],
  faqs: [
    {
      q: 'Can expats rent an apartment in Frankfurt before relocating?',
      a: 'Yes, often through corporate relocation agreements or initial temporary furnished housing (Wohnen auf Zeit) before transitioning to an open-ended private lease.',
    },
    {
      q: 'What is the difference between Kaltmiete and Warmmiete in Frankfurt?',
      a: 'Kaltmiete is the net base rent for the premises. Warmmiete includes advance payments for heating, water, refuse collection, and communal building maintenance.',
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
    { buy: hamburgBuy, rent: hamburgRent },
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
    { buy: munichBuy, rent: munichRent },
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
    { buy: frankfurtBuy, rent: frankfurtRent },
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

const abuDhabiBuy: CountryCopy = {
  title: 'Buy property in Abu Dhabi | sivrce',
  description:
    'Buying in Abu Dhabi: investment zones (Saadiyat, Yas, Al Reem), 2% DMT registration fee, TAMM digital deed, and Golden Visa eligibility.',
  h1: 'Buy in Abu Dhabi',
  lede:
    'Foreigners can purchase freehold property in designated Abu Dhabi investment zones with title registered by the Department of Municipalities and Transport (DMT).',
  body: [
    'Abu Dhabi charges a 2% municipal registration fee on property transfers — half of Dubai’s 4% Land Department rate. Freehold is designated in world-class master developments including Saadiyat Island (cultural district), Yas Island (entertainment), Al Reem Island, and Al Raha Beach.',
    'Off-plan purchases are secured under Law No. 3 of 2015 via escrow accounts supervised by the DMT. Properties valued at AED 2M+ ($545k) qualify foreign investors for the 10-year UAE Golden Visa.',
  ],
  faqs: [
    {
      q: 'Which areas in Abu Dhabi allow 100% foreign freehold ownership?',
      a: 'Foreigners can buy freehold in designated investment zones: Saadiyat Island, Yas Island, Al Reem Island, Al Maryah Island, Al Raha Beach, Masdar City, and Nurai Island.',
    },
    {
      q: 'What is the property transfer fee in Abu Dhabi?',
      a: 'The transfer fee is 2% of the purchase price, paid to the Department of Municipalities and Transport (DMT), usually split 1% buyer and 1% seller or as agreed in Form F.',
    },
  ],
}

const abuDhabiRent: CountryCopy = {
  title: 'Rent in Abu Dhabi | sivrce',
  description:
    'Renting in Abu Dhabi: Tawtheeq lease registration, payment cheques, ADDC utilities, and 5% municipal housing fee for expats.',
  h1: 'Rent in Abu Dhabi',
  lede:
    'Renting in Abu Dhabi requires official Tawtheeq registration through the Department of Municipalities and Transport. Leases are typically annual and paid via post-dated cheques.',
  body: [
    'Every residential lease must be registered on the Tawtheeq municipal system to activate electricity and water with ADDC and secure residency visas. Expats pay a 5% municipal housing fee based on the annual rent, spread across monthly utility bills.',
    'Abu Dhabi offers high tenant stability, with long-term residents anchored by federal government institutions, ADNOC and energy majors, aviation, and global universities (NYU Abu Dhabi, Sorbonne).',
  ],
  faqs: [
    {
      q: 'What is Tawtheeq and why is it mandatory?',
      a: 'Tawtheeq is the official tenancy registration system in Abu Dhabi. It validates the tenancy contract, establishes tenant rights, and is mandatory for family visa sponsorship and utility connections.',
    },
    {
      q: 'How is rent paid in Abu Dhabi?',
      a: 'Rent is traditionally paid using 1 to 4 post-dated cheques. Direct debit and monthly digital payment setups are increasingly offered in institutional developer portfolios.',
    },
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
    { buy: abuDhabiBuy, rent: abuDhabiRent },
  ),
  sharjah: city(
    'Sharjah',
    'Sharjah is the commuter emirate with its own land department and its own instrument: foreigners buy a 100-year usufruct in designated areas, not the freehold title Dubai issues.',
    [
      'That distinction is the whole page. A Sharjah usufruct is a long lease of ownership rights registered with the Sharjah Real Estate Registration Department — renewable, mortgageable and sellable, but not a Dubai-style freehold deed. Read which instrument the contract actually grants.',
      'Aljada, Maryam Island and Tilal City are the master-planned developments driving foreign interest. Rents run well below Dubai for comparable size, which is why a large share of Dubai\u2019s workforce lives here and commutes — and why the E11 traffic is a genuine amenity question.',
      'Sharjah is a dry emirate with its own decency regulations. That is a lifestyle variable for a tenant and therefore a leasing variable for a landlord.',
    ],
    [
      { q: 'Is it freehold like Dubai?', a: 'Usually not. Non-GCC buyers typically receive a 100-year usufruct in designated zones rather than an absolute freehold deed. Confirm the instrument on the contract before you compare prices with Dubai.' },
      { q: 'Cheaper than Dubai?', a: 'Materially, for comparable space. The trade is thinner resale liquidity, a smaller buyer pool and a commute if the job is in Dubai.' },
    ],
  ),
  'ras-al-khaimah': city(
    'Ras Al Khaimah',
    'Ras Al Khaimah is the northern emirate being repriced by one project: the Wynn integrated resort on Al Marjan Island, the first licensed casino in the UAE.',
    [
      'Al Marjan Island land values and off-plan launch pricing moved sharply after the Wynn announcement, with the resort targeted to open in 2027. Underwrite that as a construction-and-opening schedule with execution risk, not as a completed amenity.',
      'RAK offers genuine foreign freehold in designated areas at a 2% transfer fee against Dubai\u2019s 4%, and the emirate has its own municipality registration rather than the DLD. Al Hamra and Mina Al Arab are the established communities; the Hajar mountains and Jebel Jais are the non-beach draw.',
      'Liquidity is the constraint. This is a thinner market than Dubai in both directions — fewer buyers on the way in, and fewer on the way out.',
    ],
    [
      { q: 'Can foreigners own freehold here?', a: 'Yes, in designated investment areas, registered with RAK Municipality. Confirm the plot designation before you pay a reservation fee.' },
      { q: 'Is the casino actually happening?', a: 'The licence and the Wynn Al Marjan project are real and under construction, targeted for 2027. Treat the opening date and the demand it implies as a forecast, not a delivered fact.' },
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

/**
 * Data-driven packs for the non-flagship Großstädte: every sentence is
 * computed from DE_CITIES anchors (tax, €/m², yield, notary math) — real
 * per-city numbers, no invented local colour. Hand-written packs above stay
 * canonical; add a hand-written pack when a city earns buy/rent pages.
 */
function generatedDePack(c: DeCity): CityPack {
  const pct = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1 })
  const buy = c.buyEurSqm.toLocaleString('en-US')
  const rent = c.rentEurSqm.toLocaleString('en-US')
  const y = grossYieldPct(c)
  const ex = buyerCostBreakdown(500_000, c.slug)
  const extras = ex
    ? `€${(ex.transferTax + ex.notary + ex.register).toLocaleString('en-US')}`
    : '≈8% of the price'
  return city(
    c.de,
    `${c.de} sits in ${c.state} on sivrce's Germany map — existing-stock buy anchors near €${buy}/m², cold rents near €${rent}/m² (≈${pct(y)}% gross) and a ${pct(c.transferTaxPct)}% Grunderwerbsteuer set by state law.`,
    [
      `The local numbers first: buy level around €${buy}/m², cold rent around €${rent}/m² — roughly a ${pct(y)}% gross yield before costs. ${c.state} charges ${pct(c.transferTaxPct)}% Grunderwerbsteuer, so a €500,000 purchase adds about ${extras} in transfer tax, notary and Grundbuch before any agent fee.`,
      'Listings are added as verified local agents join, under the same rules as the Georgia marketplace — this page is the orientation layer with real anchors, not scraped doorway text.',
    ],
    [
      {
        q: `Can foreigners buy in ${c.de}?`,
        a: 'Yes — Germany imposes no nationality restriction. Every purchase runs through a notary and ends in the Grundbuch (land register); budget roughly 8–12% on top of the price.',
      },
      {
        q: `What does a purchase cost in ${c.de}?`,
        a: `${c.state} charges ${pct(c.transferTaxPct)}% Grunderwerbsteuer, plus ≈1.5% notary and ≈0.5% land register; where an agent is involved, the buyer share is 3.57% incl. VAT.`,
      },
    ],
  )
}

/** Native German packs for `/de/de/{city}` — handwritten flagships stay
 *  canonical; every other Großstadt is generated from DE_CITIES anchors
 *  (tax, €/m², yield) so German visitors never land on English copy. */
function generatedDePackDe(c: DeCity): CityPack {
  const pct = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const buy = c.buyEurSqm.toLocaleString('de-DE')
  const rent = c.rentEurSqm.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const y = pct(grossYieldPct(c))
  const ex = buyerCostBreakdown(500_000, c.slug)
  const extras = ex
    ? `${(ex.transferTax + ex.notary + ex.register).toLocaleString('de-DE')} €`
    : 'rund 8 % des Kaufpreises'
  return {
    name: c.de,
    hub: {
      title: `Immobilien ${c.de} — Kauf & Miete | sivrce`,
      description: `${c.de} (${c.state}): kaufen und mieten mit Notar, Grundbuch und ${pct(c.transferTaxPct)} % Grunderwerbsteuer. Bestandsmarken ${buy} €/m² Kauf, ${rent} €/m² Kaltmiete.`,
      h1: `Immobilien in ${c.de}`,
      lede: `${c.de} liegt in ${c.state} auf der sivrce-Deutschlandkarte — Bestandskauf um ${buy} €/m², Kaltmiete um ${rent} €/m² (ca. ${y} % Brutto) und ${pct(c.transferTaxPct)} % Grunderwerbsteuer nach Landesrecht.`,
      body: [
        `Die lokalen Zahlen zuerst: Kaufniveau rund ${buy} €/m², Kaltmiete rund ${rent} €/m² — grob ${y} % Bruttomietrendite vor Kosten. ${c.state} erhebt ${pct(c.transferTaxPct)} % Grunderwerbsteuer; bei 500.000 € Kaufpreis kommen etwa ${extras} für Steuer, Notar und Grundbuch vor einer Maklerzeile dazu.`,
        `Inserate in ${c.de} erscheinen, sobald sie sich amtlich belegen lassen — Notar, Grundbuch, Energieausweis. Diese Seite ist die Orientierung mit echten Ankern, kein Doorway-Text.`,
      ],
      faqs: [
        {
          q: `Dürfen Ausländer in ${c.de} kaufen?`,
          a: 'Ja. Deutschland kennt kein Staatsangehörigkeitsverbot. Jeder Kauf läuft über den Notar und endet im Grundbuch; rechnen Sie mit rund 8–12 % Nebenkosten auf den Kaufpreis.',
        },
        {
          q: `Was kostet ein Kauf in ${c.de}?`,
          a: `${c.state} erhebt ${pct(c.transferTaxPct)} % Grunderwerbsteuer, plus rund 1,5 % Notar und 0,5 % Grundbuch; bei Maklerbeteiligung beträgt der Käuferanteil 3,57 % inkl. MwSt. (§ 656c BGB).`,
        },
      ],
    },
  }
}

const DE_NATIVE_PACKS: Record<string, CityPack> = {
  berlin: { name: 'Berlin', hub: DE_BERLIN_HUB_DE, buy: DE_BERLIN_BUY_DE, rent: DE_BERLIN_RENT_DE },
  munich: { name: 'München', hub: DE_MUNICH_HUB_DE, buy: DE_MUNICH_BUY_DE, rent: DE_MUNICH_RENT_DE },
  hamburg: { name: 'Hamburg', hub: DE_HAMBURG_HUB_DE, buy: DE_HAMBURG_BUY_DE, rent: DE_HAMBURG_RENT_DE },
  frankfurt: { name: 'Frankfurt am Main', hub: DE_FRANKFURT_HUB_DE, buy: DE_FRANKFURT_BUY_DE, rent: DE_FRANKFURT_RENT_DE },
  cologne: { name: 'Köln', hub: DE_COLOGNE_HUB_DE },
}

const DE_GENERATED: Record<string, CityPack> = Object.fromEntries(
  DE_CITY_ROWS.filter((c) => !DE_CITIES[c.slug]).map((c) => [c.slug, generatedDePack(c)]),
)

const DE_GENERATED_DE: Record<string, CityPack> = Object.fromEntries(
  DE_CITY_ROWS.filter((c) => !DE_NATIVE_PACKS[c.slug]).map((c) => [c.slug, generatedDePackDe(c)]),
)

/** Native German city pack for `/de/de/{slug}` — handwritten flagships, then generated. */
export function deNativeCityPack(slug: string): CityPack | null {
  return DE_NATIVE_PACKS[slug] ?? DE_GENERATED_DE[slug] ?? null
}

export function cityPack(country: string, slug: string): CityPack | null {
  if (country === 'de') return DE_CITIES[slug] ?? DE_GENERATED[slug] ?? null
  if (country === 'ae') return AE_CITIES[slug] ?? null
  if (country in EXTRA_CITIES) return EXTRA_CITIES[country as keyof typeof EXTRA_CITIES]?.[slug] ?? null
  return null
}

export function countrySitemapPaths(country: string): string[] {
  if (!country || !(country in MARKETS) || country === 'ge') return []
  const market = MARKETS[country as PathCountryId]
  if (!market.pathPrefix) return []
  const prefix = market.pathPrefix
  const out = [prefix]
  for (const slug of market.citySlugs) {
    const pack = cityPack(country, slug)
    if (!pack) continue
    out.push(`${prefix}/${slug}`)
    if (pack.buy) out.push(`${prefix}/${slug}/buy`)
    if (pack.rent) out.push(`${prefix}/${slug}/rent`)
    // Hood pages (/cc/city/hood). DE Berlin hoods are served by /de/berlin/[bezirk] — skip to avoid dup URLs.
    if (market.countryCode && !(country === 'de' && slug === 'berlin')) {
      for (const hood of hoodsByCity(market.countryCode, pack.name)) {
        out.push(`${prefix}/${slug}/${hood.slug}`)
      }
    }
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
