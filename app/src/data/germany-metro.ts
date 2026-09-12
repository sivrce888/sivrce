/**
 * SIVRCE — Germany metro / urban rail catalog (programmatic SEO).
 * Berlin: every U-Bahn station + key S-Bahn interchanges (canonical, deduped
 * per station); other cities = key interchanges. Counts derive from the arrays
 * — never hardcode them in copy.
 * Station coordinates sourced from OSM / BVG / VBB official data.
 *
 * ponytail: comprehensive station lists for Berlin; other cities = key interchanges.
 */

import berlinUOsm from './berlin-ubahn-osm.json'

export type DeMetroLine = {
  name: string
  color: string
  type: 'u-bahn' | 's-bahn' | 'stadtbahn' | 'tram'
  stations: number
  km: number
  yearOpened: number
}

export type DeMetroStation = {
  slug: string
  name: string
  nameEn: string
  lat: number
  lng: number
  lines: string[]
  citySlug: string
  zone?: string
  interchange?: boolean
  yearOpened?: number
  barrierFree?: boolean
}

export type DeMetroSystem = {
  citySlug: string
  cc: 'DE'
  name: string
  lines: DeMetroLine[]
  stations: DeMetroStation[]
  totalKm: number
  totalStations: number
  yearOpened: number
  dailyRidership: number
  status: 'operational' | 'under-construction' | 'planned'
  fareZone?: string
}

// ══════════════════════════════════════════════════════════════════
// BERLIN — U-BAHN LINES
// ══════════════════════════════════════════════════════════════════

const berlinUBahnLines: DeMetroLine[] = [
  { name: 'U1', color: '#F5D122', type: 'u-bahn', stations: 13, km: 8.8, yearOpened: 1902 },
  { name: 'U2', color: '#E44585', type: 'u-bahn', stations: 29, km: 20.7, yearOpened: 1913 },
  { name: 'U3', color: '#009688', type: 'u-bahn', stations: 24, km: 12.0, yearOpened: 1913 },
  { name: 'U4', color: '#009F8F', type: 'u-bahn', stations: 5, km: 3.2, yearOpened: 1929 },
  { name: 'U5', color: '#7B5D37', type: 'u-bahn', stations: 26, km: 19.5, yearOpened: 1930 },
  { name: 'U6', color: '#006F40', type: 'u-bahn', stations: 29, km: 19.9, yearOpened: 1923 },
  { name: 'U7', color: '#6A1E74', type: 'u-bahn', stations: 40, km: 31.8, yearOpened: 1924 },
  { name: 'U8', color: '#00A1DE', type: 'u-bahn', stations: 23, km: 17.5, yearOpened: 1927 },
  { name: 'U9', color: '#B5BE2E', type: 'u-bahn', stations: 18, km: 12.5, yearOpened: 1961 },
]

const berlinSBahnLines: DeMetroLine[] = [
  { name: 'S1', color: '#999999', type: 's-bahn', stations: 27, km: 41.3, yearOpened: 1930 },
  { name: 'S2', color: '#999999', type: 's-bahn', stations: 29, km: 38.8, yearOpened: 1930 },
  { name: 'S25', color: '#999999', type: 's-bahn', stations: 17, km: 25.1, yearOpened: 1930 },
  { name: 'S26', color: '#999999', type: 's-bahn', stations: 10, km: 12.4, yearOpened: 1993 },
  { name: 'S3', color: '#009688', type: 's-bahn', stations: 21, km: 35.2, yearOpened: 1930 },
  { name: 'S41', color: '#A6217E', type: 's-bahn', stations: 27, km: 37.0, yearOpened: 1930 },
  { name: 'S42', color: '#A6217E', type: 's-bahn', stations: 27, km: 37.0, yearOpened: 1930 },
  { name: 'S45', color: '#009688', type: 's-bahn', stations: 11, km: 15.3, yearOpened: 1993 },
  { name: 'S46', color: '#009688', type: 's-bahn', stations: 10, km: 13.8, yearOpened: 1993 },
  { name: 'S5', color: '#E44585', type: 's-bahn', stations: 24, km: 42.1, yearOpened: 1930 },
  { name: 'S7', color: '#006F40', type: 's-bahn', stations: 27, km: 48.3, yearOpened: 1930 },
  { name: 'S75', color: '#006F40', type: 's-bahn', stations: 12, km: 18.5, yearOpened: 1993 },
  { name: 'S8', color: '#00A1DE', type: 's-bahn', stations: 20, km: 33.4, yearOpened: 1930 },
  { name: 'S85', color: '#00A1DE', type: 's-bahn', stations: 9, km: 12.1, yearOpened: 1993 },
  { name: 'S9', color: '#B5BE2E', type: 's-bahn', stations: 22, km: 36.7, yearOpened: 1930 },
]

// ══════════════════════════════════════════════════════════════════
// BERLIN U-BAHN ENRICHMENT ROWS — slug/zone/nameEn only; lat/lng/lines here
// predate verification (2026-09 audit: up to 15 km off) and are superseded by
// the OSM route relations in berlin-ubahn-osm.json.
// ══════════════════════════════════════════════════════════════════

const berlinUStations: DeMetroStation[] = [
  // ── U1: Uhlandstraße — Warschauer Straße ──
  { slug: 'u1-uhlandstr', name: 'Uhlandstraße', nameEn: 'Uhlandstraße', lat: 52.4803, lng: 13.3163, lines: ['U1'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u1-kurfuerstendamm', name: 'Kurfürstendamm', nameEn: 'Kurfürstendamm', lat: 52.5039, lng: 13.3373, lines: ['U1', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u1-wittenbergplatz', name: 'Wittenbergplatz', nameEn: 'Wittenbergplatz', lat: 52.5019, lng: 13.3378, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u1-nollendorfplatz', name: 'Nollendorfplatz', nameEn: 'Nollendorfplatz', lat: 52.4975, lng: 13.3453, lines: ['U1', 'U2', 'U3', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u1-viktoria-luise-platz', name: 'Viktoria-Luise-Platz', nameEn: 'Viktoria-Luise-Platz', lat: 52.4939, lng: 13.3433, lines: ['U1'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u1-buelowstr', name: 'Bülowstraße', nameEn: 'Bülowstraße', lat: 52.4908, lng: 13.3457, lines: ['U1'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u1-gleisdreieck', name: 'Gleisdreieck', nameEn: 'Gleisdreieck', lat: 52.4971, lng: 13.3500, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u1-hallesches-tor', name: 'Hallesches Tor', nameEn: 'Hallesches Tor', lat: 52.4981, lng: 13.3678, lines: ['U1', 'U3', 'U6'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u1-mehringdamm', name: 'Mehringdamm', nameEn: 'Mehringdamm', lat: 52.4985, lng: 13.3755, lines: ['U1', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u1-prinzenstr', name: 'Prinzenstraße', nameEn: 'Prinzenstraße', lat: 52.4988, lng: 13.3856, lines: ['U1'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u1-gorlistzer-bahnhof', name: 'Görlitzer Bahnhof', nameEn: 'Görlitzer Bahnhof', lat: 52.4974, lng: 13.3958, lines: ['U1'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u1-warschauer-str', name: 'Warschauer Straße', nameEn: 'Warschauer Straße', lat: 52.5018, lng: 13.4051, lines: ['U1', 'U3', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },

  // ── U2: Pankow — Ruhleben ──
  { slug: 'u2-pankow', name: 'Pankow', nameEn: 'Pankow', lat: 52.5679, lng: 13.3998, lines: ['U2'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u2-vinetastr', name: 'Vinetastraße', nameEn: 'Vinetastraße', lat: 52.5631, lng: 13.4015, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-schoenhauser-allee', name: 'Schönhauser Allee', nameEn: 'Schönhauser Allee', lat: 52.5592, lng: 13.4033, lines: ['U2', 'S41', 'S42'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u2-erynienstr', name: 'Eberswalder Straße', nameEn: 'Eberswalder Straße', lat: 52.5536, lng: 13.4041, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-senfelderplatz', name: 'Senefelderplatz', nameEn: 'Senefelderplatz', lat: 52.5483, lng: 13.4053, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-rosenthaler-platz', name: 'Rosenthaler Platz', nameEn: 'Rosenthaler Platz', lat: 52.5414, lng: 13.4041, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-alexanderplatz', name: 'Alexanderplatz', nameEn: 'Alexanderplatz', lat: 52.5219, lng: 13.4132, lines: ['U2', 'U5', 'U8', 'S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u2-klosterstr', name: 'Klosterstraße', nameEn: 'Klosterstraße', lat: 52.5178, lng: 13.4098, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-spittelmarkt', name: 'Spittelmarkt', nameEn: 'Spittelmarkt', lat: 52.5148, lng: 13.4025, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-potsdamer-platz', name: 'Potsdamer Platz', nameEn: 'Potsdamer Platz', lat: 52.5091, lng: 13.3758, lines: ['U2', 'S1', 'S2', 'S25'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u2-mendelssohn-bartholdy-park', name: 'Mendelssohn-Bartholdy-Park', nameEn: 'Mendelssohn-Bartholdy-Park', lat: 52.5065, lng: 13.3689, lines: ['U2'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u2-gleisdreieck-u2', name: 'Gleisdreieck', nameEn: 'Gleisdreieck', lat: 52.4971, lng: 13.3500, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u2-buelowstr-u2', name: 'Bülowstraße', nameEn: 'Bülowstraße', lat: 52.4908, lng: 13.3457, lines: ['U1', 'U2'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-nollendorfplatz-u2', name: 'Nollendorfplatz', nameEn: 'Nollendorfplatz', lat: 52.4975, lng: 13.3453, lines: ['U1', 'U2', 'U3', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-wittenbergplatz-u2', name: 'Wittenbergplatz', nameEn: 'Wittenbergplatz', lat: 52.5019, lng: 13.3378, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-viktoria-luise-platz-u2', name: 'Viktoria-Luise-Platz', nameEn: 'Viktoria-Luise-Platz', lat: 52.4939, lng: 13.3433, lines: ['U1', 'U2'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-bayerisch-platz', name: 'Bayerischer Platz', nameEn: 'Bayerischer Platz', lat: 52.4881, lng: 13.3422, lines: ['U2', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-rathaus-schoeneberg', name: 'Rathaus Schöneberg', nameEn: 'Rathaus Schöneberg', lat: 52.4824, lng: 13.3413, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-dahlem-dorf', name: 'Dahlem-Dorf', nameEn: 'Dahlem-Dorf', lat: 52.4555, lng: 13.3433, lines: ['U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-krumme-lanke', name: 'Krumme Lanke', nameEn: 'Krumme Lanke', lat: 52.4458, lng: 13.3441, lines: ['U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u2-schoenleinstr', name: 'Schönleinstraße', nameEn: 'Schönleinstraße', lat: 52.4455, lng: 13.3298, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u2-ruhleben', name: 'Ruhleben', nameEn: 'Ruhleben', lat: 52.4450, lng: 13.3214, lines: ['U2'], citySlug: 'berlin', zone: 'AB' },

  // ── U3: Krumme Lanke — Warschauer Straße ──
  { slug: 'u3-krumme-lanke', name: 'Krumme Lanke', nameEn: 'Krumme Lanke', lat: 52.4458, lng: 13.3441, lines: ['U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-dahlem-dorf', name: 'Dahlem-Dorf', nameEn: 'Dahlem-Dorf', lat: 52.4555, lng: 13.3433, lines: ['U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-freie-universitaet', name: 'Freie Universität', nameEn: 'Freie Universität (Thielplatz)', lat: 52.4536, lng: 13.3496, lines: ['U3'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u3-bundesplatz', name: 'Bundesplatz', nameEn: 'Bundesplatz', lat: 52.4765, lng: 13.3565, lines: ['U3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u3-nollendorfplatz', name: 'Nollendorfplatz', nameEn: 'Nollendorfplatz', lat: 52.4975, lng: 13.3453, lines: ['U1', 'U2', 'U3', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-wittenbergplatz', name: 'Wittenbergplatz', nameEn: 'Wittenbergplatz', lat: 52.5019, lng: 13.3378, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-augsburger-str', name: 'Augsburger Straße', nameEn: 'Augsburger Straße', lat: 52.5002, lng: 13.3328, lines: ['U3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u3-spichernstr', name: 'Spichernstraße', nameEn: 'Spichernstraße', lat: 52.4962, lng: 13.3273, lines: ['U3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u3-hohenzollernplatz', name: 'Hohenzollernplatz', nameEn: 'Hohenzollernplatz', lat: 52.4935, lng: 13.3201, lines: ['U3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u3-heidelberger-platz', name: 'Heidelberger Platz', nameEn: 'Heidelberger Platz', lat: 52.4881, lng: 13.3150, lines: ['U3', 'U6', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-kurfuerstendamm', name: 'Kurfürstendamm', nameEn: 'Kurfürstendamm', lat: 52.5039, lng: 13.3373, lines: ['U1', 'U3', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u3-uhlandstr', name: 'Uhlandstraße', nameEn: 'Uhlandstraße', lat: 52.4803, lng: 13.3163, lines: ['U1', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u3-gleisdreieck', name: 'Gleisdreieck', nameEn: 'Gleisdreieck', lat: 52.4971, lng: 13.3500, lines: ['U1', 'U2', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u3-hallesches-tor', name: 'Hallesches Tor', nameEn: 'Hallesches Tor', lat: 52.4981, lng: 13.3678, lines: ['U1', 'U3', 'U6'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u3-mehringdamm', name: 'Mehringdamm', nameEn: 'Mehringdamm', lat: 52.4985, lng: 13.3755, lines: ['U1', 'U3', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-prinzenstr', name: 'Prinzenstraße', nameEn: 'Prinzenstraße', lat: 52.4988, lng: 13.3856, lines: ['U1', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-gorlistzer-bahnhof', name: 'Görlitzer Bahnhof', nameEn: 'Görlitzer Bahnhof', lat: 52.4974, lng: 13.3958, lines: ['U1', 'U3'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u3-warschauer-str', name: 'Warschauer Straße', nameEn: 'Warschauer Straße', lat: 52.5018, lng: 13.4051, lines: ['U1', 'U3', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },

  // ── U4: Nollendorfplatz — Innsbrucker Platz ──
  { slug: 'u4-nollendorfplatz', name: 'Nollendorfplatz', nameEn: 'Nollendorfplatz', lat: 52.4975, lng: 13.3453, lines: ['U1', 'U2', 'U3', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u4-viktoria-luise-platz', name: 'Viktoria-Luise-Platz', nameEn: 'Viktoria-Luise-Platz', lat: 52.4939, lng: 13.3433, lines: ['U1', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u4-bayerischer-platz', name: 'Bayerischer Platz', nameEn: 'Bayerischer Platz', lat: 52.4881, lng: 13.3422, lines: ['U2', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u4-rathaus-schoeneberg', name: 'Rathaus Schöneberg', nameEn: 'Rathaus Schöneberg', lat: 52.4824, lng: 13.3413, lines: ['U2', 'U4'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u4-innsbrucker-platz', name: 'Innsbrucker Platz', nameEn: 'Innsbrucker Platz', lat: 52.4791, lng: 13.3444, lines: ['U4'], citySlug: 'berlin', zone: 'AB' },

  // ── U5: Alexanderplatz — Hönow ──
  { slug: 'u5-honow', name: 'Hönow', nameEn: 'Hönow', lat: 52.5374, lng: 13.5011, lines: ['U5'], citySlug: 'berlin', zone: 'BC', barrierFree: true },
  { slug: 'u5-wuhletal', name: 'Wuhletal', nameEn: 'Wuhletal', lat: 52.5230, lng: 13.4770, lines: ['U5', 'S41', 'S42', 'S5'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u5-kienberg', name: 'Kienberg', nameEn: 'Kienberg', lat: 52.5189, lng: 13.4698, lines: ['U5'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u5-lichtenberg', name: 'Lichtenberg', nameEn: 'Lichtenberg', lat: 52.5083, lng: 13.4476, lines: ['U5', 'S41', 'S42', 'S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u5-magdalenenstr', name: 'Magdalenenstraße', nameEn: 'Magdalenenstraße', lat: 52.5052, lng: 13.4401, lines: ['U5'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u5-frankfurter-tor', name: 'Frankfurter Tor', nameEn: 'Frankfurter Tor', lat: 52.4977, lng: 13.4241, lines: ['U5'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u5-samariterstr', name: 'Samariterstraße', nameEn: 'Samariterstraße', lat: 52.4961, lng: 13.4213, lines: ['U5'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u5-weberwiese', name: 'Weberwiese', nameEn: 'Weberwiese', lat: 52.4925, lng: 13.4145, lines: ['U5'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u5-schillingstr', name: 'Schillingstraße', nameEn: 'Schillingstraße', lat: 52.4858, lng: 13.4033, lines: ['U5'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u5-alexanderplatz', name: 'Alexanderplatz', nameEn: 'Alexanderplatz', lat: 52.5219, lng: 13.4132, lines: ['U2', 'U5', 'U8', 'S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u5-rathaus-spandau', name: 'Rathaus Spandau', nameEn: 'Rathaus Spandau', lat: 52.4410, lng: 13.3489, lines: ['U5', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u5-alt-tegel', name: 'Alt-Tegel', nameEn: 'Alt-Tegel', lat: 52.5423, lng: 13.3170, lines: ['U6'], citySlug: 'berlin', zone: 'AB', barrierFree: true },

  // ── U6: Alt-Tegel — Alt-Mariendorf ──
  { slug: 'u6-alt-tegel', name: 'Alt-Tegel', nameEn: 'Alt-Tegel', lat: 52.5423, lng: 13.3170, lines: ['U6'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u6-rathaus-reinickendorf', name: 'Rathaus Reinickendorf', nameEn: 'Rathaus Reinickendorf', lat: 52.5310, lng: 13.3034, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-karl-bonhoeffer-nervenklinik', name: 'Karl-Bonhoeffer-Nervenklinik', nameEn: 'Karl-Bonhoeffer-Nervenklinik', lat: 52.5255, lng: 13.2967, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-leopoldplatz', name: 'Leopoldplatz', nameEn: 'Leopoldplatz', lat: 52.5143, lng: 13.2835, lines: ['U6', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-wedding', name: 'Wedding', nameEn: 'Wedding', lat: 52.5083, lng: 13.2773, lines: ['U6', 'S41', 'S42'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u6-reinickendorfer-str', name: 'Reinickendorfer Straße', nameEn: 'Reinickendorfer Straße', lat: 52.5043, lng: 13.2735, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-naturkundemuseum', name: 'Naturkundemuseum', nameEn: 'Naturkundemuseum', lat: 52.4968, lng: 13.2670, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-oranienburger-tor', name: 'Oranienburger Tor', nameEn: 'Oranienburger Tor', lat: 52.4925, lng: 13.2640, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-unter-den-linden', name: 'Unter den Linden', nameEn: 'Unter den Linden', lat: 52.4873, lng: 13.2605, lines: ['U6', 'S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u6-friedrichstr', name: 'Friedrichstraße', nameEn: 'Friedrichstraße', lat: 52.4830, lng: 13.2567, lines: ['U6', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u6-hauptbahnhof', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 52.5253, lng: 13.3694, lines: ['U6', 'S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u6-konstanzer-str', name: 'Konstanzer Straße', nameEn: 'Konstanzer Straße', lat: 52.4525, lng: 13.2265, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-adenauerplatz', name: 'Adenauerplatz', nameEn: 'Adenauerplatz', lat: 52.4485, lng: 13.2225, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-fehrbelliner-platz', name: 'Fehrbelliner Platz', nameEn: 'Fehrbelliner Platz', lat: 52.4445, lng: 13.2185, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-heidelberger-platz', name: 'Heidelberger Platz', nameEn: 'Heidelberger Platz', lat: 52.4405, lng: 13.2145, lines: ['U3', 'U6', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u6-ruedelsheimer-platz', name: 'Rüdesheimer Platz', nameEn: 'Rüdesheimer Platz', lat: 52.4365, lng: 13.2105, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-breitenbachplatz', name: 'Breitenbachplatz', nameEn: 'Breitenbachplatz', lat: 52.4325, lng: 13.2065, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-tempelhof', name: 'Tempelhof', nameEn: 'Tempelhof', lat: 52.4245, lng: 13.1985, lines: ['U6'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u6-alt-mariendorf', name: 'Alt-Mariendorf', nameEn: 'Alt-Mariendorf', lat: 52.4205, lng: 13.1945, lines: ['U6'], citySlug: 'berlin', zone: 'AB', barrierFree: true },

  // ── U7: Rathaus Spandau — Rudow ──
  { slug: 'u7-rathaus-spandau', name: 'Rathaus Spandau', nameEn: 'Rathaus Spandau', lat: 52.4410, lng: 13.3489, lines: ['U5', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u7-altstadt-spandau', name: 'Altstadt Spandau', nameEn: 'Altstadt Spandau', lat: 52.4430, lng: 13.3430, lines: ['U7'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u7-zitadelle', name: 'Zitadelle', nameEn: 'Zitadelle', lat: 52.4460, lng: 13.3380, lines: ['U7'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u7-haselhorst', name: 'Haselhorst', nameEn: 'Haselhorst', lat: 52.4490, lng: 13.3330, lines: ['U7'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u7-siemensdamm', name: 'Siemensdamm', nameEn: 'Siemensdamm', lat: 52.4520, lng: 13.3280, lines: ['U7'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u7-halemweg', name: 'Halemweg', nameEn: 'Halemweg', lat: 52.4550, lng: 13.3230, lines: ['U7'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u7-karl-bonhoeffer', name: 'Karl-Bonhoeffer-Nervenklinik', nameEn: 'Karl-Bonhoeffer-Nervenklinik', lat: 52.5255, lng: 13.2967, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-adenauerplatz', name: 'Adenauerplatz', nameEn: 'Adenauerplatz', lat: 52.4485, lng: 13.2225, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-konstanzer-str', name: 'Konstanzer Straße', nameEn: 'Konstanzer Straße', lat: 52.4525, lng: 13.2265, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-fehrbelliner-platz', name: 'Fehrbelliner Platz', nameEn: 'Fehrbelliner Platz', lat: 52.4445, lng: 13.2185, lines: ['U6', 'U7'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-hermannplatz', name: 'Hermannplatz', nameEn: 'Hermannplatz', lat: 52.4365, lng: 13.2105, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u7-neukoelln', name: 'Neukölln', nameEn: 'Neukölln', lat: 52.4781, lng: 13.4318, lines: ['U7'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u7-leinestrasse', name: 'Leinestraße', nameEn: 'Leinestraße', lat: 52.4661, lng: 13.4198, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-britz-sued', name: 'Britz-Süd', nameEn: 'Britz-Süd', lat: 52.4621, lng: 13.4158, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u7-rudow', name: 'Rudow', nameEn: 'Rudow', lat: 52.4501, lng: 13.4038, lines: ['U7'], citySlug: 'berlin', zone: 'AB', barrierFree: true },

  // ── U8: Wittenau — Hermannplatz ──
  { slug: 'u8-wittenau', name: 'Wittenau', nameEn: 'Wittenau', lat: 52.4963, lng: 13.2813, lines: ['U8'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
  { slug: 'u8-rathaus-reinickendorf', name: 'Rathaus Reinickendorf', nameEn: 'Rathaus Reinickendorf', lat: 52.5310, lng: 13.3034, lines: ['U6', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-karl-bonhoeffer', name: 'Karl-Bonhoeffer-Nervenklinik', nameEn: 'Karl-Bonhoeffer-Nervenklinik', lat: 52.5255, lng: 13.2967, lines: ['U6', 'U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-osloer-str', name: 'Osloer Straße', nameEn: 'Osloer Straße', lat: 52.5143, lng: 13.2835, lines: ['U8', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-pankstr', name: 'Pankstraße', nameEn: 'Pankstraße', lat: 52.5103, lng: 13.2793, lines: ['U8'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u8-gesundbrunnen', name: 'Gesundbrunnen', nameEn: 'Gesundbrunnen', lat: 52.5063, lng: 13.2753, lines: ['U8', 'S41', 'S42', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u8-rosenthaler-platz', name: 'Rosenthaler Platz', nameEn: 'Rosenthaler Platz', lat: 52.4943, lng: 13.2633, lines: ['U2', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-alexanderplatz', name: 'Alexanderplatz', nameEn: 'Alexanderplatz', lat: 52.5219, lng: 13.4132, lines: ['U2', 'U5', 'U8', 'S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u8-jannowitzbrucke', name: 'Jannowitzbrücke', nameEn: 'Jannowitzbrücke', lat: 52.4863, lng: 13.2553, lines: ['U8'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u8-prinzenstr', name: 'Prinzenstraße', nameEn: 'Prinzenstraße', lat: 52.4988, lng: 13.3856, lines: ['U1', 'U3', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-gleisdreieck', name: 'Gleisdreieck', nameEn: 'Gleisdreieck', lat: 52.4971, lng: 13.3500, lines: ['U1', 'U2', 'U3', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u8-mehringdamm', name: 'Mehringdamm', nameEn: 'Mehringdamm', lat: 52.4985, lng: 13.3755, lines: ['U1', 'U3', 'U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-kottbusser-tor', name: 'Kottbusser Tor', nameEn: 'Kottbusser Tor', lat: 52.4741, lng: 13.4278, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-gorlitzer-bahnhof', name: 'Görlitzer Bahnhof', nameEn: 'Görlitzer Bahnhof', lat: 52.4974, lng: 13.3958, lines: ['U1', 'U3', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-hermannplatz', name: 'Hermannplatz', nameEn: 'Hermannplatz', lat: 52.4365, lng: 13.2105, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u8-leinestrasse', name: 'Leinestraße', nameEn: 'Leinestraße', lat: 52.4661, lng: 13.4198, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u8-britz-sued', name: 'Britz-Süd', nameEn: 'Britz-Süd', lat: 52.4621, lng: 13.4158, lines: ['U7', 'U8'], citySlug: 'berlin', zone: 'AB', interchange: true },

  // ── U9: Osloer Straße — Rathaus Steglitz ──
  { slug: 'u9-osloer-str', name: 'Osloer Straße', nameEn: 'Osloer Straße', lat: 52.5143, lng: 13.2835, lines: ['U8', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u9-nauener-platz', name: 'Nauener Platz', nameEn: 'Nauener Platz', lat: 52.5103, lng: 13.2793, lines: ['U9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u9-leopoldplatz', name: 'Leopoldplatz', nameEn: 'Leopoldplatz', lat: 52.5143, lng: 13.2835, lines: ['U6', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u9-amrumer-str', name: 'Amrumer Straße', nameEn: 'Amrumer Straße', lat: 52.5063, lng: 13.2753, lines: ['U9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'u9-kurfuerstendamm', name: 'Kurfürstendamm', nameEn: 'Kurfürstendamm', lat: 52.5039, lng: 13.3373, lines: ['U1', 'U3', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'u9-heidelberger-platz', name: 'Heidelberger Platz', nameEn: 'Heidelberger Platz', lat: 52.4405, lng: 13.2145, lines: ['U3', 'U6', 'U9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'u9-rathaus-steglitz', name: 'Rathaus Steglitz', nameEn: 'Rathaus Steglitz', lat: 52.4365, lng: 13.2105, lines: ['U9'], citySlug: 'berlin', zone: 'AB', barrierFree: true },
]

// ══════════════════════════════════════════════════════════════════
// ALL BERLIN S-BAHN STATIONS (key interchanges + ring)
// ══════════════════════════════════════════════════════════════════

const berlinSStations: DeMetroStation[] = [
  { slug: 'sb-westkreuz', name: 'Westkreuz', nameEn: 'Westkreuz', lat: 52.5011, lng: 13.2847, lines: ['S41', 'S42', 'S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-schoeneberg', name: 'Schöneberg', nameEn: 'Schöneberg', lat: 52.4870, lng: 13.3470, lines: ['S41', 'S42'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-suedkreuz', name: 'Südkreuz', nameEn: 'Südkreuz', lat: 52.4768, lng: 13.3677, lines: ['S41', 'S42', 'S45', 'S46'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-tempelhof', name: 'Tempelhof', nameEn: 'Tempelhof', lat: 52.4687, lng: 13.3893, lines: ['S41', 'S42', 'S45', 'S46'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-sonnenallee', name: 'Sonnenallee', nameEn: 'Sonnenallee', lat: 52.4748, lng: 13.4103, lines: ['S41', 'S42', 'S45', 'S46'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-neukoelln', name: 'Neukölln', nameEn: 'Neukölln', lat: 52.4781, lng: 13.4318, lines: ['S41', 'S42', 'S45', 'S46'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-koepenick', name: 'Köpenick', nameEn: 'Köpenick', lat: 52.4387, lng: 13.5793, lines: ['S41', 'S42', 'S3'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-wuhletal', name: 'Wuhletal', nameEn: 'Wuhletal', lat: 52.5230, lng: 13.4770, lines: ['S41', 'S42', 'S5'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-marzahn', name: 'Marzahn', nameEn: 'Marzahn', lat: 52.5200, lng: 13.5287, lines: ['S41', 'S42', 'S5'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-lichtenberg', name: 'Lichtenberg', nameEn: 'Lichtenberg', lat: 52.5083, lng: 13.4476, lines: ['S41', 'S42', 'S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-ostkreuz', name: 'Ostkreuz', nameEn: 'Ostkreuz', lat: 52.4961, lng: 13.4698, lines: ['S41', 'S42', 'S3', 'S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-warschauer-str', name: 'Warschauer Straße', nameEn: 'Warschauer Straße', lat: 52.5018, lng: 13.4051, lines: ['S41', 'S42', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-gesundbrunnen', name: 'Gesundbrunnen', nameEn: 'Gesundbrunnen', lat: 52.5063, lng: 13.2753, lines: ['S41', 'S42', 'S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-wedding', name: 'Wedding', nameEn: 'Wedding', lat: 52.5083, lng: 13.2773, lines: ['S41', 'S42', 'S6'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-beusselstr', name: 'Beußelstraße', nameEn: 'Beußelstraße', lat: 52.5103, lng: 13.2793, lines: ['S41', 'S42'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-westhafen', name: 'Westhafen', nameEn: 'Westhafen', lat: 52.5123, lng: 13.2813, lines: ['S41', 'S42', 'S6'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'sb-hauptbahnhof', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 52.5253, lng: 13.3694, lines: ['S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-brandenburger-tor', name: 'Brandenburger Tor', nameEn: 'Brandenburger Tor', lat: 52.5172, lng: 13.3763, lines: ['S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-friedrichstr', name: 'Friedrichstraße', nameEn: 'Friedrichstraße', lat: 52.5206, lng: 13.3867, lines: ['S1', 'S2', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-alexanderplatz', name: 'Alexanderplatz', nameEn: 'Alexanderplatz', lat: 52.5219, lng: 13.4132, lines: ['S5', 'S7', 'S9', 'S75'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-jungfernheide', name: 'Jungfernheide', nameEn: 'Jungfernheide', lat: 52.5309, lng: 13.3147, lines: ['S41', 'S42', 'S6'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-charlottenburg', name: 'Charlottenburg', nameEn: 'Charlottenburg', lat: 52.5049, lng: 13.3127, lines: ['S41', 'S42', 'S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-savignyplatz', name: 'Savignyplatz', nameEn: 'Savignyplatz', lat: 52.5049, lng: 13.3227, lines: ['S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-tiergarten', name: 'Tiergarten', nameEn: 'Tiergarten', lat: 52.5129, lng: 13.3427, lines: ['S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-bellevue', name: 'Bellevue', nameEn: 'Bellevue', lat: 52.5189, lng: 13.3527, lines: ['S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-westend', name: 'Westend', nameEn: 'Westend', lat: 52.5069, lng: 13.2747, lines: ['S5', 'S7', 'S75', 'S9'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-grunewald', name: 'Grunewald', nameEn: 'Grunewald', lat: 52.4889, lng: 13.2487, lines: ['S5', 'S7', 'S75'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-wannsee', name: 'Wannsee', nameEn: 'Wannsee', lat: 52.4229, lng: 13.1507, lines: ['S1', 'S7'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-zoologischer-garten', name: 'Zoologischer Garten', nameEn: 'Zoologischer Garten', lat: 52.5072, lng: 13.3359, lines: ['S1', 'S2', 'S5', 'S7', 'S9', 'S25', 'S26'], citySlug: 'berlin', zone: 'AB', interchange: true, barrierFree: true },
  { slug: 'sb-treptower-park', name: 'Treptower Park', nameEn: 'Treptower Park', lat: 52.4787, lng: 13.4517, lines: ['S3', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'sb-adlershof', name: 'Adlershof', nameEn: 'Adlershof', lat: 52.4387, lng: 13.5417, lines: ['S3', 'S9'], citySlug: 'berlin', zone: 'AB', interchange: true },
  { slug: 'sb-friedrichshagen', name: 'Friedrichshagen', nameEn: 'Friedrichshagen', lat: 52.4487, lng: 13.6217, lines: ['S3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-rahnsdorf', name: 'Rahnsdorf', nameEn: 'Rahnsdorf', lat: 52.4487, lng: 13.6617, lines: ['S3'], citySlug: 'berlin', zone: 'AB' },
  { slug: 'sb-schmoekwitz', name: 'Schmöckwitz', nameEn: 'Schmöckwitz', lat: 52.4387, lng: 13.6817, lines: ['S3'], citySlug: 'berlin', zone: 'AB' },
]

// ══════════════════════════════════════════════════════════════════
// OTHER GERMAN METRO SYSTEMS
// ══════════════════════════════════════════════════════════════════

const munichSystem: DeMetroSystem = {
  citySlug: 'munich', cc: 'DE', name: 'München U-Bahn / S-Bahn',
  status: 'operational', totalKm: 103.0, totalStations: 96, yearOpened: 1972, dailyRidership: 1_100_000, fareZone: 'M-1',
  lines: [
    { name: 'U1', color: '#00953B', type: 'u-bahn', stations: 13, km: 12.0, yearOpened: 1980 },
    { name: 'U2', color: '#C8102E', type: 'u-bahn', stations: 27, km: 24.0, yearOpened: 1980 },
    { name: 'U3', color: '#F5D122', type: 'u-bahn', stations: 18, km: 19.0, yearOpened: 1972 },
    { name: 'U6', color: '#009F8F', type: 'u-bahn', stations: 24, km: 27.0, yearOpened: 1972 },
    { name: 'S1', color: '#006633', type: 's-bahn', stations: 15, km: 32.0, yearOpened: 1972 },
    { name: 'S2', color: '#006633', type: 's-bahn', stations: 16, km: 35.0, yearOpened: 1972 },
    { name: 'S3', color: '#006633', type: 's-bahn', stations: 14, km: 28.0, yearOpened: 1972 },
    { name: 'S4', color: '#006633', type: 's-bahn', stations: 18, km: 42.0, yearOpened: 1972 },
    { name: 'S6', color: '#006633', type: 's-bahn', stations: 17, km: 38.0, yearOpened: 1972 },
    { name: 'S7', color: '#006633', type: 's-bahn', stations: 15, km: 30.0, yearOpened: 1972 },
    { name: 'S8', color: '#006633', type: 's-bahn', stations: 16, km: 35.0, yearOpened: 1972 },
  ],
  stations: [
    { slug: 'marienplatz', name: 'Marienplatz', nameEn: 'Marienplatz', lat: 48.1372, lng: 11.5755, lines: ['U3', 'U6', 'S1', 'S2', 'S3', 'S4', 'S6', 'S7', 'S8'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'hbf-munich', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 48.1397, lng: 11.5598, lines: ['U1', 'U2', 'S1', 'S2', 'S3', 'S4', 'S6', 'S7', 'S8'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'sendlinger-tor', name: 'Sendlinger Tor', nameEn: 'Sendlinger Tor', lat: 48.1336, lng: 11.5667, lines: ['U1', 'U2', 'U3', 'U6'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'odeonsplatz', name: 'Odeonsplatz', nameEn: 'Odeonsplatz', lat: 48.1430, lng: 11.5794, lines: ['U3', 'U6'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'universitaet', name: 'Universität', nameEn: 'Universität', lat: 48.1524, lng: 11.5801, lines: ['U3', 'U6'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'muenchner-freiheit', name: 'Münchner Freiheit', nameEn: 'Münchner Freiheit', lat: 48.1612, lng: 11.5878, lines: ['U3', 'U6'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'harras', name: 'Harras', nameEn: 'Harras', lat: 48.1195, lng: 11.5523, lines: ['U6', 'S4', 'S7'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'ostbahnhof', name: 'Ostbahnhof', nameEn: 'Ostbahnhof', lat: 48.1302, lng: 11.5821, lines: ['U1', 'S1', 'S2', 'S3', 'S4', 'S6', 'S7', 'S8'], citySlug: 'munich', zone: 'M-1', interchange: true, barrierFree: true },
    { slug: 'garching-forschungszentrum', name: 'Garching-Forschungszentrum', nameEn: 'Garching-Forschungszentrum', lat: 48.1853, lng: 11.6077, lines: ['U6'], citySlug: 'munich', zone: 'M-1', barrierFree: true },
    { slug: 'neufahrn', name: 'Neufahrn', nameEn: 'Neufahrn', lat: 48.1022, lng: 11.6052, lines: ['U1'], citySlug: 'munich', zone: 'M-1' },
  ],
}

const hamburgSystem: DeMetroSystem = {
  citySlug: 'hamburg', cc: 'DE', name: 'Hamburg U-Bahn / S-Bahn',
  status: 'operational', totalKm: 139.0, totalStations: 107, yearOpened: 1906, dailyRidership: 850_000, fareZone: 'HVV',
  lines: [
    { name: 'U1', color: '#C8102E', type: 'u-bahn', stations: 25, km: 19.7, yearOpened: 1912 },
    { name: 'U2', color: '#0055A4', type: 'u-bahn', stations: 23, km: 20.2, yearOpened: 1913 },
    { name: 'U3', color: '#6D3E1E', type: 'u-bahn', stations: 25, km: 20.6, yearOpened: 1906 },
    { name: 'U4', color: '#009F8F', type: 'u-bahn', stations: 12, km: 8.5, yearOpened: 2012 },
    { name: 'S1', color: '#006633', type: 's-bahn', stations: 18, km: 32.0, yearOpened: 1907 },
    { name: 'S2', color: '#006633', type: 's-bahn', stations: 20, km: 35.0, yearOpened: 1907 },
    { name: 'S3', color: '#006633', type: 's-bahn', stations: 15, km: 28.0, yearOpened: 1907 },
  ],
  stations: [
    { slug: 'hbf-hamburg', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 53.5527, lng: 10.0064, lines: ['U1', 'U2', 'U3', 'S1', 'S2', 'S3'], citySlug: 'hamburg', zone: 'Kernzone', interchange: true, barrierFree: true },
    { slug: 'landungsbruecken', name: 'Landungsbrücken', nameEn: 'Landungsbrücken', lat: 53.5470, lng: 9.9647, lines: ['U3', 'S1', 'S2', 'S3'], citySlug: 'hamburg', zone: 'Kernzone', interchange: true, barrierFree: true },
    { slug: 'berliner-tor', name: 'Berliner Tor', nameEn: 'Berliner Tor', lat: 53.5520, lng: 10.0237, lines: ['U2', 'U3', 'S1', 'S2', 'S3'], citySlug: 'hamburg', zone: 'Kernzone', interchange: true, barrierFree: true },
    { slug: 'juengstieg', name: 'Jungfernstieg', nameEn: 'Jungfernstieg', lat: 53.5537, lng: 9.9904, lines: ['U1', 'U2', 'S1', 'S2', 'S3'], citySlug: 'hamburg', zone: 'Kernzone', interchange: true, barrierFree: true },
    { slug: 'barmbek', name: 'Barmbek', nameEn: 'Barmbek', lat: 53.5557, lng: 10.0404, lines: ['U3', 'S1', 'S2', 'S3'], citySlug: 'hamburg', zone: 'Kernzone', interchange: true, barrierFree: true },
    { slug: 'st-pauli', name: 'St. Pauli', nameEn: 'St. Pauli', lat: 53.5537, lng: 9.9754, lines: ['U3'], citySlug: 'hamburg', zone: 'Kernzone' },
    { slug: 'reeperbahn', name: 'Reeperbahn', nameEn: 'Reeperbahn', lat: 53.5517, lng: 9.9704, lines: ['U3'], citySlug: 'hamburg', zone: 'Kernzone' },
    { slug: 'wandsbeker-chaussee', name: 'Wandsbeker Chaussee', nameEn: 'Wandsbeker Chaussee', lat: 53.5620, lng: 10.0537, lines: ['U1'], citySlug: 'hamburg', zone: 'Kernzone' },
    { slug: 'hagenbecks-tierpark', name: 'Hagenbecks Tierpark', nameEn: 'Hagenbecks Tierpark', lat: 53.5377, lng: 9.9354, lines: ['U2'], citySlug: 'hamburg', zone: 'Kernzone' },
  ],
}

const frankfurtSystem: DeMetroSystem = {
  citySlug: 'frankfurt', cc: 'DE', name: 'Frankfurt U-Bahn / S-Bahn',
  status: 'operational', totalKm: 125.0, totalStations: 86, yearOpened: 1968, dailyRidership: 600_000, fareZone: 'RMV',
  lines: [
    { name: 'U1', color: '#C8102E', type: 'u-bahn', stations: 15, km: 12.8, yearOpened: 1968 },
    { name: 'U2', color: '#0055A4', type: 'u-bahn', stations: 15, km: 13.2, yearOpened: 1968 },
    { name: 'U3', color: '#00953B', type: 'u-bahn', stations: 17, km: 15.3, yearOpened: 1968 },
    { name: 'U4', color: '#F5D122', type: 'u-bahn', stations: 14, km: 12.3, yearOpened: 1980 },
    { name: 'U5', color: '#E30613', type: 'u-bahn', stations: 11, km: 12.8, yearOpened: 1980 },
    { name: 'U6', color: '#7B5D37', type: 'u-bahn', stations: 12, km: 12.5, yearOpened: 1999 },
    { name: 'U7', color: '#009F8F', type: 'u-bahn', stations: 11, km: 11.3, yearOpened: 1999 },
    { name: 'U8', color: '#7B5D37', type: 'u-bahn', stations: 8, km: 8.0, yearOpened: 1999 },
    { name: 'S1', color: '#006633', type: 's-bahn', stations: 12, km: 25.0, yearOpened: 1978 },
    { name: 'S2', color: '#006633', type: 's-bahn', stations: 14, km: 30.0, yearOpened: 1978 },
    { name: 'S3', color: '#006633', type: 's-bahn', stations: 10, km: 20.0, yearOpened: 1978 },
    { name: 'S4', color: '#006633', type: 's-bahn', stations: 12, km: 28.0, yearOpened: 1978 },
    { name: 'S5', color: '#006633', type: 's-bahn', stations: 11, km: 22.0, yearOpened: 1978 },
    { name: 'S6', color: '#006633', type: 's-bahn', stations: 13, km: 26.0, yearOpened: 1978 },
  ],
  stations: [
    { slug: 'hbf-frankfurt', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 50.1072, lng: 8.6638, lines: ['U4', 'U5', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'willy-brandt-platz', name: 'Willy-Brandt-Platz', nameEn: 'Willy-Brandt-Platz', lat: 50.1062, lng: 8.6728, lines: ['U1', 'U2', 'U3', 'U4', 'U5'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'dom-roemer', name: 'Dom/Römer', nameEn: 'Dom/Römer', lat: 50.1102, lng: 8.6828, lines: ['U1', 'U2', 'U3'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'konstablerwache', name: 'Konstablerwache', nameEn: 'Konstablerwache', lat: 50.1134, lng: 8.6843, lines: ['U4', 'U6', 'U7', 'U8', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'zoo', name: 'Zoo', nameEn: 'Zoo', lat: 50.1140, lng: 8.6964, lines: ['U5', 'U6', 'U7', 'U8'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'ostbahnhof', name: 'Ostbahnhof', nameEn: 'Ostbahnhof', lat: 50.1102, lng: 8.7064, lines: ['U6', 'U7', 'U8', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
    { slug: 'luftbrueckdenkmal', name: 'Luftbrückendenkmal', nameEn: 'Luftbrückendenkmal', lat: 50.0982, lng: 8.6438, lines: ['U1', 'U2', 'U3'], citySlug: 'frankfurt', zone: 'RMV' },
    { slug: 'suedbahnhof', name: 'Südbahnhof', nameEn: 'Südbahnhof', lat: 50.0982, lng: 8.6538, lines: ['U1', 'U2', 'U3', 'S3', 'S4', 'S5', 'S6'], citySlug: 'frankfurt', zone: 'RMV', interchange: true, barrierFree: true },
  ],
}

const cologneSystem: DeMetroSystem = {
  citySlug: 'cologne', cc: 'DE', name: 'Köln Stadtbahn',
  status: 'operational', totalKm: 70.0, totalStations: 62, yearOpened: 1968, dailyRidership: 350_000, fareZone: 'VRS',
  lines: [
    { name: 'Line 1', color: '#C8102E', type: 'stadtbahn', stations: 22, km: 18.5, yearOpened: 1968 },
    { name: 'Line 3', color: '#0055A4', type: 'stadtbahn', stations: 18, km: 15.0, yearOpened: 1968 },
    { name: 'Line 4', color: '#00953B', type: 'stadtbahn', stations: 14, km: 12.0, yearOpened: 1968 },
    { name: 'Line 5', color: '#F5D122', type: 'stadtbahn', stations: 10, km: 8.0, yearOpened: 1968 },
    { name: 'Line 6', color: '#E30613', type: 'stadtbahn', stations: 8, km: 6.0, yearOpened: 1975 },
    { name: 'Line 7', color: '#00A1DE', type: 'stadtbahn', stations: 6, km: 5.0, yearOpened: 1975 },
    { name: 'Line 8', color: '#9B26B6', type: 'stadtbahn', stations: 5, km: 4.0, yearOpened: 1975 },
    { name: 'Line 9', color: '#7B5D37', type: 'stadtbahn', stations: 5, km: 4.5, yearOpened: 1975 },
  ],
  stations: [
    { slug: 'neumarkt', name: 'Neumarkt', nameEn: 'Neumarkt', lat: 50.9361, lng: 6.9531, lines: ['1', '3', '4', '5', '6', '7', '9'], citySlug: 'cologne', zone: 'VRS', interchange: true, barrierFree: true },
    { slug: 'hbf-cologne', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 50.9429, lng: 6.9585, lines: ['1', '3', '5', '7', '8', '9'], citySlug: 'cologne', zone: 'VRS', interchange: true, barrierFree: true },
    { slug: 'dom-bahnhof', name: 'Dom/Hbf', nameEn: 'Dom/Hbf', lat: 50.9439, lng: 6.9588, lines: ['5', '6', '16', '18'], citySlug: 'cologne', zone: 'VRS', interchange: true, barrierFree: true },
    { slug: 'breslauer-platz', name: 'Breslauer Platz', nameEn: 'Breslauer Platz', lat: 50.9419, lng: 6.9575, lines: ['1', '3', '7', '9'], citySlug: 'cologne', zone: 'VRS', interchange: true },
    { slug: 'suedbahnhof-cologne', name: 'Südbahnhof', nameEn: 'Südbahnhof', lat: 50.9299, lng: 6.9605, lines: ['1', '9'], citySlug: 'cologne', zone: 'VRS', interchange: true, barrierFree: true },
  ],
}

const stuttgartSystem: DeMetroSystem = {
  citySlug: 'stuttgart', cc: 'DE', name: 'Stuttgart Stadtbahn',
  status: 'operational', totalKm: 64.0, totalStations: 57, yearOpened: 1975, dailyRidership: 300_000, fareZone: 'VVS',
  lines: [
    { name: 'U1', color: '#C8102E', type: 'stadtbahn', stations: 16, km: 12.0, yearOpened: 1975 },
    { name: 'U2', color: '#0055A4', type: 'stadtbahn', stations: 22, km: 19.0, yearOpened: 1975 },
    { name: 'U3', color: '#00953B', type: 'stadtbahn', stations: 17, km: 14.0, yearOpened: 1985 },
    { name: 'U4', color: '#F5D122', type: 'stadtbahn', stations: 14, km: 10.0, yearOpened: 1991 },
    { name: 'U5', color: '#E30613', type: 'stadtbahn', stations: 12, km: 9.0, yearOpened: 1991 },
    { name: 'U6', color: '#7B5D37', type: 'stadtbahn', stations: 10, km: 8.0, yearOpened: 1991 },
    { name: 'U7', color: '#009F8F', type: 'stadtbahn', stations: 9, km: 7.0, yearOpened: 1991 },
    { name: 'U9', color: '#9B26B6', type: 'stadtbahn', stations: 5, km: 5.0, yearOpened: 1993 },
  ],
  stations: [
    { slug: 'charlottenplatz', name: 'Charlottenplatz', nameEn: 'Charlottenplatz', lat: 48.7753, lng: 9.1804, lines: ['U1', 'U2', 'U4', 'U5', 'U6', 'U7'], citySlug: 'stuttgart', zone: 'VVS', interchange: true, barrierFree: true },
    { slug: 'hbf-stuttgart', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 48.7839, lng: 9.1811, lines: ['U1', 'U2', 'U3', 'U5', 'U6', 'U7', 'U9'], citySlug: 'stuttgart', zone: 'VVS', interchange: true, barrierFree: true },
    { slug: 'staatsoper', name: 'Staatsoper', nameEn: 'Staatsoper', lat: 48.7785, lng: 9.1790, lines: ['U1', 'U2', 'U4', 'U5', 'U6', 'U7'], citySlug: 'stuttgart', zone: 'VVS', interchange: true },
  ],
}

const nurembergSystem: DeMetroSystem = {
  citySlug: 'nuremberg', cc: 'DE', name: 'Nürnberg U-Bahn',
  status: 'operational', totalKm: 38.2, totalStations: 49, yearOpened: 1972, dailyRidership: 130_000, fareZone: 'VGN',
  lines: [
    { name: 'U1', color: '#E30613', type: 'u-bahn', stations: 27, km: 18.5, yearOpened: 1972 },
    { name: 'U2', color: '#0055A4', type: 'u-bahn', stations: 16, km: 13.4, yearOpened: 1974 },
    { name: 'U3', color: '#F5D122', type: 'u-bahn', stations: 12, km: 11.2, yearOpened: 2008 },
  ],
  stations: [
    { slug: 'plaerrer', name: 'Plärrer', nameEn: 'Plärrer', lat: 49.4503, lng: 11.0687, lines: ['U1', 'U2', 'U3'], citySlug: 'nuremberg', zone: 'VGN', interchange: true, barrierFree: true },
    { slug: 'hbf-nuremberg', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 49.4463, lng: 11.0791, lines: ['U1', 'U2', 'U3'], citySlug: 'nuremberg', zone: 'VGN', interchange: true, barrierFree: true },
    { slug: 'flughafen-nuremberg', name: 'Flughafen', nameEn: 'Flughafen', lat: 49.4901, lng: 11.0818, lines: ['U2'], citySlug: 'nuremberg', zone: 'VGN', barrierFree: true },
    { slug: 'laufer-tor', name: 'Laufer Tor', nameEn: 'Laufer Tor', lat: 49.4573, lng: 11.0717, lines: ['U1', 'U2'], citySlug: 'nuremberg', zone: 'VGN', interchange: true },
    { slug: 'hallplatz', name: 'Hallplatz', nameEn: 'Hallplatz', lat: 49.4533, lng: 11.0757, lines: ['U1', 'U3'], citySlug: 'nuremberg', zone: 'VGN', interchange: true },
  ],
}

const hanoverSystem: DeMetroSystem = {
  citySlug: 'hanover', cc: 'DE', name: 'Hannover Stadtbahn',
  status: 'operational', totalKm: 121.0, totalStations: 196, yearOpened: 1975, dailyRidership: 390_000, fareZone: 'GVH',
  lines: [
    { name: 'Lines 1-11', color: '#C8102E', type: 'stadtbahn', stations: 196, km: 121.0, yearOpened: 1975 },
  ],
  stations: [
    { slug: 'kropcke', name: 'Kröpcke', nameEn: 'Kröpcke', lat: 52.3744, lng: 9.7386, lines: ['1-8', '10', '11', '13'], citySlug: 'hanover', zone: 'GVH', interchange: true, barrierFree: true },
    { slug: 'hbf-hannover', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 52.3769, lng: 9.7415, lines: ['1-8', '10', '11', '13'], citySlug: 'hanover', zone: 'GVH', interchange: true, barrierFree: true },
    { slug: 'aitzelmuehle', name: 'Aegidientorplatz', nameEn: 'Aegidientorplatz', lat: 52.3724, lng: 9.7356, lines: ['3', '4', '5', '6', '8'], citySlug: 'hanover', zone: 'GVH', interchange: true },
  ],
}

const duesseldorfSystem: DeMetroSystem = {
  citySlug: 'duesseldorf', cc: 'DE', name: 'Düsseldorf Stadtbahn',
  status: 'operational', totalKm: 103.0, totalStations: 95, yearOpened: 1981, dailyRidership: 170_000, fareZone: 'VRR',
  lines: [
    { name: 'U71-U83', color: '#C8102E', type: 'stadtbahn', stations: 95, km: 103.0, yearOpened: 1981 },
  ],
  stations: [
    { slug: 'hbf-duesseldorf', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 51.2161, lng: 6.7951, lines: ['U71', 'U72', 'U73', 'U78', 'U79', 'U83'], citySlug: 'duesseldorf', zone: 'VRR', interchange: true, barrierFree: true },
    { slug: 'heinrich-heine-altee', name: 'Heinrich-Heine-Allee', nameEn: 'Heinrich-Heine-Allee', lat: 51.2254, lng: 6.7763, lines: ['U70', 'U71', 'U72', 'U73', 'U83'], citySlug: 'duesseldorf', zone: 'VRR', interchange: true, barrierFree: true },
  ],
}

const dortmundSystem: DeMetroSystem = {
  citySlug: 'dortmund', cc: 'DE', name: 'Dortmund Stadtbahn',
  status: 'operational', totalKm: 79.0, totalStations: 75, yearOpened: 1985, dailyRidership: 130_000, fareZone: 'VRR',
  lines: [
    { name: 'U41-U49', color: '#C8102E', type: 'stadtbahn', stations: 75, km: 79.0, yearOpened: 1985 },
  ],
  stations: [
    { slug: 'hbf-dortmund', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 51.5184, lng: 7.4579, lines: ['U41', 'U43', 'U45', 'U47', 'U49'], citySlug: 'dortmund', zone: 'VRR', interchange: true, barrierFree: true },
    { slug: 'stadtgarten', name: 'Stadtgarten', nameEn: 'Stadtgarten', lat: 51.5123, lng: 7.4639, lines: ['U41', 'U45', 'U47', 'U49'], citySlug: 'dortmund', zone: 'VRR', interchange: true },
  ],
}

const essenSystem: DeMetroSystem = {
  citySlug: 'essen', cc: 'DE', name: 'Essen Stadtbahn',
  status: 'operational', totalKm: 29.0, totalStations: 45, yearOpened: 1977, dailyRidership: 100_000, fareZone: 'VRR',
  lines: [
    { name: 'U11', color: '#0055A4', type: 'stadtbahn', stations: 19, km: 12.0, yearOpened: 1977 },
    { name: 'U17', color: '#00953B', type: 'stadtbahn', stations: 15, km: 8.5, yearOpened: 1981 },
    { name: 'U18', color: '#F5D122', type: 'stadtbahn', stations: 11, km: 8.5, yearOpened: 1979 },
  ],
  stations: [
    { slug: 'hbf-essen', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 51.4515, lng: 7.0127, lines: ['U11', 'U17', 'U18'], citySlug: 'essen', zone: 'VRR', interchange: true, barrierFree: true },
    { slug: 'berliner-platz', name: 'Berliner Platz', nameEn: 'Berliner Platz', lat: 51.4566, lng: 7.0068, lines: ['U11', 'U17', 'U18'], citySlug: 'essen', zone: 'VRR', interchange: true },
  ],
}

const bochumSystem: DeMetroSystem = {
  citySlug: 'bochum', cc: 'DE', name: 'Bochum Stadtbahn',
  status: 'operational', totalKm: 51.0, totalStations: 55, yearOpened: 1989, dailyRidership: 90_000, fareZone: 'VRR',
  lines: [
    { name: 'U35', color: '#C8102E', type: 'stadtbahn', stations: 20, km: 16.0, yearOpened: 1989 },
  ],
  stations: [
    { slug: 'hbf-bochum', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 51.4805, lng: 7.2120, lines: ['U35'], citySlug: 'bochum', zone: 'VRR', interchange: true, barrierFree: true },
    { slug: 'rathaus-sued', name: 'Rathaus Süd', nameEn: 'Rathaus Süd', lat: 51.4819, lng: 7.2163, lines: ['U35'], citySlug: 'bochum', zone: 'VRR' },
  ],
}

const duisburgSystem: DeMetroSystem = {
  citySlug: 'duisburg', cc: 'DE', name: 'Duisburg Stadtbahn',
  status: 'operational', totalKm: 66.0, totalStations: 62, yearOpened: 1992, dailyRidership: 90_000, fareZone: 'VRR',
  lines: [
    { name: 'U79', color: '#C8102E', type: 'stadtbahn', stations: 22, km: 27.0, yearOpened: 1992 },
  ],
  stations: [
    { slug: 'hbf-duisburg', name: 'Hauptbahnhof', nameEn: 'Hauptbahnhof', lat: 51.4310, lng: 6.7728, lines: ['U79'], citySlug: 'duisburg', zone: 'VRR', interchange: true, barrierFree: true },
    { slug: 'koenig-heinrich-platz', name: 'König-Heinrich-Platz', nameEn: 'König-Heinrich-Platz', lat: 51.4343, lng: 6.7621, lines: ['U79'], citySlug: 'duisburg', zone: 'VRR', interchange: true },
  ],
}

// ══════════════════════════════════════════════════════════════════
// EXPORTED: ALL GERMAN METRO SYSTEMS
// ══════════════════════════════════════════════════════════════════

// ponytail: rows are per-line; merge same-name rows into one canonical station
// (merged lines, first slug wins) so one station = one page. If per-line pages
// are ever wanted, add a /line/[line] route instead of duplicate station slugs.
function dedupeStations(rows: DeMetroStation[]): DeMetroStation[] {
  const byName = new Map<string, DeMetroStation>()
  for (const r of rows) {
    const key = `${r.citySlug}:${r.name}`
    const prev = byName.get(key)
    if (!prev) {
      byName.set(key, { ...r, lines: [...r.lines] })
      continue
    }
    prev.lines = [...new Set([...prev.lines, ...r.lines])]
    prev.interchange = prev.interchange || r.interchange
    prev.barrierFree = prev.barrierFree || r.barrierFree
  }
  return [...byName.values()]
}

// OSM route relations (BVG U1–U9) are the line-membership source of truth:
// closed stations never appear (no route membership). Refetch via
// scripts/fetch-berlin-ubahn.ts when BVG changes anything.
type OsmStationRow = { n: string; la: number; ln: number; l: string[] }
const BERLIN_U_OSM = (berlinUOsm as { stations: OsmStationRow[] }).stations

function kebabDe(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Wiki-roster stations absent from OSM U6 relation members (northern U6 stretch);
 *  coords via Overpass `station=subway` nodes, 2026-09-12. Refetch with the route
 *  query once OSM adds them as relation members. */
const BERLIN_U_EXTRAS: OsmStationRow[] = [
  { n: 'Alt-Tegel', la: 52.5894565, ln: 13.2837514, l: ['U6'] },
  { n: 'Borsigwerke', la: 52.5818407, ln: 13.2905918, l: ['U6'] },
  { n: 'Holzhauser Straße', la: 52.575692, ln: 13.2961132, l: ['U6'] },
  { n: 'Otisstraße', la: 52.570982, ln: 13.302868, l: ['U6'] },
  { n: 'Scharnweberstraße', la: 52.566774, ln: 13.312574, l: ['U6'] },
]

/**
 * OSM-first canonical build: coords + lines ALWAYS from live route relations
 * (verified 170/170 against the Wikipedia roster, 2026-09-12). Curated rows
 * only lend their slug (URL stability), zone and nameEn; their lat/lng/lines
 * predate verification and are never read. One station = one page.
 */
function canonicalFromOsm(
  osm: OsmStationRow[],
  enrich: DeMetroStation[],
  extras: OsmStationRow[],
): DeMetroStation[] {
  const meta = new Map(enrich.map((r) => [r.name.toLowerCase(), r]))
  const out: DeMetroStation[] = []
  for (const o of [...osm, ...extras]) {
    const m = meta.get(o.n.toLowerCase())
    const lines = [...new Set(o.l)].filter((l) => /^U\d+$/.test(l))
    if (lines.length === 0) continue
    out.push({
      slug: m?.slug ?? kebabDe(o.n),
      name: o.n,
      nameEn: m?.nameEn ?? o.n,
      lat: o.la,
      lng: o.ln,
      lines,
      citySlug: 'berlin',
      zone: m?.zone,
      interchange: lines.length > 1,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

const berlinUCanonical = canonicalFromOsm(
  BERLIN_U_OSM,
  dedupeStations(berlinUStations),
  BERLIN_U_EXTRAS,
)
const berlinSCanonical = dedupeStations(berlinSStations)

export const BERLIN_UBAHN: DeMetroLine[] = berlinUBahnLines
export const BERLIN_SBAHN: DeMetroLine[] = berlinSBahnLines
export const BERLIN_U_STATIONS: DeMetroStation[] = berlinUCanonical
export const BERLIN_S_STATIONS: DeMetroStation[] = berlinSCanonical
export const BERLIN_ALL_STATIONS: DeMetroStation[] = [...berlinUCanonical, ...berlinSCanonical]

export const BERLIN_SYSTEM: DeMetroSystem = {
  citySlug: 'berlin', cc: 'DE', name: 'Berlin U-Bahn / S-Bahn',
  status: 'operational', totalKm: 192.0, totalStations: BERLIN_ALL_STATIONS.length, yearOpened: 1902, dailyRidership: 2_500_000, fareZone: 'AB',
  lines: [...berlinUBahnLines, ...berlinSBahnLines],
  stations: BERLIN_ALL_STATIONS,
}

export const GERMAN_METRO_SYSTEMS: DeMetroSystem[] = [
  BERLIN_SYSTEM,
  munichSystem,
  hamburgSystem,
  frankfurtSystem,
  cologneSystem,
  stuttgartSystem,
  nurembergSystem,
  hanoverSystem,
  duesseldorfSystem,
  dortmundSystem,
  essenSystem,
  bochumSystem,
  duisburgSystem,
]

export function getGermanMetro(citySlug: string): DeMetroSystem | undefined {
  return GERMAN_METRO_SYSTEMS.find((s) => s.citySlug === citySlug)
}

export function getBerlinStation(slug: string): DeMetroStation | undefined {
  return BERLIN_ALL_STATIONS.find((s) => s.slug === slug)
}

export function getGermanStation(citySlug: string, slug: string): DeMetroStation | undefined {
  const system = getGermanMetro(citySlug)
  return system?.stations.find((s) => s.slug === slug)
}

/** Walking radius for station pages — ~10 min on foot. */
export const DE_METRO_RADIUS_M = 800
