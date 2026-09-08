import type { Metadata } from 'next'
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ContactForm from '@/components/contact/ContactForm'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { getConfig } from '@/lib/config'
import { CONTACT_PHONE, telHref, waHref } from '@/lib/inquiries/phone'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { dirLoc, type DirLoc } from '@/lib/directory-seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/contact', lang, {
    ka: {
      title: 'კონტაქტი',
      description:
        'დაუკავშირდი sivrce-ის გუნდს — ელ. ფოსტა, ტელეფონი ან საკონტაქტო ფორმა. ვპასუხობთ 24 საათში.',
    },
    en: {
      title: 'Contact sivrce',
      description:
        'Reach the sivrce team — email, phone or the contact form. We reply within 24 hours.',
    },
    ru: {
      title: 'Контакты sivrce',
      description:
        'Напишите команде sivrce — эл. почта, телефон или форма. Отвечаем в течение 24 часов.',
    },
  })
}

const T: Record<DirLoc, {
  kicker: string; title: string; subtitle: string
  email: string; phone: string; address: string; addressValue: string
  ldName: string
}> = {
  ka: {
    kicker: 'კონტაქტი', title: 'დაგვიკავშირდი',
    subtitle: 'კითხვა, შეთავაზება თუ პარტნიორობა — ჩვენი გუნდი გიპასუხებთ 24 საათის განმავლობაში.',
    email: 'ელ. ფოსტა', phone: 'ტელეფონი', address: 'მისამართი', addressValue: 'თბილისი, საქართველო',
    ldName: 'კონტაქტი — sivrce',
  },
  en: {
    kicker: 'Contact', title: 'Get in touch',
    subtitle: 'A question, an offer or a partnership — our team replies within 24 hours.',
    email: 'Email', phone: 'Phone', address: 'Address', addressValue: 'Tbilisi, Georgia',
    ldName: 'Contact — sivrce',
  },
  ru: {
    kicker: 'Контакты', title: 'Свяжитесь с нами',
    subtitle: 'Вопрос, предложение или партнёрство — наша команда ответит в течение 24 часов.',
    email: 'Эл. почта', phone: 'Телефон', address: 'Адрес', addressValue: 'Тбилиси, Грузия',
    ldName: 'Контакты — sivrce',
  },
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const loc = dirLoc(isValidLang(raw) ? raw : 'ka')
  const t = T[loc]
  const [email, configuredPhone] = await Promise.all([
    getConfig('site.contactEmail'),
    getConfig('site.contactPhone'),
  ])

  // Switchboard by default — admin config can still override the dummy registry number.
  const phone =
    !configuredPhone || configuredPhone === '+995 32 2 00 00 00' ? CONTACT_PHONE : configuredPhone
  const channels = [
    { icon: Mail, label: t.email, value: email, href: `mailto:${email}` },
    { icon: Phone, label: t.phone, value: phone, href: telHref(phone) },
    { icon: MessageCircle, label: 'WhatsApp', value: phone, href: waHref(CONTACT_PHONE) },
    { icon: MapPin, label: t.address, value: t.addressValue, href: null },
  ]

  const contactLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t.ldName,
    url: 'https://sivrce.ge/contact',
    inLanguage: loc,
    isPartOf: { '@id': 'https://sivrce.ge/#website' },
    about: {
      '@type': 'Organization',
      name: 'sivrce',
      url: 'https://sivrce.ge',
      email,
      telephone: phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'თბილისი',
        addressCountry: 'GE',
      },
    },
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(contactLd) }} />
      <Navbar />
      <main id="main">
        <PageHero
          kicker={t.kicker}
          title={t.title}
          subtitle={t.subtitle}
        />
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {channels.map((c, i) => {
              const inner = (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
                    <c.icon className="h-6 w-6 text-sv-blue" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-sv-ink/60">{c.label}</div>
                  <div className="mt-1 text-[17px] font-black tracking-[-0.02em] text-sv-ink">{c.value}</div>
                </>
              )
              return (
                <Reveal key={c.label} delay={i * 0.07}>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="block h-full rounded-card bg-sv-surface p-7 shadow-card ring-1 ring-sv-ink/5 transition hover:-translate-y-1 hover:shadow-card-hover"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="h-full rounded-card bg-sv-surface p-7 shadow-card ring-1 ring-sv-ink/5">{inner}</div>
                  )}
                </Reveal>
              )
            })}
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <Reveal delay={0.1}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
