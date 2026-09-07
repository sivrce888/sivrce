import type { Metadata } from "next"
import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"
import { PageHero } from "@/components/PageHero"
import CompareClient from "@/components/compare/CompareClient"
import { isValidLang } from "@/lib/i18n/core"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  return {
    title:
      lang === "ka" ? "შედარება" : lang === "ru" ? "Сравнение" : "Compare",
    description:
      lang === "ka"
        ? "შეადარე განცხადებები გვერდიგვერდ — ფასი, ფართი, უბანი."
        : lang === "ru"
          ? "Сравни объявления бок о бок — цена, площадь, район."
          : "Compare listings side by side — price, area, neighborhood.",
    robots: { index: false },
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const t =
    lang === "ka"
      ? {
          kicker: "შედარება",
          title: "ობიექტების შედარება",
          subtitle: "გვერდიგვერდ ფასი, ფართი, ოთახები და უბანი — პირველად საქართველოში.",
        }
      : lang === "ru"
        ? {
            kicker: "Сравнение",
            title: "Сравнение объектов",
            subtitle: "Бок о бок: цена, площадь, комнаты и район — впервые в Грузии.",
          }
        : {
            kicker: "Compare",
            title: "Compare listings",
            subtitle: "Side by side: price, area, rooms and neighborhood — a first for Georgia.",
          }
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={t.kicker} title={t.title} subtitle={t.subtitle} />
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <CompareClient />
        </section>
      </main>
      <Footer />
    </div>
  )
}
