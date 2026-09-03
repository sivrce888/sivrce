import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { BuildingsCatalog } from '@/components/buildings/BuildingsCatalog'
import { FaqSection } from '@/components/seo/FaqSection'
import { BUILDINGS, buildingDealCounts } from '@/data/buildings'
import { getDeveloper } from '@/data/professionals'
import { getBuildingDealCountsBySlug } from '@/lib/map/db-buildings'
import { faqPageLd } from '@/lib/directory-seo'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'

const tbilisi = BUILDINGS.filter((b) => b.city === 'თბილისი')
const tbilisiCount = tbilisi.length
const RAIONS = new Set([
  'გლდანი', 'დიდუბე', 'ვაკე', 'ისანი', 'კრწანისი',
  'მთაწმინდა', 'ნაძალადევი', 'საბურთალო', 'სამგორი', 'ჩუღურეთი',
])
const districtCount = new Set(tbilisi.map((b) => b.district).filter((d) => RAIONS.has(d))).size
const ubaniCount = new Set(tbilisi.map((b) => b.ubani).filter(Boolean)).size

const faqs = [
  {
    q: 'რა შენობებია sivrce-ზე თბილისში?',
    a: `კატალოგში ${tbilisiCount} კორპუსია თბილისის ${districtCount} რაიონში — ფოტო, მისამართი, უბანი, დეველოპერი, სართულები, აღწერა, მეტრო და განცხადებები. Sivrce — უძრავი ქონება ერთ სივრცეში.`,
  },
  {
    q: 'შემიძლია უბნით ან რაიონით გავფილტრო?',
    a: 'დიახ. აირჩიე ქალაქი, რაიონი (ვაკე, საბურთალო, გლდანი…) და უბანი (ლისი, დიდი დიღომი, ვარკეთილი…). ძებნა მუშაობს სახელზე, მისამართზე და დეველოპერზე.',
  },
  {
    q: 'როგორ ვნახო მეტრო და მიმართულება?',
    a: 'ყველა თბილისის შენობის ბარათზე ჩანს უახლოესი მეტრო ფეხით. შენობის გვერდზე — სკოლა, პარკი, კლინიკა, მარკეტი და Apple Maps / Google Maps მიმართულება.',
  },
]

export const revalidate = 3600

// Shared with the CollectionPage JSON-LD below.
const buildingsDescription = `თბილისის ${tbilisiCount} კორპუსი ${districtCount} რაიონში და ${ubaniCount}+ უბანში — ფოტო, მისამართი, დეველოპერი, სართულები, მეტრო და განცხადებები. Sivrce — უძრავი ქონება ერთ სივრცეში.`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/buildings', lang, {
      ka: {
        title: `შენობები და კორპუსები — თბილისი (${tbilisiCount})`,
        description: buildingsDescription,
      },
      en: {
        title: `Buildings & Residential Complexes — Tbilisi (${tbilisiCount})`,
        description: `${tbilisiCount} Tbilisi buildings across ${districtCount} districts and ${ubaniCount}+ neighborhoods — photo, address, developer, floors, metro and listings. Sivrce — real estate in one place.`,
      },
      ru: {
        title: `Жилые комплексы и корпуса — Тбилиси (${tbilisiCount})`,
        description: `${tbilisiCount} корпусов Тбилиси в ${districtCount} районах и ${ubaniCount}+ кварталах — фото, адрес, застройщик, этажи, метро и объявления. Sivrce — недвижимость в одном пространстве.`,
      },
    }),
    openGraph: {
      title: 'შენობები და კორპუსები | sivrce',
      description: `თბილისის ${tbilisiCount} კორპუსი — ფოტო, უბანი, მეტრო, აღწერა, განცხადებები.`,
      type: 'website',
      url: 'https://sivrce.ge/buildings',
      siteName: 'sivrce',
      locale: 'ka_GE',
    },
  }
}

export default async function BuildingsPage() {
  const liveCounts = await getBuildingDealCountsBySlug()
  const countsBySlug: Record<string, ReturnType<typeof buildingDealCounts>> = {}
  const developerNames: Record<string, string> = {}
  for (const b of BUILDINGS) {
    countsBySlug[b.slug] =
      Object.keys(liveCounts).length > 0
        ? (liveCounts[b.slug] ?? { sale: 0, rent: 0, daily: 0, pledge: 0 })
        : buildingDealCounts(b.slug)
    if (!developerNames[b.developerSlug]) {
      const name = getDeveloper(b.developerSlug)?.name.ka
      if (name) developerNames[b.developerSlug] = name
    }
  }

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'შენობები და კორპუსები — თბილისი',
    description: buildingsDescription,
    url: 'https://sivrce.ge/buildings',
    isPartOf: { '@type': 'WebSite', name: 'sivrce', url: 'https://sivrce.ge' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: BUILDINGS.length,
      itemListElement: BUILDINGS.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        url: `https://sivrce.ge/buildings/${b.slug}`,
        image: `https://sivrce.ge${b.img}`,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="კატალოგი"
          title="შენობები და კორპუსები"
          subtitle={`${tbilisiCount} შენობა თბილისში, ${districtCount} რაიონი, ${ubaniCount} უბანი — ფოტო, მისამართი, მეტრო და აღწერა ერთ სივრცეში`}
        />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <div className="mt-6">
            <BuildingsCatalog
              buildings={BUILDINGS}
              countsBySlug={countsBySlug}
              developerNames={developerNames}
            />
          </div>
        </section>
        <FaqSection
          title="ხშირი კითხვები"
          items={faqs}
          className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10"
        />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(faqs)) }} />
    </div>
  )
}
