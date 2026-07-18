import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import AddListingClient from '@/components/add-listing/AddListingClient'

export const metadata: Metadata = {
  title: 'განცხადების დამატება',
  description:
    'განათავსე უძრავი ქონების განცხადება სივრცეზე 6 მარტივი ნაბიჯით — AI ფასის შეფასებით, ცოცხალი გადახედვით და ვერიფიკაციით.',
  alternates: { canonical: '/add-listing' },
  robots: { index: false, follow: true },
}

export default function AddListingPage() {
  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />
      <main className="pt-[68px]">
        <AddListingClient />
      </main>
      <Footer />
    </div>
  )
}
