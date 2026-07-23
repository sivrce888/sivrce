#!/usr/bin/env python3
"""
Fetch OSM highway centers for Tbilisi, PIP against official 10 raions,
nearest ubani label within that raion → district slug. Then regenerate
tbilisi-streets-osm.json + app/src/data/tbilisi-streets.{json,ts}.

Run: python3 scripts/sync-tbilisi-streets-osm.py
ponytail: committed snapshot, no runtime Overpass. Re-run when OSM drifts.
"""
from __future__ import annotations

import json
import math
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAIONS_PATH = ROOT / 'app/src/data/tbilisi-raions.json'
LABELS_PATH = ROOT / 'app/src/data/district-labels.ts'
OSM_OUT = ROOT / 'scripts/tbilisi-streets-osm.json'
JSON_OUT = ROOT / 'app/src/data/tbilisi-streets.json'
TS_OUT = ROOT / 'app/src/data/tbilisi-streets.ts'

UA = 'sivrce-streets/1.0 (sivrce888@gmail.com)'
ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
]
# Tbilisi metro bbox (same as fetch-pois)
TBI = dict(s=41.62, w=44.65, n=41.86, e=45.08)

# SEO / catalog slug spellings (keep chughureti hyphen forms)
RAION_SLUG_FIX = {'chugureti': 'chughureti'}
LABEL_SLUG_FIX = {'chugureti': 'chughureti'}

# Must match app/src/lib/seo-pages.ts DISTRICTS (tbilisi) — street pages 404 otherwise.
SEO_DISTRICT_SLUGS = {
    'vake', 'saburtalo', 'mtatsminda', 'didi-dighomi', 'ortachala', 'isani', 'gldani',
    'krtsanisi', 'avlabari', 'tskneti', 'tskhvarichamia', 'old-tbilisi', 'varketili',
    'chughureti', 'nadzaladevi', 'didube', 'vera', 'digomis-masivi', 'baghebi',
    'nutsubidze', 'vashlijvari', 'samgori', 'temka', 'mukhiani', 'vazisubani',
}

# Portal-critical overrides when OSM center sits on a raion border / wrong leaf
HAND_OVERRIDE = {
    'ვაჟა-ფშაველას გამზირი': 'saburtalo',  # straddles Vake/Saburtalo; portals: Saburtalo
}

GE2LAT = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i',
    'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's',
    'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts',
    'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
}

# ——— geometry ———

def point_in_ring(lon: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    for i in range(n - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > lat) != (y2 > lat):
            xinters = (x2 - x1) * (lat - y1) / (y2 - y1 + 1e-15) + x1
            if lon < xinters:
                inside = not inside
    return inside


def load_raions():
    fc = json.loads(RAIONS_PATH.read_text())
    out = []
    for f in fc['features']:
        slug = RAION_SLUG_FIX.get(f['properties']['slug'], f['properties']['slug'])
        name = f['properties']['name']
        geom = f['geometry']
        polys = []
        if geom['type'] == 'Polygon':
            polys.append(geom['coordinates'])
        else:
            polys.extend(geom['coordinates'])
        out.append({'slug': slug, 'name': name, 'polys': polys})
    return out


def locate_raion(lon: float, lat: float, raions):
    for r in raions:
        for rings in r['polys']:
            if point_in_ring(lon, lat, rings[0]) and all(
                not point_in_ring(lon, lat, h) for h in rings[1:]
            ):
                return r['slug'], r['name']
    return None, None


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def load_labels(raions):
    """Parse district-labels.ts + attach containing raion."""
    text = LABELS_PATH.read_text()
    # { slug: 'vake', name: { ka: 'ვაკე', en: 'Vake' }, coords: { lat: 41.7, lng: 44.7 } },
    pat = re.compile(
        r"slug:\s*'([^']+)'.*?ka:\s*'([^']+)'.*?lat:\s*([0-9.]+),\s*lng:\s*([0-9.]+)",
        re.S,
    )
    labels = []
    for m in pat.finditer(text):
        slug, ka, lat, lng = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
        rslug, _ = locate_raion(lng, lat, raions)
        labels.append({'slug': slug, 'ka': ka, 'lat': lat, 'lng': lng, 'raion': rslug})
    return labels


def pick_district(lon: float, lat: float, raions, labels) -> str | None:
    rslug, _ = locate_raion(lon, lat, raions)
    if not rslug:
        return None
    # Nearest label in same raion (ubani). Only keep if it is an SEO district slug;
    # otherwise street pages under /tbilisi/{district}/{street} 404.
    best = None
    best_d = 1e18
    for lab in labels:
        if lab['raion'] != rslug:
            continue
        d = haversine_m(lat, lon, lab['lat'], lab['lng'])
        if d < best_d:
            best_d = d
            best = lab
    if best and best_d <= 2500:
        slug = LABEL_SLUG_FIX.get(best['slug'], best['slug'])
        if slug in SEO_DISTRICT_SLUGS:
            return slug
        # Non-SEO leaf (კუკია, ლოტკინი, …) → map a few portals to SEO parents
        leaf_to_seo = {
            'sololaki': 'mtatsminda',
            'abanotubani': 'old-tbilisi',
            'metekhi': 'avlabari',
            'ortachala': 'ortachala',
            'varketili': 'varketili',
            'mesame-masivi': 'varketili',
            'lilo': 'samgori',
            'navtlughi': 'isani',
            'elia': 'isani',
            'kukia': 'chughureti',
            'ivertubani': 'chughureti',
            'lotkini': 'nadzaladevi',
            'sanzona': 'nadzaladevi',
            'zghvisubani': 'nadzaladevi',
            'gldanis-masivi': 'gldani',
            'avchala': 'gldani',
            'dighomi': 'didi-dighomi',
            'sopeli-dighomi': 'didi-dighomi',
            'zurgovana': 'didi-dighomi',
            'dighmis-chala': 'didi-dighomi',
            'lisi': 'saburtalo',
            'vedzisi': 'saburtalo',
            'vazha-pshavela': 'saburtalo',
            'ponichala': 'krtsanisi',
        }
        if slug in leaf_to_seo:
            return leaf_to_seo[slug]
    return rslug


# ——— overpass ———

def overpass(query: str) -> list:
    data = f'[out:json][timeout:90];{query}'
    body = urllib.parse.urlencode({'data': data}).encode()
    last_err = None
    for ep in ENDPOINTS:
        for attempt in range(4):
            try:
                req = urllib.request.Request(
                    ep, data=body, headers={'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded'}
                )
                with urllib.request.urlopen(req, timeout=120) as res:
                    payload = json.load(res)
                return payload.get('elements') or []
            except Exception as e:  # noqa: BLE001 — retry mirror
                last_err = e
                time.sleep(3 * (attempt + 1))
        time.sleep(2)
    raise RuntimeError(f'overpass failed: {last_err}')


def elements_to_ways(els: list) -> list[dict]:
    rows = []
    for el in els:
        tags = el.get('tags') or {}
        ka = (tags.get('name:ka') or '').strip()
        if not ka:
            continue
        c = el.get('center') or {}
        lat, lon = c.get('lat'), c.get('lon')
        if lat is None or lon is None:
            continue
        rows.append({
            'ka': ka,
            'en': (tags.get('name:en') or '').strip(),
            'ru': (tags.get('name:ru') or '').strip(),
            'lat': lat,
            'lon': lon,
        })
    return rows


def fetch_ways(cache: Path | None = None) -> list[dict]:
    # ponytail: one bbox query (~3s) beats 77 tiles that trip Overpass rate limits.
    if cache and cache.exists():
        print(f'  using cache {cache}')
        els = json.loads(cache.read_text()).get('elements') or []
        return elements_to_ways(els)
    s, w, n, e = TBI['s'], TBI['w'], TBI['n'], TBI['e']
    q = f'way["highway"]["name:ka"]({s},{w},{n},{e});out center tags;'
    print('  overpass single bbox…', flush=True)
    els = overpass(q)
    if cache:
        cache.write_text(json.dumps({'elements': els}, ensure_ascii=False))
    return elements_to_ways(els)


def aggregate(ways: list[dict], raions, labels) -> list[dict]:
    by_ka: dict[str, list] = defaultdict(list)
    for w in ways:
        by_ka[w['ka']].append(w)

    out = []
    for ka, parts in by_ka.items():
        votes = Counter()
        lat_sum = lon_sum = 0.0
        en = ru = ''
        for p in parts:
            lat_sum += p['lat']
            lon_sum += p['lon']
            if p['en'] and not en:
                en = p['en']
            if p['ru'] and not ru:
                ru = p['ru']
            d = HAND_OVERRIDE.get(ka) or pick_district(p['lon'], p['lat'], raions, labels)
            if d:
                votes[d] += 1
        n = len(parts)
        district = votes.most_common(1)[0][0] if votes else None
        if ka in HAND_OVERRIDE:
            district = HAND_OVERRIDE[ka]
        out.append({
            'ka': ka,
            'en': en,
            'ru': ru,
            'int': '',
            'n': n,
            'lat': round(lat_sum / n, 6),
            'lon': round(lon_sum / n, 6),
            'district': district,
        })
    out.sort(key=lambda r: (-r['n'], r['ka']))
    return out


# ——— codegen (from gen-tbilisi-streets.py, kept in sync) ———

def translit(s: str) -> str:
    return ''.join(GE2LAT.get(c, c) for c in s)


def slugify(ka: str) -> str:
    s = translit(ka).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def ts_str(s: str) -> str:
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


def write_ts(rows: list[dict]) -> None:
    lines = []
    lines.append('/**')
    lines.append(' * SIVRCE — Tbilisi street catalog (programmatic SEO).')
    lines.append(f' * Generated from OSM highways + raion PIP ({len(rows)} names).')
    lines.append(' * Slugs = Georgian→Latin transliteration; collisions get -N suffix.')
    lines.append(' *')
    lines.append(' * ponytail: district = majority OSM way center → official raion')
    lines.append(' * PIP, then nearest ubani label in that raion (≤2.5km). Re-run')
    lines.append(' * scripts/sync-tbilisi-streets-osm.py to refresh from live OSM.')
    lines.append(' */')
    lines.append('')
    lines.append("import { LISTINGS, type Listing } from '@/data/listings'")
    lines.append("import { canonicalizeDistrict } from '@/lib/district-canon'")
    lines.append('')
    lines.append('export interface TbilisiStreet {')
    lines.append('  slug: string')
    lines.append('  ka: string')
    lines.append('  en: string')
    lines.append('  district?: string')
    lines.append('}')
    lines.append('')
    lines.append('export const STREETS: TbilisiStreet[] = [')

    seen: dict[str, int] = {}
    for r in rows:
        ka = r['ka'].strip()
        if not re.search(r'[Ⴠ-ჿ]', ka):
            continue
        if '—' in ka:
            continue
        slug = slugify(ka)
        if not slug:
            continue
        if slug in seen:
            seen[slug] += 1
            slug = f'{slug}-{seen[slug]}'
        else:
            seen[slug] = 1
        entry = f"  {{ slug: {ts_str(slug)}, ka: {ts_str(ka)}, en: {ts_str(r.get('en') or '')}"
        if r.get('district'):
            entry += f", district: {ts_str(r['district'])}"
        entry += ' },'
        lines.append(entry)
    lines.append(']')
    lines.append('')
    lines.append('/** Approximate district centers — used for the district weather badge. */')
    lines.append('export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {')
    coords = {
        'vake': (41.707, 44.766), 'saburtalo': (41.724, 44.752), 'mtatsminda': (41.699, 44.786),
        'old-tbilisi': (41.694, 44.802), 'avlabari': (41.693, 44.815), 'isani': (41.682, 44.838),
        'ortachala': (41.683, 44.823), 'gldani': (41.792, 44.812), 'didi-dighomi': (41.775, 44.762),
        'chughureti': (41.713, 44.803), 'nadzaladevi': (41.738, 44.788), 'varketili': (41.688, 44.868),
        'tskneti': (41.731, 44.692), 'tskhvarichamia': (41.752, 44.657),
        'samgori': (41.685, 44.855), 'didube': (41.735, 44.781), 'krtsanisi': (41.673, 44.817),
        'digomis-masivi': (41.763, 44.775), 'vazisubani': (41.704, 44.849),
        'nutsubidze': (41.734, 44.725), 'vazha-pshavela': (41.724, 44.730),
        'vashlijvari': (41.755, 44.766), 'lilo': (41.709, 44.984), 'zghvisubani': (41.779, 44.812),
    }
    for k, (lat, lng) in coords.items():
        lines.append(f"  {ts_str(k)}: {{ lat: {lat}, lng: {lng} }},")
    lines.append('}')
    lines.append('')
    lines.append('export function getStreet(slug: string): TbilisiStreet | undefined {')
    lines.append('  return STREETS.find((s) => s.slug === slug)')
    lines.append('}')
    lines.append('')
    lines.append('export function streetsOfDistrict(districtSlug: string): TbilisiStreet[] {')
    lines.append("  return STREETS.filter((s) => s.district === districtSlug).sort((a, b) => a.ka.localeCompare(b.ka, 'ka'))")
    lines.append('}')
    lines.append('')
    lines.append("const STREET_SUFFIXES = new Set(['გამზირი', 'ქუჩა', 'ხეივანი', 'სანაპირო', 'გზატკეცილი', 'მოედანი', 'აღმართი', 'დაღმართი', 'შესახვევი', 'გასასვლელი', 'ჩიხი', 'გზა', 'I', 'II', 'III', 'IV', 'V'])")
    lines.append('')
    lines.append('const STREET_TYPES = [')
    lines.append("  'გამზირი', 'ქუჩა', 'ხეივანი', 'სანაპირო', 'გზატკეცილი', 'მოედანი', 'შესახვევი', 'გასასვლელი', 'ჩიხი',")
    lines.append('] as const')
    lines.append('')
    lines.append('/** Abbrev + case fold so „ჭავჭავაძის გამზ." hits catalog „ილია ჭავჭავაძის გამზირი". */')
    lines.append('function normStreetKa(s: string): string {')
    lines.append('  return s')
    lines.append('    .trim()')
    lines.append('    .toLowerCase()')
    lines.append("    .replace(/გამზ\\.?/gu, 'გამზირი')")
    lines.append("    .replace(/(?:^|\\s)ქ\\.?(?=\\s|$)/gu, ' ქუჩა')")
    lines.append("    .replace(/\\s+/g, ' ')")
    lines.append('    .trim()')
    lines.append('}')
    lines.append('')
    lines.append('export function streetCore(ka: string): string {')
    lines.append('  const words = ka.split(/\\s+/).filter((w) => !STREET_SUFFIXES.has(w))')
    lines.append('  return words[words.length - 1] ?? ka')
    lines.append('}')
    lines.append('')
    lines.append('/**')
    lines.append(' * Catalog ubani (ka) for a street label — STREETS.district from OSM spatial join.')
    lines.append(' * Short forms OK: „ჭავჭავაძის გამზირი" → ვაკე. Ambiguous bare surname → no guess.')
    lines.append(' */')
    lines.append('export function districtKaForStreet(raw: string): string | undefined {')
    lines.append('  const needle = normStreetKa(raw)')
    lines.append('  if (needle.length < 4) return undefined')
    lines.append('')
    lines.append('  let best: TbilisiStreet | undefined')
    lines.append('  let bestScore = 0')
    lines.append('  const needleType = STREET_TYPES.find((t) => needle.includes(t))')
    lines.append('')
    lines.append('  for (const s of STREETS) {')
    lines.append('    if (!s.district) continue')
    lines.append('    const ka = normStreetKa(s.ka)')
    lines.append('    let score = 0')
    lines.append('    if (ka === needle) score = 1000 + ka.length')
    lines.append('    else if (needle.length >= 8 && ka.endsWith(needle)) score = 500 + needle.length')
    lines.append('    else if (ka.length >= 8 && needle.endsWith(ka)) score = 400 + ka.length')
    lines.append('    else {')
    lines.append('      const core = streetCore(s.ka).toLowerCase()')
    lines.append('      if (core.length < 5 || !needle.includes(core)) continue')
    lines.append('      const streetType = STREET_TYPES.find((t) => ka.includes(t))')
    lines.append('      if (needleType && streetType && needleType !== streetType) continue')
    lines.append('      if (!needleType) continue')
    lines.append('      score = 100 + core.length')
    lines.append('    }')
    lines.append('    if (score > bestScore) {')
    lines.append('      bestScore = score')
    lines.append('      best = s')
    lines.append('    }')
    lines.append('  }')
    lines.append('  return best?.district ? canonicalizeDistrict(best.district) || undefined : undefined')
    lines.append('}')
    lines.append('')
    lines.append('function includesWord(hay: string, needle: string): boolean {')
    lines.append('  let i = hay.indexOf(needle)')
    lines.append('  while (i !== -1) {')
    lines.append("    const before = hay[i - 1] ?? ''")
    lines.append("    const after = hay[i + needle.length] ?? ''")
    lines.append("    if (!/[ა-ჿ]/.test(before) && !/[ა-ჿ]/.test(after)) return true")
    lines.append('    i = hay.indexOf(needle, i + 1)')
    lines.append('  }')
    lines.append('  return false')
    lines.append('}')
    lines.append('')
    lines.append('function coreVariants(core: string): string[] {')
    lines.append('  const out = new Set([core])')
    lines.append('  const chars = [...core]')
    lines.append('  chars.forEach((c, i) => {')
    lines.append("    if (c !== 'ჭ' && c !== 'ჩ') return")
    lines.append('    for (const v of [...out]) {')
    lines.append("      out.add(v.slice(0, i) + (v[i] === 'ჭ' ? 'ჩ' : 'ჭ') + v.slice(i + 1))")
    lines.append('    }')
    lines.append('  })')
    lines.append('  return [...out]')
    lines.append('}')
    lines.append('')
    lines.append('export function listingsOfStreet(street: TbilisiStreet): Listing[] {')
    lines.append('  const variants = coreVariants(streetCore(street.ka))')
    lines.append('  return LISTINGS.filter(')
    lines.append("    (l) => l.city === 'თბილისი' && variants.some((v) => includesWord(l.address, v)),")
    lines.append('  )')
    lines.append('}')
    lines.append('')
    lines.append('export function streetLocative(ka: string): string {')
    lines.append('  const words = ka.split(/\\s+/)')
    lines.append('  const last = words[words.length - 1]!')
    lines.append("  const loc = last.endsWith('ი') ? `${last.slice(0, -1)}ზე` : `${last}ზე`")
    lines.append("  return [...words.slice(0, -1), loc].join(' ')")
    lines.append('}')
    lines.append('')

    TS_OUT.write_text('\n'.join(lines))


def main() -> None:
    print('loading raions + labels…')
    raions = load_raions()
    labels = load_labels(raions)
    print(f'  raions={len(raions)} labels={len(labels)}')

    cache = Path('/tmp/tbilisi-highways.json')
    print('fetching OSM highway centers…')
    ways = fetch_ways(cache)
    print(f'  way segments with name:ka: {len(ways)}')

    rows = aggregate(ways, raions, labels)
    assigned = sum(1 for r in rows if r.get('district'))
    print(f'  unique streets: {len(rows)}, with district: {assigned}')
    print('  top districts:', Counter(r['district'] for r in rows if r.get('district')).most_common(15))

    # spot-check curated streets
    want = {
        'ილია ჭავჭავაძის გამზირი': 'vake',
        'ვაჟა-ფშაველას გამზირი': 'saburtalo',
        'შოთა რუსთაველის გამზირი': 'mtatsminda',
    }
    by = {r['ka']: r.get('district') for r in rows}
    for ka, d in want.items():
        got = by.get(ka)
        print(f'  check {ka}: {got} (want {d})', 'OK' if got == d else 'MISMATCH')

    OSM_OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
    # suggest JSON keeps name fields (+ n); district optional for future
    JSON_OUT.write_text(
        json.dumps(
            [{'ka': r['ka'], 'en': r['en'], 'ru': r['ru'], 'n': r['n'], **({'district': r['district']} if r.get('district') else {})}
             for r in rows if re.search(r'[Ⴠ-ჿ]', r['ka']) and '—' not in r['ka']],
            ensure_ascii=False,
            indent=2,
        )
        + '\n'
    )
    write_ts(rows)
    print('wrote', OSM_OUT)
    print('wrote', JSON_OUT)
    print('wrote', TS_OUT)


if __name__ == '__main__':
    main()
