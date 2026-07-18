/**
 * Self-check: directory address/coords/media overlay onto static projects.
 * Run: npx tsx src/lib/directory-live.check.ts
 */
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../.env.local') })

async function main() {
  const {
    applyProjectRow,
    isValidCoords,
    mergeDevelopersLive,
    mergeProjectsLive,
    norm,
    rowToDeveloper,
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
    slug: 'dir-axis-towers',
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
    image: 'https://cdn.sivrce.ge/directory/projects/axis.jpg',
    gallery: ['https://cdn.sivrce.ge/directory/projects/a.jpg'],
    body: 'Axis Towers — Vake landmark.',
    passportUrl: 'https://cdn.sivrce.ge/directory/passports/a.jpg',
    status: 'active',
  }

  const overlaid = applyProjectRow(base, row)
  assert.equal(overlaid.location, 'ჩავჭავაძის გამზ. 37, ვაკე, თბილისი')
  assert.equal(overlaid.coords.lat, 41.7091)
  assert.equal(overlaid.developerSlug, 'axis')
  assert.equal(overlaid.img, row.image)
  assert.equal(overlaid.gallery?.[0], row.gallery[0])
  assert.equal(overlaid.description.ka, row.body)
  assert.equal(overlaid.passportUrl, row.passportUrl)
  // Catalog ₾ / long SEO body must not be wiped by thinner DB USD rows.
  const gelKeep = applyProjectRow(
    {
      ...base,
      slug: 'm2-highlight',
      name: 'm² Highlight',
      priceFromM2: '₾4,224',
      description: {
        ka: 'x'.repeat(200),
        en: 'x'.repeat(200),
        ru: 'x'.repeat(200),
      },
    },
    { ...row, slug: 'm2-highlight', name: 'm² Highlight', pricePerSqmFrom: 1607, body: 'thin' },
  )
  assert.equal(gelKeep.priceFromM2, '₾4,224')
  assert.equal(gelKeep.description.ka.length, 200)

  // Curated street pin must beat vague DB district centroid (live-map regression).
  const {
    addressPrecision,
    resolveProjectCoords,
  } = await import('./directory-live')
  assert.equal(addressPrecision('ალექსი გობრონიძის ქ. 25, მუხიანი'), 2)
  assert.equal(addressPrecision('მუხიანი, გლდანი'), 0)
  const streetPinWins = applyProjectRow(
    {
      ...base,
      slug: 'blox-mukhiani',
      name: 'Blox Mukhiani',
      location: 'ალექსი გობრონიძის ქ. 25, მუხიანი, გლდანი, თბილისი',
      coords: { lat: 41.7851, lng: 44.8226 },
    },
    {
      ...row,
      slug: 'blox-mukhiani',
      name: 'Blox Mukhiani',
      address: null,
      district: 'მუხიანი',
      lat: 41.7468,
      lng: 44.7698,
    },
  )
  assert.equal(streetPinWins.coords.lat, 41.7851)
  assert.equal(streetPinWins.location.includes('გობრონიძ'), true)
  assert.equal(
    resolveProjectCoords(
      { ...base, location: 'ვაკე', coords: { lat: 41.71, lng: 44.77 } },
      { ...row, address: 'ჩავჭავაძის 37', lat: 41.7091, lng: 44.7735 },
    ).lat,
    41.7091,
  )

  const merged = mergeProjectsLive([base], [row])
  assert.equal(merged.length, 1)
  assert.equal(merged[0]!.slug, 'axis-towers-vake')
  assert.equal(merged[0]!.location, row.address)
  assert.equal(merged[0]!.coords.lng, 44.7735)

  const onlyDir = mergeProjectsLive([], [
    {
      ...row,
      slug: 'new-tower',
      name: 'Brand New Tower',
      developer: 'Unknown Dev LLC',
    },
  ])
  assert.equal(onlyDir.length, 1)
  assert.equal(onlyDir[0]!.slug, 'new-tower')
  assert.ok(Number.isFinite(onlyDir[0]!.coords.lat))

  // Stock /images ghosts dropped when real CDN media exists in the corpus.
  const ghostsDropped = mergeProjectsLive(
    [{ ...base, slug: 'ghost', name: 'Ghost Only', img: '/images/np1.webp' }],
    [row],
  )
  assert.ok(ghostsDropped.every((p) => !p.img.startsWith('/images/') || (p.gallery?.length ?? 0) > 0))
  assert.ok(ghostsDropped.some((p) => p.img.includes('cdn.sivrce.ge')))

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
    logoUrl: 'https://cdn.sivrce.ge/directory/logos/1.jpg',
  }
  assert.ok(withLogo.logoUrl?.includes('cdn.sivrce.ge'))

  const curated: Developer = {
    slug: 'axis',
    name: { ka: 'აქსისი', en: 'Axis', ru: 'Axis' },
    city: 'თბილისი',
    yearsActive: 10,
    projectsDone: 5,
    unitsDelivered: 1000,
    description: { ka: '', en: '', ru: '' },
    verified: true,
    phone: '+995',
  }
  const liveDevs = mergeDevelopersLive([curated], [
    {
      slug: 'axis',
      name: 'Axis',
      headquarters: 'თბილისი',
      description: '',
      completedCount: 5,
      projectsCount: 8,
      logoUrl: 'https://cdn.sivrce.ge/directory/logos/1.jpg',
      website: 'https://axis.ge',
      ownerId: null,
    },
    {
      slug: 'brand-new-dev',
      name: 'Brand New Dev LLC',
      headquarters: 'ბათუმი',
      description: '',
      completedCount: 0,
      projectsCount: 2,
      logoUrl: null,
      website: null,
      ownerId: null,
    },
  ])
  assert.equal(liveDevs.length, 2)
  assert.ok(liveDevs[0]!.logoUrl?.includes('cdn.sivrce.ge'))
  assert.equal(liveDevs[0]!.website, 'https://axis.ge')
  assert.equal(liveDevs[1]!.slug, 'brand-new-dev')
  assert.equal(rowToDeveloper({
    slug: 'x',
    name: 'X',
    headquarters: 'თბილისი',
    description: '',
    completedCount: 0,
    projectsCount: 1,
    logoUrl: null,
    website: null,
    ownerId: null,
  }).city, 'თბილისი')

  console.log('directory-live.check: ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
