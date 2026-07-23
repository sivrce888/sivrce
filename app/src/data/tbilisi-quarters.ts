/**
 * Micro-quarters for autocomplete + geocode — OSM city_block labels (2026-07).
 * Digomi: Roman კვარტალი. Massiv micros: მიკრო რაიონი. Vazisubani: მიკრორაიონი.
 * Plus full OSM city_block dump (Nutsubidze, Vazha-Pshavela, Vashlijvari, Lilo, …).
 */
import type { GeoStreet } from './georgia-locations'

export type TbilisiQuarter = GeoStreet & {
  aliases: string[]
  /** Soft-fill ubani on suggest pick. */
  district: string
  lat: number
  lng: number
  /** Nominatim free-text when OSM `ka` does not search (Varketili III). */
  nominatim?: string
}

function q(
  ka: string,
  en: string,
  district: string,
  lat: number,
  lng: number,
  aliases: string[] = [],
  nominatim?: string,
): TbilisiQuarter {
  return { ka, en, city: 'თბილისი', district, lat, lng, aliases, nominatim }
}

export const TBILISI_QUARTERS: TbilisiQuarter[] = [
  // —— Digomi Massiv I–VI ——
  q('დიღმის მასივი, I კვარტალი', 'Digomi Massiv 1st Block', 'დიღმის მასივი', 41.7581446, 44.7708222, [
    'პირველი კვარტალი',
    'I კვარტალი',
    '1 კვარტალი',
    'მე-1 კვარტალი',
    'Digomi I',
  ]),
  q('დიღმის მასივი, II კვარტალი', 'Digomi Massiv 2nd Block', 'დიღმის მასივი', 41.7547723, 44.7740163, [
    'მეორე კვარტალი',
    'II კვარტალი',
    '2 კვარტალი',
    'მე-2 კვარტალი',
    'Digomi II',
  ]),
  q('დიღმის მასივი, III კვარტალი', 'Digomi Massiv 3rd Block', 'დიღმის მასივი', 41.7601091, 44.7764951, [
    'მესამე კვარტალი',
    'III კვარტალი',
    '3 კვარტალი',
    'მე-3 კვარტალი',
    'Digomi III',
  ]),
  q('დიღმის მასივი, IV კვარტალი', 'Digomi Massiv 4th Block', 'დიღმის მასივი', 41.7641909, 44.7778603, [
    'მეოთხე კვარტალი',
    'IV კვარტალი',
    '4 კვარტალი',
    'მე-4 კვარტალი',
    'Digomi IV',
  ]),
  q('დიღმის მასივი, V კვარტალი', 'Digomi Massiv 5th Block', 'დიღმის მასივი', 41.7644652, 44.7718309, [
    'მეხუთე კვარტალი',
    'V კვარტალი',
    '5 კვარტალი',
    'მე-5 კვარტალი',
    'Digomi V',
    'დიღმის მასივი მე-5 კვარტალი',
  ]),
  q('დიღმის მასივი, VI კვარტალი', 'Digomi Massiv 6th Block', 'დიღმის მასივი', 41.7611286, 44.772028, [
    'მეექვსე კვარტალი',
    'VI კვარტალი',
    '6 კვარტალი',
    'მე-6 კვარტალი',
    'Digomi VI',
  ]),

  // —— Gldani microdistricts ——
  q('გლდანის 1-ლი მიკრო რაიონი', 'Gldani 1st Micro District', 'გლდანი', 41.7932365, 44.8222929, [
    'გლდანი 1 მიკრო',
    'Gldani 1',
  ]),
  q('გლდანის მე-2 მიკრო რაიონი', 'Gldani 2nd Micro District', 'გლდანი', 41.7968919, 44.8152763, [
    'გლდანი 2 მიკრო',
    'Gldani 2',
  ]),
  q('გლდანის მე-3 მიკრო რაიონი', 'Gldani 3rd Micro District', 'გლდანი', 41.7969899, 44.8267239, [
    'გლდანი 3 მიკრო',
    'Gldani 3',
  ]),
  q('გლდანის მე-3ა მიკრო რაიონი', 'Gldani 3A Micro District', 'გლდანი', 41.796318, 44.8322412, [
    'გლდანი 3ა მიკრო',
    'Gldani 3A',
  ]),
  q('გლდანის მე-4 მიკრო რაიონი', 'Gldani 4th Micro District', 'გლდანი', 41.8005011, 44.8201659, [
    'გლდანი 4 მიკრო',
    'Gldani 4',
  ]),
  q('გლდანის მე-5 მიკრო რაიონი', 'Gldani 5th Micro District', 'გლდანი', 41.8005371, 44.8308304, [
    'გლდანი 5 მიკრო',
    'Gldani 5',
  ]),
  q('გლდანის მე-6 მიკრო რაიონი', 'Gldani 6th Micro District', 'გლდანი', 41.8039662, 44.8245138, [
    'გლდანი 6 მიკრო',
    'Gldani 6',
  ]),
  q('გლდანის მე-7 მიკრო რაიონი', 'Gldani 7th Micro District', 'გლდანი', 41.8048499, 44.8353231, [
    'გლდანი 7 მიკრო',
    'Gldani 7',
  ]),
  q('გლდანის მე-8 მიკრო რაიონი', 'Gldani 8th Micro District', 'გლდანი', 41.8070112, 44.8298058, [
    'გლდანი 8 მიკრო',
    'Gldani 8',
  ]),
  q('გლდანის "ა" მიკრო რაიონი', 'Gldani "A" Micro District', 'გლდანი', 41.7942684, 44.8136589, [
    'გლდანი ა მიკრო',
    'Gldani A',
  ]),

  // —— Mukhiani microdistricts ——
  q('მუხიანის 1-ლი მიკრო რაიონი', 'Mukhiani 1st Micro District', 'მუხიანი', 41.7891016, 44.8242939, [
    'მუხიანი 1 მიკრო',
    'Mukhiani 1',
  ]),
  q('მუხიანის მე-2 მიკრო რაიონი', 'Mukhiani 2nd Micro District', 'მუხიანი', 41.7859525, 44.8248242, [
    'მუხიანი 2 მიკრო',
    'Mukhiani 2',
  ]),
  q('მუხიანის მე-3 მიკრო რაიონი', 'Mukhiani 3rd Micro District', 'მუხიანი', 41.7869447, 44.8324853, [
    'მუხიანი 3 მიკრო',
    'Mukhiani 3',
  ]),
  q('მუხიანის მე-4ა მიკრო რაიონი', 'Mukhiani 4A Micro District', 'მუხიანი', 41.7840375, 44.8321762, [
    'მუხიანი 4ა მიკრო',
    'Mukhiani 4A',
  ]),
  q('მუხიანის მე-4ბ მიკრო რაიონი', 'Mukhiani 4B Micro District', 'მუხიანი', 41.7812854, 44.8344393, [
    'მუხიანი 4ბ მიკრო',
    'Mukhiani 4B',
  ]),

  // —— Varketili-3 microdistricts ——
  q('ვარკეთილი-3, 1-ლი მიკრო რაიონი', 'Varketili-3 1st Micro District', 'ვარკეთილი', 41.7000213, 44.8762751, [
    'ვარკეთილი 3 1 მიკრო',
    'Varketili-3 1',
  ]),
  q('ვარკეთილი-3, მე-2 მიკრო რაიონი', 'Varketili-3 2nd Micro District', 'ვარკეთილი', 41.7033095, 44.8848152, [
    'ვარკეთილი 3 2 მიკრო',
    'Varketili-3 2',
  ]),
  q('ვარკეთილი-3, მე-3 მიკრო რაიონი', 'Varketili-3 3rd Micro District', 'ვარკეთილი', 41.7031133, 44.877938, [
    'ვარკეთილი 3 3 მიკრო',
    'Varketili-3 3',
  ]),
  q('ვარკეთილი-3, მე-3ა მიკრო რაიონი', 'Varketili-3 Micro District 3A', 'ვარკეთილი', 41.7065976, 44.8777664, [
    'ვარკეთილი 3 3ა მიკრო',
    'Varketili-3 3A',
  ]),
  q('ვარკეთილი-3, მე-4 მიკრო რაიონი', 'Varketili-3 4th Micro District', 'ვარკეთილი', 41.7100417, 44.8791128, [
    'ვარკეთილი 3 4 მიკრო',
    'Varketili-3 4',
  ]),

  // —— Varketili III მასივი კვარტალი 1–10 (Nominatim parent = მესამე მასივი) ——
  q(
    'ვარკეთილის მე-3 მასივი, 1-ლი კვარტალი',
    'Varketili 3rd Massiv 1st Block',
    'მესამე მასივი',
    41.6848875,
    44.8800141,
    ['ვარკეთილი III 1 კვარტალი', 'Mesame 1'],
    'მესამე მასივი, 1-ლი კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-2 კვარტალი',
    'Varketili 3rd Massiv 2nd Block',
    'მესამე მასივი',
    41.6863898,
    44.8803467,
    ['ვარკეთილი III 2 კვარტალი', 'Mesame 2'],
    'მესამე მასივი, მე-2 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-3 კვარტალი',
    'Varketili 3rd Massiv 3rd Block',
    'მესამე მასივი',
    41.687832,
    44.8800087,
    ['ვარკეთილი III 3 კვარტალი', 'Mesame 3'],
    // ponytail: Nominatim "მე-3" false-hits other blocks — catalog coords are source of truth
    'მესამე მასივი, მე-3 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-4 კვარტალი',
    'Varketili 3rd Massiv 4th Block',
    'მესამე მასივი',
    41.6880784,
    44.8768088,
    ['ვარკეთილი III 4 კვარტალი', 'Mesame 4'],
    'მესამე მასივი, მე-4 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-5 კვარტალი',
    'Varketili 3rd Massiv 5th Block',
    'მესამე მასივი',
    41.6866623,
    44.8769724,
    ['ვარკეთილი III 5 კვარტალი', 'Mesame 5'],
    'მესამე მასივი, მე-5 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-6 კვარტალი',
    'Varketili 3rd Massiv 6th Block',
    'მესამე მასივი',
    41.685196,
    44.8765808,
    ['ვარკეთილი III 6 კვარტალი', 'Mesame 6'],
    'მესამე მასივი, მე-6 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-7 კვარტალი',
    'Varketili 3rd Massiv 7th Block',
    'მესამე მასივი',
    41.6882567,
    44.8738772,
    ['ვარკეთილი III 7 კვარტალი', 'Mesame 7'],
    'მესამე მასივი, მე-7 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-8 კვარტალი',
    'Varketili 3rd Massiv 8th Block',
    'მესამე მასივი',
    41.6867544,
    44.8732227,
    ['ვარკეთილი III 8 კვარტალი', 'Mesame 8'],
    'მესამე მასივი, მე-8 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-9 კვარტალი',
    'Varketili 3rd Massiv 9th Block',
    'მესამე მასივი',
    41.6850037,
    44.8735338,
    ['ვარკეთილი III 9 კვარტალი', 'Mesame 9'],
    'მესამე მასივი, მე-9 კვარტალი',
  ),
  q(
    'ვარკეთილის მე-3 მასივი, მე-10 კვარტალი',
    'Varketili 3rd Massiv 10th Block',
    'მესამე მასივი',
    41.685857,
    44.8857272,
    ['ვარკეთილი III 10 კვარტალი', 'კვარტალი X', 'Mesame 10'],
    'მესამე მასივი, მე-10 კვარტალი',
  ),

  // —— Vazisubani (OSM: მიკრორაიონი) ——
  q('ვაზისუბნის 1-ლი მიკრორაიონი', 'Vazisubani 1st Microdistrict', 'ვაზისუბანი', 41.7016235, 44.8483659, [
    'ვაზისუბანი 1 მიკრო',
    'Vazisubani 1',
  ]),
  q('ვაზისუბნის მე-2 მიკრორაიონი', 'Vazisubani 2nd Microdistrict', 'ვაზისუბანი', 41.7063218, 44.8438352, [
    'ვაზისუბანი 2 მიკრო',
    'Vazisubani 2',
  ]),
  q('ვაზისუბნის მე-3 მიკრორაიონი', 'Vazisubani 3rd Microdistrict', 'ვაზისუბანი', 41.7075337, 44.8499687, [
    'ვაზისუბანი 3 მიკრო',
    'Vazisubani 3',
  ]),
  q('ვაზისუბნის მე-4 მიკრორაიონი', 'Vazisubani 4th Microdistrict', 'ვაზისუბანი', 41.704928, 44.854437, [
    'ვაზისუბანი 4 მიკრო',
    'Vazisubani 4',
  ]),
  q(
    'ვაზისუბნის დასახლება მე-4 მიკრო რაიონი / III კვ.',
    'Vazisubani Settlement 4th Micro District / III Quarter',
    'ვაზისუბანი',
    41.6981463,
    44.8595844,
    ['ვაზისუბანი დასახლება 4', 'Vazisubani Settlement 4'],
  ),

  // —— Zghvisubani ——
  q(
    'ზღვისუბანის მე-3 მიკრო რაიონი / 1-ლი კვარტალი',
    'Zghvisubani 3rd Micro District / 1st Block',
    'ზღვისუბანი',
    41.781717,
    44.8138145,
    ['ზღვისუბანი 3 1 კვარტალი', 'Zghvisubani 3-1'],
  ),
  q(
    'ზღვისუბანის მე-3 მიკრო რაიონი / მე-2 კვარტალი',
    'Zghvisubani 3rd Micro District / 2nd Block',
    'ზღვისუბანი',
    41.7793429,
    44.8167703,
    ['ზღვისუბანი 3 2 კვარტალი', 'Zghvisubani 3-2'],
  ),
  q(
    'ზღვისუბანის მე-3 მიკრო რაიონი / მე-3 კვარტალი',
    'Zghvisubani 3rd Micro District / 3rd Block',
    'ზღვისუბანი',
    41.7785608,
    44.8213166,
    ['ზღვისუბანი 3 3 კვარტალი', 'Zghvisubani 3-3'],
  ),
  q(
    'ზღვისუბანის მე-3 მიკრო რაიონი / მე-4 კვარტალი',
    'Zghvisubani 3rd Micro District / 4th Block',
    'ზღვისუბანი',
    41.781082,
    44.8183058,
    ['ზღვისუბანი 3 4 კვარტალი', 'Zghvisubani 3-4'],
  ),
  q(
    'ზღვისუბანის მე-3 მიკრო რაიონი / მე-5 კვარტალი',
    'Zghvisubani 3rd Micro District / 5th Block',
    'ზღვისუბანი',
    41.7756084,
    44.8233658,
    ['ზღვისუბანი 3 5 კვარტალი', 'Zghvisubani 3-5'],
  ),
  q('ზღვისუბანის მე-4 მიკრო რაიონი', 'Zghvisubani 4th Micro District', 'ზღვისუბანი', 41.7849731, 44.8105663, [
    'ზღვისუბანი 4 მიკრო',
    'Zghvisubani 4',
  ]),
  q('ზღვისუბანის მე-9 მიკრო რაიონი', 'Zghvisubani 9th Micro District', 'ზღვისუბანი', 41.7808734, 44.8005773, [
    'ზღვისუბანი 9 მიკრო',
    'Zghvisubani 9',
  ]),
  q('ზღვისუბანის მე-10 მიკრო რაიონი', 'Zghvisubani 10th Micro District', 'ზღვისუბანი', 41.7794579, 44.8055811, [
    'ზღვისუბანი 10 მიკრო',
    'Zghvisubani 10',
  ]),
  q('ზღვისუბანის მე-10ა მიკრო რაიონი', 'Zghvisubani 10A Micro District', 'ზღვისუბანი', 41.7821957, 44.8021248, [
    'ზღვისუბანი 10ა მიკრო',
    'Zghvisubani 10A',
  ]),
  q('ზღვისუბანის მე-10ბ მიკრო რაიონი', 'Zghvisubani 10B Micro District', 'ზღვისუბანი', 41.7827371, 44.8034449, [
    'ზღვისუბანი 10ბ მიკრო',
    'Zghvisubani 10B',
  ]),
  q(
    'ზღვისუბანის მე-11 მიკრო რაიონის 1-ლი კვარტალი',
    'Zghvisubani 11th Micro District 1st Quarter',
    'ზღვისუბანი',
    41.7780258,
    44.8103015,
    ['ზღვისუბანი 11 1 კვარტალი', 'Zghvisubani 11-1'],
  ),
  q(
    'ზღვისუბანის მე-11 მიკრო რაიონის მე-2 კვარტალი',
    'Zghvisubani 11th Micro District 2nd Quarter',
    'ზღვისუბანი',
    41.7749725,
    44.8149784,
    ['ზღვისუბანი 11 2 კვარტალი', 'Zghvisubani 11-2'],
  ),
  q(
    'ზღვისუბანის მე-11 მიკრო რაიონის მე-3 კვარტალი',
    'Zghvisubani 11th Micro District 3rd Quarter',
    'ზღვისუბანი',
    41.7726529,
    44.8189898,
    ['ზღვისუბანი 11 3 კვარტალი', 'Zghvisubani 11-3'],
  ),

  // —— Varketili Zemo Plato (comma → space for Nominatim) ——
  q(
    'ვარკეთილის ზემო პლატო, 1-ლი მიკრო რაიონი',
    'Varketili Zemo Plato, 1st Micro District',
    'მესამე მასივი',
    41.6917378,
    44.8791075,
    ['ზემო პლატო 1 მიკრო', 'Zemo Plato 1'],
  ),
  q(
    'ვარკეთილის ზემო პლატო, მე-2 მიკრო რაიონი',
    'Varketili Zemo Plato, 2nd Micro District',
    'მესამე მასივი',
    41.6958757,
    44.8753416,
    ['ზემო პლატო 2 მიკრო', 'Zemo Plato 2'],
  ),

  // —— OSM city_blocks dump (Tbilisi, 2026-07) — fill gaps vs portals ——
  q('არსენალი', 'Arsenal', 'ავლაბარი', 41.7050717, 44.8186612, ['Arsenal']),
  q('ახალი დიღომი', 'Akhali Digomi', 'დიდი დიღომი', 41.7966667, 44.7437424, ['Akhali Digomi']),
  q('ბაგების სტუდქალაქი', 'Studkalaki', 'ბაგები', 41.7135519, 44.7184294, ['Studkalaki']),
  q('დიდი დიღომის 1-ლი მიკრო რაიონი', 'Didi Dighomi 1st Micro District', 'დიდი დიღომი', 41.7900207, 44.760065, ['დიდი დიღომ 1-ლი', 'Didi Dighomi 1st Micro District']),
  q('დიდი დიღომის მე-2 მიკრო რაიონი', 'Didi Dighomi 2nd Micro District', 'დიდი დიღომი', 41.7945015, 44.760076, ['დიდი დიღომ მე-2', 'Didi Dighomi 2nd Micro District']),
  q('დიდი დიღომის მე-3 მიკრო რაიონი', 'Didi Dighomi 3rd Micro District', 'დიდი დიღომი', 41.7899263, 44.7427936, ['დიდი დიღომ მე-3', 'Didi Dighomi 3rd Micro District']),
  q('დიდი დიღომის მე-4 მიკრო რაიონი', 'Didi Dighomi 4th Micro District', 'დიდი დიღომი', 41.7931933, 44.7418036, ['დიდი დიღომ მე-4', 'Didi Dighomi 4th Micro District']),
  q('დიღომი 7', 'Digomi 7', 'დიღომი 1-9', 41.8036812, 44.7743129, ['Digomi 7']),
  q('დიღომი 7ა', 'Digomi 7a', 'დიღომი 1-9', 41.8048009, 44.77324, ['Digomi 7a']),
  q('დიღომი 8', 'Dighomi 8', 'დიღომი 1-9', 41.8107667, 44.7763943, ['Dighomi 8']),
  q('ვაჟა-ფშაველას გამზირის I კვარტალი', 'Vazha-Pshavela Avenue 1st Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7264747, 44.7421217, ['ვაჟა-ფშაველას გამზირ I', 'Vazha-Pshavela Avenue 1st Quarter']),
  q('ვაჟა-ფშაველას გამზირის II კვარტალი', 'Vazha-Pshavela Avenue 2nd Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7261103, 44.7351667, ['ვაჟა-ფშაველას გამზირ II', 'Vazha-Pshavela Avenue 2nd Quarter']),
  q('ვაჟა-ფშაველას გამზირის III კვარტალი', 'Vazha-Pshavela Avenue 3rd Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7251174, 44.7271013, ['ვაჟა-ფშაველას გამზირ III', 'Vazha-Pshavela Avenue 3rd Quarter']),
  q('ვაჟა-ფშაველას გამზირის IV კვარტალი', 'Vazha-Pshavela Avenue 4th Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7243527, 44.7198003, ['ვაჟა-ფშაველას გამზირ IV', 'Vazha-Pshavela Avenue 4th Quarter']),
  q('ვაჟა-ფშაველას გამზირის V კვარტალი', 'Vazha-Pshavela Avenue 5th Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7238904, 44.7138283, ['ვაჟა-ფშაველას გამზირ V', 'Vazha-Pshavela Avenue 5th Quarter']),
  q('ვაჟა-ფშაველას გამზირის VI კვარტალი', 'Vazha-Pshavela Avenue 6th Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7209222, 44.7204709, ['ვაჟა-ფშაველას გამზირ VI', 'Vazha-Pshavela Avenue 6th Quarter']),
  q('ვაჟა-ფშაველას გამზირის VII კვარტალი', 'Vazha-Pshavela Avenue 7th Quarter', 'ვაჟა-ფშაველას კვარტლები', 41.7222207, 44.7273695, ['ვაჟა-ფშაველას გამზირ VII', 'Vazha-Pshavela Avenue 7th Quarter']),
  q('ვაშლიჯვარის მე-2 ზონა', 'Vashlijvari 2nd Zone', 'ვაშლიჯვარი', 41.7531745, 44.7629068, ['ვაშლიჯვარ მე-2', 'Vashlijvari 2nd Zone']),
  q('ვაშლიჯვარის მე-2ა ზონა', 'Vashlijvari Zone 2A', 'ვაშლიჯვარი', 41.7549532, 44.7565966, ['ვაშლიჯვარ მე-2ა', 'Vashlijvari Zone 2A']),
  q('ვაშლიჯვარის მე-3 ზონა', 'Vashlijvari 3rd Zone', 'ვაშლიჯვარი', 41.7500974, 44.7622267, ['ვაშლიჯვარ მე-3', 'Vashlijvari 3rd Zone']),
  q('ვაშლიჯვარის მე-4 ზონა', 'Vashlijvari 4th Zone', 'ვაშლიჯვარი', 41.7494001, 44.7651068, ['ვაშლიჯვარ მე-4', 'Vashlijvari 4th Zone']),
  q('ვაშლიჯვარის მე-5 ზონა', 'Vashlijvari 5th Zone', 'ვაშლიჯვარი', 41.7524814, 44.7652784, ['ვაშლიჯვარ მე-5', 'Vashlijvari 5th Zone']),
  q('თბილისის დიპლომატიური სოფელი', 'Tbilisi Diplomatic Village', 'ლისი', 41.8023734, 44.7606332, ['Tbilisi Diplomatic Village']),
  q('თქვენი სახლი ნინუაზე', 'Your home on Ninua', 'დიდუბე', 41.7429321, 44.7857601, ['Your home on Ninua']),
  q('ლილოს დასახლება, I კვარტალი', 'Lilo Dasakhleba, 1st Block', 'ლილო', 41.6808821, 44.9859681, ['ლილოს დასახლება I', 'Lilo Dasakhleba']),
  q('ლილოს დასახლება, II კვარტალი', 'Lilo Dasakhleba, 2nd Block', 'ლილო', 41.6812979, 44.9816349, ['ლილოს დასახლება II', 'Lilo Dasakhleba']),
  q('ლილოს დასახლება, IV კვარტალი', 'Lilo Dasakhleba, 4th Block', 'ლილო', 41.679521, 44.9795616, ['ლილოს დასახლება IV', 'Lilo Dasakhleba']),
  q('ლილოს დასახლება, V კვარტალი', 'Lilo Dasakhleba, 5th Block', 'ლილო', 41.6810575, 44.9791244, ['ლილოს დასახლება V', 'Lilo Dasakhleba']),
  q('ლისი პანორამა', 'Lisi Panorama', 'ლისი', 41.7399942, 44.7508465, ['Lisi Panorama']),
  q('მე-8 ლეგიონი', '8th Legion', 'ისანი', 41.6889489, 44.8601583, ['8th Legion']),
  q('მწვანე ალმასი', 'Green Diamond', 'დიღომი', 41.7958627, 44.7798275, ['Green Diamond']),
  q('მწვანე ქალაქი ლისი', 'Lisi Green Town', 'ლისი', 41.7395648, 44.7568556, ['Lisi Green Town']),
  q('მხატვრების დასახლება', 'Mkhatvrebi Dasakhleba', 'ვაჟა-ფშაველას კვარტლები', 41.7368723, 44.7180864, ['Mkhatvrebi Dasakhleba']),
  q('მხატვრის დასახლება', 'Artist\'s Settlement', 'ვაჟა-ფშაველას კვარტლები', 41.7269897, 44.7283894, ['Artist\'s Settlement']),
  q('ნუცუბიძის პლატოს 1-ლი მიკრო რაიონი', 'Nutsubidze Plateau 1st Micro District', 'ნუცუბიძის ფერდობი', 41.7268878, 44.7190522, ['ნუცუბიძის პლატოს 1-ლი', 'Nutsubidze Plateau 1st Micro District']),
  q('ნუცუბიძის პლატოს მე-2 მიკრო რაიონი', 'Nutsubidze Plateau 2nd Micro District', 'ნუცუბიძის ფერდობი', 41.7289107, 44.7240194, ['ნუცუბიძის პლატოს მე-2', 'Nutsubidze Plateau 2nd Micro District']),
  q('ნუცუბიძის პლატოს მე-3 მიკრო რაიონი', 'Nutsubidze Plateau 3rd Micro District', 'ნუცუბიძის ფერდობი', 41.7296986, 44.7333036, ['ნუცუბიძის პლატოს მე-3', 'Nutsubidze Plateau 3rd Micro District']),
  q('ნუცუბიძის პლატოს მე-4 მიკრო რაიონი', 'Nutsubidze Plateau 4th Micro District', 'ნუცუბიძის ფერდობი', 41.733944, 44.7284681, ['ნუცუბიძის პლატოს მე-4', 'Nutsubidze Plateau 4th Micro District']),
  q('ნუცუბიძის პლატოს მე-5 მიკრო რაიონი', 'Nutsubidze Plateau 5th Micro District', 'ნუცუბიძის ფერდობი', 41.7327335, 44.7205182, ['ნუცუბიძის პლატოს მე-5', 'Nutsubidze Plateau 5th Micro District']),
  q('ოცდამეთერთმეტე', '31st', 'მესამე მასივი', 41.6712502, 44.8717215, ['31st']),
  q('პეკინის გამზირის II კვარტალი', 'Pekini Avenue 2nd Quarter', 'საბურთალო', 41.7245171, 44.7732854, ['პეკინის გამზირ II', 'Pekini Avenue 2nd Quarter']),
  q('სამხედრო განთავსება', 'Military Settlement', 'აეროპორტის დასახლება', 41.6841508, 44.9198195, ['Military Settlement']),
  q('სამხედრო დასახლება', 'Samkhedro Dasakhleba', 'აეროპორტის დასახლება', 41.6889617, 44.8911667, ['Samkhedro Dasakhleba']),
  q('საქსოფმანქანის დასახლება', 'Saksopmankani Settlement', 'აეროპორტის დასახლება', 41.6909306, 44.981246, ['Saksopmankani Settlement']),
  q('ტრამვაელთა დასახლება', 'Tramvaelta Dasakhleba', 'კუკია', 41.7211486, 44.7899428, ['Tramvaelta Dasakhleba']),
  q('ქაქუცა ჩოლოყაშვილის I კვარტალი', 'Kakutsa Choloqashvili 1st Block', 'ორთაჭალა', 41.6760772, 44.8433295, ['ქაქუცა ჩოლოყაშვილ I', 'Kakutsa Choloqashvili 1st Block']),
  q('ქაქუცა ჩოლოყაშვილის II კვარტალი', 'Kakutsa Choloqashvili 2nd Block', 'ორთაჭალა', 41.6754462, 44.8495898, ['ქაქუცა ჩოლოყაშვილ II', 'Kakutsa Choloqashvili 2nd Block']),
  q('შავსოფელი', 'Shavsopeli', 'ორთაჭალა', 41.6859783, 44.8251253, ['Shavsopeli']),
  q('ცოტნე დადიანის II მიკრო/რაიონი', 'ცოტნე დადიანის II მიკრო/რაიონი', 'დიდუბე', 41.7362201, 44.7965195, ['ცოტნე დადიან II']),
  q('ჰუალინგის დასახლება', 'Hualing Dasakhleba', 'ვარკეთილი', 41.7131372, 44.8786407, ['Hualing Dasakhleba']),

]

const ORD_BEFORE_KVARTALI: [RegExp, string][] = [
  [/(?:პირველი|მე[- ]?1(?:ლი)?|1)\s*(კვარტალ\w*)/giu, 'I $1'],
  [/(?:მეორე|მე[- ]?2(?:ე)?|2)\s*(კვარტალ\w*)/giu, 'II $1'],
  [/(?:მესამე|მე[- ]?3(?:ე)?|3)\s*(კვარტალ\w*)/giu, 'III $1'],
  [/(?:მეოთხე|მე[- ]?4(?:ე)?|4)\s*(კვარტალ\w*)/giu, 'IV $1'],
  [/(?:მეხუთე|მე[- ]?5(?:ე)?|5)\s*(კვარტალ\w*)/giu, 'V $1'],
  [/(?:მეექვსე|მე[- ]?6(?:ე)?|6)\s*(კვარტალ\w*)/giu, 'VI $1'],
]

/** Exact / alias lookup for catalog pin + Nominatim rewrite. */
export function matchQuarter(street: string): TbilisiQuarter | undefined {
  const s = street.trim()
  if (!s) return undefined
  const exact = TBILISI_QUARTERS.find((x) => x.ka === s)
  if (exact) return exact
  return TBILISI_QUARTERS.find((x) => x.aliases.includes(s))
}

/** Digomi: "მეორე კვარტალი" → "II კვარტალი". Skip Varketili/Zghvisubani (KA ordinals). */
export function romanizeQuarter(raw: string): string {
  let s = raw.trim()
  if (!/კვარტალ/u.test(s)) return s
  if (/ვარკეთილ|მესამე მასივი|ზღვისუბან|ვაჟა-ფშაველ|ლილოს დასახლებ/u.test(s)) return s
  for (const [re, rep] of ORD_BEFORE_KVARTALI) s = s.replace(re, rep)
  // Nominatim miss on "მასივი, II" — drop comma before Roman quarter.
  return s.replace(/,\s*(?=(?:I{1,3}|IV|V|VI)\s*კვარტალ)/u, ' ').replace(/\s+/g, ' ').trim()
}

/** Free-text sent to Nominatim for a quarter street field. */
export function quarterSearchQuery(street: string): string {
  const cat = matchQuarter(street)
  if (cat?.nominatim) return cat.nominatim
  const base = cat?.ka ?? street.trim()
  if (isQuarterLabel(base)) {
    return romanizeQuarter(base).replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return street.trim()
}

export function isQuarterLabel(raw: string): boolean {
  return /კვარტალ|მიკრო\s*რაიონ|მიკრორაიონ|ზონა|დასახლებ|დიღომი\s*\d/u.test(raw)
}
