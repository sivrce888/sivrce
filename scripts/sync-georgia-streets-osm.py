#!/usr/bin/env python3
"""
Country-wide OSM street sync: fill street gaps for every catalog city in
georgia-locations.json (competitor scrape covers only 60 cities, thin in small
towns). One bbox Overpass query per element kind → nearest-place assignment
(city 12km / town 7km / village-resort 4km) → union into georgia-streets.json.

Run: python3 scripts/sync-georgia-streets-osm.py
ponytail: თბილისი excluded — its OSM catalog is owned by
sync-tbilisi-streets-osm.py; ways whose nearest place is Tbilisi are dropped.
"""
from __future__ import annotations

import json
import math
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCATIONS_PATH = ROOT / 'app/src/data/georgia-locations.json'
STREETS_PATH = ROOT / 'app/src/data/georgia-streets.json'
CACHE_PATH = ROOT / 'scripts/georgia-streets-osm.json'

UA = 'sivrce-streets/1.0 (sivrce888@gmail.com)'
ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
]
# Georgia bbox
BBOX = (41.05, 39.95, 43.65, 46.85)
KEEP_HWY = (
    'motorway|trunk|primary|secondary|tertiary|unclassified|residential'
    '|living_street|pedestrian|road|motorway_link|trunk_link|primary_link'
    '|secondary_link|tertiary_link'
)
RADII_M = {'city': 12000, 'town': 7000, 'village': 4000}
TBILISI = 'თბილისი'
# ყაზბეგი city is named სტეფანწმინდა in OSM; ახალ ათონი → ახალი ათონი.
NAME_ALIAS = {'ყაზბეგი': ['სტეფანწმინდა'], 'ახალ ათონი': ['ახალი ათონი']}
ALIAS_SET = {v for vs in NAME_ALIAS.values() for v in vs}
# Assignment competitor for Tbilisi itself (owned by tbilisi-streets sync) —
# without it, Tbilisi-edge ways leak into მცხეთა at the 12km radius.
TBILISI_NODE = {'lat': 41.7151, 'lon': 44.8271, 'kind': 'city', 'r': 20000}
# Tbilisi city extent (excludes მცხეთა at 41.846+; covers Avchala 41.829).
TBILISI_BBOX = (41.62, 44.72, 41.83, 45.00)
# Street-type words that make a dashed name a real street, not a route label
# ('ბათუმი — ახალციხე', 'ახმეტა-თელავი-ბაკურციხე').
STREET_WORDS = (
    'ქუჩა', 'გამზირი', 'ხეივანი', 'მოედანი', 'გზატკეცილი', 'ჩიხი',
    'ასასვლელი', 'მისასვლელი', 'ტრაქტი', 'ბულვარი', 'შესახვევი', 'გზა',
    'ხიდი', 'ბაგები', 'აღმართი',
)


def is_route_label(ka: str) -> bool:
    if '—' in ka or '–' in ka:  # em/en dash: 'ბათუმი — ახალციხე', '… კმ 8 – რუფოთი…'
        return True
    if 'კმ ' in ka:  # highway segment marker ('გზის კმ 8')
        return True
    if len(ka) > 60:  # real street names are short; longer = maintenance segment labels
        return True
    return '-' in ka and not any(w in ka for w in STREET_WORDS)


def overpass(query: str) -> list:
    data = f'[out:json][timeout:600];{query}'
    body = urllib.parse.urlencode({'data': data}).encode()
    last_err = None
    for ep in ENDPOINTS:
        for attempt in range(4):
            try:
                req = urllib.request.Request(
                    ep, data=body,
                    headers={'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded'},
                )
                with urllib.request.urlopen(req, timeout=620) as res:
                    return json.load(res).get('elements') or []
            except Exception as e:  # noqa: BLE001 — retry mirror of tbilisi sync
                last_err = e
                time.sleep(5 * (attempt + 1))
            time.sleep(2)
    raise RuntimeError(f'overpass failed: {last_err}')


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def is_ka(s: str) -> bool:
    return any('\u10a0' <= c <= '\u10ff' for c in s)


def clean(ka: str) -> str:
    return ' '.join(ka.split())


def main() -> None:
    loc = json.loads(LOCATIONS_PATH.read_text())
    streets_doc = json.loads(STREETS_PATH.read_text())
    catalog = {c for c in loc['cities'] if c != TBILISI}
    existing: dict[str, list] = streets_doc.get('streets') or {}
    before_total = sum(len(v) for v in existing.values())

    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text())
        place_els, way_els = cache['places'], cache['ways']
        print(f'using cache {CACHE_PATH}')
    else:
        s, w, n, e = BBOX
        print('overpass: place nodes…', flush=True)
        place_els = overpass(
            f'node["place"~"^(city|town|village)$"]({s},{w},{n},{e});out;'
        )
        print(f'  {len(place_els)} place nodes')
        print('overpass: named highways (country-wide)…', flush=True)
        # Overpass regexes reject multibyte ranges ([ა-ჰ] = static error) —
        # pull all named highways, filter Georgian script locally.
        hwy = f'["highway"~"^({KEEP_HWY})$"]'
        way_els = overpass(
            f'way{hwy}["name"]({s},{w},{n},{e});out center tags;'
            f'way{hwy}["name:ka"]({s},{w},{n},{e});out center tags;'
        )
        print(f'  {len(way_els)} way elements')
        CACHE_PATH.write_text(json.dumps({'places': place_els, 'ways': way_els}, ensure_ascii=False))

    # ——— catalog city → OSM place node ———
    places: dict[str, dict] = {}
    for el in place_els:
        tags = el.get('tags') or {}
        for name in (tags.get('name:ka'), tags.get('name')):
            if name and (name in catalog or name in ALIAS_SET):
                kind = tags.get('place')
                if name not in places or kind == 'city':
                    places[name] = {'lat': el['lat'], 'lon': el['lon'], 'kind': kind}
    aliased = {v: k for k, vs in NAME_ALIAS.items() for v in vs}
    for osm_name, p in list(places.items()):
        if osm_name in aliased and aliased[osm_name] in catalog and aliased[osm_name] not in places:
            places[aliased[osm_name]] = p
    # Keep only catalog spellings as place keys — OSM aliases must not win
    # nearest-place ties and leak in as bogus city keys.
    for osm_name in aliased:
        places.pop(osm_name, None)
    missing = sorted(catalog - set(places))
    if missing:
        print(f'no OSM place node (skipped): {", ".join(missing)}')

    # ——— assign ways to nearest place ———
    matched: dict[str, set] = defaultdict(set)
    skipped_tbilisi = 0
    beyond_radius = 0
    for el in way_els:
        tags = el.get('tags') or {}
        ka = clean(tags.get('name:ka') or (tags.get('name') or ''))
        if not ka or not is_ka(ka) or len(ka) < 2:
            continue
        c = el.get('center') or {}
        lat, lon = c.get('lat'), c.get('lon')
        if lat is None:
            continue
        s0, w0, n0, e0 = TBILISI_BBOX
        if s0 <= lat <= n0 and w0 <= lon <= e0:
            skipped_tbilisi += 1
            continue
        best, best_d = None, 1e18
        for name, p in places.items():
            d = haversine_m(lat, lon, p['lat'], p['lon'])
            if d < best_d:
                best, best_d = name, d
        if not best:
            continue
        if best_d > RADII_M.get(places[best]['kind'], 4000):
            beyond_radius += 1
            continue
        # drop the city itself in locative dress (competitor noise: 'აბასთუმანში',
        # OSM-side alias inflection: 'სტეფანწმინდაში')
        alt = next((k for k, v in aliased.items() if v == best), None)
        if ka in (best + 'ში', best + 'ზე') or (alt and ka in (alt + 'ში', alt + 'ზე')):
            continue
        if is_route_label(ka):
            continue
        matched[best].add(ka)

    # ——— merge: competitor names preserved, OSM union, locative noise scrubbed ———
    out: dict[str, list] = {}
    added = scrubbed = 0
    for city in sorted(set(existing) | set(matched), key=lambda x: 0):
        if city != TBILISI and city not in catalog:
            continue  # stale/bogus keys from earlier merges; matched re-homes their streets
        names: set = set()
        city_ka = city
        for old in existing.get(city, []):
            old = clean(old)
            if old in (city_ka + 'ში', city_ka + 'ზე') or is_route_label(old):
                scrubbed += 1
                continue
            names.add(old)
        for nm in matched.get(city, set()):
            if nm not in names:
                added += 1
            names.add(nm)
        if names:
            out[city] = sorted(names, key=lambda x: x)
    total = sum(len(v) for v in out.values())
    streets_doc['streets'] = out
    streets_doc['source'] = (
        'Competitor catalog (api-locations.tnet.ge + home.ss.ge, sync-competitor-locations.py)'
        ' ∪ OSM named highways, nearest-place assignment ≤12/7/4km'
        ' (ODbL, 2026-09-26, sync-georgia-streets-osm.py). Tbilisi: tbilisi-streets.ts.'
    )
    STREETS_PATH.write_text(json.dumps(streets_doc, ensure_ascii=False, indent=2) + '\n')

    print(f'\ncities with streets: {len(out)} (was {sum(1 for v in existing.values() if v)})')
    print(f'streets: {total} (was {before_total}, +{added}, scrubbed {scrubbed} locative)')
    print(f'dropped: {skipped_tbilisi} tbilisi-owned, {beyond_radius} beyond radius')
    empty = sorted(catalog - {aliased.get(k, k) for k in matched})
    print(f'catalog cities still streetless: {len(empty)}')


if __name__ == '__main__':
    main()
