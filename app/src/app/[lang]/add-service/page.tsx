import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AddServiceForm } from '@/components/services/AddServiceForm'
import { requireUser } from '@/lib/guards'
import { isValidLang } from '@/lib/i18n/core'
import { kaOnlyAlternates, pageMeta } from '@/lib/i18n/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/add-service', lang, {
      ka: {
        title: 'დაამატე სერვისი',
        description: 'განათავსე უძრავ ქონებასთან დაკავშირებული სერვისი: რემონტი, იურიდიული, ფოტო, შეფასება, მართვა.',
      },
      en: {
        title: 'Add a service',
        description: 'List a real-estate service: renovation, legal, photography, valuation, property management.',
      },
      ru: {
        title: 'Добавить сервис',
        description: 'Разместите услугу в недвижимости: ремонт, юристы, фото, оценка, управление.',
      },
    }),
    alternates: kaOnlyAlternates('/add-service'),
    robots: { index: false, follow: true },
  }
}

export default async function AddServicePage() {
  await requireUser('/add-service')
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="სერვისები"
          title="დაამატე კომპანია"
          subtitle="რემონტი, ინტერიერი, ფოტო, იურიდიული, შეფასება, გადატანა, დასუფთავება, ქონების მართვა. ქონების განცხადება — ცალკე, იმავე ანგარიშით."
        />
        <section className="mx-auto max-w-[640px] px-5 pb-20 md:px-10">
          <AddServiceForm />
        </section>
      </main>
      <Footer />
    </div>
  )
}
