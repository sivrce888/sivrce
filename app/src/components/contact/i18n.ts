/**
 * Contact-form strings, co-located per the workspace i18n rule (shared dicts
 * are off-limits for component copy). All 10 locales complete; any unknown
 * lang falls back to en. Select with `useI18n().lang`.
 */

import type { Lang } from '@/lib/i18n/context'

export interface ContactStrings {
  nameLabel: string
  namePh: string
  emailLabel: string
  emailPh: string
  messageLabel: string
  messagePh: string
  submit: string
  sending: string
  successTitle: string
  successBody: string
  openChat: string
  newMessage: string
  error: string
}

const STRINGS: Record<Lang, ContactStrings> = {
  ka: {
    nameLabel: 'სახელი',
    namePh: 'თქვენი სახელი',
    emailLabel: 'ელ. ფოსტა',
    emailPh: 'name@example.com',
    messageLabel: 'შეტყობინება',
    messagePh: 'რით შეგვიძლია დაგეხმაროთ?',
    submit: 'გაგზავნა',
    sending: 'იგზავნება…',
    successTitle: 'შეტყობინება გაგზავნილია',
    successBody: 'გმადლობთ! ჩვენი გუნდი გიპასუხებთ 24 საათის განმავლობაში.',
    openChat: 'ჩატში გახსნა',
    newMessage: 'ახალი შეტყობინება',
    error: 'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან ან მოგვწეროთ ელფოსტაზე.',
  },
  en: {
    nameLabel: 'Name',
    namePh: 'Your name',
    emailLabel: 'Email',
    emailPh: 'name@example.com',
    messageLabel: 'Message',
    messagePh: 'How can we help?',
    submit: 'Send',
    sending: 'Sending…',
    successTitle: 'Message sent',
    successBody: 'Thanks! Our team replies within 24 hours.',
    openChat: 'Open in chat',
    newMessage: 'New message',
    error: 'Could not send. Try again, or email us directly.',
  },
  ru: {
    nameLabel: 'Имя',
    namePh: 'Ваше имя',
    emailLabel: 'Эл. почта',
    emailPh: 'name@example.com',
    messageLabel: 'Сообщение',
    messagePh: 'Чем мы можем помочь?',
    submit: 'Отправить',
    sending: 'Отправка…',
    successTitle: 'Сообщение отправлено',
    successBody: 'Спасибо! Команда ответит в течение 24 часов.',
    openChat: 'Открыть в чате',
    newMessage: 'Новое сообщение',
    error: 'Не удалось отправить. Попробуйте ещё раз или напишите нам на почту.',
  },
  he: {
    nameLabel: 'שם',
    namePh: 'השם שלך',
    emailLabel: 'אימייל',
    emailPh: 'name@example.com',
    messageLabel: 'הודעה',
    messagePh: 'איך נוכל לעזור?',
    submit: 'שליחה',
    sending: 'שולח…',
    successTitle: 'ההודעה נשלחה',
    successBody: 'תודה! הצוות שלנו משיב תוך 24 שעות.',
    openChat: 'פתיחה בצ׳אט',
    newMessage: 'הודעה חדשה',
    error: 'השליחה נכשלה. נסו שוב או שלחו לנו אימייל.',
  },
  ar: {
    nameLabel: 'الاسم',
    namePh: 'اسمك',
    emailLabel: 'البريد الإلكتروني',
    emailPh: 'name@example.com',
    messageLabel: 'الرسالة',
    messagePh: 'كيف يمكننا المساعدة؟',
    submit: 'إرسال',
    sending: 'جارٍ الإرسال…',
    successTitle: 'تم إرسال الرسالة',
    successBody: 'شكرًا لك! يرد فريقنا خلال 24 ساعة.',
    openChat: 'فتح في المحادثة',
    newMessage: 'رسالة جديدة',
    error: 'تعذّر الإرسال. حاول مرة أخرى أو راسلنا بالبريد.',
  },
  tr: {
    nameLabel: 'Ad',
    namePh: 'Adınız',
    emailLabel: 'E-posta',
    emailPh: 'ad@ornek.com',
    messageLabel: 'Mesaj',
    messagePh: 'Nasıl yardımcı olabiliriz?',
    submit: 'Gönder',
    sending: 'Gönderiliyor…',
    successTitle: 'Mesaj gönderildi',
    successBody: 'Teşekkürler! Ekibimiz 24 saat içinde yanıtlar.',
    openChat: 'Sohbette aç',
    newMessage: 'Yeni mesaj',
    error: 'Gönderilemedi. Tekrar deneyin veya bize e-posta gönderin.',
  },
  uk: {
    nameLabel: 'Ім’я',
    namePh: 'Ваше ім’я',
    emailLabel: 'Ел. пошта',
    emailPh: 'name@example.com',
    messageLabel: 'Повідомлення',
    messagePh: 'Чим можемо допомогти?',
    submit: 'Надіслати',
    sending: 'Надсилання…',
    successTitle: 'Повідомлення надіслано',
    successBody: 'Дякуємо! Наша команда відповідає протягом 24 годин.',
    openChat: 'Відкрити в чаті',
    newMessage: 'Нове повідомлення',
    error: 'Не вдалося надіслати. Спробуйте ще раз або напишіть нам на пошту.',
  },
  hy: {
    nameLabel: 'Անուն',
    namePh: 'Ձեր անունը',
    emailLabel: 'Էլ. փոստ',
    emailPh: 'name@example.com',
    messageLabel: 'Հաղորդագրություն',
    messagePh: 'Ինչո՞վ կարող ենք օգնել:',
    submit: 'Ուղարկել',
    sending: 'Ուղարկվում է…',
    successTitle: 'Հաղորդագրությունն ուղարկվեց',
    successBody: 'Շնորհակալություն: Մեր թիմը պատասխանում է 24 ժամվա ընթացքում:',
    openChat: 'Բացել զրույցում',
    newMessage: 'Նոր հաղորդագրություն',
    error: 'Չհաջողվեց ուղարկել: Փորձեք կրկին կամ գրեք մեզ էլ. փոստով:',
  },
  az: {
    nameLabel: 'Ad',
    namePh: 'Adınız',
    emailLabel: 'E-poçt',
    emailPh: 'ad@numune.com',
    messageLabel: 'Mesaj',
    messagePh: 'Sizə necə kömək edə bilərik?',
    submit: 'Göndər',
    sending: 'Göndərilir…',
    successTitle: 'Mesaj göndərildi',
    successBody: 'Təşəkkürlər! Komandamız 24 saat ərzində cavab verir.',
    openChat: 'Söhbətdə aç',
    newMessage: 'Yeni mesaj',
    error: 'Göndərmək mümkün olmadı. Yenidən cəhd edin və ya e-poçt yazın.',
  },
  de: {
    nameLabel: 'Name',
    namePh: 'Ihr Name',
    emailLabel: 'E-Mail',
    emailPh: 'name@beispiel.de',
    messageLabel: 'Nachricht',
    messagePh: 'Wie können wir helfen?',
    submit: 'Senden',
    sending: 'Wird gesendet…',
    successTitle: 'Nachricht gesendet',
    successBody: 'Danke! Unser Team antwortet innerhalb von 24 Stunden.',
    openChat: 'Im Chat öffnen',
    newMessage: 'Neue Nachricht',
    error: 'Senden fehlgeschlagen. Bitte erneut versuchen oder uns eine E-Mail schreiben.',
  },
}

export function contactStrings(lang: Lang): ContactStrings {
  return STRINGS[lang] ?? STRINGS.en
}
