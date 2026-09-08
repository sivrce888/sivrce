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
import { faqPageLd, type DirLoc } from '@/lib/directory-seo'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { dirLoc } from '@/lib/directory-seo'

const tbilisi = BUILDINGS.filter((b) => b.city === 'თბილისი')
const tbilisiCount = tbilisi.length
const RAIONS = new Set([
  'გლდანი', 'დიდუბე', 'ვაკე', 'ისანი', 'კრწანისი',
  'მთაწმინდა', 'ნაძალადევი', 'საბურთალო', 'სამგორი', 'ჩუღურეთი',
])
const districtCount = new Set(tbilisi.map((b) => b.district).filter((d) => RAIONS.has(d))).size
const ubaniCount = new Set(tbilisi.map((b) => b.ubani).filter(Boolean)).size

// Per-locale page copy (hero + FAQ) — mirrors the pageMeta table above.
const COPY: Record<DirLoc, {
  kicker: string; title: string; subtitle: string; faqTitle: string
  faqs: { q: string; a: string }[]; ldName: string
}> = {
  ka: {
    kicker: 'კატალოგი',
    title: 'შენობები და კორპუსები',
    subtitle: `${tbilisiCount} შენობა თბილისში, ${districtCount} რაიონი, ${ubaniCount} უბანი — ფოტო, მისამართი, მეტრო და აღწერა ერთ სივრცეში`,
    faqTitle: 'ხშირი კითხვები',
    faqs: [
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
        a: 'ყველა თბილისის შენობის ბარათზე მითითებულია უახლოესი მეტრო და ფეხით დრო. შენობის გვერდზე — სკოლა, პარკი, კლინიკა, მარკეტი და Apple Maps / Google Maps მიმართულება.',
      },
    ],
    ldName: 'შენობები და კორპუსები — თბილისი',
  },
  en: {
    kicker: 'Catalog',
    title: 'Buildings & Residential Complexes',
    subtitle: `${tbilisiCount} buildings in Tbilisi across ${districtCount} districts and ${ubaniCount} neighborhoods — photo, address, metro and description in one place`,
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'What buildings are on sivrce in Tbilisi?',
        a: `The catalog lists ${tbilisiCount} buildings across ${districtCount} Tbilisi districts — photo, address, neighborhood, developer, floors, description, metro and listings. Sivrce — real estate in one place.`,
      },
      {
        q: 'Can I filter by neighborhood or district?',
        a: 'Yes. Pick a city, a district (Vake, Saburtalo, Gldani…) and a neighborhood (Lisi, Didi Digomi, Varketili…). Search works by name, address and developer.',
      },
      {
        q: 'How do I see the metro and directions?',
        a: 'Every Tbilisi building card shows the nearest metro with walking time. The building page lists schools, parks, clinics, shops and Apple Maps / Google Maps directions.',
      },
    ],
    ldName: 'Buildings & Residential Complexes — Tbilisi',
  },
  ru: {
    kicker: 'Каталог',
    title: 'Жилые комплексы и корпуса',
    subtitle: `${tbilisiCount} корпусов в Тбилиси, ${districtCount} районов, ${ubaniCount} кварталов — фото, адрес, метро и описание в одном пространстве`,
    faqTitle: 'Частые вопросы',
    faqs: [
      {
        q: 'Какие корпуса есть на sivrce в Тбилиси?',
        a: `В каталоге ${tbilisiCount} корпусов в ${districtCount} районах Тбилиси — фото, адрес, квартал, застройщик, этажи, описание, метро и объявления. Sivrce — недвижимость в одном пространстве.`,
      },
      {
        q: 'Можно ли фильтровать по кварталу или району?',
        a: 'Да. Выберите город, район (Ваке, Сабуртало, Глдани…) и квартал (Лиси, Диди Дигоми, Варкетили…). Поиск работает по названию, адресу и застройщику.',
      },
      {
        q: 'Как посмотреть метро и маршрут?',
        a: 'На карточке каждого корпуса указано ближайшее метро пешком. На странице корпуса — школы, парки, клиники, магазины и маршруты Apple Maps / Google Maps.',
      },
    ],
    ldName: 'Жилые комплексы и корпуса — Тбилиси',
  },
}


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
      title: 'შენობები და კორპუსები',
      description: `თბილისის ${tbilisiCount} კორპუსი — ფოტო, უბანი, მეტრო, აღწერა, განცხადებები.`,
      type: 'website',
      url: 'https://sivrce.ge/buildings',
      siteName: 'sivrce',
      locale: 'ka_GE',
    },
  }
}

export default async function BuildingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const loc = dirLoc(isValidLang(raw) ? raw : 'ka')
  const c = COPY[loc]
  const liveCounts = await getBuildingDealCountsBySlug()
  const countsBySlug: Record<string, ReturnType<typeof buildingDealCounts>> = {}
  const developerNames: Record<string, string> = {}
  for (const b of BUILDINGS) {
    countsBySlug[b.slug] =
      Object.keys(liveCounts).length > 0
        ? (liveCounts[b.slug] ?? { sale: 0, rent: 0, daily: 0, pledge: 0 })
        : buildingDealCounts(b.slug)
    if (!developerNames[b.developerSlug]) {
      const name = getDeveloper(b.developerSlug)?.name
      if (name) developerNames[b.developerSlug] = name[loc]
    }
  }

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: c.ldName,
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
        <PageHero tone="light" kicker={c.kicker} title={c.title} subtitle={c.subtitle} />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <div className="mt-6">
            <BuildingsCatalog
              buildings={BUILDINGS}
              countsBySlug={countsBySlug}
              developerNames={developerNames}
              loc={loc}
            />
          </div>
        </section>
        <FaqSection
          title={c.faqTitle}
          items={c.faqs}
          className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10"
        />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(c.faqs)) }} />
    </div>
  )
}
