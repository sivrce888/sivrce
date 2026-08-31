import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AddServiceForm } from '@/components/services/AddServiceForm'
import { requireUser } from '@/lib/guards'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'დაამატე სერვისი',
  description: 'განათავსე უძრავ ქონებასთან დაკავშირებული სერვისი: რემონტი, იურიდიული, ფოტო, შეფასება, მართვა.',
  alternates: { canonical: '/add-service', languages: langAlternates('/add-service') },
  robots: { index: false, follow: true },
}

export default async function AddServicePage() {
  await requireUser('/add-service')
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="სერვისები"
          title="დაამატე კომპანია"
          subtitle="რემონტი, ინტერიერი, ფოტო, იურიდიული, შეფასება, გადატანა, დასუფთავება, ქონების მართვა. ქონების განცხადება — ცალკე, იმავე ანგარიშით."
        />
        <section className="mx-auto max-w-[640px] px-5 pb-20 md:px-10">
          <AddServiceForm />
        </section>
      </main>
      <Footer />
    </div>
  )
}
