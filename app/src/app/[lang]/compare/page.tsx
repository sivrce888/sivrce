import type { Metadata } from "next"
import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"
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
      <main id="main" className="pt-24 md:pt-28">
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-5xl">
            ობიექტების შედარება
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] font-medium text-sv-ink/60">
            გვერდიგვერდ ფასი, ფართი, ოთახები და უბანი — პირველად საქართველოში.
          </p>
          <div className="mt-10">
            <CompareClient />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
