import CountryPage, { countryMetadata, countryStaticParams } from '@/components/country/CountryMarket'

export const revalidate = 86400

export function generateStaticParams() {
  return countryStaticParams('ae')
}

export function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return countryMetadata('ae', params)
}

export default function AeCountryPage({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return <CountryPage country="ae" params={params} />
}
