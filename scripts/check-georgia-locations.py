#!/usr/bin/env python3
"""Self-check: georgia-locations.json vs official Tbilisi raions + competitor cities."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
geo = json.loads((ROOT / 'app/src/data/georgia-locations.json').read_text())
osm = json.loads((ROOT / 'app/src/data/tbilisi-streets.json').read_text())

OFFICIAL_RAIONS = [
  'მთაწმინდა', 'ვაკე', 'საბურთალო', 'კრწანისი', 'ისანი',
  'სამგორი', 'ჩუღურეთი', 'დიდუბე', 'ნაძალადევი', 'გლდანი',
]
# Old Soviet/combined labels must not appear as raion keys or flat picks.
BANNED = [
  'ვაკე-საბურთალო', 'დიდუბე-ჩუღურეთი', 'გლდანი-ნაძალადევი',
  'ისანი-სამგორი', 'თბილისის შემოგარენი',
]

assert 'თბილისი' in geo['cities']
assert 'ბათუმი' in geo['cities']
assert 'ბაკურიანი' in geo['cities']
assert len(geo['cities']) >= 50, geo['cities']
assert len(geo['municipalities']) >= 50

tb = geo['districts']['თბილისი']
assert list(tb['raions'].keys()) == OFFICIAL_RAIONS, list(tb['raions'].keys())
assert 'ბაგები' in tb['raions']['ვაკე']
assert 'დიღომი' in tb['raions']['საბურთალო']
assert 'ფონიჭალა' in tb['raions']['კრწანისი']  # not სამგორი
assert 'ვაზისუბანი' in tb['raions']['ისანი']     # not სამგორი
assert 'დიღმის მასივი' in tb['raions']['დიდუბე']  # ≠ დიღომი (საბურთალო)

flat_like = set(tb['raions']) | {u for us in tb['raions'].values() for u in us} | set(tb['flat'])
for bad in BANNED:
  assert bad not in tb['raions'], bad
  assert bad not in flat_like, bad
  assert bad not in tb['flat'], bad

# No truncated / duplicate aliases (canon lives in district-canon ALIAS)
for junk in [
  'აეროპორტის დას', 'დამპალოს დას', 'სან. ზონა', 'ლისის მიმდებარედ', 'ლისის ტბა',
  'სოფელი დიღომი', 'სოფელი გლდანი',
]:
  assert junk not in flat_like, junk

assert 'ზემო ლისი' in tb['raions']['საბურთალო']
assert 'კვესეთი' in tb['raions']['ვაკე']
assert 'წვერი' in tb['flat']
assert 'მსხალდიდი' in tb['flat']
assert 'წოდორეთი' in tb['flat']
assert 'ცხვარიჭამია' in tb['flat']

# myhome/ss display columns: titles may be combined; items = every catalog name, once
picker = tb['picker']
assert len(picker) == 6
seen = []
for g in picker:
  assert g['title']
  for name in g['items']:
    assert name in flat_like, name
    assert name not in seen, name
    seen.append(name)
assert set(seen) == flat_like, (sorted(flat_like - set(seen)), sorted(set(seen) - flat_like))
assert 'საბურთალო' in picker[0]['items']
assert picker[0]['title'] == 'ვაკე-საბურთალო'

assert 'მახინჯაური' in geo['districts']['ბათუმი']['flat']
assert 'ავტოქარხანა' in geo['districts']['ქუთაისი']['flat']
assert len(geo['streets']['ბათუმი']) >= 150
assert len(geo['streets']['ქუთაისი']) >= 150
assert len(geo['streets']['რუსთავი']) >= 80
assert len(geo['streets']['ზუგდიდი']) >= 200
assert len(osm) >= 3500

# SS თბილისის შემოგარენი leaves must be searchable
for surr in ['ტაბახმელა', 'ოქროყანა', 'წყნეთი', 'ელფია', 'ნაფეტვრები', 'დიდი ლილო', 'აგარაკი']:
  assert surr in flat_like, surr

# Street labels: no leading space, no locative leftovers from TNET SEO
for city, streets in geo['streets'].items():
  for s in streets:
    assert s == s.strip(), (city, s)
    assert not s.endswith('ქუჩაზე'), (city, s)

for c in ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'ზუგდიდი', 'თელავი', 'გორი', 'ბორჯომი', 'გუდაური']:
  assert c in geo['cities'], c

print('ok', {
  'cities': len(geo['cities']),
  'munis': len(geo['municipalities']),
  'tbilisi_raions': len(tb['raions']),
  'tbilisi_ubani': sum(len(v) for v in tb['raions'].values()),
  'tbilisi_catalog': len(flat_like),
  'tbilisi_streets_osm': len(osm),
  'street_cities': len(geo['streets']),
  'batumi_streets': len(geo['streets']['ბათუმი']),
  'kutaisi_streets': len(geo['streets']['ქუთაისი']),
  'rustavi_streets': len(geo['streets']['რუსთავი']),
})
