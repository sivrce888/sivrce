import type { Metadata } from "next"
import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"
import { PageHero } from "@/components/PageHero"
import CompareClient from "@/components/compare/CompareClient"

export const metadata: Metadata = {
  title: "შედარება",
  description: "შეადარე განცხადებები გვერდიგვერდ — ფასი, ფართი, უბანი.",
  robots: { index: false },
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="შედარება"
          title="ობიექტების შედარება"
          subtitle="გვერდიგვერდ ფასი, ფართი, ოთახები და უბანი — პირველად საქართველოში."
        />
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <CompareClient />
        </section>
      </main>
      <Footer />
    </div>
  )
}
