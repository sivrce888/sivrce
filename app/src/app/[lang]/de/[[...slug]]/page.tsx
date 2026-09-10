import CountryPage, { countryMetadata, countryStaticParams } from '@/components/country/CountryMarket'

export const revalidate = 86400

export function generateStaticParams() {
  return countryStaticParams('de')
}

export function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return countryMetadata('de', params)
}

export default function DeCountryPage({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  return <CountryPage country="de" params={params} />
}
