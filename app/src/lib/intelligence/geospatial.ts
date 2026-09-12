import { db } from "@/lib/db";

export interface NearbyPlace {
  name: string;
  kind: string;
  distanceM: number;
  lat: number;
  lng: number;
}

export async function findNearby(
  lat: number,
  lng: number,
  radiusM = 1000,
  kinds?: string[],
): Promise<NearbyPlace[]> {
  const point = `POINT(${lng} ${lat})`;

  const results = await db.$queryRawUnsafe<Array<{
    name: string;
    kind: string;
    distance_m: number;
    lat: number;
    lng: number;
  }>>(`
    SELECT
      name,
      kind,
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_GeomFromText('${point}'), 4326)::geography
      ) AS distance_m,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng
    FROM pois
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_GeomFromText('${point}'), 4326)::geography,
      ${radiusM}
    )
    ${kinds && kinds.length > 0 ? `AND kind IN (${kinds.map((k) => `'${k}'`).join(",")})` : ""}
    ORDER BY distance_m ASC
    LIMIT 50
  `);

  return results.map((r) => ({
    name: r.name,
    kind: r.kind,
    distanceM: Math.round(r.distance_m),
    lat: r.lat,
    lng: r.lng,
  }));
}

export async function calculateNearbyIntelligence(lat: number, lng: number) {
  const [schools, hospitals, parks, shopping, transit, restaurants] = await Promise.all([
    findNearby(lat, lng, 1500, ["school", "university", "kindergarten"]),
    findNearby(lat, lng, 2000, ["hospital", "clinic", "pharmacy"]),
    findNearby(lat, lng, 1000, ["park", "garden"]),
    findNearby(lat, lng, 1500, ["shop", "supermarket", "mall"]),
    findNearby(lat, lng, 800, ["metro", "bus_stop", "train"]),
    findNearby(lat, lng, 1000, ["restaurant", "cafe"]),
  ]);

  const nearestSchool = schools[0];
  const nearestHospital = hospitals[0];
  const nearestPark = parks[0];
  const nearestMetro = transit.find((t) => t.kind === "metro");
  const nearestShop = shopping[0];

  const transitScore = Math.max(0, 100 - (nearestMetro?.distanceM ?? 2000) / 20);
  const amenityScore = Math.min(100, (schools.length + hospitals.length + shopping.length) * 5);
  const greenScore = Math.max(0, 100 - (nearestPark?.distanceM ?? 1000) / 10);

  return {
    nearby: { schools, hospitals, parks, shopping, transit, restaurants },
    nearest: {
      school: nearestSchool,
      hospital: nearestHospital,
      park: nearestPark,
      metro: nearestMetro,
      shop: nearestShop,
    },
    scores: {
      transit: Math.round(transitScore),
      amenities: Math.round(amenityScore),
      green: Math.round(greenScore),
      overall: Math.round((transitScore + amenityScore + greenScore) / 3),
    },
  };
}

export function normalizeAddress(address: string, _language = "en"): string {
  return address
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\u10A0-\u10FF\u0400-\u04FF]/g, "")
    .trim();
}

export function canonicalDistrictName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^\w\s\u10A0-\u10FF]/g, "")
    .trim();

  const districtMap: Record<string, string> = {
    "ვაკე": "Vake",
    "vake": "Vake",
    "ვაკეში": "Vake",
    "საბურთალო": "Saburtalo",
    "saburtalo": "Saburtalo",
    "დიდუბე": "Didube",
    "didube": "Didube",
    "ჩუღურეთი": "Chughureti",
    "chughureti": "Chughureti",
    "ისანი": "Isani",
    "isani": "Isani",
    "სამგორი": "Samgori",
    "samgori": "Samgori",
    "კრწანისი": "Krtsanisi",
    "krtsanisi": "Krtsanisi",
    "მთაწმინდა": "Mtatsminda",
    "mtatsminda": "Mtatsminda",
    "მთაწმინდის": "Mtatsminda",
    "ორთაჭალა": "Ortachala",
    "ortachala": "Ortachala",
    "ლესელიძე": "Leselidze",
    "leselidze": "Leselidze",
  };

  return districtMap[normalized] || name;
}
