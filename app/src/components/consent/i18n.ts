import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the consent prompt (shared dicts are locked).
 * All 10 langs covered; falls back to en.
 */
const STRINGS = {
  ka: {
    title: 'ანალიტიკის ქუქიები',
    body: 'ვიზიტებს მხოლოდ შენი თანხმობით ვზომავთ. გადაწყვეტილებამდე არაფერი იტვირთება — არჩევანს ნებისმიერ დროს შეცვლი ფუტერიდან.',
    accept: 'დაშვება',
    decline: 'უარი',
    more: 'კონფიდენციალურობა',
  },
  en: {
    title: 'Analytics cookies',
    body: 'We measure visits only if you allow it. Nothing loads before you decide — change your choice anytime from the footer.',
    accept: 'Allow',
    decline: 'Decline',
    more: 'Privacy policy',
  },
  ru: {
    title: 'Аналитические cookie',
    body: 'Мы измеряем визиты только с вашего согласия. До вашего решения ничего не загружается — изменить выбор можно в футере.',
    accept: 'Разрешить',
    decline: 'Отклонить',
    more: 'Конфиденциальность',
  },
  he: {
    title: 'עוגיות אנליטיקה',
    body: 'אנחנו מודדים ביקורים רק באישורך. עד להחלטתך שום דבר לא נטען — אפשר לשנות את הבחירה בכל רגע מהכותרת התחתונה.',
    accept: 'אישור',
    decline: 'דחייה',
    more: 'מדיניות פרטיות',
  },
  ar: {
    title: 'ملفات تعريف الارتباط التحليلية',
    body: 'لا نقيس الزيارات إلا بموافقتك. لا يُحمَّل أي شيء قبل قرارك — ويمكنك تغيير اختيارك في أي وقت من تذييل الصفحة.',
    accept: 'السماح',
    decline: 'رفض',
    more: 'سياسة الخصوصية',
  },
  tr: {
    title: 'Analitik çerezleri',
    body: 'Ziyaretleri yalnızca izin verirseniz ölçeriz. Siz karar vermeden hiçbir şey yüklenmez — seçiminizi istediğiniz zaman alt bilgiden değiştirebilirsiniz.',
    accept: 'İzin ver',
    decline: 'Reddet',
    more: 'Gizlilik politikası',
  },
  uk: {
    title: 'Аналітичні файли cookie',
    body: 'Ми вимірюємо візити лише за вашою згодою. До вашого рішення нічого не завантажується — змінити вибір можна будь-коли в нижньому колонтитулі.',
    accept: 'Дозволити',
    decline: 'Відхилити',
    more: 'Політика конфіденційності',
  },
  hy: {
    title: 'Վերլուծական քուքիներ',
    body: 'Այցերը չափում ենք միայն ձեր թույլտվությամբ։ Մինչև ձեր որոշումը ոչինչ չի բեռնվում — ընտրությունը կարող եք փոխել ցանկացած պահի էջատակից։',
    accept: 'Թույլատրել',
    decline: 'Մերժել',
    more: 'Գաղտնիության քաղաքականություն',
  },
  az: {
    title: 'Analitik kukilər',
    body: 'Ziyarətləri yalnız icazə versəniz ölçürük. Siz qərar verənə qədər heç nə yüklənmir — seçiminizi istənilən vaxt altbilgidən dəyişə bilərsiniz.',
    accept: 'İcazə ver',
    decline: 'İmtina et',
    more: 'Məxfilik siyasəti',
  },
  de: {
    title: 'Analyse-Cookies',
    body: 'Wir messen Zugriffe nur mit Ihrer Einwilligung. Vor Ihrer Entscheidung wird nichts geladen — Sie können die Wahl jederzeit im Footer ändern.',
    accept: 'Erlauben',
    decline: 'Ablehnen',
    more: 'Datenschutz',
  },
} as const

export type ConsentStringKey = keyof (typeof STRINGS)['en']

export function useConsentStrings(): (key: ConsentStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<ConsentStringKey, string> = STRINGS[lang] ?? STRINGS.en
  return (key) => dict[key]
}
