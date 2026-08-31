import type { Metadata } from "next"

import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"
import PaymentResult from "@/components/payments/PaymentResult"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "გადახდა ვერ შესრულდა",
  robots: { index: false },
}

export default async function PaymentFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ order?: string }>
}) {
  const [{ lang: raw }, { order }] = await Promise.all([params, searchParams])
  const lang = isValidLang(raw) ? raw : "ka"

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav">
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <PaymentResult lang={lang} orderId={order} />
        </section>
      </main>
      <Footer />
    </div>
  )
}
