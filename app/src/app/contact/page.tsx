import type { Metadata } from 'next'
import { Mail, Phone, MapPin } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ContactForm from '@/components/contact/ContactForm'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'კონტაქტი — sivrce',
  description: 'დაუკავშირდი sivrce-ის გუნდს — ელ. ფოსტა, ტელეფონი ან საკონტაქტო ფორმა. ვპასუხობთ 24 საათში.',
  alternates: { canonical: '/contact' },
}

const CHANNELS = [
  { icon: Mail, label: 'ელ. ფოსტა', value: 'info@sivrce.ge', href: 'mailto:info@sivrce.ge' },
  { icon: Phone, label: 'ტელეფონი', value: '+995 32 2 00 00 00', href: 'tel:+995322000000' },
  { icon: MapPin, label: 'მისამართი', value: 'თბილისი, საქართველო', href: null },
]

const contactLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'კონტაქტი — sivrce',
  url: 'https://sivrce.ge/contact',
  inLanguage: 'ka',
  isPartOf: { '@id': 'https://sivrce.ge/#website' },
  about: {
    '@type': 'Organization',
    name: 'sivrce',
    url: 'https://sivrce.ge',
    email: 'info@sivrce.ge',
    telephone: '+995 32 2 00 00 00',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'თბილისი',
      addressCountry: 'GE',
    },
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(contactLd) }} />
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <Reveal>
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-5xl">
                დაგვიკავშირდი
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium text-sv-ink/60">
                კითხვა, შეთავაზება თუ პარტნიორობა — ჩვენი გუნდი გიპასუხებთ 24 საათის განმავლობაში.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {CHANNELS.map((c, i) => {
              const inner = (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
                    <c.icon className="h-6 w-6 text-sv-blue" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-sv-ink/50">{c.label}</div>
                  <div className="mt-1 text-[17px] font-black tracking-[-0.02em] text-sv-ink">{c.value}</div>
                </>
              )
              return (
                <Reveal key={c.label} delay={i * 0.07}>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="block h-full rounded-card bg-white p-7 shadow-card ring-1 ring-sv-ink/5 transition hover:-translate-y-1 hover:shadow-card-hover"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="h-full rounded-card bg-white p-7 shadow-card ring-1 ring-sv-ink/5">{inner}</div>
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
