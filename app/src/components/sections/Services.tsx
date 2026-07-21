import Link from 'next/link'
import { Calculator, Camera, Landmark, Paintbrush, FileText, Map, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { SERVICE_BRAND } from '@/lib/category-brand'
import { getCmsBlock } from '@/lib/cms'
import type { Lang } from '@/lib/i18n/core'

/* Core services — tools live here, not as heavy homepage widgets (vs MyHome/SS). */
const SERVICES = [
  {
    icon: Landmark,
    title: 'იპოთეკური კალკულატორი',
    text: 'ყოველთვიური შენატანი TBC, BoG, Liberty და ტერაბანკის პირობების მიხედვით.',
    brand: SERVICE_BRAND.mortgage,
    href: '/mortgage-calculator',
  },
  {
    icon: Paintbrush,
    title: 'რემონტის ბიუჯეტი',
    text: 'შავი / თეთრი / მწვანე კარკასი და გასაღების ჩაბარება — ორიენტირი მ²-ზე.',
    brand: SERVICE_BRAND.renovation,
    href: '/contact',
  },
  {
    icon: Map,
    title: 'რუკაზე ძებნა',
    text: 'უბნები, პროექტები და ფასები ერთ რუკაზე — იპოვე ბინა რუკით.',
    brand: SERVICE_BRAND.agents,
    href: '/map',
  },
  {
    icon: Camera,
    title: 'ფოტო & 3D ტური',
    text: 'პროფესიონალური ფოტოგადაღება და 3D ვირტუალური ტური ობიექტისთვის.',
    brand: SERVICE_BRAND.developers,
    href: '/contact',
  },
  {
    icon: Calculator,
    title: 'ფასის შეფასება',
    text: 'საბაზრო ღირებულების ორიენტირი — შეადარე მსგავს განცხადებებს.',
    brand: SERVICE_BRAND.agents,
    href: '/search',
  },
  {
    icon: FileText,
    title: 'ხელშეკრულების შაბლონები',
    text: 'ნასყიდობის, იჯარისა და გირავნობის იურიდიულად გამართული შაბლონები.',
    brand: SERVICE_BRAND.agents,
    href: '/terms',
  },
]

export default async function Services({ lang = 'ka' }: { lang?: Lang }) {
  const [title, sub] = await Promise.all([
    getCmsBlock('home.services.title', lang),
    getCmsBlock('home.services.sub', lang),
  ])
  return (
    <section id="services" className="bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-12 text-center">
          <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {sub}
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08} className="h-full">
              <Link
                href={s.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-gradient-to-b from-sv-cloud to-sv-surface p-7 transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-card-hover"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-module transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: s.brand.chipVar, color: s.brand.hue }}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-[18px] font-extrabold leading-snug text-sv-ink">{s.title}</h3>
                <p className="mt-2.5 flex-1 text-[14px] font-medium leading-relaxed text-sv-ink/55">{s.text}</p>
                <span className="mt-6 flex items-center gap-1.5 text-[14px] font-extrabold" style={{ color: s.brand.hue }}>
                  ისარგებლე სერვისით
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                  style={{ backgroundColor: s.brand.hue }}
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
