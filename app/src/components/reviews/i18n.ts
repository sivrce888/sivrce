/**
 * Co-located reviews strings (ka/en/ru, other langs fall back to en).
 * Shared dicts in src/lib/i18n stay untouched per worker rules.
 */
import { ruPlural, type Lang } from '@/lib/i18n/context'

export interface ReviewStrings {
  sectionTitle: string
  loading: string
  reviewsCount: (n: number) => string
  sortLabel: string
  sortNewest: string
  sortHighest: string
  sortLowest: string
  sortHelpful: string
  verified: string
  helpful: string
  ownerResponse: string
  emptyTitle: string
  emptySub: string
  formTitle: string
  yourRating: string
  nameLabel: string
  optionalTag: string
  namePlaceholder: string
  titleLabel: string
  titlePlaceholder: string
  bodyLabel: string
  bodyPlaceholder: string
  minChars: (n: number, min: number) => string
  submit: string
  submitting: string
  anonymous: string
  errorRating: string
  errorBody: (min: number) => string
  errorAlready: string
  errorGeneric: string
  update: string
  deleteReview: string
  replyCta: string
  replyPlaceholder: string
  replySave: string
  replySaving: string
  replySaved: string
  replyError: string
  aboutYou: string
  prevPage: string
  nextPage: string
  pageOf: (page: number, pages: number) => string
  loadError: string
  retry: string
  starsReadOnly: (value: number) => string
  starOption: (n: number) => string
  distributionRow: (stars: number, count: number) => string
  signInToReview: string
}

const ka: ReviewStrings = {
  sectionTitle: 'შეფასებები',
  loading: 'იტვირთება…',
  reviewsCount: (n) => `${n} შეფასება`,
  sortLabel: 'დალაგება',
  sortNewest: 'უახლესი',
  sortHighest: 'უმაღლესი შეფასება',
  sortLowest: 'უმდაბლესი შეფასება',
  sortHelpful: 'ყველაზე სასარგებლო',
  verified: 'ვერიფიცირებული',
  helpful: 'სასარგებლო',
  ownerResponse: 'მფლობელის პასუხი',
  emptyTitle: 'იყავი პირველი, ვინც შეაფასებს',
  emptySub: 'შენი გამოცდილება დაეხმარება სხვებს უკეთესი არჩევანის გაკეთებაში.',
  formTitle: 'დაწერე შეფასება',
  yourRating: 'შენი შეფასება',
  nameLabel: 'სახელი',
  optionalTag: 'არასავალდებულო',
  namePlaceholder: 'შენი სახელი',
  titleLabel: 'სათაური',
  titlePlaceholder: 'შეაჯამე რამდენიმე სიტყვით',
  bodyLabel: 'შეფასების ტექსტი',
  bodyPlaceholder: 'გაგვიზიარე შენი გამოცდილება…',
  minChars: (n, min) =>
    n >= min ? `${n} სიმბოლო` : `მინიმუმ ${min} სიმბოლო — ${n}/${min}`,
  submit: 'შეფასების გაგზავნა',
  submitting: 'იგზავნება…',
  anonymous: 'ანონიმი',
  errorRating: 'აირჩიე ვარსკვლავების რაოდენობა',
  errorBody: (min) => `ტექსტი უნდა შეიცავდეს მინიმუმ ${min} სიმბოლოს`,
  errorAlready: 'ამ გვერდზე უკვე დაგიტოვებია შეფასება',
  errorGeneric: 'გაგზავნა ვერ მოხერხდა — სცადე თავიდან',
  update: 'განახლება',
  deleteReview: 'შეფასების წაშლა',
  replyCta: 'პასუხი',
  replyPlaceholder: 'დაწერე პასუხი ამ შეფასებას…',
  replySave: 'პასუხის გაგზავნა',
  replySaving: 'იგზავნება…',
  replySaved: 'შენახულია ✓',
  replyError: 'პასუხი ვერ შეინახა — სცადე თავიდან',
  aboutYou: 'შეფასებები შენზე',
  prevPage: 'წინა',
  nextPage: 'შემდეგი',
  pageOf: (page, pages) => `გვერდი ${page} / ${pages}`,
  loadError: 'შეფასებების ჩატვირთვა ვერ მოხერხდა',
  retry: 'თავიდან ცდა',
  starsReadOnly: (v) => `შეფასება: 5-დან ${v}-მდე`,
  starOption: (n) => `${n} ვარსკვლავი`,
  distributionRow: (stars, count) => `${stars} ვარსკვლავი: ${count}`,
  signInToReview: 'შედი ანგარიშში შეფასების დასატოვებლად',
}

const en: ReviewStrings = {
  sectionTitle: 'Reviews',
  loading: 'Loading…',
  reviewsCount: (n) => (n === 1 ? '1 review' : `${n} reviews`),
  sortLabel: 'Sort by',
  sortNewest: 'Newest',
  sortHighest: 'Highest rated',
  sortLowest: 'Lowest rated',
  sortHelpful: 'Most helpful',
  verified: 'Verified',
  helpful: 'Helpful',
  ownerResponse: 'Response from the owner',
  emptyTitle: 'Be the first to review',
  emptySub: 'Your experience helps others make a better choice.',
  formTitle: 'Write a review',
  yourRating: 'Your rating',
  nameLabel: 'Name',
  optionalTag: 'optional',
  namePlaceholder: 'Your name',
  titleLabel: 'Title',
  titlePlaceholder: 'Sum it up in a few words',
  bodyLabel: 'Your review',
  bodyPlaceholder: 'Share your experience…',
  minChars: (n, min) =>
    n >= min ? `${n} characters` : `Minimum ${min} characters — ${n}/${min}`,
  submit: 'Submit review',
  submitting: 'Submitting…',
  anonymous: 'Anonymous',
  errorRating: 'Please select a star rating',
  errorBody: (min) => `Review must be at least ${min} characters`,
  errorAlready: 'You have already reviewed this',
  errorGeneric: 'Could not submit — please try again',
  update: 'Update review',
  deleteReview: 'Delete review',
  replyCta: 'Reply',
  replyPlaceholder: 'Write a reply to this review…',
  replySave: 'Send reply',
  replySaving: 'Sending…',
  replySaved: 'Saved ✓',
  replyError: 'Could not save the reply — please try again',
  aboutYou: 'Reviews about you',
  prevPage: 'Previous',
  nextPage: 'Next',
  pageOf: (page, pages) => `Page ${page} of ${pages}`,
  loadError: 'Could not load reviews',
  retry: 'Try again',
  starsReadOnly: (v) => `Rated ${v} out of 5 stars`,
  starOption: (n) => (n === 1 ? '1 star' : `${n} stars`),
  distributionRow: (stars, count) => `${stars} stars: ${count}`,
  signInToReview: 'Sign in to leave a review',
}

const ru: ReviewStrings = {
  sectionTitle: 'Отзывы',
  loading: 'Загрузка…',
  reviewsCount: (n) => `${n} ${ruPlural(n, 'отзыв', 'отзыва', 'отзывов')}`,
  sortLabel: 'Сортировка',
  sortNewest: 'Сначала новые',
  sortHighest: 'Сначала с высокой оценкой',
  sortLowest: 'Сначала с низкой оценкой',
  sortHelpful: 'Самые полезные',
  verified: 'Проверен',
  helpful: 'Полезно',
  ownerResponse: 'Ответ владельца',
  emptyTitle: 'Оставьте первый отзыв',
  emptySub: 'Ваш опыт поможет другим сделать лучший выбор.',
  formTitle: 'Написать отзыв',
  yourRating: 'Ваша оценка',
  nameLabel: 'Имя',
  optionalTag: 'необязательно',
  namePlaceholder: 'Ваше имя',
  titleLabel: 'Заголовок',
  titlePlaceholder: 'Кратко о главном',
  bodyLabel: 'Ваш отзыв',
  bodyPlaceholder: 'Расскажите о вашем опыте…',
  minChars: (n, min) =>
    n >= min ? `${n} символов` : `Минимум ${min} символов — ${n}/${min}`,
  submit: 'Отправить отзыв',
  submitting: 'Отправка…',
  anonymous: 'Аноним',
  errorRating: 'Пожалуйста, выберите оценку',
  errorBody: (min) => `Отзыв должен содержать минимум ${min} символов`,
  errorAlready: 'Вы уже оставили отзыв об этом',
  errorGeneric: 'Не удалось отправить — попробуйте ещё раз',
  update: 'Обновить отзыв',
  deleteReview: 'Удалить отзыв',
  replyCta: 'Ответить',
  replyPlaceholder: 'Напишите ответ на этот отзыв…',
  replySave: 'Отправить ответ',
  replySaving: 'Отправка…',
  replySaved: 'Сохранено ✓',
  replyError: 'Не удалось сохранить ответ — попробуйте ещё раз',
  aboutYou: 'Отзывы о вас',
  prevPage: 'Назад',
  nextPage: 'Вперёд',
  pageOf: (page, pages) => `Страница ${page} из ${pages}`,
  loadError: 'Не удалось загрузить отзывы',
  retry: 'Повторить',
  starsReadOnly: (v) => `Оценка ${v} из 5`,
  starOption: (n) => `${n} ${ruPlural(n, 'звезда', 'звезды', 'звёзд')}`,
  distributionRow: (stars, count) => `${stars} звёзд: ${count}`,
  signInToReview: 'Войдите, чтобы оставить отзыв',
}

export function getReviewStrings(lang: Lang): ReviewStrings {
  if (lang === 'ka') return ka
  if (lang === 'ru') return ru
  return en
}
