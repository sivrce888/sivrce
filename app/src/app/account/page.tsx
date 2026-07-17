import type { Metadata } from 'next'
import { auth } from '@/auth'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ProfileCard, { type AccountUser } from '@/components/account/ProfileCard'
import FavoritesCard from '@/components/account/FavoritesCard'
import SavedSearchesCard from '@/components/account/SavedSearchesCard'
import RecentlyViewed from '@/components/account/RecentlyViewed'
import MyReviews from '@/components/account/MyReviews'
import { jsonLd } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ჩემი ანგარიში',
    description: 'შენი აქტივობა sivrce-ზე — ფავორიტები, შენახული ძიებები, ბოლოს ნანახი და შეფასებები.',
    alternates: { canonical: '/account' },
    robots: { index: false, follow: true },
  }
}

export default async function AccountPage() {
  const session = await auth()
  const user: AccountUser | null = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null

  return (
    <div className="min-h-screen bg-sv-cloud">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: 'sivrce — ჩემი ანგარიში',
            url: 'https://sivrce.ge/account',
          }),
        }}
      />
      <Navbar />
      <main id="main" className="mx-auto max-w-6xl px-6 pb-20 pt-24 md:pt-28">
        <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-5xl">
          ჩემი ანგარიში
        </h1>
        <p className="mt-3 text-[15px] font-medium text-sv-ink/60">
          ფავორიტები, შენახული ძიებები, ბოლოს ნანახი და შეფასებები — ერთ სივრცეში.
        </p>
        <div className="mt-10 grid gap-6">
          <ProfileCard user={user} />
          <div className="grid gap-6 md:grid-cols-2">
            <FavoritesCard />
            <SavedSearchesCard />
          </div>
          <MyReviews signedIn={user !== null} />
          <RecentlyViewed hideWhenEmpty={false} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
