#!/usr/bin/env python3
"""Seed neighborhoods (municipalities) into the database via raw SQL."""
import json

with open('/Users/mac/Desktop/sivrce888/app/src/data/georgia-locations.json', 'r', encoding='utf-8') as f:
    geo = json.load(f)

municipalities = geo['municipalities']

# Build a mapping: city name (from geo cities) -> slug
# Since we inserted cities with id=slug=lowercase(name), we can map by name
city_to_slug = {}
for city_name in geo['cities']:
    slug = city_name.lower().replace('/', '-').replace(' ', '-').replace('__', '-')
    city_to_slug[city_name] = slug

# For each municipality, find its city and create the INSERT row
rows = []
for muni_name in municipalities:
    # Extract the city name from "CityName micronipality"
    # The format is typically "CityName micronipality" 
    # e.g., " Tbilisi micronipality" -> city = "Tbilisi"
    # But the Georgian text is "CityName micronipality" where micronipality = "მუნიციპალიტეტი"
    
    # Split on " micronipality" to get the city name
    # The format in Georgian is: "CityName micronipality"
    # But we need to handle it in Georgian
    
    # Let's use: find the city from the cities list that best matches
    city_name = None
    for city in geo['cities']:
        # Check if city name is in the municipality name
        if city in muni_name:
            city_name = city
            break
        # Also check reverse: if municipality name (without micronipality) equals city
        city_without_micro = muni_name.replace(' micronipality', '') if ' micronipality' in muni_name else muni_name
        if city == city_without_micro:
            city_name = city
            break
    
    if not city_name:
        # fallback: try to find any city that's a substring
        for city in geo['cities']:
            if city in muni_name or muni_name in city:
                city_name = city
                break
    
    if not city_name:
        city_name = 'თბılisi'  # fallback
    
    city_slug = city_to_slug.get(city_name, city_name.lower().replace('/', '-').replace(' ', '-'))
    
    # Create neighborhood slug
    neighborhood_slug = muni_name.lower().replace('/', '-').replace(' ', '-')
    
    # Build the SQL row - use proper escaping
    # Fields: id, slug, name, name_ka, city_id, currency, description, description_ka,
    #         price_range_buy, price_range_rent, avg_price_per_sqm, walk_score, transit_score,
    #         safety_score, schools_nearby, amenities, amenities_ka, best_for, best_for_ka,
    #         investment_note, investment_note_ka, lat, lng, image, listings_count, trend, trend_percent, is_active, featured, "order"
    
    row = (
        f"('{neighborhood_slug}', '{neighborhood_slug}', "
        f"'{muni_name}', '{muni_name}', "
        f"'{city_slug}', 'Georgia', "
        f"'({muni_name}) placeholder', '{muni_name}', "
        f"'0 GEL', '0 GEL', 0, 0, 0, 0, 0, '{{}}', '{{}}', "
        f"'{{}}', '{{}}', "
        f"'Placeholder for {muni_name}', '{muni_name}', "
        f"0, 0, '/neighborhood-{neighborhood_slug}.webp', 0, 'stable', '0%', true, false, 0)"
    )
    rows.append(row)

with open('/tmp/seed_neighborhoods.sql', 'w', encoding='utf-8') as f:
    f.write("INSERT INTO neighborhoods (id, slug, name, name_ka, city_id, currency, description, description_ka, price_range_buy, price_range_rent, avg_price_per_sqm, walk_score, transit_score, safety_score, schools_nearby, amenities, amenities_ka, best_for, best_for_ka, investment_note, investment_note_ka, lat, lng, image, listings_count, trend, trend_percent, is_active, featured, \"order\") VALUES\n")
    f.write(',\n'.join(rows))
    f.write(';\n')

print(f"Wrote {len(rows)} neighborhood INSERT statements to /tmp/seed_neighborhoods.sql")