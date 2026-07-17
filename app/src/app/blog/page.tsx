import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { BLOG_POSTS } from '@/data/blog'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'ბლოგი — უძრავი ქონების გზამკვლევები | sivrce',
  description:
    'საქართველოს უძრავი ქონების ბაზრის ანალიტიკა და გზამკვლევები: ბინები დღიურად, ქირავდება ბინა, იყიდება ბინა თბილისში, ბათუმსა და ქუთაისში. ინვესტიციები, ROI, რჩევები მყიდველისა და მოიჯარისთვის.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'ბლოგი — უძრავი ქონების გზამკვლევები | sivrce',
    description:
      'საქართველოს უძრავი ქონების ბაზრის ანალიტიკა და გზამკვლევები. ინვესტიციები, ROI, რჩევები.',
    type: 'website',
    url: 'https://sivrce.ge/blog',
    siteName: 'sivrce',
    locale: 'ka_GE',
  },
}

const blogLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'sivrce ბლოგი',
  description: 'უძრავი ქონების გზამკვლევები საქართველოში',
  url: 'https://sivrce.ge/blog',
  inLanguage: 'ka',
  blogPost: BLOG_POSTS.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `https://sivrce.ge/blog/${p.slug}`,
    datePublished: `${p.publishedAt}T00:00:00+04:00`,
    dateModified: `${p.updatedAt ?? p.publishedAt}T00:00:00+04:00`,
    author: { '@type': 'Organization', name: p.author },
  })),
}

export default function BlogIndex() {
  const sorted = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const [featured, ...rest] = sorted

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[1200px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            <li className="flex items-center gap-1.5">
              <Link href="/" className="transition-colors hover:text-sv-blue">მთავარი</Link>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="text-sv-ink/80">ბლოგი</li>
          </ol>
        </nav>

        <header className="mb-12">
          <h1 className="max-w-[800px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[48px]">
            უძრავი ქონების ბლოგი
          </h1>
          <p className="mt-4 max-w-[680px] text-[16px] font-semibold text-sv-ink/60">
            ანალიტიკა, გზამკვლევები და რჩევები საქართველოს ბაზრისთვის — თბილისი, ბათუმი, ქუთაისი.
            ბინები დღიურად, ქირავდება, იყიდება, ინვესტიციები და ROI.
          </p>
        </header>

        {/* Featured */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-8 grid overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-300 hover:shadow-card-hover md:grid-cols-2"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-sv-ink/10 md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.cover}
              alt={featured.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <div className="mb-3 flex flex-wrap gap-2">
              {featured.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sv-blue">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-balance text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              {featured.title}
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/65">
              {featured.excerpt}
            </p>
            <div className="mt-5 flex items-center gap-4 text-[13px] font-bold text-sv-ink/45">
              <span>{new Date(featured.publishedAt).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {featured.readingMinutes} წთ კითხვა</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-extrabold text-sv-blue transition-transform duration-300 group-hover:translate-x-1">
              წაიკითხეთ <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-sv-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.cover}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-sv-blue/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sv-blue">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-[17px] font-black leading-snug tracking-[-0.01em] text-sv-ink">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] font-medium leading-relaxed text-sv-ink/60">
                  {p.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[12px] font-bold text-sv-ink/45">
                  <span>{new Date(p.publishedAt).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> {p.readingMinutes} წთ</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(blogLd) }} />
    </div>
  )
}
