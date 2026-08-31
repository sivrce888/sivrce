import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { MessageSquare, Eye, BadgeCheck, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { NewThreadForm } from '@/components/forum/NewThreadForm'
import { listForumThreads } from '@/lib/forum-live'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ფორუმი — უძრავი ქონების დისკუსიები | sivrce',
  description:
    'სადისკუსიო თემები საქართველოს უძრავი ქონების ბაზარზე: რემონტი, იპოთეკა, ბათუმის ინვესტიცია, ძველი კორპუსები და მყიდველის რჩევები.',
  alternates: { canonical: '/forum', languages: langAlternates('/forum') },
  openGraph: {
    title: 'ფორუმი — უძრავი ქონების დისკუსიები | sivrce',
    description: 'ექსპერტებისა და მყიდველების გამოცდილება თბილისსა და ბათუმში.',
    type: 'website',
    url: 'https://sivrce.ge/forum',
    siteName: 'sivrce',
    locale: 'ka_GE',
  },
}

export default async function ForumIndex() {
  const sorted = await listForumThreads()

  const forumLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    name: 'sivrce ფორუმი',
    description: 'უძრავი ქონების სადისკუსიო თემები საქართველოში',
    url: 'https://sivrce.ge/forum',
    inLanguage: 'ka',
    mainEntity: sorted.slice(0, 20).map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://sivrce.ge/forum/${t.slug}`,
      name: t.title,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="ფორუმი"
          title="სადისკუსიო თემები და ბაზრის მიმოხილვა"
          subtitle="ექსპერტებისა და მყიდველების გამოცდილება — რემონტი, იპოთეკა, ინვესტიცია თბილისსა და ბათუმში."
        />
        <div className="mx-auto max-w-[1200px] px-5 pb-20 md:px-10">

        <div className="mb-12">
          <NewThreadForm />
        </div>

        <ul className="space-y-4">
          {sorted.length === 0 && (
            <li className="rounded-tile border border-dashed border-sv-ink/15 bg-sv-surface px-6 py-10 text-center text-[14px] font-semibold text-sv-ink/50">
              ჯერ სადისკუსიო თემები არ არის — დაწერე პირველი!
            </li>
          )}
          {sorted.map((t) => {
            const replyCount = t.replies.length
            const verified = t.replies.filter((r) => r.verified).length
            return (
              <li key={t.slug}>
                <LocalizedLink
                  href={`/forum/${t.slug}`}
                  className="group flex flex-col gap-4 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-sv-blue/25 hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue">
                        {t.category}
                      </span>
                      {t.badge ? <span className="text-[11px] font-bold text-sv-orange">{t.badge}</span> : null}
                      <span className="text-[12px] font-semibold text-sv-ink/40">{t.district}</span>
                    </div>
                    <h2 className="text-[17px] font-black leading-snug tracking-[-0.01em] text-sv-ink transition-colors group-hover:text-sv-blue md:text-[19px]">
                      {t.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-relaxed text-sv-ink/60">
                      {t.excerpt}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 text-[12px] font-bold text-sv-ink/50 sm:flex-col sm:items-end sm:gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                      {replyCount} პასუხი
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      {t.viewsLabel} ნახვა
                    </span>
                    {verified > 0 && (
                      <span className="inline-flex items-center gap-1 text-sv-blue">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        {verified} ვერიფ.
                      </span>
                    )}
                    <span className="hidden items-center gap-1 text-sv-blue sm:inline-flex">
                      გახსნა <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
    </div>
  )
}
