import type { Metadata } from 'next'
import LocalizedHome from '@/components/i18n/LocalizedHome'

// Refresh featured listings from DB hourly (ISR).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Real Estate in Georgia — Apartments & Houses for Sale and Rent',
  description:
    "sivrce — Georgia's most advanced real estate platform. Apartments, houses, cottages, land and commercial property for sale and rent — with an interactive 3D map and AI price estimates.",
  alternates: {
    canonical: '/en',
    languages: {
      'ka-GE': '/',
      en: '/en',
      ru: '/ru',
      'x-default': '/',
    },
  },
  openGraph: {
    locale: 'en_US',
  },
}

export default function HomeEn() {
  return <LocalizedHome lang="en" />
}
