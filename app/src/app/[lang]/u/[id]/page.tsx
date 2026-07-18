import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { BadgeCheck, MapPin } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { db } from '@/lib/db'
import { getListingsByOwner } from '@/lib/listings-db'
import { SELLER_ROLE_LABEL, type SellerRole } from '@/lib/profiles/roles'
import { SERVICE_BRAND } from '@/lib/category-brand'
import { langAlternates } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

function roleOf(role: string): SellerRole {
  switch (role) {
    case 'agent':
      return 'agent'
    case 'agency':
      return 'agency'
    case 'developer':
      return 'developer'
    default:
      return 'owner'
  }
}

function brandFor(role: SellerRole) {
  if (role === 'developer') return SERVICE_BRAND.developers
  if (role === 'owner') return SERVICE_BRAND.renovation
  return SERVICE_BRAND.agents
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const user = await db.user
    .findUnique({ where: { id }, select: { name: true, role: true } })
    .catch(() => null)
  if (!user || user.role === 'buyer' || user.role === 'admin') return {}
  const role = roleOf(user.role)
  const title = `${user.name ?? 'sivrce'} — ${SELLER_ROLE_LABEL[role].ka}`
  return {
    title,
    robots: { index: true, follow: true },
    alternates: { canonical: `/u/${id}`, languages: langAlternates(`/u/${id}`) },
  }
}

export default async function PublicUserProfilePage({ params }: PageProps) {
  const { id } = await params

  const user = await db.user
    .findUnique({
      where: { id },
      select: { id: true, name: true, image: true, role: true, trustScore: true },
    })
    .catch(() => null)

  if (!user || user.role === 'buyer' || user.role === 'admin') notFound()

  const role = roleOf(user.role)
  const brand = brandFor(role)
  const label = SELLER_ROLE_LABEL[role]
  const listings = await getListingsByOwner(user.id).catch(() => [])

  const displayName = user.name?.trim() || 'sivrce'
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const personLd = {
    '@context': 'https://schema.org',
    '@type': role === 'developer' ? 'Organization' : 'RealEstateAgent',
    name: displayName,
    url: `https://sivrce.ge/u/${user.id}`,
    ...(user.image ? { image: user.image } : {}),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <header className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:px-10 md:py-14">
            <div className="flex min-w-0 items-start gap-5">
              {user.image ? (
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface md:h-24 md:w-24">
                  <Image src={user.image} alt="" fill sizes="96px" className="object-cover" />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-card text-[28px] font-black md:h-24 md:w-24"
                  style={{ color: brand.hue, backgroundColor: brand.chip }}
                >
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <span
                  className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider"
                  style={{ color: brand.hue, backgroundColor: brand.chip }}
                >
                  {label.ka}
                </span>
                <h1 className="flex flex-wrap items-center gap-2 text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
                  <span className="truncate">{displayName}</span>
                  {user.trustScore >= 85 ? (
                    <BadgeCheck className="h-6 w-6 shrink-0 text-sv-blue" aria-label="ვერიფიცირებული" />
                  ) : null}
                </h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-bold text-sv-ink/55">
                  <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden />
                  საქართველო · {listings.length} აქტიური განცხადება
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            განცხადებები
          </h2>
          {listings.length === 0 ? (
            <p className="mt-6 text-[15px] font-semibold text-sv-ink/55">
              ამ მომენტში აქტიური განცხადება არ არის.
            </p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personLd) }} />
    </div>
  )
}
