import type { Metadata } from 'next'
import { Eye, TrendingUp, Star, Plus, Building2, BadgeCheck, ArrowRight, KeyRound, CalendarClock, Briefcase, Home, Megaphone, Zap, CircleDot, Palette, RefreshCw, Wrench, type LucideIcon } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { Reveal } from '@/components/Reveal'
import PromoPricingGrid from '@/components/payments/PromoPricingGrid'
import PriceCompare from '@/components/payments/PriceCompare'
import {pageAlternates,  } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { roleSignupHref } from '@/lib/auth-roles'
import { formatGel, MONTHLY_RE_TETRI, ADDON_TETRI } from '@/lib/promo-pricing'
import { jsonLd } from '@/lib/utils'

export const revalidate = 86400

type Copy = {
  metaTitle: string
  metaDescription: string
  hero: { kicker: string; title: string; subtitle: string }
  audiences: { icon: LucideIcon; title: string; text: string; href: string }[]
  pro: { badge: string; title: string; text: string; cta: string; ctaListing: string; steps: { n: string; t: string; d: string }[] }
  addons: { kicker: string; title: string; text: string; items: { icon: LucideIcon; title: string; text: string; price: string }[] }
  brand: { kicker: string; title: string; text: string; cta: string; packs: { title: string; text: string }[] }
  stats: { icon: LucideIcon; value: string; label: string }[]
  faq: { heading: string; items: { q: string; a: string }[] }
}

const COPY: Record<string, Copy> = {
  ka: {
    metaTitle: 'განათავსე განცხადება',
    metaDescription: `უფასო განთავსება მესაკუთრეებისთვის, სააგენტოებისა და დეველოპერებისთვის. VIP დღეში ${formatGel(100)}-დან.`,
    hero: {
      kicker: 'განთავსება',
      title: 'განათავსე განცხადება',
      subtitle: 'უფასოდ დაიწყე — ან გააძლიერე VIP-ით. მესაკუთრე, გამქირავებელი, აგენტი, სააგენტო, დეველოპერი თუ სერვისის კომპანია — ერთი ანგარიში.',
    },
    audiences: [
      { icon: Home, title: 'გამყიდველი', text: 'უფასო განთავსება · 3 წუთი · ლიდები დაფაზე', href: '/add-listing' },
      { icon: KeyRound, title: 'გამქირავებელი', text: 'ყოველთვიური ქირა — იგივე ანგარიში, იგივე VIP', href: '/add-listing' },
      { icon: CalendarClock, title: 'დღიური მასპინძელი', text: 'კოლექციები, თარიღები, უკონტაქტო ჩექინი', href: '/add-listing' },
      { icon: BadgeCheck, title: 'აგენტი', text: 'პროფილი /agents-ზე · ლიდები · ხელმისაწვდომი VIP', href: roleSignupHref('agent') },
      { icon: Building2, title: 'სააგენტო', text: 'გუნდი, ანალიტიკა, განცხადებები ერთ დაფაზე', href: roleSignupHref('agency') },
      { icon: Briefcase, title: 'დეველოპერი', text: 'პროექტები, ინვენტარი, 3D რუკა კორპუსზე', href: roleSignupHref('developer') },
      { icon: Wrench, title: 'სერვისის კომპანია', text: 'რემონტი, იურიდიული, ფოტო — სერვისი და განცხადება ერთ ანგარიშზე', href: '/add-service' },
    ],
    pro: {
      badge: 'სააგენტო · აგენტი · დეველოპერი',
      title: 'პროფესიონალური ანგარიში — 3 ნაბიჯი',
      text: 'აგენტები, სააგენტოები და დეველოპერები — ერთი რეგისტრაცია. როლი რეგისტრაციის შემდეგ ირჩევა — ცალკე განაცხადი არ გჭირდება.',
      cta: 'რეგისტრაცია',
      ctaListing: 'განცხადების დამატება',
      steps: [
        { n: '1', t: 'დარეგისტრირდი', d: 'ტელეფონი ან Google — 30 წამი' },
        { n: '2', t: 'აირჩიე როლი', d: 'აგენტი / სააგენტო / დეველოპერი — ერთი ეკრანი' },
        { n: '3', t: 'გამოაქვეყნე', d: 'უფასო ან VIP+ · ლიდები შენს დაფაზე' },
      ],
    },
    addons: {
      kicker: 'დანამატები',
      title: 'ბუსტები გამოქვეყნების შემდეგ',
      text: 'VIP-ის გარდა — სთორი, სასწრაფოდ, ფერი, Turbo. ყიდულობ შენი განცხადებიდან.',
      items: [
        { icon: Zap, title: 'Turbo', text: 'SUPER VIP + ფერი + სასწრაფოდ', price: formatGel(ADDON_TETRI.turbo_7) + ' / 7 დღე' },
        { icon: CircleDot, title: 'სთორი', text: 'მთავარი გვერდის სთორი · 24 სთ', price: formatGel(ADDON_TETRI.story) },
        { icon: Zap, title: 'სასწრაფოდ', text: 'ნარინჯისფერი ნიშანი · 24 სთ', price: formatGel(ADDON_TETRI.sticker_urgent) },
        { icon: TrendingUp, title: 'ფასი დაწეულია', text: 'სიგნალი მყიდველისთვის · 7 დღე', price: formatGel(ADDON_TETRI.sticker_price_drop) },
        { icon: Palette, title: 'ფერი', text: 'ლურჯი ჩარჩო ძიებაში · 7 დღე', price: formatGel(ADDON_TETRI.color) },
        { icon: RefreshCw, title: 'განახლება', text: 'სიის თავში აყვანა', price: formatGel(ADDON_TETRI.refresh_once) },
      ],
    },
    brand: {
      kicker: 'ბრენდის განთავსება',
      title: 'ბანერები მთელ სივრცეზე',
      text: 'დეველოპერი, ბანკი, დაზღვევა, სააგენტო — ერთი კამპანია, აუდიტორიით (მყიდველი / გამყიდველი / აგენტი) და ენით. ყველა ადგილს ვმართავთ ცენტრალიზებულად.',
      cta: 'დაგვიკავშირდი ბანერისთვის',
      packs: [
        { title: 'მთავარი გვერდი', text: 'ბანერი ჰეროს ქვემოთ — დეველოპერი, ბანკი, ბრენდი' },
        { title: 'ძიება', text: 'სარეკლამო ბარათი შედეგებში + ზედა ზოლი' },
        { title: 'განცხადება', text: 'აგენტის ბარათი გვერდით ზოლში' },
        { title: 'დირექტორიები', text: 'აგენტები, დეველოპერები, პროექტები, უბნები' },
        { title: 'იპოთეკა', text: 'კალკულატორზე — ბანკის პროდუქტი' },
        { title: 'ბლოგი', text: 'სარედაქციო აუდიტორია, შეძენის მაღალი განზრახვა' },
      ],
    },
    stats: [
      { icon: Eye, value: 'VIP+', label: 'კარუსელი + პრიორიტეტი სიაში VIP-ზე წინ' },
      { icon: TrendingUp, value: '2.50₾', label: 'VIP+ დღეში · უძრავი ქონება' },
      { icon: Star, value: formatGel(MONTHLY_RE_TETRI.vip), label: 'VIP 30 დღე · უძრავი ქონება' },
    ],
    faq: {
      heading: 'კითხვები განთავსების შესახებ',
      items: [
        { q: 'რატომ არის sivrce ხელმისაწვდომი?', a: 'VIP+ დღეში 2.50₾-დან, VIP უძრავზე 1₾/დღე, SUPER VIP — ტოპ პოზიცია. უფასო განთავსება ყველასთვის.' },
        { q: 'რომელი პაკეტი ავირჩიო?', a: 'უმეტესობისთვის VIP+ საკმარისია: კარუსელი + სიაში VIP-ზე წინ. SUPER VIP — როცა გინდა ტოპ პოზიცია ყველას თავზე და გამოჩენა მთავარ სლაიდერში.' },
        { q: 'როგორ ხდება გადახდა?', a: 'ონლაინ ბარათით ან ბალანსიდან. სტატუსი აქტიურდება გადახდისთანავე არჩეული დღეების განმავლობაში.' },
        { q: 'რა მოხდება ვადის გასვლის შემდეგ?', a: 'განცხადება არ იშლება — ბრუნდება უფასო რეჟიმში და რჩება ხილვადი ვადის ამოწურვამდე.' },
        { q: 'სააგენტო ან დეველოპერი ვარ — სად დავიწყო?', a: 'დარეგისტრირდი → აირჩიე როლი → შეავსე პროფილი. გამოჩნდები /agents ან /developers დირექტორიაში.' },
        { q: 'სერვისის კომპანია ვარ — რემონტი, იურიდიული, ფოტო. სად დავდო?', a: 'დაამატე კომპანია /add-service-ზე. ქონების განცხადება იმავე ანგარიშით /add-listing-ზე — ორივე გამოჩნდება შენს პროფილზე.' },
      ],
    },
  },
  en: {
    metaTitle: 'Post a Listing',
    metaDescription: `Free listings for owners, agencies and developers. VIP from ${formatGel(100)} per day.`,
    hero: {
      kicker: 'Advertising',
      title: 'Post a listing',
      subtitle: 'Start free — or boost with VIP. Owner, landlord, agent, agency, developer or service company — one account.',
    },
    audiences: [
      { icon: Home, title: 'Seller', text: 'Free listing · 3 minutes · leads on your dashboard', href: '/add-listing' },
      { icon: KeyRound, title: 'Landlord', text: 'Monthly rent — same account, same VIP', href: '/add-listing' },
      { icon: CalendarClock, title: 'Daily host', text: 'Collections, calendar, contactless check-in', href: '/add-listing' },
      { icon: BadgeCheck, title: 'Agent', text: 'Profile on /agents · leads · affordable VIP', href: roleSignupHref('agent') },
      { icon: Building2, title: 'Agency', text: 'Team, analytics and listings on one dashboard', href: roleSignupHref('agency') },
      { icon: Briefcase, title: 'Developer', text: 'Projects, inventory, 3D map per building', href: roleSignupHref('developer') },
      { icon: Wrench, title: 'Service company', text: 'Renovation, legal, photo — services and listings on one account', href: '/add-service' },
    ],
    pro: {
      badge: 'Agency · Agent · Developer',
      title: 'A professional account in 3 steps',
      text: 'This is where the footer’s “Agents / Developers” leads. You pick your role after registration — no separate application.',
      cta: 'Sign up',
      ctaListing: 'Add a listing',
      steps: [
        { n: '1', t: 'Register', d: 'Phone or Google — 30 seconds' },
        { n: '2', t: 'Pick your role', d: 'Agent / agency / developer — one screen' },
        { n: '3', t: 'Publish', d: 'Free or VIP+ · leads on your dashboard' },
      ],
    },
    addons: {
      kicker: 'Add-ons',
      title: 'Boosts after publishing',
      text: 'Beyond VIP — Story, Urgent, Color, Turbo. Bought right from your listing.',
      items: [
        { icon: Zap, title: 'Turbo', text: 'SUPER VIP + color + urgent sticker', price: formatGel(ADDON_TETRI.turbo_7) + ' / 7d' },
        { icon: CircleDot, title: 'Story', text: 'Homepage story · 24h', price: formatGel(ADDON_TETRI.story) },
        { icon: Zap, title: 'Urgent', text: 'Orange sticker · 24h', price: formatGel(ADDON_TETRI.sticker_urgent) },
        { icon: TrendingUp, title: 'Price dropped', text: 'A signal for buyers · 7d', price: formatGel(ADDON_TETRI.sticker_price_drop) },
        { icon: Palette, title: 'Color', text: 'Blue frame in search · 7d', price: formatGel(ADDON_TETRI.color) },
        { icon: RefreshCw, title: 'Refresh', text: 'Move back to the top of the list', price: formatGel(ADDON_TETRI.refresh_once) },
      ],
    },
    brand: {
      kicker: 'Brand advertising',
      title: 'Banners across Sivrce',
      text: 'Developers, banks, insurers, agencies — one campaign with audience (buyer / seller / agent) and language targeting. Admin controls every slot.',
      cta: 'Contact us for banners',
      packs: [
        { title: 'Homepage', text: 'Billboard below the hero — developers, banks, brands' },
        { title: 'Search', text: 'Native card in results + top strip' },
        { title: 'Listing page', text: 'Sidebar below the agent card' },
        { title: 'Directories', text: 'Agents, developers, projects, neighborhoods' },
        { title: 'Mortgage', text: 'On the calculator — a bank product' },
        { title: 'Blog', text: 'Editorial audience, high intent' },
      ],
    },
    stats: [
      { icon: Eye, value: 'VIP+', label: 'Carousel + priority above VIP in list' },
      { icon: TrendingUp, value: '2.50₾', label: 'VIP+ per day · residential' },
      { icon: Star, value: formatGel(MONTHLY_RE_TETRI.vip), label: 'VIP 30 days · residential' },
    ],
    faq: {
      heading: 'Questions about listing',
      items: [
        { q: 'Why is sivrce affordable?', a: 'VIP+ from 2.50₾/day, VIP residential 1₾/day, SUPER VIP — top position. Posting is free for everyone.' },
        { q: 'Which package should I pick?', a: 'For most people VIP+ is enough: carousel + priority above VIP. SUPER VIP — when you want to be on top of everyone and in the main slider.' },
        { q: 'How does payment work?', a: 'Online by card or from your balance. The status activates immediately upon payment for the days you chose.' },
        { q: 'What happens when the term ends?', a: 'The listing is not removed — it returns to free mode and stays visible until it expires.' },
        { q: 'I’m an agency or developer — where do I start?', a: 'Register → pick a role → complete your profile. You’ll appear in the /agents or /developers directory.' },
        { q: 'I run a service company — renovation, legal, photo. Where do I list?', a: 'Add your company on /add-service. A property listing on /add-listing with the same account — both appear on your profile.' },
      ],
    },
  },
  ru: {
    metaTitle: 'Разместите объявление',
    metaDescription: `Бесплатные объявления для владельцев, агентств и застройщиков. VIP от ${formatGel(100)} в день.`,
    hero: {
      kicker: 'Реклама',
      title: 'Разместите объявление',
      subtitle: 'Начните бесплатно — или усильте VIP. Собственник, арендодатель, агент, агентство, застройщик или сервисная компания — один аккаунт.',
    },
    audiences: [
      { icon: Home, title: 'Продавец', text: 'Бесплатное объявление · 3 минуты · заявки в панели', href: '/add-listing' },
      { icon: KeyRound, title: 'Арендодатель', text: 'Ежемесячная аренда — тот же аккаунт, тот же VIP', href: '/add-listing' },
      { icon: CalendarClock, title: 'Хозяин посуточно', text: 'Коллекции, календарь, бесконтактный чек-ин', href: '/add-listing' },
      { icon: BadgeCheck, title: 'Агент', text: 'Профиль на /agents · заявки · доступный VIP', href: roleSignupHref('agent') },
      { icon: Building2, title: 'Агентство', text: 'Команда, аналитика и объявления в одной панели', href: roleSignupHref('agency') },
      { icon: Briefcase, title: 'Застройщик', text: 'Проекты, инвентарь, 3D-карта по корпусу', href: roleSignupHref('developer') },
      { icon: Wrench, title: 'Сервисная компания', text: 'Ремонт, юристы, фото — услуги и объявления на одном аккаунте', href: '/add-service' },
    ],
    pro: {
      badge: 'Агентство · Агент · Застройщик',
      title: 'Профессиональный аккаунт — 3 шага',
      text: 'Сюда ведут «Агенты / Застройщики» в футере. Роль выбирается после регистрации — отдельная заявка не нужна.',
      cta: 'Регистрация',
      ctaListing: 'Добавить объявление',
      steps: [
        { n: '1', t: 'Зарегистрируйтесь', d: 'Телефон или Google — 30 секунд' },
        { n: '2', t: 'Выберите роль', d: 'Агент / агентство / застройщик — один экран' },
        { n: '3', t: 'Публикуйте', d: 'Бесплатно или VIP+ · заявки в вашей панели' },
      ],
    },
    addons: {
      kicker: 'Дополнения',
      title: 'Бусты после публикации',
      text: 'Кроме VIP — Story, «Срочно», цвет, Turbo. Покупаются прямо из объявления.',
      items: [
        { icon: Zap, title: 'Turbo', text: 'SUPER VIP + цвет + срочно', price: formatGel(ADDON_TETRI.turbo_7) + ' / 7д' },
        { icon: CircleDot, title: 'Story', text: 'Стори на главной · 24ч', price: formatGel(ADDON_TETRI.story) },
        { icon: Zap, title: 'Срочно', text: 'Оранжевая наклейка · 24ч', price: formatGel(ADDON_TETRI.sticker_urgent) },
        { icon: TrendingUp, title: 'Цена снижена', text: 'Сигнал для покупателей · 7д', price: formatGel(ADDON_TETRI.sticker_price_drop) },
        { icon: Palette, title: 'Цвет', text: 'Синяя рамка в поиске · 7д', price: formatGel(ADDON_TETRI.color) },
        { icon: RefreshCw, title: 'Обновление', text: 'Подъём на верх списка', price: formatGel(ADDON_TETRI.refresh_once) },
      ],
    },
    brand: {
      kicker: 'Бренд-реклама',
      title: 'Баннеры по всему Sivrce',
      text: 'Застройщики, банки, страховые, агентства — одна кампания с таргетингом по аудитории (покупатель / продавец / агент) и языку. Каждый слот контролирует админ.',
      cta: 'Свяжитесь насчёт баннеров',
      packs: [
        { title: 'Главная', text: 'Billboard под хиро — застройщики, банки, бренды' },
        { title: 'Поиск', text: 'Native-карточка в результатах + верхняя полоса' },
        { title: 'Объявление', text: 'Сайдбар под карточкой агента' },
        { title: 'Каталоги', text: 'Агенты, застройщики, проекты, районы' },
        { title: 'Ипотека', text: 'На калькуляторе — банковский продукт' },
        { title: 'Блог', text: 'Редакционная аудитория, высокий intent' },
      ],
    },
    stats: [
      { icon: Eye, value: 'VIP+', label: 'Карусель + приоритет выше VIP в списке' },
      { icon: TrendingUp, value: '2.50₾', label: 'VIP+ в день · недвижимость' },
      { icon: Star, value: formatGel(MONTHLY_RE_TETRI.vip), label: 'VIP 30 дней · недвижимость' },
    ],
    faq: {
      heading: 'Вопросы о размещении',
      items: [
        { q: 'Почему sivrce доступный?', a: 'VIP+ от 2.50₾/день, VIP жилой 1₾/день, SUPER VIP — топ-позиция. Бесплатное размещение для всех.' },
        { q: 'Какой пакет выбрать?', a: 'Большинству хватает VIP+: карусель + приоритет выше VIP. SUPER VIP — когда нужно быть выше всех и в главном слайдере.' },
        { q: 'Как проходит оплата?', a: 'Онлайн картой или с баланса. Статус активируется сразу после оплаты на выбранные дни.' },
        { q: 'Что будет после окончания срока?', a: 'Объявление не удаляется — возвращается в бесплатный режим и остаётся видимым до истечения срока.' },
        { q: 'Я агентство или застройщик — с чего начать?', a: 'Зарегистрируйтесь → выберите роль → заполните профиль. Вы появитесь в каталоге /agents или /developers.' },
        { q: 'У меня сервисная компания — ремонт, юристы, фото. Где разместиться?', a: 'Добавьте компанию на /add-service. Объявление о недвижимости на /add-listing с тем же аккаунтом — оба будут в вашем профиле.' },
      ],
    },
  },
}

// ponytail: grid/compare cover ka/en/ru; remaining langs (tr/az/hy/uk/he/ar) fall back to ka like the page copy.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = COPY[lang] ?? COPY.ka
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: pageAlternates('/advertise', lang),
  }
}

export default async function AdvertisePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = COPY[lang] ?? COPY.ka
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero kicker={c.hero.kicker} title={c.hero.title} subtitle={c.hero.subtitle} />

        <section className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.audiences.map((a) => (
                <LocalizedLink
                  key={a.title}
                  href={a.href}
                  className="group flex gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-extrabold tracking-[-0.02em] text-sv-ink">
                      {a.title}
                    </span>
                    <span className="mt-1 block text-[13px] font-medium leading-relaxed text-sv-ink/60">
                      {a.text}
                    </span>
                  </span>
                </LocalizedLink>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ponytail: BD funnel for agencies — footer already points here; page was VIP-only. */}
        <section className="mx-auto max-w-5xl px-6 pb-14 pt-10">
          <Reveal>
            <div className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-navy p-6 text-white shadow-card md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
                    <Building2 className="h-3.5 w-3.5" /> {c.pro.badge}
                  </p>
                  <h2 className="mt-2 text-[22px] font-black tracking-[-0.02em] md:text-[28px]">
                    {c.pro.title}
                  </h2>
                  <p className="mt-2 text-[14px] font-medium text-white/65">
                    {c.pro.text}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LocalizedLink
                    href={roleSignupHref()}
                    className="inline-flex items-center gap-2 rounded-full bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5"
                  >
                    {c.pro.cta} <ArrowRight className="h-4 w-4" />
                  </LocalizedLink>
                  <LocalizedLink
                    href="/add-listing"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[14px] font-extrabold text-white transition hover:bg-white/15"
                  >
                    {c.pro.ctaListing}
                  </LocalizedLink>
                </div>
              </div>
              <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {c.pro.steps.map((s) => (
                  <li
                    key={s.n}
                    className="rounded-module border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] font-black text-sv-blue-light">
                      <BadgeCheck className="h-4 w-4" /> {s.n}. {s.t}
                    </span>
                    <p className="mt-1.5 text-[13px] font-medium text-white/55">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PromoPricingGrid lang={lang === 'en' || lang === 'ru' ? lang : 'ka'} />
        </section>

        <PriceCompare lang={lang} />

        <AdSlot slot="advertise" lang={lang} />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue">
              <Zap className="h-3.5 w-3.5" /> {c.addons.kicker}
            </p>
            <h2 className="mt-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              {c.addons.title}
            </h2>
            <p className="mt-2 max-w-xl text-[14px] font-medium text-sv-ink/60">
              {c.addons.text}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.addons.items.map((a) => (
                <div
                  key={a.title}
                  className="flex gap-3 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-extrabold text-sv-ink">{a.title}</span>
                      <span className="shrink-0 text-[13px] font-black text-sv-blue">{a.price}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-sv-ink/60">{a.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Reveal>
            <div className="overflow-hidden rounded-card bg-sv-navy p-6 text-white shadow-card md:p-10">
              <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
                <Megaphone className="h-3.5 w-3.5" /> {c.brand.kicker}
              </p>
              <h2 className="mt-2 max-w-xl text-[22px] font-black tracking-[-0.02em] md:text-[28px]">
                {c.brand.title}
              </h2>
              <p className="mt-2 max-w-xl text-[14px] font-medium text-white/65">
                {c.brand.text}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {c.brand.packs.map((p) => (
                  <div key={p.title} className="rounded-module border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[14px] font-black">{p.title}</p>
                    <p className="mt-1 text-[13px] font-medium text-white/55">{p.text}</p>
                  </div>
                ))}
              </div>
              <LocalizedLink
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5"
              >
                {c.brand.cta} <ArrowRight className="h-4 w-4" />
              </LocalizedLink>
            </div>
          </Reveal>
        </section>

        <section className="bg-sv-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
            {c.stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-module bg-sv-cloud shadow-card">
                    <s.icon className="h-6 w-6 text-sv-blue" />
                  </div>
                  <div>
                    <div className="text-2xl font-black tracking-[-0.02em] text-sv-blue">{s.value}</div>
                    <div className="text-sm font-semibold text-sv-ink/60">{s.label}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance">
              {c.faq.heading}
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {c.faq.items.map((item) => (
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
                <p className="px-6 pb-6 text-[15px] font-medium leading-relaxed text-sv-ink/60">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: c.faq.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }),
        }}
      />
      <Footer />
    </div>
  )
}
