import type { Metadata } from 'next'
import LocalizedHome from '@/components/i18n/LocalizedHome'

// Refresh featured listings from DB hourly (ISR).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Недвижимость в Грузии — квартиры и дома: продажа и аренда',
  description:
    'sivrce — самая технологичная платформа недвижимости в Грузии. Квартиры, дома, дачи, земельные участки и коммерческая недвижимость — с интерактивной 3D-картой и ИИ-оценкой цены.',
  alternates: {
    canonical: '/ru',
    languages: {
      'ka-GE': '/',
      en: '/en',
      ru: '/ru',
      'x-default': '/',
    },
  },
  openGraph: {
    locale: 'ru_RU',
  },
}

export default function HomeRu() {
  return <LocalizedHome lang="ru" />
}
