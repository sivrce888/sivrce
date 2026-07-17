import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the save-search control (shared dicts are locked).
 * ka/en/ru covered; other langs fall back to en.
 */
const STRINGS = {
  ka: {
    saveSearch: 'ძიების შენახვა',
    savedSearches: 'შენახული ძიებები',
    saveCurrent: 'მიმდინარე ძიების შენახვა',
    savedAlready: 'შენახულია',
    empty: 'ჯერ არაფერი გაქვს შენახული',
    remove: 'წაშლა',
    allListings: 'ყველა განცხადება',
  },
  en: {
    saveSearch: 'Save search',
    savedSearches: 'Saved searches',
    saveCurrent: 'Save current search',
    savedAlready: 'Saved',
    empty: 'Nothing saved yet',
    remove: 'Delete',
    allListings: 'All listings',
  },
  ru: {
    saveSearch: 'Сохранить поиск',
    savedSearches: 'Сохранённые поиски',
    saveCurrent: 'Сохранить текущий поиск',
    savedAlready: 'Сохранено',
    empty: 'Пока ничего не сохранено',
    remove: 'Удалить',
    allListings: 'Все объявления',
  },
} as const

export type SearchStringKey = keyof (typeof STRINGS)['en']

export function useSearchStrings(): (key: SearchStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<SearchStringKey, string> =
    lang === 'ka' || lang === 'ru' ? STRINGS[lang] : STRINGS.en
  return (key) => dict[key]
}
