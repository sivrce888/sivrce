#!/usr/bin/env python3
"""Build app/src/data/georgia-villages.json — every settlement in Georgia by municipality.

Merge priority TNET (myhome picker tree) > SS (home.ss.ge settlements) > OSM
(OpenStreetMap place=village|hamlet, assigned by municipal polygon). TNET wins
conflicts: its naming is what competitor listings are tagged with.

Sources cached under research/: tnet-cities-v2.json + ss-municipality-settlements.json
(sync-competitor-locations.py), osm-villages-ge.json + osm-munis-ge.json (fetched
here on first run, Overpass ODbL).

ponytail: names only, no coords — suggest/autocomplete is the only consumer.
Add [lat,lng] per village when a map/nearby feature needs them.
"""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/src/data/georgia-villages.json'
CACHE = ROOT / 'research'
TNET = CACHE / 'competitor-locations/tnet-cities-v2.json'
SS = CACHE / 'competitor-locations/ss-municipality-settlements.json'
OSM_V = CACHE / 'osm-villages-ge.json'
OSM_M = CACHE / 'osm-munis-ge.json'

KA = re.compile(r'[\u10A0-\u10FF]')
# Search filters reject names with digits/commas (district-canon) — they'd dead-end.
BAD_NAME = re.compile(r'[,\d]')

# OSM/SS municipality name → catalog municipality name (georgia-locations.json).
# Catalog keeps legacy რაიონი spellings for these six + merges de-jure ჯავის
# რაიონი into ცხინვალის რაიონი (TNET/competitor tree has no separate Java entry).
MUNI_MAP = {
  'სენაკის მუნიციპალიტეტი': 'სენაკის რაიონი',
  'დმანისის მუნიციპალიტეტი': 'დმანისის რაიონი',
  'ნინოწმინდის მუნიციპალიტეტი': 'ნინოწმინდის რაიონი',
  'ონის მუნიციპალიტეტი': 'ონის რაიონი',
  'საჩხერის მუნიციპალიტეტი': 'საჩხერის რაიონი',
  'ჯავის მუნიციპალიტეტი': 'ცხინვალის რაიონი',
  # Abkhazia — OSM relations carry Abkhaz-script names, no name:ka.
  'გაგრის რაიონი': 'გაგრის მუნიციპალიტეტი',
  'Гал араион': 'გალის მუნიციპალიტეტი',
  'Очамчыра араион': 'ოჩამჩირის მუნიციპალიტეტი',
  'Тҟәарчал араион': 'ტყვარჩელის მუნიციპალიტეტი',
}
# De-facto duplicates / containers — never village parents.
MUNI_SKIP = {'ყორნისის რაიონი', 'ქუთაისის მუნიციპალიტეტი', 'აფხაზეთის ავტონომიური რესპუბლიკა', 'უცხოეთი'}

# Verified famous settlements all three sources miss (OSM tags them oddly,
# TNET/SS omit them). Keep to hand-checked names only — no bulk import.
EXTRA_VILLAGES = {
  'ყაზბეგის მუნიციპალიტეტი': ['გერგეტი'],
  'თელავის მუნიციპალიტეტი': ['ქისისხევი', 'ყივჭყანი'],
  # Survivors of the place=town re-sync — real villages the fresh Overpass
  # pass dropped (polygon flips / source flake). Hand-verified against the
  # 75cc789 gazetteer; ვაჭევი/გოლისი-type moves were relocations, not losses.
  'ამბროლაურის მუნიციპალიტეტი': ['გოგოლათი'],
  'კასპის მუნიციპალიტეტი': ['ზადიაანთკარი'],
  'ქარელის მუნიციპალიტეტი': ['ლოშკინეთი'],
  'ხარაგაულის მუნიციპალიტეტი': ['უბისი'],
  'ხონის მუნიციპალიტეტი': ['ნამაშევი', 'ჩაის მეურნეობა'],
}

# Town names that alias a catalog city — never village rows (სტეფანწმინდა = ყაზბეგი).
CITY_ALIAS = {'სტეფანწმინდა'}

# New self-governed communities + occupied-territory munis the picker must list.
NEW_MUNIS = [
  'გაგრის მუნიციპალიტეტი', 'გუდაუთის მუნიციპალიტეტი', 'სოხუმის მუნიციპალიტეტი',
  'გულრიფშის მუნიციპალიტეტი', 'ოჩამჩირის მუნიციპალიტეტი', 'ტყვარჩელის მუნიციპალიტეტი',
  'გალის მუნიციპალიტეტი',
]

HDR = {'User-Agent': 'Mozilla/5.0 (compatible; sivrce-village-sync/1.0)'}
GE_BBOX = '(41.05,39.95,43.62,46.75)'


def get_json(url: str, out: Path, timeout: int = 400, data: bytes | None = None) -> None:
  req = urllib.request.Request(url, headers=HDR, data=data)
  with urllib.request.urlopen(req, timeout=timeout) as r:
    out.write_bytes(r.read())


def fetch_overpass(path: Path, query: str) -> None:
  if path.exists():
    return
  print(f'fetch {path.name} …')
  body = urllib.parse.urlencode({'data': query}).encode()
  # Overpass 406s "Mozilla/5.0 (compatible; …)" UAs — send an honest agent string.
  headers = {'User-Agent': 'sivrce-location-sync/1.1 (+https://sivrce.ge)',
             'Content-Type': 'application/x-www-form-urlencoded'}
  last: Exception | None = None
  for host in ('overpass-api.de', 'overpass.kumi.systems', 'overpass.private.coffee'):
    try:
      req = urllib.request.Request(f'https://{host}/api/interpreter', data=body, headers=headers)
      with urllib.request.urlopen(req, timeout=420) as r:
        path.write_bytes(r.read())
      return
    except Exception as e:  # noqa: BLE001 — try next mirror
      print(f'  {host} failed: {e}')
      last = e
  raise last  # type: ignore[misc]


def clean(name: str) -> str:
  name = re.sub(r'\s+', ' ', (name or '').strip())
  name = name.removeprefix('სოფელი ').strip()
  return '' if BAD_NAME.search(name) else name


def load_tnet(catalog_munis: set[str]) -> dict[str, set[str]]:
  out: dict[str, set[str]] = {}
  for c in json.loads(TNET.read_text())['data']:
    m = c['display_name']
    if m not in catalog_munis:
      continue
    out[m] = {clean(d['display_name']) for d in c.get('districts') or []}
  return out


def load_ss(catalog_munis: set[str]) -> dict[str, set[str]]:
  out: dict[str, set[str]] = {}
  for m in json.loads(SS.read_text()):
    name = clean(m['municipalityTitle'])
    target = name if name in catalog_munis else MUNI_MAP.get(name)
    if not target or target not in catalog_munis:
      continue
    out.setdefault(target, set()).update(
      clean(c['title']) for c in m.get('cities') or []
    )
  return out


def stitch(ways: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
  """Join boundary way segments into closed rings (endpoints match exactly)."""
  rings: list[list[tuple[float, float]]] = []
  lines = [list(w) for w in ways]
  while lines:
    cur = lines.pop()
    while cur[0] != cur[-1]:
      for i, ln in enumerate(lines):
        if ln[0] == cur[-1]:
          cur += ln[1:]
        elif ln[-1] == cur[-1]:
          cur += ln[-2::-1]
        elif ln[-1] == cur[0]:
          cur = ln[:-1] + cur
        elif ln[0] == cur[0]:
          cur = ln[:0:-1] + cur
        else:
          continue
        lines.pop(i)
        break
      else:
        break
    if len(cur) >= 4 and cur[0] == cur[-1]:
      rings.append(cur)
  return rings


def muni_polygons() -> dict[str, tuple[list[float], list[list[tuple[float, float]]]]]:
  """Catalog muni name → (bbox, outer rings). Holes ignored — villages never sit in enclaves."""
  data = json.loads(OSM_M.read_text())
  out: dict[str, tuple[list[float], list[list[tuple[float, float]]]]] = {}
  for rel in data['elements']:
    t = rel['tags']
    # Some relations carry garbage name:ka (ბაღდათი: 'ბაღდადი;მაიაკოვსკი') with the
    # real ka name in name — trust whichever candidate actually looks like a muni.
    name = ''
    for cand in (t.get('name:ka') or '', t.get('name') or ''):
      if cand in MUNI_MAP or 'მუნიციპალიტეტი' in cand or 'რაიონი' in cand:
        name = MUNI_MAP.get(cand, cand)
        break
    if not name:
      continue
    if name in MUNI_SKIP:
      continue
    rings: list[list[tuple[float, float]]] = []
    outer: list[list[tuple[float, float]]] = []
    lo, la = [180, 180], [-180, -180]
    for m in rel.get('members') or []:
      if m.get('type') != 'way' or m.get('role') not in ('outer', ''):
        continue
      ring = [(p['lon'], p['lat']) for p in m.get('geometry') or []]
      if len(ring) >= 2:
        outer.append(ring)
    for lon, lat in [p for r in outer for p in r]:
      lo[0], lo[1] = min(lo[0], lon), min(lo[1], lat)
      la[0], la[1] = max(la[0], lon), max(la[1], lat)
    rings = stitch(outer)
    if not rings:
      print(f'  unclosed outer ring, skipping: {name}')
      continue
    out[name] = ([lo[0], lo[1], la[0], la[1]], rings)
  return out


def inside(lon: float, lat: float, box: list[float], rings: list[list[tuple[float, float]]]) -> bool:
  if not (box[0] <= lon <= box[2] and box[1] <= lat <= box[3]):
    return False
  for ring in rings:
    hit = False
    n = len(ring)
    for i in range(n):
      x1, y1 = ring[i]
      x2, y2 = ring[(i + 1) % n]
      if (y1 > lat) != (y2 > lat):
        x = x1 + (lat - y1) / (y2 - y1) * (x2 - x1)
        if x > lon:
          hit = not hit
    if hit:
      return True
  return False


def load_osm(catalog_munis: set[str]) -> dict[str, set[str]]:
  polys = muni_polygons()
  out: dict[str, set[str]] = {}
  missed = 0
  for node in json.loads(OSM_V.read_text())['elements']:
    t = node.get('tags') or {}
    name = clean(t.get('name:ka') or '')
    if not name and KA.search(t.get('name') or ''):
      name = clean(t['name'])
    if not name:
      continue
    lon, lat = node['lon'], node['lat']
    hits = [m for m, (box, rings) in polys.items() if inside(lon, lat, box, rings)]
    if not hits:
      missed += 1
      continue
    # Border overlaps: most specific (smallest bbox) wins.
    target = min(hits, key=lambda m: (polys[m][0][2] - polys[m][0][0]) * (polys[m][0][3] - polys[m][0][1]))
    if target in catalog_munis:
      out.setdefault(target, set()).add(name)
  if missed:
    print(f'OSM villages outside every muni polygon: {missed}')
  return out


def main() -> None:
  geo = json.loads((ROOT / 'app/src/data/georgia-locations.json').read_text())
  catalog_munis = set(geo['municipalities']) | set(NEW_MUNIS)

  fetch_overpass(OSM_V, f'[out:json][timeout:350];node["place"~"^(village|hamlet|town)"]{GE_BBOX};out;')
  fetch_overpass(OSM_M, f'[out:json][timeout:400];rel["boundary"="administrative"]["admin_level"="6"]{GE_BBOX};out geom;')

  tnet = load_tnet(catalog_munis)
  ss = load_ss(catalog_munis)
  osm = load_osm(catalog_munis)

  # City names are never villages under their own muni (ხობი town ≠ სოფ. ხობი).
  cities = set(geo['cities'])
  villages: dict[str, list[str]] = {}
  for m in sorted(catalog_munis - MUNI_SKIP):
    names = tnet.get(m, set()) | ss.get(m, set()) | osm.get(m, set()) | set(EXTRA_VILLAGES.get(m, ()))
    names = {n for n in names if n and n not in cities and n not in CITY_ALIAS}
    if names:
      villages[m] = sorted(names, key=lambda x: x.casefold())

  total = sum(len(v) for v in villages.values())
  OUT.write_text(json.dumps(
    {'source': 'api-locations.tnet.ge v2 + home.ss.ge settlements + OpenStreetMap place=village|hamlet (ODbL). Merge priority TNET > SS > OSM.',
     'villages': villages},
    ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
  print(f'munis with villages: {len(villages)}, total villages: {total}')
  for m in sorted(villages, key=lambda m: -len(villages[m]))[:8]:
    print(f'  {len(villages[m]):4d}  {m}')


if __name__ == '__main__':
  main()
