/**
 * Germany-national developer seed (sivrce.com/de beyond Berlin).
 * Listed landlords + municipal housing groups with OFFICIAL websites only.
 * Portfolio figures are rounded disclosures from annual reports / "über uns"
 * pages (2024–2025); every row stays verified:false until editorial review
 * confirms the current number. phone:"" = unpublished (UI hides it) —
 * never a placeholder number. No projects here: street-verified addresses
 * only, and those live in projects-new-berlin.ts until confirmed per city.
 * ponytail: developers only — projects/buildings arrive via the DE adapter
 * ingest (scripts/ingest-de-intel.ts) + OSM/ALKIS pipelines, not hand rows.
 */
import type { Developer } from './professionals'

export const NEW_DEVELOPERS_GERMANY: Developer[] = [
  {
    slug: 'vonovia',
    name: { ka: 'Vonovia', en: 'Vonovia', ru: 'Vonovia' },
    city: 'ბოხუმი',
    yearsActive: 11,
    projectsDone: 200,
    unitsDelivered: 540000,
    description: {
      ka: 'Vonovia SE — ევროპის უდიდესი საცხოვრებელი landlord (~540 000 ბინა, DAX). შტაბი ბოხუმში; BUWOG-ის მფლობელი. აქცენტი არსებულ ფონდზე, ნაკლებად ახალმშენებლობაზე.',
      en: 'Vonovia SE is Europe’s largest residential landlord (~540,000 units, DAX), headquartered in Bochum and owner of BUWOG. Focused on existing stock, less on new-build.',
      ru: 'Vonovia SE — крупнейший жилой арендодатель Европы (~540 000 квартир, DAX), штаб в Бохуме, владелец BUWOG. Фокус на существующем фонде.',
    },
    verified: false,
    phone: '',
    website: 'https://www.vonovia.de',
  },
  {
    slug: 'deutsche-wohnen',
    name: { ka: 'Deutsche Wohnen', en: 'Deutsche Wohnen', ru: 'Deutsche Wohnen' },
    city: 'ბერლინი',
    yearsActive: 27,
    projectsDone: 120,
    unitsDelivered: 140000,
    description: {
      ka: 'Deutsche Wohnen SE — ბერლინზე ორიენტირებული საცხოვრებელი ჯგუფი (~140 000 ბინა, Vonovia-ს შემადგენლობაში). Bestand + Neubau შერჩეულ ლოკაციებზე.',
      en: 'Deutsche Wohnen SE is a Berlin-focused residential group (~140,000 units, part of Vonovia). Existing stock plus selective new-build.',
      ru: 'Deutsche Wohnen SE — берлинская жилая группа (~140 000 квартир, в составе Vonovia). Существующий фонд плюс точечный Neubau.',
    },
    verified: false,
    phone: '',
    website: 'https://www.deutsche-wohnen.com',
  },
  {
    slug: 'leg-immobilien',
    name: { ka: 'LEG Immobilien', en: 'LEG Immobilien', ru: 'LEG Immobilien' },
    city: 'დიუსელდორფი',
    yearsActive: 55,
    projectsDone: 150,
    unitsDelivered: 168000,
    description: {
      ka: 'LEG Immobilien SE — ლისტინგული landlord NRW-ში (~168 000 ბინა, შტაბი დიუსელდორფში). ხელმისაწვდომი ქირის სეგმენტი, Ruhr + Rheinland ფოკუსით.',
      en: 'LEG Immobilien SE is a listed NRW landlord (~168,000 units, HQ Düsseldorf). Affordable rentals with a Ruhr + Rheinland focus.',
      ru: 'LEG Immobilien SE — публичный арендодатель NRW (~168 000 квартир, штаб в Дюссельдорфе). Доступная аренда, фокус Рур + Рейнланд.',
    },
    verified: false,
    phone: '',
    website: 'https://www.leg-wohnen.de',
  },
  {
    slug: 'vivawest',
    name: { ka: 'Vivawest', en: 'Vivawest', ru: 'Vivawest' },
    city: 'გელზენკირხენი',
    yearsActive: 17,
    projectsDone: 100,
    unitsDelivered: 120000,
    description: {
      ka: 'Vivawest GmbH — NRW-ის მსხვილი საცხოვრებელი ჯგუფი (~120 000 ბინა, შტაბი გელზენკირხენში). Bestand, Neubau და Stadtentwicklung Ruhr-ში.',
      en: 'Vivawest GmbH is a large NRW housing group (~120,000 units, HQ Gelsenkirchen). Stock, new-build and urban development in the Ruhr.',
      ru: 'Vivawest GmbH — крупная жилищная группа NRW (~120 000 квартир, штаб в Гельзенкирхене). Фонд, Neubau и развитие городов Рура.',
    },
    verified: false,
    phone: '',
    website: 'https://www.vivawest.de',
  },
  {
    slug: 'saga-hamburg',
    name: { ka: 'SAGA', en: 'SAGA', ru: 'SAGA' },
    city: 'ჰამბურგი',
    yearsActive: 100,
    projectsDone: 120,
    unitsDelivered: 137000,
    description: {
      ka: 'SAGA Unternehmensgruppe — ჰამბურგის მუნიციპალური landlord (~137 000 ბინა). ქალაქის ხელმისაწვდომი ქირის ბირთვი + Neubau ყველა Bezirk-ში.',
      en: 'SAGA Unternehmensgruppe is Hamburg’s municipal landlord (~137,000 units). The city’s affordable-rental core plus new-build in every district.',
      ru: 'SAGA Unternehmensgruppe — муниципальный арендодатель Гамбурга (~137 000 квартир). Ядро доступной аренды плюс Neubau во всех районах.',
    },
    verified: false,
    phone: '',
    website: 'https://www.saga.hamburg',
  },
  {
    slug: 'muenchner-wohnen',
    name: { ka: 'Münchner Wohnen', en: 'Münchner Wohnen', ru: 'Münchner Wohnen' },
    city: 'მიუნხენი',
    yearsActive: 2,
    projectsDone: 20,
    unitsDelivered: 70000,
    description: {
      ka: 'Münchner Wohnen — მიუნხენის მუნიციპალური landlord (~70 000 ბინა; GEWOFAG + GWG გაერთიანდა 2024-ში). ხელმისაწვდომი Neubau ქალაქის პროგრამებით.',
      en: 'Münchner Wohnen is Munich’s municipal landlord (~70,000 units; GEWOFAG + GWG merged in 2024). Affordable new-build under city programmes.',
      ru: 'Münchner Wohnen — муниципальный арендодатель Мюнхена (~70 000 квартир; GEWOFAG + GWG объединились в 2024). Доступный Neubau по городским программам.',
    },
    verified: false,
    phone: '',
    website: 'https://www.muenchner-wohnen.de',
  },
  {
    slug: 'abg-frankfurt',
    name: { ka: 'ABG Frankfurt', en: 'ABG Frankfurt', ru: 'ABG Frankfurt' },
    city: 'ფრანკფურტი',
    yearsActive: 35,
    projectsDone: 80,
    unitsDelivered: 50000,
    description: {
      ka: 'ABG Frankfurt Holding — ფრანკფურტის მუნიციპალური ჯგუფი (~50 000 ბინა). Bestand + Neubau Rhein-Main-ში, ენერგოეფექტურობის ფოკუსით.',
      en: 'ABG Frankfurt Holding is Frankfurt’s municipal group (~50,000 units). Stock plus new-build across Rhine-Main with an efficiency focus.',
      ru: 'ABG Frankfurt Holding — муниципальная группа Франкфурта (~50 000 квартир). Фонд плюс Neubau в Рейн-Майне, фокус на энергоэффективность.',
    },
    verified: false,
    phone: '',
    website: 'https://www.abg-fh.com',
  },
  {
    slug: 'gag-koeln',
    name: { ka: 'GAG Köln', en: 'GAG Köln', ru: 'GAG Köln' },
    city: 'ქელნი',
    yearsActive: 110,
    projectsDone: 100,
    unitsDelivered: 45000,
    description: {
      ka: 'GAG Immobilien AG — ქელნის მუნიციპალური landlord (~45 000 ბინა, 1913-დან). ქალაქის უდიდესი landlordი, Neubau ყველა Stadtbezirk-ში.',
      en: 'GAG Immobilien AG is Cologne’s municipal landlord (~45,000 units, since 1913). The city’s largest landlord with new-build in every district.',
      ru: 'GAG Immobilien AG — муниципальный арендодатель Кёльна (~45 000 квартир, с 1913). Крупнейший арендодатель города, Neubau во всех районах.',
    },
    verified: false,
    phone: '',
    website: 'https://www.gag-koeln.de',
  },
  {
    slug: 'gewoba-bremen',
    name: { ka: 'Gewoba', en: 'Gewoba', ru: 'Gewoba' },
    city: 'ბრემენი',
    yearsActive: 100,
    projectsDone: 60,
    unitsDelivered: 42000,
    description: {
      ka: 'Gewoba — ბრემენის წამყვანი საცხოვრებელი ჯგუფი (~42 000 ბინა). Bestand + Neubau Weser-ის ორივე ნაპირზე.',
      en: 'Gewoba is Bremen’s leading housing group (~42,000 units). Stock plus new-build on both banks of the Weser.',
      ru: 'Gewoba — ведущая жилищная группа Бремена (~42 000 квартир). Фонд плюс Neubau на обоих берегах Везера.',
    },
    verified: false,
    phone: '',
    website: 'https://www.gewoba.de',
  },
  {
    slug: 'nhw-wiesbaden',
    name: { ka: 'Nassauische Heimstätte', en: 'Nassauische Heimstätte', ru: 'Nassauische Heimstätte' },
    city: 'ფრანკფურტი',
    yearsActive: 100,
    projectsDone: 90,
    unitsDelivered: 60000,
    description: {
      ka: 'Nassauische Heimstätte | Wohnstadt (NHW) — ჰესენის მუნიციპალური ჯგუფი (~60 000 ბინა, შტაბი ვისბადენში). Rhein-Main + Kassel, ხელმისაწვდომი Neubau.',
      en: 'Nassauische Heimstätte | Wohnstadt (NHW) is Hesse’s municipal group (~60,000 units, HQ Wiesbaden). Rhine-Main + Kassel, affordable new-build.',
      ru: 'Nassauische Heimstätte | Wohnstadt (NHW) — муниципальная группа Гессена (~60 000 квартир, штаб в Висбадене). Рейн-Майн + Кассель, доступный Neubau.',
    },
    verified: false,
    phone: '',
    website: 'https://www.naheimst.de',
  },
]
