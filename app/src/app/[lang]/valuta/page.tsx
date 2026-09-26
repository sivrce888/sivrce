import type { Metadata } from 'next'
import { ArrowRightLeft, ChevronRight, ListChecks, RefreshCw } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { jsonLd } from '@/lib/utils'
import { isValidLang } from '@/lib/i18n/core'
import { pageMeta } from '@/lib/i18n/server'
import {
  FX_CURRENCIES, fxConvert, fxFormat, fxName, fxRate, fxUpdated, fxWhole, getFx, pairSlug,
  type FxCurrency, type FxTable,
} from '@/lib/fx'

export const revalidate = 3600

type Loc = 'ka' | 'en' | 'ru' | 'de' | 'tr'

const COPY: Record<Loc, {
  kicker: string; title: string; subtitle: string
  convTitle: string; from: string; to: string; amount: string; button: string; same: string
  tableTitle: string; colUnit: string
  pairsTitle: string; pairsSub: string
  guideTitle: string; guide: string[]
  faqTitle: string; faqsNote: string
  ctaTitle: string; ctaSub: string; ctaButton: string
  crumb: string
}> = {
  ka: {
    kicker: 'საშუალო ბაზრის კურსი — განახლდება საათში',
    title: 'ვალუტის კურსი დღეს — დოლარი, ევრო, ლარი',
    subtitle: 'დოლარის, ევროს და სხვა ვალუტების მიმდინარე კურსი ლართან. გადაიყვანეთ ნებისმიერი თანხა და ნახეთ, რა ფასდება დღეს ლარში დოლარში ან ევროში გამოხატული ბინის ფასი.',
    convTitle: 'ვალუტის გადამყვანი',
    from: 'საიდან', to: 'სად', amount: 'თანხა', button: 'გადაყვანა', same: 'ერთი და იმავე ვალუტაა — აირჩიეთ განსხვავებული მიმართულება.',
    tableTitle: 'ვალუტების კურსი ცხრილში',
    colUnit: 'კურსი',
    pairsTitle: 'პოპულარული მიმართულებები',
    pairsSub: 'დეტალური კურსი, ცხრილები და კალკულატორი თითოეული წყვილისთვის',
    guideTitle: 'როგორ წავიკითხოთ ვალუტის კურსი',
    guide: [
      'ქვემოთ მოცემულია საშუალო ბაზრის (mid-market) კურსი — ის მნიშვნელობა, რომლითაც მსოფლიო ბანკები ვალუტას ერთმანეთში ცვლიან საკუთარ შორის და რომელზეც Google-ისა და NBG-ის გამოქვეყნებული კურსები იმყარებენ. კომერციული ბანკი და გადამცვლელი წერტილი ამ კურსს 0.5–2% მარჟას დაადებს, ამიტომ რეალური ყიდვა/გაყიდვის კურსი ოდნავ განსხვავდება.',
      'უძრავ ქონებაზე საუბრისას კურსი გადამწყვეტია: თბილისისა და ბათუმის ბევრი ბინა დოლარში ფასდება, ევროპული პროექტები — ევროში, ხოლო იპოთეკა და სარეგისტრაციო ხარჯები ლარში იხდება. sivrce-ზე ყველა განცხადება ორ ვალუტაში ჩანს ერთდროულად — ზუსტი, მოძველებული კურსით გამოთვლის გარეშე.',
      'კურსი საათში ერთხელ განახლდება მსოფლიო ბაზრიდან. ოფიციალური ლარის კურსი ეროვნული ბანკი ყოველდღიურად აქვეყნებს — nbg.gov.ge; ეს გვერდი კი იმ წუთისორის ბაზარს აჩვენებს, რომელშიც რეალურად ხდება გარიგება.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqsNote: 'კურსები საინფორმაციოა და არ არის გარიგების ოფერი — საბანკო ოპერაციამდე ზუსტი კურსი ბანკთან დააზუსტეთ.',
    ctaTitle: 'ბინას დოლარში ეძებთ?',
    ctaSub: 'ვერიფიცირებული განცხადებები ორი ვალუტით და AI ფასის შეფასებით — თბილისი, ბათუმი, ქუთაისი.',
    ctaButton: 'ვერიფიცირებული ბინები',
    crumb: 'ვალუტის კურსი',
  },
  en: {
    kicker: 'Mid-market rates — refreshed hourly',
    title: 'Exchange Rates Today — USD, EUR to GEL',
    subtitle: 'Live dollar, euro and 11 more currencies against the Georgian lari. Convert any amount and see what today\'s dollar- or euro-priced apartment really costs.',
    convTitle: 'Currency converter',
    from: 'From', to: 'To', amount: 'Amount', button: 'Convert', same: 'Same currency on both sides — pick two different ones.',
    tableTitle: 'Rate table',
    colUnit: 'Rate',
    pairsTitle: 'Popular pairs',
    pairsSub: 'Dedicated rate page, tables and calculator for every pair',
    guideTitle: 'How to read an exchange rate',
    guide: [
      'The rates below are mid-market rates — the midpoint between what banks buy and sell at, the number behind Google\'s and the NBG\'s published rates. Commercial banks and exchange booths add a 0.5–2% margin on top, so the rate you actually transact at differs slightly.',
      'In real estate the rate is decisive: many Tbilisi and Batumi listings are priced in dollars, European developments in euros, while mortgages and registration fees are settled in lari. Every sivrce listing shows both currencies at once — no stale conversion math.',
      'Rates refresh hourly from the global market. The National Bank of Georgia publishes the official daily lari rate at nbg.gov.ge; this page shows the live market you actually transact in.',
    ],
    faqTitle: 'Frequently asked questions',
    faqsNote: 'Rates are informational and not an offer to transact — confirm the exact rate with your bank before exchanging.',
    ctaTitle: 'Looking for a dollar-priced apartment?',
    ctaSub: 'Verified listings in two currencies with AI price estimates — Tbilisi, Batumi, Kutaisi.',
    ctaButton: 'Verified apartments',
    crumb: 'Exchange rates',
  },
  ru: {
    kicker: 'Среднерыночный курс — обновляется ежечасно',
    title: 'Курс валют сегодня — доллар и евро к лари',
    subtitle: 'Актуальный курс доллара, евро и ещё 11 валют к грузинскому лари. Переводите любую сумму и смотрите, сколько сегодня стоит квартира в долларах или евро.',
    convTitle: 'Конвертер валют',
    from: 'Из', to: 'В', amount: 'Сумма', button: 'Конвертировать', same: 'Валюта одинаковая с обеих сторон — выберите разные.',
    tableTitle: 'Таблица курсов',
    colUnit: 'Курс',
    pairsTitle: 'Популярные направления',
    pairsSub: 'Отдельная страница курса, таблицы и калькулятор для каждой пары',
    guideTitle: 'Как читать валютный курс',
    guide: [
      'Ниже — среднерыночный курс (mid-market): середина между покупкой и продажей банков, та самая цифра, на которой стоят курсы Google и НБГ. Коммерческие банки и обменники добавляют к нему маржу 0,5–2%, поэтому реальный курс сделки немного отличается.',
      'В недвижимости курс решает всё: многие квартиры в Тбилиси и Батуми оцениваются в долларах, европейские проекты — в евро, а ипотека и регистрационные сборы платятся в лари. Каждое объявление на sivrce показывает обе валюты сразу — без устаревших пересчётов.',
      'Курсы обновляются ежечасно с мирового рынка. Официальный курс лари Нацбанк Грузии публикует ежедневно на nbg.gov.ge; эта страница показывает живой рынок, в котором проходят реальные сделки.',
    ],
    faqTitle: 'Частые вопросы',
    faqsNote: 'Курсы носят информационный характер и не являются офертой — точный курс уточняйте в банке до операции.',
    ctaTitle: 'Ищете квартиру в долларах?',
    ctaSub: 'Верифицированные объявления в двух валютах с ИИ-оценкой цены — Тбилиси, Батуми, Кутаиси.',
    ctaButton: 'Верифицированные квартиры',
    crumb: 'Курс валют',
  },
  de: {
    kicker: 'Mittelkurs — stündlich aktualisiert',
    title: 'Wechselkurse heute — USD, EUR in GEL',
    subtitle: 'Aktuelle Dollar-, Euro- und 11 weitere Währungen gegenüber dem Georgischen Lari. Rechnen Sie jeden Betrag um und sehen Sie, was eine in Dollar oder Euro preisgegebene Wohnung heute kostet.',
    convTitle: 'Währungsrechner',
    from: 'Von', to: 'Nach', amount: 'Betrag', button: 'Umrechnen', same: 'Beide Seiten dieselbe Währung — bitte zwei verschiedene wählen.',
    tableTitle: 'Kurstabelle',
    colUnit: 'Kurs',
    pairsTitle: 'Beliebte Paare',
    pairsSub: 'Eigene Kursseite, Tabellen und Rechner für jedes Paar',
    guideTitle: 'Wie man einen Wechselkurs liest',
    guide: [
      'Die Kurse unten sind Mittelkurse — die Mitte zwischen Bank-Ankauf und -Verkauf, die Zahl hinter den veröffentlichten Kursen von Google und der NBG. Kommerzielle Banken und Wechselstuben schlagen 0,5–2 % Marge darauf, daher weicht der konkrete Transaktionskurs leicht ab.',
      'In der Immobilienwelt entscheidet der Kurs: Viele Wohnungen in Tiflis und Batumi werden in Dollar angeboten, europäische Projekte in Euro, während Hypothek und Registrierungsgebühren in Lari gezahlt werden. Jedes sivrce-Inserat zeigt beide Währungen gleichzeitig — ohne veraltete Umrechnerei.',
      'Die Kurse aktualisieren sich stündlich vom Weltmarkt. Den offiziellen Lari-Kurs veröffentlicht die Nationalbank Georgiens täglich auf nbg.gov.ge; diese Seite zeigt den lebendigen Markt, in dem real gehandelt wird.',
    ],
    faqTitle: 'Häufig gestellte Fragen',
    faqsNote: 'Kurse sind informativ und kein Angebot — den konkreten Kurs erfragen Sie bitte bei Ihrer Bank.',
    ctaTitle: 'Wohnung in Dollar gesucht?',
    ctaSub: 'Verifizierte Inserate in zwei Währungen mit KI-Preisschätzung — Tiflis, Batumi, Kutaissi.',
    ctaButton: 'Verifizierte Wohnungen',
    crumb: 'Wechselkurse',
  },
  tr: {
    kicker: 'Orta piyasa kuru — saatlik güncellenir',
    title: 'Döviz Kurları Bugün — USD, EUR / GEL',
    subtitle: 'Gürcü Lari\'si karşısında canlı dolar, euro ve 11 para birimi daha. Her tutarı çevirin ve dolar ya da euro cinsinden fiyatlanan dairenin bugün kaç ettiğini görün.',
    convTitle: 'Döviz çevirici',
    from: 'Kaynak', to: 'Hedef', amount: 'Tutar', button: 'Çevir', same: 'Her iki taraf aynı para birimi — farklı iki tane seçin.',
    tableTitle: 'Kur tablosu',
    colUnit: 'Kur',
    pairsTitle: 'Popüler çiftler',
    pairsSub: 'Her çift için ayrı kur sayfası, tablolar ve hesaplayıcı',
    guideTitle: 'Döviz kuru nasıl okunur',
    guide: [
      'Aşağıdaki kurlar orta piyasa (mid-market) kurlarıdır — bankaların alış ve satışının ortası, Google\'un ve NBG\'nin yayımladığı kurların dayandığı sayı. Ticari bankalar ve döviz büroları bunun üzerine %0,5–2 marj ekler, bu yüzden işlem gördüğünüz gerçek biraz farklıdır.',
      'Gayrimenkulde kur belirleyicidir: Tiflis ve Batumi\'deki birçok daire dolarla, Avrupa projeleri euroyla fiyatlanır; mortgage ve tapu harçları ise Lari ile ödenir. sivrce\'deki her ilan iki para birimini aynı anda gösterir — bayat kur hesabı yok.',
      'Kurlar dünya piyasasından saat başı güncellenir. Resmî Lari kurını Gürcistan Merkez Bankası her gün nbg.gov.ge adresinde yayımlar; bu sayfa ise işlemlerin gerçekten döndüğü canlı piyasayı gösterir.',
    ],
    faqTitle: 'Sık sorulan sorular',
    faqsNote: 'Kurlar bilgilendirme amaçlıdır ve işlem teklifi değildir — işlem öncesi kesin kuru bankanızdan teyit edin.',
    ctaTitle: 'Dolar cinsinden daire mi arıyorsunuz?',
    ctaSub: 'İki para birimli, AI fiyat tahminli doğrulanmış ilanlar — Tiflis, Batumi, Kutaisi.',
    ctaButton: 'Doğrulanmış daireler',
    crumb: 'Döviz kurları',
  },
}

const locOf = (lang: string): Loc => (COPY[lang as Loc] ? (lang as Loc) : 'en')

/** Live-number FAQ — AI answer engines quote these verbatim. */
function faqsFor(fx: FxTable, loc: Loc): { q: string; a: string }[] {
  const r = fx.rates
  if (loc === 'ka') return [
    { q: 'რა არის დოლარის კურსი დღეს?', a: `დღეს 1 აშშ დოლარი = ${fxRate(r.USD / r.GEL, 'ka')} ლარი (საშუალო ბაზრის კურსი, ${fxUpdated(fx.updatedISO, 'ka')}). ბანკების რეალური ყიდვა/გაყიდვის კურსი ამას 0.5–2%-იანი მარჟით განსხვავდება.` },
    { q: 'რამდენია ევრო ლარში დღეს?', a: `დღეს 1 ევრო = ${fxRate(r.EUR / r.GEL, 'ka')} ლარი. ევროს კურსი დოლართან ერთად მოძრაობს, ამიტომ ევროში ფასიანი ბინის ლარობითი ღირებულება ყოველდღიურად იცვლება.` },
    { q: 'ეს ოფიციალური კურსია თუ საბაზრო?', a: 'ეს საშუალო ბაზრის (mid-market) კურსია — გლობალური ბაზრის რეალური შუა მნიშვნელობა, რომელსაც საერთაშორისო ბანკები იყენებენ. ოფიციალურ ყოველდღიურ კურსს ეროვნული ბანკი აქვეყნებს nbg.gov.ge-ზე; კომერციული ბანკები კი საკუთარ მარჟას ამატებენ.' },
    { q: 'როგორ გადავიყვანო ბინის დოლარის ფასი ლარში?', a: `ამ გვერდის გადამყვანი ზუსტად ამისთვისაა: შეიყვანეთ თანხა და აირჩიეთ მიმართულება. მაგალითად, $100,000 დღეს ${fxFormat(fxConvert(100000, 'USD', 'GEL', r), 'GEL', 'ka')}-ია. sivrce-ის ყველა განცხადება ორივე ვალუტას ავტომატურად აჩვენებს.` },
    { q: 'როდის იცვლება კურსი?', a: 'საერთაშორისო ვალუტის ბაზარი 24/5 მუშაობს და კურსი წამში-წამში იცვლება. ეს გვერდი საათში ერთხელ განახლდება — ყოველდღიური გამოყენებისთვის საკმარისი სიზუსტეა.' },
  ]
  if (loc === 'ru') return [
    { q: 'Какой курс доллара к лари сегодня?', a: `Сегодня 1 доллар США = ${fxRate(r.USD / r.GEL, 'ru')} лари (среднерыночный курс, ${fxUpdated(fx.updatedISO, 'ru')}). Реальный курс покупки/продажи в банках отличается на маржу 0,5–2%.` },
    { q: 'Сколько стоит евро в лари сегодня?', a: `Сегодня 1 евро = ${fxRate(r.EUR / r.GEL, 'ru')} лари. Курс евро движется вместе с долларом, поэтому лариевая стоимость квартиры в евро меняется ежедневно.` },
    { q: 'Это официальный курс или рыночный?', a: 'Это среднерыночный курс (mid-market) — реальная середина глобального рынка, которую используют международные банки. Официальный ежедневный курс публикует Нацбанк Грузии на nbg.gov.ge; коммерческие банки добавляют свою маржу.' },
    { q: 'Как перевести цену квартиры из долларов в лари?', a: `Для этого и нужен конвертер на этой странице: введите сумму и направление. Например, $100,000 сегодня — это ${fxFormat(fxConvert(100000, 'USD', 'GEL', r), 'GEL', 'ru')}. Каждое объявление на sivrce показывает обе валюты автоматически.` },
    { q: 'Как часто меняется курс?', a: 'Международный валютный рынок работает 24/5, и курс меняется каждую секунду. Эта страница обновляется ежечасно — для повседневного использования точность достаточная.' },
  ]
  const t = loc === 'de'
  const tr = loc === 'tr'
  if (t) return [
    { q: 'Wie ist der Dollar-Kurs zum Lari heute?', a: `Heute kostet 1 US-Dollar ${fxRate(r.USD / r.GEL, 'de')} GEL (Mittelkurs, Stand ${fxUpdated(fx.updatedISO, 'de')}). Die konkreten An- und Verkaufskurse der Banken weichen um 0,5–2 % Marge ab.` },
    { q: 'Wie viel ist der Euro in Lari heute?', a: `Heute kostet 1 Euro ${fxRate(r.EUR / r.GEL, 'de')} GEL. Der Eurokurs bewegt sich mit dem Dollar — der Lari-Wert einer Euro-Wohnung ändert sich daher täglich.` },
    { q: 'Ist das der offizielle oder der Marktkurs?', a: 'Es ist der Mittelkurs (mid-market) — die echte Mitte des Weltmarkts, auf der auch die Kurse von Google und der NBG beruhen. Den offiziellen Tageskurs veröffentlicht die Nationalbank auf nbg.gov.ge; kommerzielle Banken schlagen ihre Marge darauf.' },
    { q: 'Wie rechne ich den Dollarpreis einer Wohnung in Lari um?', a: `Dafür ist der Rechner auf dieser Seite da: Betrag eingeben, Paar wählen. $100.000 sind heute z. B. ${fxFormat(fxConvert(100000, 'USD', 'GEL', r), 'GEL', 'de')}. Jedes sivrce-Inserat zeigt beide Währungen automatisch.` },
    { q: 'Wie oft ändert sich der Kurs?', a: 'Der Devisenmarkt handelt 24/5, der Kurs ändert sich sekündlich. Diese Seite aktualisiert sich stündlich — für die tägliche Nutzung völlig ausreichend.' },
  ]
  if (tr) return [
    { q: 'Bugün doların Lari kuru ne kadar?', a: `Bugün 1 Amerikan doları = ${fxRate(r.USD / r.GEL, 'tr')} GEL (orta piyasa kuru, ${fxUpdated(fx.updatedISO, 'tr')}). Bankaların gerçek alış/satış kurları %0,5–2 marjla farklıdır.` },
    { q: 'Euro bugün Lari\'de kaç?', a: `Bugün 1 euro = ${fxRate(r.EUR / r.GEL, 'tr')} GEL. Euro kuru dolarla birlikte hareket eder; euroyla fiyatlanan dairenin Lari değeri bu yüzden her gün değişir.` },
    { q: 'Bu resmî kur mu, piyasa kuru mu?', a: 'Bu orta piyasa (mid-market) kurudur — uluslararası bankaların kullandığı dünyanın gerçek ortası. Resmî günlük kurü Gürcistan Merkez Bankası nbg.gov.ge\'de yayımlar; ticari bankalar kendi marjını ekler.' },
    { q: 'Dairenin dolar fiyatını Lari\'ye nasıl çevirim?', a: 'Bu sayfadaki çevirici tam bunun için: tutarı girin, çifti seçin. Örneğin 100.000 $ bugün ' + fxFormat(fxConvert(100000, 'USD', 'GEL', r), 'GEL', 'tr') + ' eder. sivrce\'deki her ilan iki para birimini otomatik gösterir.' },
    { q: 'Kur ne sıklıkla değişir?', a: 'Döviz piyasası 24/5 çalışır ve kur saniye saniye değişir. Bu sayfa saat başı güncellenir — günlük kullanım için fazlasıyla yeterli.' },
  ]
  return [
    { q: 'What is the dollar to lari rate today?', a: `Today 1 US dollar = ${fxRate(r.USD / r.GEL, 'en')} GEL (mid-market rate, ${fxUpdated(fx.updatedISO, 'en')}). Actual bank buy/sell rates differ by a 0.5–2% margin.` },
    { q: 'How much is the euro in lari today?', a: `Today 1 euro = ${fxRate(r.EUR / r.GEL, 'en')} GEL. The euro moves with the dollar, so the lari value of a euro-priced apartment changes daily.` },
    { q: 'Is this the official rate or the market rate?', a: 'This is the mid-market rate — the real midpoint of the global market that international banks use and that Google\'s and the NBG\'s published rates are built on. The National Bank of Georgia publishes the official daily rate at nbg.gov.ge; commercial banks add their own margin.' },
    { q: 'How do I convert an apartment price from dollars to lari?', a: `That is exactly what the converter on this page is for: enter the amount and pick the pair. For example, $100,000 is ${fxFormat(fxConvert(100000, 'USD', 'GEL', r), 'GEL', 'en')} today. Every sivrce listing shows both currencies automatically.` },
    { q: 'How often does the rate change?', a: 'The currency market trades 24/5 and rates move by the second. This page refreshes hourly — more than accurate enough for everyday use.' },
  ]
}

const POPULAR: readonly (readonly [FxCurrency, FxCurrency])[] = [
  ['USD', 'GEL'], ['EUR', 'GEL'], ['GBP', 'GEL'], ['TRY', 'GEL'], ['RUB', 'GEL'],
  ['AED', 'GEL'], ['ILS', 'GEL'], ['KZT', 'GEL'], ['GEL', 'USD'], ['GEL', 'EUR'],
  ['USD', 'EUR'], ['EUR', 'USD'],
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const fx = await getFx()
  const usdGel = fxRate(fx.rates.USD / fx.rates.GEL, lang)
  const eurGel = fxRate(fx.rates.EUR / fx.rates.GEL, lang)
  const desc: Record<Loc, string> = {
    ka: `დოლარის კურსი დღეს — 1 USD = ${usdGel} ₾, ევროს კურსი — 1 EUR = ${eurGel} ₾. ვალუტის გადამყვანი და კურსების ცხრილი: დოლარი, ევრო, ფუნტი, ლირა, რუბლი, დირჰამი ლართან.`,
    en: `Dollar rate today: 1 USD = ${usdGel} GEL, euro rate: 1 EUR = ${eurGel} GEL. Live converter and rate table for 14 currencies against the Georgian lari.`,
    ru: `Курс доллара сегодня: 1 USD = ${usdGel} GEL, курс евро: 1 EUR = ${eurGel} GEL. Живой конвертер и таблица курсов 14 валют к грузинскому лари.`,
    de: `Dollarkurs heute: 1 USD = ${usdGel} GEL, Eurokurs: 1 EUR = ${eurGel} GEL. Live-Rechner und Kurstabelle für 14 Währungen gegenüber dem Georgischen Lari.`,
    tr: `Dolar kuru bugün: 1 USD = ${usdGel} GEL, euro kuru: 1 EUR = ${eurGel} GEL. Gürcü Lari karşısında 14 para birimi için canlı çevirici ve kur tablosu.`,
  }
  return pageMeta('/valuta', lang, {
    ka: { title: COPY.ka.title, description: desc.ka },
    en: { title: COPY.en.title, description: desc.en },
    ru: { title: COPY.ru.title, description: desc.ru },
    de: { title: COPY.de.title, description: desc.de },
    tr: { title: COPY.tr.title, description: desc.tr },
  })
}

export default async function ValutaPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const loc = locOf(lang)
  const c = COPY[loc]
  const fx = await getFx()

  // Converter state — whitelisted enums + clamped number, raw input never rendered.
  const sp = await searchParams
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined
  const from = FX_CURRENCIES.includes(one('from') as FxCurrency) ? (one('from') as FxCurrency) : 'USD'
  const to = FX_CURRENCIES.includes(one('to') as FxCurrency) ? (one('to') as FxCurrency) : 'GEL'
  const amountNum = Number(one('amount'))
  const amount = Number.isFinite(amountNum) && amountNum > 0
    ? Math.min(amountNum, 1_000_000_000_000)
    : 100
  const result = fxConvert(amount, from, to, fx.rates)
  const same = from === to

  const faqs = faqsFor(fx, loc)
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: c.convTitle,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: c.subtitle,
        url: 'https://sivrce.ge/valuta',
      },
      {
        '@type': 'FAQPage',
        inLanguage: lang,
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: 'https://sivrce.ge' },
          { '@type': 'ListItem', position: 2, name: c.crumb, item: 'https://sivrce.ge/valuta' },
        ],
      },
    ],
  }

  const inputCls = 'h-12 w-full rounded-module border border-sv-ink/10 bg-sv-surface px-4 text-[15px] font-bold text-sv-ink outline-none focus:border-sv-blue'
  const labelCls = 'mb-1.5 block text-[12px] font-black uppercase tracking-wide text-sv-ink/60'

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={c.kicker} title={c.title} subtitle={c.subtitle} />
        <AdSlot slot="valuta" lang={lang} />
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

          {/* Converter — plain GET form: works with JS disabled, on any device, zero bundle */}
          <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10" aria-label={c.convTitle}>
            <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              <ArrowRightLeft className="h-5 w-5 text-sv-blue" aria-hidden /> {c.convTitle}
            </h2>
            <form method="GET" className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end">
              <div>
                <label className={labelCls} htmlFor="fx-from">{c.from}</label>
                <select id="fx-from" name="from" defaultValue={from} className={inputCls}>
                  {FX_CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{fxName(cur, lang)} ({cur})</option>
                  ))}
                </select>
              </div>
              <div className="hidden h-12 items-center text-sv-ink/30 md:flex" aria-hidden>
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div>
                <label className={labelCls} htmlFor="fx-to">{c.to}</label>
                <select id="fx-to" name="to" defaultValue={to} className={inputCls}>
                  {FX_CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>{fxName(cur, lang)} ({cur})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="fx-amount">{c.amount}</label>
                <input id="fx-amount" name="amount" type="number" inputMode="decimal" min="0" max="1000000000000" step="any" defaultValue={amount} className={inputCls} />
              </div>
              <button type="submit" className="h-12 rounded-full bg-sv-blue px-7 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5 md:mb-0">
                {c.button}
              </button>
            </form>
            <p className="mt-5 rounded-module bg-sv-cloud px-5 py-4 text-[17px] font-extrabold text-sv-ink md:text-[19px]" role="status">
              {same
                ? <span className="text-[14px] font-bold text-sv-ink/60">{c.same}</span>
                : <>{fxWhole(amount, lang)} {from} = <span className="text-sv-blue">{fxFormat(result, to, lang)}</span></>}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-sv-ink/50">
              <RefreshCw className="h-3 w-3" aria-hidden /> {fxUpdated(fx.updatedISO, lang)}
            </p>
          </section>

          {/* Rate table — every hot currency against USD / EUR / GEL */}
          <section className="mt-14" aria-label={c.tableTitle}>
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{c.tableTitle}</h2>
            <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[14px]">
                  <thead className="bg-sv-ink/[0.02] text-[12px] font-black uppercase tracking-wide text-sv-ink/70">
                    <tr>
                      <th className="px-5 py-4">{loc === 'ka' ? 'ვალუტა' : loc === 'ru' ? 'Валюта' : loc === 'de' ? 'Währung' : loc === 'tr' ? 'Para birimi' : 'Currency'}</th>
                      <th className="px-5 py-4">1 USD →</th>
                      <th className="px-5 py-4">1 EUR →</th>
                      <th className="px-5 py-4">1 GEL →</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sv-ink/[0.05]">
                    {FX_CURRENCIES.map((cur) => (
                      <tr key={cur} className="text-sv-ink/80">
                        <td className="px-5 py-3.5">
                          <LocalizedLink href={`/valuta/${pairSlug(cur === 'GEL' ? 'GEL' : cur, cur === 'GEL' ? 'USD' : 'GEL')}`} className="group flex items-center justify-between gap-3">
                            <span>
                              <span className="font-black text-sv-ink group-hover:text-sv-blue">{fxName(cur, lang)}</span>
                              <span className="ml-2 text-[12px] font-bold text-sv-ink/50">{cur}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-sv-ink/20 group-hover:text-sv-blue" aria-hidden />
                          </LocalizedLink>
                        </td>
                        <td className="px-5 py-3.5 font-bold">{fxRate(fxConvert(1, 'USD', cur, fx.rates), lang)}</td>
                        <td className="px-5 py-3.5 font-bold">{fxRate(fxConvert(1, 'EUR', cur, fx.rates), lang)}</td>
                        <td className="px-5 py-3.5 font-bold">{fxRate(fxConvert(1, 'GEL', cur, fx.rates), lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
              {loc === 'ka'
                ? 'საშუალო ბაზრის კურსი — ოფიციალური ყოველდღიური კურსი ეროვნული ბანკი აქვეყნებს nbg.gov.ge-ზე.'
                : loc === 'ru'
                  ? 'Среднерыночный курс — официальный ежедневный курс Нацбанк Грузии публикует на nbg.gov.ge.'
                  : 'Mid-market rates — the official daily lari rate is published by the National Bank of Georgia at nbg.gov.ge.'}
            </p>
          </section>

          {/* Popular pairs — internal mesh to the pair pages */}
          <section className="mt-14" aria-label={c.pairsTitle}>
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{c.pairsTitle}</h2>
            <p className="mt-1 text-[14px] font-medium text-sv-ink/60">{c.pairsSub}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {POPULAR.map(([f, t]) => (
                <LocalizedLink
                  key={`${f}-${t}`}
                  href={`/valuta/${pairSlug(f, t)}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-sv-ink/[0.08] bg-sv-surface px-5 text-[14px] font-extrabold text-sv-ink shadow-card transition-transform hover:-translate-y-0.5 hover:border-sv-blue/40 hover:text-sv-blue"
                >
                  {f}<ArrowRightLeft className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />{t}
                  <span className="font-bold text-sv-ink/50">{fxRate(fxConvert(1, f, t, fx.rates), lang)}</span>
                </LocalizedLink>
              ))}
            </div>
          </section>

          {/* Guide */}
          <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              <ListChecks className="h-5 w-5 text-sv-blue" aria-hidden /> {c.guideTitle}
            </h2>
            <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
              {c.guide.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10" aria-label={c.faqTitle}>
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{c.faqTitle}</h2>
            <div className="grid gap-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sv-ink/50">{c.faqsNote}</p>
          </section>

          <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
            <h2 className="text-[22px] font-black text-white md:text-[26px]">{c.ctaTitle}</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">{c.ctaSub}</p>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
