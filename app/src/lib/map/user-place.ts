/**
 * Map place memory + city snap.
 * ponytail: city-level only (IP is coarse). Street GPS stays on the locate button.
 * Client-safe plane: inventory + WORLD_PLACES (~hundreds). The full GeoNames
 * corpus (22k) lives in user-place.server.ts — server imports only, so it
 * never lands in the browser bundle (device-budget lock).
 */

import { WORLD_PLACES } from '@/data/world-places'
import { FREEDOM_SQUARE, MAP_CENTER, parseCoords } from '@/lib/map/map-geo'
import { MARKETS, type MarketId } from '@/lib/markets'

/** ISO-3166-1 alpha-2. */
export type MapCityCc = string

export type MapCity = {
  slug: string
  ka: string
  /** Latin name — non-ka UI picks this for chips/popups. */
  en: string
  lat: number
  lng: number
  cc: MapCityCc
}

function city(
  slug: string,
  ka: string,
  en: string,
  lat: number,
  lng: number,
  cc: MapCityCc,
): MapCity {
  return { slug, ka, en, lat, lng, cc }
}

/** Inventory + launched-market cities (first). World places fill gaps. */
const INVENTORY_CITIES: readonly MapCity[] = [
  // ── Georgia ──
  city('tbilisi', 'თბილისი', 'Tbilisi', FREEDOM_SQUARE.lat, FREEDOM_SQUARE.lng, 'GE'),
  city('batumi', 'ბათუმი', 'Batumi', 41.6417, 41.6391, 'GE'),
  city('kutaisi', 'ქუთაისი', 'Kutaisi', 42.2679, 42.6946, 'GE'),
  city('rustavi', 'რუსთავი', 'Rustavi', 41.5495, 44.9931, 'GE'),
  city('poti', 'ფოთი', 'Poti', 42.1494, 41.6656, 'GE'),
  city('zugdidi', 'ზუგდიდი', 'Zugdidi', 42.5088, 41.8709, 'GE'),
  city('telavi', 'თელავი', 'Telavi', 41.9198, 45.4736, 'GE'),
  city('gori', 'გორი', 'Gori', 41.9842, 44.1163, 'GE'),
  city('mtskheta', 'მცხეთა', 'Mtskheta', 41.8434, 44.7144, 'GE'),
  city('kobuleti', 'ქობულეთი', 'Kobuleti', 41.814, 41.7735, 'GE'),
  city('chakvi', 'ჩაქვი', 'Chakvi', 41.7243, 41.7342, 'GE'),
  city('shekvetili', 'შეკვეთილი', 'Shekvetili', 41.9345, 41.7675, 'GE'),
  city('goderdzi', 'გოდერძი', 'Goderdzi', 41.6388, 42.489, 'GE'),
  city('tianeti', 'თიანეთი', 'Tianeti', 41.9985, 44.932, 'GE'),
  city('bakhmaro', 'ბახმარო', 'Bakhmaro', 41.8513, 42.3245, 'GE'),
  city('bakuriani', 'ბაკურიანი', 'Bakuriani', 41.7497, 43.5325, 'GE'),
  city('borjomi', 'ბორჯომი', 'Borjomi', 41.8389, 43.3858, 'GE'),
  city('gudauri', 'გუდაური', 'Gudauri', 42.4764, 44.4769, 'GE'),
  // ── Germany ──
  city('berlin', 'ბერლინი', 'Berlin', 52.52, 13.405, 'DE'),
  city('hamburg', 'ჰამბურგი', 'Hamburg', 53.5511, 9.9937, 'DE'),
  city('munich', 'მიუნხენი', 'Munich', 48.1351, 11.582, 'DE'),
  city('cologne', 'კელნი', 'Cologne', 50.9375, 6.9603, 'DE'),
  city('frankfurt', 'ფრანკფურტი', 'Frankfurt', 50.1109, 8.6821, 'DE'),
  city('stuttgart', 'შტუტგარტი', 'Stuttgart', 48.7758, 9.1829, 'DE'),
  city('duesseldorf', 'დიუსელდორფი', 'Düsseldorf', 51.2277, 6.7735, 'DE'),
  city('leipzig', 'ლაიფციგი', 'Leipzig', 51.3397, 12.3731, 'DE'),
  city('dortmund', 'დორტმუნდი', 'Dortmund', 51.5136, 7.4653, 'DE'),
  city('essen', 'ესენი', 'Essen', 51.4556, 7.0116, 'DE'),
  city('bremen', 'ბრემენი', 'Bremen', 53.0793, 8.8017, 'DE'),
  city('dresden', 'დრეზდენი', 'Dresden', 51.0504, 13.7373, 'DE'),
  city('hanover', 'ჰანოვერი', 'Hanover', 52.3759, 9.732, 'DE'),
  city('nuremberg', 'ნიურნბერგი', 'Nuremberg', 49.4521, 11.0767, 'DE'),
  city('duisburg', 'დუისბურგი', 'Duisburg', 51.4344, 6.7623, 'DE'),
  city('bochum', 'ბოხუმი', 'Bochum', 51.4818, 7.2162, 'DE'),
  city('wuppertal', 'ვუპერტალი', 'Wuppertal', 51.2562, 7.1508, 'DE'),
  city('bielefeld', 'ბილეფელდი', 'Bielefeld', 52.0302, 8.5325, 'DE'),
  city('bonn', 'ბონი', 'Bonn', 50.7374, 7.0982, 'DE'),
  city('muenster', 'მიუნსტერი', 'Münster', 51.9624, 7.6257, 'DE'),
  city('mannheim', 'მანჰაიმი', 'Mannheim', 49.4875, 8.466, 'DE'),
  city('karlsruhe', 'კარლსრუე', 'Karlsruhe', 49.0069, 8.4037, 'DE'),
  city('augsburg', 'აუგსბურგი', 'Augsburg', 48.3705, 10.8978, 'DE'),
  city('wiesbaden', 'ვისბადენი', 'Wiesbaden', 50.0826, 8.24, 'DE'),
  city('moenchengladbach', 'მონხენგლადბახი', 'Mönchengladbach', 51.1805, 6.4428, 'DE'),
  city('chemnitz', 'ქემნიცი', 'Chemnitz', 50.8278, 12.9214, 'DE'),
  city('halle', 'ჰალე', 'Halle', 51.4969, 11.9688, 'DE'),
  city('krefeld', 'კრეფელდი', 'Krefeld', 51.3388, 6.5853, 'DE'),
  city('freiburg', 'ფრაიბურგი', 'Freiburg', 47.999, 7.8421, 'DE'),
  city('luebeck', 'ლიუბეკი', 'Lübeck', 53.8655, 10.6866, 'DE'),
  city('erfurt', 'ერფურტი', 'Erfurt', 50.9787, 11.0328, 'DE'),
  city('rostock', 'როსტოკი', 'Rostock', 54.0924, 12.0991, 'DE'),
  city('mainz', 'მაინცი', 'Mainz', 49.9929, 8.2473, 'DE'),
  city('kassel', 'კასელი', 'Kassel', 51.3127, 9.4797, 'DE'),
  city('saarbruecken', 'საარბრიუკენი', 'Saarbrücken', 49.2354, 6.9814, 'DE'),
  city('hagen', 'ჰაგენი', 'Hagen', 51.3671, 7.4633, 'DE'),
  city('hamm', 'ჰამი', 'Hamm', 51.6739, 7.815, 'DE'),
  city('herne', 'ჰერნე', 'Herne', 51.5369, 7.2, 'DE'),
  city('muelheim', 'მიულჰაიმი', 'Mülheim', 51.4272, 6.8825, 'DE'),
  city('solingen', 'ზოლინგენი', 'Solingen', 51.1652, 7.0671, 'DE'),
  city('oberhausen', 'ობერჰაუზენი', 'Oberhausen', 51.4963, 6.8528, 'DE'),
  city('osnabrueck', 'ოსნაბრიუკი', 'Osnabrück', 52.2799, 8.0472, 'DE'),
  city('braunschweig', 'ბრაუნშვაიგი', 'Braunschweig', 52.2689, 10.5268, 'DE'),
  city('kiel', 'კილი', 'Kiel', 54.3233, 10.1228, 'DE'),
  city('aachen', 'აახენი', 'Aachen', 50.7753, 6.0839, 'DE'),
  city('heidelberg', 'ჰაიდელბერგი', 'Heidelberg', 49.3988, 8.6724, 'DE'),
  city('potsdam', 'პოტსდამი', 'Potsdam', 52.3906, 13.0645, 'DE'),
  city('bergisch-gladbach', 'ბერგიშ-გლადბახი', 'Bergisch Gladbach', 50.9857, 7.133, 'DE'),
  city('bottrop', 'ბოტროპი', 'Bottrop', 51.5239, 6.9285, 'DE'),
  city('bremerhaven', 'ბრემერჰავენი', 'Bremerhaven', 53.5498, 8.5809, 'DE'),
  city('cottbus', 'კოტბუსი', 'Cottbus', 51.759, 14.3329, 'DE'),
  city('darmstadt', 'დარმშტადი', 'Darmstadt', 49.8728, 8.6512, 'DE'),
  city('erlangen', 'ერლანგენი', 'Erlangen', 49.589, 11.0078, 'DE'),
  city('fuerth', 'ფირტი', 'Fürth', 49.4774, 10.9886, 'DE'),
  city('gelsenkirchen', 'გელსენქირქენი', 'Gelsenkirchen', 51.5177, 7.0857, 'DE'),
  city('gera', 'გერა', 'Gera', 50.8795, 12.0794, 'DE'),
  city('hildesheim', 'ჰილდეშაიმი', 'Hildesheim', 52.1506, 9.9511, 'DE'),
  city('ingolstadt', 'ინგოლშტადი', 'Ingolstadt', 48.7665, 11.4258, 'DE'),
  city('jena', 'იენა', 'Jena', 50.9271, 11.5892, 'DE'),
  city('kaiserslautern', 'კაიზერსლაუტერნი', 'Kaiserslautern', 49.4401, 7.7692, 'DE'),
  city('koblenz', 'კობლენცი', 'Koblenz', 50.3569, 7.589, 'DE'),
  city('leverkusen', 'ლევერკუზენი', 'Leverkusen', 51.0334, 6.9844, 'DE'),
  city('ludwigshafen', 'ლუდვიგშაფენი', 'Ludwigshafen', 49.4774, 8.4452, 'DE'),
  city('magdeburg', 'მაგდებურგი', 'Magdeburg', 52.1205, 11.6276, 'DE'),
  city('moers', 'მოერსი', 'Moers', 51.4532, 6.6323, 'DE'),
  city('neuss', 'ნუსი', 'Neuss', 51.1981, 6.685, 'DE'),
  city('offenbach', 'ოფენბახი', 'Offenbach', 50.1016, 8.7671, 'DE'),
  city('oldenburg', 'ოლდენბურგი', 'Oldenburg', 53.1412, 8.2147, 'DE'),
  city('paderborn', 'პადერბორნი', 'Paderborn', 51.7191, 8.7542, 'DE'),
  city('pforzheim', 'პფორცჰაიმი', 'Pforzheim', 48.891, 8.7046, 'DE'),
  city('recklinghausen', 'რეკლინგჰაუზენი', 'Recklinghausen', 51.6138, 7.1977, 'DE'),
  city('regensburg', 'რეგენსბურგი', 'Regensburg', 49.0134, 12.1016, 'DE'),
  city('remscheid', 'რემშაიდი', 'Remscheid', 51.1787, 7.1897, 'DE'),
  city('reutlingen', 'რეიტლინგენი', 'Reutlingen', 48.4914, 9.2044, 'DE'),
  city('salzgitter', 'სალცგიტერი', 'Salzgitter', 52.1506, 10.3369, 'DE'),
  city('siegen', 'სიეგენი', 'Siegen', 50.8748, 8.0214, 'DE'),
  city('trier', 'ტრიერი', 'Trier', 49.7542, 6.6419, 'DE'),
  city('ulm', 'ულმი', 'Ulm', 48.3984, 9.9916, 'DE'),
  city('wolfsburg', 'ვულფსბურგი', 'Wolfsburg', 52.4238, 10.7861, 'DE'),
  city('wuerzburg', 'ვიურცბურგი', 'Würzburg', 49.7913, 9.9534, 'DE'),
  // ── UAE ──
  city('dubai', 'დუბაი', 'Dubai', 25.2048, 55.2708, 'AE'),
  city('abu-dhabi', 'აბუ-დაბი', 'Abu Dhabi', 24.4539, 54.3773, 'AE'),
  // ── France ──
  city('paris', 'პარიზი', 'Paris', 48.8566, 2.3522, 'FR'),
  city('lyon', 'ლიონი', 'Lyon', 45.764, 4.8357, 'FR'),
  city('marseille', 'მარსელი', 'Marseille', 43.2965, 5.3698, 'FR'),
  city('nice', 'ნიცა', 'Nice', 43.7102, 7.262, 'FR'),
  city('toulouse', 'ტულუზა', 'Toulouse', 43.6047, 1.4442, 'FR'),
  city('bordeaux', 'ბორდო', 'Bordeaux', 44.8378, -0.5792, 'FR'),
  city('lille', 'ლილი', 'Lille', 50.6292, 3.0573, 'FR'),
  // ── Spain ──
  city('madrid', 'მადრიდი', 'Madrid', 40.4168, -3.7038, 'ES'),
  city('barcelona', 'ბარსელონა', 'Barcelona', 41.3874, 2.1686, 'ES'),
  city('valencia', 'ვალენსია', 'Valencia', 39.4699, -0.3763, 'ES'),
  city('seville', 'სევილია', 'Seville', 37.3891, -5.9845, 'ES'),
  city('bilbao', 'ბილბაო', 'Bilbao', 43.263, -2.935, 'ES'),
  // ── Italy ──
  city('rome', 'რომი', 'Rome', 41.9028, 12.4964, 'IT'),
  city('milan', 'მილანი', 'Milan', 45.4642, 9.19, 'IT'),
  city('naples', 'ნეაპოლი', 'Naples', 40.8518, 14.2681, 'IT'),
  city('turin', 'ტურინი', 'Turin', 45.0703, 7.6869, 'IT'),
  city('florence', 'ფლორენცია', 'Florence', 43.7696, 11.2558, 'IT'),
  city('bologna', 'ბოლონია', 'Bologna', 44.4949, 11.3426, 'IT'),
  // ── UK ──
  city('london', 'ლონდონი', 'London', 51.5074, -0.1278, 'GB'),
  city('manchester', 'მანჩესტერი', 'Manchester', 53.4808, -2.2426, 'GB'),
  city('birmingham', 'ბირმინგჰემი', 'Birmingham', 52.4862, -1.8904, 'GB'),
  city('edinburgh', 'ედინბურგი', 'Edinburgh', 55.9533, -3.1883, 'GB'),
  city('leeds', 'ლიდსი', 'Leeds', 53.8008, -1.5491, 'GB'),
  city('glasgow', 'გლაზგო', 'Glasgow', 55.8642, -4.2518, 'GB'),
  city('liverpool', 'ლივერპული', 'Liverpool', 53.4084, -2.9916, 'GB'),
  city('bristol', 'ბრისტოლი', 'Bristol', 51.4545, -2.5879, 'GB'),
  // ── USA ──
  city('new-york', 'ნიუ-იორკი', 'New York', 40.7128, -74.006, 'US'),
  city('miami', 'მაიამი', 'Miami', 25.7617, -80.1918, 'US'),
  city('los-angeles', 'ლოს-ანჯელესი', 'Los Angeles', 34.0522, -118.2437, 'US'),
  city('san-francisco', 'სან-ფრანცისკო', 'San Francisco', 37.7749, -122.4194, 'US'),
  city('chicago', 'ჩიკაგო', 'Chicago', 41.8781, -87.6298, 'US'),
  city('houston', 'ჰიუსტონი', 'Houston', 29.7604, -95.3698, 'US'),
  city('phoenix', 'ფინიქსი', 'Phoenix', 33.4484, -112.074, 'US'),
  city('boston', 'ბოსტონი', 'Boston', 42.3601, -71.0589, 'US'),
  city('seattle', 'სიეტლი', 'Seattle', 47.6062, -122.3321, 'US'),
  city('washington', 'ვაშინგტონი', 'Washington DC', 38.9072, -77.0369, 'US'),
  city('atlanta', 'ატლანტა', 'Atlanta', 33.749, -84.388, 'US'),
  city('dallas', 'დალასი', 'Dallas', 32.7767, -96.797, 'US'),
  city('denver', 'დენვერი', 'Denver', 39.7392, -104.9903, 'US'),
  city('las-vegas', 'ლას-ვეგასი', 'Las Vegas', 36.1699, -115.1398, 'US'),
  // ── Canada ──
  city('toronto', 'ტორონტო', 'Toronto', 43.6532, -79.3832, 'CA'),
  city('vancouver', 'ვანკუვერი', 'Vancouver', 49.2827, -123.1207, 'CA'),
  city('montreal', 'მონრეალი', 'Montreal', 45.5017, -73.5673, 'CA'),
  city('calgary', 'კალგარი', 'Calgary', 51.0447, -114.0719, 'CA'),
  city('ottawa', 'ოტავა', 'Ottawa', 45.4215, -75.6972, 'CA'),
  // ── Turkey ──
  city('istanbul', 'სტამბოლი', 'Istanbul', 41.0082, 28.9784, 'TR'),
  city('antalya', 'ანტალია', 'Antalya', 36.8969, 30.7133, 'TR'),
  city('ankara', 'ანკარა', 'Ankara', 39.9334, 32.8597, 'TR'),
  city('izmir', 'იზმირი', 'Izmir', 38.4237, 27.1428, 'TR'),
  city('bursa', 'ბურსა', 'Bursa', 40.1826, 29.0665, 'TR'),
  // ── Greece ──
  city('athens', 'ათენი', 'Athens', 37.9838, 23.7275, 'GR'),
  city('thessaloniki', 'თესალონიკი', 'Thessaloniki', 40.6401, 22.9444, 'GR'),
  // ── Cyprus ──
  city('nicosia', 'ნიქოზია', 'Nicosia', 35.1856, 33.3823, 'CY'),
  city('limassol', 'ლიმასოლი', 'Limassol', 34.7071, 33.0226, 'CY'),
  // ── Netherlands ──
  city('amsterdam', 'ამსტერდამი', 'Amsterdam', 52.3676, 4.9041, 'NL'),
  city('rotterdam', 'როტერდამი', 'Rotterdam', 51.9244, 4.4777, 'NL'),
  city('the-hague', 'ჰააგა', 'The Hague', 52.0705, 4.3007, 'NL'),
  // ── Portugal ──
  city('lisbon', 'ლისაბონი', 'Lisbon', 38.7223, -9.1393, 'PT'),
  city('porto', 'პორტუ', 'Porto', 41.1579, -8.6291, 'PT'),
  // ── Switzerland ──
  city('zurich', 'ციურიხი', 'Zurich', 47.3769, 8.5417, 'CH'),
  city('geneva', 'ჟენევა', 'Geneva', 46.2044, 6.1432, 'CH'),
  // ── Japan ──
  city('tokyo', 'ტოკიო', 'Tokyo', 35.6762, 139.6503, 'JP'),
  city('osaka', 'ოსაკა', 'Osaka', 34.6937, 135.5023, 'JP'),
  city('yokohama', 'იოკოჰამა', 'Yokohama', 35.4437, 139.638, 'JP'),
  city('nagoya', 'ნაგოია', 'Nagoya', 35.1815, 136.9066, 'JP'),
  city('sapporo', 'საპორო', 'Sapporo', 43.0618, 141.3545, 'JP'),
  city('fukuoka', 'ფუკუოკა', 'Fukuoka', 33.5902, 130.4017, 'JP'),
  city('kobe', 'კობე', 'Kobe', 34.6901, 135.1956, 'JP'),
  city('kyoto', 'კიოტო', 'Kyoto', 35.0116, 135.7681, 'JP'),
  // ── India ──
  city('delhi', 'დელი', 'Delhi', 28.6139, 77.209, 'IN'),
  city('mumbai', 'მუმბაი', 'Mumbai', 19.076, 72.8777, 'IN'),
  city('kolkata', 'კოლკატა', 'Kolkata', 22.5726, 88.3639, 'IN'),
  city('chennai', 'ჩენაი', 'Chennai', 13.0827, 80.2707, 'IN'),
  // ── 2026-09 market expansion: cities the GeoNames gen table lacks (inventory wins on clash) ──
  city('playa-del-carmen', 'პლაია-დელ-კარმენი', 'Playa del Carmen', 20.6296, -87.0739, 'MX'),
  city('nha-trang', 'ნჰა-ტრანგი', 'Nha Trang', 12.2388, 109.1967, 'VN'),
  city('kota-kinabalu', 'კოტა-კინაბალუ', 'Kota Kinabalu', 5.9804, 116.0735, 'MY'),
  city('sharm-el-sheikh', 'შარმ-ელ-შეიხი', 'Sharm El Sheikh', 27.9158, 34.33, 'EG'),
  city('kisumu', 'კისუმუ', 'Kisumu', -0.09, 34.768, 'KE'),
  city('wroclaw', 'ვროცლავი', 'Wrocław', 51.1079, 17.0385, 'PL'),
  city('poznan', 'პოზნანი', 'Poznań', 52.4064, 16.9252, 'PL'),
  city('ostrava', 'ოსტრავა', 'Ostrava', 49.8209, 18.2625, 'CZ'),
  city('plzen', 'პლზენი', 'Plzeň', 49.7468, 13.3779, 'CZ'),
  city('debrecen', 'დებრეცენი', 'Debrecen', 47.5316, 21.6273, 'HU'),
  city('szeged', 'სეგედი', 'Szeged', 46.253, 20.1414, 'HU'),
  city('pecs', 'პეჩი', 'Pécs', 46.0727, 18.2323, 'HU'),
  city('timisoara', 'ტიმიშოარა', 'Timișoara', 45.7489, 21.2087, 'RO'),
  city('iasi', 'იასი', 'Iași', 47.1585, 27.6014, 'RO'),
  city('brasov', 'ბრაშოვი', 'Brașov', 45.658, 25.6012, 'RO'),
  city('varna', 'ვარნა', 'Varna', 43.2141, 27.9147, 'BG'),
  city('burgas', 'ბურგასი', 'Burgas', 42.5048, 27.4626, 'BG'),
  city('novi-sad', 'ნოვი-სადი', 'Novi Sad', 45.2671, 19.8335, 'RS'),
  city('nis', 'ნიში', 'Niš', 43.3209, 21.8958, 'RS'),
  city('rijeka', 'რიეკა', 'Rijeka', 45.3271, 14.4422, 'HR'),
  city('zadar', 'ზადარი', 'Zadar', 44.1194, 15.2314, 'HR'),
  city('goteborg', 'გეტებორგი', 'Gothenburg', 57.7089, 11.9746, 'SE'),
  city('trondheim', 'ტრონდჰაიმი', 'Trondheim', 63.4305, 10.3951, 'NO'),
  city('stavanger', 'სტავანგერი', 'Stavanger', 58.97, 5.7331, 'NO'),
  city('aarhus', 'ორჰუსი', 'Aarhus', 56.1629, 10.2039, 'DK'),
  city('odense', 'ოდენსე', 'Odense', 55.4038, 10.4024, 'DK'),
  city('espoo', 'ესპოო', 'Espoo', 60.2055, 24.6559, 'FI'),
  city('tampere', 'ტამპერე', 'Tampere', 61.4978, 23.761, 'FI'),
  city('vantaa', 'ვანტაა', 'Vantaa', 60.2934, 25.0378, 'FI'),
  city('bruges', 'ბრიუგე', 'Bruges', 51.2093, 3.2247, 'BE'),
  city('limerick', 'ლიმერიკი', 'Limerick', 52.6638, -8.6267, 'IE'),
  city('cordoba', 'კორდობა', 'Córdoba', -31.4135, -64.1811, 'AR'),
  city('chittagong', 'ჩიტაგონგი', 'Chittagong', 22.3569, 91.7832, 'BD'),
  city('sylhet', 'სილჰეტი', 'Sylhet', 24.8949, 91.8687, 'BD'),
  city('kandy', 'კანდი', 'Kandy', 7.2906, 80.6337, 'LK'),
  city('galle', 'გალე', 'Galle', 6.0535, 80.221, 'LK'),
  city('pokhara', 'პოხარა', 'Pokhara', 28.2096, 83.9856, 'NP'),
  city('lalitpur', 'ლალიტპური', 'Lalitpur', 27.6588, 85.3247, 'NP'),
  city('naypyidaw', 'ნაიპიიდაუ', 'Naypyidaw', 19.7633, 96.0785, 'MM'),
  city('luang-prabang', 'ლუანგ-პრაბანგი', 'Luang Prabang', 19.8867, 102.135, 'LA'),
  city('samarkand', 'სამარყანდი', 'Samarkand', 39.627, 66.975, 'UZ'),
  city('bukhara', 'ბუხარა', 'Bukhara', 39.7747, 64.4286, 'UZ'),
  city('shymkent', 'შიმკენტი', 'Shymkent', 42.3417, 69.5901, 'KZ'),
  city('gyumri', 'გიუმრი', 'Gyumri', 40.7894, 43.8475, 'AM'),
  city('ganja', 'განჯა', 'Ganja', 40.6828, 46.3606, 'AZ'),
  city('sumqayit', 'სუმგაითი', 'Sumqayit', 40.5855, 49.6317, 'AZ'),
  city('dnipro', 'დნიპრო', 'Dnipro', 48.4647, 35.0462, 'UA'),
  city('tartu', 'ტარტუ', 'Tartu', 58.3776, 26.729, 'EE'),
  city('kaunas', 'კაუნასი', 'Kaunas', 54.8985, 23.9036, 'LT'),
  city('daugavpils', 'დაუგავპილსი', 'Daugavpils', 55.8747, 26.524, 'LV'),
  city('st-julians', 'სენტ-ჯულიანსი', 'St Julian\'s', 35.9198, 14.4885, 'MT'),
  city('kosice', 'კოშიცე', 'Košice', 48.7164, 21.2611, 'SK'),
  city('maribor', 'მარიბორი', 'Maribor', 46.5547, 15.6459, 'SI'),
  city('bangalore', 'ბანგალორი', 'Bangalore', 12.9716, 77.5946, 'IN'),
  city('hyderabad', 'ჰაიდარაბადი', 'Hyderabad', 17.385, 78.4867, 'IN'),
  city('pune', 'პუნე', 'Pune', 18.5204, 73.8567, 'IN'),
  city('ahmedabad', 'აჰმადაბადი', 'Ahmedabad', 23.0225, 72.5714, 'IN'),
  city('jaipur', 'ჯაიპური', 'Jaipur', 26.9124, 75.7873, 'IN'),
  // ── China ──
  city('shanghai', 'შანხაი', 'Shanghai', 31.2304, 121.4737, 'CN'),
  city('beijing', 'პეკინი', 'Beijing', 39.9042, 116.4074, 'CN'),
  city('guangzhou', 'გუანჯოუ', 'Guangzhou', 23.1291, 113.2644, 'CN'),
  city('shenzhen', 'შენჟენი', 'Shenzhen', 22.5431, 114.0579, 'CN'),
  city('chengdu', 'ჩენგდუ', 'Chengdu', 30.5728, 104.0668, 'CN'),
  city('hangzhou', 'ჰანგჟოუ', 'Hangzhou', 30.2741, 120.1551, 'CN'),
  city('wuhan', 'ვუჰანი', 'Wuhan', 30.5928, 114.3055, 'CN'),
  city('nanjing', 'ნანკინგი', 'Nanjing', 32.0603, 118.7969, 'CN'),
  city('tianjin', 'ტიანჯინი', 'Tianjin', 39.3434, 117.3616, 'CN'),
  // ── Hong Kong ──
  city('hong-kong', 'ჰონგ-კონგი', 'Hong Kong', 22.3193, 114.1694, 'HK'),
  // ── South Korea ──
  city('seoul', 'სეული', 'Seoul', 37.5665, 126.978, 'KR'),
  city('busan', 'ბუსანი', 'Busan', 35.1796, 129.0756, 'KR'),
  city('incheon', 'ინჩონი', 'Incheon', 37.4563, 126.7052, 'KR'),
  city('daegu', 'დეგუ', 'Daegu', 35.8714, 128.6014, 'KR'),
  city('daejeon', 'დეჯონი', 'Daejeon', 36.3504, 127.3845, 'KR'),
  // ── Thailand ──
  city('bangkok', 'ბანგკოკი', 'Bangkok', 13.7563, 100.5018, 'TH'),
  city('chiang-mai', 'ჩიანგმაი', 'Chiang Mai', 18.7883, 98.9853, 'TH'),
  city('phuket', 'ფუკეტი', 'Phuket', 7.8804, 98.3923, 'TH'),
  city('pattaya', 'პატაია', 'Pattaya', 12.9236, 100.8825, 'TH'),
  // ── Indonesia ──
  city('jakarta', 'ჯაკარტა', 'Jakarta', -6.2088, 106.8456, 'ID'),
  city('surabaya', 'სურაბაია', 'Surabaya', -7.2575, 112.7521, 'ID'),
  city('bandung', 'ბანდუნგი', 'Bandung', -6.9175, 107.6191, 'ID'),
  city('bali', 'ბალი', 'Bali', -8.3405, 115.092, 'ID'),
  // ── Philippines ──
  city('manila', 'მანილა', 'Manila', 14.5995, 120.9842, 'PH'),
  city('quezon-city', 'ქეზონ-სიტი', 'Quezon City', 14.676, 121.0437, 'PH'),
  city('cebu', 'სებუ', 'Cebu', 10.3157, 123.8854, 'PH'),
  // ── Vietnam ──
  city('ho-chi-minh-city', 'ჰო-ჩი-მინჰი', 'Ho Chi Minh City', 10.8231, 106.6297, 'VN'),
  city('hanoi', 'ჰანოი', 'Hanoi', 21.0278, 105.8342, 'VN'),
  city('da-nang', 'და-ნანგი', 'Da Nang', 16.0544, 108.2022, 'VN'),
  // ── Malaysia ──
  city('kuala-lumpur', 'კუალა-ლუმპური', 'Kuala Lumpur', 3.139, 101.6869, 'MY'),
  city('george-town', 'ჯორჯ-თაუნი', 'George Town', 5.4164, 100.3327, 'MY'),
  city('johor-bahru', 'ჯოჰორ-ბაჰრუ', 'Johor Bahru', 1.4927, 103.7414, 'MY'),
  // ── Singapore ──
  city('singapore', 'სინგაპური', 'Singapore', 1.3521, 103.8198, 'SG'),
  // ── Saudi Arabia ──
  city('riyadh', 'რიადი', 'Riyadh', 24.7136, 46.6753, 'SA'),
  city('jeddah', 'ჯედდა', 'Jeddah', 21.4858, 39.1925, 'SA'),
  // ── Nigeria ──
  city('lagos', 'ლაგოსი', 'Lagos', 6.5244, 3.3792, 'NG'),
  city('abuja', 'აბუჯა', 'Abuja', 9.0579, 7.4951, 'NG'),
  // ── Egypt ──
  city('cairo', 'კაირო', 'Cairo', 30.0444, 31.2357, 'EG'),
  city('alexandria', 'ალექსანდრია', 'Alexandria', 31.2001, 29.9187, 'EG'),
  // ── South Africa ──
  city('cape-town', 'კეიპთაუნი', 'Cape Town', -33.9249, 18.4241, 'ZA'),
  city('johannesburg', 'იოჰანესბურგი', 'Johannesburg', -26.2041, 28.0473, 'ZA'),
  city('durban', 'დურბანი', 'Durban', -29.8587, 31.0218, 'ZA'),
  // ── Kenya ──
  city('nairobi', 'ნაირობი', 'Nairobi', -1.2921, 36.8219, 'KE'),
  // ── Morocco ──
  city('marrakech', 'მარაქეში', 'Marrakech', 31.6295, -7.9811, 'MA'),
  city('tangier', 'ტანჟერი', 'Tangier', 35.7595, -5.834, 'MA'),
  city('casablanca', 'კასაბლანკა', 'Casablanca', 33.5731, -7.5898, 'MA'),
  // ── Colombia ──
  city('bogota', 'ბოგოტა', 'Bogotá', 4.711, -74.0721, 'CO'),
  city('medellin', 'მედელინი', 'Medellin', 6.2442, -75.5812, 'CO'),
  city('cali', 'კალი', 'Cali', 3.4516, -76.532, 'CO'),
  // ── Chile ──
  city('santiago', 'სანტიაგო', 'Santiago', -33.4489, -70.6693, 'CL'),
  // ── Argentina ──
  city('buenos-aires', 'ბუენოს-აირესი', 'Buenos Aires', -34.6037, -58.3816, 'AR'),
  city('cordoba-ar', 'კორდობა', 'Córdoba', -31.4201, -64.1888, 'AR'),
  city('rosario', 'როსარიო', 'Rosario', -32.9468, -60.6393, 'AR'),
  // ── Peru ──
  city('lima', 'ლიმა', 'Lima', -12.0464, -77.0428, 'PE'),
  // ── Ecuador ──
  city('quito', 'კიტო', 'Quito', -0.1807, -78.4678, 'EC'),
  city('guayaquil', 'გუაიაკილი', 'Guayaquil', -2.171, -79.9224, 'EC'),
  // ── Mexico ──
  city('mexico-city', 'მეხიკო', 'Mexico City', 19.4326, -99.1332, 'MX'),
  city('guadalajara', 'გუადალაჰარა', 'Guadalajara', 20.6597, -103.3496, 'MX'),
  city('monterrey', 'მონტერი', 'Monterrey', 25.6866, -100.3161, 'MX'),
  city('puebla', 'პუებლა', 'Puebla', 19.0414, -98.2063, 'MX'),
  // ── Brazil ──
  city('sao-paulo', 'სან-პაულუ', 'São Paulo', -23.5558, -46.6396, 'BR'),
  city('rio-de-janeiro', 'რიო-დე-ჟანეირო', 'Rio de Janeiro', -22.9068, -43.1729, 'BR'),
  city('brasilia', 'ბრაზილია', 'Brasília', -15.7975, -47.8919, 'BR'),
  city('salvador', 'სალვადორი', 'Salvador', -12.9714, -38.5124, 'BR'),
  city('fortaleza', 'ფორტალეზა', 'Fortaleza', -3.7172, -38.5433, 'BR'),
  city('recife', 'რესიფე', 'Recife', -8.0476, -34.877, 'BR'),
  // ── Russia ──
  city('moscow', 'მოსკოვი', 'Moscow', 55.7558, 37.6173, 'RU'),
  city('saint-petersburg', 'სანქტ-პეტერბურგი', 'Saint Petersburg', 59.9343, 30.3351, 'RU'),
  // ── Iran ──
  city('tehran', 'თეირანი', 'Tehran', 35.6892, 51.389, 'IR'),
  city('isfahan', 'ისფაჰანი', 'Isfahan', 32.6546, 51.668, 'IR'),
  // ── Pakistan ──
  city('karachi', 'კარაჩი', 'Karachi', 24.8607, 67.0011, 'PK'),
  city('lahore', 'ლაჰორი', 'Lahore', 31.5204, 74.3587, 'PK'),
  city('islamabad', 'ისლამაბადი', 'Islamabad', 33.6844, 73.0479, 'PK'),
  // ── Bangladesh ──
  city('dhaka', 'დაკა', 'Dhaka', 23.8103, 90.4125, 'BD'),
  // ── Sri Lanka ──
  city('colombo', 'კოლომბო', 'Colombo', 6.9271, 79.8612, 'LK'),
  // ── Nepal ──
  city('kathmandu', 'კატმანდუ', 'Kathmandu', 27.7172, 85.324, 'NP'),
  // ── Cambodia ──
  city('phnom-penh', 'ფნომ-პენი', 'Phnom Penh', 11.5564, 104.9282, 'KH'),
  // ── Myanmar ──
  city('yangon', 'იანგონი', 'Yangon', 16.8661, 96.1951, 'MM'),
  // ── Laos ──
  city('vientiane', 'ვიენტიანი', 'Vientiane', 17.9757, 102.6331, 'LA'),
  // ── Mongolia ──
  city('ulaanbaatar', 'ულაანბაატარი', 'Ulaanbaatar', 47.8864, 106.9057, 'MN'),
  // ── Azerbaijan ──
  city('baku', 'ბაქო', 'Baku', 40.4093, 49.8671, 'AZ'),
  // ── Armenia ──
  city('yerevan', 'ერევანი', 'Yerevan', 40.1792, 44.4991, 'AM'),
  // ── Kazakhstan ──
  city('almaty', 'ალმატი', 'Almaty', 43.222, 76.8512, 'KZ'),
  city('astana', 'ასტანა', 'Astana', 51.1694, 71.4491, 'KZ'),
  // ── Uzbekistan ──
  city('tashkent', 'ტაშკენტი', 'Tashkent', 41.2995, 69.2401, 'UZ'),
  // ── Ukraine ──
  city('kyiv', 'კიევი', 'Kyiv', 50.4501, 30.5234, 'UA'),
  city('kharkiv', 'ხარკივი', 'Kharkiv', 49.9935, 36.2304, 'UA'),
  city('odesa', 'ოდესა', 'Odesa', 46.4825, 30.7233, 'UA'),
  city('lviv', 'ლვივი', 'Lviv', 49.8397, 24.0297, 'UA'),
  // ── Serbia ──
  city('belgrade', 'ბელგრადი', 'Belgrade', 44.7866, 20.4489, 'RS'),
  // ── Croatia ──
  city('zagreb', 'ზაგრები', 'Zagreb', 45.815, 15.9819, 'HR'),
  city('split', 'სპლიტი', 'Split', 43.5081, 16.4402, 'HR'),
  // ── Bulgaria ──
  city('sofia', 'სოფია', 'Sofia', 42.6977, 23.3219, 'BG'),
  city('plovdiv', 'პლოვდივი', 'Plovdiv', 42.1354, 24.7453, 'BG'),
  // ── Romania ──
  city('bucharest', 'ბუქარესტი', 'Bucharest', 44.4268, 26.1025, 'RO'),
  city('cluj-napoca', 'კლუჟ-ნაპოკა', 'Cluj-Napoca', 46.7712, 23.6236, 'RO'),
  // ── Czech Republic ──
  city('prague', 'პრაღა', 'Prague', 50.0755, 14.4378, 'CZ'),
  city('brno', 'ბრნო', 'Brno', 49.1951, 16.6068, 'CZ'),
  // ── Hungary ──
  city('budapest', 'ბუდაპეშტი', 'Budapest', 47.4979, 19.0402, 'HU'),
  // ── Poland ──
  city('warsaw', 'ვარშავა', 'Warsaw', 52.2297, 21.0122, 'PL'),
  city('krakow', 'კრაკოვი', 'Krakow', 50.0647, 19.945, 'PL'),
  city('gdansk', 'დანციგი', 'Gdansk', 54.352, 18.6466, 'PL'),
  // ── Slovakia ──
  city('bratislava', 'ბრატისლავა', 'Bratislava', 48.1486, 17.1077, 'SK'),
  // ── Slovenia ──
  city('ljubljana', 'ლიუბლიანა', 'Ljubljana', 46.0569, 14.5058, 'SI'),
  // ── Estonia ──
  city('tallinn', 'ტალინი', 'Tallinn', 59.437, 24.7536, 'EE'),
  // ── Lithuania ──
  city('vilnius', 'ვილნიუსი', 'Vilnius', 54.6872, 25.2797, 'LT'),
  // ── Latvia ──
  city('riga', 'რიგა', 'Riga', 56.9496, 24.1052, 'LV'),
  // ── Iceland ──
  city('reykjavik', 'რეიკიავიკი', 'Reykjavik', 64.1466, -21.9426, 'IS'),
  // ── Ireland ──
  city('dublin', 'დუბლინი', 'Dublin', 53.3498, -6.2603, 'IE'),
  // ── Malta ──
  city('valletta', 'ვალეტა', 'Valletta', 35.8989, 14.5146, 'MT'),
  // ── Luxembourg ──
  city('luxembourg', 'ლუქსემბურგი', 'Luxembourg', 49.6117, 6.1319, 'LU'),
  // ── Brunei ──
  city('bandar-seri-begawan', 'ბანდარ-სერი-ბეგავანი', 'Bandar Seri Begawan', 4.9031, 114.9398, 'BN'),
  // ── Timor-Leste ──
  city('dili', 'დილი', 'Dili', -8.5569, 125.5603, 'TL'),
  // ── Bhutan ──
  city('thimphu', 'თიმფხუ', 'Thimphu', 27.4728, 89.6393, 'BT'),
  // ── Maldives ──
  city('male', 'მალე', 'Malé', 4.1755, 73.5093, 'MV'),
  // ── Fiji ──
  city('suva', 'სუვა', 'Suva', -18.1416, 178.4419, 'FJ'),
  // ── Papua New Guinea ──
  city('port-moresby', 'პორტ-მორესბი', 'Port Moresby', -6.3149, 143.9556, 'PG'),
  // ── Gabon ──
  city('libreville', 'ლიბრევილი', 'Libreville', 0.4162, 9.4673, 'GA'),
  // ── Cameroon ──
  city('yaounde', 'იაუნდე', 'Yaounde', 3.848, 11.5021, 'CM'),
  // ── Ivory Coast ──
  city('abidjan', 'აბიჯანი', 'Abidjan', 5.36, -4.0083, 'CI'),
  // ── Ghana ──
  city('accra', 'აკრა', 'Accra', 5.6037, -0.187, 'GH'),
  // ── Senegal ──
  city('dakar', 'დაკარი', 'Dakar', 14.7167, -17.4677, 'SN'),
  // ── Tunisia ──
  city('tunis', 'ტუნისი', 'Tunis', 36.8065, 10.1815, 'TN'),
  // ── Algeria ──
  city('algiers', 'ალჟირი', 'Algiers', 36.7538, 3.0588, 'DZ'),
  // ── Libya ──
  city('tripoli', 'ტრიპოლი', 'Tripoli', 32.8872, 13.1913, 'LY'),
  // ── Sudan ──
  city('khartoum', 'ხარტუმი', 'Khartoum', 15.5007, 32.5599, 'SD'),
  // ── Ethiopia ──
  city('addis-ababa', 'ადის-აბება', 'Addis Ababa', 9.025, 38.7469, 'ET'),
  // ── Uganda ──
  city('kampala', 'კამპალა', 'Kampala', 0.3476, 32.5825, 'UG'),
  // ── Rwanda ──
  city('kigali', 'კიგალი', 'Kigali', -1.9403, 29.8739, 'RW'),
  // ── Tanzania ──
  city('dar-es-salaam', 'დარ-ეს-სალამი', 'Dar es Salaam', -6.7924, 39.2083, 'TZ'),
  // ── Zambia ──
  city('lusaka', 'ლუსაკა', 'Lusaka', -15.3875, 28.3228, 'ZM'),
  // ── Zimbabwe ──
  city('harare', 'ჰარარე', 'Harare', -17.8252, 31.0335, 'ZW'),
  // ── Botswana ──
  city('gaborone', 'გაბორონე', 'Gaborone', -24.6282, 25.9231, 'BW'),
  // ── Namibia ──
  city('windhoek', 'ვინდჰუკი', 'Windhoek', -22.5609, 17.0658, 'NA'),
  // ── Mozambique ──
  city('maputo', 'მაპუტო', 'Maputo', -25.9692, 32.5732, 'MZ'),
  // ── Madagascar ──
  city('antananarivo', 'ანტანანარივო', 'Antananarivo', -18.8792, 47.5079, 'MG'),
  // ── Mauritius ──
  city('port-louis', 'პორტ-ლუი', 'Port Louis', -20.1609, 57.5012, 'MU'),
  // ── Mauritania ──
  city('nouakchott', 'ნუაკშოტი', 'Nouakchott', 18.0735, -15.9582, 'MR'),
  // ── Somalia ──
  city('mogadishu', 'მოგადიშუ', 'Mogadishu', 2.0469, 45.3182, 'SO'),
  // ── Djibouti ──
  city('djibouti', 'ჯიბუტი', 'Djibouti', 11.5721, 43.1456, 'DJ'),
  // ── Eritrea ──
  city('asmara', 'ასმარა', 'Asmara', 15.3389, 38.9318, 'ER'),
  // ── South Sudan ──
  city('juba', 'ჯუბა', 'Juba', 4.8594, 31.5713, 'SS'),
  // ── Equatorial Guinea ──
  city('malabo', 'მალაბო', 'Malabo', 3.7504, 8.7371, 'GQ'),
  // ── São Tomé and Príncipe ──
  city('sao-tome', 'საო-ტომე', 'São Tomé', 0.3365, 6.7273, 'ST'),
  // ── Seychelles ──
  city('victoria', 'ვიქტორია', 'Victoria', -4.6191, 55.4513, 'SC'),
  // ── Comoros ──
  city('moroni', 'მორონი', 'Moroni', -11.7017, 43.2551, 'KM'),
  // ── Samoa ──
  city('apia', 'აპია', 'Apia', -13.8333, -171.75, 'WS'),
  // ── Tonga ──
  city('nuku-alofa', 'ნუკუ-ალოფა', "Nuku'alofa", -21.2087, -175.1982, 'TO'),
  // ── Vanuatu ──
  city('port-vila', 'პორტ-ვილა', 'Port Vila', -17.7333, 168.322, 'VU'),
  // ── Solomon Islands ──
  city('honiara', 'ჰონიარა', 'Honiara', -9.428, 159.9556, 'SB'),
  // ── Nauru ──
  city('yaren', 'იარენი', 'Yaren', -0.5227, 166.9314, 'NR'),
  // ── Palau ──
  city('ngerulmud', 'ნგერულმუდი', 'Ngerulmud', 7.5005, 134.6236, 'PW'),
  // ── Micronesia ──
  city('palikir', 'პალიკირი', 'Palikir', 6.9248, 158.161, 'FM'),
  // ── Marshall Islands ──
  city('majuro', 'მაჯურო', 'Majuro', 7.0897, 171.3803, 'MH'),
  // ── Cape Verde ──
  city('praia', 'პრაია', 'Praia', 14.933, -23.5133, 'CV'),
  // ── Missing MARKETS cities (ponytail: fill gaps only) ──
  // Australia
  city('adelaide', 'ადელაიდა', 'Adelaide', -34.9285, 138.6007, 'AU'),
  city('brisbane', 'ბრისბეინი', 'Brisbane', -27.4698, 153.0251, 'AU'),
  city('melbourne', 'მელბურნი', 'Melbourne', -37.8136, 144.9631, 'AU'),
  city('perth', 'პერთი', 'Perth', -31.9505, 115.8605, 'AU'),
  city('sydney', 'სიდნეი', 'Sydney', -33.8688, 151.2093, 'AU'),
  // Austria
  city('graz', 'გრაცი', 'Graz', 47.0707, 15.4395, 'AT'),
  city('innsbruck', 'ინსბრუკი', 'Innsbruck', 47.2692, 11.4041, 'AT'),
  city('salzburg', 'ზალცბურგი', 'Salzburg', 47.8095, 13.055, 'AT'),
  city('vienna', 'ვენა', 'Vienna', 48.2082, 16.3738, 'AT'),
  // Belgium
  city('antwerp', 'ანტვერპენი', 'Antwerp', 51.2194, 4.4025, 'BE'),
  city('brussels', 'ბრიუსელი', 'Brussels', 50.8503, 4.3517, 'BE'),
  city('ghent', 'გენტი', 'Ghent', 51.0543, 3.7174, 'BE'),
  // Brazil
  city('belo-horizonte', 'ბელუ-ორიზონტი', 'Belo Horizonte', -19.9167, -43.9345, 'BR'),
  city('curitiba', 'კურიტიბა', 'Curitiba', -25.4284, -49.2733, 'BR'),
  // Canada
  city('edmonton', 'ედმონტონი', 'Edmonton', 53.5461, -113.4938, 'CA'),
  // Chile
  city('valparaiso', 'ვალპარაისო', 'Valparaíso', -33.0472, -71.6127, 'CL'),
  city('vina-del-mar', 'ვინა-დელ-მარი', 'Viña del Mar', -33.0246, -71.5518, 'CL'),
  city('concepcion', 'კონსეფსიონი', 'Concepción', -36.827, -73.0503, 'CL'),
  // Colombia
  city('barranquilla', 'ბარანკია', 'Barranquilla', 10.9639, -74.7964, 'CO'),
  city('cartagena', 'კარტაგენა', 'Cartagena', 10.391, -75.5144, 'CO'),
  // Denmark
  city('copenhagen', 'კოპენჰაგენი', 'Copenhagen', 55.6761, 12.5683, 'DK'),
  // Ecuador
  city('cuenca', 'კუენკა', 'Cuenca', -2.9006, -79.0045, 'EC'),
  // Egypt
  city('giza', 'გიზა', 'Giza', 30.0131, 31.2089, 'EG'),
  // Finland
  city('helsinki', 'ჰელსინკი', 'Helsinki', 60.1699, 24.9384, 'FI'),
  // Ireland
  city('cork', 'კორკი', 'Cork', 51.8985, -8.4756, 'IE'),
  city('galway', 'გოლუეი', 'Galway', 53.2707, -9.0568, 'IE'),
  // Indonesia
  city('medan', 'მედანი', 'Medan', 3.5952, 98.6722, 'ID'),
  // Mexico
  city('cancun', 'კანკუნი', 'Cancún', 21.1619, -86.8515, 'MX'),
  // Morocco
  city('rabat', 'რაბათი', 'Rabat', 34.0209, -6.8416, 'MA'),
  // Netherlands
  city('amsterdam', 'ამსტერდამი', 'Amsterdam', 52.3676, 4.9041, 'NL'),
  // New Zealand
  city('auckland', 'ოკლენდი', 'Auckland', -36.8509, 174.7645, 'NZ'),
  city('christchurch', 'კრაისჩურჩი', 'Christchurch', -43.5321, 172.6362, 'NZ'),
  city('wellington', 'ველინგტონი', 'Wellington', -41.2865, 174.7762, 'NZ'),
  // Nigeria
  city('kano', 'კანო', 'Kano', 12.0022, 8.592, 'NG'),
  city('port-harcourt', 'პორტ-ჰარკაუტი', 'Port Harcourt', 4.8156, 7.0195, 'NG'),
  // Norway
  city('bergen', 'ბერგენი', 'Bergen', 60.3913, 5.3221, 'NO'),
  city('oslo', 'ოსლო', 'Oslo', 59.9139, 10.7522, 'NO'),
  // Pakistan
  city('rawalpindi', 'რაუალპინდი', 'Rawalpindi', 33.6007, 73.0679, 'PK'),
  // Peru
  city('arequipa', 'არეკვიპა', 'Arequipa', -16.409, -71.5375, 'PE'),
  city('cusco', 'კუსკო', 'Cusco', -13.532, -71.9675, 'PE'),
  city('trujillo', 'ტრუჯიო', 'Trujillo', -8.1116, -79.0289, 'PE'),
  // Saudi Arabia
  city('dammam', 'დამამი', 'Dammam', 26.4207, 50.0888, 'SA'),
  // South Africa
  city('pretoria', 'პრეტორია', 'Pretoria', -25.7479, 28.2293, 'ZA'),
  // Spain
  city('alicante', 'ალიკანტე', 'Alicante', 38.3452, -0.481, 'ES'),
  city('malaga', 'მალაგა', 'Málaga', 36.7213, -4.4214, 'ES'),
  // Sweden
  city('malmo', 'მალმე', 'Malmö', 55.605, 13.0038, 'SE'),
  city('stockholm', 'სტოკჰოლმი', 'Stockholm', 59.3293, 18.0686, 'SE'),
  // Turkey
  city('bodrum', 'ბოდრუმი', 'Bodrum', 37.0344, 27.4305, 'TR'),
  // UAE
  city('sharjah', 'შარჯა', 'Sharjah', 25.3463, 55.4209, 'AE'),
  city('ras-al-khaimah', 'რას-ელ-ხაიმა', 'Ras Al Khaimah', 25.7895, 55.9432, 'AE'),
  // UK
  city('edinburgh', 'ედინბურგი', 'Edinburgh', 55.9533, -3.1883, 'GB'),
  // USA
  city('austin', 'ოსტინი', 'Austin', 30.2672, -97.7431, 'US'),
  // Remaining MARKETS gaps
  city('davao', 'დავაო', 'Davao', 7.0731, 125.6128, 'PH'),
  city('mandalay', 'მანდალეი', 'Mandalay', 21.9822, 96.0785, 'MM'),
  city('mendoza', 'მენდოზა', 'Mendoza', -32.8895, -68.8458, 'AR'),
  city('mombasa', 'მომბასა', 'Mombasa', -4.0435, 39.6682, 'KE'),
  city('siem-reap', 'სიემ-რეაპი', 'Siem Reap', 13.3671, 103.8448, 'KH'),
  city('sliema', 'სლიემა', 'Sliema', 35.9122, 14.5024, 'MT'),
]

/** Inventory + world places, first occurrence wins on slug clash. */
const bySlug = new Map<string, MapCity>()
for (const c of [...INVENTORY_CITIES, ...WORLD_PLACES]) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, c as MapCity)
}
export const MAP_CITIES: readonly MapCity[] = [...bySlug.values()]

const PLACE_KEY = 'sivrce.map.place'
const IP_DISMISS_KEY = 'sivrce.map.ip-dismiss'
/** Beyond this → treat as “not near a listed city”. */
export const SNAP_MAX_KM = 55

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** List-parametrized cores — user-place.server.ts reuses them on the full corpus. */
export function nearestIn(
  list: readonly MapCity[],
  lat: number,
  lng: number,
  maxKm: number,
): MapCity | null {
  let best: MapCity | null = null
  let bestKm = Infinity
  for (const c of list) {
    const km = haversineKm({ lat, lng }, c)
    if (km < bestKm) {
      bestKm = km
      best = c
    }
  }
  return best && bestKm <= maxKm ? best : null
}

export function nearestMapCity(
  lat: number,
  lng: number,
  maxKm = SNAP_MAX_KM,
): MapCity | null {
  return nearestIn(MAP_CITIES, lat, lng, maxKm)
}

export function cityBySlugIn(list: readonly MapCity[], slug: string): MapCity | null {
  return list.find((c) => c.slug === slug) ?? null
}

export function cityBySlug(slug: string): MapCity | null {
  return cityBySlugIn(MAP_CITIES, slug)
}

const CITY_ALIASES: Record<string, string> = {
  tiflis: 'tbilisi',
  batoum: 'batumi',
  koeln: 'cologne',
  köln: 'cologne',
  muenchen: 'munich',
  münchen: 'munich',
  nürnberg: 'nuremberg',
  'new york': 'new-york',
  'abu dhabi': 'abu-dhabi',
  abu_dhabi: 'abu-dhabi',
  'sao paulo': 'sao-paulo',
  rio: 'rio-de-janeiro',
  'rio de janeiro': 'rio-de-janeiro',
  'mexico city': 'mexico-city',
  'buenos aires': 'buenos-aires',
  'hong kong': 'hong-kong',
  'kuala lumpur': 'kuala-lumpur',
  'los angeles': 'los-angeles',
  'san francisco': 'san-francisco',
  'cape town': 'cape-town',
  'ho chi minh': 'ho-chi-minh-city',
  'ho chi minh city': 'ho-chi-minh-city',
  saigon: 'ho-chi-minh-city',
  kiev: 'kyiv',
  'tel aviv': 'tel-aviv',
  'kuwait city': 'kuwait-city',
  'panama city': 'panama-city',
}

function isoForMarket(market: MarketId): MapCityCc | null {
  if (market === 'global') return null
  if (market === 'ge') return 'GE'
  return MARKETS[market].countryCode
}

/** Saved-place allowlist for a market. `global` = any slug. */
export function slugsForMarket(market: MarketId): Set<string> | undefined {
  const iso = isoForMarket(market)
  if (!iso) return undefined
  const out = new Set<string>(['here'])
  for (const c of MAP_CITIES) {
    if (c.cc === iso) out.add(c.slug)
  }
  return out
}

/** Catalog city from IP/header/user string (en, slug, ka, a few aliases). */
export function cityByNameIn(list: readonly MapCity[], raw: string): MapCity | null {
  const q = raw.trim().toLowerCase()
  if (!q) return null
  const aliased = CITY_ALIASES[q]
  if (aliased) return cityBySlugIn(list, aliased)
  return (
    list.find(
      (c) => c.slug === q || c.en.toLowerCase() === q || c.ka.toLowerCase() === q,
    ) ?? null
  )
}

export function cityByName(raw: string): MapCity | null {
  return cityByNameIn(MAP_CITIES, raw)
}

/**
 * IP → place. Catalog snap when near a listed city; otherwise the IP pin itself
 * (Google/Airbnb "you're here"). (0,0) is unset, not Null Island.
 */
function placeFromIpIn(
  list: readonly MapCity[],
  lat: number,
  lng: number,
  cityName?: string | null,
): MapCity | null {
  let name = cityName?.trim() ?? ''
  if (name) {
    try {
      name = decodeURIComponent(name)
    } catch {
      /* keep raw */
    }
  }
  const named = name ? cityByNameIn(list, name) : null
  const here = parseCoords(lat, lng)
  if (here) {
    const near = nearestIn(list, here.lat, here.lng, SNAP_MAX_KM)
    if (near) return { ...near, lat: here.lat, lng: here.lng }
    const label = name || named?.en || 'here'
    return {
      slug: named?.slug ?? 'here',
      ka: named?.ka ?? label,
      en: label,
      lat: here.lat,
      lng: here.lng,
      cc: named?.cc ?? 'GE',
    }
  }
  return named
}

export function placeFromIp(lat: number, lng: number, cityName?: string | null): MapCity | null {
  return placeFromIpIn(MAP_CITIES, lat, lng, cityName)
}

export { placeFromIpIn }

export type SavedPlace = { slug: string; lat: number; lng: number }

export function readSavedPlace(): SavedPlace | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PLACE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as SavedPlace
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || typeof p.slug !== 'string') {
      return null
    }
    return p
  } catch {
    return null
  }
}

export function writeSavedPlace(place: SavedPlace): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place))
  } catch {
    /* private mode */
  }
}

export function readIpDismiss(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(IP_DISMISS_KEY)
  } catch {
    return null
  }
}

export function writeIpDismiss(slug: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(IP_DISMISS_KEY, slug)
  } catch {
    /* private mode */
  }
}

/** Map boot center: last in-market place → fallback → Tbilisi. */
export function initialMapCenter(
  fallback?: { lat: number; lng: number },
  allow?: ReadonlySet<string>,
): { lat: number; lng: number } {
  const saved = readSavedPlace()
  if (saved && (!allow || allow.has(saved.slug))) return saved
  return fallback ?? MAP_CENTER
}
