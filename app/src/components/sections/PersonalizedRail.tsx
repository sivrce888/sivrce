'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'
import type { Listing } from '@/data/listings'
import {
  getRecommendedFromStorage,
  hasPersonalisationSignal,
  type PersonalizedRecommendation,
} from '@/lib/personalisation'

const TITLES = {
  ka: { kicker: 'თქვენთვის შერჩეული', title: 'პერსონალური რეკომენდაციები', sub: 'თქვენს ინტერესებსა და ძიების ისტორიაზე მორგებული შეთავაზებები', viewAll: 'ყველას ნახვა' },
  en: { kicker: 'Curated for You', title: 'Personalized Recommendations', sub: 'Tailored listings matched to your taste, budget, and favorite areas', viewAll: 'View all' },
  ru: { kicker: 'Подобрано для вас', title: 'Персональные рекомендации', sub: 'Предложения на основе ваших предпочтений и истории поиска', viewAll: 'Смотреть все' },
  de: { kicker: 'Für Sie ausgewählt', title: 'Personalisierte Empfehlungen', sub: 'Passende Angebote basierend auf Ihren Vorlieben und Suchanfragen', viewAll: 'Alle anzeigen' },
  tr: { kicker: 'Sizin İçin Seçildi', title: 'Kişiselleştirilmiş Öneriler', sub: 'Arama geçmişinize ve bütçenize göre en uygun ilanlar', viewAll: 'Tümünü gör' },
  uk: { kicker: 'Підібрано для вас', title: 'Персональні рекомендації', sub: 'Пропозиції на основі ваших уподобань та історії пошуку', viewAll: 'Дивитися все' },
  he: { kicker: 'נבחר במיוחד עבורך', title: 'המלצות מותאמות אישית', sub: 'נכסים שנבחרו בהתאם לתקציב ולהעדפות שלך', viewAll: 'צפה בהכל' },
  ar: { kicker: 'مختار خصيصاً لك', title: 'توصيات مخصصة', sub: 'عقارات مختارة بناءً على اهتماماتك وتاريخ بحثك وميزانيتك', viewAll: 'عرض الكل' },
  hy: { kicker: 'Ընտրված է ձեզ համար', title: 'Անհատական առաջարկներ', sub: 'Հատուկ առաջարկներ ձեր նախասիրություններին համապատասխան', viewAll: 'Տեսնել բոլորը' },
  az: { kicker: 'Sizin üçün seçilmiş', title: 'Fərdi tövsiyələr', sub: 'Zövqünüzə və axtarış tarixçənizə uyğun təkliflər', viewAll: 'Hamısına bax' },
}

export default function PersonalizedRail({
  catalog,
  limit = 8,
}: {
  catalog: Listing[]
  limit?: number
}) {
  const { lang } = useI18n()
  const [recs, setRecs] = useState<PersonalizedRecommendation[]>([])

  useEffect(() => {
    const update = () => {
      // Gate: returning users only — first-timers keep the standard rails.
      const items = hasPersonalisationSignal()
        ? getRecommendedFromStorage(catalog, limit, lang)
        : []
      setRecs(items)
    }

    update()

    const onStorageChange = () => update()
    window.addEventListener('sivrce:recent-changed', onStorageChange)
    window.addEventListener('sivrce:favs-changed', onStorageChange)
    window.addEventListener('sivrce:saved-searches-changed', onStorageChange)
    window.addEventListener('storage', onStorageChange)

    return () => {
      window.removeEventListener('sivrce:recent-changed', onStorageChange)
      window.removeEventListener('sivrce:favs-changed', onStorageChange)
      window.removeEventListener('sivrce:saved-searches-changed', onStorageChange)
      window.removeEventListener('storage', onStorageChange)
    }
  }, [catalog, limit, lang])

  if (recs.length === 0) return null

  const t = TITLES[lang] || TITLES.en

  return (
    <section
      id="personalized-recommendations"
      className="relative overflow-hidden py-[clamp(3rem,2.2rem+3vw,5.5rem)] bg-sv-cloud/50 dark:bg-sv-surface/40 border-y border-sv-border/40"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-sv-blue-deep to-sv-blue text-white shadow-glow-blue-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {t.kicker}
            </span>
            <h2 className="sv-h2 text-sv-ink">{t.title}</h2>
            <p className="mt-1.5 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              {t.sub}
            </p>
          </div>
          <LocalizedLink
            href="/search"
            className="group flex items-center gap-2 text-[14px] font-extrabold text-sv-blue-deep dark:text-sv-blue-light transition-colors hover:text-sv-blue-deep dark:hover:text-sv-blue-light"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <HScroll aria-label={t.title} step={420} className="gap-6 pb-2 pt-1">
          {recs.map((r, i) => (
            <div key={r.listing.id} className="relative flex flex-col">
              {r.reasonLabel ? (
                <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-md bg-sv-blue/10 px-2 py-0.5 text-[11px] font-bold text-sv-blue-deep dark:bg-sv-blue/20 dark:text-sv-blue-light">
                  <span className="h-1.5 w-1.5 rounded-full bg-sv-blue animate-pulse" />
                  {r.reasonLabel}
                </div>
              ) : null}
              <ListingCard l={r.listing} i={i} animate={false} />
            </div>
          ))}
        </HScroll>
      </div>
    </section>
  )
}
