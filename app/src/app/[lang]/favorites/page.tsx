import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import FavoritesClient from '@/components/favorites/FavoritesClient'
import { isValidLang } from '@/lib/i18n/core'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    title: lang === 'ka' ? 'ფავორიტები' : lang === 'ru' ? 'Избранное' : 'Favorites',
    description:
      lang === 'ka'
        ? 'შენი შენახული განცხადებები sivrce-ზე.'
        : lang === 'ru'
          ? 'Твои сохранённые объявления на sivrce.'
          : 'Your saved listings on sivrce.',
    robots: { index: false },
  }
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t =
    lang === 'ka'
      ? {
          kicker: 'შენახული',
          title: 'ფავორიტები',
          subtitle: 'განცხადებები, რომლებიც გულის ნიშნით მონიშნე — შესვლისას ყველა მოწყობილობაზე სინქრონდება.',
        }
      : lang === 'ru'
        ? {
            kicker: 'Сохранённое',
            title: 'Избранное',
            subtitle: 'Объявления, отмеченные сердечком — после входа синхронизируются на всех устройствах.',
          }
        : {
            kicker: 'Saved',
            title: 'Favorites',
            subtitle: 'Listings you hearted — synced across your devices when you sign in.',
          }
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={t.kicker} title={t.title} subtitle={t.subtitle} />
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <FavoritesClient />
        </section>
      </main>
      <Footer />
    </div>
  )
}
