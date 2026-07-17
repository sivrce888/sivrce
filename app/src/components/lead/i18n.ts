/**
 * Lead-capture strings, co-located per workspace i18n rule (shared dicts are
 * off-limits). ka/en/ru are complete; the remaining six langs fall back to en.
 * Select with `useI18n().lang` from `@/lib/i18n/context`.
 */

import type { Lang } from '@/lib/i18n/context'

export interface LeadStrings {
  formTitle: string
  formSubtitle: string
  formSubtitleTo: (name: string) => string
  nameLabel: string
  namePh: string
  nameErr: string
  phoneLabel: string
  phonePh: string
  phoneErr: string
  messageLabel: string
  messagePh: string
  messageErr: string
  submit: string
  sending: string
  successTitle: string
  successBody: (name?: string) => string
  successNote: string
  newMessage: string
  errorTitle: string
  errorGeneric: string
  rateLimited: string
  retry: string
  call: string
  messageAction: string
  close: string
  barLabel: string
  dialogLabel: string
}

const ka: LeadStrings = {
  formTitle: 'დაინტერესდა?',
  formSubtitle: 'შეავსე ფორმა — უპასუხებენ რამდენიმე საათში',
  formSubtitleTo: (name) => `${name} უპასუხებს — ჩვეულებრივ რამდენიმე საათში`,
  nameLabel: 'სახელი',
  namePh: 'შენი სახელი',
  nameErr: 'შეიყვანე სახელი (მინ. 2 სიმბოლო)',
  phoneLabel: 'ტელეფონი',
  phonePh: '+995 555 12 34 56',
  phoneErr: 'შეიყვანე ნომერი ფორმატით +995 XXX XX XX XX',
  messageLabel: 'მესაჯი',
  messagePh: 'გამარჯობა! მაინტერესებს დამატებითი დეტალები…',
  messageErr: 'მესაჯი უნდა შეიცავდეს მინ. 10 სიმბოლოს',
  submit: 'გაგზავნა',
  sending: 'იგზავნება…',
  successTitle: 'მესაჯი გაიგზავნა!',
  successBody: (name) => (name ? `${name} დაგიკავშირდება უახლოეს დროს.` : 'დაგიკავშირდებათ უახლოეს დროს.'),
  successNote: 'შემდეგი ნაბიჯი: დაგირეკავენ მითითებულ ნომერზე — ნუ გამოტოვებ ზარს.',
  newMessage: 'ახალი მესაჯი',
  errorTitle: 'ვერ გაიგზავნა',
  errorGeneric: 'დაფიქსირდა შეცდომა. შეამოწმე კავშირი და სცადე თავიდან.',
  rateLimited: 'ზედმეტად ბევრი მცდელობა — სცადე რამდენიმე წუთში.',
  retry: 'თავიდან ცდა',
  call: 'დარეკვა',
  messageAction: 'მესაჯი',
  close: 'დახურვა',
  barLabel: 'სწრაფი კონტაქტი',
  dialogLabel: 'მესაჯის გაგზავნა',
}

const en: LeadStrings = {
  formTitle: 'Interested?',
  formSubtitle: 'Fill in the form — replies usually within a few hours',
  formSubtitleTo: (name) => `${name} replies — usually within a few hours`,
  nameLabel: 'Name',
  namePh: 'Your name',
  nameErr: 'Enter your name (min. 2 characters)',
  phoneLabel: 'Phone',
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Use the format +995 XXX XX XX XX',
  messageLabel: 'Message',
  messagePh: 'Hi! I’d like more details…',
  messageErr: 'Message must be at least 10 characters',
  submit: 'Send',
  sending: 'Sending…',
  successTitle: 'Message sent!',
  successBody: (name) => (name ? `${name} will contact you shortly.` : 'You’ll be contacted shortly.'),
  successNote: 'Next step: expect a call on the number you provided — keep your phone close.',
  newMessage: 'New message',
  errorTitle: 'Not sent',
  errorGeneric: 'Something went wrong. Check your connection and try again.',
  rateLimited: 'Too many attempts — try again in a few minutes.',
  retry: 'Try again',
  call: 'Call',
  messageAction: 'Message',
  close: 'Close',
  barLabel: 'Quick contact',
  dialogLabel: 'Send a message',
}

const ru: LeadStrings = {
  formTitle: 'Заинтересовало?',
  formSubtitle: 'Заполните форму — обычно отвечают в течение пары часов',
  formSubtitleTo: (name) => `${name} отвечает — обычно в течение пары часов`,
  nameLabel: 'Имя',
  namePh: 'Ваше имя',
  nameErr: 'Введите имя (мин. 2 символа)',
  phoneLabel: 'Телефон',
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Формат: +995 XXX XX XX XX',
  messageLabel: 'Сообщение',
  messagePh: 'Здравствуйте! Хочу узнать подробности…',
  messageErr: 'Сообщение должно содержать мин. 10 символов',
  submit: 'Отправить',
  sending: 'Отправка…',
  successTitle: 'Сообщение отправлено!',
  successBody: (name) => (name ? `${name} свяжется с вами в ближайшее время.` : 'С вами свяжутся в ближайшее время.'),
  successNote: 'Следующий шаг: вам позвонят на указанный номер — держите телефон рядом.',
  newMessage: 'Новое сообщение',
  errorTitle: 'Не отправлено',
  errorGeneric: 'Произошла ошибка. Проверьте соединение и попробуйте снова.',
  rateLimited: 'Слишком много попыток — повторите через несколько минут.',
  retry: 'Повторить',
  call: 'Позвонить',
  messageAction: 'Сообщение',
  close: 'Закрыть',
  barLabel: 'Быстрая связь',
  dialogLabel: 'Отправить сообщение',
}

const STRINGS: Partial<Record<Lang, LeadStrings>> = { ka, en, ru }

export function leadStrings(lang: Lang): LeadStrings {
  return STRINGS[lang] ?? en
}
