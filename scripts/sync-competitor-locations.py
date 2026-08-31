#!/usr/bin/env python3
"""Pull myhome (api-locations.tnet.ge) + ss.ge (__NEXT_DATA__) address trees → dumps + georgia-locations.json.

ponytail: one script, no scraper framework. Street display names: ss titles win; else TNET seo_long_name minus locative ზე.
"""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'research/competitor-locations'
GEO_PATH = ROOT / 'app/src/data/georgia-locations.json'
HDR = {
  'Accept': 'application/json',
  'Origin': 'https://www.myhome.ge',
  'Referer': 'https://www.myhome.ge/',
  'User-Agent': 'Mozilla/5.0 (compatible; sivrce-location-sync/1.0)',
}
SS_URL = 'https://home.ss.ge/ka/udzravi-qoneba'
TNET_CITIES = 'https://api-locations.tnet.ge/v2/cities'
TNET_METRO = 'https://api-locations.tnet.ge/v2/metro-stations'

# Official Tbilisi raions (matsne 2014) — never replace with Soviet combined keys.
OFFICIAL_RAIONS = [
  'მთაწმინდა', 'ვაკე', 'საბურთალო', 'კრწანისი', 'ისანი',
  'სამგორი', 'ჩუღურეთი', 'დიდუბე', 'ნაძალადევი', 'გლდანი',
]

# TNET Soviet column → official raion for leaf ubani that ARE the raion name itself.
COMBINED = {
  'ვაკე-საბურთალო': ['ვაკე', 'საბურთალო'],
  'მთაწმინდა-კრწანისი': ['მთაწმინდა', 'კრწანისი'],
  'ისანი-სამგორი': ['ისანი', 'სამგორი'],
  'დიდუბე-ჩუღურეთი': ['დიდუბე', 'ჩუღურეთი'],
  'გლდანი-ნაძალადევი': ['გლდანი', 'ნაძალადევი'],
}

# Truncated / alias junk from competitor pickers — canon lives in district-canon.
JUNK_UBANI = {
  'აეროპორტის დას', 'დამპალოს დას', 'სან. ზონა', 'ლისის მიმდებარედ', 'ლისის ტბა',
  'სოფელი დიღომი', 'სოფელი გლდანი', 'თბილისის შემოგარენი',
  'ვაკე-საბურთალო', 'დიდუბე-ჩუღურეთი', 'გლდანი-ნაძალადევი', 'ისანი-სამგორი',
}


def get_json(url: str):
  req = urllib.request.Request(url, headers=HDR)
  with urllib.request.urlopen(req, timeout=120) as r:
    return json.loads(r.read().decode())


def get_text(url: str) -> str:
  req = urllib.request.Request(url, headers={**HDR, 'Accept': 'text/html'})
  with urllib.request.urlopen(req, timeout=120) as r:
    return r.read().decode('utf-8', 'replace')


# TNET seo_long_name is locative ("…ქუჩაზე"); recover nominative display label.
_LOCATIVE = (
  ('შესახვევში', 'შესახვევი'),
  ('ქუჩაზე', 'ქუჩა'),
  ('ქუჩაში', 'ქუჩა'),
  ('გამზირზე', 'გამზირი'),
  ('გამზირში', 'გამზირი'),
  ('ჩიხში', 'ჩიხი'),
  ('ჩიხზე', 'ჩიხი'),
  ('პლატოზე', 'პლატო'),
  ('ხეივანზე', 'ხეივანი'),
  ('ხეივანში', 'ხეივანი'),
)


def street_from_seo(ka: str) -> str:
  ka = re.sub(r'\s+', ' ', (ka or '').strip())
  for loc, nom in _LOCATIVE:
    if ka.endswith(loc):
      return ka[: -len(loc)] + nom
  if ka.endswith('ზე'):
    return ka[:-2]
  return ka


def clean_street(s: str) -> str:
  return re.sub(r'\s+', ' ', (s or '').strip())


def is_muni(name: str) -> bool:
  return name.endswith('მუნიციპალიტეტი') or name.endswith('რაიონი') or 'ავტონომიური' in name


def collect_tnet_streets(city: dict) -> list[str]:
  out: list[str] = []
  for st in city.get('grouped_streets') or []:
    ka = (st.get('seo_long_name') or {}).get('ka') or ''
    if ka:
      out.append(street_from_seo(ka))
  for d in city.get('districts') or []:
    for st in d.get('grouped_streets') or []:
      ka = (st.get('seo_long_name') or {}).get('ka') or ''
      if ka:
        out.append(street_from_seo(ka))
    for u in d.get('urbans') or []:
      for st in u.get('grouped_streets') or []:
        ka = (st.get('seo_long_name') or {}).get('ka') or ''
        if ka:
          out.append(street_from_seo(ka))
  # unique, stable
  seen: set[str] = set()
  uniq: list[str] = []
  for s in out:
    if s not in seen:
      seen.add(s)
      uniq.append(s)
  return uniq


def collect_ss_streets(ss: dict) -> dict[str, list[str]]:
  by: dict[str, list[str]] = {}
  for c in ss.get('visibleCities') or []:
    city = c['cityTitle']
    names: list[str] = []
    seen: set[str] = set()
    for d in c.get('districts') or []:
      for sub in d.get('subDistricts') or []:
        for st in sub.get('streets') or []:
          t = clean_street(st.get('streetTitle') or '')
          if t and t not in seen:
            seen.add(t)
            names.append(t)
    by[city] = names
  return by


def merge_street_lists(*lists: list[str]) -> list[str]:
  seen: set[str] = set()
  out: list[str] = []
  for lst in lists:
    for s in lst:
      s = clean_street(s)
      if s and s not in seen:
        seen.add(s)
        out.append(s)
  return sorted(out, key=lambda x: x.casefold())


# SS leaf → existing catalog leaf (avoid duplicate near-synonyms).
SS_SURR_ALIAS = {
  'გიორგიწმინდა': 'გიორგიწმინდას დასახლება',
}


def ss_tbilisi_surroundings(ss: dict) -> list[str]:
  out: list[str] = []
  for m in ss.get('visibleMunicipalitetyChain') or []:
    title = m.get('municipalityTitle') or ''
    if 'შემოგარენი' not in title:
      continue
    for c in m.get('cities') or []:
      name = clean_street(c.get('title') or '')
      if not name or name in JUNK_UBANI:
        continue
      out.append(SS_SURR_ALIAS.get(name, name))
  return out


def main() -> None:
  OUT.mkdir(parents=True, exist_ok=True)

  print('fetch TNET cities…')
  tnet = get_json(TNET_CITIES)
  (OUT / 'tnet-cities-v2.json').write_text(json.dumps(tnet, ensure_ascii=False), encoding='utf-8')
  metro = get_json(TNET_METRO)
  (OUT / 'tnet-metro.json').write_text(json.dumps(metro, ensure_ascii=False), encoding='utf-8')

  print('fetch SS home…')
  html = get_text(SS_URL)
  m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
  if not m:
    raise SystemExit('ss __NEXT_DATA__ missing')
  ss_page = json.loads(m.group(1))
  ss_locs = ss_page['props']['pageProps']['locations']
  (OUT / 'ss-locations-nextdata.json').write_text(json.dumps(ss_locs, ensure_ascii=False), encoding='utf-8')

  cities_raw = tnet['data']
  city_names = [c['display_name'] for c in cities_raw if not is_muni(c['display_name'])]
  muni_names = [c['display_name'] for c in cities_raw if is_muni(c['display_name'])]

  # Popular cities first (TNET order already does this for top 10)
  popular = city_names[:12]
  rest = sorted([c for c in city_names if c not in popular], key=lambda x: x.casefold())
  cities_ordered = popular + rest
  munis_ordered = sorted(muni_names, key=lambda x: x.casefold())

  ss_streets = collect_ss_streets(ss_locs)
  streets: dict[str, list[str]] = {}
  for c in cities_raw:
    name = c['display_name']
    if is_muni(name):
      continue
    merged = merge_street_lists(ss_streets.get(name, []), collect_tnet_streets(c))
    if merged:
      streets[name] = merged

  # Districts: keep existing Tbilisi official map; refresh Batumi/Kutaisi flats from TNET
  geo = json.loads(GEO_PATH.read_text(encoding='utf-8'))
  tb = geo['districts']['თბილისი']
  assert list(tb['raions'].keys()) == OFFICIAL_RAIONS

  # Merge TNET Tbilisi urbans into matching official raions when leaf already known; else keep as-is.
  tbilisi = next(c for c in cities_raw if c['display_name'] == 'თბილისი')
  tnet_ubani: dict[str, str] = {}  # ubani → combined district title
  for d in tbilisi.get('districts') or []:
    for u in d.get('urbans') or []:
      tnet_ubani[u['display_name']] = d['display_name']

  # Ensure every TNET ubani appears somewhere (raion leaf or flat)
  known = set(tb['raions']) | {u for us in tb['raions'].values() for u in us} | set(tb['flat'])
  for ubani, combined in tnet_ubani.items():
    if ubani in known or ubani in OFFICIAL_RAIONS or ubani in JUNK_UBANI:
      continue
    if any(combined == comb and ubani in raions for comb, raions in COMBINED.items()):
      continue
    tb['flat'].append(ubani)
    known.add(ubani)

  # SS "თბილისის შემოგარენი" settlements → flat (picker parity with ss/myhome)
  known = set(tb['raions']) | {u for us in tb['raions'].values() for u in us} | set(tb['flat'])
  for name in ss_tbilisi_surroundings(ss_locs):
    if name not in known and name not in JUNK_UBANI:
      tb['flat'].append(name)
      known.add(name)

  tb['flat'] = sorted({x for x in tb['flat'] if x not in JUNK_UBANI}, key=lambda x: x.casefold())

  # Batumi / Kutaisi flats from TNET district titles
  for city_name in ('ბათუმი', 'ქუთაისი'):
    c = next(x for x in cities_raw if x['display_name'] == city_name)
    flats = [d['display_name'] for d in (c.get('districts') or [])]
    geo['districts'].setdefault(city_name, {'raions': {}, 'flat': []})
    geo['districts'][city_name]['raions'] = {}
    geo['districts'][city_name]['flat'] = flats

  # Rustavi: no districts in TNET — keep empty / existing
  geo['districts'].setdefault('რუსთავი', {'raions': {}, 'flat': []})

  # Rebuild picker items from catalog (titles stay combined for myhome/ss layout)
  if tb.get('picker'):
    catalog = set(tb['raions']) | {u for us in tb['raions'].values() for u in us} | set(tb['flat'])
    for g in tb['picker']:
      g['items'] = [x for x in g['items'] if x in catalog]
    # append any catalog name missing from picker into last group (შემოგარენი)
    seen = {x for g in tb['picker'] for x in g['items']}
    missing = sorted(catalog - seen, key=lambda x: x.casefold())
    if missing and tb['picker']:
      tb['picker'][-1]['items'].extend(missing)

  geo['source'] = (
    'Tbilisi: 10 official raions (matsne 2014). '
    'Cities/districts/streets: api-locations.tnet.ge (myhome) + home.ss.ge __NEXT_DATA__ '
    f'({OUT.relative_to(ROOT)}, sync-competitor-locations.py).'
  )
  geo['cities'] = cities_ordered
  geo['municipalities'] = munis_ordered
  # Keep OSM Tbilisi streets separate; competitor streets for other cities (+ Tbilisi dump in research)
  geo['streets'] = {k: streets[k] for k in sorted(streets, key=lambda x: x.casefold()) if k != 'თბილისი'}
  # Also keep major-city streets that were there; Tbilisi stays in tbilisi-streets.json (OSM)

  GEO_PATH.write_text(json.dumps(geo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

  # Compact summary dump for humans
  summary = {
    'tnet_cities': len(city_names),
    'tnet_munis': len(muni_names),
    'tnet_districts': sum(len(c.get('districts') or []) for c in cities_raw),
    'tnet_urbans': sum(
      len(u)
      for c in cities_raw
      for d in (c.get('districts') or [])
      for u in [d.get('urbans') or []]
    ),
    'tnet_streets': sum(len(collect_tnet_streets(c)) for c in cities_raw),
    'ss_streets': {k: len(v) for k, v in ss_streets.items()},
    'geo_street_cities': {k: len(v) for k, v in geo['streets'].items()},
    'ss_muni_settlements': sum(len(m.get('cities') or []) for m in ss_locs.get('municipalityChain') or []),
  }
  # Full Tbilisi competitor streets (OSM remains app source for TB)
  tb_streets = merge_street_lists(ss_streets.get('თბილისი', []), collect_tnet_streets(tbilisi))
  (OUT / 'tbilisi-competitor-streets.json').write_text(
    json.dumps(tb_streets, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
  )
  summary['tbilisi_competitor_streets'] = len(tb_streets)

  # SS municipality → settlements (დასახლება) full tree
  settlements = []
  for m in ss_locs.get('municipalityChain') or []:
    settlements.append({
      'municipalityId': m.get('municipalityId'),
      'municipalityTitle': m.get('municipalityTitle'),
      'cities': [{'id': x.get('id'), 'title': x.get('title')} for x in (m.get('cities') or [])],
    })
  for m in ss_locs.get('visibleMunicipalitetyChain') or []:
    settlements.append({
      'municipalityId': m.get('municipalityId'),
      'municipalityTitle': m.get('municipalityTitle'),
      'cities': [{'id': x.get('id'), 'title': x.get('title')} for x in (m.get('cities') or [])],
    })
  (OUT / 'ss-municipality-settlements.json').write_text(
    json.dumps(settlements, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
  )

  (OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
  print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
  main()
