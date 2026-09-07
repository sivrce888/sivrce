import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { requireUser, safeQuery } from '@/lib/guards'
import { cadastralFromExtended } from '@/lib/map/cadastre'
import MyCadastreView, { type MyListingPin } from './MyCadastreView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ჩემი ქონება კადასტრის რუკაზე',
  robots: { index: false, follow: false },
}

export default async function AccountCadastrePage() {
  const user = await requireUser('/account/cadastre')

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: user.id, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 40,
        select: {
          slug: true,
          publicId: true,
          title: true,
          price: true,
          currency: true,
          status: true,
          city: true,
          district: true,
          lat: true,
          lng: true,
          extendedFields: true,
        },
      }),
    [],
  )

  const pins: MyListingPin[] = listings
    .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
    .map((l) => ({
      slug: l.slug,
      publicId: l.publicId,
      title: l.title,
      price: l.price,
      currency: l.currency,
      status: l.status,
      city: l.city,
      district: l.district,
      lat: l.lat,
      lng: l.lng,
      cadastral: cadastralFromExtended(l.extendedFields),
    }))

  return <MyCadastreView pins={pins} name={user.name} />
}
