import I18nProvider, { type Lang } from '@/components/I18nProvider'
import HomeMain from '@/components/HomeMain'

/**
 * Server-rendered locale homepage (/en, /ru). The nested provider pins the
 * language so SSR HTML is fully translated; <html lang> stays 'ka' until
 * hydration — ponytail: hreflang tags + content carry the signal, the full
 * app/[lang] migration will set it server-side.
 */
export default function LocalizedHome({ lang }: { lang: Lang }) {
  return (
    <I18nProvider initialLang={lang}>
      <HomeMain />
    </I18nProvider>
  )
}
