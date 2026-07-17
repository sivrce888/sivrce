import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { BLOG_POSTS, getPost, relatedPosts } from '@/data/blog'
import { jsonLd } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://sivrce.ge/blog/${post.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      publishedTime: `${post.publishedAt}T00:00:00+04:00`,
      modifiedTime: `${post.updatedAt ?? post.publishedAt}T00:00:00+04:00`,
      authors: [post.author],
      images: [{ url: post.cover, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [post.cover] },
  }
}

function postLd(slug: string) {
  const post = getPost(slug)!
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    alternativeHeadline: post.enTitle,
    description: post.excerpt,
    image: `https://sivrce.ge${post.cover}`,
    inLanguage: 'ka',
    datePublished: `${post.publishedAt}T00:00:00+04:00`,
    dateModified: `${post.updatedAt ?? post.publishedAt}T00:00:00+04:00`,
    author: { '@type': 'Organization', name: post.author, url: 'https://sivrce.ge' },
    publisher: { '@type': 'Organization', name: 'sivrce', url: 'https://sivrce.ge', logo: { '@type': 'ImageObject', url: 'https://sivrce.ge/logo/sivrce-mark.svg' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://sivrce.ge/blog/${post.slug}` },
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = relatedPosts(post)

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[760px] px-5 pb-20 pt-24 md:pt-28">
        <nav aria-label="ბრედკრამბი" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            <li className="flex items-center gap-1.5">
              <Link href="/" className="transition-colors hover:text-sv-blue">მთავარი</Link>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li className="flex items-center gap-1.5">
              <Link href="/blog" className="transition-colors hover:text-sv-blue">ბლოგი</Link>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="line-clamp-1 text-sv-ink/80">{post.title}</li>
          </ol>
        </nav>

        <article>
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sv-blue">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-balance text-[28px] font-black leading-tight tracking-[-0.02em] text-sv-ink md:text-[40px]">
              {post.title}
            </h1>
            <p className="mt-4 text-[17px] font-semibold leading-relaxed text-sv-ink/60">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center gap-4 border-y border-sv-ink/[0.06] py-4 text-[13px] font-bold text-sv-ink/50">
              <span>{post.author}</span>
              <span>{new Date(post.publishedAt).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {post.readingMinutes} წთ კითხვა</span>
            </div>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.title} className="mb-10 aspect-[16/9] w-full rounded-tile object-cover shadow-card" />

          <div>{renderBody(post.body)}</div>

          {/* CTA */}
          <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
            <h2 className="text-[22px] font-black text-white md:text-[26px]">მოძებნეთ საკუთარი ბინა</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
              ვერიფიცირებული განცხადებები AI ფასის შეფასებითა და 3D რუკით — თბილისი, ბათუმი, ქუთაისი.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5"
            >
              ძიება <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </article>

        {/* Related posts — internal linking */}
        {related.length > 0 && (
          <section className="mt-16" aria-label="მსგავსი სტატიები">
            <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink">მსგავსი სტატიები</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-300 hover:shadow-card-hover"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-sv-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[14px] font-black leading-snug text-sv-ink line-clamp-3">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link href="/blog" className="mt-12 inline-flex items-center gap-1.5 text-[14px] font-extrabold text-sv-blue">
          <ArrowLeft className="h-4 w-4" aria-hidden /> ყველა სტატია
        </Link>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(postLd(slug)) }} />
    </div>
  )
}
