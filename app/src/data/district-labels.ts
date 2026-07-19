/**
 * Map-only district/ubani label points for /map.
 * Source: official Tbilisi ubani map (matsne 2014 / georgia-locations) + OSM centroids.
 * Raion borders: tbilisi-raions.json (10 admin districts).
 */

export type DistrictLabel = {
  slug: string
  name: { ka: string; en: string }
  coords: { lat: number; lng: number }
}

/** All Tbilisi ubani + leaf settlements shown on the city map. */
export const TBILISI_DISTRICT_LABELS: DistrictLabel[] = [
  // ——— რაიონის ცენტრები / ძირითადი უბნები ———
  { slug: 'mtatsminda', name: { ka: 'მთაწმინდა', en: 'Mtatsminda' }, coords: { lat: 41.69636, lng: 44.79385 } },
  { slug: 'sololaki', name: { ka: 'სოლოლაკი', en: 'Sololaki' }, coords: { lat: 41.69052, lng: 44.79802 } },
  { slug: 'vera', name: { ka: 'ვერა', en: 'Vera' }, coords: { lat: 41.7058, lng: 44.78278 } },
  { slug: 'old-tbilisi', name: { ka: 'ძველი თბილისი', en: 'Old Tbilisi' }, coords: { lat: 41.6915, lng: 44.8055 } },
  { slug: 'abanotubani', name: { ka: 'აბანოთუბანი', en: 'Abanotubani' }, coords: { lat: 41.68765, lng: 44.81148 } },
  { slug: 'kojori', name: { ka: 'კოჯორი', en: 'Kojori' }, coords: { lat: 41.64952, lng: 44.69852 } },
  { slug: 'tabakhmela', name: { ka: 'ტაბახმელა', en: 'Tabakhmela' }, coords: { lat: 41.64937, lng: 44.7582 } },
  { slug: 'shindisi', name: { ka: 'შინდისი', en: 'Shindisi' }, coords: { lat: 41.66573, lng: 44.76594 } },
  { slug: 'tsavkisi', name: { ka: 'წავკისი', en: 'Tsavkisi' }, coords: { lat: 41.66733, lng: 44.74625 } },
  { slug: 'kiketi', name: { ka: 'კიკეთი', en: 'Kiketi' }, coords: { lat: 41.65798, lng: 44.65213 } },

  { slug: 'vake', name: { ka: 'ვაკე', en: 'Vake' }, coords: { lat: 41.70929, lng: 44.76366 } },
  { slug: 'baghebi', name: { ka: 'ბაგები', en: 'Baghebi' }, coords: { lat: 41.70821, lng: 44.73109 } },
  { slug: 'nutsubidze', name: { ka: 'ნუცუბიძის ფერდობი', en: 'Nutsubidze Plateau' }, coords: { lat: 41.73372, lng: 44.72501 } },
  { slug: 'vazha-pshavela', name: { ka: 'ვაჟა-ფშაველას კვარტლები', en: 'Vazha-Pshavela Quarters' }, coords: { lat: 41.72396, lng: 44.73002 } },
  { slug: 'kus-tba', name: { ka: 'კუს ტბა', en: 'Turtle Lake' }, coords: { lat: 41.70039, lng: 44.75446 } },
  { slug: 'tskneti', name: { ka: 'წყნეთი', en: 'Tskneti' }, coords: { lat: 41.69391, lng: 44.69366 } },
  { slug: 'akhaldaba', name: { ka: 'ახალდაბა', en: 'Akhaldaba' }, coords: { lat: 41.68464, lng: 44.66414 } },
  { slug: 'okrokana', name: { ka: 'ოქროყანა', en: 'Okrokana' }, coords: { lat: 41.68738, lng: 44.77355 } },
  { slug: 'betania', name: { ka: 'ბეთანია', en: 'Betania' }, coords: { lat: 41.67827, lng: 44.63474 } },

  { slug: 'saburtalo', name: { ka: 'საბურთალო', en: 'Saburtalo' }, coords: { lat: 41.72473, lng: 44.75173 } },
  { slug: 'vedzisi', name: { ka: 'ვეძისი', en: 'Vedzisi' }, coords: { lat: 41.73462, lng: 44.76605 } },
  { slug: 'vashlijvari', name: { ka: 'ვაშლიჯვარი', en: 'Vashlijvari' }, coords: { lat: 41.75541, lng: 44.76644 } },
  { slug: 'lisi', name: { ka: 'ლისი', en: 'Lisi' }, coords: { lat: 41.7439, lng: 44.7346 } },
  // Digomi cluster — four distinct places (do not merge)
  { slug: 'digomis-masivi', name: { ka: 'დიღმის მასივი', en: 'Dighomi Massive' }, coords: { lat: 41.76266, lng: 44.77492 } },
  { slug: 'dighomi', name: { ka: 'დიღომი', en: 'Dighomi' }, coords: { lat: 41.78389, lng: 44.73058 } },
  { slug: 'sopeli-dighomi', name: { ka: 'სოფელი დიღომი', en: 'Village Dighomi' }, coords: { lat: 41.77564, lng: 44.73793 } },
  { slug: 'didi-dighomi', name: { ka: 'დიდი დიღომი', en: 'Didi Dighomi' }, coords: { lat: 41.78844, lng: 44.75283 } },
  { slug: 'zurgovana', name: { ka: 'ზურგოვანა', en: 'Zurgovana' }, coords: { lat: 41.79971, lng: 44.75907 } },
  { slug: 'dighmis-chala', name: { ka: 'დიღმის ჭალა', en: 'Dighomi Meadow' }, coords: { lat: 41.80446, lng: 44.77931 } },
  { slug: 'mukhatgverdi', name: { ka: 'მუხათგვერდი', en: 'Mukhatgverdi' }, coords: { lat: 41.80562, lng: 44.72621 } },

  { slug: 'krtsanisi', name: { ka: 'კრწანისი', en: 'Krtsanisi' }, coords: { lat: 41.67306, lng: 44.81717 } },
  { slug: 'ortachala', name: { ka: 'ორთაჭალა', en: 'Ortachala' }, coords: { lat: 41.68204, lng: 44.82625 } },
  { slug: 'ponichala', name: { ka: 'ფონიჭალა', en: 'Ponichala' }, coords: { lat: 41.6368, lng: 44.9162 } },

  { slug: 'isani', name: { ka: 'ისანი', en: 'Isani' }, coords: { lat: 41.68813, lng: 44.83411 } },
  { slug: 'avlabari', name: { ka: 'ავლაბარი', en: 'Avlabari' }, coords: { lat: 41.69265, lng: 44.81681 } },
  { slug: 'metekhi', name: { ka: 'მეტეხი', en: 'Metekhi' }, coords: { lat: 41.68997, lng: 44.81706 } },
  { slug: 'navtlughi', name: { ka: 'ნავთლუღი', en: 'Navtlughi' }, coords: { lat: 41.68517, lng: 44.85027 } },
  { slug: 'vazisubani', name: { ka: 'ვაზისუბანი', en: 'Vazisubani' }, coords: { lat: 41.70405, lng: 44.84942 } },
  { slug: 'elia', name: { ka: 'ელია', en: 'Elia' }, coords: { lat: 41.69994, lng: 44.82283 } },

  { slug: 'samgori', name: { ka: 'სამგორი', en: 'Samgori' }, coords: { lat: 41.6847, lng: 44.85468 } },
  { slug: 'varketili', name: { ka: 'ვარკეთილი', en: 'Varketili' }, coords: { lat: 41.70751, lng: 44.87025 } },
  { slug: 'mesame-masivi', name: { ka: 'მესამე მასივი', en: 'Mesame Masivi' }, coords: { lat: 41.6877, lng: 44.88676 } },
  { slug: 'airport-dasakhleba', name: { ka: 'აეროპორტის დასახლება', en: 'Airport Settlement' }, coords: { lat: 41.68218, lng: 44.95057 } },
  { slug: 'lilo', name: { ka: 'ლილო', en: 'Lilo' }, coords: { lat: 41.70896, lng: 44.98381 } },
  { slug: 'orkhevi', name: { ka: 'ორხევი', en: 'Orkhevi' }, coords: { lat: 41.69429, lng: 44.92557 } },
  { slug: 'varketilis-meurneoba', name: { ka: 'ვარკეთილის მეურნეობა', en: 'Varketili Farm' }, coords: { lat: 41.70899, lng: 44.89952 } },

  { slug: 'chugureti', name: { ka: 'ჩუღურეთი', en: 'Chugureti' }, coords: { lat: 41.71116, lng: 44.79943 } },
  { slug: 'kukia', name: { ka: 'კუკია', en: 'Kukia' }, coords: { lat: 41.7178, lng: 44.81286 } },
  { slug: 'ivertubani', name: { ka: 'ივერთუბანი', en: 'Ivertubani' }, coords: { lat: 41.72935, lng: 44.837 } },

  { slug: 'didube', name: { ka: 'დიდუბე', en: 'Didube' }, coords: { lat: 41.73538, lng: 44.78126 } },

  { slug: 'nadzaladevi', name: { ka: 'ნაძალადევი', en: 'Nadzaladevi' }, coords: { lat: 41.74711, lng: 44.82073 } },
  { slug: 'sanzona', name: { ka: 'სანზონა', en: 'Sanzona' }, coords: { lat: 41.76597, lng: 44.79256 } },
  { slug: 'temka', name: { ka: 'თემქა', en: 'Temka' }, coords: { lat: 41.75832, lng: 44.8525 } },
  { slug: 'lotkini', name: { ka: 'ლოტკინი', en: 'Lotkini' }, coords: { lat: 41.73551, lng: 44.81667 } },
  { slug: 'zghvisubani', name: { ka: 'ზღვისუბანი', en: 'Zghvisubani' }, coords: { lat: 41.77927, lng: 44.81233 } },

  { slug: 'gldani', name: { ka: 'გლდანი', en: 'Gldani' }, coords: { lat: 41.80268, lng: 44.82915 } },
  // ponytail: OSM has no "გლდანის მასივი" node — odd/even microdistrict centroid
  { slug: 'gldanis-masivi', name: { ka: 'გლდანის მასივი', en: 'Gldani Massive' }, coords: { lat: 41.80459, lng: 44.838 } },
  { slug: 'mukhiani', name: { ka: 'მუხიანი', en: 'Mukhiani' }, coords: { lat: 41.78671, lng: 44.84083 } },
  { slug: 'gldanula', name: { ka: 'გლდანულა', en: 'Gldanula' }, coords: { lat: 41.81285, lng: 44.81686 } },
  { slug: 'avchala', name: { ka: 'ავჭალა', en: 'Avchala' }, coords: { lat: 41.82489, lng: 44.78801 } },
  { slug: 'zahesi', name: { ka: 'ზაჰესი', en: 'Zahesi' }, coords: { lat: 41.82782, lng: 44.76274 } },
  { slug: 'sopeli-gldani', name: { ka: 'სოფელი გლდანი', en: 'Village Gldani' }, coords: { lat: 41.82392, lng: 44.82753 } },
  { slug: 'tbilisis-zgva', name: { ka: 'თბილისის ზღვა', en: 'Tbilisi Sea' }, coords: { lat: 41.74206, lng: 44.85465 } },
]
