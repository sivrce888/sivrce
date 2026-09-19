import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { BLOG_POSTS, relatedPosts, blogTitle, blogExcerpt, blogBody } from '@/data/blog'
import { getBlogPost } from '@/lib/blog-live'
import { jsonLd, ogImage } from '@/lib/utils'
import { requestOrigin } from '@/lib/request-market'
import { avifCardOf, cardOf } from '@/lib/media'
import { kaOnlyAlternates } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

export const revalidate = 86400

export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return BLOG_POSTS.map((p) => ({ lang: 'ka', slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const origin = await requestOrigin()
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const post = await getBlogPost(slug)
  if (!post) return {}
  const t = blogTitle(post, lang)
  const d = blogExcerpt(post, lang)
  const locale = lang === 'ka' ? 'ka_GE' : lang === 'de' ? 'de_DE' : lang === 'ru' ? 'ru_RU' : 'en_US'
  return {
    title: t,
    description: d,
    alternates: kaOnlyAlternates(`/blog/${post.slug}`),
    openGraph: {
      title: t,
      description: d,
      type: 'article',
      url: `${origin}/blog/${post.slug}`,
      siteName: 'sivrce',
      locale,
      publishedTime: `${post.publishedAt}T00:00:00+04:00`,
      modifiedTime: `${post.updatedAt ?? post.publishedAt}T00:00:00+04:00`,
      authors: [post.author],
      images: [{ url: ogImage(post.cover), width: 1200, height: 630, alt: t }],
    },
    twitter: { card: 'summary_large_image', title: t, description: d, images: [ogImage(post.cover)] },
  }
}

function postLd(post: NonNullable<Awaited<ReturnType<typeof getBlogPost>>>, origin: string, lang: string) {
  const cover = post.cover.startsWith('http') ? post.cover : `https://sivrce.ge${post.cover}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blogTitle(post, lang),
    ...(post.enTitle ? { alternativeHeadline: post.enTitle } : {}),
    description: blogExcerpt(post, lang),
    image: cover,
    inLanguage: lang,
    datePublished: `${post.publishedAt}T00:00:00+04:00`,
    dateModified: `${post.updatedAt ?? post.publishedAt}T00:00:00+04:00`,
    // ponytail: Person (not Organization) author — Google YMYL E-E-A-T signal.
    // "sivrce რედაქცია" is the editorial team; same name shown on the byline.
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: 'უძრავი ქონების რედაქტორი',
      url: `${origin}/about`,
      worksFor: { '@type': 'Organization', name: 'sivrce', url: origin },
    },
    publisher: { '@type': 'Organization', name: 'sivrce', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo/mark.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
    articleSection: 'უძრავი ქონება',
    // Speakable marks the intro paragraph for voice assistants (Google Assistant, Alexa)
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.speakable-lead'] },
  }
}

// Minimal, safe markdown: paragraphs from blank-line splits, ## headings.
function renderBody(body: string) {
  const blocks = body.trim().split(/\n\n+/)
  return blocks.map((b, i) => {
    const trimmed = b.trim()
    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="mt-10 text-[22px] font-black tracking-[-0.01em] text-sv-ink">{trimmed.slice(3)}</h2>
    }
    const isLead = i === 0
    return (
      <p
        key={i}
        className={`mt-4 text-[16px] font-medium leading-[1.75] text-sv-ink/75 ${isLead ? 'speakable-lead text-[17px] text-sv-ink/85' : ''}`}
      >
        {trimmed}
      </p>
    )
  })
}

// Tri-lang page chrome (ka/en+de) — de/en render English chrome until the
// German blog corpus exists; titles/excerpts localize via blogTitle/blogExcerpt.
const CHROME: Record<string, { crumbHome: string; crumbBlog: string; crumbs: string; minRead: string; dateLocale: string; related: string; ctaTitle: string; ctaSub: string; ctaBtn: string; allArticles: string }> = {
  ka: { crumbHome: 'მთავარი', crumbBlog: 'ბლოგი', crumbs: 'ბრედკრამბი', minRead: 'წთ კითხვა', dateLocale: 'ka-GE', related: 'მსგავსი სტატიები', ctaTitle: 'მოძებნეთ საკუთარი ბინა', ctaSub: 'ვერიფიცირებული განცხადებები AI ფასის შეფასებითა და 3D რუკით — თბილისი, ბათუმი, ქუთაისი.', ctaBtn: 'ძიება', allArticles: 'ყველა სტატია' },
  ru: { crumbHome: 'Главная', crumbBlog: 'Блог', crumbs: 'Навигация', minRead: 'мин чтения', dateLocale: 'ru-RU', related: 'Похожие статьи', ctaTitle: 'Найдите свою квартиру', ctaSub: 'Верифицированные объявления с ИИ-оценкой цены и 3D-картой — Тбилиси, Батуми, Кутаиси.', ctaBtn: 'Поиск', allArticles: 'Все статьи' },
  de: { crumbHome: 'Startseite', crumbBlog: 'Blog', crumbs: 'Brotkrumen', minRead: 'Min. Lesezeit', dateLocale: 'de-DE', related: 'Ähnliche Artikel', ctaTitle: 'Finden Sie Ihre Wohnung', ctaSub: 'Verifizierte Inserate mit KI-Preisschätzung und 3D-Karte — Tiflis, Batumi, Kutaissi.', ctaBtn: 'Suchen', allArticles: 'Alle Artikel' },
  en: { crumbHome: 'Home', crumbBlog: 'Blog', crumbs: 'Breadcrumb', minRead: 'min read', dateLocale: 'en-US', related: 'Related articles', ctaTitle: 'Find your apartment', ctaSub: 'Verified listings with AI price estimates and a 3D map — Tbilisi, Batumi, Kutaisi.', ctaBtn: 'Search', allArticles: 'All articles' },
}

export default async function BlogPostPage({ params }: PageProps) {
  const origin = await requestOrigin()
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const c = CHROME[lang] ?? CHROME.en
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const related = relatedPosts(post)

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[760px] px-5 pb-20">
        <nav aria-label={c.crumbs} className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/" className="transition-colors hover:text-sv-blue">{c.crumbHome}</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/blog" className="transition-colors hover:text-sv-blue">{c.crumbBlog}</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="line-clamp-1 text-sv-ink/80">{blogTitle(post, lang)}</li>
          </ol>
        </nav>

        <article>
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sv-blue-deep">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-balance text-[28px] font-black leading-tight tracking-[-0.02em] text-sv-ink md:text-[40px]">
              {blogTitle(post, lang)}
            </h1>
            <p className="mt-4 text-[17px] font-semibold leading-relaxed text-sv-ink/60">
              {blogExcerpt(post, lang)}
            </p>
            <div className="mt-6 flex items-center gap-4 border-y border-sv-ink/[0.06] py-4 text-[13px] font-bold text-sv-ink/60">
              <span>{post.author}</span>
              <span>{new Date(post.publishedAt).toLocaleDateString(c.dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {post.readingMinutes} {c.minRead}</span>
            </div>
          </header>

          {/* ponytail: 16px LQIP/card twins exist for pipeline covers — srcset keeps
              phones off the 2560px master; static covers have no twins, src only. */}
          { }
          <picture className="contents">
            <source type="image/avif" media="(max-width: 800px)" srcSet={avifCardOf(post.cover)} />
          <img
            src={post.cover}
            srcSet={cardOf(post.cover) ? `${cardOf(post.cover)} 800w, ${post.cover} 2560w` : undefined}
            sizes="(max-width:1024px) 100vw, 820px"
            alt={blogTitle(post, lang)}
            fetchPriority="high"
            className="mb-10 aspect-[16/9] w-full rounded-tile object-cover shadow-card"
          />
          </picture>

          <div>{renderBody(blogBody(post, lang))}</div>

          {/* CTA */}
          <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
            <h2 className="text-[22px] font-black text-white md:text-[26px]">{c.ctaTitle}</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
              {c.ctaSub}
            </p>
            <LocalizedLink
              href="/search"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-black text-sv-ink shadow-glow-orange transition-transform hover:-translate-y-0.5"
            >
              {c.ctaBtn} <ArrowRight className="h-4 w-4" aria-hidden />
            </LocalizedLink>
          </div>
        </article>

        {/* Related posts — internal linking */}
        {related.length > 0 && (
          <section className="mt-16" aria-label={c.related}>
            <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink">{c.related}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <LocalizedLink
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-300 hover:shadow-card-hover"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-sv-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt={blogTitle(p, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[14px] font-black leading-snug text-sv-ink line-clamp-3">{blogTitle(p, lang)}</h3>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          </section>
        )}

        <LocalizedLink href="/blog" className="mt-12 inline-flex items-center gap-1.5 text-[14px] font-extrabold text-sv-blue-deep">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {c.allArticles}
        </LocalizedLink>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(postLd(post, origin, lang)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: c.crumbHome, item: origin },
              { '@type': 'ListItem', position: 2, name: c.crumbBlog, item: `${origin}/blog` },
              { '@type': 'ListItem', position: 3, name: blogTitle(post, lang), item: `${origin}/blog/${post.slug}` },
            ],
          }),
        }}
      />
    </div>
  )
}
