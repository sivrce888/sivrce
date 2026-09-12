import CountryPage, { countryMetadata, countryStaticParams } from '@/components/country/CountryMarket'

export const revalidate = 86400
const CC = 'mm' as const

export function generateStaticParams() {
  return countryStaticParams(CC)
}

export function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return countryMetadata(CC, params)
}

export default function MmCountryPage({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return <CountryPage country={CC} params={params} />
}
