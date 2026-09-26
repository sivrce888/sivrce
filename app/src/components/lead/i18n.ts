/**
 * Lead-capture strings, co-located per workspace i18n rule (shared dicts are
 * off-limits). All 10 locales (ka/en/ru/tr/ar/de/he/hy/az/uk) are complete;
 * any unknown lang still falls back to en.
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
  continueChat: string
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
  formTitle: 'გაინტერესებს?',
  formSubtitle: 'შეავსე ფორმა — უპასუხებენ რამდენიმე საათში',
  formSubtitleTo: (name) => `${name} უპასუხებს — ჩვეულებრივ რამდენიმე საათში`,
  nameLabel: 'სახელი',
  namePh: 'შენი სახელი',
  nameErr: 'შეიყვანე სახელი (მინ. 2 სიმბოლო)',
  phoneLabel: 'ტელეფონი',
  phonePh: '+995 500 333 111',
  phoneErr: 'შეიყვანე ნომერი ფორმატით +995 XXX XX XX XX',
  messageLabel: 'მესიჯი',
  messagePh: 'გამარჯობა! მაინტერესებს დამატებითი დეტალები…',
  messageErr: 'მესიჯი უნდა შეიცავდეს მინ. 10 სიმბოლოს',
  submit: 'გაგზავნა',
  sending: 'იგზავნება…',
  successTitle: 'მესიჯი გაიგზავნა!',
  successBody: (name) => (name ? `${name} დაგიკავშირდება უახლოეს დროს.` : 'დაგიკავშირდებიან უახლოეს დროს.'),
  successNote: 'შემდეგი ნაბიჯი: დაგირეკავენ მითითებულ ნომერზე — ნუ გამოტოვებ ზარს.',
  continueChat: 'განაგრძე ჩატში',
  newMessage: 'ახალი მესიჯი',
  errorTitle: 'ვერ გაიგზავნა',
  errorGeneric: 'დაფიქსირდა შეცდომა. შეამოწმე კავშირი და სცადე თავიდან.',
  rateLimited: 'ზედმეტად ბევრი მცდელობა — სცადე რამდენიმე წუთში.',
  retry: 'თავიდან ცდა',
  call: 'დარეკვა',
  messageAction: 'მესიჯი',
  close: 'დახურვა',
  barLabel: 'სწრაფი კონტაქტი',
  dialogLabel: 'მესიჯის გაგზავნა',
}

const en: LeadStrings = {
  formTitle: 'Interested?',
  formSubtitle: 'Fill in the form — replies usually within a few hours',
  formSubtitleTo: (name) => `${name} replies — usually within a few hours`,
  nameLabel: 'Name',
  namePh: 'Your name',
  nameErr: 'Enter your name (min. 2 characters)',
  phoneLabel: 'Phone',
  phonePh: '+995 500 333 111',
  phoneErr: 'Use the format +995 XXX XX XX XX',
  messageLabel: 'Message',
  messagePh: 'Hi! I’d like more details…',
  messageErr: 'Message must be at least 10 characters',
  submit: 'Send',
  sending: 'Sending…',
  successTitle: 'Message sent!',
  successBody: (name) => (name ? `${name} will contact you shortly.` : 'You’ll be contacted shortly.'),
  successNote: 'Next step: expect a call on the number you provided — keep your phone close.',
  continueChat: 'Continue in chat',
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
  phonePh: '+995 500 333 111',
  phoneErr: 'Формат: +995 XXX XX XX XX',
  messageLabel: 'Сообщение',
  messagePh: 'Здравствуйте! Хочу узнать подробности…',
  messageErr: 'Сообщение должно содержать мин. 10 символов',
  submit: 'Отправить',
  sending: 'Отправка…',
  successTitle: 'Сообщение отправлено!',
  successBody: (name) => (name ? `${name} свяжется с вами в ближайшее время.` : 'С вами свяжутся в ближайшее время.'),
  successNote: 'Следующий шаг: вам позвонят на указанный номер — держите телефон рядом.',
  continueChat: 'Продолжить в чате',
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

const tr: LeadStrings = {
  formTitle: 'İlgileniyor musun?',
  formSubtitle: 'Formu doldur — yanıtlar genellikle birkaç saat içinde',
  formSubtitleTo: (name) => `${name} yanıt verir — genellikle birkaç saat içinde`,
  nameLabel: 'Ad',
  namePh: 'Adın',
  nameErr: 'Adını gir (en az 2 karakter)',
  phoneLabel: 'Telefon',
  phonePh: '+995 500 333 111',
  phoneErr: 'Biçim: +995 XXX XX XX XX',
  messageLabel: 'Mesaj',
  messagePh: 'Merhaba! Daha fazla detay öğrenmek istiyorum…',
  messageErr: 'Mesaj en az 10 karakter olmalı',
  submit: 'Gönder',
  sending: 'Gönderiliyor…',
  successTitle: 'Mesaj gönderildi!',
  successBody: (name) => (name ? `${name} en kısa sürede seninle iletişime geçecek.` : 'En kısa sürede seninle iletişime geçilecek.'),
  successNote: 'Sıradaki adım: belirttiğin numaraya arama gelecek — telefonunu yakında tut.',
  continueChat: 'Sohbete devam et',
  newMessage: 'Yeni mesaj',
  errorTitle: 'Gönderilemedi',
  errorGeneric: 'Bir şeyler ters gitti. Bağlantını kontrol et ve tekrar dene.',
  rateLimited: 'Çok fazla deneme yaptın — birkaç dakika sonra tekrar dene.',
  retry: 'Tekrar dene',
  call: 'Ara',
  messageAction: 'Mesaj',
  close: 'Kapat',
  barLabel: 'Hızlı iletişim',
  dialogLabel: 'Mesaj gönder',
}

const ar: LeadStrings = {
  formTitle: 'مهتم؟',
  formSubtitle: 'املأ النموذج — الردّ عادةً خلال بضع ساعات',
  formSubtitleTo: (name) => `${name} يردّ — عادةً خلال بضع ساعات`,
  nameLabel: 'الاسم',
  namePh: 'اسمك',
  nameErr: 'أدخل اسمك (حرفان على الأقل)',
  phoneLabel: 'الهاتف',
  phonePh: '+995 500 333 111',
  phoneErr: 'استخدم الصيغة +995 XXX XX XX XX',
  messageLabel: 'الرسالة',
  messagePh: 'مرحبًا! أودّ الاطلاع على مزيد من التفاصيل…',
  messageErr: 'يجب أن تتضمّن الرسالة 10 أحرف على الأقل',
  submit: 'إرسال',
  sending: 'جارٍ الإرسال…',
  successTitle: 'تم إرسال الرسالة!',
  successBody: (name) => (name ? `${name} سيتواصل معك قريبًا.` : 'سنتواصل معك قريبًا.'),
  successNote: 'الخطوة التالية: ستصلك مكالمة على الرقم الذي أدخلته — أبقِ هاتفك قريبًا.',
  continueChat: 'المتابعة في الدردشة',
  newMessage: 'رسالة جديدة',
  errorTitle: 'لم يتم الإرسال',
  errorGeneric: 'حدث خطأ ما. تحقّق من اتصالك وحاول مجددًا.',
  rateLimited: 'محاولات كثيرة جدًا — حاول مجددًا بعد بضع دقائق.',
  retry: 'إعادة المحاولة',
  call: 'اتصال',
  messageAction: 'رسالة',
  close: 'إغلاق',
  barLabel: 'تواصل سريع',
  dialogLabel: 'إرسال رسالة',
}

const de: LeadStrings = {
  formTitle: 'Interessiert?',
  formSubtitle: 'Formular ausfüllen — Antworten meist innerhalb weniger Stunden',
  formSubtitleTo: (name) => `${name} antwortet — meist innerhalb weniger Stunden`,
  nameLabel: 'Name',
  namePh: 'Dein Name',
  nameErr: 'Gib deinen Namen ein (mind. 2 Zeichen)',
  phoneLabel: 'Telefon',
  phonePh: '+49 170 1234567',
  phoneErr: 'Format: +49 30 1234567',
  messageLabel: 'Nachricht',
  messagePh: 'Hallo! Ich hätte gern mehr Details…',
  messageErr: 'Die Nachricht muss mindestens 10 Zeichen enthalten',
  submit: 'Senden',
  sending: 'Wird gesendet…',
  successTitle: 'Nachricht gesendet!',
  successBody: (name) => (name ? `${name} meldet sich in Kürze bei dir.` : 'Man meldet sich in Kürze bei dir.'),
  successNote: 'Nächster Schritt: Du bekommst einen Anruf auf die angegebene Nummer — halte dein Handy bereit.',
  continueChat: 'Im Chat weiter',
  newMessage: 'Neue Nachricht',
  errorTitle: 'Nicht gesendet',
  errorGeneric: 'Etwas ist schiefgelaufen. Prüfe deine Verbindung und versuch es erneut.',
  rateLimited: 'Zu viele Versuche — versuch es in ein paar Minuten erneut.',
  retry: 'Erneut versuchen',
  call: 'Anrufen',
  messageAction: 'Nachricht',
  close: 'Schließen',
  barLabel: 'Schneller Kontakt',
  dialogLabel: 'Nachricht senden',
}

const he: LeadStrings = {
  formTitle: 'מתעניינים?',
  formSubtitle: 'ממלאים את הטופס — בדרך כלל עונים תוך כמה שעות',
  formSubtitleTo: (name) => `${name} עונה — בדרך כלל תוך כמה שעות`,
  nameLabel: 'שם',
  namePh: 'השם שלך',
  nameErr: 'הזן את השם שלך (לפחות 2 תווים)',
  phoneLabel: 'טלפון',
  phonePh: '+995 500 333 111',
  phoneErr: 'השתמש בפורמט +995 XXX XX XX XX',
  messageLabel: 'הודעה',
  messagePh: 'שלום! אשמח לפרטים נוספים…',
  messageErr: 'ההודעה חייבת להכיל לפחות 10 תווים',
  submit: 'שליחה',
  sending: 'שולח…',
  successTitle: 'ההודעה נשלחה!',
  successBody: (name) => (name ? `${name} יחזור אליך בקרוב.` : 'יחזרו אליך בקרוב.'),
  successNote: 'השלב הבא: יתקשרו אליך למספר שמסרת — שמור את הטלפון בקרבת מקום.',
  continueChat: 'המשך בצ׳אט',
  newMessage: 'הודעה חדשה',
  errorTitle: 'לא נשלח',
  errorGeneric: 'משהו השתבש. בדוק את החיבור ונסה שוב.',
  rateLimited: 'ניסיונות רבים מדי — נסה שוב בעוד מספר דקות.',
  retry: 'נסה שוב',
  call: 'התקשר',
  messageAction: 'הודעה',
  close: 'סגירה',
  barLabel: 'יצירת קשר מהירה',
  dialogLabel: 'שליחת הודעה',
}

const hy: LeadStrings = {
  formTitle: 'Հետաքրքրված ես?',
  formSubtitle: 'Լրացրու հարցաթերթը — սովորաբար պատասխանում են մի քանի ժամում',
  formSubtitleTo: (name) => `${name} պատասխանում է — սովորաբար մի քանի ժամում`,
  nameLabel: 'Անուն',
  namePh: 'Քո անունը',
  nameErr: 'Մուտքագրիր անունդ (առնվազն 2 նշան)',
  phoneLabel: 'Հեռախոս',
  phonePh: '+995 500 333 111',
  phoneErr: 'Ձևաչափ՝ +995 XXX XX XX XX',
  messageLabel: 'Հաղորդագրություն',
  messagePh: 'Բարև՛ ուզում եմ ավելի մանրամասն իմանալ…',
  messageErr: 'Հաղորդագրությունը պետք է պարունակի առնվազն 10 նշան',
  submit: 'Ուղարկել',
  sending: 'Ուղարկվում է…',
  successTitle: 'Հաղորդագրությունն ուղարկվեց!',
  successBody: (name) => (name ? `${name} շուտով կկապվի քեզ հետ.` : 'Շուտով քեզ հետ կկապվեն.'),
  successNote: 'Հաջորդ քայլը՝ զանգ կգա նշած համարին — հեռախոսդ մոտ պահիր.',
  continueChat: 'Շարունակել չատում',
  newMessage: 'Նոր հաղորդագրություն',
  errorTitle: 'Չհաջողվեց ուղարկել',
  errorGeneric: 'Ինչ-որ սխալ տեղի ունեցավ: Ստուգիր կապը և փորձիր նորից.',
  rateLimited: 'Չափազանց շատ փորձեր — փորձիր մի քանի րոպեից.',
  retry: 'Կրկին փորձել',
  call: 'Զանգել',
  messageAction: 'Հաղորդագրություն',
  close: 'Փակել',
  barLabel: 'Արագ կապ',
  dialogLabel: 'Հաղորդագրություն ուղարկել',
}

const az: LeadStrings = {
  formTitle: 'İlgilənirsin?',
  formSubtitle: 'Formu doldur — cavablar adətən bir neçə saat ərzində',
  formSubtitleTo: (name) => `${name} cavab verir — adətən bir neçə saat ərzində`,
  nameLabel: 'Ad',
  namePh: 'Adın',
  nameErr: 'Adını daxil et (ən azı 2 simvol)',
  phoneLabel: 'Telefon',
  phonePh: '+995 500 333 111',
  phoneErr: 'Format: +995 XXX XX XX XX',
  messageLabel: 'Mesaj',
  messagePh: 'Salam! Ətraflı məlumat almaq istəyirəm…',
  messageErr: 'Mesaj ən azı 10 simvol olmalıdır',
  submit: 'Göndər',
  sending: 'Göndərilir…',
  successTitle: 'Mesaj göndərildi!',
  successBody: (name) => (name ? `${name} tezliklə səninlə əlaqə saxlayacaq.` : 'Tezliklə səninlə əlaqə saxlayacaqlar.'),
  successNote: 'Növbəti addım: göstərdiyin nömrəyə zəng gələcək — telefonu yaxında saxla.',
  continueChat: 'Söhbətə davam et',
  newMessage: 'Yeni mesaj',
  errorTitle: 'Göndərilmədi',
  errorGeneric: 'Nəsə xəta baş verdi. Əlaqəni yoxla və yenidən cəhd et.',
  rateLimited: 'Həddindən artıq çox cəhd — bir neçə dəqiqə sonra yenidən cəhd et.',
  retry: 'Yenidən cəhd et',
  call: 'Zəng et',
  messageAction: 'Mesaj',
  close: 'Bağla',
  barLabel: 'Sürətli əlaqə',
  dialogLabel: 'Mesaj göndər',
}

const uk: LeadStrings = {
  formTitle: 'Зацікавило?',
  formSubtitle: 'Заповніть форму — зазвичай відповідають протягом кількох годин',
  formSubtitleTo: (name) => `${name} відповідає — зазвичай протягом кількох годин`,
  nameLabel: 'Ім’я',
  namePh: 'Ваше ім’я',
  nameErr: 'Введіть ім’я (мін. 2 символи)',
  phoneLabel: 'Телефон',
  phonePh: '+995 500 333 111',
  phoneErr: 'Формат: +995 XXX XX XX XX',
  messageLabel: 'Повідомлення',
  messagePh: 'Вітаю! Хочу дізнатися подробиці…',
  messageErr: 'Повідомлення має містити мін. 10 символів',
  submit: 'Надіслати',
  sending: 'Надсилання…',
  successTitle: 'Повідомлення надіслано!',
  successBody: (name) => (name ? `${name} зв’яжеться з вами найближчим часом.` : 'З вами зв’яжуться найближчим часом.'),
  successNote: 'Наступний крок: вам зателефонують на вказаний номер — тримайте телефон поруч.',
  continueChat: 'Продовжити в чаті',
  newMessage: 'Нове повідомлення',
  errorTitle: 'Не надіслано',
  errorGeneric: 'Сталася помилка. Перевірте з’єднання і спробуйте ще раз.',
  rateLimited: 'Забагато спроб — спробуйте за кілька хвилин.',
  retry: 'Повторити',
  call: 'Зателефонувати',
  messageAction: 'Повідомлення',
  close: 'Закрити',
  barLabel: 'Швидкий зв’язок',
  dialogLabel: 'Надіслати повідомлення',
}

const STRINGS: Partial<Record<Lang, LeadStrings>> = { ka, en, ru, tr, ar, de, he, hy, az, uk }

export function leadStrings(lang: Lang): LeadStrings {
  return STRINGS[lang] ?? en
}

// ---------------------------------------------------------------------------
// Demand funnel ("I want to buy / rent / stay / sell") — chip-guided capture
// for demand with no listing in context. Rendered inside the chat widget.
// ---------------------------------------------------------------------------

export type DemandIntent = 'buy' | 'rent' | 'daily' | 'sell'

export interface IntentStrings {
  tile: string
  title: string
  subtitle: string
  intents: Record<DemandIntent, string>
  /** Full opening sentence for the composed lead message — always ≥10 chars. */
  sentence: Record<DemandIntent, string>
  budgetQ: string
  budgetBuy: string[]
  budgetRent: string[]
  budgetDaily: string[]
  roomsQ: string
  roomsChips: string[]
  typeQ: string
  typeChips: string[]
  whenQ: string
  whenChips: string[]
  contactQ: string
  successNote: string
}

const kaIntent: IntentStrings = {
  tile: 'მინდა ვიყიდო / გავყიდო',
  title: 'რა გინდა?',
  subtitle: 'აირჩიე — დაგირეკავთ შესაბამისი ვარიანტებით',
  intents: { buy: 'ვყიდულობ', rent: 'ვქირავდებ', daily: 'დღიურად', sell: 'ვყიდი' },
  sentence: {
    buy: 'ვეძებ შესაძენად',
    rent: 'ვეძებ ქირავნობით',
    daily: 'მაინტერესებს დღიური ქირა',
    sell: 'მაქვს გასაყიდი ქონება',
  },
  budgetQ: 'ბიუჯეტი',
  budgetBuy: ['50 000 $-მდე', '50–80k $', '80–120k $', '120–200k $', '200 000 $+'],
  budgetRent: ['300 $-მდე', '300–500 $', '500–800 $', '800–1 500 $', '1 500 $+'],
  budgetDaily: ['50 $-მდე', '50–100 $', '100–200 $', '200 $+'],
  roomsQ: 'ოთახები',
  roomsChips: ['სტუდიო', '1', '2', '3', '4+'],
  typeQ: 'გასაყიდი ქონება',
  typeChips: ['ბინა', 'სახლი', 'მიწა', 'კომერციული'],
  whenQ: 'ვადა',
  whenChips: ['რაც შეიძლება მალე', '1 თვეში', '1–3 თვე', 'ჯერ უყურებ'],
  contactQ: 'სად დაგირეკოთ?',
  successNote: 'გუნდი დაგირეკავს შესაბამისი ვარიანტებით — ჩვეულებრივ იმავე დღეს.',
}

const enIntent: IntentStrings = {
  tile: 'I want to buy / sell',
  title: 'What do you need?',
  subtitle: 'Tap what fits — we’ll call you with matching options',
  intents: { buy: 'Buy', rent: 'Rent', daily: 'Daily', sell: 'Sell' },
  sentence: {
    buy: 'I want to buy',
    rent: 'I want to rent',
    daily: 'Looking for a daily stay',
    sell: 'I want to sell my property',
  },
  budgetQ: 'Budget',
  budgetBuy: ['Under $50k', '$50–80k', '$80–120k', '$120–200k', '$200k+'],
  budgetRent: ['Under $300', '$300–500', '$500–800', '$800–1,500', '$1,500+'],
  budgetDaily: ['Under $50', '$50–100', '$100–200', '$200+'],
  roomsQ: 'Rooms',
  roomsChips: ['Studio', '1', '2', '3', '4+'],
  typeQ: 'Selling',
  typeChips: ['Apartment', 'House', 'Land', 'Commercial'],
  whenQ: 'Timeline',
  whenChips: ['ASAP', 'Within a month', '1–3 months', 'Just browsing'],
  contactQ: 'Where do we reach you?',
  successNote: 'Our team will call you with matching options — usually the same day.',
}

const ruIntent: IntentStrings = {
  tile: 'Хочу купить / продать',
  title: 'Что вам нужно?',
  subtitle: 'Выберите — позвоним с подходящими вариантами',
  intents: { buy: 'Купить', rent: 'Аренда', daily: 'Посуточно', sell: 'Продать' },
  sentence: {
    buy: 'Хочу купить',
    rent: 'Хочу арендовать',
    daily: 'Ищу посуточно',
    sell: 'Хочу продать недвижимость',
  },
  budgetQ: 'Бюджет',
  budgetBuy: ['До $50 тыс', '$50–80 тыс', '$80–120 тыс', '$120–200 тыс', '$200 тыс+'],
  budgetRent: ['До $300', '$300–500', '$500–800', '$800–1 500', '$1 500+'],
  budgetDaily: ['До $50', '$50–100', '$100–200', '$200+'],
  roomsQ: 'Комнат',
  roomsChips: ['Студия', '1', '2', '3', '4+'],
  typeQ: 'Продаю',
  typeChips: ['Квартира', 'Дом', 'Участок', 'Коммерция'],
  whenQ: 'Срок',
  whenChips: ['Как можно скорее', 'В течение месяца', '1–3 месяца', 'Присматриваюсь'],
  contactQ: 'Куда перезвонить?',
  successNote: 'Наша команда позвонит с подходящими вариантами — обычно в тот же день.',
}

const trIntent: IntentStrings = {
  tile: 'Almak / satmak istiyorum',
  title: 'Ne lazım?',
  subtitle: 'Uygun olanı seç — sana uygun seçeneklerle ararız',
  intents: { buy: 'Almak', rent: 'Kiralamak', daily: 'Günlük', sell: 'Satmak' },
  sentence: {
    buy: 'Satın almak istiyorum',
    rent: 'Kiralamak istiyorum',
    daily: 'Günlük kiralık arıyorum',
    sell: 'Satılık mülküm var',
  },
  budgetQ: 'Bütçe',
  budgetBuy: ['$50k altı', '$50–80k', '$80–120k', '$120–200k', '$200k+'],
  budgetRent: ['$300 altı', '$300–500', '$500–800', '$800–1.500', '$1.500+'],
  budgetDaily: ['$50 altı', '$50–100', '$100–200', '$200+'],
  roomsQ: 'Oda',
  roomsChips: ['Stüdyo', '1', '2', '3', '4+'],
  typeQ: 'Satılık',
  typeChips: ['Daire', 'Ev', 'Arsa', 'Ticari'],
  whenQ: 'Zaman',
  whenChips: ['En kısa sürede', '1 ay içinde', '1–3 ay', 'Sadece bakıyorum'],
  contactQ: 'Nereyi arayalım?',
  successNote: 'Ekibimiz uygun seçeneklerle seni arayacak — genellikle aynı gün.',
}

const arIntent: IntentStrings = {
  tile: 'أريد الشراء / البيع',
  title: 'ماذا تحتاج؟',
  subtitle: 'اختر ما يناسبك — سنتصل بك بخيارات مطابقة',
  intents: { buy: 'شراء', rent: 'إيجار', daily: 'يومي', sell: 'بيع' },
  sentence: {
    buy: 'أرغب في الشراء',
    rent: 'أرغب في الإيجار',
    daily: 'أبحث عن إقامة يومية',
    sell: 'أرغب في بيع عقاري',
  },
  budgetQ: 'الميزانية',
  budgetBuy: ['أقل من 50 ألف $', '50–80 ألف $', '80–120 ألف $', '120–200 ألف $', '200 ألف $+'],
  budgetRent: ['أقل من 300 $', '300–500 $', '500–800 $', '800–1,500 $', '1,500 $+'],
  budgetDaily: ['أقل من 50 $', '50–100 $', '100–200 $', '200 $+'],
  roomsQ: 'الغرف',
  roomsChips: ['استوديو', '1', '2', '3', '4+'],
  typeQ: 'معروض للبيع',
  typeChips: ['شقة', 'منزل', 'أرض', 'تجاري'],
  whenQ: 'المدة',
  whenChips: ['في أقرب وقت', 'خلال شهر', '1–3 أشهر', 'أتصفح فقط'],
  contactQ: 'أين نتواصل معك؟',
  successNote: 'سيتصل بك فريقنا بخيارات مطابقة — عادةً في نفس اليوم.',
}

const deIntent: IntentStrings = {
  tile: 'Kaufen / verkaufen',
  title: 'Was brauchst du?',
  subtitle: 'Wähle aus — wir rufen dich mit passenden Optionen an',
  intents: { buy: 'Kaufen', rent: 'Mieten', daily: 'Täglich', sell: 'Verkaufen' },
  sentence: {
    buy: 'Ich möchte kaufen',
    rent: 'Ich möchte mieten',
    daily: 'Ich suche eine Tagesmiete',
    sell: 'Ich möchte meine Immobilie verkaufen',
  },
  budgetQ: 'Budget',
  budgetBuy: ['Unter 50k $', '50–80k $', '80–120k $', '120–200k $', '200k $+'],
  budgetRent: ['Unter 300 $', '300–500 $', '500–800 $', '800–1.500 $', '1.500 $+'],
  budgetDaily: ['Unter 50 $', '50–100 $', '100–200 $', '200 $+'],
  roomsQ: 'Zimmer',
  roomsChips: ['Studio', '1', '2', '3', '4+'],
  typeQ: 'Verkauf',
  typeChips: ['Wohnung', 'Haus', 'Grundstück', 'Gewerbe'],
  whenQ: 'Zeitraum',
  whenChips: ['So schnell wie möglich', 'Innerhalb eines Monats', '1–3 Monate', 'Nur stöbern'],
  contactQ: 'Wo erreichen wir dich?',
  successNote: 'Unser Team ruft dich mit passenden Optionen an — meist noch am selben Tag.',
}

const heIntent: IntentStrings = {
  tile: 'לקנות / למכור',
  title: 'מה צריך?',
  subtitle: 'בוחרים מה מתאים — נתקשר עם אפשרויות מתאימות',
  intents: { buy: 'לקנות', rent: 'להשכיר', daily: 'יומי', sell: 'למכור' },
  sentence: {
    buy: 'מעוניין לקנות',
    rent: 'מעוניין לשכור',
    daily: 'מחפש לינה יומית',
    sell: 'מעוניין למכור נכס',
  },
  budgetQ: 'תקציב',
  budgetBuy: ['עד 50 אלף $', '50–80 אלף $', '80–120 אלף $', '120–200 אלף $', '200 אלף $ ומעלה'],
  budgetRent: ['עד 300 $', '300–500 $', '500–800 $', '800–1,500 $', '1,500 $+'],
  budgetDaily: ['עד 50 $', '50–100 $', '100–200 $', '200 $+'],
  roomsQ: 'חדרים',
  roomsChips: ['סטודיו', '1', '2', '3', '4+'],
  typeQ: 'למכירה',
  typeChips: ['דירה', 'בית', 'קרקע', 'מסחרי'],
  whenQ: 'מועד',
  whenChips: ['בהקדם האפשרי', 'בתוך חודש', '1–3 חודשים', 'רק מסתכל'],
  contactQ: 'לאן לחזור אליך?',
  successNote: 'הצוות שלנו יתקשר אליך עם אפשרויות מתאימות — בדרך כלל באותו יום.',
}

const hyIntent: IntentStrings = {
  tile: 'Գնել / վաճառել',
  title: 'Ինչ ես ուզում?',
  subtitle: 'Ընտրիր — կզանգահարենք համապատասխան տարբերակներով',
  intents: { buy: 'Գնել', rent: 'Վարձակալել', daily: 'Օրական', sell: 'Վաճառել' },
  sentence: {
    buy: 'Ուզում եմ գնել',
    rent: 'Ուզում եմ վարձակալել',
    daily: 'Փնտրում եմ օրյա բնակություն',
    sell: 'Ուզում եմ վաճառել սեփականությունս',
  },
  budgetQ: 'Բյուջե',
  budgetBuy: ['Մինչև 50 հզ $', '50–80 հզ $', '80–120 հզ $', '120–200 հզ $', '200 հզ $+'],
  budgetRent: ['Մինչև 300 $', '300–500 $', '500–800 $', '800–1,500 $', '1,500 $+'],
  budgetDaily: ['Մինչև 50 $', '50–100 $', '100–200 $', '200 $+'],
  roomsQ: 'Սենյակներ',
  roomsChips: ['Ստուդիա', '1', '2', '3', '4+'],
  typeQ: 'Վաճառք',
  typeChips: ['Բնակարան', 'Տուն', 'Հող', 'Կոմերցիոն'],
  whenQ: 'Ժամկետ',
  whenChips: ['Ինչքան հնարավոր է շուտ', '1 ամսվա ընթացքում', '1–3 ամիս', 'Ուղղակի դիտում եմ'],
  contactQ: 'Որտեղ կապվենք քեզ հետ?',
  successNote: 'Մեր թիմը կզանգահարի համապատասխան տարբերակներով — սովորաբար նույն օրը.',
}

const azIntent: IntentStrings = {
  tile: 'Almaq / satmaq istəyirəm',
  title: 'Nə lazımdır?',
  subtitle: 'Uyğun olanı seç — uyğun variantlarla zəng edəcəyik',
  intents: { buy: 'Almaq', rent: 'İcarə', daily: 'Günlük', sell: 'Satmaq' },
  sentence: {
    buy: 'Almaq istəyirəm',
    rent: 'İcarə almaq istəyirəm',
    daily: 'Günlük icarə axtarıram',
    sell: 'Satmaq istəyirəm əmlakımı',
  },
  budgetQ: 'Büdcə',
  budgetBuy: ['$50k-dək', '$50–80k', '$80–120k', '$120–200k', '$200k+'],
  budgetRent: ['$300-dək', '$300–500', '$500–800', '$800–1.500', '$1.500+'],
  budgetDaily: ['$50-dək', '$50–100', '$100–200', '$200+'],
  roomsQ: 'Otaq',
  roomsChips: ['Studiya', '1', '2', '3', '4+'],
  typeQ: 'Satılır',
  typeChips: ['Mənzil', 'Ev', 'Torpaq', 'Ticarət'],
  whenQ: 'Müddət',
  whenChips: ['Ən qısa zamanda', '1 ay içinde', '1–3 ay', 'Sadece baxıram'],
  contactQ: 'Sənə hara zəng edək?',
  successNote: 'Komandamız uyğun variantlarla zəng edəcək — adətən həmin gün.',
}

const ukIntent: IntentStrings = {
  tile: 'Хочу купити / продати',
  title: 'Що вам потрібно?',
  subtitle: 'Виберіть — зателефонуємо з підходящими варіантами',
  intents: { buy: 'Купити', rent: 'Оренда', daily: 'Добово', sell: 'Продати' },
  sentence: {
    buy: 'Хочу купити',
    rent: 'Хочу орендувати',
    daily: 'Шукаю посуточно',
    sell: 'Хочу продати нерухомість',
  },
  budgetQ: 'Бюджет',
  budgetBuy: ['До $50 тис', '$50–80 тис', '$80–120 тис', '$120–200 тис', '$200 тис+'],
  budgetRent: ['До $300', '$300–500', '$500–800', '$800–1 500', '$1 500+'],
  budgetDaily: ['До $50', '$50–100', '$100–200', '$200+'],
  roomsQ: 'Кімнат',
  roomsChips: ['Студія', '1', '2', '3', '4+'],
  typeQ: 'Продаж',
  typeChips: ['Квартира', 'Будинок', 'Ділянка', 'Комерція'],
  whenQ: 'Термін',
  whenChips: ['Якнайшвидше', 'Протягом місяця', '1–3 місяці', 'Присмотрююся'],
  contactQ: 'Куди передзвонити?',
  successNote: 'Наша команда зателефонує з підходящими варіантами — зазвичай того ж дня.',
}

const INTENT_STRINGS: Partial<Record<Lang, IntentStrings>> = {
  ka: kaIntent, en: enIntent, ru: ruIntent, tr: trIntent, ar: arIntent,
  de: deIntent, he: heIntent, hy: hyIntent, az: azIntent, uk: ukIntent,
}

export function funnelStrings(lang: Lang): IntentStrings {
  return INTENT_STRINGS[lang] ?? enIntent
}

export interface DemandPicks {
  budget?: string | null
  rooms?: string | null
  type?: string | null
  when?: string | null
}

/**
 * The lead message the team inbox reads — self-describing chips, never a
 * bare number, so it stays useful after it leaves the funnel UI.
 */
export function demandMessage(s: IntentStrings, intent: DemandIntent, p: DemandPicks): string {
  const parts = [s.sentence[intent]]
  if (p.budget) parts.push(`${s.budgetQ}: ${p.budget}`)
  if (p.rooms) parts.push(`${s.roomsQ}: ${p.rooms}`)
  if (p.type) parts.push(`${s.typeQ}: ${p.type}`)
  if (p.when) parts.push(`${s.whenQ}: ${p.when}`)
  return parts.join(' · ')
}
