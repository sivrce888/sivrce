import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { Baby, ChevronRight, TrendingUp, Building2, Scale } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import MortgageCalcClient from '@/components/mortgage/MortgageCalcClient'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { type DirLoc } from '@/lib/directory-seo'
import {
  downCell,
  MORTGAGE_GE_BANKS,
  MORTGAGE_SUBSIDY,
  rateBand,
  termYrs,
} from '@/data/mortgage-ge'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/mortgage-calculator', lang, {
      ka: {
        title:
          'იპოთეკის კალკულატორი საქართველოში — ყოველთვიური გადახდა, პირველი შენატანი, პროცენტი',
        description:
          'უფასო იპოთეკის კალკულატორი საქართველოს ბაზრისთვის — გამოთვალეთ ყოველთვიური გადახდა ნებისმიერი ბინისთვის. 2026 წლის გამოქვეყნებული პროცენტები TBC და BasisBank, სახელმწიფო სუბსიდირებული იპოთეკა, NBG განაკვეთი 8.25%.',
      },
      en: {
        title: 'Mortgage Calculator Georgia — Monthly Payment, Down Payment, Rates',
        description:
          'Free mortgage calculator for the Georgian market — monthly payment for any apartment. Published 2026 rates at TBC and BasisBank, the state subsidized mortgage, NBG policy rate 8.25%.',
      },
      ru: {
        title: 'Ипотечный калькулятор Грузии — платёж, взнос, ставка',
        description:
          'Бесплатный ипотечный калькулятор для рынка Грузии — ежемесячный платёж для любой квартиры. Опубликованные ставки 2026: TBC и BasisBank, государственная субсидируемая ипотека, учётная ставка NBG 8.25%.',
      },
      de: {
        title: 'Hypothekenrechner Georgien — Monatsrate, Anzahlung, Zinssatz',
        description:
          'Kostenloser Hypothekenrechner für den georgischen Markt — die Monatsrate für jede Wohnung. Veröffentlichte Zinssätze 2026: TBC und BasisBank, die staatlich subventionierte Hypothek, NBG-Leitzins 8,25 %.',
      },
    }),
    openGraph: {
      title: 'იპოთეკის კალკულატორი საქართველოში',
      description: 'გამოთვალეთ ყოველთვიური გადახდა და პროცენტი — 2026 წლის ბაზრის პირობებით.',
      url: 'https://sivrce.ge/mortgage-calculator',
      siteName: 'sivrce',
      locale: 'ka_GE',
      type: 'website',
    },
  }
}

const COPY: Record<DirLoc | 'de', {
  kicker: string; title: string; subtitle: string
  bankSection: string; thBank: string; thGEL: string; thFX: string; thTerm: string; thDown: string
  ratesNote: string
  subsidyTitle: string; subsidyChips: { n: string; label: string }[]; subsidyNote: string
  guideTitle: string; guide: string[]
  faqTitle: string; faqs: { q: string; a: string }[]
  ctaTitle: string; ctaSub: string; ctaButton: string
  crumbHome: string; crumbCalc: string; lang: string
  sibling: string
}> = {
  ka: {
    kicker: 'ოფიციალური წყაროებით — 2026 წლის სექტემბერი',
    title: 'იპოთეკის კალკულატორი საქართველოში',
    subtitle: 'გამოთვალეთ ყოველთვიური გადახდა, პროცენტის ჯამი და პირველი შენატანი ნებისმიერი ბინისთვის. კალკულატორი იყენებს სტანდარტულ ანუიტეტის ფორმულას — იგივეს, რასაც Bank of Georgia-ც და TBC-ც.',
    bankSection: 'გამოქვეყნებული იპოთეკური პირობები', thBank: 'ბანკი', thGEL: 'ლარის პროცენტი', thFX: 'დოლარი/ევრო', thTerm: 'მაქს. ვადა (წლ.)', thDown: 'პირველი შენატანი',
    ratesNote: 'გამოქვეყნებული პროცენტები 2026 წლის სექტემბრის მდგომარეობით — NBG პოლიტიკური განაკვეთი 8.25%. ბანკები მართავენ სასტარტო აქციებს (მაგ. Bank of Georgia — 0–1% პირველი თვეებისთვის); ზუსტი პირობები ბანკთან დააზუსტეთ. „—“ ნიშნავს, რომ ბანკი ამ მონაცემს არ აქვეყნებს.',
    subsidyTitle: 'სახელმწიფო სუბსიდირებული იპოთეკა',
    subsidyChips: [
      { n: '₾200,000', label: 'მდე — მაქსიმალური სესხი' },
      { n: '−4 / −5 / −6', label: 'პროცენტული პუნქტი 1 / 2 / 3+ შვილზე' },
      { n: '60 თვე', label: 'სუბსიდირება სესხის გაცემიდან' },
      { n: '8.25%', label: 'NBG პოლიტიკური განაკვეთი' },
    ],
    subsidyNote: 'მხოლოდ ლარის სესხებზე, პარტნიორი ბანკების მეშვეობით — enterprisegeorgia.gov.ge.',
    guideTitle: 'როგორ მუშაობს იპოთეკა საქართველოში',
    guide: [
      'იპოთეკა საქართველოში გაიცემა ლარში (GEL) ან უცხოურ ვალუტაში (USD/EUR). ლარის პროცენტი უფრო მაღალია — 2026-ში გამოქვეყნებული დიაპაზონი TBC-ში 9.9%-დან იწყება, BasisBank-ში კი 10.9–17.5%-ია — მაგრამ სავალუტო რისკი არ აქვს. უცხოურ ვალუტაში სესხი იაფია (BasisBank-ში 7.9–10.5%), თუმცა კურსის რყევამ შეიძლება ყოველთვიური გადახდა გაზარდოს. ყველა ლარის შემოთავაზების საფუძველი NBG-ის პოლიტიკური განაკვეთია — 8.25% (2026 წლის მაისიდან).',
      'სტანდარტული მოთხოვნები: 21+ წლის ასაკი, საქართველოში მიღებული შემოსავლის დადასტურება (ბოლო 3-6 თვის ამონაწერი), საკუთრების დაზღვევა. არარეზიდენტებისთვის ხშირად უფრო მოკლე ვადა და უფრო დიდი პირველი შენატანია — TBC-ის ექსპატთა პროგრამა ითხოვს მინ. 20%-ს.',
      'განაცხადის განხილვას სჭირდება 3-10 სამუშაო დღე. პრე-აპრუვალი (წინასწარი თანხმობა) TBC-სა და Bank of Georgia-ს ციფრულ აპში ხშირად რამდენიმე საათში გაიცემა. საბოლოო ხელშეკრულება იდება ქონების შერჩევის შემდეგ.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      { q: 'რა არის მინიმალური პირველი შენატანი იპოთეკაზე საქართველოში?', a: 'რეზიდენტი მოქალაქეებისთვის მინიმალური პირველი შენატანი ჩვეულებრივ 10-20% იყო, თუმცა 2026 წლის ბაზარზე ბანკების უმრავლესობა ითხოვს 20-30%-ს (BasisBank — 15%-დან). არარეზიდენტებისთვის მოთხოვნა ხშირად 30-50%-მდე იზრდება, რადგან საქართველოში მიღებული შემოსავალი არ აქვთ.' },
      { q: 'რომელი ბანკი იძლევა საუკეთესო იპოთეკურ პირობებს 2026-ში?', a: '2026-ში გამოქვეყნებული დიაპაზონები: TBC — ლარზე 9.9%-დან; BasisBank — 10.9–17.5% ლარზე და 7.9–10.5% დოლარ/ევროზე. Bank of Georgia და TBC მართავენ სასტარტო აქციებს (მაგ. პირველი თვეების 0–1%). ოჯახებისთვის მოქმედებს სახელმწიფო სუბსიდირებული იპოთეკა 200,000 ლარამდე. კონკრეტული პირობები დამოკიდებულია შემოსავალზე, კრედიტის ისტორიაზე და ქონების ტიპზე.' },
      { q: 'შეუძლია თუ არა უცხოელს იპოთეკის აღება საქართველოში?', a: 'დიახ, მაგრამ შეზღუდვებით. საქართველოში მიღებული შემოსავლის გარეშე ბანკები ითხოვენ მსხვილ პირველ შენატანს (30-50%) და მოკლე ვადას (10-15 წელი). TBC-ს აქვს ექსპატებისთვის განკუთვნილი პროგრამა მინ. 20% შენატნით. ზოგიერთი ბანკი მოითხოვს საქართველოში ადგილობრივ გარანტს ან კომპანიის რეგისტრაციას. ქონების სრული თანხის ნაღდად გადახდა ყოველთვის შესაძლებელია და ყველაზე გავრცელებული გზაა უცხოელებისთვის.' },
      { q: 'რა დამატებითი ხარჯები მოსდევს ქონების ყიდვას?', a: 'საქართველოში გადაცემის გადასახადი საერთოდ არ არსებობს — სახელმწიფო მხოლოდ საჯარო რეესტრის (NAPR) რეგისტრაციის განაკვეთს იღებს: ₾50 სტანდარტული (4 სამუშაო დღე) ან მაქს. ₾350 იმავე დღეს. ნოტარიუსი არასავალდებულოა; დაახლოებით ₾500 დაიხარჯება თარგმანზე/ნოტარიუსზე. აგენტის საკომისიო (≈2%) ჩვეულებრივ გამყიდველი იხდის. 24 თვეში გაყიდვისას მოგებაზე შეიძლება 20% საშემოსავლო გადასახადი დაერიოს; ორი წლის შემდეგ — გათავისუფლებულია.' },
      { q: 'რა ვადით მომგებიანია იპოთეკა?', a: 'მოკლე ვადით (10-15 წელი) პროცენტის ჯამი ორჯერ ნაკლებია, მაგრამ ყოველთვიური თანხა მაღალია. გრძელი ვადა (20-25 წელი) ამცირებს ყოველთვიურ დატვირთვას, მაგრამ საბოლოო ღირებულება იზრდება. ოქროს შუალედი ქართული ბინისთვის — 15-20 წელი.' },
    ],
    ctaTitle: 'ბინას ეძებთ?',
    ctaSub: 'ვერიფიცირებული განცხადებები AI ფასის შეფასებით — თბილისი, ბათუმი, ქუთაისი.',
    ctaButton: 'ვერიფიცირებული ბინები',
    crumbHome: 'მთავარი', crumbCalc: 'იპოთეკის კალკულატორი', lang: 'ka',
    sibling: 'ქირა თუ ყიდვა? შეადარეთ რიცხვებით →',
  },
  en: {
    kicker: 'From official sources — September 2026',
    title: 'Mortgage Calculator Georgia',
    subtitle: 'Work out the monthly payment, total interest and down payment for any apartment. The calculator uses the standard annuity formula — the same one Bank of Georgia and TBC use.',
    bankSection: 'Published mortgage terms', thBank: 'Bank', thGEL: 'GEL rate', thFX: 'USD/EUR rate', thTerm: 'Max term (yrs)', thDown: 'Min down',
    ratesNote: 'Published rates as of September 2026 — NBG policy rate 8.25%. Banks run intro campaigns (Bank of Georgia advertised 0–1% for the first months of 2026); ask the bank for a personal offer. “—” means the bank does not publish that figure.',
    subsidyTitle: 'State subsidized mortgage',
    subsidyChips: [
      { n: '₾200,000', label: 'maximum loan under the program' },
      { n: '−4 / −5 / −6', label: 'percentage points with 1 / 2 / 3+ children' },
      { n: '60 mo', label: 'subsidy window from issuance' },
      { n: '8.25%', label: 'NBG policy rate' },
    ],
    subsidyNote: 'GEL loans only, via partner banks — enterprisegeorgia.gov.ge.',
    guideTitle: 'How mortgages work in Georgia',
    guide: [
      'Mortgages in Georgia are issued in GEL or in USD/EUR. GEL rates are higher — published 2026 bands start at 9.9% at TBC and run 10.9–17.5% at BasisBank — but carry no currency risk. Foreign-currency loans price lower (7.9–10.5% at BasisBank), yet exchange-rate swings can raise your monthly payment. Every GEL offer floats on the NBG policy rate: 8.25% since May 2026.',
      'Standard requirements: age 21+, proof of Georgian income (last 3–6 months of statements) and property insurance. Non-residents usually face shorter terms and larger down payments — TBC’s expat program asks a minimum 20% own contribution.',
      'Review takes 3–10 business days. Pre-approval in the TBC and Bank of Georgia apps is often issued within hours. The final contract is signed after the property is chosen.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is the minimum down payment on a mortgage in Georgia?', a: 'For residents the minimum down payment used to be 10–20%, but in the 2026 market most banks ask for 20–30% (BasisBank publishes from 15%). For non-residents the requirement often rises to 30–50% because they have no Georgian income.' },
      { q: 'Which bank offers the best mortgage terms in 2026?', a: 'Published 2026 bands: TBC from 9.9% in GEL; BasisBank 10.9–17.5% in GEL and 7.9–10.5% in USD/EUR. Bank of Georgia and TBC run intro campaigns (0–1% for the first months). Families can apply for the state subsidized mortgage of up to ₾200,000. The exact offer depends on income, credit history and property type.' },
      { q: 'Can a foreigner get a mortgage in Georgia?', a: 'Yes, with limitations. Without Georgian income banks require a large down payment (30–50%) and a shorter term (10–15 years). TBC runs a dedicated expat program with a minimum 20% own contribution. Some banks require a local guarantor or a company registered in Georgia. Paying cash for the full price is always possible and is the most common route for foreigners.' },
      { q: 'What extra costs come with buying property?', a: 'Georgia charges no transfer tax at all — the state takes only the fixed Public Registry (NAPR) registration fee: ₾50 standard (4 working days) or up to ₾350 same-day. A notary is optional; budget ≈₾500 for notary/translation help. The agency commission (≈2%) is normally paid by the seller. Reselling within 24 months can expose the gain to 20% income tax; after two years of ownership the gain is tax-free.' },
      { q: 'What term is most economical?', a: 'A short term (10–15 years) halves the total interest but raises the monthly payment. A long term (20–25 years) lowers the monthly burden but increases the final cost. The sweet spot for a Georgian apartment is 15–20 years.' },
    ],
    ctaTitle: 'Looking for an apartment?',
    ctaSub: 'Verified listings with AI price estimates — Tbilisi, Batumi, Kutaisi.',
    ctaButton: 'Verified apartments',
    crumbHome: 'Home', crumbCalc: 'Mortgage calculator', lang: 'en',
    sibling: 'Rent vs buy? Compare with numbers →',
  },
  ru: {
    kicker: 'По официальным источникам — сентябрь 2026',
    title: 'Ипотечный калькулятор Грузии',
    subtitle: 'Рассчитайте ежемесячный платёж, сумму процентов и первый взнос для любой квартиры. Калькулятор использует стандартную аннуитетную формулу — ту же, что и Bank of Georgia и TBC.',
    bankSection: 'Опубликованные ипотечные условия', thBank: 'Банк', thGEL: 'Ставка в лари', thFX: 'Ставка в USD/EUR', thTerm: 'Макс. срок (лет)', thDown: 'Первый взнос',
    ratesNote: 'Опубликованные ставки на сентябрь 2026 — учётная ставка NBG 8.25%. Банки проводят стартовые акции (Bank of Georgia объявлял 0–1% на первые месяцы 2026); точное предложение уточняйте в банке. «—» означает, что банк не публикует этот показатель.',
    subsidyTitle: 'Государственная субсидируемая ипотека',
    subsidyChips: [
      { n: '₾200,000', label: 'максимальный размер кредита' },
      { n: '−4 / −5 / −6', label: 'процентных пункта при 1 / 2 / 3+ детях' },
      { n: '60 мес', label: 'субсидия с момента выдачи' },
      { n: '8.25%', label: 'учётная ставка NBG' },
    ],
    subsidyNote: 'Только кредиты в лари, через банки-партнёры — enterprisegeorgia.gov.ge.',
    guideTitle: 'Как работает ипотека в Грузии',
    guide: [
      'Ипотека в Грузии выдаётся в лари (GEL) или в USD/EUR. Ставка в лари выше — опубликованные диапазоны 2026 года: от 9.9% в TBC и 10.9–17.5% в BasisBank, — но без валютного риска. Валютный кредит дешевле (в BasisBank 7.9–10.5%), однако колебания курса могут увеличить ежемесячный платёж. Якорь каждого лариового предложения — учётная ставка NBG: 8.25% с мая 2026 года.',
      'Стандартные требования: возраст 21+, подтверждение дохода в Грузии (выписка за последние 3–6 месяцев), страхование собственности. Для нерезидентов часто короче срок и больше первый взнос — программа TBC для экспатов требует минимум 20% собственных средств.',
      'Рассмотрение заявки занимает 3–10 рабочих дней. Пре-аппруваль в приложениях TBC и Bank of Georgia часто приходит за несколько часов. Финальный договор подписывается после выбора недвижимости.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      { q: 'Какой минимальный первый взнос по ипотеке в Грузии?', a: 'Для резидентов минимальный взнос обычно был 10–20%, но на рынке 2026 года большинство банков требует 20–30% (BasisBank публикует от 15%). Для нерезидентов требование часто вырастает до 30–50%, так как нет грузинского дохода.' },
      { q: 'Какой банк даёт лучшие ипотечные условия в 2026 году?', a: 'Опубликованные диапазоны 2026 года: TBC — от 9.9% в лари; BasisBank — 10.9–17.5% в лари и 7.9–10.5% в долларах/евро. Bank of Georgia и TBC проводят стартовые акции (0–1% на первые месяцы). Для семей действует государственная субсидируемая ипотека до 200 000 лари. Конкретное предложение зависит от дохода, кредитной истории и типа недвижимости.' },
      { q: 'Может ли иностранец получить ипотеку в Грузии?', a: 'Да, с ограничениями. Без грузинского дохода банки требуют большой первый взнос (30–50%) и короткий срок (10–15 лет). У TBC есть отдельная программа для экспатов с минимум 20% собственных средств. Некоторые банки требуют местного поручителя или регистрацию компании в Грузии. Оплата полной цены наличными всегда возможна и является самым распространённым путём для иностранцев.' },
      { q: 'Какие дополнительные расходы при покупке недвижимости?', a: 'В Грузии нет налога на передачу собственности — государство берёт только фиксированный сбор Публичного реестра (NAPR) за регистрацию: ₾50 стандартно (4 рабочих дня) или до ₾350 в день подачи. Нотариус не обязателен; заложите ≈₾500 на нотариуса/перевод. Комиссию агентства (≈2%) обычно платит продавец. При продаже в течение 24 месяцев прирост стоимости может облагаться 20% подоходным; после двух лет владения — освобождён.' },
      { q: 'На какой срок выгоднее ипотека?', a: 'Короткий срок (10–15 лет) уменьшает сумму процентов вдвое, но платёж выше. Длинный срок (20–25 лет) снижает ежемесячную нагрузку, но увеличивает итоговую стоимость. Золотая середина для грузинской квартиры — 15–20 лет.' },
    ],
    ctaTitle: 'Ищете квартиру?',
    ctaSub: 'Верифицированные объявления с ИИ-оценкой цены — Тбилиси, Батуми, Кутаиси.',
    ctaButton: 'Верифицированные квартиры',
    crumbHome: 'Главная', crumbCalc: 'Ипотечный калькулятор', lang: 'ru',
    sibling: 'Аренда или покупка? Сравните по цифрам →',
  },
  de: {
    kicker: 'Aus offiziellen Quellen — September 2026',
    title: 'Hypothekenrechner Georgien',
    subtitle: 'Berechnen Sie Monatsrate, Gesamtzinsen und Anzahlung für jede Wohnung. Der Rechner nutzt die Standard-Annuitätenformel — dieselbe, die auch Bank of Georgia und TBC verwenden.',
    bankSection: 'Veröffentlichte Hypothekenkonditionen', thBank: 'Bank', thGEL: 'GEL-Zins', thFX: 'USD/EUR-Zins', thTerm: 'Max. Laufzeit (J.)', thDown: 'Mindestanzahlung',
    ratesNote: 'Veröffentlichte Zinssätze Stand September 2026 — NBG-Leitzins 8,25 %. Die Banken fahren Einführungsaktionen (Bank of Georgia bewarb 0–1 % für die ersten Monate 2026); erfragen Sie das konkrete Angebot bei der Bank. „—“ bedeutet: Die Bank veröffentlicht diese Angabe nicht.',
    subsidyTitle: 'Staatlich subventionierte Hypothek',
    subsidyChips: [
      { n: '₾200,000', label: 'maximaler Kredit des Programms' },
      { n: '−4 / −5 / −6', label: 'Prozentpunkte bei 1 / 2 / 3+ Kindern' },
      { n: '60 Mon.', label: 'Subventionszeitraum ab Auszahlung' },
      { n: '8.25%', label: 'NBG-Leitzins' },
    ],
    subsidyNote: 'Nur GEL-Kredite, über Partnerbanken — enterprisegeorgia.gov.ge.',
    guideTitle: 'So funktionieren Hypotheken in Georgien',
    guide: [
      'Hypotheken in Georgien laufen auf GEL oder USD/EUR. GEL-Zinsen sind höher — veröffentlichte Spannen 2026: ab 9,9 % bei TBC und 10,9–17,5 % bei BasisBank — aber ohne Währungsrisiko. Fremdwährungskredite sind günstiger (bei BasisBank 7,9–10,5 %), doch Kursschwankungen können die Monatsrate erhöhen. Anker jedes GEL-Angebots ist der NBG-Leitzins: 8,25 % seit Mai 2026.',
      'Standardanforderungen: Alter 21+, Nachweis eines georgischen Einkommens (Kontoauszüge der letzten 3–6 Monate) und Gebäudeversicherung. Nichtansässige erhalten meist kürzere Laufzeiten und eine höhere Anzahlung — das Expat-Programm von TBC verlangt mindestens 20 % Eigenmittel.',
      'Die Prüfung dauert 3–10 Werktage. Eine Vorabgenehmigung in den Apps von TBC und Bank of Georgia gibt es oft innerhalb weniger Stunden. Der endgültige Vertrag wird nach der Auswahl der Immobilie geschlossen.',
    ],
    faqTitle: 'Häufig gestellte Fragen',
    faqs: [
      { q: 'Wie hoch ist die Mindestanzahlung für eine Hypothek in Georgien?', a: 'Für Ansässige lag die Mindestanzahlung früher bei 10–20 %, im Markt 2026 verlangen die meisten Banken 20–30 % (BasisBank veröffentlicht ab 15 %). Für Nichtansässige steigt die Anforderung oft auf 30–50 %, da kein georgisches Einkommen vorliegt.' },
      { q: 'Welche Bank bietet 2026 die besten Hypothekenkonditionen?', a: 'Veröffentlichte Spannen 2026: TBC ab 9,9 % in GEL; BasisBank 10,9–17,5 % in GEL und 7,9–10,5 % in USD/EUR. Bank of Georgia und TBC fahren Einführungsaktionen (0–1 % in den ersten Monaten). Für Familien gibt es die staatlich subventionierte Hypothek bis 200.000 GEL. Das konkrete Angebot hängt von Einkommen, Kreditgeschichte und Immobilientyp ab.' },
      { q: 'Kann ein Ausländer in Georgien eine Hypothek bekommen?', a: 'Ja, mit Einschränkungen. Ohne georgisches Einkommen verlangen Banken eine hohe Anzahlung (30–50 %) und eine kürzere Laufzeit (10–15 Jahre). TBC bietet ein eigenes Expat-Programm mit mindestens 20 % Eigenmitteln. Manche Banken verlangen einen lokalen Bürgen oder eine in Georgien registrierte Firma. Die Barzahlung des vollständigen Preises ist immer möglich und ist der üblichste Weg für Ausländer.' },
      { q: 'Welche Zusatzkosten kommen beim Immobilienkauf auf mich zu?', a: 'Georgien erhebt keine Grunderwerbsteuer — der Staat nimmt nur die feste Registrierungsgebühr des öffentlichen Registers (NAPR): ₾50 standardmäßig (4 Werktage) oder bis ₾350 am selben Tag. Ein Notar ist optional; planen Sie ≈₾500 für Notar/Übersetzung ein. Die Maklerprovision (≈2 %) zahlt üblicherweise der Verkäufer. Beim Weiterverkauf innerhalb von 24 Monaten kann der Gewinn mit 20 % Einkommensteuer belegt werden; nach zwei Jahren Eigentum ist er steuerfrei.' },
      { q: 'Welche Laufzeit ist am günstigsten?', a: 'Eine kurze Laufzeit (10–15 Jahre) halbiert die Gesamtzinsen, erhöht aber die Monatsrate. Eine lange Laufzeit (20–25 Jahre) senkt die monatliche Belastung, erhöht aber die Endkosten. Der Sweet Spot für eine georgische Wohnung liegt bei 15–20 Jahren.' },
    ],
    ctaTitle: 'Sie suchen eine Wohnung?',
    ctaSub: 'Verifizierte Inserate mit KI-Preisschätzung — Tiflis, Batumi, Kutaissi.',
    ctaButton: 'Verifizierte Wohnungen',
    crumbHome: 'Startseite', crumbCalc: 'Hypothekenrechner', lang: 'de',
    sibling: 'Mieten oder kaufen? Vergleichen Sie mit Zahlen →',
  },
}

function hubLdFor(loc: DirLoc | 'de') {
  const c = COPY[loc]
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: c.title,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: c.subtitle,
        url: 'https://sivrce.ge/mortgage-calculator',
      },
      {
        '@type': 'FAQPage',
        inLanguage: c.lang,
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
        mainEntity: c.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.crumbHome, item: 'https://sivrce.ge' },
          { '@type': 'ListItem', position: 2, name: c.crumbCalc, item: 'https://sivrce.ge/mortgage-calculator' },
        ],
      },
    ],
  }
}

export default async function MortgageCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const loc: DirLoc | 'de' = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  const c = COPY[loc]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={c.kicker} title={c.title} subtitle={c.subtitle} />
        <AdSlot slot="mortgage" lang={lang} />
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

        <MortgageCalcClient loc={loc} />

        <div className="mt-4 flex items-center justify-center gap-2 text-[14px] font-bold text-sv-ink/60">
          <Scale className="h-4 w-4 text-sv-blue" aria-hidden />
          <LocalizedLink href="/rent-vs-buy" className="underline-offset-4 hover:text-sv-blue hover:underline">
            {c.sibling}
          </LocalizedLink>
        </div>

        {/* Published bank terms — cells from src/data/mortgage-ge.ts, official sources only */}
        <section className="mt-14" aria-label={c.bankSection}>
          <h2 className="mb-5 flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <Building2 className="h-5 w-5 text-sv-blue" aria-hidden /> {c.bankSection}
          </h2>
          <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sv-ink/[0.02] text-[12px] font-black uppercase tracking-wide text-sv-ink/70">
                <tr>
                  <th className="px-5 py-4">{c.thBank}</th>
                  <th className="px-5 py-4">{c.thGEL}</th>
                  <th className="px-5 py-4">{c.thFX}</th>
                  <th className="hidden px-5 py-4 md:table-cell">{c.thTerm}</th>
                  <th className="hidden px-5 py-4 md:table-cell">{c.thDown}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/[0.05]">
                {MORTGAGE_GE_BANKS.map((b) => (
                  <tr key={b.slug} className="text-sv-ink/80">
                    <td className="px-5 py-4">
                      <div className="font-black text-sv-ink">{b.name}</div>
                      <div className="text-[12px] font-bold text-sv-ink/60">{loc === 'ka' ? b.nameKa : b.name}</div>
                    </td>
                    <td className="px-5 py-4 font-black text-sv-blue">{rateBand(b.gel)}</td>
                    <td className="px-5 py-4 font-black text-sv-blue">{rateBand(b.fx)}</td>
                    <td className="hidden px-5 py-4 font-bold md:table-cell">{termYrs(b.termMonths)}</td>
                    <td className="hidden px-5 py-4 font-bold md:table-cell">{downCell(b.minDownPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
            {c.ratesNote}
          </p>
        </section>

        {/* State subsidy — the program Georgian families actually apply through */}
        <section className="mt-10 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10" aria-label={c.subsidyTitle}>
          <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <Baby className="h-5 w-5 text-sv-blue" aria-hidden /> {c.subsidyTitle}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {c.subsidyChips.map((chip) => (
              <div key={chip.n} className="rounded-module border border-sv-ink/[0.05] bg-sv-cloud p-4">
                <div className="text-[20px] font-black tracking-[-0.02em] text-sv-blue">{chip.n}</div>
                <div className="mt-1 text-[12px] font-bold leading-snug text-sv-ink/60">{chip.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-semibold text-sv-ink/60">{c.subsidyNote}</p>
        </section>

        {/* Guide */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <TrendingUp className="h-5 w-5 text-sv-blue" aria-hidden /> {c.guideTitle}
          </h2>
          <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
            {c.guide.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label={c.faqTitle}>
          <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {c.faqTitle}
          </h2>
          <div className="grid gap-3">
            {c.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
          <h2 className="text-[22px] font-black text-white md:text-[26px]">{c.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
            {c.ctaSub}
          </p>
          <LocalizedLink
            href="/sale/apartments"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            {c.ctaButton}
          </LocalizedLink>
        </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(hubLdFor(loc)) }} />
    </div>
  )
}
