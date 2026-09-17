import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, TrendingUp, Scale } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import RentBuyCalcDe from '@/components/rent-buy/RentBuyCalcDe'
import { jsonLd } from '@/lib/utils'
import { deOnlyAlternates } from '@/lib/i18n/server'

export const revalidate = 86400

const BASE = 'https://sivrce.com'
const PATH = '/de/miete-oder-kaufen'

const TITLE = 'Miete oder kaufen? Der Rechner für Deutschland (2026)'
const DESCRIPTION =
  'Rechnen Sie nach, was in Ihrem Fall günstiger ist — Eigentumswohnung kaufen oder zur Miete wohnen. Vermögensvergleich über jeden Zeithorizont: Bauzins, Kaufnebenkosten je Bundesland, Preissteigerung, Rendite der Ersparnisse und Mietsteigerung in einem deterministischen Modell.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: deOnlyAlternates(PATH),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${BASE}${PATH}`,
    siteName: 'sivrce',
    locale: 'de_DE',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/og-brand.png'] },
}

const KICKER = 'Die Entscheidung nach Zahlen'
const SUBTITLE =
  'Vergleichen Sie Kaufen und Mieten in Ihrer Situation — wie viel Vermögen wäre nach einer gegebenen Anzahl von Jahre vorhanden, wenn dasselbe Geld in eine Eigentumswohnung oder in Sparanlagen fließen würde. Das Modell ist transparent: Jede Annahme ändern Sie selbst.'
const ASSUMPTIONS_NOTE =
  'Feste Modellannahmen: Mietsteigerung 2,5 % p. a. · Verkaufsnebenkosten 4 % (Makleranteil §656c BGB + Löschkosten) · Bewirtschaftung, Instandhaltung und Grundsteuer 1,2 % p. a. des Kaufpreises · Annuität über 30 Jahre · Kaufnebenkosten je Bundesland: Grunderwerbsteuer 3,5–6,5 %, Notar 1,5 % (GNotKG), Grundbuch 0,5 %, Makler 3,57 % (§656c BGB).'

const GUIDE_TITLE = 'So funktioniert der Vergleich'
const GUIDE = [
  'Auf beiden Wegen arbeitet Ihr Geld: beim Kauf steckt es im Immobilienkapital (Wert minus Restschuld), zur Miete bleiben Eigenkapital und Kaufnebenkosten angelegt. Wer monatlich weniger zahlt, legt die Differenz ebenfalls an — so wird ein und dasselbe Budget auf zwei Vermögenspfaden verglichen.',
  'Deutsches Spezifikum: die Kaufnebenkosten. Je nach Bundesland kommen rund 9 bis 12,6 % zum Kaufpreis dazu (Grunderwerbsteuer 3,5–6,5 %, Notar, Grundbuch, Makleranteil) — diese Hürde muss die Immobilie erst verdienen. Selbstgenutztes Wohneigentum bietet keine Zinsabschreibung; nur vermietete Immobilien nutzen AfA und absetzbare Schuldzinsen.',
  'Grundsätzlich gilt: Je länger Sie bleiben, desto besser schneidet der Kauf ab — die einmaligen Nebenkosten verdienen sich über die Jahre. Bei kurzen Horizonten (1–3 Jahre) ist Mieten meist günstiger, bei langen (10+ Jahre) zieht der Kauf meist vorbei. Das Ergebnis folgt aber immer den Zahlen, die Sie eingeben.',
]

const FAQ_TITLE = 'Häufige Fragen'
const FAQS = [
  {
    q: 'Was genau vergleicht dieser Rechner?',
    a: 'Das Vermögen zum selben zukünftigen Zeitpunkt auf zwei Wegen: beim Kauf — aktueller Immobilienwert minus Restschuld und Verkaufsnebenkosten; zur Miete — die Ersparnisse, in denen das Eigenkapital-Äquivalent samt Kaufnebenkosten und die monatliche Differenz wachsen. Die Wohnkosten sind auf beiden Seiten eingerechnet.',
  },
  {
    q: 'Was kosten die Kaufnebenkosten in meinem Bundesland?',
    a: 'Der Rechner übernimmt sie live aus der gesetzlichen Kostenstruktur: Grunderwerbsteuer 3,5 % (Bayern) bis 6,5 % (z. B. Brandenburg, Nordrhein-Westfalen, Thüringen), Notar 1,5 % nach GNotKG, Grundbuch 0,5 %, Makleranteil 3,57 % nach §656c BGB. In Berlin sind das 11,57 % — bei 500.000 € also 57.850 € zusätzlich zum Kaufpreis.',
  },
  {
    q: 'Warum gewinnt bei flachen Preisen oft die Miete?',
    a: 'Weil die Kaufnebenkosten von bis zu 12 % zuerst verdient werden müssen. Stehen die Preise, während Tages- und Festgelder 3 % und mehr bringen, wachsen die Ersparnisse schneller als das Immobilienkapital. Erst Preissteigerung über mehrere Jahre kippt den Vergleich zugunsten des Kaufs.',
  },
  {
    q: 'Was deckt das Modell nicht ab?',
    a: 'Die Zinsbindung: gerechnet wird mit einer Annuität über 30 Jahre, real sind meist 10 Jahre fest — der Folgezins danach ist ungewiss. Nicht modelliert sind außerdem Hausgeld-Steigerungen, Instandhaltungsrisiken, gemeindespezifische Grundsteuer-Hebesätze und steuerliche Effekte bei Vermietung (AfA, Schuldzinsen).',
  },
  {
    q: 'Ist das eine Finanzberatung?',
    a: 'Nein. Der Rechner nutzt ein deterministisches Modell mit Ihren Annahmen und prognostiziert nichts. Für eine echte Entscheidung zählen auch Einkommensstabilität, Zinsänderungsrisiko bei der Anschlussfinanzierung und die konkreten Bankkonditionen.',
  },
]

function hubLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: TITLE,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        description: DESCRIPTION,
        url: `${BASE}${PATH}`,
        inLanguage: 'de',
      },
      {
        '@type': 'FAQPage',
        inLanguage: 'de',
        isPartOf: { '@id': `${BASE}/#website` },
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SIVRCE Deutschland', item: `${BASE}/de` },
          { '@type': 'ListItem', position: 2, name: 'Miete oder kaufen', item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

export default function MieteOderKaufenPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav">
        <PageHero tone="light" kicker={KICKER} title={TITLE} subtitle={SUBTITLE} />
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

          <RentBuyCalcDe />
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
            {ASSUMPTIONS_NOTE}
          </p>

          {/* Leitfaden */}
          <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              <TrendingUp className="h-5 w-5 text-sv-blue" aria-hidden /> {GUIDE_TITLE}
            </h2>
            <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
              {GUIDE.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10" aria-label={FAQ_TITLE}>
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {FAQ_TITLE}
            </h2>
            <div className="grid gap-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
            <h2 className="text-[22px] font-black text-white md:text-[26px]">Entscheiden Sie mit Zahlen</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
              Verifizierte Angebote mit KI-Preiseinschätzung — vergleichen Sie echte Wohnungen zum Kauf und zur Miete.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/de/de/kaufen/berlin"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-transform hover:-translate-y-0.5"
              >
                Wohnungen in Berlin kaufen
              </Link>
              <Link href="/de/de/mieten/berlin" className="text-[14px] font-bold text-white/70 underline-offset-4 hover:text-white hover:underline">
                Wohnungen in Berlin mieten
              </Link>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[14px] font-bold text-sv-ink/60">
            <Scale className="h-4 w-4 text-sv-blue" aria-hidden />
            <Link href="/de/de" className="underline-offset-4 hover:text-sv-blue hover:underline">
              Deutschland-Hub — Marktplatz, Stadtguides und Miet-Intelligenz →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(hubLd()) }} />
    </div>
  )
}
