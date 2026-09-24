import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { MessageSquare, Eye, BadgeCheck, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { NewThreadForm } from '@/components/forum/NewThreadForm'
import { listForumThreads } from '@/lib/forum-live'
import { requestOrigin } from '@/lib/request-market'
import { jsonLd } from '@/lib/utils'
import { pageMeta, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang, panelLang } from '@/lib/i18n/core'

export const revalidate = 60

// Forum chrome strings (thread content itself is user-generated).
const L = {
  ka: {
    kicker: 'ფორუმი',
    heroTitle: 'სადისკუსიო თემები და ბაზრის მიმოხილვა',
    heroSub: 'ექსპერტებისა და მყიდველების გამოცდილება — რემონტი, იპოთეკა, ინვესტიცია თბილისსა და ბათუმში.',
    empty: 'ჯერ სადისკუსიო თემები არ არის — დაწერე პირველი!',
    replies: (n: number) => `${n} პასუხი`,
    views: (n: string) => `${n} ნახვა`,
    verified: (n: number) => `${n} ვერიფ.`,
    open: 'გახსნა',
    ldName: 'sivrce ფორუმი',
    ldDesc: 'უძრავი ქონების სადისკუსიო თემები საქართველოში',
    crumbHome: 'მთავარი',
    crumbForum: 'ფორუმი',
  },
  en: {
    kicker: 'Forum',
    heroTitle: 'Discussion topics and market insights',
    heroSub: 'Experience from experts and buyers — renovation, mortgages and investing in Tbilisi and Batumi.',
    empty: 'No discussion topics yet — be the first to post!',
    replies: (n: number) => `${n} ${n === 1 ? 'reply' : 'replies'}`,
    views: (n: string) => `${n} ${n === '1' ? 'view' : 'views'}`,
    verified: (n: number) => `${n} verified`,
    open: 'Open',
    ldName: 'sivrce forum',
    ldDesc: 'Real estate discussion topics in Georgia',
    crumbHome: 'Home',
    crumbForum: 'Forum',
  },
  de: {
    kicker: 'Forum',
    heroTitle: 'Diskussionsthemen und Marktüberblick',
    heroSub: 'Erfahrungen von Experten und Käufern — Renovierung, Hypotheken und Investitionen in Tiflis und Batumi.',
    empty: 'Noch keine Diskussionsthemen — schreiben Sie das Erste!',
    replies: (n: number) => `${n} ${n === 1 ? 'Antwort' : 'Antworten'}`,
    views: (n: string) => `${n} Aufrufe`,
    verified: (n: number) => `${n} verifiziert`,
    open: 'Öffnen',
    ldName: 'sivrce Forum',
    ldDesc: 'Diskussionsthemen zu Immobilien in Georgien',
    crumbHome: 'Start',
    crumbForum: 'Forum',
  },
} as const

type ForumLoc = keyof typeof L
function forumStrings(lang: Lang): (typeof L)[ForumLoc] {
  return L[panelLang(lang)]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const t = forumStrings(lang)
  const origin = await requestOrigin()
  return {
    ...pageMeta('/forum', lang, {
      ka: {
        title: 'ფორუმი — უძრავი ქონების დისკუსიები',
        description:
          'სადისკუსიო თემები საქართველოს უძრავი ქონების ბაზარზე: რემონტი, იპოთეკა, ბათუმის ინვესტიცია, ძველი კორპუსები და მყიდველის რჩევები.',
      },
      en: {
        title: 'Forum — Georgia Real Estate Discussions',
        description:
          'Community discussions on the Georgian property market: renovation, mortgages, Batumi investments, older buildings and buyer advice.',
      },
      ru: {
        title: 'Форум — обсуждение недвижимости в Грузии',
        description:
          'Обсуждения рынка недвижимости Грузии: ремонт, ипотека, инвестиции в Батуми, старые корпуса и советы покупателям.',
      },
      de: {
        title: 'Forum — Diskussionen über Immobilien in Georgien',
        description:
          'Community-Diskussionen über den georgischen Immobilienmarkt: Renovierung, Hypotheken, Investitionen in Batumi, ältere Gebäude und Käufertipps.',
      },
    }),
    openGraph: {
      title: t.ldName,
      description: t.heroSub,
      type: 'website',
      url: `${origin}/forum`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
    },
  }
}

export default async function ForumIndex({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const t = forumStrings(lang)
  const origin = await requestOrigin()
  const sorted = await listForumThreads()

  const forumLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    name: t.ldName,
    description: t.ldDesc,
    url: `${origin}/forum`,
    inLanguage: lang,
    mainEntity: sorted.slice(0, 20).map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${origin}/forum/${t.slug}`,
      name: t.title,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.crumbHome, item: origin },
      { '@type': 'ListItem', position: 2, name: t.crumbForum, item: `${origin}/forum` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={t.kicker}
          title={t.heroTitle}
          subtitle={t.heroSub}
        />
        <div className="mx-auto max-w-[1200px] px-5 pb-20 md:px-10">

        <div className="mb-12">
          <NewThreadForm />
        </div>

        <ul className="space-y-4">
          {sorted.length === 0 && (
            <li className="rounded-tile border border-dashed border-sv-ink/15 bg-sv-surface px-6 py-10 text-center text-[14px] font-semibold text-sv-ink/60">
              {t.empty}
            </li>
          )}
          {sorted.map((thread) => {
            const replyCount = thread.replies.length
            const verified = thread.replies.filter((r) => r.verified).length
            return (
              <li key={thread.slug}>
                <LocalizedLink
                  href={`/forum/${thread.slug}`}
                  className="group flex flex-col gap-4 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-sv-blue/25 hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue-deep">
                        {thread.category}
                      </span>
                      {thread.badge ? <span className="text-[11px] font-bold text-sv-orange">{thread.badge}</span> : null}
                      <span className="text-[12px] font-semibold text-sv-ink/60">{thread.district}</span>
                    </div>
                    <h2 className="text-[17px] font-black leading-snug tracking-[-0.01em] text-sv-ink transition-colors group-hover:text-sv-blue md:text-[19px]">
                      {thread.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-relaxed text-sv-ink/60">
                      {thread.excerpt}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 text-[12px] font-bold text-sv-ink/60 sm:flex-col sm:items-end sm:gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                      {t.replies(replyCount)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      {t.views(thread.viewsLabel)}
                    </span>
                    {verified > 0 && (
                      <span className="inline-flex items-center gap-1 text-sv-blue">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        {t.verified(verified)}
                      </span>
                    )}
                    <span className="hidden items-center gap-1 text-sv-blue sm:inline-flex">
                      {t.open} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </LocalizedLink>
              </li>
            )
          })}
        </ul>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(forumLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
