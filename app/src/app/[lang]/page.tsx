import HomeMain from '@/components/HomeMain'
import { isValidLang } from '@/lib/i18n/core'

// Paid SUPER VIP / VIP+ rails — 60s ISR so a just-purchased slot lands on home.
export const revalidate = 60

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  return <HomeMain lang={isValidLang(raw) ? raw : 'ka'} />
}
