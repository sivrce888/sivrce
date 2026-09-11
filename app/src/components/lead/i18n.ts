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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'შეიყვანე ნომერი ფორმატით +995 XXX XX XX XX',
  messageLabel: 'მესიჯი',
  messagePh: 'გამარჯობა! მაინტერესებს დამატებითი დეტალები…',
  messageErr: 'მესიჯი უნდა შეიცავდეს მინ. 10 სიმბოლოს',
  submit: 'გაგზავნა',
  sending: 'იგზავნება…',
  successTitle: 'მესიჯი გაიგზავნა!',
  successBody: (name) => (name ? `${name} დაგიკავშირდება უახლოეს დროს.` : 'დაგიკავშირდებიან უახლოეს დროს.'),
  successNote: 'შემდეგი ნაბიჯი: დაგირეკავენ მითითებულ ნომერზე — ნუ გამოტოვებ ზარს.',
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

const tr: LeadStrings = {
  formTitle: 'İlgileniyor musun?',
  formSubtitle: 'Formu doldur — yanıtlar genellikle birkaç saat içinde',
  formSubtitleTo: (name) => `${name} yanıt verir — genellikle birkaç saat içinde`,
  nameLabel: 'Ad',
  namePh: 'Adın',
  nameErr: 'Adını gir (en az 2 karakter)',
  phoneLabel: 'Telefon',
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Biçim: +995 XXX XX XX XX',
  messageLabel: 'Mesaj',
  messagePh: 'Merhaba! Daha fazla detay öğrenmek istiyorum…',
  messageErr: 'Mesaj en az 10 karakter olmalı',
  submit: 'Gönder',
  sending: 'Gönderiliyor…',
  successTitle: 'Mesaj gönderildi!',
  successBody: (name) => (name ? `${name} en kısa sürede seninle iletişime geçecek.` : 'En kısa sürede seninle iletişime geçilecek.'),
  successNote: 'Sıradaki adım: belirttiğin numaraya arama gelecek — telefonunu yakında tut.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'استخدم الصيغة +995 XXX XX XX XX',
  messageLabel: 'الرسالة',
  messagePh: 'مرحبًا! أودّ الاطلاع على مزيد من التفاصيل…',
  messageErr: 'يجب أن تتضمّن الرسالة 10 أحرف على الأقل',
  submit: 'إرسال',
  sending: 'جارٍ الإرسال…',
  successTitle: 'تم إرسال الرسالة!',
  successBody: (name) => (name ? `${name} سيتواصل معك قريبًا.` : 'سنتواصل معك قريبًا.'),
  successNote: 'الخطوة التالية: ستصلك مكالمة على الرقم الذي أدخلته — أبقِ هاتفك قريبًا.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Format: +995 XXX XX XX XX',
  messageLabel: 'Nachricht',
  messagePh: 'Hallo! Ich hätte gern mehr Details…',
  messageErr: 'Die Nachricht muss mindestens 10 Zeichen enthalten',
  submit: 'Senden',
  sending: 'Wird gesendet…',
  successTitle: 'Nachricht gesendet!',
  successBody: (name) => (name ? `${name} meldet sich in Kürze bei dir.` : 'Man meldet sich in Kürze bei dir.'),
  successNote: 'Nächster Schritt: Du bekommst einen Anruf auf die angegebene Nummer — halte dein Handy bereit.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'השתמש בפורמט +995 XXX XX XX XX',
  messageLabel: 'הודעה',
  messagePh: 'שלום! אשמח לפרטים נוספים…',
  messageErr: 'ההודעה חייבת להכיל לפחות 10 תווים',
  submit: 'שליחה',
  sending: 'שולח…',
  successTitle: 'ההודעה נשלחה!',
  successBody: (name) => (name ? `${name} יחזור אליך בקרוב.` : 'יחזרו אליך בקרוב.'),
  successNote: 'השלב הבא: יתקשרו אליך למספר שמסרת — שמור את הטלפון בקרבת מקום.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Ձևաչափ՝ +995 XXX XX XX XX',
  messageLabel: 'Հաղորդագրություն',
  messagePh: 'Բարև՛ ուզում եմ ավելի մանրամասն իմանալ…',
  messageErr: 'Հաղորդագրությունը պետք է պարունակի առնվազն 10 նշան',
  submit: 'Ուղարկել',
  sending: 'Ուղարկվում է…',
  successTitle: 'Հաղորդագրությունն ուղարկվեց!',
  successBody: (name) => (name ? `${name} շուտով կկապվի քեզ հետ.` : 'Շուտով քեզ հետ կկապվեն.'),
  successNote: 'Հաջորդ քայլը՝ զանգ կգա նշած համարին — հեռախոսդ մոտ պահիր.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Format: +995 XXX XX XX XX',
  messageLabel: 'Mesaj',
  messagePh: 'Salam! Ətraflı məlumat almaq istəyirəm…',
  messageErr: 'Mesaj ən azı 10 simvol olmalıdır',
  submit: 'Göndər',
  sending: 'Göndərilir…',
  successTitle: 'Mesaj göndərildi!',
  successBody: (name) => (name ? `${name} tezliklə səninlə əlaqə saxlayacaq.` : 'Tezliklə səninlə əlaqə saxlayacaqlar.'),
  successNote: 'Növbəti addım: göstərdiyin nömrəyə zəng gələcək — telefonu yaxında saxla.',
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
  phonePh: '+995 555 12 34 56',
  phoneErr: 'Формат: +995 XXX XX XX XX',
  messageLabel: 'Повідомлення',
  messagePh: 'Вітаю! Хочу дізнатися подробиці…',
  messageErr: 'Повідомлення має містити мін. 10 символів',
  submit: 'Надіслати',
  sending: 'Надсилання…',
  successTitle: 'Повідомлення надіслано!',
  successBody: (name) => (name ? `${name} зв’яжеться з вами найближчим часом.` : 'З вами зв’яжуться найближчим часом.'),
  successNote: 'Наступний крок: вам зателефонують на вказаний номер — тримайте телефон поруч.',
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
