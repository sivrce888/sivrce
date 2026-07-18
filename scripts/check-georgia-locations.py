#!/usr/bin/env python3
"""Self-check: georgia-locations.json sanity vs competitor expectations."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
geo = json.loads((ROOT / 'app/src/data/georgia-locations.json').read_text())
osm = json.loads((ROOT / 'app/src/data/tbilisi-streets.json').read_text())

assert 'თბილისი' in geo['cities']
assert 'ბათუმი' in geo['cities']
assert 'ბაკურიანი' in geo['cities']
assert len(geo['cities']) >= 50, geo['cities']
assert len(geo['municipalities']) >= 50
assert 'ვაკე' in geo['districts']['თბილისი']['flat']
assert 'ვაკე-საბურთალო' in geo['districts']['თბილისი']['raions']
assert 'ბაგები' in geo['districts']['თბილისი']['raions']['ვაკე-საბურთალო']
assert 'მახინჯაური' in geo['districts']['ბათუმი']['flat']
assert 'ავტოქარხანა' in geo['districts']['ქუთაისი']['flat']
assert len(geo['streets']['ბათუმი']) >= 150
assert len(geo['streets']['ქუთაისი']) >= 150
assert len(geo['streets']['რუსთავი']) >= 80
assert len(osm) >= 3500  # OSM Tbilisi streets stay canonical

# Competitor popular cities present
for c in ['თბილისი','ბათუმი','ქუთაისი','რუსთავი','ზუგდიდი','თელავი','გორი','ბორჯომი','გუდაური']:
  assert c in geo['cities'], c

print('ok', {
  'cities': len(geo['cities']),
  'munis': len(geo['municipalities']),
  'tbilisi_ubani': len(geo['districts']['თბილისი']['flat']),
  'tbilisi_streets_osm': len(osm),
  'batumi_streets': len(geo['streets']['ბათუმი']),
  'kutaisi_streets': len(geo['streets']['ქუთაისი']),
  'rustavi_streets': len(geo['streets']['რუსთავი']),
})
