import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { dirLoc, type DirLoc } from '@/lib/directory-seo'
import { FAQ_SECTIONS, type FaqLoc } from '@/lib/faq'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/faq', lang, {
    ka: {
      title: 'უძრავი ქონება საქართველოში — ხშირი კითხვები',
      description:
        'ბინები დღიურად თბილისში და საბურთალოზე, ყიდვა-გაყიდვა და ქირა — პასუხები sivrce-ზე. ვერიფიკაცია, VIP, AI ძიება.',
    },
    en: {
      title: 'Real Estate in Georgia — FAQ',
      description:
        'Daily rentals in Tbilisi and Saburtalo, buying, selling and rent — answered on sivrce. Verification, VIP, AI search.',
    },
    ru: {
      title: 'Недвижимость в Грузии — частые вопросы',
      description:
        'Посуточные квартиры в Тбилиси и Сабуртало, покупка-продажа и аренда — ответы на sivrce. Верификация, VIP, ИИ-поиск.',
    },
    de: {
      title: 'Immobilien in Georgien — FAQ für deutsche Käufer',
      description:
        'Kaufen als Deutscher in Tiflis und Batumi, Visum, Nebenkosten in Berlin — Antworten auf sivrce. Prüfung, VIP, KI-Suche.',
    },
  })
}

function faqLdFor(loc: DirLoc | 'de') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: loc,
    isPartOf: { '@id': 'https://sivrce.ge/#website' },
    mainEntity: FAQ_SECTIONS[loc].flatMap((s) =>
      s.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  }
}

const HERO: Record<DirLoc, { kicker: string; title: string; subtitle: string }> = {
  ka: {
    kicker: 'დახმარება',
    title: 'ხშირად დასმული კითხვები',
    subtitle: 'ბინები დღიურად თბილისში და საბურთალოზე, ყიდვა-გაყიდვა, ქირა — ერთ გვერდზე.',
  },
  en: {
    kicker: 'Help',
    title: 'Frequently asked questions',
    subtitle: 'Daily rentals in Tbilisi and Saburtalo, buying and selling, rent — on one page.',
  },
  ru: {
    kicker: 'Помощь',
    title: 'Частые вопросы',
    subtitle: 'Посуточные квартиры в Тбилиси и Сабуртало, покупка и продажа, аренда — на одной странице.',
  },
} as const

const HERO_DE = {
  kicker: 'Hilfe',
  title: 'Häufige Fragen',
  subtitle: 'Kaufen in Tiflis und Batumi, Visum, Nebenkosten in Berlin — auf einer Seite.',
} as const

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  // ponytail: DirLoc stays ka/en/ru (directory hubs share it) — German gets its
  // native FAQ dataset + hero here without widening the shared corpus type.
  const isDe = lang === 'de'
  const hero = isDe ? HERO_DE : HERO[loc]
  const sections: (typeof FAQ_SECTIONS)[FaqLoc] = isDe ? FAQ_SECTIONS.de : FAQ_SECTIONS[loc]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLdFor(isDe ? 'de' : loc)) }} />
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={hero.kicker} title={hero.title} subtitle={hero.subtitle} />
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-8 md:pb-28">
          <div className="space-y-14">
            {sections.map((section, si) => (
              <Reveal key={section.title} delay={si * 0.05}>
                <section>
                  <h2 className="text-2xl font-black tracking-[-0.02em] text-sv-ink text-balance">
                    {section.title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {section.items.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-card bg-sv-surface shadow-card ring-1 ring-sv-ink/5 transition open:shadow-card-hover"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-[16px] font-bold text-sv-ink marker:hidden [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-cloud text-sv-blue transition group-open:rotate-45">
                            <Plus className="h-4 w-4" aria-hidden />
                          </span>
                        </summary>
                        <p className="px-6 pb-6 text-[15px] font-medium leading-relaxed text-sv-ink/60">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
