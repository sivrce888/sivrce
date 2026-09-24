import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { isValidLang, panelLang } from '@/lib/i18n/core'
import { kaOnlyAlternates, pageMeta } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import { requestOrigin } from '@/lib/request-market'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/terms', lang, {
      ka: {
        title: 'წესები და პირობები',
        description: 'sivrce-ის გამოყენების წესები და პირობები — განცხადებების განთავსება, ვერიფიკაცია, VIP სერვისები და პასუხისმგებლობა.',
      },
      en: {
        title: 'Terms & Conditions',
        description: 'sivrce.ge terms of use — posting listings, verification, VIP services and liability.',
      },
      ru: {
        title: 'Правила и условия',
        description: 'Условия использования sivrce.ge — размещение объявлений, верификация, VIP-сервисы и ответственность.',
      },
    }),
    alternates: kaOnlyAlternates('/terms'),
  }
}

const SECTIONS_BY_LANG = {
  ka: [
  {
    title: '1. ზოგადი დებულებები',
    text: 'წინამდებარე წესები არეგულირებს sivrce.ge პლატფორმის გამოყენებას. პლატფორმაზე რეგისტრაციით ან გამოყენებით თქვენ ადასტურებთ, რომ გაეცანით ამ წესებს და თანხმობას აცხადებთ მათ დაცვაზე. sivrce წარმოადგენს საინფორმაციო პლატფორმას, რომელიც აკავშირებს უძრავი ქონების მყიდველსა და გამყიდველს.',
  },
  {
    title: '2. განცხადებების განთავსება',
    text: 'განცხადების განმთავსებელი პასუხისმგებელია მითითებული ინფორმაციის სისწორეზე. აკრძალულია მცდარი ფასების, არარსებული ობიექტების ან მესამე პირის უფლებების დამარღვევი კონტენტის განთავსება. sivrce იტოვებს უფლებას წაშალოს ნებისმიერი განცხადება, რომელიც არღვევს ამ წესებს.',
  },
  {
    title: '3. ვერიფიკაცია',
    text: 'ვერიფიცირებული სტატუსი ენიჭება აგენტს ან მფლობელს დოკუმენტების შემოწმების შემდეგ. ვერიფიკაცია ადასტურებს იდენტობას, თუმცა არ წარმოადგენს sivrce-ის გარანტიას კონკრეტული გარიგების შედეგებზე.',
  },
  {
    title: '4. VIP სერვისები',
    text: 'VIP, VIP+ და SUPER VIP პაკეტები წარმოადგენს ფასიან სარეკლამო სერვისებს, რომლებიც ზრდის განცხადების ხილვადობას. პაკეტის ვადის ამოწურვის შემდეგ განცხადება ბრუნდება სტანდარტულ რეჟიმში. გადახდილი თანხა არ ბრუნდება, გარდა კანონმდებლობით გათვალისწინებული შემთხვევებისა.',
  },
  {
    title: '5. პასუხისმგებლობა',
    text: 'sivrce არ არის მხარე მყიდველსა და გამყიდველს შორის დადებულ გარიგებებში და არ აგებს პასუხს მათ შედეგებზე. პლატფორმა არ იძლევა გარანტიას განცხადებებში მითითებული ინფორმაციის სრულ სისწორეზე, თუმცა ყველაფერს აკეთებს მისი შესამოწმებლად.',
  },
  {
    title: '6. ინტელექტუალური საკუთრება',
    text: 'პლატფორმის დიზაინი, ლოგოტიპი, პროგრამული კოდი და კონტენტი sivrce-ის საკუთრებაა. აკრძალულია მათი კოპირება, გავრცელება ან კომერციული გამოყენება წერილობითი თანხმობის გარეშე.',
  },
  {
    title: '7. ცვლილებები',
    text: 'sivrce იტოვებს უფლებას ნებისმიერ დროს შეცვალოს წინამდებარე წესები. ცვლილებები ძალაში შედის პლატფორმაზე გამოქვეყნებისთანავე. პლატფორმის გამოყენების გაგრძელება ნიშნავს ახალი რედაქციის მიღებას.',
  },
  {
    title: '8. კონტაქტი',
    text: 'წესებთან დაკავშირებული კითხვების შემთხვევაში მოგვწერეთ hi@sivrce.ge მისამართზე.',
  },
  ],
  en: [
    {
      title: '1. General provisions',
      text: 'These terms govern the use of the sivrce.ge platform. By registering on or using the platform you confirm that you have read these terms and agree to comply with them. sivrce is an information platform that connects buyers and sellers of real estate.',
    },
    {
      title: '2. Posting listings',
      text: 'The person posting a listing is responsible for the accuracy of the information provided. Posting false prices, non-existent properties, or content infringing third-party rights is prohibited. sivrce reserves the right to remove any listing that violates these terms.',
    },
    {
      title: '3. Verification',
      text: 'Verified status is granted to an agent or owner after document review. Verification confirms identity but is not a sivrce guarantee regarding the outcome of any specific transaction.',
    },
    {
      title: '4. VIP services',
      text: 'VIP, VIP+ and SUPER VIP packages are paid promotional services that increase listing visibility. After a package expires, the listing returns to standard mode. Payments are non-refundable except as required by law.',
    },
    {
      title: '5. Liability',
      text: 'sivrce is not a party to transactions concluded between buyer and seller and is not responsible for their outcomes. The platform does not guarantee the complete accuracy of information in listings but does everything possible to verify it.',
    },
    {
      title: '6. Intellectual property',
      text: 'The platform design, logo, source code and content are the property of sivrce. Copying, distribution or commercial use without written consent is prohibited.',
    },
    {
      title: '7. Changes',
      text: 'sivrce reserves the right to change these terms at any time. Changes take effect upon publication on the platform. Continued use of the platform constitutes acceptance of the new version.',
    },
    {
      title: '8. Contact',
      text: 'For questions regarding these terms, write to hi@sivrce.ge.',
    },
  ],
  de: [
    {
      title: '1. Allgemeine Bestimmungen',
      text: 'Diese Regeln regeln die Nutzung der Plattform sivrce.ge. Mit der Registrierung oder Nutzung der Plattform bestätigen Sie, dass Sie diese Regeln gelesen haben und ihrer Einhaltung zustimmen. sivrce ist eine Informationsplattform, die Käufer und Verkäufer von Immobilien verbindet.',
    },
    {
      title: '2. Veröffentlichung von Inseraten',
      text: 'Der Verfasser eines Inserats ist für die Richtigkeit der angegebenen Informationen verantwortlich. Die Veröffentlichung falscher Preise, nicht existierender Objekte oder Inhalte, die Rechte Dritter verletzen, ist untersagt. sivrce behält sich vor, Inserate, die gegen diese Regeln verstoßen, zu entfernen.',
    },
    {
      title: '3. Verifizierung',
      text: 'Der Verifiziert-Status wird einem Agenten oder Eigentümer nach Prüfung der Dokumente verliehen. Die Verifizierung bestätigt die Identität, stellt jedoch keine Garantie von sivrce hinsichtlich des Ergebnisses einer bestimmten Transaktion dar.',
    },
    {
      title: '4. VIP-Services',
      text: 'VIP-, VIP+- und SUPER-VIP-Pakete sind kostenpflichtige Werbeservices, die die Sichtbarkeit von Inseraten erhöhen. Nach Ablauf eines Pakets kehrt das Inserat in den Standardmodus zurück. Gezahlte Beträge sind — gesetzlich vorgesehene Fälle ausgenommen — nicht rückerstattungsfähig.',
    },
    {
      title: '5. Haftung',
      text: 'sivrce ist nicht Partei der zwischen Käufer und Verkäufer geschlossenen Verträge und haftet nicht für deren Ergebnisse. Die Plattform übernimmt keine Garantie für die vollständige Richtigkeit der Angaben in Inseraten, unternimmt jedoch alles Erforderliche zu deren Prüfung.',
    },
    {
      title: '6. Geistiges Eigentum',
      text: 'Design, Logo, Programmcode und Inhalte der Plattform sind Eigentum von sivrce. Vervielfältigung, Verbreitung oder kommerzielle Nutzung ohne schriftliche Zustimmung ist untersagt.',
    },
    {
      title: '7. Änderungen',
      text: 'sivrce behält sich vor, diese Regeln jederzeit zu ändern. Änderungen treten mit Veröffentlichung auf der Plattform in Kraft. Die fortgesetzte Nutzung der Plattform gilt als Annahme der neuen Fassung.',
    },
    {
      title: '8. Kontakt',
      text: 'Bei Fragen zu diesen Regeln schreiben Sie an hi@sivrce.ge.',
    },
  ],
}

// ka is the legally binding text; en/de are convenience translations with an
// explicit notice (legal docs governance: full AGB/deep legal review stays
// gated behind LEGAL_REVIEW_REQUIRED in src/lib/legal/docs.ts).
const UI = {
  ka: { kicker: 'იურიდიული', title: 'წესები და პირობები', updated: 'ბოლო განახლება: 2026 წელი', notice: '' },
  en: {
    kicker: 'Legal',
    title: 'Terms & Conditions',
    updated: 'Last updated: 2026',
    notice: 'This English translation is provided for convenience. The Georgian version is the legally binding text.',
  },
  de: {
    kicker: 'Rechtliches',
    title: 'Allgemeine Geschäftsbedingungen',
    updated: 'Zuletzt aktualisiert: 2026',
    notice: 'Diese deutsche Übersetzung dient nur der Vereinfachung. Rechtlich bindend ist die georgische Fassung.',
  },
} as const

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const origin = await requestOrigin()
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const ui = UI[panelLang(lang)]
  const termsLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${origin}/terms#webpage`,
        url: `${origin}/terms`,
        name: 'წესები და პირობები — sivrce',
        description: 'sivrce-ის გამოყენების წესები და პირობები — განცხადებების განთავსება, ვერიფიკაცია, VIP სერვისები და პასუხისმგებლობა.',
        inLanguage: 'ka',
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
          { '@type': 'ListItem', position: 2, name: 'წესები და პირობები', item: `${origin}/terms` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(termsLd) }} />
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={ui.kicker} title={ui.title} subtitle={ui.updated} />
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-4 md:pb-28">
          {ui.notice ? (
            <p className="mb-8 rounded-module border border-sv-ink/10 bg-sv-surface px-4 py-3 text-[13px] font-semibold text-sv-ink/70">
              {ui.notice}
            </p>
          ) : null}
          <div className="space-y-10">
            {(SECTIONS_BY_LANG[panelLang(lang)] ?? SECTIONS_BY_LANG.ka).map((s, i) => (
              <Reveal key={s.title} delay={Math.min(i * 0.04, 0.2)}>
                <section>
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
