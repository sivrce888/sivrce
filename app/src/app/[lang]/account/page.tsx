import type { Metadata } from 'next'
import { auth } from '@/auth'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import ProfileCard, { type AccountUser } from '@/components/account/ProfileCard'
import FavoritesCard from '@/components/account/FavoritesCard'
import SavedSearchesCard from '@/components/account/SavedSearchesCard'
import RecentlyViewed from '@/components/account/RecentlyViewed'
import MyReviews from '@/components/account/MyReviews'
import MyTours from '@/components/account/MyTours'
import MyInquiries from '@/components/account/MyInquiries'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'
import { PasskeysCard } from '@/components/auth/PasskeysCard'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ჩემი ანგარიში',
    description: 'შენი აქტივობა sivrce-ზე — ფავორიტები, შენახული ძიებები, ბოლოს ნანახი და შეფასებები.',
    alternates: { canonical: '/account', languages: langAlternates('/account') },
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

  const userId = session?.user?.id
  const passkeys = userId
    ? await safeQuery(
        () =>
          db.authenticator.findMany({
            where: { userId },
            select: {
              credentialID: true,
              credentialDeviceType: true,
              credentialBackedUp: true,
            },
          }),
        [],
      )
    : []

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
      <main id="main">
        <PageHero
          tone="light"
          kicker="ანგარიში"
          title="ჩემი ანგარიში"
          subtitle="ფავორიტები, შენახული ძიებები, ბოლოს ნანახი და შეფასებები — ერთ სივრცეში."
        />
        <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mt-4 grid gap-6">
          <ProfileCard user={user} />
          {user ? <PasskeysCard keys={passkeys} /> : null}
          <div className="grid gap-6 md:grid-cols-2">
            <FavoritesCard />
            <SavedSearchesCard />
            <MyTours />
            <MyInquiries />
          </div>
          <MyReviews signedIn={user !== null} />
          <RecentlyViewed hideWhenEmpty={false} />
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
