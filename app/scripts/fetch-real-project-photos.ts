/**
 * fetch-real-project-photos.ts
 *
 * Universal real photos & renders finder for Georgia, Germany, UAE, and Global projects.
 * Online sources:
 *   1. Official developer portals & sitemaps (GE, DE, UAE, Global)
 *   2. Korter.ge project and developer pages (GE)
 *   3. Wikipedia REST API & summary images (DE, EN, KA)
 *   4. Wikimedia Commons search API (multi-photo architectural galleries)
 *
 * Strictly NO AI generation — only verified real photos and renders.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { PROJECTS, DEVELOPERS, type Project } from '../src/data/professionals'
import { NEW_DEVELOPERS_GERMANY } from '../src/data/projects-new-germany'

const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'projects')
const UA = 'SivrcePlatform/1.0 (https://sivrce.com; contact@sivrce.com) Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
const FETCH_TIMEOUT_MS = 15_000
const SPACING_MS = 120

let lastReq = 0
async function rateLimit() {
  const gap = Date.now() - lastReq
  if (gap < SPACING_MS) await new Promise((r) => setTimeout(r, SPACING_MS - gap))
  lastReq = Date.now()
}

const htmlCache = new Map<string, string | null>()

async function fetchText(url: string): Promise<string | null> {
  if (htmlCache.has(url)) return htmlCache.get(url)!
  await rateLimit()
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'text/html,application/json,*/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) {
      htmlCache.set(url, null)
      return null
    }
    const text = await res.text()
    htmlCache.set(url, text)
    return text
  } catch {
    htmlCache.set(url, null)
    return null
  }
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  await rateLimit()
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'image/webp,image/png,image/jpeg,*/*;q=0.8' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (ct && !ct.includes('image') && !ct.includes('octet-stream')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 4_000) return null
    return buf
  } catch {
    return null
  }
}

// Developer known listing URLs (GE, DE, UAE, World)
const DEV_SITES: Record<string, { base: string; listings: string[] }> = {
  // Georgia
  'm2-development': { base: 'https://m2.ge', listings: ['/en/projects', '/en/offers', '/ka/projects'] },
  'archi': { base: 'https://archi.ge', listings: ['/en/projects', '/ka/projects'] },
  'axis': { base: 'https://www.axis.ge', listings: ['/en/projects', '/en/projects/current/', '/ka/projects'] },
  'blox': { base: 'https://blox.ge', listings: ['/en', '/en/projects', '/ka/projects'] },
  'biograpi': { base: 'https://biograpi.ge', listings: ['/en/projects', '/ka/projects'] },
  'domus-development': { base: 'https://domusi.com', listings: ['/en/projects', '/en', '/ka/projects'] },
  'white-square': { base: 'https://w2.ge', listings: ['/en/projects', '/ka/projects'] },
  'next-group': { base: 'https://next-property.com', listings: ['/en', '/en/projects'] },
  'orbi-group': { base: 'https://orbi.ge', listings: ['/en/projects', '/ka/projects'] },
  'inn-development': { base: 'https://www.inndevelopment.ge', listings: ['/en', '/ka'] },
  'metropol': { base: 'https://metropol.ge', listings: ['/en', '/en/projects', '/ka/projects'] },
  'mardi-holding': { base: 'https://mardi.ge', listings: ['/en', '/en/projects'] },
  'gumbati-holding': { base: 'https://gumbati.ge', listings: ['/en/projects', '/en'] },
  'tekto-group': { base: 'https://tekto.ge', listings: ['/en/projects', '/en'] },
  'horizon-group': { base: 'https://horizonsbatumi.com', listings: ['/en', '/projects'] },
  'tempo': { base: 'https://tempoholding.ge', listings: ['/en', '/en/projects'] },
  'reside-development': { base: 'https://reside.ge', listings: ['/en/projects', '/en'] },
  'redco': { base: 'https://redco.ge', listings: ['/en/projects', '/en'] },
  'tower-group': { base: 'https://towergroup.ge', listings: ['/en', '/en/projects'] },
  'crystal-group': { base: 'https://crystal.ge', listings: ['/en', '/en/projects'] },
  'tbilisi-hills': { base: 'https://tbilisihills.ge', listings: ['/en', '/en'] },
  'dirsi': { base: 'https://dirsi.ge', listings: ['/en', '/en/projects'] },
  'anagi': { base: 'https://anagi.ge', listings: ['/en', '/ka'] },
  'alliance-group': { base: 'https://alliancegroup.ge', listings: ['/en', '/en/projects'] },
  'elt-group': { base: 'https://eltbuilding.ge', listings: ['/en', '/en/projects'] },
  'york-towers': { base: 'https://yorktowers.com', listings: ['/projects'] },
  'solid-development': { base: 'https://solid.ge', listings: ['/projects'] },
  // Germany
  'buwog-berlin': { base: 'https://www.buwog.de', listings: ['/wohnbauprojekte', '/immobiliensuche'] },
  'wbm': { base: 'https://www.wbm.de', listings: ['/neubau-berlin/'] },
  'wbm-berlin': { base: 'https://www.wbm.de', listings: ['/neubau-berlin/'] },
  'howoge': { base: 'https://www.howoge.de', listings: ['/wohnungsbau/neubauprojekte.html'] },
  'degewo': { base: 'https://www.degewo.de', listings: ['/wohnen-kultur/baukultur-neubau/neubauprojekte/'] },
  'gewobag': { base: 'https://www.gewobag.de', listings: ['/neubau/'] },
  'stadt-und-land': { base: 'https://www.stadtundland.de', listings: ['/Bauen-Wohnen/Neubau.php'] },
  'gesobau': { base: 'https://www.gesobau.de', listings: ['/bauen-wohnen/neubau/'] },
  'pandion': { base: 'https://www.pandion.de', listings: ['/wohnen/', '/gewerbe/'] },
  'pandion-berlin': { base: 'https://www.pandion.de', listings: ['/wohnen/'] },
  'instone-real-estate': { base: 'https://www.instone.de', listings: ['/projekte'] },
  'bonava-berlin': { base: 'https://www.bonava.de', listings: ['/immobilien/berlin'] },
  'groth-gruppe': { base: 'https://www.groth-gruppe.de', listings: ['/projekte/'] },
  'trockland': { base: 'https://www.trockland.com', listings: ['/projects/'] },
  'covivio': { base: 'https://www.covivio.eu', listings: ['/de/'] },
  'euroboden-berlin': { base: 'https://www.euroboden.de', listings: ['/projekte'] },
  'gross-partner': { base: 'https://www.grosspartner.de', listings: ['/de/projekte/'] },
  'art-invest': { base: 'https://www.art-invest.de', listings: ['/projekte/'] },
  'bauwert': { base: 'https://www.bauwert.de', listings: ['/projekte/'] },
  'tag-immobilien': { base: 'https://www.tag-immobilien.de', listings: ['/immobilien/'] },
  'vonovia': { base: 'https://www.vonovia.de', listings: ['/de-de/bauen-wohnen/neubau'] },
  'deutsche-wohnen': { base: 'https://www.deutsche-wohnen.com', listings: ['/ueber-uns/unsere-projekte/neubau/'] },
  'leg-immobilien': { base: 'https://www.leg-wohnen.de', listings: ['/wohnen-in-nrw/neubau'] },
  'vivawest': { base: 'https://www.vivawest.de', listings: ['/neubau'] },
  'saga-hamburg': { base: 'https://www.saga.hamburg', listings: ['/bauen-und-wohnen/neubau/'] },
  'muenchner-wohnen': { base: 'https://www.muenchner-wohnen.de', listings: ['/bauen-und-wohnen/neubau/'] },
  'abg-frankfurt': { base: 'https://www.abg-fh.com', listings: ['/bauen-wohnen/neubauprojekte/'] },
  'gag-koeln': { base: 'https://www.gag-koeln.de', listings: ['/bauen-und-modernisieren/neubau/'] },
  'gewoba-bremen': { base: 'https://www.gewoba.de', listings: ['/wohnen/neubau/'] },
  'nhw-wiesbaden': { base: 'https://www.nhw.de', listings: ['/bauen/neubau-projekte/'] },
  'swsg-stuttgart': { base: 'https://www.swsg.de', listings: ['/wohnen-bauen/neubau/'] },
  'allbau-essen': { base: 'https://www.allbau.de', listings: ['/bauen-modernisieren/neubau/'] },
  'dogewo21-dortmund': { base: 'https://www.dogewo21.de', listings: ['/bauen-wohnen/neubau/'] },
  'wbg-nuernberg': { base: 'https://wbg.nuernberg.de', listings: ['/neubau/'] },
  'spar-bauverein-hannover': { base: 'https://www.spar-bau-hannover.de', listings: ['/neubau/'] },
  'lwb': { base: 'https://lwb.de', listings: ['/neubau/'] },
  'isaria': { base: 'https://isaria.ag', listings: ['/projekte/'] },
  'bayerische-hausbau': { base: 'https://www.bayerische-hausbau.de', listings: ['/projekte/'] },
  'ca-immo': { base: 'https://www.caimmo.com', listings: ['/de/projekte/'] },
  'aroundtown': { base: 'https://www.aroundtown.de', listings: ['/portfolio/'] },
  'bauwens': { base: 'https://bauwens.de', listings: ['/projekte/'] },
  'ece': { base: 'https://www.ece.com', listings: ['/de/work-live/'] },
  'bueschl': { base: 'https://www.bueschl.de', listings: ['/projekte/'] },
  'bpd-deutschland': { base: 'https://www.bpd.de', listings: ['/projekte/'] },
  'die-wohnkompanie': { base: 'https://www.wohnkompanie.de', listings: ['/projekte/'] },
  'quantum-ag': { base: 'https://www.quantum.ag', listings: ['/projektentwicklung/projekte/'] },
  'dc-developments': { base: 'https://www.dcdevelopments.de', listings: ['/projekte/'] },
  'wilma-wohnen': { base: 'https://www.wilma.de', listings: ['/projekte/'] },
  'strenger-gruppe': { base: 'https://www.strenger.de', listings: ['/projekte/'] },
  'diringer-scheidel': { base: 'https://www.dus.de', listings: ['/projektentwicklung/'] },
  'bl-gruppe': { base: 'https://www.bl-gruppe.de', listings: ['/projekte/'] },
  'rock-capital': { base: 'https://www.rock-capital.de', listings: ['/projekte/'] },
  'hines-germany': { base: 'https://www.hines.com', listings: ['/properties/country/germany'] },
  'kondor-wessels': { base: 'https://www.kondorwessels.com', listings: ['/projekte/'] },
  'lang-und-cie': { base: 'https://www.langundcie.de', listings: ['/projekte/'] },
  'gieag': { base: 'https://www.gieag.de', listings: ['/projekte/'] },
  // UAE
  'aldar-properties': { base: 'https://www.aldar.com', listings: ['/en/explore/residential', '/en/projects'] },
  'emaar-properties': { base: 'https://www.emaar.com', listings: ['/en-ae/properties', '/en-ae', '/projects'] },
  'danube-properties': { base: 'https://www.danubeproperties.com', listings: ['/projects'] },
  'damac-properties': { base: 'https://www.damacproperties.com', listings: ['/en/projects', '/projects'] },
  'sobha-realty': { base: 'https://www.sobharealty.com', listings: ['/projects', '/en'] },
  'tiger-properties': { base: 'https://tigerproperties.ae', listings: ['/projects', '/en'] },
  'select-group': { base: 'https://selectgroup.ae', listings: ['/projects', '/en'] },
  'ellington-properties': { base: 'https://ellingtonproperties.ae', listings: ['/projects', '/en'] },
  'arada': { base: 'https://arada.com', listings: ['/projects', '/en'] },
  'nshama': { base: 'https://nshama.ae', listings: ['/projects', '/en'] },
  'wasl-properties': { base: 'https://waslproperties.ae', listings: ['/projects', '/en'] },
  'binghatti': { base: 'https://binghatti.com', listings: ['/projects'] },
  'samana-developers': { base: 'https://samanadevelopers.com', listings: ['/projects'] },
  // Global
  'related-companies': { base: 'https://www.related.com', listings: ['/our-portfolio'] },
  'brookfield': { base: 'https://www.brookfieldproperties.com', listings: ['/en/our-portfolio.html'] },
  'hines': { base: 'https://www.hines.com', listings: ['/properties'] },
  'lendlease': { base: 'https://www.lendlease.com', listings: ['/projects/'] },
  'berkeley-group': { base: 'https://www.berkeleygroup.co.uk', listings: ['/developments'] },
  'ballymore': { base: 'https://www.ballymoregroup.com', listings: ['/developments'] },
}

const KORTER_CITY: Record<string, string> = {
  'თბილისი': 'tbilisi',
  'ბათუმი': 'batumi',
  'რუსთავი': 'rustavi',
  'ქუთაისი': 'kutaisi',
  'თელავი': 'telavi',
  'ბაკურიანი': 'bakuriani',
  'გუდაური': 'gudauri',
  'შეკვეტილი': 'shekvetili',
  'ქობულეთი': 'kobuleti',
  'წიხისძირი': 'tsikhisdziri',
  'გონიო': 'gonio',
  'წყნეთი': 'tskneti',
  'კვარიათი': 'kvariati',
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/m²/g, 'm2')
    .replace(/straße/g, 'strasse')
    .split(/[^a-z0-9äöüß]+/)
    .filter((t) => t.length > 2 && !['and', 'the', 'von', 'der', 'die', 'das', 'quartier', 'strasse', 'project', 'residence', 'berlin', 'gmbh', 'group', 'development', 'holding', 'tbilisi', 'batumi'].includes(t))
}

function extractPageImages(html: string, pageUrl: string): string[] {
  const list: string[] = []
  const push = (u: string | undefined | null) => {
    if (!u) return
    try {
      const full = new URL(u.trim(), pageUrl).toString()
      if (/\.(svg|gif|ico)([?#]|$)/i.test(full)) return
      if (/logo|icon|avatar|badge|footer|arrow|button|placeholder|sprite|map|diagram/i.test(full)) return
      if (!list.includes(full)) list.push(full)
    } catch {}
  }

  // og:image / twitter:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                  html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (ogMatch?.[1]) push(ogMatch[1])

  // JSON-LD
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1]!)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const it of items) {
        if (typeof it?.image === 'string') push(it.image)
        if (Array.isArray(it?.image)) for (const img of it.image) if (typeof img === 'string') push(img)
      }
    } catch {}
  }

  // <img> tags
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const src = tag.match(/\b(?:data-src|data-original|data-lazy-src|src)=["']([^"']+)["']/i)?.[1]
    push(src)
  }

  return list.slice(0, 10)
}

export type FetchedResult = {
  heroBuffer?: Buffer
  galleryBuffers: Buffer[]
  source: string
  sourceUrl: string
}

/** 1. Search Developer Website */
async function searchDeveloperSite(p: Project): Promise<FetchedResult | null> {
  const cfg = DEV_SITES[p.developerSlug || '']
  const startUrls = cfg ? cfg.listings.map((l) => (l.startsWith('http') ? l : cfg.base + l)) : []
  if (p.sourceUrl && !p.sourceUrl.endsWith('.pdf')) startUrls.unshift(p.sourceUrl)
  if (startUrls.length === 0) return null

  const targetTokens = tokens(p.name)
  if (targetTokens.length === 0) return null

  const candidates: string[] = []

  for (const startUrl of startUrls) {
    const html = await fetchText(startUrl)
    if (!html) continue

    const pageImgs = extractPageImages(html, startUrl)
    if (pageImgs.length > 0 && startUrl !== cfg?.base) {
      const pageTokens = tokens(startUrl)
      const hits = targetTokens.filter((t) => pageTokens.includes(t))
      if (hits.length >= Math.min(2, targetTokens.length)) {
        const heroBuf = await fetchBuffer(pageImgs[0]!)
        if (heroBuf) {
          const galleries: Buffer[] = []
          for (let i = 1; i < Math.min(3, pageImgs.length); i++) {
            const gBuf = await fetchBuffer(pageImgs[i]!)
            if (gBuf) galleries.push(gBuf)
          }
          return { heroBuffer: heroBuf, galleryBuffers: galleries, source: 'official', sourceUrl: startUrl }
        }
      }
    }

    for (const m of html.matchAll(/href="([^"#]+)"/g)) {
      try {
        const link = new URL(m[1]!, startUrl).toString()
        if (link.startsWith('http') && !candidates.includes(link)) {
          const linkTokens = tokens(link)
          const hits = targetTokens.filter((t) => linkTokens.includes(t))
          if (hits.length >= Math.min(2, targetTokens.length)) candidates.push(link)
        }
      } catch {}
    }
  }

  for (const candUrl of candidates.slice(0, 3)) {
    const candHtml = await fetchText(candUrl)
    if (!candHtml) continue
    const imgs = extractPageImages(candHtml, candUrl)
    if (imgs.length > 0) {
      const heroBuf = await fetchBuffer(imgs[0]!)
      if (heroBuf) {
        const galleries: Buffer[] = []
        for (let i = 1; i < Math.min(3, imgs.length); i++) {
          const gBuf = await fetchBuffer(imgs[i]!)
          if (gBuf) galleries.push(gBuf)
        }
        return { heroBuffer: heroBuf, galleryBuffers: galleries, source: 'official', sourceUrl: candUrl }
      }
    }
  }

  return null
}

/** 2. Search Korter.ge (For Georgian Projects) */
async function searchKorter(p: Project): Promise<FetchedResult | null> {
  const city = KORTER_CITY[p.city] || 'tbilisi'
  const targetTokens = tokens(p.name)
  const slugVariants = [p.slug, p.slug.replace(/-\d+$/, ''), targetTokens.join('-')]

  for (const variant of [...new Set(slugVariants)]) {
    for (const c of [city, 'tbilisi', 'batumi']) {
      const url = `https://korter.ge/en/${variant}-${c}`
      const html = await fetchText(url)
      if (!html) continue
      const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').toLowerCase()
      if (targetTokens.some((t) => title.includes(t))) {
        const imgs = extractPageImages(html, url)
        if (imgs.length > 0) {
          const heroBuf = await fetchBuffer(imgs[0]!)
          if (heroBuf) {
            const galleries: Buffer[] = []
            for (let i = 1; i < Math.min(3, imgs.length); i++) {
              const gBuf = await fetchBuffer(imgs[i]!)
              if (gBuf) galleries.push(gBuf)
            }
            return { heroBuffer: heroBuf, galleryBuffers: galleries, source: 'korter', sourceUrl: url }
          }
        }
      }
    }
  }
  return null
}

/** 3. Search Wikipedia */
async function searchWikipedia(query: string, lang: 'de' | 'en' | 'ka'): Promise<{ title: string; imgUrl: string; pageUrl: string } | null> {
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=4&format=json`
  const text = await fetchText(searchUrl)
  if (!text) return null
  try {
    const json = JSON.parse(text)
    const hits = json.query?.search ?? []
    for (const h of hits) {
      const title = h.title
      if (!title || /liste\s+von|dispute|category:|portal:/i.test(title)) continue
      const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
      const sumText = await fetchText(sumUrl)
      if (!sumText) continue
      const sum = JSON.parse(sumText)
      const img = sum.originalimage?.source || sum.thumbnail?.source
      if (img && !img.endsWith('.svg')) {
        const page = sum.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
        return { title, imgUrl: img, pageUrl: page }
      }
    }
  } catch {
    return null
  }
  return null
}

/** 4. Search Wikimedia Commons */
async function searchCommons(query: string): Promise<Array<{ title: string; url: string }>> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' -icon -map -plan filetype:bitmap')}&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&format=json`
  const text = await fetchText(url)
  if (!text) return []
  try {
    const json = JSON.parse(text)
    const pages = Object.values(json.query?.pages ?? {}) as any[]
    const results: Array<{ title: string; url: string }> = []
    for (const p of pages) {
      const info = p.imageinfo?.[0]
      if (info?.url && !info.url.endsWith('.svg') && info.size > 20_000) {
        const t = (p.title || '').toLowerCase()
        if (/logo|map|diagram|floor|plan|icon|coat_of_arms|flag/i.test(t)) continue
        results.push({ title: p.title, url: info.url })
      }
    }
    return results
  } catch {
    return []
  }
}

export async function findProjectPhotosUniversal(p: Project): Promise<FetchedResult | null> {
  const isGerman = p.city === 'ბერლინი' || p.city === 'Berlin' || p.cc === 'DE' || ['Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'].includes(p.city)
  const isGeorgian = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'ბაკურიანი', 'გუდაური', 'გონიო', 'კვარიათი', 'ჩაქვი', 'ქობულეთი', 'თელავი'].includes(p.city) || (p.location?.includes('თბილის') || p.location?.includes('ბათუმ'))

  // 1. Try developer site
  const devHit = await searchDeveloperSite(p)
  if (devHit) return devHit

  // 2. Try Korter if Georgian
  if (isGeorgian) {
    const korterHit = await searchKorter(p)
    if (korterHit) return korterHit
  }

  // 3. Build Wikipedia & Commons queries
  const queries: string[] = []
  const cleanName = p.name.replace(/\([^)]*\)/g, '').replace(/WBM |HOWOGE |BUWOG |Instone |Covivio |Pandion |Degewo |Gewobag |Stadt und Land /gi, '').trim()
  
  if (isGerman) {
    const city = p.city === 'ბერლინი' ? 'Berlin' : p.city
    queries.push(`${cleanName} ${city}`)
    queries.push(`${p.name} ${city}`)
    queries.push(cleanName)
  } else if (isGeorgian) {
    queries.push(`${p.name} ${p.city}`)
    queries.push(p.name)
    queries.push(cleanName)
  } else {
    queries.push(`${p.name} ${p.city || ''}`.trim())
    queries.push(p.name)
    if (p.location) {
      const loc = p.location.split(',')[0]?.trim()
      if (loc && loc !== p.name) queries.push(`${p.name} ${loc}`)
    }
  }

  const uniqueQueries = [...new Set(queries.filter(Boolean))]

  for (const q of uniqueQueries) {
    if (isGerman) {
      const wikiDe = await searchWikipedia(q, 'de')
      if (wikiDe) {
        const buf = await fetchBuffer(wikiDe.imgUrl)
        if (buf) {
          const commons = await searchCommons(q)
          const galleries: Buffer[] = []
          for (const c of commons.slice(0, 2)) {
            const gBuf = await fetchBuffer(c.url)
            if (gBuf) galleries.push(gBuf)
          }
          return { heroBuffer: buf, galleryBuffers: galleries, source: 'wikipedia-de', sourceUrl: wikiDe.pageUrl }
        }
      }
    }

    const wikiEn = await searchWikipedia(q, 'en')
    if (wikiEn) {
      const buf = await fetchBuffer(wikiEn.imgUrl)
      if (buf) {
        const commons = await searchCommons(q)
        const galleries: Buffer[] = []
        for (const c of commons.slice(0, 2)) {
          const gBuf = await fetchBuffer(c.url)
          if (gBuf) galleries.push(gBuf)
        }
        return { heroBuffer: buf, galleryBuffers: galleries, source: 'wikipedia-en', sourceUrl: wikiEn.pageUrl }
      }
    }
  }

  for (const q of uniqueQueries) {
    const commons = await searchCommons(q)
    if (commons.length > 0) {
      const heroBuf = await fetchBuffer(commons[0]!.url)
      if (heroBuf) {
        const galleries: Buffer[] = []
        for (let i = 1; i < Math.min(3, commons.length); i++) {
          const gBuf = await fetchBuffer(commons[i]!.url)
          if (gBuf) galleries.push(gBuf)
        }
        return {
          heroBuffer: heroBuf,
          galleryBuffers: galleries,
          source: 'wikimedia-commons',
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(commons[0]!.title)}`,
        }
      }
    }
  }

  return null
}

async function saveWebp(buf: Buffer, targetPath: string, width = 680, quality = 48): Promise<number> {
  try {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
    const out = await sharp(buf)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(targetPath)
    return out.size
  } catch {
    return 0
  }
}

export async function processProjectUniversal(p: Project, opts: { forceHero?: boolean; forceGallery?: boolean } = {}): Promise<{ hero: boolean; galleries: string[]; source?: string }> {
  const heroPath = path.join(OUT_DIR, `${p.slug}.webp`)
  const result = await findProjectPhotosUniversal(p)
  if (!result || !result.heroBuffer) return { hero: false, galleries: [] }

  let savedHero = false
  if (opts.forceHero || !fs.existsSync(heroPath) || fs.statSync(heroPath).size < 16000) {
    const sz = await saveWebp(result.heroBuffer, heroPath, 680, 48)
    savedHero = sz > 0
  }

  const savedGalleries: string[] = []
  for (let i = 0; i < result.galleryBuffers.length; i++) {
    const gRel = `/images/projects/${p.slug}-g${i + 1}.webp`
    const gAbs = path.join(ROOT, 'public', gRel)
    const sz = await saveWebp(result.galleryBuffers[i]!, gAbs, 640, 45)
    if (sz > 0) savedGalleries.push(gRel)
  }

  return {
    hero: savedHero,
    galleries: savedGalleries,
    source: result.source,
  }
}
