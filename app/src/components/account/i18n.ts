import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the account hub (shared dicts are locked).
 * ka/en/ru covered; other langs fall back to en.
 */
const STRINGS = {
  ka: {
    profile: 'პროფილი',
    signIn: 'Google-ით შესვლა',
    signInHint: 'შედი, რომ ნახო შენი შეფასებები და დაასინქრონო აქტივობა.',
    favorites: 'ფავორიტები',
    savedListings: 'შენახული განცხადებები',
    viewAll: 'ყველას ნახვა',
    savedSearches: 'შენახული ძიებები',
    noSavedSearches: 'ჯერ არ გაქვს შენახული ძიება',
    saveSearchHint: 'შეინახე ფილტრები ძიების გვერდიდან.',
    remove: 'წაშლა',
    recentlyViewed: 'ბოლოს ნანახი',
    noRecent: 'ჯერ არაფერი გინახავს.',
    browse: 'განცხადებების ნახვა',
    myReviews: 'ჩემი შეფასებები',
    noReviews: 'ჯერ არ გაქვს შეფასებები.',
    reviewsSignIn: 'შედი შენი შეფასებების სანახავად.',
    reviewsError: 'შეფასებები ვერ ჩაიტვირთა.',
    retry: 'თავიდან ცდა',
    loading: 'იტვირთება…',
    targetListing: 'განცხადება',
    targetProject: 'პროექტი',
    targetDeveloper: 'დეველოპერი',
    targetAgent: 'აგენტი',
    targetNeighborhood: 'უბანი',
    targetAccount: 'ანგარიში',
  },
  en: {
    profile: 'Profile',
    signIn: 'Sign in with Google',
    signInHint: 'Sign in to see your reviews and sync your activity.',
    favorites: 'Favorites',
    savedListings: 'Saved listings',
    viewAll: 'View all',
    savedSearches: 'Saved searches',
    noSavedSearches: 'No saved searches yet',
    saveSearchHint: 'Save filters from the search page.',
    remove: 'Delete',
    recentlyViewed: 'Recently viewed',
    noRecent: 'Nothing viewed yet.',
    browse: 'Browse listings',
    myReviews: 'My reviews',
    noReviews: 'No reviews yet.',
    reviewsSignIn: 'Sign in to see your reviews.',
    reviewsError: "Couldn't load reviews.",
    retry: 'Retry',
    loading: 'Loading…',
    targetListing: 'Listing',
    targetProject: 'Project',
    targetDeveloper: 'Developer',
    targetAgent: 'Agent',
    targetNeighborhood: 'Neighborhood',
    targetAccount: 'Account',
  },
  ru: {
    profile: 'Профиль',
    signIn: 'Войти через Google',
    signInHint: 'Войдите, чтобы видеть свои отзывы и синхронизировать активность.',
    favorites: 'Избранное',
    savedListings: 'Сохранённые объявления',
    viewAll: 'Смотреть все',
    savedSearches: 'Сохранённые поиски',
    noSavedSearches: 'Пока нет сохранённых поисков',
    saveSearchHint: 'Сохраняйте фильтры со страницы поиска.',
    remove: 'Удалить',
    recentlyViewed: 'Недавно просмотренные',
    noRecent: 'Вы пока ничего не смотрели.',
    browse: 'Смотреть объявления',
    myReviews: 'Мои отзывы',
    noReviews: 'У вас пока нет отзывов.',
    reviewsSignIn: 'Войдите, чтобы увидеть свои отзывы.',
    reviewsError: 'Не удалось загрузить отзывы.',
    retry: 'Повторить',
    loading: 'Загрузка…',
    targetListing: 'Объявление',
    targetProject: 'Проект',
    targetDeveloper: 'Застройщик',
    targetAgent: 'Агент',
    targetNeighborhood: 'Район',
    targetAccount: 'Аккаунт',
  },
} as const

export type AccountStringKey = keyof (typeof STRINGS)['en']

export function useAccountStrings(): (key: AccountStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<AccountStringKey, string> =
    lang === 'ka' || lang === 'ru' ? STRINGS[lang] : STRINGS.en
  return (key) => dict[key]
}
