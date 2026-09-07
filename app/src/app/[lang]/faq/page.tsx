import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { dirLoc, type DirLoc } from '@/lib/directory-seo'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/faq', lang, {
    ka: {
      title: 'უძრავი ქონება საქართველოში — ხშირი კითხვები',
      description:
        'ბინები დღიურად თბილისში და საბურთალოზე, ყიდვა-გაყიდვა და ქირა — პასუხები sivrce-ზე. ვერიფიკაცია, VIP, AI ძიება.',
    },
    en: {
      title: 'Real Estate in Georgia — FAQ',
      description:
        'Daily rentals in Tbilisi and Saburtalo, buying, selling and rent — answered on sivrce. Verification, VIP, AI search.',
    },
    ru: {
      title: 'Недвижимость в Грузии — частые вопросы',
      description:
        'Посуточные квартиры в Тбилиси и Сабуртало, покупка-продажа и аренда — ответы на sivrce. Верификация, VIP, ИИ-поиск.',
    },
  })
}

interface QA {
  q: string
  a: string
}

const SECTIONS: Record<DirLoc, { title: string; items: QA[] }[]> = {
  ka: [
    {
      title: 'უძრავი ქონება საქართველოში',
      items: [
        {
          q: 'სად ვიპოვო უძრავი ქონება საქართველოში?',
          a: 'sivrce არის უძრავი ქონების პლატფორმა საქართველოში: ბინები, სახლები, მიწა და კომერციული ფართები იყიდება, ქირავდება და დღიურად. ძიება დაიწყე მთავარ გვერდზე ან 3D რუკაზე — ყველა განცხადება ვერიფიცირებულია, ფასს კი AI ადარებს ბაზარს.',
        },
        {
          q: 'სად არის ბინები დღიურად თბილისში?',
          a: 'ბინები დღიურად თბილისში იხილე sivrce-ზე განყოფილებაში „დღიურად“ — ფილტრი უბნით (ვაკე, საბურთალო, ძველი თბილისი), თარიღით და ფასით. დაჯავშნა პირდაპირ მესაკუთრესთან ჩატით, გადახდამდე შეამოწმე ვერიფიკაცია.',
        },
        {
          q: 'სად არის ბინები დღიურად საბურთალოზე?',
          a: 'ბინები დღიურად საბურთალოზე — მეტროსთან, კლინიკებთან და ბიზნეს-ცენტრებთან. გახსენი დღიური ქირის გვერდი, აირჩიე უბანი საბურთალო და შეადარე 1–2 ოთახიანი ვარიანტები. ფასი მოცემულია ღამეზე; სეზონში ადრე დაჯავშნა ზოგავს თანხას.',
        },
        {
          q: 'როგორ ვიყიდო ბინა თბილისში — ვაკეში ან საბურთალოზე?',
          a: 'გამოიყენე ძიება ან AI ძიება („იყიდება 2 ოთახიანი ბინა ვაკეში“), მონიშნე ფავორიტები, შეადარე AI ფასის ქულა და დაუკავშირდი მესაკუთრეს ან ვერიფიცირებულ აგენტს. გარიგება შენსა და გამყიდველს შორისაა — sivrce მყიდველს საკომისიოს არ აკისრებს.',
        },
      ],
    },
    {
      title: 'მყიდველებისთვის',
      items: [
        {
          q: 'როგორ ვიყიდო ბინა sivrce-ზე?',
          a: 'გამოიყენე ძიება ან AI ძიება, მონიშნე ფავორიტები, შეადარე ფასები AI შეფასებით და დაუკავშირდი პირდაპირ მფლობელს ან ვერიფიცირებულ აგენტს. გარიგება ხდება შენსა და გამყიდველს შორის — sivrce არ იღებს საკომისიოს მყიდველისგან.',
        },
        {
          q: 'რა არის AI ფასის შეფასება?',
          a: 'ჩვენი ხელოვნური ინტელექტი ადარებს განცხადების ფასს მსგავსი ობიექტების რეალურ მონაცემებს — მდებარეობა, ფართი, მდგომარეობა, სართული — და აჩვენებს ქულას 0-დან 100-მდე. მაღალი ქულა ნიშნავს სამართლიან ან ბაზარზე უკეთეს ფასს.',
        },
        {
          q: 'როგორ დავჯავშნო ტური?',
          a: 'გახსენი განცხადება და დააჭირე „ტურის დაჯავშნა“ — აირჩიე შენთვის მოსახერხებელი დრო კალენდარში. აგენტი ან მფლობელი დაადასტურებს ვიზიტს.',
        },
        {
          q: 'რა ვალუტით ჩანს ფასები?',
          a: 'ფასები ნაჩვენებია ლარსა და აშშ დოლარში ერთდროულად. კურსი ფიქსირებულია საჩვენებელი მიზნებისთვის — საბოლოო ფასი ყოველთვის გამყიდველთან შეთანხმებით დგინდება.',
        },
        {
          q: 'როგორ გამოვიყენო AI ძიება?',
          a: 'მთავარი გვერდის ძიების ველში ჩაწერე თავისუფალი ტექსტი — მაგალითად „ოროთახიანი ბინა ვაკეში 200 ათასამდე“. AI გაარჩევს შენს მოთხოვნას და აჩვენებს შესაბამის განცხადებებს. მუშაობს ქართულად, ინგლისურად და რუსულად.',
        },
      ],
    },
    {
      title: 'გამყიდველებისთვის',
      items: [
        {
          q: 'უფასოა თუ არა განცხადების დამატება?',
          a: 'დიახ, სტანდარტული განცხადების განთავსება სრულიად უფასოა და აქტიური რჩება 30 დღის განმავლობაში. დამატებითი ხილვადობისთვის შეგიძლია აირჩიო VIP პაკეტებიდან ერთ-ერთი.',
        },
        {
          q: 'რას იძლევა VIP პაკეტი?',
          a: 'VIP პაკეტები ზრდის შენი განცხადების ხილვადობას: VIP ანიჭებს გამორჩეულ ბეიჯს და ძიებაში უპირატეს ადგილს, VIP+ მოექცევა მთავარი გვერდის კარუსელში, ხოლო SUPER VIP იძლევა მაქსიმალურ ხილვადობას — საშუალოდ 5× მეტ ნახვას.',
        },
        {
          q: 'რა არის ბუსტი და სტიკერები?',
          a: 'ბუსტი არის დამატებითი ხილვადობა VIP-ის გარდა: განახლება, ფერი, სთორი, Facebook და Turbo. ფასიანი სტიკერები მხოლოდ ორია — „სასწრაფოდ“ და „ფასი დაწეულია“. სთორი ათავსებს განცხადებას მთავარი გვერდის Stories ზოლში (1 დღე). აუზი, პარკინგი, ავეჯი და სხვა მახასიათებლები უფასო რჩება.',
        },
        {
          q: 'როგორ მუშაობს ვერიფიკაცია?',
          a: 'ვერიფიკაციისთვის აგენტი ან მფლობელი ატვირთავს პირადობის დამადასტურებელ დოკუმენტს და ქონების საკადასტრო მონაცემებს. ჩვენი გუნდი ამოწმებს ინფორმაციას 1-2 სამუშაო დღეში და წარმატებული შემოწმების შემდეგ განცხადებას ენიჭება ვერიფიცირებული ნიშანი.',
        },
        {
          q: 'შემიძლია რემონტის ან იურიდიული სერვისის გამოქვეყნება?',
          a: 'დიახ. sivrce-ზე არის სერვისების ბაზარი — რემონტი, ინტერიერი, ფოტო და 3D, იურისტი, შეფასება, გადატანა, დასუფთავება, ქონების მართვა. კომპანია აქვეყნებს სერვისს /add-service-ზე და ქონების განცხადებას იმავე ანგარიშით /add-listing-ზე. ორივე ჩანს კომპანიის პროფილზე.',
        },
      ],
    },
    {
      title: 'პლატფორმის შესახებ',
      items: [
        {
          q: 'რომელ ქალაქებში მუშაობს sivrce?',
          a: 'დღეს sivrce ფარავს საქართველოს 12 ქალაქს — თბილისი, ბათუმი, ქუთაისი, რუსთავი, გორი, ფოთი, ზუგდიდი, თელავი, ახალციხე და სხვა. სია მუდმივად იზრდება.',
        },
        {
          q: 'უსაფრთხოა თუ არა პირდაპირი კონტაქტი?',
          a: 'დიახ. ყველა აგენტი, ვისთანაც ლაპარაკობ, გაივლის ვერიფიკაციას. შეტყობინებები ხდება პლატფორმის შიგნით, რაც ინახავს მიმოწერის ისტორიას და გიცავს თაღლითობისგან. არასდროს გადაურიცხო ფული პირად შეხვედრამდე.',
        },
      ],
    },
  ],
  en: [
    {
      title: 'Real estate in Georgia',
      items: [
        {
          q: 'Where can I find real estate in Georgia?',
          a: 'sivrce is a Georgian real-estate platform: apartments, houses, land and commercial spaces for sale, rent and daily stay. Start from the home page or the 3D map — every listing is verified, and AI scores each price against the market.',
        },
        {
          q: 'Where are daily rentals in Tbilisi?',
          a: 'Find daily apartments in Tbilisi in the “Daily” section — filter by neighborhood (Vake, Saburtalo, Old Tbilisi), dates and price. Book directly with the owner in chat and check verification before paying.',
        },
        {
          q: 'Where are daily rentals in Saburtalo?',
          a: 'Daily apartments in Saburtalo sit near the metro, clinics and business centers. Open the daily rental page, pick the Saburtalo neighborhood and compare 1–2 bedroom options. Prices are per night; booking early in high season saves money.',
        },
        {
          q: 'How do I buy an apartment in Tbilisi — Vake or Saburtalo?',
          a: 'Use search or AI search (“2-bedroom apartment for sale in Vake”), save favorites, compare AI price scores and contact the owner or a verified agent. The deal is between you and the seller — sivrce charges buyers no commission.',
        },
      ],
    },
    {
      title: 'For buyers',
      items: [
        {
          q: 'How do I buy an apartment on sivrce?',
          a: 'Use search or AI search, save favorites, compare prices with AI estimates and contact the owner or a verified agent directly. The deal happens between you and the seller — sivrce takes no buyer commission.',
        },
        {
          q: 'What is the AI price estimate?',
          a: 'Our AI compares a listing’s price against real data from similar properties — location, area, condition, floor — and shows a score from 0 to 100. A high score means a fair or better-than-market price.',
        },
        {
          q: 'How do I book a tour?',
          a: 'Open a listing and tap “Book a tour” — pick a time that suits you in the calendar. The agent or owner confirms the visit.',
        },
        {
          q: 'Which currency are prices shown in?',
          a: 'Prices are shown in GEL and US dollars at the same time. The rate is fixed for display purposes — the final price is always agreed with the seller.',
        },
        {
          q: 'How do I use AI search?',
          a: 'Type free text into the home-page search field — for example “2-bedroom apartment in Vake under $200k”. The AI parses your request and shows matching listings. It works in Georgian, English and Russian.',
        },
      ],
    },
    {
      title: 'For sellers',
      items: [
        {
          q: 'Is adding a listing free?',
          a: 'Yes, publishing a standard listing is completely free and stays active for 30 days. For extra visibility you can choose one of the VIP packages.',
        },
        {
          q: 'What does a VIP package include?',
          a: 'VIP packages boost your listing’s visibility: VIP adds a distinctive badge and priority placement in search, VIP+ puts it in the home-page carousel, and SUPER VIP gives maximum exposure — on average 5× more views.',
        },
        {
          q: 'What are boosts and stickers?',
          a: 'Boosts are extra visibility beyond VIP: refresh, color, story, Facebook and Turbo. Only two stickers are paid — “Urgent” and “Price drop”. Story places your listing in the home-page Stories strip for one day. Pool, parking, furniture and other amenities stay free.',
        },
        {
          q: 'How does verification work?',
          a: 'To get verified, an agent or owner uploads an ID document and the property’s cadastre details. Our team checks the information within 1–2 business days; after a successful check the listing receives a verified badge.',
        },
        {
          q: 'Can I publish a renovation or legal service?',
          a: 'Yes. sivrce has a services marketplace — renovation, interiors, photo & 3D, lawyer, valuation, moving, cleaning, property management. A company publishes a service on /add-service and property listings with the same account on /add-listing. Both appear on the company profile.',
        },
      ],
    },
    {
      title: 'About the platform',
      items: [
        {
          q: 'Which cities does sivrce cover?',
          a: 'Today sivrce covers 12 Georgian cities — Tbilisi, Batumi, Kutaisi, Rustavi, Gori, Poti, Zugdidi, Telavi, Akhaltsikhe and more. The list keeps growing.',
        },
        {
          q: 'Is direct contact safe?',
          a: 'Yes. Every agent you talk to passes verification. Messaging happens inside the platform, which keeps your chat history and protects you from fraud. Never transfer money before meeting in person.',
        },
      ],
    },
  ],
  ru: [
    {
      title: 'Недвижимость в Грузии',
      items: [
        {
          q: 'Где искать недвижимость в Грузии?',
          a: 'sivrce — платформа недвижимости в Грузии: квартиры, дома, земля и коммерческие площади продаются, сдаются и сдаётся посуточно. Начните с главной страницы или 3D-карты — все объявления верифицированы, а ИИ сравнивает цену с рынком.',
        },
        {
          q: 'Где посуточные квартиры в Тбилиси?',
          a: 'Посуточные квартиры в Тбилиси — в разделе «Посуточно»: фильтр по кварталу (Ваке, Сабуртало, Старый Тбилиси), датам и цене. Бронируйте напрямую с владельцем в чате и проверяйте верификацию до оплаты.',
        },
        {
          q: 'Где посуточные квартиры в Сабуртало?',
          a: 'Посуточные квартиры в Сабуртало — у метро, клиник и бизнес-центров. Откройте страницу посуточной аренды, выберите квартал Сабуртало и сравните варианты с 1–2 спальнями. Цена за ночь; раннее бронирование в сезон экономит деньги.',
        },
        {
          q: 'Как купить квартиру в Тбилиси — в Ваке или Сабуртало?',
          a: 'Используйте поиск или ИИ-поиск («2-комнатная квартира в Ваке»), отмечайте избранное, сравнивайте ИИ-оценку цены и обращайтесь к владельцу или верифицированному агенту. Сделка между вами и продавцом — sivrce не берёт комиссию с покупателя.',
        },
      ],
    },
    {
      title: 'Покупателям',
      items: [
        {
          q: 'Как купить квартиру на sivrce?',
          a: 'Используйте поиск или ИИ-поиск, отмечайте избранное, сравнивайте цены с ИИ-оценкой и пишите напрямую владельцу или верифицированному агенту. Сделка происходит между вами и продавцом — sivrce не берёт комиссию с покупателя.',
        },
        {
          q: 'Что такое ИИ-оценка цены?',
          a: 'Наш ИИ сравнивает цену объявления с реальными данными похожих объектов — расположение, площадь, состояние, этаж — и показывает оценку от 0 до 100. Высокая оценка означает справедливую или лучшую рыночную цену.',
        },
        {
          q: 'Как забронировать тур?',
          a: 'Откройте объявление и нажмите «Забронировать просмотр» — выберите удобное время в календаре. Агент или владелец подтвердит визит.',
        },
        {
          q: 'В какой валюте показываются цены?',
          a: 'Цены показываются одновременно в лари и долларах США. Курс зафиксирован для отображения — окончательная цена всегда согласуется с продавцом.',
        },
        {
          q: 'Как пользоваться ИИ-поиском?',
          a: 'Введите свободный текст в поле поиска на главной — например «2-комнатная квартира в Ваке до 200 тысяч». ИИ разберёт запрос и покажет подходящие объявления. Работает на грузинском, английском и русском.',
        },
      ],
    },
    {
      title: 'Продавцам',
      items: [
        {
          q: 'Добавление объявления бесплатное?',
          a: 'Да, публикация стандартного объявления полностью бесплатна и остаётся активной 30 дней. Для дополнительной видимости можно выбрать один из VIP-пакетов.',
        },
        {
          q: 'Что даёт VIP-пакет?',
          a: 'VIP-пакеты повышают видимость объявления: VIP даёт особый бейдж и приоритет в поиске, VIP+ попадает в карусель на главной, а SUPER VIP даёт максимальную видимость — в среднем в 5× больше просмотров.',
        },
        {
          q: 'Что такое бусты и стикеры?',
          a: 'Бусты — дополнительная видимость помимо VIP: обновление, цвет, стори, Facebook и Turbo. Платных стикеров только два — «Срочно» и «Цена снижена». Стори размещает объявление в ленте Stories на главной (1 день). Бассейн, парковка, мебель и другие удобства остаются бесплатными.',
        },
        {
          q: 'Как работает верификация?',
          a: 'Для верификации агент или владелец загружает документ, удостоверяющий личность, и кадастровые данные объекта. Наша команда проверяет информацию в течение 1–2 рабочих дней; после успешной проверки объявление получает значок верификации.',
        },
        {
          q: 'Можно ли опубликовать ремонт или юридическую услугу?',
          a: 'Да. На sivrce есть маркет услуг — ремонт, интерьеры, фото и 3D, юрист, оценка, переезд, уборка, управление недвижимостью. Компания публикует услугу на /add-service и объявления о недвижимости с того же аккаунта на /add-listing. Оба видны в профиле компании.',
        },
      ],
    },
    {
      title: 'О платформе',
      items: [
        {
          q: 'В каких городах работает sivrce?',
          a: 'Сегодня sivrce покрывает 12 городов Грузии — Тбилиси, Батуми, Кутаиси, Рустави, Гори, Поти, Зугдиди, Телави, Ахалцихе и другие. Список постоянно растёт.',
        },
        {
          q: 'Безопасен ли прямой контакт?',
          a: 'Да. Каждый агент проходит верификацию. Переписка происходит внутри платформы — это сохраняет историю сообщений и защищает от мошенничества. Никогда не переводите деньги до личной встречи.',
        },
      ],
    },
  ],
}

function faqLdFor(loc: DirLoc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: loc,
    isPartOf: { '@id': 'https://sivrce.ge/#website' },
    mainEntity: SECTIONS[loc].flatMap((s) =>
      s.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  }
}

const HERO: Record<DirLoc, { kicker: string; title: string; subtitle: string }> = {
  ka: {
    kicker: 'დახმარება',
    title: 'ხშირად დასმული კითხვები',
    subtitle: 'ბინები დღიურად თბილისში და საბურთალოზე, ყიდვა-გაყიდვა, ქირა — ერთ გვერდზე.',
  },
  en: {
    kicker: 'Help',
    title: 'Frequently asked questions',
    subtitle: 'Daily rentals in Tbilisi and Saburtalo, buying and selling, rent — on one page.',
  },
  ru: {
    kicker: 'Помощь',
    title: 'Частые вопросы',
    subtitle: 'Посуточные квартиры в Тбилиси и Сабуртало, покупка и продажа, аренда — на одной странице.',
  },
}

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const loc = dirLoc(isValidLang(raw) ? raw : 'ka')
  const hero = HERO[loc]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLdFor(loc)) }} />
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={hero.kicker} title={hero.title} subtitle={hero.subtitle} />
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-8 md:pb-28">
          <div className="space-y-14">
            {SECTIONS[loc].map((section, si) => (
              <Reveal key={section.title} delay={si * 0.05}>
                <section>
                  <h2 className="text-2xl font-black tracking-[-0.02em] text-sv-ink text-balance">
                    {section.title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {section.items.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-card bg-sv-surface shadow-card ring-1 ring-sv-ink/5 transition open:shadow-card-hover"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-[16px] font-bold text-sv-ink marker:hidden [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-cloud text-sv-blue transition group-open:rotate-45">
                            <Plus className="h-4 w-4" aria-hidden />
                          </span>
                        </summary>
                        <p className="px-6 pb-6 text-[15px] font-medium leading-relaxed text-sv-ink/60">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
