import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import { listBlogPosts } from '@/lib/blog-live'
import { blogTitle, blogExcerpt, blogTags } from '@/data/blog'
import { jsonLd } from '@/lib/utils'
import { requestOrigin } from '@/lib/request-market'
import { pageMeta } from '@/lib/i18n/server'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const origin = await requestOrigin()
  return {
    ...pageMeta('/blog', lang, {
      ka: {
        title: 'ბლოგი — უძრავი ქონების გზამკვლევები',
        description:
          'საქართველოს უძრავი ქონების ბაზრის ანალიტიკა და გზამკვლევები: ბინები დღიურად, ქირავდება ბინა, იყიდება ბინა თბილისში, ბათუმსა და ქუთაისში. ინვესტიციები, ROI, რჩევები მყიდველისა და მოიჯარისთვის.',
      },
      en: {
        title: 'Blog — Georgia Real Estate Guides',
        description:
          'Market analytics and guides for Georgian real estate: daily rentals, buying and renting in Tbilisi, Batumi and Kutaisi. Investments, ROI, buyer tips.',
      },
      ru: {
        title: 'Блог — гиды по недвижимости в Грузии',
        description:
          'Аналитика и гиды по рынку недвижимости Грузии: посуточно, покупка и аренда в Тбилиси, Батуми и Кутаиси. Инвестиции, ROI, советы покупателям.',
      },
      de: {
        title: 'Blog — Immobilien-Guides für Georgien',
        description:
          'Marktanalysen und Guides für Immobilien in Georgien: Ferienwohnungen, Kauf und Miete in Tiflis, Batumi und Kutaissi. Investitionen, ROI, Käufertipps.',
      },
    }),
    openGraph: {
      title: 'ბლოგი — უძრავი ქონების გზამკვლევები',
      description:
        'საქართველოს უძრავი ქონების ბაზრის ანალიტიკა და გზამკვლევები. ინვესტიციები, ROI, რჩევები.',
      type: 'website',
      url: `${origin}/blog`,
      siteName: 'sivrce',
      locale: 'ka_GE',
    },
  }
}

function blogLd(
  posts: { title: string; enTitle: string; slug: string; publishedAt: string; updatedAt?: string; author: string }[],
  origin: string,
  lang: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'sivrce ბლოგი',
    description: 'უძრავი ქონების გზამკვლევები საქართველოში',
    url: `${origin}/blog`,
    inLanguage: lang,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: blogTitle(p, lang),
      url: `${origin}/blog/${p.slug}`,
      datePublished: `${p.publishedAt}T00:00:00+04:00`,
      dateModified: `${p.updatedAt ?? p.publishedAt}T00:00:00+04:00`,
      author: { '@type': 'Organization', name: p.author },
    })),
  }
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const origin = await requestOrigin()
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t =
    lang === 'ka'
      ? {
          locale: 'ka-GE',
          kicker: 'ბლოგი',
          title: 'უძრავი ქონების ბლოგი',
          subtitle: 'ანალიტიკა, გზამკვლევები და რჩევები საქართველოს ბაზრისთვის — თბილისი, ბათუმი, ქუთაისი.',
          minRead: 'წთ კითხვა',
          minShort: 'წთ',
          read: 'წაიკითხე',
        }
      : lang === 'ru'
        ? {
            locale: 'ru-RU',
            kicker: 'Блог',
            title: 'Блог о недвижимости',
            subtitle: 'Аналитика, гиды и советы для рынка Грузии — Тбилиси, Батуми, Кутаиси.',
            minRead: 'мин чтения',
            minShort: 'мин',
            read: 'Читать',
          }
        : lang === 'de'
        ? {
            locale: 'de-DE',
            kicker: 'Blog',
            title: 'Immobilien-Blog',
            subtitle: 'Analysen, Guides und Tipps für den georgischen Markt — Tiflis, Batumi, Kutaissi.',
            minRead: 'Min. Lesezeit',
            minShort: 'Min.',
            read: 'Lesen',
          }
        : {
            locale: 'en-US',
            kicker: 'Blog',
            title: 'Real Estate Blog',
            subtitle: 'Analytics, guides and advice for the Georgian market — Tbilisi, Batumi, Kutaisi.',
            minRead: 'min read',
            minShort: 'min',
            read: 'Read',
          }
  const sorted = await listBlogPosts()
  const featured = sorted[0]
  const rest = sorted.slice(1)
  const homeLabel = lang === 'ka' ? 'მთავარი' : lang === 'ru' ? 'Главная' : lang === 'de' ? 'Startseite' : 'Home'
  const blogLabel = lang === 'ka' ? 'ბლოგი' : lang === 'ru' ? 'Блог' : 'Blog'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: origin },
      { '@type': 'ListItem', position: 2, name: blogLabel, item: `${origin}/blog` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={t.kicker}
          title={t.title}
          subtitle={t.subtitle}
        />
        <AdSlot slot="blog" lang={lang} />
        <div className="mx-auto max-w-[1200px] px-5 pb-20 md:px-10">

        {/* Featured */}
        <LocalizedLink
          href={`/blog/${featured.slug}`}
          className="group mb-8 grid overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition duration-300 hover:shadow-card-hover md:grid-cols-2"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-sv-ink/10 md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.cover}
              alt={blogTitle(featured, lang)}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <div className="mb-3 flex flex-wrap gap-2">
              {blogTags(featured.tags, lang).map((tag) => (
                <span key={tag} className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sv-blue-deep">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-balance text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              {blogTitle(featured, lang)}
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/65">
              {blogExcerpt(featured, lang)}
            </p>
            <div className="mt-5 flex items-center gap-4 text-[13px] font-bold text-sv-ink/60">
              <span>{new Date(featured.publishedAt).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {featured.readingMinutes} {t.minRead}</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-extrabold text-sv-blue transition-transform duration-300 group-hover:translate-x-1">
              {t.read} <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </LocalizedLink>

        {/* Grid */}
        <div className="sv-card-grid-3">
          {rest.map((p) => (
            <LocalizedLink
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition duration-300 hover:shadow-card-hover"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-sv-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.cover}
                  alt={blogTitle(p, lang)}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {blogTags(p.tags, lang).slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-sv-blue/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sv-blue-deep">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-[17px] font-black leading-snug tracking-[-0.01em] text-sv-ink">
                  {blogTitle(p, lang)}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] font-medium leading-relaxed text-sv-ink/60">
                  {blogExcerpt(p, lang)}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[12px] font-bold text-sv-ink/60">
                  <span>{new Date(p.publishedAt).toLocaleDateString(t.locale, { day: 'numeric', month: 'short' })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> {p.readingMinutes} {t.minShort}</span>
                </div>
              </div>
            </LocalizedLink>
          ))}
        </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(blogLd(sorted, origin, lang)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
