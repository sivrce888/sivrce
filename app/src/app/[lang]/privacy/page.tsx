import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { isValidLang } from '@/lib/i18n/core'
import {pageAlternates,  } from '@/lib/i18n/server'

import { jsonLd } from '@/lib/utils'
import { requestOrigin } from '@/lib/request-market'

export const revalidate = 86400

type Section = { id?: string; title: string; text: string }

const SECTIONS: Record<string, Section[]> = {
  ka: [
    {
      title: '1. ზოგადი ინფორმაცია',
      text: 'sivrce პატივს სცემს თქვენ კონფიდენციალურობას. ეს პოლიტიკა განმარტავს, თუ რა მონაცემებს ვაგროვებთ, რატომ და როგორ ვიყენებთ მათ პლატფორმის გასაუმჯობესებლად.',
    },
    {
      title: '2. რა მონაცემებს ვაგროვებთ',
      text: 'ვაგროვებთ მხოლოდ იმ მინიმალურ ინფორმაციას, რომელიც სერვისის მუშაობისთვისაა საჭირო: საძიებო მოთხოვნებს, საკონტაქტო მონაცემებს, რომლებსაც თავად გვაწვდით (სახელი, ელ. ფოსტა, ტელეფონი), და ტექნიკურ ინფორმაციას მოწყობილობისა და ბრაუზერის შესახებ.',
    },
    {
      title: '3. მონაცემების გამოყენება',
      text: 'შეგროვილი მონაცემები გამოიყენება ძიების შედეგების დასაზუსტებლად, შეტყობინებების მისაწოდებლად, თაღლითობის პრევენციისთვის და პლატფორმის სტატისტიკური ანალიზისთვის. დამუშავების საფუძვლებია: სერვისის მიწოდება, თქვენი თანხმობა, კანონიერი ინტერესი და კანონმდებლობით გათვალისწინებული ვალდებულებები. ჩვენ არ ვყიდით თქვენს პირად მონაცემებს.',
    },
    {
      title: '4. მონაცემების გაზიარება',
      text: 'საკონტაქტო ინფორმაცია გამყიდველთან ან აგენტთან მხოლოდ თქვენი ინიციატივით ზიარდება — როდესაც თავად გაუგზავნით შეტყობინებას ან დაჯავშნით ტურს. ანალიტიკა ჩაირთვევა მხოლოდ თქვენი თანხმობის შემდეგ და იყენებს ფსევდონიმურ იდენტიფიკატორებს (მაგ. შემთხვევით გენერირებულ ანალიტიკურ ID-ს); ეს მონაცემები არ იყიდება და არ ერთდება სარეკლამო პროფილებთან.',
    },
    {
      id: 'cookies',
      title: '5. ქუქიები და ლოკალური მეხსიერება',
      text: 'sivrce იყენებს ქუქიებსა და ბრაუზერის ლოკალურ მეხსიერებას (localStorage) კომფორტული გამოცდილებისთვის — მაგ. რუკის ხედი (ქუჩები/ჰიბრიდი/მინიმალი, 2D/3D) ინახება sivrce_map_ui ქუქიში. თქვენი ფავორიტები ინახება ლოკალურად, მხოლოდ თქვენს მოწყობილობაზე — ეს სია არ იგზავნება ჩვენს სერვერზე და არავის ეძლევა მასზე წვდომა. ანალიტიკაზე თანხმობა შეგიძლიათ ნებისმიერ დროს გააუქმოთ გვერდის ქვედა ნაწილში „ქუქიები“ ღილაკით. ქუქიების გამორთვა ასევე შეგიძლიათ ბრაუზერის პარამეტრებიდან, თუმცა ზოგი ფუნქცია შეიძლება შეზღუდული იყოს.',
    },
    {
      title: '6. მონაცემების შენახვა და დაცვა',
      text: 'მონაცემები ინახება დაშიფრული არხებით და დაცულ სერვერებზე. ანგარიშის მონაცემები ინახება ანგარიშის წაშლამდე, განცხადების — განცხადების გაუქმებამდე, ანალიტიკური მონაცემები — თანხმობის გაუქმებამდე; კანონმდებლობით გათვალისწინებულ შემთხვევებში ვინახავთ კანონით დადგენილ ვადამდე.',
    },
    {
      title: '7. თქვენი უფლებები',
      text: 'გაქვთ უფლება მოითხოვოთ თქვენი პირადი მონაცემების ნუსხა, გასწორება, წაშლა ან დაბლოკვა, ასევე ნებისმიერ დროს გააუქმოთ მარკეტინგული შეტყობინებების მიღება. მოთხოვნისთვის მოგვწერეთ hi@sivrce.ge-ზე. საქართველოს კანონმდებლობით გაქვთ აგრეთვე უფლება, საჩივრით მიმართოთ პერსონალურ მონაცემთა დაცვის სამსახურს (personaldata.ge).',
    },
    {
      title: '8. ცვლილებები და კონტაქტი',
      text: 'ეს პოლიტიკა შეიძლება განახლდეს — ცვლილებები ძალაში შედის ამ გვერდზე გამოქვეყნებისთანავე. კონფიდენციალურობასთან დაკავშირებული ნებისმიერი კითხვისთვის დაგვიკავშირდით: hi@sivrce.ge, თბილისი, საქართველო.',
    },
  ],
  en: [
    {
      title: '1. General information',
      text: 'sivrce respects your privacy. This policy explains what data we collect, why, and how we use it to improve the platform.',
    },
    {
      title: '2. What data we collect',
      text: 'We collect only the minimum information needed to run the service: search queries, contact details you give us directly (name, email, phone), and technical information about your device and browser.',
    },
    {
      title: '3. How data is used',
      text: 'Collected data is used to refine search results, deliver notifications, prevent fraud, and run statistical analysis of the platform. Processing rests on: providing the service, your consent, our legitimate interest in operating the platform, and legal obligations. We never sell your personal data to third parties.',
    },
    {
      title: '4. Data sharing',
      text: 'Your contact information reaches a seller or agent only on your initiative — when you send a message or book a tour yourself. Analytics is enabled only after your consent and uses pseudonymous identifiers (e.g. a randomly generated analytics ID); that data is never sold or merged with third-party advertising profiles.',
    },
    {
      id: 'cookies',
      title: '5. Cookies and local storage',
      text: 'sivrce uses cookies and browser local storage (localStorage) for a comfortable experience — e.g. your map view (streets/hybrid/minimal, 2D/3D) in the sivrce_map_ui cookie. Your favorites are stored locally, only on your device — that list is never sent to our servers and no one is given access to it. You can withdraw analytics consent anytime via the “Cookies” button in the footer, or disable cookies in your browser settings, though some features may become limited.',
    },
    {
      title: '6. Storage and protection',
      text: 'Data is stored over encrypted channels and on secured servers. Account data is kept until you delete your account, listings until you remove them, and consent-gated analytics until you withdraw consent; anything the law requires us to keep is kept for the statutory period.',
    },
    {
      title: '7. Your rights',
      text: 'You may request a copy, correction, deletion, or blocking of your personal data, and opt out of marketing messages at any time. For any request, write to hi@sivrce.ge. Under Georgian law you may also lodge a complaint with the Personal Data Protection Service of Georgia (personaldata.ge).',
    },
    {
      title: '8. Changes and contact',
      text: 'This policy may be updated — changes take effect as soon as they are published on this page. For any privacy question, contact us: hi@sivrce.ge, Tbilisi, Georgia.',
    },
  ],
  ru: [
    {
      title: '1. Общая информация',
      text: 'sivrce уважает вашу приватность. Эта политика объясняет, какие данные мы собираем, зачем и как используем их для улучшения платформы.',
    },
    {
      title: '2. Какие данные мы собираем',
      text: 'Мы собираем лишь минимум информации, необходимый для работы сервиса: поисковые запросы, контактные данные, которые вы сами нам предоставляете (имя, email, телефон), и техническую информацию об устройстве и браузере.',
    },
    {
      title: '3. Использование данных',
      text: 'Собранные данные используются для уточнения результатов поиска, доставки уведомлений, предотвращения мошенничества и статистического анализа платформы. Основания обработки: оказание сервиса, ваше согласие, законный интерес и требования законодательства. Мы никогда не продаём ваши личные данные третьим лицам.',
    },
    {
      title: '4. Передача данных',
      text: 'Контактная информация передаётся продавцу или агенту только по вашей инициативе — когда вы сами отправляете сообщение или записываетесь на тур. Аналитика включается только после вашего согласия и использует псевдонимные идентификаторы (например, случайно сгенерированный аналитический ID); эти данные не продаются и не объединяются с рекламными профилями.',
    },
    {
      id: 'cookies',
      title: '5. Cookies и локальное хранилище',
      text: 'sivrce использует cookies и локальное хранилище браузера (localStorage) для удобства — например, вид карты (улицы/гибрид/минимал, 2D/3D) в cookie sivrce_map_ui. Избранное хранится локально, только на вашем устройстве — этот список не отправляется на наши серверы и никому не доступен. Согласие на аналитику можно отозвать в любой момент кнопкой «Cookies» в подвале сайта; cookies также можно отключить в настройках браузера, хотя часть функций может быть ограничена.',
    },
    {
      title: '6. Хранение и защита данных',
      text: 'Данные передаются по зашифрованным каналам и хранятся на защищённых серверах. Данные аккаунта хранятся до удаления аккаунта, объявления — до их снятия, аналитика — до отзыва согласия; данные, которые мы обязаны хранить по закону, хранятся установленный законом срок.',
    },
    {
      title: '7. Ваши права',
      text: 'Вы можете запросить перечень, исправление, удаление или блокировку своих персональных данных, а также в любой момент отказаться от маркетинговых сообщений. Для запросов пишите на hi@sivrce.ge. По законодательству Грузии вы также вправе подать жалобу в Службу защиты персональных данных Грузии (personaldata.ge).',
    },
    {
      title: '8. Изменения и контакты',
      text: 'Политика может обновляться — изменения вступают в силу сразу после публикации на этой странице. По любым вопросам приватности: hi@sivrce.ge, Тбилиси, Грузия.',
    },
  ],
}

const META: Record<string, { title: string; description: string; kicker: string; subtitle: string }> = {
  ka: {
    title: 'კონფიდენციალურობის პოლიტიკა',
    description: 'როგორ იცავს sivrce თქვენ პირად მონაცემებს — მონაცემთა შეგროვება, გამოყენება, ქუქიები და თქვენი უფლებები.',
    kicker: 'იურიდიული',
    subtitle: 'ბოლო განახლება: 2026-09-26',
  },
  en: {
    title: 'Privacy Policy',
    description: 'How sivrce protects your personal data — collection, usage, cookies and your rights.',
    kicker: 'Legal',
    subtitle: 'Last updated: 2026-09-26',
  },
  ru: {
    title: 'Политика конфиденциальности',
    description: 'Как sivrce защищает ваши персональные данные — сбор, использование, cookies и ваши права.',
    kicker: 'Право',
    subtitle: 'Обновлено: 2026-09-26',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const m = META[lang] ?? META.en
  return {
    title: m.title,
    description: m.description,
    alternates: pageAlternates('/privacy', lang),
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const origin = await requestOrigin()
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  // Other locales read English, never Georgian — same rule as the platform i18n.
  const m = META[lang] ?? META.en
  const sections = SECTIONS[lang] ?? SECTIONS.en
  const privacyLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${origin}/privacy#webpage`,
        url: `${origin}/privacy`,
        name: m.title,
        description: m.description,
        inLanguage: lang,
        isPartOf: { '@id': `${origin}/#website` },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'h2', 'p'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: origin },
          { '@type': 'ListItem', position: 2, name: m.title, item: `${origin}/privacy` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(privacyLd) }} />
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={m.kicker} title={m.title} subtitle={m.subtitle} />
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-4 md:pb-28">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <Reveal key={s.title} delay={Math.min(i * 0.04, 0.2)}>
                <section id={s.id}>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-sv-ink">{s.title}</h2>
                  <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/65">{s.text}</p>
                </section>
              </Reveal>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
