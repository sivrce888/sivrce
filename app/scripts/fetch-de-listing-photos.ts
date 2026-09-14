/**
 * Download CC listing-style photos → first-party /images/de/*.webp.
 * Sources: Wikimedia Commons (CC BY / CC BY-SA / public domain).
 * Run: npx tsx scripts/fetch-de-listing-photos.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const OUT = path.join(__dirname, '..', 'public', 'images', 'de')
const UA = 'SivrceListingSeed/1.0 (https://sivrce.com/de; listings@sivrce.com)'

/** Commons FilePath names — interiors + German street fabric, not landmarks-as-listings. */
const FILES: { key: string; file: string }[] = [
  { key: 'apt-1', file: 'Wohnzimmer_mit_Parkett.jpg' },
  { key: 'apt-2', file: 'Modern_kitchen_interior.jpg' },
  { key: 'apt-3', file: 'Schlafzimmer.JPG' },
  { key: 'apt-4', file: 'Bathroom_interior.jpg' },
  { key: 'apt-5', file: 'Berlin_Mitte_Torstrasse.jpg' },
  { key: 'apt-6', file: 'Altbau_Fassade_Berlin.jpg' },
  { key: 'loft-1', file: 'Loft_apartment_interior.jpg' },
  { key: 'house-1', file: 'Einfamilienhaus.jpg' },
  { key: 'house-2', file: 'Reihenhaus_Deutschland.jpg' },
  { key: 'villa-1', file: 'Villa_Gründerzeit.jpg' },
  { key: 'commercial-1', file: 'Bürogebäude_Innenstadt.jpg' },
  { key: 'land-1', file: 'Baugrundstück.jpg' },
  { key: 'hotel-1', file: 'Hotelzimmer_modern.jpg' },
  { key: 'neubau-1', file: 'Neubau_Wohnanlage.jpg' },
  { key: 'balkon-1', file: 'Balkon_mit_Stadtblick.jpg' },
  { key: 'terrasse-1', file: 'Dachterrasse.jpg' },
]

async function fetchBuf(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' }, redirect: 'follow' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.startsWith('image/')) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function commons(file: string): Promise<Buffer | null> {
  const encoded = encodeURIComponent(file.replace(/ /g, '_'))
  return fetchBuf(`https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=1400`)
}

/** Fallback interiors when a Commons filename 404s — Unsplash License, stored first-party. */
const UNSPLASH: Record<string, string> = {
  'apt-1': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&q=80&auto=format&fit=crop',
  'apt-2': 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1400&q=80&auto=format&fit=crop',
  'apt-3': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1400&q=80&auto=format&fit=crop',
  'apt-4': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1400&q=80&auto=format&fit=crop',
  'apt-5': 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1400&q=80&auto=format&fit=crop',
  'apt-6': 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1400&q=80&auto=format&fit=crop',
  'loft-1': 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1400&q=80&auto=format&fit=crop',
  'house-1': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=80&auto=format&fit=crop',
  'house-2': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1400&q=80&auto=format&fit=crop',
  'villa-1': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1400&q=80&auto=format&fit=crop',
  'commercial-1': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80&auto=format&fit=crop',
  'land-1': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80&auto=format&fit=crop',
  'hotel-1': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=80&auto=format&fit=crop',
  'neubau-1': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80&auto=format&fit=crop',
  'balkon-1': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&q=80&auto=format&fit=crop',
  'terrasse-1': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80&auto=format&fit=crop',
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  for (const row of FILES) {
    const dest = path.join(OUT, `${row.key}.webp`)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 8_000) {
      console.log(`skip ${row.key}`)
      continue
    }
    let buf = await commons(row.file)
    if (!buf) buf = await fetchBuf(UNSPLASH[row.key] ?? '')
    if (!buf) {
      console.error(`fail ${row.key}`)
      process.exit(1)
    }
    await sharp(buf)
      .rotate()
      .resize(1200, 800, { fit: 'cover', position: 'attention' })
      .webp({ quality: 72, effort: 4 })
      .toFile(dest)
    const kb = Math.round(fs.statSync(dest).size / 1024)
    console.log(`+ ${row.key}.webp ${kb}kb`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
