import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'sivrce — უძრავი ქონება ერთ სივრცეში',
    short_name: 'sivrce',
    description:
      'საქართველოს ტექნოლოგიური უძრავი ქონების პლატფორმა — ბინები, სახლები, მიწა და კომერციული ფართები იყიდება და ქირავდება.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050B26',
    theme_color: '#050B26',
    lang: 'ka',
    categories: ['real-estate', 'business'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'ძიება',
        url: '/search',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'განცხადების დამატება',
        url: '/add-listing',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
