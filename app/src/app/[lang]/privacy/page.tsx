import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { isValidLang } from '@/lib/i18n/core'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 86400

type Section = { id?: string; title: string; text: string }

const SECTIONS: Record<string, Section[]> = {
  ka: [
    {
      title: '1. ზოგადი ინფორმაცია',
      text: 'sivrce პატივს სცემს შენს კონფიდენციალურობას. ეს პოლიტიკა განმარტავს, თუ რა მონაცემებს ვაგროვებთ, რატომ და როგორ ვიყენებთ მათ პლატფორმის გასაუმჯობესებლად.',
    },
    {
      title: '2. რა მონაცემებს ვაგროვებთ',
      text: 'ვაგროვებთ მხოლოდ იმ მინიმალურ ინფორმაციას, რომელიც სერვისის მუშაობისთვისაა საჭირო: საძიებო მოთხოვნები, საკონტაქტო მონაცემები, რომლებსაც თავად გვაწვდი (სახელი, ელ. ფოსტა, ტელეფონი), და ტექნიკური ინფორმაცია მოწყობილობისა და ბრაუზერის შესახებ.',
    },
    {
      title: '3. მონაცემების გამოყენება',
      text: 'შეგროვილი მონაცემები გამოიყენება ძიების შედეგების დასაზუსტებლად, შეტყობინებების მისაწოდებლად, თაღლითობის პრევენციისთვის და პლატფორმის სტატისტიკური ანალიზისთვის. ჩვენ არ ვყიდით შენს პირად მონაცემებს მესამე პირებს.',
    },
    {
      title: '4. მონაცემების გაზიარება',
      text: 'საკონტაქტო ინფორმაცია გამყიდველთან ან აგენტთან მხოლოდ შენი ინიციატივით ზიარდება — როდესაც თავად უგზავნი შეტყობინებას ან ჯავშნი ტურს. ანალიტიკისთვის გამოიყენება მხოლოდ ანონიმიზებული, აგრეგირებული მონაცემები.',
    },
    {
      id: 'cookies',
      title: '5. ქუქიები და ლოკალური მეხსიერება',
      text: 'sivrce იყენებს ქუქიებსა და ბრაუზერის ლოკალურ მეხსიერებას (localStorage) კომფორტული გამოცდილებისთვის — მაგ. რუკის ხედი (ქუჩები/ჰიბრიდი/მინიმალი, 2D/3D) ქუქიში sivrce_map_ui. შენი ფავორიტები ინახება ლოკალურად, მხოლოდ შენს მოწყობილობაზე — ეს სია არ იგზავნება ჩვენს სერვერზე და არავის ეძლევა მასზე წვდომა. ქუქიების გამორთვა შეგიძლია ბრაუზერის პარამეტრებიდან, თუმცა ზოგი ფუნქცია შეიძლება შეზღუდული იყოს.',
    },
    {
      title: '6. მონაცემების შენახვა და დაცვა',
      text: 'მონაცემები ინახება დაშიფრული არხებით და დაცულ სერვერებზე. ვინახავთ მათ მხოლოდ იმდენ ხანს, რამდენიც სერვისის მიწოდებისთვის ან კანონით გათვალისწინებული ვალდებულებებისთვისაა აუცილებელი.',
    },
    {
      title: '7. შენი უფლებები',
      text: 'გაქვს უფლება მოითხოვო შენი პირადი მონაცემების ნუსხა, გასწორება ან წაშლა. ასევე შეგიძლია ნებისმიერ დროს გააუქმო მარკეტინგული შეტყობინებების მიღება. მოთხოვნისთვის მოგვწერე hi@sivrce.ge-ზე.',
    },
    {
      title: '8. ცვლილებები და კონტაქტი',
      text: 'ეს პოლიტიკა შეიძლება განახლდეს — ცვლილებები ძალაში შედის ამ გვერდზე გამოქვეყნებისთანავე. კონფიდენციალურობასთან დაკავშირებული ნებისმიერი კითხვისთვის დაგვიკავშირდი: hi@sivrce.ge, თბილისი, საქართველო.',
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
      text: 'Collected data is used to refine search results, deliver notifications, prevent fraud, and run statistical analysis of the platform. We never sell your personal data to third parties.',
    },
    {
      title: '4. Data sharing',
      text: 'Your contact information reaches a seller or agent only on your initiative — when you send a message or book a tour yourself. Analytics rely solely on anonymized, aggregated data.',
    },
    {
      id: 'cookies',
      title: '5. Cookies and local storage',
      text: 'sivrce uses cookies and browser local storage (localStorage) for a comfortable experience — e.g. your map view (streets/hybrid/minimal, 2D/3D) in the sivrce_map_ui cookie. Your favorites are stored locally, only on your device — that list is never sent to our servers and no one is given access to it. You can disable cookies in your browser settings, though some features may become limited.',
    },
    {
      title: '6. Storage and protection',
      text: 'Data is stored over encrypted channels and on secured servers. We keep it only as long as necessary to provide the service or to meet legal obligations.',
    },
    {
      title: '7. Your rights',
      text: 'You may request a copy, correction, or deletion of your personal data. You can also opt out of marketing messages at any time. For any request, write to hi@sivrce.ge.',
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
      text: 'Собранные данные используются для уточнения результатов поиска, доставки уведомлений, предотвращения мошенничества и статистического анализа платформы. Мы никогда не продаём ваши личные данные третьим лицам.',
    },
    {
      title: '4. Передача данных',
      text: 'Контактная информация передаётся продавцу или агенту только по вашей инициативе — когда вы сами отправляете сообщение или записываетесь на тур. Для аналитики используются исключительно анонимизированные агрегированные данные.',
    },
    {
      id: 'cookies',
      title: '5. Cookies и локальное хранилище',
      text: 'sivrce использует cookies и локальное хранилище браузера (localStorage) для удобства — например, вид карты (улицы/гибрид/минимал, 2D/3D) в cookie sivrce_map_ui. Избранное хранится локально, только на вашем устройстве — этот список не отправляется на наши серверы и никому не доступен. Cookies можно отключить в настройках браузера, хотя часть функций может быть ограничена.',
    },
    {
      title: '6. Хранение и защита данных',
      text: 'Данные передаются по зашифрованным каналам и хранятся на защищённых серверах. Мы храним их лишь столько, сколько нужно для предоставления сервиса или выполнения требований закона.',
    },
    {
      title: '7. Ваши права',
      text: 'Вы можете запросить перечень, исправление или удаление своих персональных данных, а также в любой момент отказаться от маркетинговых сообщений. Для запросов пишите на hi@sivrce.ge.',
    },
    {
      title: '8. Изменения и контакты',
      text: 'Политика может обновляться — изменения вступают в силу сразу после публикации на этой странице. По любым вопросам приватности: hi@sivrce.ge, Тбилиси, Грузия.',
    },
  ],
}

const META: Record<string, { title: string; description: string; kicker: string; subtitle: string }> = {
  ka: {
    title: 'კონფიდენციალურობის პოლიტიკა — sivrce',
    description: 'როგორ იცავს sivrce შენს პირად მონაცემებს — მონაცემთა შეგროვება, გამოყენება, ქუქიები და შენი უფლებები.',
    kicker: 'იურიდიული',
    subtitle: 'ბოლო განახლება: 2026 წელი',
  },
  en: {
    title: 'Privacy Policy — sivrce',
    description: 'How sivrce protects your personal data — collection, usage, cookies and your rights.',
    kicker: 'Legal',
    subtitle: 'Last updated: 2026',
  },
  ru: {
    title: 'Политика конфиденциальности — sivrce',
    description: 'Как sivrce защищает ваши персональные данные — сбор, использование, cookies и ваши права.',
    kicker: 'Право',
    subtitle: 'Обновлено: 2026 год',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const m = META[lang] ?? META.ka
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/privacy', languages: langAlternates('/privacy') },
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const m = META[lang] ?? META.ka
  const sections = SECTIONS[lang] ?? SECTIONS.ka
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={m.kicker} title={m.title.replace(' — sivrce', '')} subtitle={m.subtitle} />
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
