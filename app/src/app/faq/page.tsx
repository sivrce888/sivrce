import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'ხშირად დასმული კითხვები — sivrce',
  description: 'პასუხები მყიდველების, გამყიდველებისა და sivrce პლატფორმის შესახებ — ფასები, ვერიფიკაცია, VIP პაკეტები, AI ძიება.',
  alternates: { canonical: '/faq' },
}

interface QA {
  q: string
  a: string
}

const SECTIONS: { title: string; items: QA[] }[] = [
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
        a: 'გახსენი განცხადება და დააჭირე „ტურის დაჯავშნა" — აირჩიე შენთვის მოსახერხებელი დრო კალენდარში. აგენტი ან მფლობელი დაადასტურებს ვიზიტს.',
      },
      {
        q: 'რა ვალუტით ჩანს ფასები?',
        a: 'ფასები ნაჩვენებია ლარსა და აშშ დოლარში ერთდროულად. კურსი ფიქსირებულია საჩვენებელი მიზნებისთვის — საბოლოო ფასი ყოველთვის გამყიდველთან შეთანხმებით დგინდება.',
      },
      {
        q: 'როგორ გამოვიყენო AI ძიება?',
        a: 'მთავარი გვერდის ძიების ველში ჩაწერე თავისუფალი ტექსტი — მაგალითად „ოროთალიანი ბინა ვაკეში 200 ათასამდე". AI გაარჩევს შენს მოთხოვნას და აჩვენებს შესაბამის განცხადებებს. მუშაობს ქართულად, ინგლისურად და რუსულად.',
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
        q: 'როგორ მუშაობს ვერიფიკაცია?',
        a: 'ვერიფიკაციისთვის აგენტი ან მფლობელი ატვირთავს პირადობის დამადასტურებელ დოკუმენტს და ქონების საკადასტრო მონაცემებს. ჩვენი გუნდი ამოწმებს ინფორმაციას 1-2 სამუშაო დღეში და წარმატებული შემოწმების შემდეგ განცხადებას ენიჭება ვერიფიცირებული ნიშანი.',
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
        a: 'დიახ. ყველა აგენტი, ვისთანაც ლაპარაკობ, გარდაიცვლება ვერიფიკაციას. შეტყობინებები ხდება პლატფორმის შიგნით, რაც ინახავს მიმოწერის ისტორიას და გიცავს თაღლითობისგან. არასდროს გადაურიცხო ფული პირად შეხვედრამდე.',
      },
    ],
  },
]

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ka',
  isPartOf: { '@id': 'https://sivrce.ge/#website' },
  mainEntity: SECTIONS.flatMap((s) =>
    s.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        <section className="mx-auto max-w-4xl px-6 py-14 md:py-20">
          <Reveal>
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-5xl">
                ხშირად დასმული კითხვები
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium text-sv-ink/60">
                ყველაფერი, რაც sivrce-ის გამოყენებისთვის უნდა იცოდე — ერთ გვერდზე.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 space-y-14">
            {SECTIONS.map((section, si) => (
              <Reveal key={section.title} delay={si * 0.05}>
                <section>
                  <h2 className="text-2xl font-black tracking-[-0.02em] text-sv-ink text-balance">
                    {section.title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {section.items.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-card bg-white shadow-card ring-1 ring-sv-ink/5 transition open:shadow-card-hover"
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
