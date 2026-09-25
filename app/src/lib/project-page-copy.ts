/**
 * Chrome for the project + developer decision blocks (hero panel, market
 * position, nearby comparison, track record, inaccuracy reports). ka/ru/de
 * native; every other locale reads en via dirLoc.
 */

import { ruPlural } from '@/lib/i18n/core'
import type { DirLoc } from '@/lib/directory-seo-lite'

type Loc = DirLoc | 'de'

export interface ProjectPageCopy {
  building: string
  completed: string
  photos: (n: number) => string
  video: string
  requestCall: string
  mortgage: string
  developer: string
  devRecord: (total: number, delivered: number) => string
  marketTitle: string
  /** deltaPct signed; scope already localized ('Saburtalo' / 'Tbilisi'). */
  marketChip: (deltaPct: number, scope: string) => string
  marketBody: (price: string, median: string, peers: number, scope: string) => string
  marketNote: string
  lower: string
  higher: string
  compareTitle: string
  compareCaption: string
  colProject: string
  colDeveloper: string
  colPrice: string
  colHandover: string
  colBuilt: string
  colDistance: string
  thisProject: string
  distance: (km: number) => string
  trackTitle: string
  statProjects: string
  statCompleted: string
  statBuilding: string
  statFlats: string
  statCities: string
  buildingHeading: (n: number) => string
  completedHeading: (n: number) => string
  report: {
    summary: string
    field: string
    fields: Record<ReportField, string>
    details: string
    email: string
    submit: string
    thanks: string
    error: string
    limited: string
  }
}

export const REPORT_FIELDS = ['price', 'status', 'location', 'media', 'developer', 'other'] as const
export type ReportField = (typeof REPORT_FIELDS)[number]

const pctAbs = (d: number) => `${Math.abs(d)}%`

export const PROJECT_PAGE: Record<Loc, ProjectPageCopy> = {
  ka: {
    building: 'მშენებარე',
    completed: 'ჩაბარებული',
    photos: (n) => `${n} ფოტო`,
    video: 'ვიდეო',
    requestCall: 'მოითხოვე ზარი',
    mortgage: 'გამოთვალე იპოთეკა',
    developer: 'დეველოპერი',
    devRecord: (t, d) => `${t} პროექტი სივრცეზე · ${d} ჩაბარებული`,
    marketTitle: 'ფასი ბაზართან შედარებით',
    marketChip: (d, s) => (Math.abs(d) < 3 ? `მედიანასთან ახლოს · ${s}` : `${pctAbs(d)}-ით ${d < 0 ? 'იაფი' : 'ძვირი'} მედიანაზე · ${s}`),
    marketBody: (p, m, n, s) => `${p}/მ² — მედიანა ${m}/მ² (${n} ახალი პროექტი, ${s}).`,
    marketNote: 'დეველოპერების მიერ გამოქვეყნებული „-დან" ფასები სივრცეზე — საწყისი ფასი და არა საშუალო.',
    lower: 'იაფი',
    higher: 'ძვირი',
    compareTitle: 'ახლომახლო ახალი პროექტები',
    compareCaption: 'ახალი პროექტები 5 კმ რადიუსში — ფასი, ჩაბარება და მშენებლობის პროგრესი',
    colProject: 'პროექტი',
    colDeveloper: 'დეველოპერი',
    colPrice: 'ფასი /მ²-დან',
    colHandover: 'ჩაბარება',
    colBuilt: 'აშენებულია',
    colDistance: 'მანძილი',
    thisProject: 'ეს პროექტი',
    distance: (km) => (km < 1 ? `${Math.round(km * 1000)} მ` : `${km.toFixed(1)} კმ`),
    trackTitle: 'პორტფოლიო სივრცეზე',
    statProjects: 'პროექტი',
    statCompleted: 'ჩაბარებული',
    statBuilding: 'მშენებარე',
    statFlats: 'ბინა',
    statCities: 'ქალაქი',
    buildingHeading: (n) => `მშენებარე პროექტები (${n})`,
    completedHeading: (n) => `ჩაბარებული პროექტები (${n})`,
    report: {
      summary: 'შეცდომა შენიშნე? შეგვატყობინე',
      field: 'რა არის არასწორი?',
      fields: { price: 'ფასი', status: 'სტატუსი ან ჩაბარების ვადა', location: 'მისამართი ან რუკა', media: 'ფოტოები', developer: 'დეველოპერი', other: 'სხვა' },
      details: 'დეტალები (სწორი ინფორმაცია, წყარო)',
      email: 'ელფოსტა პასუხისთვის (არასავალდებულო)',
      submit: 'გაგზავნა',
      thanks: 'მადლობა — მოდერატორი შეამოწმებს და გაასწორებს.',
      error: 'ვერ გაიგზავნა — სცადე ხელახლა.',
      limited: 'ძალიან ბევრი მოთხოვნაა — სცადე მოგვიანებით.',
    },
  },
  en: {
    building: 'Under construction',
    completed: 'Completed',
    photos: (n) => `${n} photos`,
    video: 'Video',
    requestCall: 'Request a call',
    mortgage: 'Estimate a mortgage',
    developer: 'Developer',
    devRecord: (t, d) => `${t} ${t === 1 ? 'project' : 'projects'} on Sivrce · ${d} completed`,
    marketTitle: 'Price vs the market',
    marketChip: (d, s) => (Math.abs(d) < 3 ? `Near the ${s} median` : `${pctAbs(d)} ${d < 0 ? 'below' : 'above'} the ${s} median`),
    marketBody: (p, m, n, s) => `${p}/m² against a median of ${m}/m² across ${n} new-build projects in ${s}.`,
    marketNote: 'Developers’ published “from” prices on Sivrce — the entry price, not an average.',
    lower: 'Lower',
    higher: 'Higher',
    compareTitle: 'Nearby new builds compared',
    compareCaption: 'New-build projects within 5 km — price, handover and construction progress',
    colProject: 'Project',
    colDeveloper: 'Developer',
    colPrice: 'From /m²',
    colHandover: 'Handover',
    colBuilt: 'Built',
    colDistance: 'Distance',
    thisProject: 'This project',
    distance: (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`),
    trackTitle: 'Portfolio on Sivrce',
    statProjects: 'Projects',
    statCompleted: 'Completed',
    statBuilding: 'Under construction',
    statFlats: 'Flats',
    statCities: 'Cities',
    buildingHeading: (n) => `Under construction (${n})`,
    completedHeading: (n) => `Completed (${n})`,
    report: {
      summary: 'Spotted an inaccuracy? Tell us',
      field: 'What is wrong?',
      fields: { price: 'Price', status: 'Status or handover date', location: 'Address or map pin', media: 'Photos', developer: 'Developer', other: 'Something else' },
      details: 'Details (the correct information, a source)',
      email: 'Email for a reply (optional)',
      submit: 'Send',
      thanks: 'Thank you — a moderator will check and correct it.',
      error: 'Could not send — please try again.',
      limited: 'Too many reports — please try again later.',
    },
  },
  ru: {
    building: 'Строится',
    completed: 'Сдан',
    photos: (n) => `${n} фото`,
    video: 'Видео',
    requestCall: 'Заказать звонок',
    mortgage: 'Рассчитать ипотеку',
    developer: 'Застройщик',
    devRecord: (t, d) => `${t} ${ruPlural(t, 'проект', 'проекта', 'проектов')} на Sivrce · ${d} ${ruPlural(d, 'сдан', 'сдано', 'сдано')}`,
    marketTitle: 'Цена относительно рынка',
    marketChip: (d, s) => (Math.abs(d) < 3 ? `Около медианы: ${s}` : `На ${pctAbs(d)} ${d < 0 ? 'ниже' : 'выше'} медианы: ${s}`),
    marketBody: (p, m, n, s) => `${p}/м² при медиане ${m}/м² по ${n} ${ruPlural(n, 'новостройке', 'новостройкам', 'новостройкам')} (${s}).`,
    marketNote: 'Опубликованные застройщиками цены «от» на Sivrce — стартовая цена, а не средняя.',
    lower: 'Ниже',
    higher: 'Выше',
    compareTitle: 'Новостройки рядом: сравнение',
    compareCaption: 'Новостройки в радиусе 5 км — цена, сдача и ход строительства',
    colProject: 'Проект',
    colDeveloper: 'Застройщик',
    colPrice: 'От /м²',
    colHandover: 'Сдача',
    colBuilt: 'Построено',
    colDistance: 'Расстояние',
    thisProject: 'Этот проект',
    distance: (km) => (km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`),
    trackTitle: 'Портфель на Sivrce',
    statProjects: 'Проекты',
    statCompleted: 'Сдано',
    statBuilding: 'Строится',
    statFlats: 'Квартир',
    statCities: 'Города',
    buildingHeading: (n) => `Строятся (${n})`,
    completedHeading: (n) => `Сданы (${n})`,
    report: {
      summary: 'Нашли неточность? Сообщите нам',
      field: 'Что не так?',
      fields: { price: 'Цена', status: 'Статус или срок сдачи', location: 'Адрес или точка на карте', media: 'Фото', developer: 'Застройщик', other: 'Другое' },
      details: 'Подробности (верные данные, источник)',
      email: 'Email для ответа (необязательно)',
      submit: 'Отправить',
      thanks: 'Спасибо — модератор проверит и исправит.',
      error: 'Не удалось отправить — попробуйте ещё раз.',
      limited: 'Слишком много сообщений — попробуйте позже.',
    },
  },
  de: {
    building: 'Im Bau',
    completed: 'Fertiggestellt',
    photos: (n) => `${n} Fotos`,
    video: 'Video',
    requestCall: 'Rückruf anfordern',
    mortgage: 'Finanzierung berechnen',
    developer: 'Bauträger',
    devRecord: (t, d) => `${t} ${t === 1 ? 'Projekt' : 'Projekte'} auf Sivrce · ${d} fertiggestellt`,
    marketTitle: 'Preis im Marktvergleich',
    marketChip: (d, s) => (Math.abs(d) < 3 ? `Nahe am Median (${s})` : `${pctAbs(d)} ${d < 0 ? 'unter' : 'über'} dem Median (${s})`),
    marketBody: (p, m, n, s) => `${p}/m² bei einem Median von ${m}/m² über ${n} Neubauprojekte in ${s}.`,
    marketNote: 'Von Bauträgern veröffentlichte „ab“-Preise auf Sivrce — Einstiegspreis, kein Durchschnitt.',
    lower: 'Günstiger',
    higher: 'Teurer',
    compareTitle: 'Neubauprojekte in der Nähe im Vergleich',
    compareCaption: 'Neubauprojekte im Umkreis von 5 km — Preis, Übergabe und Baufortschritt',
    colProject: 'Projekt',
    colDeveloper: 'Bauträger',
    colPrice: 'Ab /m²',
    colHandover: 'Übergabe',
    colBuilt: 'Gebaut',
    colDistance: 'Entfernung',
    thisProject: 'Dieses Projekt',
    distance: (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`),
    trackTitle: 'Portfolio auf Sivrce',
    statProjects: 'Projekte',
    statCompleted: 'Fertiggestellt',
    statBuilding: 'Im Bau',
    statFlats: 'Wohnungen',
    statCities: 'Städte',
    buildingHeading: (n) => `Im Bau (${n})`,
    completedHeading: (n) => `Fertiggestellt (${n})`,
    report: {
      summary: 'Fehler entdeckt? Sag uns Bescheid',
      field: 'Was ist falsch?',
      fields: { price: 'Preis', status: 'Status oder Übergabetermin', location: 'Adresse oder Kartenpunkt', media: 'Fotos', developer: 'Bauträger', other: 'Sonstiges' },
      details: 'Details (richtige Angabe, Quelle)',
      email: 'E-Mail für eine Antwort (optional)',
      submit: 'Senden',
      thanks: 'Danke — ein Moderator prüft und korrigiert es.',
      error: 'Senden fehlgeschlagen — bitte erneut versuchen.',
      limited: 'Zu viele Meldungen — bitte später erneut versuchen.',
    },
  },
}
