import HomeMain from '@/components/HomeMain'
import { isValidLang } from '@/lib/i18n/core'

// Refresh featured listings from DB hourly (ISR).
export const revalidate = 3600

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  return <HomeMain lang={isValidLang(raw) ? raw : 'ka'} />
}
