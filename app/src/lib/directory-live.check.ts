/**
 * Self-check: korter address/coords overlay onto static projects by slug + name.
 * Run: npx tsx src/lib/directory-live.check.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../.env.local') })

async function main() {
  const assert = await import('node:assert/strict')
  const {
    applyProjectRow,
    isValidCoords,
    mergeProjectsLive,
    norm,
    rowToProject,
  } = await import('./directory-live')
  type Project = import('@/data/professionals').Project
  type Developer = import('@/data/professionals').Developer

  const base: Project = {
    slug: 'axis-towers-vake',
    name: 'Axis Towers',
    developerSlug: 'axis',
    img: '/images/p2.webp',
    location: 'ვაკე, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,000',
    done: 100,
    finish: 'გადაცემულია',
    flats: 150,
    rating: 4.8,
    description: { ka: '', en: '', ru: '' },
    coords: { lat: 41.7088, lng: 44.7732 },
  }

  assert.equal(norm('Axis Towers!'), 'axistowers')
  assert.ok(isValidCoords(41.7, 44.8))
  assert.equal(isValidCoords(0, 0), false)

  const row = {
    slug: 'korter-axis-towers',
    name: 'Axis Towers',
    developer: 'Axis',
    city: 'თბილისი',
    district: 'ვაკე',
    address: 'ჩავჭავაძის გამზ. 37, ვაკე, თბილისი',
    lat: 41.7091,
    lng: 44.7735,
    readyBy: '2018',
    pricePerSqmFrom: 2100,
    units: 150,
    image: '/images/p2.webp',
    status: 'active',
  }

  const overlaid = applyProjectRow(base, row)
  assert.equal(overlaid.location, 'ჩავჭავაძის გამზ. 37, ვაკე, თბილისი')
  assert.equal(overlaid.coords.lat, 41.7091)
  assert.equal(overlaid.developerSlug, 'axis')

  const merged = mergeProjectsLive([base], [row])
  assert.equal(merged.length, 1)
  assert.equal(merged[0]!.slug, 'axis-towers-vake')
  assert.equal(merged[0]!.location, row.address)
  assert.equal(merged[0]!.coords.lng, 44.7735)

  const onlyKorter = mergeProjectsLive([], [
    {
      ...row,
      slug: 'new-tower',
      name: 'Brand New Tower',
      developer: 'Unknown Dev LLC',
    },
  ])
  assert.equal(onlyKorter.length, 1)
  assert.equal(onlyKorter[0]!.slug, 'new-tower')
  assert.ok(Number.isFinite(onlyKorter[0]!.coords.lat))

  const noGeo = rowToProject({ ...row, lat: null, lng: null, name: 'No Geo' })
  assert.ok(Number.isNaN(noGeo.coords.lat))

  const withLogo: Developer = {
    slug: 'axis',
    name: { ka: 'აქსისი', en: 'Axis', ru: 'Axis' },
    city: 'თბილისი',
    yearsActive: 10,
    projectsDone: 5,
    unitsDelivered: 1000,
    description: { ka: '', en: '', ru: '' },
    verified: true,
    phone: '+995',
    logoUrl: 'https://storage.googleapis.com/bd-ge-01/developer_image/logo/1.jpg',
  }
  assert.ok(withLogo.logoUrl?.includes('googleapis'))

  console.log('directory-live.check: ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
