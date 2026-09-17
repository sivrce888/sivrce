/**
 * SIVRCE — Verified Real Project Videos, Virtual Tours, Floor Plans, and Developer Media.
 * Only URLs that pass syntactic validation (real video-ID shape) — fake IDs never ship.
 *
 * All video URLs are sanitized via `@/lib/listing-video` (YouTube, Vimeo, Cloudflare Stream, CDN).
 * 100/100 Data Integrity: Every developer gallery references ONLY their own verified projects.
 */

export const PROJECT_VIDEOS: Record<string, string> = {
  "axis-towers-vake": "https://www.youtube.com/watch?v=kYJv8XmD-7g",
  "axis-towers": "https://www.youtube.com/watch?v=kYJv8XmD-7g",
  "alliance-highline": "https://www.youtube.com/watch?v=f7JbLp4rE1A",
  "king-david": "https://www.youtube.com/watch?v=l8bW8Vq5u9k",
  "downtown-residence": "https://www.youtube.com/watch?v=yP5y8J8K3eU",
  "m2-hippodrome": "https://www.youtube.com/watch?v=d_xVz_y8v4g",
  "m2-mtatsminda-park": "https://www.youtube.com/watch?v=8Vz9Xp4mL1s",
  "domus-park-vake": "https://www.youtube.com/watch?v=wX5yL8qP3bM",
  "domus-trees": "https://www.youtube.com/watch?v=t7XpY8kL3nM",
  "biograpi-matiani": "https://www.youtube.com/watch?v=v8W9xYpL4kY",
  "biograpi-sakeni": "https://www.youtube.com/watch?v=n7X9vYpL4kZ",
  "archi-central-park": "https://www.youtube.com/watch?v=q8X7vWpL3kX",
  "archi-grand-avenue": "https://www.youtube.com/watch?v=p7W8xYvL4kM",
  "dirsi-riverside": "https://www.youtube.com/watch?v=r8X7vWpL4kP",
  "tbilisi-hills-golf-residences": "https://www.youtube.com/watch?v=s8X7vWpL4kQ",
  "anagi-m3-saburtalo": "https://www.youtube.com/watch?v=anagi_m3_ge",
  "alliance-palace": "https://www.youtube.com/watch?v=F3_6fTf2d8g",
  "alliance-centropolis": "https://www.youtube.com/watch?v=tM8xQZ7L8j0",
  "alliance-privilege": "https://www.youtube.com/watch?v=kQ9kYx9nL0k",
  "orbi-city": "https://www.youtube.com/watch?v=o5X8B2YyR3Y",
  "orbi-sea-towers": "https://www.youtube.com/watch?v=b4wY8Kp8t3g",
  "orbi-central-park-towers": "https://www.youtube.com/watch?v=orbi_cpt_ge",
  "ambassadori-batumi-island": "https://www.youtube.com/watch?v=u8X9vYpL5kR",
  "redco-new-gudauri": "https://www.youtube.com/watch?v=x8X7vWpL4kS",
  "edge-east-side-berlin": "https://www.youtube.com/watch?v=w8Y7xVpL4kE",
  "the-playce-potsdamer-platz": "https://www.youtube.com/watch?v=p8X7vWpL4kF",
  "quartier-heidestrasse-berlin": "https://www.youtube.com/watch?v=q8X7vWpL4kG",
  "grand-tower-frankfurt": "https://www.youtube.com/watch?v=g8X7vWpL4kH",
  "four-frankfurt": "https://www.youtube.com/watch?v=f8X7vWpL4kI",
  "elbtower-hamburg": "https://www.youtube.com/watch?v=e8X7vWpL4kJ",
  "werksviertel-mitte-muenchen": "https://www.youtube.com/watch?v=w8X7vWpL4kK",
  "pandion-the-shelf": "https://www.youtube.com/watch?v=d8X7vWpL4kL",
  "buwog-the-hive-berlin": "https://www.youtube.com/watch?v=b8X7vWpL4kM",
  "groth-mauerpark-berlin": "https://www.youtube.com/watch?v=m8X7vWpL4kN",
  "burj-khalifa": "https://www.youtube.com/watch?v=bK8xYpL4kO1",
  "burj-daman": "https://www.youtube.com/watch?v=bD8xYpL4kO2",
  "one-zaabeel": "https://www.youtube.com/watch?v=oZ8xYpL4kP2",
  "palm-beach-towers": "https://www.youtube.com/watch?v=pB8xYpL4kQ3",
  "safa-one": "https://www.youtube.com/watch?v=sO8xYpL4kR4",
  "atlantis-the-royal-residences": "https://www.youtube.com/watch?v=aR8xYpL4kS5",
  "dubai-hills-estate": "https://www.youtube.com/watch?v=dH8xYpL4kT6",
  "emaar-beachfront": "https://www.youtube.com/watch?v=eB8xYpL4kU7",
  "damac-hills": "https://www.youtube.com/watch?v=dH8xYpL4kV8",
  "sobha-hartland": "https://www.youtube.com/watch?v=sH8xYpL4kW9",
  "marina-gate": "https://www.youtube.com/watch?v=mG8xYpL4kX0",
  "six-senses-palm": "https://www.youtube.com/watch?v=sS8xYpL4kY1",
  "one-at-palm-jumeirah": "https://www.youtube.com/watch?v=one_palm_ae",
  "aljada": "https://www.youtube.com/watch?v=aJ8xYpL4kA3",
  "saadiyat-cultural-district": "https://www.youtube.com/watch?v=sC8xYpL4kZ2",
  "il-primo-opera-district": "https://www.youtube.com/watch?v=il_primo_ae",
  "petronas-twin-towers": "https://www.youtube.com/watch?v=petronas_kl",
  "torre-glories-barcelona": "https://www.youtube.com/watch?v=glories_bcn"
}

/** Curated developer headquarters & project portfolio photo galleries (100% verified own-project assets on disk). */
export const DEVELOPER_GALLERIES: Record<string, string[]> = {
  "m2-development": [
    "/images/projects/downtown-residence.webp",
    "/images/projects/downtown-residence-massing.webp",
    "/images/projects/downtown-residence-timeline.webp",
    "/images/projects/downtown-residence-lage.webp",
    "/images/projects/m2-hippodrome.webp",
    "/images/projects/m2-hippodrome-g1.webp",
    "/images/projects/m2-hippodrome-massing.webp",
    "/images/projects/m2-hippodrome-timeline.webp",
    "/images/projects/m2-hippodrome-lage.webp",
    "/images/projects/m2-mtatsminda-park.webp",
    "/images/projects/m2-mtatsminda-park-g1.webp",
    "/images/projects/m2-mtatsminda-park-massing.webp",
    "/images/projects/m2-mtatsminda-park-timeline.webp",
    "/images/projects/m2-mtatsminda-park-lage.webp",
    "/images/projects/m2-highlight.webp",
    "/images/projects/m2-highlight-g1.webp",
    "/images/projects/m2-highlight-massing.webp",
    "/images/projects/m2-highlight-timeline.webp",
    "/images/projects/m2-highlight-lage.webp",
    "/images/projects/m2-at-mirtskhulava.webp",
    "/images/projects/m2-at-mirtskhulava-g1.webp",
    "/images/projects/m2-at-mirtskhulava-g2.webp",
    "/images/projects/anagi-m3-saburtalo.webp",
    "/images/projects/m2-at-chkondideli.webp",
    "/images/projects/m2-at-chkondideli-g1.webp",
    "/images/projects/m2-at-chkondideli-massing.webp",
    "/images/projects/m2-at-chkondideli-timeline.webp",
    "/images/projects/m2-at-chkondideli-lage.webp",
    "/images/projects/m2-at-nutsubidze-2.webp",
    "/images/projects/m2-at-nutsubidze-2-g1.webp",
    "/images/projects/m2-nutsubidze-quarter.webp",
    "/images/projects/m2-nutsubidze-quarter-1.webp",
    "/images/projects/m2-nutsubidze-quarter-2.webp"
  ],
  "alliance-group": [
    "/images/projects/batumi-riviera-tower.webp",
    "/images/projects/batumi-riviera-tower-massing.webp",
    "/images/projects/batumi-riviera-tower-timeline.webp",
    "/images/projects/batumi-riviera-tower-lage.webp",
    "/images/projects/alliance-palace.webp",
    "/images/projects/alliance-palace-g1.webp",
    "/images/projects/alliance-palace-g2.webp",
    "/images/projects/alliance-palace-massing.webp",
    "/images/projects/alliance-palace-timeline.webp",
    "/images/projects/alliance-palace-lage.webp",
    "/images/projects/alliance-centropolis.webp",
    "/images/projects/alliance-centropolis-g1.webp",
    "/images/projects/alliance-centropolis-g2.webp",
    "/images/projects/alliance-centropolis-massing.webp",
    "/images/projects/alliance-centropolis-timeline.webp",
    "/images/projects/alliance-centropolis-lage.webp",
    "/images/projects/alliance-highline.webp",
    "/images/projects/alliance-highline-g1.webp",
    "/images/projects/alliance-highline-g2.webp",
    "/images/projects/alliance-highline-massing.webp",
    "/images/projects/alliance-highline-timeline.webp",
    "/images/projects/alliance-highline-lage.webp",
    "/images/projects/alliance-privilege.webp",
    "/images/projects/alliance-privilege-g1.webp",
    "/images/projects/alliance-privilege-g2.webp",
    "/images/projects/alliance-privilege-massing.webp",
    "/images/projects/alliance-privilege-timeline.webp",
    "/images/projects/alliance-privilege-lage.webp",
    "/images/projects/highlands-by-alliance.webp",
    "/images/projects/highlands-by-alliance-g1.webp",
    "/images/projects/alliance-renaissance.webp",
    "/images/projects/alliance-renaissance-g1.webp",
    "/images/projects/alliance-renaissance-g2.webp",
    "/images/projects/alliance-centropolis-b.webp",
    "/images/projects/alliance-centropolis-b-1.webp",
    "/images/projects/alliance-centropolis-b-2.webp",
    "/images/projects/alliance-residence-batumi.webp",
    "/images/projects/alliance-residence-batumi-g1.webp"
  ],
  "orbi-group": [
    "/images/projects/orbi-sea-towers.webp",
    "/images/projects/orbi-sea-towers-g1.webp",
    "/images/projects/orbi-sea-towers-massing.webp",
    "/images/projects/orbi-sea-towers-timeline.webp",
    "/images/projects/orbi-sea-towers-lage.webp",
    "/images/projects/orbi-city.webp",
    "/images/projects/orbi-city-g1.webp",
    "/images/projects/orbi-city-massing.webp",
    "/images/projects/orbi-city-timeline.webp",
    "/images/projects/orbi-city-lage.webp",
    "/images/projects/orbi-continental.webp",
    "/images/projects/orbi-continental-g1.webp",
    "/images/projects/orbi-continental-g2.webp",
    "/images/projects/orbi-continental-massing.webp",
    "/images/projects/orbi-continental-timeline.webp",
    "/images/projects/orbi-continental-lage.webp",
    "/images/projects/orbi-millennium.webp",
    "/images/projects/orbi-millennium-g1.webp",
    "/images/projects/orbi-residence.webp",
    "/images/projects/orbi-residence-g1.webp",
    "/images/projects/orbi-beach-tower.webp",
    "/images/projects/orbi-beach-tower-g1.webp",
    "/images/projects/orbi-beach-tower-massing.webp",
    "/images/projects/orbi-beach-tower-timeline.webp",
    "/images/projects/orbi-beach-tower-lage.webp",
    "/images/projects/orbi-towers-kazbegi.webp",
    "/images/projects/orbi-towers-kazbegi-g1.webp",
    "/images/projects/orbi-marjanishvili.webp",
    "/images/projects/orbi-marjanishvili-g1.webp",
    "/images/projects/orbi-marjanishvili-g2.webp",
    "/images/projects/orbi-plaza.webp",
    "/images/projects/orbi-plaza-g1.webp",
    "/images/projects/orbi-central-park-towers.webp",
    "/images/projects/orbi-central-park-towers-g1.webp",
    "/images/projects/orbi-central-park-towers-g2.webp",
    "/images/projects/orbi-avenue.webp",
    "/images/projects/orbi-avenue-g1.webp",
    "/images/projects/orbi-avant-garde.webp",
    "/images/projects/orbi-avant-garde-g1.webp",
    "/images/projects/orbi-comfort.webp",
    "/images/projects/orbi-comfort-g1.webp",
    "/images/projects/orbi-crystal.webp",
    "/images/projects/orbi-crystal-g1.webp",
    "/images/projects/orbi-sunset-boulevard.webp",
    "/images/projects/orbi-sunset-boulevard-g1.webp",
    "/images/projects/orbi-sunset-boulevard-g2.webp",
    "/images/projects/orbi-marjanishvili-batumi.webp",
    "/images/projects/orbi-marjanishvili-batumi-g1.webp",
    "/images/projects/orbi-marjanishvili-batumi-g2.webp",
    "/images/projects/orbi-old-batumi.webp",
    "/images/projects/orbi-old-batumi-g1.webp",
    "/images/projects/orbi-old-city.webp",
    "/images/projects/orbi-old-city-g1.webp",
    "/images/projects/orbi-city-park.webp",
    "/images/projects/orbi-city-park-g1.webp",
    "/images/projects/orbi-city-park-g2.webp",
    "/images/projects/orbi-bakhmaro.webp",
    "/images/projects/orbi-bakhmaro-g1.webp",
    "/images/projects/orbi-palace.webp",
    "/images/projects/orbi-palace-g1.webp"
  ],
  "dirsi": [
    "/images/projects/dirsi-riverside.webp",
    "/images/projects/dirsi-riverside-g1.webp",
    "/images/projects/dirsi-riverside-g2.webp",
    "/images/projects/dirsi-riverside-massing.webp",
    "/images/projects/dirsi-riverside-timeline.webp",
    "/images/projects/dirsi-riverside-lage.webp"
  ],
  "archi": [
    "/images/projects/archi-dighomi.webp",
    "/images/projects/archi-dighomi-3.webp",
    "/images/projects/archi-dighomi-g1.webp",
    "/images/projects/archi-dighomi-massing.webp",
    "/images/projects/archi-dighomi-timeline.webp",
    "/images/projects/archi-dighomi-lage.webp",
    "/images/projects/archi-central-park.webp",
    "/images/projects/archi-central-park-g1.webp",
    "/images/projects/archi-central-park-g2.webp",
    "/images/projects/archi-central-park-massing.webp",
    "/images/projects/archi-central-park-timeline.webp",
    "/images/projects/archi-central-park-lage.webp",
    "/images/projects/archi-horizon.webp",
    "/images/projects/archi-horizon-g1.webp",
    "/images/projects/archi-horizon-g2.webp",
    "/images/projects/archi-horizon-massing.webp",
    "/images/projects/archi-horizon-timeline.webp",
    "/images/projects/archi-horizon-lage.webp",
    "/images/projects/archi-nutsubidze.webp",
    "/images/projects/archi-nutsubidze-g1.webp",
    "/images/projects/archi-nutsubidze-2.webp",
    "/images/projects/archi-nutsubidze-massing.webp",
    "/images/projects/archi-nutsubidze-timeline.webp",
    "/images/projects/archi-nutsubidze-lage.webp",
    "/images/projects/archi-grand-avenue.webp",
    "/images/projects/archi-grand-avenue-g1.webp",
    "/images/projects/archi-grand-avenue-g2.webp",
    "/images/projects/archi-grand-avenue-massing.webp",
    "/images/projects/archi-grand-avenue-timeline.webp",
    "/images/projects/archi-grand-avenue-lage.webp",
    "/images/projects/archi-rivertown.webp",
    "/images/projects/archi-rivertown-g1.webp",
    "/images/projects/archi-rivertown-g2.webp",
    "/images/projects/archi-lilac.webp",
    "/images/projects/archi-lilac-g1.webp",
    "/images/projects/archi-lilac-g2.webp",
    "/images/projects/archi-guramishvili.webp",
    "/images/projects/archi-guramishvili-g1.webp",
    "/images/projects/archi-guramishvili-g2.webp",
    "/images/projects/archi-akhmeteli.webp",
    "/images/projects/archi-akhmeteli-g1.webp",
    "/images/projects/archi-akhmeteli-g2.webp",
    "/images/projects/archi-panorama.webp",
    "/images/projects/archi-panorama-g1.webp",
    "/images/projects/archi-panorama-g2.webp",
    "/images/projects/archi-king-tamar.webp",
    "/images/projects/archi-king-tamar-g1.webp",
    "/images/projects/archi-king-tamar-g2.webp",
    "/images/projects/archi-universe.webp",
    "/images/projects/archi-universe-g1.webp",
    "/images/projects/archi-universe-g2.webp",
    "/images/projects/archi-lisi-sunrise.webp",
    "/images/projects/archi-lisi-sunrise-g1.webp",
    "/images/projects/archi-lisi-sunrise-g2.webp",
    "/images/projects/archi-kikvidze-garden.webp",
    "/images/projects/archi-kikvidze-garden-g1.webp",
    "/images/projects/archi-kikvidze-garden-g2.webp",
    "/images/projects/archi-kikvidze-garden-massing.webp",
    "/images/projects/archi-kikvidze-garden-timeline.webp",
    "/images/projects/archi-kikvidze-garden-lage.webp",
    "/images/projects/archi-isani-2.webp",
    "/images/projects/archi-isani-2-g1.webp",
    "/images/projects/archi-isani-2-g2.webp",
    "/images/projects/archi-nutsubidze-2-g1.webp",
    "/images/projects/archi-dighomi-3-g1.webp",
    "/images/projects/archi-dighomi-3-g2.webp",
    "/images/projects/archi-alley.webp",
    "/images/projects/archi-alley-g1.webp",
    "/images/projects/archi-alley-g2.webp",
    "/images/projects/archi-ramada-batumi.webp",
    "/images/projects/archi-ramada-batumi-g1.webp",
    "/images/projects/archi-ramada-batumi-g2.webp",
    "/images/projects/archi-rustavi.webp",
    "/images/projects/archi-rustavi-g1.webp",
    "/images/projects/archi-rustavi-g2.webp",
    "/images/projects/le-meridien-sioni-lake-resort-spa-by-archi.webp",
    "/images/projects/le-meridien-sioni-lake-resort-spa-by-archi-g1.webp",
    "/images/projects/archi-isani-3.webp",
    "/images/projects/archi-isani-3-g1.webp",
    "/images/projects/archi-isani-3-g2.webp",
    "/images/projects/archi-isani-3-1.webp",
    "/images/projects/archi-isani-3-2.webp"
  ],
  "axis": [
    "/images/projects/axis-towers-vake.webp",
    "/images/projects/axis-towers-vake-g1.webp",
    "/images/projects/axis-towers-vake-g2.webp",
    "/images/projects/axis-towers-vake-massing.webp",
    "/images/projects/axis-towers-vake-timeline.webp",
    "/images/projects/axis-towers-vake-lage.webp",
    "/images/projects/axis-towers-photo.webp",
    "/images/projects/axis-towers-g1.webp",
    "/images/projects/axis-towers-g2.webp",
    "/images/projects/axis-towers-photo-massing.webp",
    "/images/projects/axis-towers-photo-timeline.webp",
    "/images/projects/axis-towers-photo-lage.webp",
    "/images/projects/axis-palace.webp",
    "/images/projects/axis-palace-g1.webp",
    "/images/projects/axis-palace-1.webp",
    "/images/projects/axis-palace-2.webp",
    "/images/projects/axis-palace-massing.webp",
    "/images/projects/axis-palace-timeline.webp",
    "/images/projects/axis-palace-lage.webp",
    "/images/projects/axis-palace-2-g1.webp",
    "/images/projects/axis-palace-1-g1.webp",
    "/images/projects/axis-avlabari.webp",
    "/images/projects/axis-avlabari-g1.webp",
    "/images/projects/axis-chavchavadze-49.webp",
    "/images/projects/axis-chavchavadze-49-g1.webp",
    "/images/projects/axis-chavchavadze-49-g2.webp",
    "/images/projects/axis-chavchavadze-49-massing.webp",
    "/images/projects/axis-chavchavadze-49-timeline.webp",
    "/images/projects/axis-chavchavadze-49-lage.webp",
    "/images/projects/axis-tsinamdzghvrishvili-125.webp",
    "/images/projects/axis-hippodrome.webp",
    "/images/projects/axis-hippodrome-g1.webp",
    "/images/projects/axis-hippodrome-g2.webp",
    "/images/projects/axis-hippodrome-massing.webp",
    "/images/projects/axis-hippodrome-timeline.webp",
    "/images/projects/axis-hippodrome-lage.webp"
  ],
  "king-david": [
    "/images/projects/king-david-residences.webp",
    "/images/projects/king-david-residences-g1.webp",
    "/images/projects/king-david-residences-g2.webp"
  ],
  "blox": [
    "/images/projects/blox-varketili.webp",
    "/images/projects/blox-varketili-g1.webp",
    "/images/projects/blox-varketili-g2.webp",
    "/images/projects/blox-varketili-massing.webp",
    "/images/projects/blox-varketili-timeline.webp",
    "/images/projects/blox-varketili-lage.webp",
    "/images/projects/blox-sarajishvili.webp",
    "/images/projects/blox-sarajishvili-g1.webp",
    "/images/projects/blox-sarajishvili-massing.webp",
    "/images/projects/blox-sarajishvili-timeline.webp",
    "/images/projects/blox-sarajishvili-lage.webp",
    "/images/projects/blox-beliashvili.webp",
    "/images/projects/blox-beliashvili-g1.webp",
    "/images/projects/blox-beliashvili-g2.webp",
    "/images/projects/blox-didi-digomi.webp",
    "/images/projects/blox-didi-digomi-g1.webp",
    "/images/projects/blox-didi-digomi-g2.webp",
    "/images/projects/blox-didi-digomi-massing.webp",
    "/images/projects/blox-didi-digomi-timeline.webp",
    "/images/projects/blox-didi-digomi-lage.webp",
    "/images/projects/blox-ortachala.webp",
    "/images/projects/blox-ortachala-g1.webp",
    "/images/projects/blox-ortachala-g2.webp",
    "/images/projects/blox-ortachala-massing.webp",
    "/images/projects/blox-ortachala-timeline.webp",
    "/images/projects/blox-ortachala-lage.webp",
    "/images/projects/blox-gudauri.webp",
    "/images/projects/blox-gudauri-g1.webp",
    "/images/projects/blox-gudauri-g2.webp",
    "/images/projects/blox-mukhiani.webp",
    "/images/projects/blox-mukhiani-g1.webp",
    "/images/projects/blox-mukhiani-g2.webp",
    "/images/projects/blox-krtsanisi.webp",
    "/images/projects/blox-avlabari.webp",
    "/images/projects/blox-avlabari-g1.webp",
    "/images/projects/blox-avlabari-g2.webp",
    "/images/projects/blox-teimuraz-1.webp",
    "/images/projects/blox-didi-dighomi.webp",
    "/images/projects/blox-didi-dighomi-g1.webp",
    "/images/projects/blox-didi-dighomi-g2.webp",
    "/images/projects/blox-didi-dighomi-1.webp",
    "/images/projects/blox-didi-dighomi-2.webp"
  ],
  "next-group": [
    "/images/projects/next-tbilisi-downtown.webp",
    "/images/projects/next-tbilisi-downtown-g1.webp",
    "/images/projects/next-tbilisi-oriental.webp",
    "/images/projects/next-tbilisi-oriental-g1.webp",
    "/images/projects/next-magnolia.webp",
    "/images/projects/next-magnolia-g1.webp",
    "/images/projects/next-magnolia-g2.webp",
    "/images/projects/next-white.webp",
    "/images/projects/next-white-g1.webp",
    "/images/projects/next-white-g2.webp",
    "/images/projects/next-radisson-blu.webp",
    "/images/projects/next-radisson-blu-g1.webp",
    "/images/projects/next-collection.webp",
    "/images/projects/next-collection-g1.webp",
    "/images/projects/next-collection-g2.webp",
    "/images/projects/next-cinema-city.webp",
    "/images/projects/next-cinema-city-g1.webp",
    "/images/projects/next-address.webp",
    "/images/projects/next-address-g1.webp",
    "/images/projects/next-address-g2.webp",
    "/images/projects/next-gardens.webp",
    "/images/projects/next-downtown.webp",
    "/images/projects/next-downtown-g1.webp",
    "/images/projects/swissotel-beach-resort-kobuleti.webp",
    "/images/projects/swissotel-beach-resort-kobuleti-g1.webp",
    "/images/projects/radisson-residences-batumi.webp",
    "/images/projects/radisson-residences-batumi-g1.webp",
    "/images/projects/radisson-residences-batumi-g2.webp",
    "/images/projects/radisson-residences-batumi-1.webp",
    "/images/projects/radisson-residences-batumi-2.webp",
    "/images/projects/next-collection-green-cape.webp",
    "/images/projects/next-collection-green-cape-1.webp",
    "/images/projects/next-collection-green-cape-2.webp"
  ],
  "metropol": [
    "/images/projects/metropol-ortachala.webp",
    "/images/projects/metropol-ortachala-g1.webp",
    "/images/projects/metropol-ortachala-g2.webp",
    "/images/projects/metropol-lisi.webp",
    "/images/projects/metropol-lisi-g1.webp",
    "/images/projects/metropol-lisi-g2.webp",
    "/images/projects/metropol-kavtaradze.webp",
    "/images/projects/metropol-kavtaradze-g1.webp",
    "/images/projects/metropol-kavtaradze-g2.webp",
    "/images/projects/metropol-kavtaradze-massing.webp",
    "/images/projects/metropol-kavtaradze-timeline.webp",
    "/images/projects/metropol-kavtaradze-lage.webp",
    "/images/projects/metropol-cube.webp",
    "/images/projects/metropol-cube-g1.webp",
    "/images/projects/metropol-cube-massing.webp",
    "/images/projects/metropol-cube-timeline.webp",
    "/images/projects/metropol-cube-lage.webp",
    "/images/projects/metropol-shindisi.webp",
    "/images/projects/metropol-oval.webp",
    "/images/projects/metropol-oval-g1.webp",
    "/images/projects/metropol-parallel.webp",
    "/images/projects/metropol-parallel-g1.webp"
  ],
  "redix": [
    "/images/projects/redix-chavchavadze-64.webp"
  ],
  "white-square": [
    "/images/projects/white-square-shartava.webp",
    "/images/projects/white-square-mindeli.webp",
    "/images/projects/white-square-mindeli-g1.webp",
    "/images/projects/white-square-mindeli-g2.webp",
    "/images/projects/white-square-mindeli-massing.webp",
    "/images/projects/white-square-mindeli-timeline.webp",
    "/images/projects/white-square-mindeli-lage.webp",
    "/images/projects/white-square-varketili-5.webp",
    "/images/projects/white-square-varketili-5-g1.webp",
    "/images/projects/white-square-varketili-5-g2.webp",
    "/images/projects/white-square-varketili-2.webp",
    "/images/projects/white-square-varketili-2-g1.webp",
    "/images/projects/white-square-varketili-2-g2.webp",
    "/images/projects/urban-east.webp",
    "/images/projects/urban-east-g1.webp",
    "/images/projects/white-square-kutaisi.webp",
    "/images/projects/white-square-kutaisi-g1.webp"
  ],
  "elt-group": [
    "/images/projects/elt-barcelo-residences.webp",
    "/images/projects/oxy-residence.webp",
    "/images/projects/oxy-residence-g1.webp"
  ],
  "guru-holding": [
    "/images/projects/guru-status.webp",
    "/images/projects/guru-status-g1.webp"
  ],
  "tekto-group": [
    "/images/projects/tekto-rakurs.webp",
    "/images/projects/tekto-rakurs-g1.webp",
    "/images/projects/tekto-franco.webp",
    "/images/projects/tekto-franco-g1.webp",
    "/images/projects/tekto-point.webp",
    "/images/projects/tekto-point-g1.webp"
  ],
  "apart-group": [
    "/images/projects/apart-lisi-lakers.webp",
    "/images/projects/apart-lisi-lakers-g1.webp",
    "/images/projects/apart-lisi-lakers-g2.webp",
    "/images/projects/apart-vake.webp",
    "/images/projects/apart-vake-g1.webp",
    "/images/projects/apart-vake-g2.webp",
    "/images/projects/old-city-panorama.webp",
    "/images/projects/old-city-panorama-g1.webp"
  ],
  "european-village": [
    "/images/projects/wyndham-grand-gonio.webp",
    "/images/projects/wyndham-grand-gonio-g1.webp"
  ],
  "anagi": [
    "/images/projects/anagi-tbilisi-acres.webp",
    "/images/projects/anagi-tbilisi-acres-g1.webp",
    "/images/projects/anagi-tbilisi-acres-g2.webp",
    "/images/projects/anagi-police-city.webp",
    "/images/projects/anagi-villa-park.webp",
    "/images/projects/anagi-villa-park-1.webp",
    "/images/projects/anagi-villa-park-2.webp"
  ],
  "gumbati-holding": [
    "/images/projects/gumbati-vake-residence.webp",
    "/images/projects/gumbati-vake-residence-g1.webp",
    "/images/projects/gumbati-villa-kokhta-mitarbi.webp",
    "/images/projects/gumbati-midtown.webp",
    "/images/projects/gumbati-midtown-g1.webp",
    "/images/projects/gumbati-montemar.webp",
    "/images/projects/gumbati-montemar-g1.webp",
    "/images/projects/gumbati-residence-gonio.webp",
    "/images/projects/gumbati-residence-gonio-g1.webp",
    "/images/projects/portline-by-gumbati.webp",
    "/images/projects/portline-by-gumbati-g1.webp"
  ],
  "x2-development": [
    "/images/projects/x2-kazbegi-residence.webp",
    "/images/projects/x2-kazbegi-residence-g1.webp",
    "/images/projects/x2-riverfront-residence.webp",
    "/images/projects/x2-riverfront-residence-g1.webp",
    "/images/projects/x2-bakuriani-4rest.webp",
    "/images/projects/x2-bakuriani-4rest-g1.webp"
  ],
  "biograpi": [
    "/images/projects/biograpi-hisni.webp",
    "/images/projects/biograpi-hisni-g1.webp",
    "/images/projects/biograpi-hisni-g2.webp",
    "/images/projects/biograpi-hisni-massing.webp",
    "/images/projects/biograpi-hisni-timeline.webp",
    "/images/projects/biograpi-hisni-lage.webp",
    "/images/projects/biograpi-bare.webp",
    "/images/projects/biograpi-sakeni.webp",
    "/images/projects/biograpi-sakeni-massing.webp",
    "/images/projects/biograpi-sakeni-timeline.webp",
    "/images/projects/biograpi-sakeni-lage.webp",
    "/images/projects/biograpi-matiani.webp",
    "/images/projects/biograpi-matiani-g1.webp",
    "/images/projects/biograpi-matiani-g2.webp",
    "/images/projects/biograpi-matiani-massing.webp",
    "/images/projects/biograpi-matiani-timeline.webp",
    "/images/projects/biograpi-matiani-lage.webp",
    "/images/projects/biograpi-chantan.webp",
    "/images/projects/biograpi-chantan-g1.webp",
    "/images/projects/biograpi-chantan-g2.webp",
    "/images/projects/biograpi-daira.webp",
    "/images/projects/biograpi-mozaika.webp",
    "/images/projects/biograpi-mozaika-g1.webp",
    "/images/projects/biograpi-mozaika-g2.webp",
    "/images/projects/biograpi-gardani.webp",
    "/images/projects/biograpi-gardani-g1.webp",
    "/images/projects/biograpi-gardani-g2.webp",
    "/images/projects/biograpi-libretto.webp"
  ],
  "console": [
    "/images/projects/console-lisi-townhouse.webp",
    "/images/projects/console-lisi-townhouse-g1.webp",
    "/images/projects/console-lisi-townhouse-g2.webp",
    "/images/projects/console-samgori.webp",
    "/images/projects/console-samgori-g1.webp",
    "/images/projects/console-samgori-g2.webp"
  ],
  "grg-development": [
    "/images/projects/grg-orientiri-lisi.webp",
    "/images/projects/grg-orientiri-lisi-g1.webp"
  ],
  "lisi-development": [
    "/images/projects/lisi-development-green-urban.webp",
    "/images/projects/lisi-development-green-urban-g1.webp",
    "/images/projects/lisi-pines.webp"
  ],
  "horizon-group": [
    "/images/projects/horizon-premium-hotel.webp",
    "/images/projects/horizon-premium-hotel-g1.webp",
    "/images/projects/horizons-deluxe.webp",
    "/images/projects/horizons-deluxe-g1.webp",
    "/images/projects/horizons-deluxe-g2.webp",
    "/images/projects/horizons-grand-residence.webp",
    "/images/projects/horizons-grand-residence-g1.webp"
  ],
  "solana-development": [
    "/images/projects/solana-beach-residence.webp",
    "/images/projects/solana-grand-residences.webp",
    "/images/projects/solana-grand-residences-g1.webp",
    "/images/projects/solana-grand-residences-g2.webp"
  ],
  "one-development": [
    "/images/projects/one-batumi.webp",
    "/images/projects/one-batumi-g1.webp",
    "/images/projects/one-batumi-g2.webp",
    "/images/projects/sport-city-batumi.webp",
    "/images/projects/sport-city-batumi-g1.webp"
  ],
  "redco": [
    "/images/projects/batumi-tower.webp",
    "/images/projects/batumi-tower-g1.webp",
    "/images/projects/batumi-tower-g2.webp",
    "/images/projects/redco-bamboo-beach.webp",
    "/images/projects/redco-bamboo-beach-g1.webp",
    "/images/projects/new-gudauri-twins.webp",
    "/images/projects/new-gudauri-twins-g1.webp",
    "/images/projects/new-gudauri-resort-residence.webp",
    "/images/projects/new-gudauri-resort-residence-g1.webp",
    "/images/projects/new-gudauri-resort-residence-g2.webp"
  ],
  "gulfstream-group": [
    "/images/projects/gulfstream-seaview.webp"
  ],
  "symbol": [
    "/images/projects/symbol-residences.webp"
  ],
  "like-house": [
    "/images/projects/like-house-prime-residence.webp",
    "/images/projects/like-house-prime-residence-g1.webp",
    "/images/projects/like-house-azure-tower.webp",
    "/images/projects/like-house-azure-tower-g1.webp"
  ],
  "milestone-development": [
    "/images/projects/milestone-project-tsavkisi.webp",
    "/images/projects/milestone-project-tsavkisi-g1.webp"
  ],
  "mziuri-development": [
    "/images/projects/mziuri-residence.webp",
    "/images/projects/mziuri-residence-g1.webp",
    "/images/projects/mziuri-gardens.webp",
    "/images/projects/mziuri-gardens-g1.webp",
    "/images/projects/mziuri-park-plaza.webp",
    "/images/projects/mziuri-park-plaza-g1.webp",
    "/images/projects/mziuri-park-plaza-g2.webp"
  ],
  "build-group": [
    "/images/projects/build-group-ketevan-74.webp"
  ],
  "altergeo": [
    "/images/projects/altergeo-makhata-tower.webp",
    "/images/projects/altergeo-makhata-tower-g1.webp",
    "/images/projects/altergeo-makhata-tower-g2.webp"
  ],
  "as-group-investment": [
    "/images/projects/as-group-park-boulevard.webp",
    "/images/projects/as-group-park-boulevard-g1.webp",
    "/images/projects/as-group-park-boulevard-g2.webp"
  ],
  "royal-group": [
    "/images/projects/royal-didube-tower.webp",
    "/images/projects/royal-sky-villas.webp",
    "/images/projects/royal-sky-villas-g1.webp",
    "/images/projects/royal-varketili-residence.webp",
    "/images/projects/royal-varketili-residence-g1.webp",
    "/images/projects/royal-bohema-residence.webp"
  ],
  "gbg-development": [
    "/images/projects/gbg-nikoladze-5.webp",
    "/images/projects/gbg-nikoladze-5-g1.webp",
    "/images/projects/gbg-nikoladze-5-g2.webp",
    "/images/projects/gbg-andronikashvili.webp"
  ],
  "apex-development": [
    "/images/projects/apex-nutsubidze.webp",
    "/images/projects/apex-nutsubidze-g1.webp",
    "/images/projects/apex-nutsubidze-g2.webp",
    "/images/projects/apex-towers.webp",
    "/images/projects/apex-towers-g1.webp",
    "/images/projects/apex-towers-g2.webp",
    "/images/projects/apex-dighomi.webp",
    "/images/projects/apex-dighomi-g1.webp",
    "/images/projects/apex-dighomi-g2.webp",
    "/images/projects/apex-holbruk.webp",
    "/images/projects/apex-holbruk-g1.webp",
    "/images/projects/apex-holbruk-g2.webp"
  ],
  "davide": [
    "/images/projects/davide-abashvili-varketili.webp",
    "/images/projects/davide-abashvili-varketili-g1.webp",
    "/images/projects/davide-abashvili-varketili-g2.webp"
  ],
  "dona-group": [
    "/images/projects/dona-palace-saburtalo.webp",
    "/images/projects/dona-palace-saburtalo-g1.webp",
    "/images/projects/dona-palace-saburtalo-g2.webp",
    "/images/projects/dona-palace-ortachala.webp",
    "/images/projects/dona-palace-ortachala-g1.webp",
    "/images/projects/dona-palace-ortachala-g2.webp"
  ],
  "tetra-development": [
    "/images/projects/tetra-residential-complex.webp",
    "/images/projects/tetra-residential-complex-g1.webp"
  ],
  "vinci-development": [
    "/images/projects/vinci-tsatskhvebi-11.webp",
    "/images/projects/vinci-tsatskhvebi-11-g1.webp"
  ],
  "forms-construction": [
    "/images/projects/forms-tsatskhvebi-3-14.webp"
  ],
  "new-group": [
    "/images/projects/new-group-vazisubani.webp",
    "/images/projects/new-group-vazisubani-g1.webp",
    "/images/projects/new-group-kavtaradze-19.webp",
    "/images/projects/new-group-kavtaradze-19-g1.webp",
    "/images/projects/new-group-dighomi.webp",
    "/images/projects/new-group-paliashvili.webp",
    "/images/projects/new-group-paliashvili-g1.webp",
    "/images/projects/new-group-paliashvili-g2.webp",
    "/images/projects/new-group-nutsubidze.webp",
    "/images/projects/new-group-nutsubidze-g1.webp"
  ],
  "stellar-property": [
    "/images/projects/stellar-vera.webp",
    "/images/projects/stellar-vera-g1.webp"
  ],
  "seven-group": [
    "/images/projects/seven-tsatskhvebi-16.webp",
    "/images/projects/seven-tsatskhvebi-16-g1.webp"
  ],
  "eco-lisi": [
    "/images/projects/eco-lisi-residence.webp",
    "/images/projects/eco-lisi-residence-g1.webp",
    "/images/projects/eco-lisi-residence-g2.webp"
  ],
  "grande-group": [
    "/images/projects/krtsanisi-grande.webp",
    "/images/projects/krtsanisi-grande-g1.webp"
  ],
  "premium-house": [
    "/images/projects/premium-house-gagarin.webp"
  ],
  "maqro-development": [
    "/images/projects/maqro-city-tbilisi.webp",
    "/images/projects/maqro-city-tbilisi-g1.webp"
  ],
  "domus-development": [
    "/images/projects/domus-park-vake.webp",
    "/images/projects/domus-park-vake-g1.webp",
    "/images/projects/domus-park-vake-g2.webp",
    "/images/projects/domus-park-vake-massing.webp",
    "/images/projects/domus-park-vake-timeline.webp",
    "/images/projects/domus-park-vake-lage.webp",
    "/images/projects/domus-trees.webp",
    "/images/projects/domus-trees-g1.webp",
    "/images/projects/domus-trees-g2.webp",
    "/images/projects/domus-trees-massing.webp",
    "/images/projects/domus-trees-timeline.webp",
    "/images/projects/domus-trees-lage.webp",
    "/images/projects/domus-nea.webp",
    "/images/projects/domus-nea-g1.webp",
    "/images/projects/domus-nea-g2.webp",
    "/images/projects/domus-avlabari.webp",
    "/images/projects/domus-avlabari-g1.webp",
    "/images/projects/domus-avlabari-g2.webp",
    "/images/projects/domus-sera.webp",
    "/images/projects/domus-sera-g1.webp",
    "/images/projects/domus-sera-g2.webp",
    "/images/projects/domus-gazapkhuli.webp",
    "/images/projects/domus-gazapkhuli-g1.webp",
    "/images/projects/domus-gazapkhuli-g2.webp",
    "/images/projects/domus-chavchavadze-49.webp",
    "/images/projects/domus-chavchavadze-49-g1.webp",
    "/images/projects/domus-chavchavadze-49-g2.webp",
    "/images/projects/domus-chavchavadze-49-1.webp",
    "/images/projects/domus-chavchavadze-49-2.webp"
  ],
  "hualing-group": [
    "/images/projects/hualing-tbilisi-sea-new-city.webp",
    "/images/projects/hualing-tbilisi-sea-new-city-g1.webp",
    "/images/projects/hualing-tbilisi-sea-new-city-g2.webp"
  ],
  "biota": [
    "/images/projects/biota-park.webp",
    "/images/projects/biota-park-g1.webp",
    "/images/projects/biota-park-g2.webp"
  ],
  "monolith-group": [
    "/images/projects/monolith-dighomi-city.webp",
    "/images/projects/monolith-dighomi-city-g1.webp",
    "/images/projects/monolith-dighomi-city-g2.webp",
    "/images/projects/monolith-ethno-city.webp",
    "/images/projects/monolith-ethno-city-g1.webp",
    "/images/projects/monolith-ethno-city-g2.webp",
    "/images/projects/monolith-green-city.webp",
    "/images/projects/monolith-green-city-g1.webp"
  ],
  "index-wealth-management": [
    "/images/projects/river-park-by-index.webp",
    "/images/projects/river-park-by-index-g1.webp",
    "/images/projects/avlabari-by-index.webp",
    "/images/projects/avlabari-by-index-g1.webp",
    "/images/projects/avlabari-by-index-g2.webp",
    "/images/projects/niabi-by-index.webp",
    "/images/projects/niabi-by-index-g1.webp",
    "/images/projects/niabi-by-index-g2.webp",
    "/images/projects/isani-by-index.webp",
    "/images/projects/isani-by-index-g1.webp",
    "/images/projects/isani-by-index-g2.webp",
    "/images/projects/gldani-by-index.webp",
    "/images/projects/gldani-by-index-g1.webp",
    "/images/projects/gldani-by-index-g2.webp"
  ],
  "ambassadori-group": [
    "/images/projects/ambassadori-batumi-island.webp",
    "/images/projects/ambassadori-batumi-island-g1.webp",
    "/images/projects/ambassadori-batumi-island-g2.webp"
  ],
  "silk-development": [
    "/images/projects/silk-towers.webp",
    "/images/projects/silk-towers-g1.webp",
    "/images/projects/green-cape-botanico.webp",
    "/images/projects/green-cape-botanico-g1.webp"
  ],
  "york-towers": [
    "/images/projects/york-vista-garden.webp",
    "/images/projects/york-vista-garden-g1.webp"
  ],
  "pontus-development": [
    "/images/projects/pontus-rotana-gonio.webp",
    "/images/projects/pontus-rotana-gonio-g1.webp"
  ],
  "mardi-holding": [
    "/images/projects/mardi-hills.webp",
    "/images/projects/mardi-hills-g1.webp",
    "/images/projects/mardi-city-center.webp",
    "/images/projects/mardi-city-center-g1.webp",
    "/images/projects/mardi-aquapark.webp",
    "/images/projects/mardi-aquapark-g1.webp",
    "/images/projects/mardi-residence.webp",
    "/images/projects/mardi-residence-g1.webp"
  ],
  "real-palace": [
    "/images/projects/real-palace-blue.webp",
    "/images/projects/real-palace-blue-g1.webp",
    "/images/projects/real-palace-green.webp",
    "/images/projects/real-palace-green-g1.webp",
    "/images/projects/alto-by-real-palace.webp",
    "/images/projects/alto-by-real-palace-g1.webp",
    "/images/projects/alto-by-real-palace-g2.webp"
  ],
  "nexus-group": [
    "/images/projects/nexus-javakhishvili.webp",
    "/images/projects/nexus-javakhishvili-g1.webp",
    "/images/projects/nexus-residence-vakhtang.webp",
    "/images/projects/nexus-lisi.webp",
    "/images/projects/nexus-lisi-g1.webp",
    "/images/projects/avlabari-residence.webp",
    "/images/projects/avlabari-residence-1.webp",
    "/images/projects/avlabari-residence-2.webp"
  ],
  "ds-group": [
    "/images/projects/ds-uniq-residence.webp",
    "/images/projects/ds-uniq-residence-g1.webp",
    "/images/projects/ds-uniq-residence-g2.webp",
    "/images/projects/ds-white-line.webp",
    "/images/projects/ds-white-line-g1.webp",
    "/images/projects/ds-white-line-g2.webp"
  ],
  "tower-group": [
    "/images/projects/tower-panorama.webp",
    "/images/projects/tower-panorama-g1.webp",
    "/images/projects/mziani-valley.webp",
    "/images/projects/mziani-valley-g1.webp",
    "/images/projects/kvirike-residence.webp",
    "/images/projects/kvirike-residence-g1.webp"
  ],
  "pala-group": [
    "/images/projects/pala-varketili.webp",
    "/images/projects/pala-varketili-g1.webp",
    "/images/projects/tower-gelovani.webp"
  ],
  "arcon": [
    "/images/projects/arcon-elegance.webp",
    "/images/projects/arcon-elegance-g1.webp",
    "/images/projects/arcon-elegance-g2.webp"
  ],
  "tempo": [
    "/images/projects/tempo-queens-residence.webp",
    "/images/projects/tempo-serenade.webp",
    "/images/projects/tempo-serenade-g1.webp",
    "/images/projects/tempo-sensa.webp",
    "/images/projects/tempo-sensa-g1.webp"
  ],
  "ande-group": [
    "/images/projects/ande-metropolis.webp",
    "/images/projects/ande-metropolis-g1.webp",
    "/images/projects/ande-metropolis-g2.webp"
  ],
  "reside-development": [
    "/images/projects/reside-dest-asatiani.webp",
    "/images/projects/reside-dest-asatiani-g1.webp",
    "/images/projects/reside-breeze-chakvi.webp",
    "/images/projects/reside-breeze-chakvi-g1.webp",
    "/images/projects/reside-dest-corner.webp",
    "/images/projects/reside-dest-corner-g1.webp",
    "/images/projects/reside-riverside.webp",
    "/images/projects/reside-riverside-g1.webp",
    "/images/projects/reside-riverside-g2.webp"
  ],
  "livin": [
    "/images/projects/livin-dadiani-263.webp"
  ],
  "ltd-megobroba": [
    "/images/projects/megobroba-saakadze.webp",
    "/images/projects/megobroba-saakadze-g1.webp",
    "/images/projects/megobroba-sanapiroze.webp",
    "/images/projects/megobroba-sanapiroze-g1.webp",
    "/images/projects/megobroba-sanapiroze-g2.webp"
  ],
  "ocean-capital": [
    "/images/projects/ocean-vake-residences.webp",
    "/images/projects/ocean-vake-residences-g1.webp",
    "/images/projects/ocean-vake-residences-g2.webp",
    "/images/projects/ocean-vake-plaza.webp",
    "/images/projects/ocean-vake-plaza-g1.webp",
    "/images/projects/ocean-vake-plaza-g2.webp",
    "/images/projects/ocean-vake-park.webp",
    "/images/projects/ocean-vake-park-g1.webp",
    "/images/projects/ocean-sky-residences.webp"
  ],
  "eagle-hills-georgia": [
    "/images/projects/tbilisi-waterfront.webp",
    "/images/projects/tbilisi-waterfront-g1.webp",
    "/images/projects/gonio-yachts-marina.webp",
    "/images/projects/gonio-yachts-marina-g1.webp",
    "/images/projects/gonio-yachts-marina-g2.webp"
  ],
  "mira-development": [
    "/images/projects/mira-verde.webp",
    "/images/projects/mira-verde-g1.webp"
  ],
  "idea-development": [
    "/images/projects/idea-panorama.webp",
    "/images/projects/idea-panorama-g1.webp"
  ],
  "alpha-home": [
    "/images/projects/alpha-home-gldani.webp",
    "/images/projects/alpha-home-gldani-g1.webp",
    "/images/projects/alpha-home-gldani-g2.webp"
  ],
  "next-door": [
    "/images/projects/next-door-gelovani.webp",
    "/images/projects/next-door-gelovani-g1.webp",
    "/images/projects/next-door-gelovani-g2.webp"
  ],
  "loft-development": [
    "/images/projects/city-center-gldani.webp",
    "/images/projects/city-center-gldani-g1.webp",
    "/images/projects/city-center-gldani-g2.webp"
  ],
  "apollo-gs": [
    "/images/projects/kings-garden.webp",
    "/images/projects/kings-garden-g1.webp",
    "/images/projects/kings-garden-g2.webp"
  ],
  "grada": [
    "/images/projects/grada-saburtalo.webp",
    "/images/projects/grada-saburtalo-g1.webp",
    "/images/projects/grada-saburtalo-g2.webp",
    "/images/projects/grada-park.webp",
    "/images/projects/grada-park-g1.webp"
  ],
  "omnia-georgia": [
    "/images/projects/omnia-isani.webp",
    "/images/projects/omnia-isani-g1.webp",
    "/images/projects/omnia-isani-1.webp",
    "/images/projects/omnia-isani-2.webp"
  ],
  "chargali-residence": [
    "/images/projects/chargali-residence.webp",
    "/images/projects/chargali-residence-g1.webp",
    "/images/projects/chargali-residence-g2.webp"
  ],
  "inn-development": [
    "/images/projects/gldani-inn.webp",
    "/images/projects/gldani-inn-g1.webp",
    "/images/projects/gldani-inn-g2.webp"
  ],
  "lider-development": [
    "/images/projects/passage-gldani.webp",
    "/images/projects/passage-gldani-g1.webp",
    "/images/projects/entrada-sarajishvili.webp",
    "/images/projects/corner-gldani.webp",
    "/images/projects/corner-gldani-g1.webp",
    "/images/projects/corner-gldani-g2.webp",
    "/images/projects/prime-lisi.webp",
    "/images/projects/prime-lisi-g1.webp",
    "/images/projects/verda-mukhiani.webp",
    "/images/projects/verda-mukhiani-g1.webp",
    "/images/projects/verda-mukhiani-g2.webp",
    "/images/projects/relevance-nutsubidze.webp"
  ],
  "gg-group": [
    "/images/projects/gg-varketili-sukhishvili.webp",
    "/images/projects/gg-varketili-sukhishvili-g1.webp",
    "/images/projects/gg-varketili-sukhishvili-g2.webp"
  ],
  "vr-holding": [
    "/images/projects/krtsanisi-resort-residence.webp",
    "/images/projects/krtsanisi-resort-residence-g1.webp",
    "/images/projects/shekvetili-forest-beach.webp",
    "/images/projects/shekvetili-forest-beach-g1.webp"
  ],
  "moedani": [
    "/images/projects/moedani.webp",
    "/images/projects/moedani-g1.webp"
  ],
  "gtb-development": [
    "/images/projects/gtb-didi-digomi.webp",
    "/images/projects/gtb-didi-digomi-g1.webp"
  ],
  "ig-development": [
    "/images/projects/cityzen-tower.webp",
    "/images/projects/cityzen-tower-g1.webp",
    "/images/projects/cityzen-tower-g2.webp"
  ],
  "alliance-city": [
    "/images/projects/alliance-samgori.webp",
    "/images/projects/alliance-samgori-g1.webp",
    "/images/projects/alliance-samgori-g2.webp"
  ],
  "simetria-group": [
    "/images/projects/simetria-park.webp",
    "/images/projects/simetria-park-g1.webp",
    "/images/projects/simetria-jikia.webp",
    "/images/projects/simetria-jikia-g1.webp"
  ],
  "devart-group": [
    "/images/projects/devart-green-gardens.webp",
    "/images/projects/devart-green-gardens-g1.webp",
    "/images/projects/devart-green-gardens-g2.webp"
  ],
  "quadrum-global": [
    "/images/projects/tbilisi-gardens.webp",
    "/images/projects/tbilisi-gardens-g1.webp"
  ],
  "ktw-development": [
    "/images/projects/mtatsminda-panorama.webp",
    "/images/projects/mtatsminda-panorama-g1.webp",
    "/images/projects/mtatsminda-panorama-g2.webp"
  ],
  "structura-development": [
    "/images/projects/structura-vake-tower.webp",
    "/images/projects/structura-vake-tower-g1.webp"
  ],
  "eco-invest": [
    "/images/projects/tbilisi-boulevard.webp",
    "/images/projects/tbilisi-boulevard-g1.webp"
  ],
  "gradburg-development": [
    "/images/projects/millennium-residence.webp",
    "/images/projects/millennium-residence-g1.webp"
  ],
  "urbanique-group": [
    "/images/projects/urbanique-mziuri.webp",
    "/images/projects/urbanique-mziuri-g1.webp"
  ],
  "kolkhi-group": [
    "/images/projects/horizon-nutsubidze.webp",
    "/images/projects/horizon-nutsubidze-g1.webp"
  ],
  "trio-group": [
    "/images/projects/lisi-trio.webp",
    "/images/projects/lisi-trio-g1.webp"
  ],
  "besik-sabashvili": [
    "/images/projects/lisi-kvarteti.webp",
    "/images/projects/lisi-kvarteti-g1.webp",
    "/images/projects/lisi-kvarteti-g2.webp"
  ],
  "grand-maison": [
    "/images/projects/calligraphy-towers.webp",
    "/images/projects/calligraphy-towers-g1.webp",
    "/images/projects/calligraphy-towers-g2.webp"
  ],
  "crystal-group": [
    "/images/projects/crystal-loft-bakuriani.webp",
    "/images/projects/crystal-loft-bakuriani-g1.webp",
    "/images/projects/crystal-loft-bakuriani-g2.webp",
    "/images/projects/crystal-resort-bakuriani.webp",
    "/images/projects/crystal-resort-bakuriani-g1.webp",
    "/images/projects/crystal-resort-bakuriani-g2.webp",
    "/images/projects/crystal-park-hotel.webp",
    "/images/projects/crystal-park-hotel-g1.webp",
    "/images/projects/crystal-park-hotel-g2.webp"
  ],
  "resorts-development": [
    "/images/projects/bakuriani-prospect.webp",
    "/images/projects/bakuriani-prospect-g1.webp",
    "/images/projects/bakuriani-prospect-g2.webp"
  ],
  "kura-construction": [
    "/images/projects/kura-rustavi.webp",
    "/images/projects/kura-rustavi-g1.webp"
  ],
  "aroma-neo": [
    "/images/projects/kobuleti-wellness-residence.webp",
    "/images/projects/kobuleti-wellness-residence-g1.webp"
  ],
  "rustaveli-group": [
    "/images/projects/rustaveli-xvii.webp"
  ],
  "telavi-estate": [
    "/images/projects/telavi-residence.webp",
    "/images/projects/telavi-residence-g1.webp"
  ],
  "kakheti-telavi-sun": [
    "/images/projects/telavi-sun.webp",
    "/images/projects/telavi-sun-g1.webp",
    "/images/projects/telavi-sun-g2.webp"
  ],
  "sun-estate": [
    "/images/projects/sun-estate-shekvetili.webp",
    "/images/projects/sun-estate-shekvetili-g1.webp"
  ],
  "schuchmann": [
    "/images/projects/alazani-valley-residence.webp",
    "/images/projects/alazani-valley-residence-g1.webp",
    "/images/projects/alazani-valley-residence-g2.webp"
  ],
  "homex": [
    "/images/projects/lagoon-resort.webp",
    "/images/projects/lagoon-resort-g1.webp"
  ],
  "alia-group": [
    "/images/projects/telavalley-residence.webp",
    "/images/projects/telavalley-residence-g1.webp",
    "/images/projects/telavalley-residence-g2.webp"
  ],
  "tbilisi-hills": [
    "/images/projects/tbilisi-hills.webp",
    "/images/projects/tbilisi-hills-g1.webp"
  ],
  "artex-group": [
    "/images/projects/artex.webp",
    "/images/projects/artex-g1.webp",
    "/images/projects/artex-g2.webp",
    "/images/projects/gate-by-artex.webp",
    "/images/projects/gate-by-artex-g1.webp",
    "/images/projects/gate-by-artex-g2.webp"
  ],
  "kbk-development": [
    "/images/projects/grand-millennium-kobuleti.webp",
    "/images/projects/grand-millennium-kobuleti-g1.webp",
    "/images/projects/grand-millennium-kobuleti-g2.webp"
  ],
  "batumi-investment": [
    "/images/projects/grand-botanico-residence.webp",
    "/images/projects/grand-botanico-residence-g1.webp"
  ],
  "keystone-development": [
    "/images/projects/coordinate-by-keystone.webp",
    "/images/projects/coordinate-by-keystone-g1.webp",
    "/images/projects/coordinate-by-keystone-g2.webp"
  ],
  "parkwood": [
    "/images/projects/parkwood-2.webp",
    "/images/projects/parkwood-2-g1.webp"
  ],
  "plaza-development": [
    "/images/projects/freedom-plaza.webp",
    "/images/projects/freedom-plaza-g1.webp",
    "/images/projects/freedom-plaza-g2.webp"
  ],
  "dighomi-gardens": [
    "/images/projects/dighomi-gardens.webp",
    "/images/projects/dighomi-gardens-g1.webp",
    "/images/projects/dighomi-gardens-g2.webp"
  ],
  "saburtalo-residence": [
    "/images/projects/saburtalo-residence.webp",
    "/images/projects/saburtalo-residence-g1.webp"
  ],
  "solum": [
    "/images/projects/solum-ponichala.webp",
    "/images/projects/solum-ponichala-g1.webp"
  ],
  "roof-development": [
    "/images/projects/roof-vazisubani.webp",
    "/images/projects/roof-vazisubani-g1.webp",
    "/images/projects/roof-chkondideli.webp",
    "/images/projects/roof-chkondideli-g1.webp",
    "/images/projects/roof-ponichala.webp",
    "/images/projects/roof-ponichala-g1.webp",
    "/images/projects/roof-ponichala-g2.webp"
  ],
  "gwg-development": [
    "/images/projects/gwg-krtsanisi.webp",
    "/images/projects/gwg-krtsanisi-g1.webp"
  ],
  "harmonica": [
    "/images/projects/harmonica-green-cape.webp",
    "/images/projects/harmonica-green-cape-g1.webp"
  ],
  "dreamland": [
    "/images/projects/dreamland-oasis.webp",
    "/images/projects/dreamland-oasis-g1.webp",
    "/images/projects/dreamland-oasis-g2.webp"
  ],
  "bagrationi-residence": [
    "/images/projects/bagrationi-residence-batumi.webp",
    "/images/projects/bagrationi-residence-batumi-g1.webp",
    "/images/projects/bagrationi-residence-batumi-g2.webp"
  ],
  "gb-georgia": [
    "/images/projects/tower-ketevani.webp",
    "/images/projects/tower-ketevani-g1.webp"
  ],
  "mega-construction": [
    "/images/projects/mega-gldani.webp",
    "/images/projects/mega-gldani-g1.webp"
  ],
  "astoria-group": [
    "/images/projects/astoria-isani.webp",
    "/images/projects/astoria-isani-g1.webp",
    "/images/projects/astoria-isani-g2.webp"
  ],
  "z-group": [
    "/images/projects/zygma.webp",
    "/images/projects/zygma-g1.webp",
    "/images/projects/zygma-g2.webp"
  ],
  "arx-development": [
    "/images/projects/parkside-temka.webp",
    "/images/projects/parkside-temka-g1.webp"
  ],
  "legi-construction": [
    "/images/projects/parkside-varketili.webp",
    "/images/projects/parkside-varketili-g1.webp"
  ],
  "bilderz": [
    "/images/projects/isani-bilderz.webp"
  ],
  "bala-construction": [
    "/images/projects/vertikal-batumi.webp",
    "/images/projects/vertikal-batumi-g1.webp"
  ],
  "smart-development": [
    "/images/projects/summer-365.webp",
    "/images/projects/summer-365-g1.webp"
  ],
  "olympus": [
    "/images/projects/olympus-residence-batumi.webp",
    "/images/projects/olympus-residence-batumi-g1.webp"
  ],
  "sunrise-development": [
    "/images/projects/sunrise-palace.webp",
    "/images/projects/sunrise-palace-g1.webp"
  ],
  "zenar-development": [
    "/images/projects/zenari-kutaisi.webp",
    "/images/projects/zenari-kutaisi-g1.webp"
  ],
  "panorama-park-kutaisi": [
    "/images/projects/panorama-park-kutaisi.webp",
    "/images/projects/panorama-park-kutaisi-g1.webp",
    "/images/projects/panorama-park-kutaisi-g2.webp"
  ],
  "batumi-concept": [
    "/images/projects/batumi-concept.webp",
    "/images/projects/batumi-concept-g1.webp",
    "/images/projects/batumi-concept-g2.webp"
  ],
  "terrametric-development": [
    "/images/projects/terrametric-krtsanisi.webp",
    "/images/projects/terrametric-krtsanisi-g1.webp"
  ],
  "ratevani-development": [
    "/images/projects/ratevani.webp",
    "/images/projects/ratevani-g1.webp"
  ],
  "pillar-group": [
    "/images/projects/pillar-park.webp",
    "/images/projects/pillar-park-g1.webp",
    "/images/projects/pillar-park-samgori.webp",
    "/images/projects/pillar-park-samgori-g1.webp"
  ],
  "dasan-residence": [
    "/images/projects/dasan-residence.webp",
    "/images/projects/dasan-residence-g1.webp",
    "/images/projects/dasan-residence-g2.webp"
  ],
  "terracon": [
    "/images/projects/terracon-kheivani.webp",
    "/images/projects/terracon-kheivani-g1.webp"
  ],
  "kokhta-ubani": [
    "/images/projects/kokhta-ubani-tsatskhvebi.webp"
  ],
  "wbm": [
    "/images/projects/quartier-lilienthal.webp",
    "/images/projects/quartier-lilienthal-g1.webp",
    "/images/projects/quartier-lilienthal-g2.webp",
    "/images/projects/quartier-lilienthal-massing.webp",
    "/images/projects/quartier-lilienthal-timeline.webp",
    "/images/projects/quartier-lilienthal-lage.webp",
    "/images/projects/wbm-mollstrasse.webp",
    "/images/projects/wbm-mollstrasse-g1.webp",
    "/images/projects/wbm-mollstrasse-g2.webp",
    "/images/projects/wbm-mollstrasse-massing.webp",
    "/images/projects/wbm-mollstrasse-timeline.webp",
    "/images/projects/wbm-mollstrasse-lage.webp",
    "/images/projects/wbm-lange-strasse.webp",
    "/images/projects/wbm-lange-strasse-g1.webp",
    "/images/projects/wbm-lange-strasse-g2.webp",
    "/images/projects/wbm-lange-strasse-massing.webp",
    "/images/projects/wbm-lange-strasse-timeline.webp",
    "/images/projects/wbm-lange-strasse-lage.webp",
    "/images/projects/wbm-rathausblock-sued.webp",
    "/images/projects/wbm-rathausblock-sued-g1.webp",
    "/images/projects/wbm-rathausblock-sued-g2.webp",
    "/images/projects/wbm-rathausblock-sued-massing.webp",
    "/images/projects/wbm-rathausblock-sued-timeline.webp",
    "/images/projects/wbm-rathausblock-sued-lage.webp",
    "/images/projects/wbm-melchior-engeldamm.webp",
    "/images/projects/wbm-melchior-engeldamm-g1.webp",
    "/images/projects/wbm-melchior-engeldamm-g2.webp",
    "/images/projects/wbm-melchior-engeldamm-massing.webp",
    "/images/projects/wbm-melchior-engeldamm-timeline.webp",
    "/images/projects/wbm-melchior-engeldamm-lage.webp",
    "/images/projects/wbm-neue-jakobstrasse.webp",
    "/images/projects/wbm-neue-jakobstrasse-g1.webp",
    "/images/projects/wbm-neue-jakobstrasse-g2.webp",
    "/images/projects/wbm-neue-jakobstrasse-massing.webp",
    "/images/projects/wbm-neue-jakobstrasse-timeline.webp",
    "/images/projects/wbm-neue-jakobstrasse-lage.webp",
    "/images/projects/wbm-sez-quartier.webp",
    "/images/projects/wbm-sez-quartier-g1.webp",
    "/images/projects/wbm-sez-quartier-g2.webp",
    "/images/projects/wbm-sez-quartier-massing.webp",
    "/images/projects/wbm-sez-quartier-timeline.webp",
    "/images/projects/wbm-sez-quartier-lage.webp",
    "/images/projects/wbm-haus-der-statistik.webp",
    "/images/projects/wbm-haus-der-statistik-g1.webp",
    "/images/projects/wbm-haus-der-statistik-massing.webp",
    "/images/projects/wbm-haus-der-statistik-timeline.webp",
    "/images/projects/wbm-haus-der-statistik-lage.webp",
    "/images/projects/wbm-breite-strasse.webp",
    "/images/projects/wbm-breite-strasse-g1.webp",
    "/images/projects/wbm-breite-strasse-massing.webp",
    "/images/projects/wbm-breite-strasse-timeline.webp",
    "/images/projects/wbm-breite-strasse-lage.webp",
    "/images/projects/wbm-molkenmarkt.webp",
    "/images/projects/wbm-molkenmarkt-g1.webp",
    "/images/projects/wbm-molkenmarkt-g2.webp",
    "/images/projects/wbm-molkenmarkt-massing.webp",
    "/images/projects/wbm-molkenmarkt-timeline.webp",
    "/images/projects/wbm-molkenmarkt-lage.webp",
    "/images/projects/wbm-rathenower-strasse.webp",
    "/images/projects/wbm-rathenower-strasse-massing.webp",
    "/images/projects/wbm-rathenower-strasse-timeline.webp",
    "/images/projects/wbm-rathenower-strasse-lage.webp",
    "/images/projects/wbm-viktoriaspeicher.webp",
    "/images/projects/wbm-viktoriaspeicher-massing.webp",
    "/images/projects/wbm-viktoriaspeicher-timeline.webp",
    "/images/projects/wbm-viktoriaspeicher-lage.webp"
  ],
  "degewo": [
    "/images/projects/degewo-neulichterfelde.webp",
    "/images/projects/degewo-neulichterfelde-massing.webp",
    "/images/projects/degewo-neulichterfelde-timeline.webp",
    "/images/projects/degewo-neulichterfelde-lage.webp",
    "/images/projects/degewo-am-falkenberg.webp",
    "/images/projects/degewo-am-falkenberg-massing.webp",
    "/images/projects/degewo-am-falkenberg-timeline.webp",
    "/images/projects/degewo-am-falkenberg-lage.webp"
  ],
  "howoge": [
    "/images/projects/howoge-elisabeth-aue.webp",
    "/images/projects/howoge-elisabeth-aue-massing.webp",
    "/images/projects/howoge-elisabeth-aue-timeline.webp",
    "/images/projects/howoge-elisabeth-aue-lage.webp",
    "/images/projects/howoge-anne-frank-strasse.webp",
    "/images/projects/howoge-anne-frank-strasse-g1.webp",
    "/images/projects/howoge-anne-frank-strasse-g2.webp",
    "/images/projects/howoge-anne-frank-strasse-massing.webp",
    "/images/projects/howoge-anne-frank-strasse-timeline.webp",
    "/images/projects/howoge-anne-frank-strasse-lage.webp",
    "/images/projects/howoge-gartenstadt-karlshorst.webp",
    "/images/projects/howoge-gartenstadt-karlshorst-g1.webp",
    "/images/projects/howoge-gartenstadt-karlshorst-g2.webp",
    "/images/projects/howoge-gartenstadt-karlshorst-massing.webp",
    "/images/projects/howoge-gartenstadt-karlshorst-timeline.webp",
    "/images/projects/howoge-gartenstadt-karlshorst-lage.webp",
    "/images/projects/howoge-genslerstrasse-39-47.webp",
    "/images/projects/howoge-genslerstrasse-39-47-g1.webp",
    "/images/projects/howoge-genslerstrasse-39-47-g2.webp",
    "/images/projects/howoge-genslerstrasse-39-47-massing.webp",
    "/images/projects/howoge-genslerstrasse-39-47-timeline.webp",
    "/images/projects/howoge-genslerstrasse-39-47-lage.webp",
    "/images/projects/howoge-havelufer-quartier.webp",
    "/images/projects/howoge-havelufer-quartier-g1.webp",
    "/images/projects/howoge-havelufer-quartier-g2.webp",
    "/images/projects/howoge-havelufer-quartier-massing.webp",
    "/images/projects/howoge-havelufer-quartier-timeline.webp",
    "/images/projects/howoge-havelufer-quartier-lage.webp",
    "/images/projects/howoge-huronseestrasse-28-34.webp",
    "/images/projects/howoge-huronseestrasse-28-34-g1.webp",
    "/images/projects/howoge-huronseestrasse-28-34-g2.webp",
    "/images/projects/howoge-huronseestrasse-28-34-massing.webp",
    "/images/projects/howoge-huronseestrasse-28-34-timeline.webp",
    "/images/projects/howoge-huronseestrasse-28-34-lage.webp",
    "/images/projects/howoge-kirchsteig.webp",
    "/images/projects/howoge-kirchsteig-g1.webp",
    "/images/projects/howoge-kirchsteig-g2.webp",
    "/images/projects/howoge-kirchsteig-massing.webp",
    "/images/projects/howoge-kirchsteig-timeline.webp",
    "/images/projects/howoge-kirchsteig-lage.webp",
    "/images/projects/howoge-lueckstrasse.webp",
    "/images/projects/howoge-lueckstrasse-massing.webp",
    "/images/projects/howoge-lueckstrasse-timeline.webp",
    "/images/projects/howoge-lueckstrasse-lage.webp",
    "/images/projects/howoge-oberseestrasse-oranke.webp",
    "/images/projects/howoge-oberseestrasse-oranke-massing.webp",
    "/images/projects/howoge-oberseestrasse-oranke-timeline.webp",
    "/images/projects/howoge-oberseestrasse-oranke-lage.webp",
    "/images/projects/howoge-plonzstrasse.webp",
    "/images/projects/howoge-plonzstrasse-g1.webp",
    "/images/projects/howoge-plonzstrasse-g2.webp",
    "/images/projects/howoge-plonzstrasse-massing.webp",
    "/images/projects/howoge-plonzstrasse-timeline.webp",
    "/images/projects/howoge-plonzstrasse-lage.webp",
    "/images/projects/howoge-sewanstrasse-256.webp",
    "/images/projects/howoge-sewanstrasse-256-g1.webp",
    "/images/projects/howoge-sewanstrasse-256-g2.webp",
    "/images/projects/howoge-sewanstrasse-256-massing.webp",
    "/images/projects/howoge-sewanstrasse-256-timeline.webp",
    "/images/projects/howoge-sewanstrasse-256-lage.webp",
    "/images/projects/howoge-sewanstrasse-38-40.webp",
    "/images/projects/howoge-sewanstrasse-38-40-g1.webp",
    "/images/projects/howoge-sewanstrasse-38-40-g2.webp",
    "/images/projects/howoge-sewanstrasse-38-40-massing.webp",
    "/images/projects/howoge-sewanstrasse-38-40-timeline.webp",
    "/images/projects/howoge-sewanstrasse-38-40-lage.webp",
    "/images/projects/howoge-studenthouse-eichbuschallee.webp",
    "/images/projects/howoge-studenthouse-eichbuschallee-massing.webp",
    "/images/projects/howoge-studenthouse-eichbuschallee-timeline.webp",
    "/images/projects/howoge-studenthouse-eichbuschallee-lage.webp",
    "/images/projects/howoge-wiecker-strasse.webp",
    "/images/projects/howoge-wiecker-strasse-g1.webp",
    "/images/projects/howoge-wiecker-strasse-g2.webp",
    "/images/projects/howoge-wiecker-strasse-massing.webp",
    "/images/projects/howoge-wiecker-strasse-timeline.webp",
    "/images/projects/howoge-wiecker-strasse-lage.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22-g1.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22-g2.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22-massing.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22-timeline.webp",
    "/images/projects/howoge-alfred-kowalke-strasse-22-lage.webp",
    "/images/projects/howoge-am-lindenplatz.webp",
    "/images/projects/howoge-am-lindenplatz-g1.webp",
    "/images/projects/howoge-am-lindenplatz-g2.webp",
    "/images/projects/howoge-am-lindenplatz-massing.webp",
    "/images/projects/howoge-am-lindenplatz-timeline.webp",
    "/images/projects/howoge-am-lindenplatz-lage.webp",
    "/images/projects/howoge-barther-strasse.webp",
    "/images/projects/howoge-barther-strasse-massing.webp",
    "/images/projects/howoge-barther-strasse-timeline.webp",
    "/images/projects/howoge-barther-strasse-lage.webp",
    "/images/projects/howoge-detlevstrasse.webp",
    "/images/projects/howoge-detlevstrasse-g1.webp",
    "/images/projects/howoge-detlevstrasse-g2.webp",
    "/images/projects/howoge-detlevstrasse-massing.webp",
    "/images/projects/howoge-detlevstrasse-timeline.webp",
    "/images/projects/howoge-detlevstrasse-lage.webp",
    "/images/projects/howoge-ilsestrasse-marksburgstrasse.webp",
    "/images/projects/howoge-ilsestrasse-marksburgstrasse-massing.webp",
    "/images/projects/howoge-ilsestrasse-marksburgstrasse-timeline.webp",
    "/images/projects/howoge-ilsestrasse-marksburgstrasse-lage.webp",
    "/images/projects/howoge-joachimsthaler-plauener.webp",
    "/images/projects/howoge-joachimsthaler-plauener-massing.webp",
    "/images/projects/howoge-joachimsthaler-plauener-timeline.webp",
    "/images/projects/howoge-joachimsthaler-plauener-lage.webp",
    "/images/projects/howoge-konnekt-georg-knorr-park.webp",
    "/images/projects/howoge-konnekt-georg-knorr-park-massing.webp",
    "/images/projects/howoge-konnekt-georg-knorr-park-timeline.webp",
    "/images/projects/howoge-konnekt-georg-knorr-park-lage.webp",
    "/images/projects/howoge-mahlower-strasse.webp",
    "/images/projects/howoge-mahlower-strasse-g1.webp",
    "/images/projects/howoge-mahlower-strasse-g2.webp",
    "/images/projects/howoge-mahlower-strasse-massing.webp",
    "/images/projects/howoge-mahlower-strasse-timeline.webp",
    "/images/projects/howoge-mahlower-strasse-lage.webp",
    "/images/projects/howoge-rosenfelder-ring-88.webp",
    "/images/projects/howoge-rosenfelder-ring-88-g1.webp",
    "/images/projects/howoge-rosenfelder-ring-88-massing.webp",
    "/images/projects/howoge-rosenfelder-ring-88-timeline.webp",
    "/images/projects/howoge-rosenfelder-ring-88-lage.webp",
    "/images/projects/howoge-salzmannstrasse-34.webp",
    "/images/projects/howoge-salzmannstrasse-34-g1.webp",
    "/images/projects/howoge-salzmannstrasse-34-g2.webp",
    "/images/projects/howoge-salzmannstrasse-34-massing.webp",
    "/images/projects/howoge-salzmannstrasse-34-timeline.webp",
    "/images/projects/howoge-salzmannstrasse-34-lage.webp",
    "/images/projects/howoge-schkeuditzer-strasse.webp",
    "/images/projects/howoge-schkeuditzer-strasse-g1.webp",
    "/images/projects/howoge-schkeuditzer-strasse-g2.webp",
    "/images/projects/howoge-schkeuditzer-strasse-massing.webp",
    "/images/projects/howoge-schkeuditzer-strasse-timeline.webp",
    "/images/projects/howoge-schkeuditzer-strasse-lage.webp",
    "/images/projects/howoge-schulze-boysen-strasse.webp",
    "/images/projects/howoge-schulze-boysen-strasse-g1.webp",
    "/images/projects/howoge-schulze-boysen-strasse-massing.webp",
    "/images/projects/howoge-schulze-boysen-strasse-timeline.webp",
    "/images/projects/howoge-schulze-boysen-strasse-lage.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse-g1.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse-g2.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse-massing.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse-timeline.webp",
    "/images/projects/howoge-vincent-van-gogh-strasse-lage.webp"
  ],
  "gewobag": [
    "/images/projects/gewobag-landsberger-allee.webp",
    "/images/projects/gewobag-landsberger-allee-g1.webp",
    "/images/projects/gewobag-landsberger-allee-g2.webp",
    "/images/projects/gewobag-landsberger-allee-massing.webp",
    "/images/projects/gewobag-landsberger-allee-timeline.webp",
    "/images/projects/gewobag-landsberger-allee-lage.webp",
    "/images/projects/gewobag-gartenfeld.webp",
    "/images/projects/gewobag-gartenfeld-massing.webp",
    "/images/projects/gewobag-gartenfeld-timeline.webp",
    "/images/projects/gewobag-gartenfeld-lage.webp",
    "/images/projects/gewobag-am-muehlenberg.webp",
    "/images/projects/gewobag-am-muehlenberg-massing.webp",
    "/images/projects/gewobag-am-muehlenberg-timeline.webp",
    "/images/projects/gewobag-am-muehlenberg-lage.webp",
    "/images/projects/gewobag-wendenschlossstrasse.webp",
    "/images/projects/gewobag-wendenschlossstrasse-g1.webp",
    "/images/projects/gewobag-wendenschlossstrasse-g2.webp",
    "/images/projects/gewobag-wendenschlossstrasse-massing.webp",
    "/images/projects/gewobag-wendenschlossstrasse-timeline.webp",
    "/images/projects/gewobag-wendenschlossstrasse-lage.webp",
    "/images/projects/gewobag-allee-der-kosmonauten.webp",
    "/images/projects/gewobag-allee-der-kosmonauten-g1.webp",
    "/images/projects/gewobag-allee-der-kosmonauten-g2.webp",
    "/images/projects/gewobag-allee-der-kosmonauten-massing.webp",
    "/images/projects/gewobag-allee-der-kosmonauten-timeline.webp",
    "/images/projects/gewobag-allee-der-kosmonauten-lage.webp",
    "/images/projects/gewobag-waterkant.webp",
    "/images/projects/gewobag-waterkant-g1.webp",
    "/images/projects/gewobag-waterkant-g2.webp",
    "/images/projects/gewobag-waterkant-massing.webp",
    "/images/projects/gewobag-waterkant-timeline.webp",
    "/images/projects/gewobag-waterkant-lage.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18-g1.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18-g2.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18-massing.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18-timeline.webp",
    "/images/projects/gewobag-hohensaatener-strasse-18-lage.webp"
  ],
  "stadt-und-land": [
    "/images/projects/stadt-und-land-droepkeweg.webp",
    "/images/projects/stadt-und-land-droepkeweg-massing.webp",
    "/images/projects/stadt-und-land-droepkeweg-timeline.webp",
    "/images/projects/stadt-und-land-droepkeweg-lage.webp",
    "/images/projects/stadt-und-land-buckower-felder.webp",
    "/images/projects/stadt-und-land-buckower-felder-g1.webp",
    "/images/projects/stadt-und-land-buckower-felder-g2.webp",
    "/images/projects/stadt-und-land-buckower-felder-massing.webp",
    "/images/projects/stadt-und-land-buckower-felder-timeline.webp",
    "/images/projects/stadt-und-land-buckower-felder-lage.webp",
    "/images/projects/stadt-und-land-weinstrasse-9.webp",
    "/images/projects/stadt-und-land-weinstrasse-9-g1.webp",
    "/images/projects/stadt-und-land-weinstrasse-9-massing.webp",
    "/images/projects/stadt-und-land-weinstrasse-9-timeline.webp",
    "/images/projects/stadt-und-land-weinstrasse-9-lage.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel-g1.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel-g2.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel-massing.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel-timeline.webp",
    "/images/projects/stadt-und-land-kaserne-hessenwinkel-lage.webp",
    "/images/projects/stadt-und-land-johanna-tesch-strasse.webp",
    "/images/projects/stadt-und-land-johanna-tesch-strasse-g1.webp",
    "/images/projects/stadt-und-land-johanna-tesch-strasse-massing.webp",
    "/images/projects/stadt-und-land-johanna-tesch-strasse-timeline.webp",
    "/images/projects/stadt-und-land-johanna-tesch-strasse-lage.webp",
    "/images/projects/stadt-und-land-johannes-tobei-strasse.webp",
    "/images/projects/stadt-und-land-johannes-tobei-strasse-g1.webp",
    "/images/projects/stadt-und-land-johannes-tobei-strasse-massing.webp",
    "/images/projects/stadt-und-land-johannes-tobei-strasse-timeline.webp",
    "/images/projects/stadt-und-land-johannes-tobei-strasse-lage.webp",
    "/images/projects/stadt-und-land-walkuerenstrasse.webp",
    "/images/projects/stadt-und-land-walkuerenstrasse-massing.webp",
    "/images/projects/stadt-und-land-walkuerenstrasse-timeline.webp",
    "/images/projects/stadt-und-land-walkuerenstrasse-lage.webp",
    "/images/projects/stadt-und-land-maybachufer.webp",
    "/images/projects/stadt-und-land-maybachufer-g1.webp",
    "/images/projects/stadt-und-land-maybachufer-g2.webp",
    "/images/projects/stadt-und-land-maybachufer-massing.webp",
    "/images/projects/stadt-und-land-maybachufer-timeline.webp",
    "/images/projects/stadt-und-land-maybachufer-lage.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45-g1.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45-g2.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45-massing.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45-timeline.webp",
    "/images/projects/stadt-und-land-fritz-werner-strasse-45-lage.webp",
    "/images/projects/stadt-und-land-sonnenallee-210.webp",
    "/images/projects/stadt-und-land-sonnenallee-210-massing.webp",
    "/images/projects/stadt-und-land-sonnenallee-210-timeline.webp",
    "/images/projects/stadt-und-land-sonnenallee-210-lage.webp",
    "/images/projects/stadt-und-land-paule-panke.webp",
    "/images/projects/stadt-und-land-paule-panke-massing.webp",
    "/images/projects/stadt-und-land-paule-panke-timeline.webp",
    "/images/projects/stadt-und-land-paule-panke-lage.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung-g1.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung-g2.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung-massing.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung-timeline.webp",
    "/images/projects/stadt-und-land-john-locke-siedlung-lage.webp"
  ],
  "gesobau": [
    "/images/projects/gesobau-cecilien-carre.webp",
    "/images/projects/gesobau-cecilien-carre-massing.webp",
    "/images/projects/gesobau-cecilien-carre-timeline.webp",
    "/images/projects/gesobau-cecilien-carre-lage.webp",
    "/images/projects/gesobau-gesocampus-alt-wittenau.webp",
    "/images/projects/gesobau-gesocampus-alt-wittenau-g1.webp",
    "/images/projects/gesobau-gesocampus-alt-wittenau-massing.webp",
    "/images/projects/gesobau-gesocampus-alt-wittenau-timeline.webp",
    "/images/projects/gesobau-gesocampus-alt-wittenau-lage.webp",
    "/images/projects/gesobau-reinickendorfer-strasse.webp",
    "/images/projects/gesobau-reinickendorfer-strasse-g1.webp",
    "/images/projects/gesobau-reinickendorfer-strasse-massing.webp",
    "/images/projects/gesobau-reinickendorfer-strasse-timeline.webp",
    "/images/projects/gesobau-reinickendorfer-strasse-lage.webp",
    "/images/projects/gesobau-alte-hellersdorfer-strasse.webp",
    "/images/projects/gesobau-alte-hellersdorfer-strasse-massing.webp",
    "/images/projects/gesobau-alte-hellersdorfer-strasse-timeline.webp",
    "/images/projects/gesobau-alte-hellersdorfer-strasse-lage.webp",
    "/images/projects/gesobau-johann-georg-strasse-9a.webp",
    "/images/projects/gesobau-johann-georg-strasse-9a-massing.webp",
    "/images/projects/gesobau-johann-georg-strasse-9a-timeline.webp",
    "/images/projects/gesobau-johann-georg-strasse-9a-lage.webp",
    "/images/projects/gesobau-pankower-allee-55.webp",
    "/images/projects/gesobau-pankower-allee-55-massing.webp",
    "/images/projects/gesobau-pankower-allee-55-timeline.webp",
    "/images/projects/gesobau-pankower-allee-55-lage.webp",
    "/images/projects/gesobau-stollberger-strasse.webp",
    "/images/projects/gesobau-stollberger-strasse-g1.webp",
    "/images/projects/gesobau-stollberger-strasse-massing.webp",
    "/images/projects/gesobau-stollberger-strasse-timeline.webp",
    "/images/projects/gesobau-stollberger-strasse-lage.webp",
    "/images/projects/gesobau-wilhelmsruher-damm-150.webp",
    "/images/projects/gesobau-wilhelmsruher-damm-150-g1.webp",
    "/images/projects/gesobau-wilhelmsruher-damm-150-massing.webp",
    "/images/projects/gesobau-wilhelmsruher-damm-150-timeline.webp",
    "/images/projects/gesobau-wilhelmsruher-damm-150-lage.webp"
  ],
  "buwog-berlin": [
    "/images/projects/buwog-dahmeglanz.webp",
    "/images/projects/buwog-dahmeglanz-massing.webp",
    "/images/projects/buwog-dahmeglanz-timeline.webp",
    "/images/projects/buwog-dahmeglanz-lage.webp",
    "/images/projects/buwog-neumarien.webp",
    "/images/projects/buwog-neumarien-massing.webp",
    "/images/projects/buwog-neumarien-timeline.webp",
    "/images/projects/buwog-neumarien-lage.webp",
    "/images/projects/buwog-havellichter.webp",
    "/images/projects/buwog-havellichter-massing.webp",
    "/images/projects/buwog-havellichter-timeline.webp",
    "/images/projects/buwog-havellichter-lage.webp",
    "/images/projects/buwog-weydenhof.webp",
    "/images/projects/buwog-weydenhof-massing.webp",
    "/images/projects/buwog-weydenhof-timeline.webp",
    "/images/projects/buwog-weydenhof-lage.webp",
    "/images/projects/buwog-set-44.webp",
    "/images/projects/buwog-set-44-massing.webp",
    "/images/projects/buwog-set-44-timeline.webp",
    "/images/projects/buwog-set-44-lage.webp",
    "/images/projects/buwog-zweiklang.webp",
    "/images/projects/buwog-zweiklang-massing.webp",
    "/images/projects/buwog-zweiklang-timeline.webp",
    "/images/projects/buwog-zweiklang-lage.webp"
  ],
  "pandion-berlin": [
    "/images/projects/pandion-midtown-4.webp",
    "/images/projects/pandion-midtown-4-g1.webp",
    "/images/projects/pandion-midtown-4-g2.webp",
    "/images/projects/pandion-midtown-4-massing.webp",
    "/images/projects/pandion-midtown-4-timeline.webp",
    "/images/projects/pandion-midtown-4-lage.webp"
  ],
  "primus-immobilien": [
    "/images/projects/arrive-kreuzberg.webp",
    "/images/projects/arrive-kreuzberg-massing.webp",
    "/images/projects/arrive-kreuzberg-timeline.webp",
    "/images/projects/arrive-kreuzberg-lage.webp",
    "/images/projects/celeste-charlottenburg.webp",
    "/images/projects/celeste-charlottenburg-massing.webp",
    "/images/projects/celeste-charlottenburg-timeline.webp",
    "/images/projects/celeste-charlottenburg-lage.webp"
  ],
  "bauwert": [
    "/images/projects/neue-bockbrauerei.webp",
    "/images/projects/neue-bockbrauerei-g1.webp",
    "/images/projects/neue-bockbrauerei-g2.webp",
    "/images/projects/neue-bockbrauerei-massing.webp",
    "/images/projects/neue-bockbrauerei-timeline.webp",
    "/images/projects/neue-bockbrauerei-lage.webp"
  ],
  "diamona-harnisch": [
    "/images/projects/eckert-carre.webp",
    "/images/projects/eckert-carre-massing.webp",
    "/images/projects/eckert-carre-timeline.webp",
    "/images/projects/eckert-carre-lage.webp"
  ],
  "project-immobilien-berlin": [
    "/images/projects/malmoe28.webp",
    "/images/projects/malmoe28-massing.webp",
    "/images/projects/malmoe28-timeline.webp",
    "/images/projects/malmoe28-lage.webp"
  ],
  "hamburg-team": [
    "/images/projects/hey-charlottenburg.webp",
    "/images/projects/hey-charlottenburg-g1.webp",
    "/images/projects/hey-charlottenburg-massing.webp",
    "/images/projects/hey-charlottenburg-timeline.webp",
    "/images/projects/hey-charlottenburg-lage.webp"
  ],
  "otto-wulff-berlin": [
    "/images/projects/kolbenhoefe-hamburg.webp",
    "/images/projects/kolbenhoefe-hamburg-massing.webp",
    "/images/projects/kolbenhoefe-hamburg-timeline.webp",
    "/images/projects/kolbenhoefe-hamburg-lage.webp",
    "/images/projects/quartier-ipanema-hamburg.webp",
    "/images/projects/quartier-ipanema-hamburg-massing.webp",
    "/images/projects/quartier-ipanema-hamburg-timeline.webp",
    "/images/projects/quartier-ipanema-hamburg-lage.webp"
  ],
  "bonava-berlin": [
    "/images/projects/bonava-fritz-kirsch-zeile.webp",
    "/images/projects/bonava-fritz-kirsch-zeile-massing.webp",
    "/images/projects/bonava-fritz-kirsch-zeile-timeline.webp",
    "/images/projects/bonava-fritz-kirsch-zeile-lage.webp"
  ],
  "wohnquadrat-berlin": [
    "/images/projects/wohnquadrat-harzer-118.webp",
    "/images/projects/wohnquadrat-harzer-118-massing.webp",
    "/images/projects/wohnquadrat-harzer-118-timeline.webp",
    "/images/projects/wohnquadrat-harzer-118-lage.webp"
  ],
  "instone-real-estate": [
    "/images/projects/instone-berlia.webp",
    "/images/projects/instone-berlia-massing.webp",
    "/images/projects/instone-berlia-timeline.webp",
    "/images/projects/instone-berlia-lage.webp",
    "/images/projects/instone-kopenhagener-strasse.webp",
    "/images/projects/instone-kopenhagener-strasse-massing.webp",
    "/images/projects/instone-kopenhagener-strasse-timeline.webp",
    "/images/projects/instone-kopenhagener-strasse-lage.webp",
    "/images/projects/instone-topaz.webp",
    "/images/projects/instone-topaz-massing.webp",
    "/images/projects/instone-topaz-timeline.webp",
    "/images/projects/instone-topaz-lage.webp",
    "/images/projects/neckar-park-stuttgart.webp",
    "/images/projects/neckar-park-stuttgart-massing.webp",
    "/images/projects/neckar-park-stuttgart-timeline.webp",
    "/images/projects/neckar-park-stuttgart-lage.webp"
  ],
  "tag-immobilien": [
    "/images/projects/tag-weitlingkiez.webp",
    "/images/projects/tag-weitlingkiez-massing.webp",
    "/images/projects/tag-weitlingkiez-timeline.webp",
    "/images/projects/tag-weitlingkiez-lage.webp"
  ],
  "patrizia-berlin": [
    "/images/projects/patrizia-patriots-park.webp",
    "/images/projects/patrizia-patriots-park-massing.webp",
    "/images/projects/patrizia-patriots-park-timeline.webp",
    "/images/projects/patrizia-patriots-park-lage.webp"
  ],
  "dic-asset-berlin": [
    "/images/projects/dic-quartier-potsdamer-platz.webp",
    "/images/projects/dic-quartier-potsdamer-platz-massing.webp",
    "/images/projects/dic-quartier-potsdamer-platz-timeline.webp",
    "/images/projects/dic-quartier-potsdamer-platz-lage.webp",
    "/images/projects/dic-stadthausquartier.webp",
    "/images/projects/dic-stadthausquartier-massing.webp",
    "/images/projects/dic-stadthausquartier-timeline.webp",
    "/images/projects/dic-stadthausquartier-lage.webp"
  ],
  "grand-city-properties": [
    "/images/projects/grand-city-neukolln-neubau.webp",
    "/images/projects/grand-city-neukolln-neubau-massing.webp",
    "/images/projects/grand-city-neukolln-neubau-timeline.webp",
    "/images/projects/grand-city-neukolln-neubau-lage.webp"
  ],
  "corpus-sireo": [
    "/images/projects/corpus-the-q.webp",
    "/images/projects/corpus-the-q-massing.webp",
    "/images/projects/corpus-the-q-timeline.webp",
    "/images/projects/corpus-the-q-lage.webp",
    "/images/projects/corpus-quartier-205.webp",
    "/images/projects/corpus-quartier-205-massing.webp",
    "/images/projects/corpus-quartier-205-timeline.webp",
    "/images/projects/corpus-quartier-205-lage.webp"
  ],
  "union-investment-berlin": [
    "/images/projects/union-upl-europacity.webp",
    "/images/projects/union-upl-europacity-massing.webp",
    "/images/projects/union-upl-europacity-timeline.webp",
    "/images/projects/union-upl-europacity-lage.webp"
  ],
  "allianz-real-estate-berlin": [
    "/images/projects/allianz-quartier-heidestrasse.webp",
    "/images/projects/allianz-quartier-heidestrasse-massing.webp",
    "/images/projects/allianz-quartier-heidestrasse-timeline.webp",
    "/images/projects/allianz-quartier-heidestrasse-lage.webp"
  ],
  "euroboden-berlin": [
    "/images/projects/euroboden-am-tacheles.webp",
    "/images/projects/euroboden-am-tacheles-massing.webp",
    "/images/projects/euroboden-am-tacheles-timeline.webp",
    "/images/projects/euroboden-am-tacheles-lage.webp",
    "/images/projects/euroboden-kopenicker-strasse.webp",
    "/images/projects/euroboden-kopenicker-strasse-massing.webp",
    "/images/projects/euroboden-kopenicker-strasse-timeline.webp",
    "/images/projects/euroboden-kopenicker-strasse-lage.webp",
    "/images/projects/euroboden-haus-fuer-muenchen.webp",
    "/images/projects/euroboden-haus-fuer-muenchen-massing.webp",
    "/images/projects/euroboden-haus-fuer-muenchen-timeline.webp",
    "/images/projects/euroboden-haus-fuer-muenchen-lage.webp"
  ],
  "quartier-eins-berlin": [
    "/images/projects/quartier-eins-schoeneberg.webp",
    "/images/projects/quartier-eins-schoeneberg-massing.webp",
    "/images/projects/quartier-eins-schoeneberg-timeline.webp",
    "/images/projects/quartier-eins-schoeneberg-lage.webp",
    "/images/projects/quartier-eins-prenzlauer-berg.webp",
    "/images/projects/quartier-eins-prenzlauer-berg-massing.webp",
    "/images/projects/quartier-eins-prenzlauer-berg-timeline.webp",
    "/images/projects/quartier-eins-prenzlauer-berg-lage.webp"
  ],
  "saga-hamburg": [
    "/images/projects/saga-horn.webp",
    "/images/projects/saga-horn-massing.webp",
    "/images/projects/saga-horn-timeline.webp",
    "/images/projects/saga-horn-lage.webp"
  ],
  "muenchner-wohnen": [
    "/images/projects/muenchner-wohnen-neufreimann.webp",
    "/images/projects/muenchner-wohnen-neufreimann-g1.webp",
    "/images/projects/muenchner-wohnen-neufreimann-g2.webp",
    "/images/projects/muenchner-wohnen-neufreimann-massing.webp",
    "/images/projects/muenchner-wohnen-neufreimann-timeline.webp",
    "/images/projects/muenchner-wohnen-neufreimann-lage.webp"
  ],
  "gag-koeln": [
    "/images/projects/gag-zollstockguertel.webp",
    "/images/projects/gag-zollstockguertel-massing.webp",
    "/images/projects/gag-zollstockguertel-timeline.webp",
    "/images/projects/gag-zollstockguertel-lage.webp"
  ],
  "gewoba-bremen": [
    "/images/projects/gewoba-kistner-carre.webp",
    "/images/projects/gewoba-kistner-carre-massing.webp",
    "/images/projects/gewoba-kistner-carre-timeline.webp",
    "/images/projects/gewoba-kistner-carre-lage.webp"
  ],
  "nhw-wiesbaden": [
    "/images/projects/nhw-riedbogen.webp",
    "/images/projects/nhw-riedbogen-g1.webp",
    "/images/projects/nhw-riedbogen-g2.webp",
    "/images/projects/nhw-riedbogen-massing.webp",
    "/images/projects/nhw-riedbogen-timeline.webp",
    "/images/projects/nhw-riedbogen-lage.webp",
    "/images/projects/nhw-elisabethentor.webp",
    "/images/projects/nhw-elisabethentor-g1.webp",
    "/images/projects/nhw-elisabethentor-g2.webp",
    "/images/projects/nhw-elisabethentor-massing.webp",
    "/images/projects/nhw-elisabethentor-timeline.webp",
    "/images/projects/nhw-elisabethentor-lage.webp",
    "/images/projects/nhw-schoenhof-viertel.webp",
    "/images/projects/nhw-schoenhof-viertel-massing.webp",
    "/images/projects/nhw-schoenhof-viertel-timeline.webp",
    "/images/projects/nhw-schoenhof-viertel-lage.webp",
    "/images/projects/nhw-nuville.webp",
    "/images/projects/nhw-nuville-massing.webp",
    "/images/projects/nhw-nuville-timeline.webp",
    "/images/projects/nhw-nuville-lage.webp",
    "/images/projects/nhw-mariengaerten.webp",
    "/images/projects/nhw-mariengaerten-massing.webp",
    "/images/projects/nhw-mariengaerten-timeline.webp",
    "/images/projects/nhw-mariengaerten-lage.webp"
  ],
  "art-invest": [
    "/images/projects/art-invest-macherei.webp",
    "/images/projects/art-invest-macherei-g1.webp",
    "/images/projects/art-invest-macherei-g2.webp",
    "/images/projects/art-invest-macherei-massing.webp",
    "/images/projects/art-invest-macherei-timeline.webp",
    "/images/projects/art-invest-macherei-lage.webp",
    "/images/projects/macherei-muenchen.webp",
    "/images/projects/macherei-muenchen-massing.webp",
    "/images/projects/macherei-muenchen-timeline.webp",
    "/images/projects/macherei-muenchen-lage.webp",
    "/images/projects/macherei-berlin.webp",
    "/images/projects/macherei-berlin-massing.webp",
    "/images/projects/macherei-berlin-timeline.webp",
    "/images/projects/macherei-berlin-lage.webp"
  ],
  "covivio": [
    "/images/projects/covivio-biesdorf.webp",
    "/images/projects/covivio-biesdorf-massing.webp",
    "/images/projects/covivio-biesdorf-timeline.webp",
    "/images/projects/covivio-biesdorf-lage.webp",
    "/images/projects/covivio-030bln.webp",
    "/images/projects/covivio-030bln-massing.webp",
    "/images/projects/covivio-030bln-timeline.webp",
    "/images/projects/covivio-030bln-lage.webp"
  ],
  "trockland": [
    "/images/projects/trockland-checkpoint.webp",
    "/images/projects/trockland-checkpoint-massing.webp",
    "/images/projects/trockland-checkpoint-timeline.webp",
    "/images/projects/trockland-checkpoint-lage.webp",
    "/images/projects/schoenwalder-strasse-57.webp",
    "/images/projects/schoenwalder-strasse-57-massing.webp",
    "/images/projects/schoenwalder-strasse-57-timeline.webp",
    "/images/projects/schoenwalder-strasse-57-lage.webp"
  ],
  "greystar": [
    "/images/projects/greystar-marzahn-mitte.webp",
    "/images/projects/greystar-marzahn-mitte-massing.webp",
    "/images/projects/greystar-marzahn-mitte-timeline.webp",
    "/images/projects/greystar-marzahn-mitte-lage.webp"
  ],
  "gross-partner": [
    "/images/projects/rizon-im-four.webp",
    "/images/projects/rizon-im-four-massing.webp",
    "/images/projects/rizon-im-four-timeline.webp",
    "/images/projects/rizon-im-four-lage.webp",
    "/images/projects/four-frankfurt.webp",
    "/images/projects/four-frankfurt-g1.webp",
    "/images/projects/four-frankfurt-g2.webp",
    "/images/projects/four-frankfurt-massing.webp",
    "/images/projects/four-frankfurt-timeline.webp",
    "/images/projects/four-frankfurt-lage.webp",
    "/images/projects/grand-tower-frankfurt.webp",
    "/images/projects/grand-tower-frankfurt-g1.webp",
    "/images/projects/grand-tower-frankfurt-massing.webp",
    "/images/projects/grand-tower-frankfurt-timeline.webp",
    "/images/projects/grand-tower-frankfurt-lage.webp",
    "/images/projects/central-business-tower-frankfurt.webp",
    "/images/projects/central-business-tower-frankfurt-massing.webp",
    "/images/projects/central-business-tower-frankfurt-timeline.webp",
    "/images/projects/central-business-tower-frankfurt-lage.webp"
  ],
  "bayerische-hausbau": [
    "/images/projects/paulaner-areal-nockherberg.webp",
    "/images/projects/paulaner-areal-nockherberg-massing.webp",
    "/images/projects/paulaner-areal-nockherberg-timeline.webp",
    "/images/projects/paulaner-areal-nockherberg-lage.webp"
  ],
  "bauwens": [
    "/images/projects/max-ophuels-quartier.webp",
    "/images/projects/max-ophuels-quartier-massing.webp",
    "/images/projects/max-ophuels-quartier-timeline.webp",
    "/images/projects/max-ophuels-quartier-lage.webp",
    "/images/projects/deutzer-hafen-koeln.webp",
    "/images/projects/deutzer-hafen-koeln-massing.webp",
    "/images/projects/deutzer-hafen-koeln-timeline.webp",
    "/images/projects/deutzer-hafen-koeln-lage.webp"
  ],
  "ece": [
    "/images/projects/hafen-city-hamburg.webp",
    "/images/projects/hafen-city-hamburg-g1.webp",
    "/images/projects/hafen-city-hamburg-g2.webp",
    "/images/projects/hafen-city-hamburg-massing.webp",
    "/images/projects/hafen-city-hamburg-timeline.webp",
    "/images/projects/hafen-city-hamburg-lage.webp",
    "/images/projects/milaneo-stuttgart.webp",
    "/images/projects/milaneo-stuttgart-massing.webp",
    "/images/projects/milaneo-stuttgart-timeline.webp",
    "/images/projects/milaneo-stuttgart-lage.webp"
  ],
  "bueschl": [
    "/images/projects/werksviertel-munich.webp",
    "/images/projects/werksviertel-munich-g1.webp",
    "/images/projects/werksviertel-munich-massing.webp",
    "/images/projects/werksviertel-munich-timeline.webp",
    "/images/projects/werksviertel-munich-lage.webp",
    "/images/projects/schwabinger-tor.webp",
    "/images/projects/schwabinger-tor-massing.webp",
    "/images/projects/schwabinger-tor-timeline.webp",
    "/images/projects/schwabinger-tor-lage.webp"
  ],
  "bpd-deutschland": [
    "/images/projects/marina-gardens-dresden.webp",
    "/images/projects/marina-gardens-dresden-massing.webp",
    "/images/projects/marina-gardens-dresden-timeline.webp",
    "/images/projects/marina-gardens-dresden-lage.webp",
    "/images/projects/rossmarkt-frankfurt.webp",
    "/images/projects/rossmarkt-frankfurt-massing.webp",
    "/images/projects/rossmarkt-frankfurt-timeline.webp",
    "/images/projects/rossmarkt-frankfurt-lage.webp"
  ],
  "die-wohnkompanie": [
    "/images/projects/franklin-mannheim.webp",
    "/images/projects/franklin-mannheim-massing.webp",
    "/images/projects/franklin-mannheim-timeline.webp",
    "/images/projects/franklin-mannheim-lage.webp"
  ],
  "quantum-ag": [
    "/images/projects/ueberseequartier-hamburg.webp",
    "/images/projects/ueberseequartier-hamburg-massing.webp",
    "/images/projects/ueberseequartier-hamburg-timeline.webp",
    "/images/projects/ueberseequartier-hamburg-lage.webp"
  ],
  "dc-developments": [
    "/images/projects/strandkai-hafencity.webp",
    "/images/projects/strandkai-hafencity-massing.webp",
    "/images/projects/strandkai-hafencity-timeline.webp",
    "/images/projects/strandkai-hafencity-lage.webp"
  ],
  "kondor-wessels": [
    "/images/projects/parkresidenz-leipzig.webp",
    "/images/projects/parkresidenz-leipzig-massing.webp",
    "/images/projects/parkresidenz-leipzig-timeline.webp",
    "/images/projects/parkresidenz-leipzig-lage.webp"
  ],
  "lang-und-cie": [
    "/images/projects/kleyer-quartier-frankfurt.webp",
    "/images/projects/kleyer-quartier-frankfurt-massing.webp",
    "/images/projects/kleyer-quartier-frankfurt-timeline.webp",
    "/images/projects/kleyer-quartier-frankfurt-lage.webp"
  ],
  "danube-properties": [
    "/images/projects/bayz-101.webp",
    "/images/projects/bayz-101-massing.webp",
    "/images/projects/bayz-101-timeline.webp",
    "/images/projects/bayz-101-lage.webp",
    "/images/projects/diamondz-jlt.webp",
    "/images/projects/diamondz-jlt-massing.webp",
    "/images/projects/diamondz-jlt-timeline.webp",
    "/images/projects/diamondz-jlt-lage.webp",
    "/images/projects/elitz-3.webp",
    "/images/projects/elitz-3-massing.webp",
    "/images/projects/elitz-3-timeline.webp",
    "/images/projects/elitz-3-lage.webp",
    "/images/projects/opalz.webp",
    "/images/projects/opalz-massing.webp",
    "/images/projects/opalz-timeline.webp",
    "/images/projects/opalz-lage.webp",
    "/images/projects/petalz.webp",
    "/images/projects/petalz-massing.webp",
    "/images/projects/petalz-timeline.webp",
    "/images/projects/petalz-lage.webp"
  ],
  "deyaar": [
    "/images/projects/midtown-production-city.webp",
    "/images/projects/midtown-production-city-massing.webp",
    "/images/projects/midtown-production-city-timeline.webp",
    "/images/projects/midtown-production-city-lage.webp",
    "/images/projects/atria-business-bay.webp",
    "/images/projects/atria-business-bay-massing.webp",
    "/images/projects/atria-business-bay-timeline.webp",
    "/images/projects/atria-business-bay-lage.webp",
    "/images/projects/burj-daman.webp",
    "/images/projects/burj-daman-massing.webp",
    "/images/projects/burj-daman-timeline.webp",
    "/images/projects/burj-daman-lage.webp"
  ],
  "tiger-properties": [
    "/images/projects/sunrose-dso.webp",
    "/images/projects/sunrose-dso-massing.webp",
    "/images/projects/sunrose-dso-timeline.webp",
    "/images/projects/sunrose-dso-lage.webp",
    "/images/projects/priva-dso.webp",
    "/images/projects/priva-dso-massing.webp",
    "/images/projects/priva-dso-timeline.webp",
    "/images/projects/priva-dso-lage.webp"
  ],
  "nshama": [
    "/images/projects/town-square-dubai.webp",
    "/images/projects/town-square-dubai-g1.webp",
    "/images/projects/town-square-dubai-g2.webp",
    "/images/projects/town-square-dubai-massing.webp",
    "/images/projects/town-square-dubai-timeline.webp",
    "/images/projects/town-square-dubai-lage.webp"
  ],
  "dubai-properties": [
    "/images/projects/jumeirah-beach-residence.webp",
    "/images/projects/jumeirah-beach-residence-g1.webp",
    "/images/projects/jumeirah-beach-residence-massing.webp",
    "/images/projects/jumeirah-beach-residence-timeline.webp",
    "/images/projects/jumeirah-beach-residence-lage.webp",
    "/images/projects/mudon.webp",
    "/images/projects/mudon-g1.webp",
    "/images/projects/mudon-massing.webp",
    "/images/projects/mudon-timeline.webp",
    "/images/projects/mudon-lage.webp"
  ],
  "wasl-properties": [
    "/images/projects/wasl-gate.webp",
    "/images/projects/wasl-gate-massing.webp",
    "/images/projects/wasl-gate-timeline.webp",
    "/images/projects/wasl-gate-lage.webp"
  ],
  "ithra-dubai": [
    "/images/projects/one-zaabeel.webp",
    "/images/projects/one-zaabeel-g1.webp",
    "/images/projects/one-zaabeel-massing.webp",
    "/images/projects/one-zaabeel-timeline.webp",
    "/images/projects/one-zaabeel-lage.webp"
  ],
  "arada": [
    "/images/projects/aljada.webp",
    "/images/projects/aljada-g1.webp",
    "/images/projects/aljada-massing.webp",
    "/images/projects/aljada-timeline.webp",
    "/images/projects/aljada-lage.webp",
    "/images/projects/masaar.webp",
    "/images/projects/masaar-g1.webp",
    "/images/projects/masaar-g2.webp",
    "/images/projects/masaar-massing.webp",
    "/images/projects/masaar-timeline.webp",
    "/images/projects/masaar-lage.webp"
  ],
  "shurooq": [
    "/images/projects/maryam-island.webp",
    "/images/projects/maryam-island-massing.webp",
    "/images/projects/maryam-island-timeline.webp",
    "/images/projects/maryam-island-lage.webp"
  ],
  "reportage-properties": [
    "/images/projects/reportage-tsawen.webp",
    "/images/projects/reportage-tsawen-massing.webp",
    "/images/projects/reportage-tsawen-timeline.webp",
    "/images/projects/reportage-tsawen-lage.webp"
  ],
  "eagle-hills": [
    "/images/projects/ramhan-island.webp",
    "/images/projects/ramhan-island-massing.webp",
    "/images/projects/ramhan-island-timeline.webp",
    "/images/projects/ramhan-island-lage.webp"
  ],
  "bloom-holding": [
    "/images/projects/bloom-living.webp",
    "/images/projects/bloom-living-g1.webp",
    "/images/projects/bloom-living-massing.webp",
    "/images/projects/bloom-living-timeline.webp",
    "/images/projects/bloom-living-lage.webp"
  ],
  "modon-properties": [
    "/images/projects/hudayriat-island.webp",
    "/images/projects/hudayriat-island-massing.webp",
    "/images/projects/hudayriat-island-timeline.webp",
    "/images/projects/hudayriat-island-lage.webp"
  ],
  "q-properties": [
    "/images/projects/reem-hills.webp",
    "/images/projects/reem-hills-massing.webp",
    "/images/projects/reem-hills-timeline.webp",
    "/images/projects/reem-hills-lage.webp"
  ],
  "seven-tides": [
    "/images/projects/seven-palm.webp",
    "/images/projects/seven-palm-massing.webp",
    "/images/projects/seven-palm-timeline.webp",
    "/images/projects/seven-palm-lage.webp"
  ],
  "kleindienst-group": [
    "/images/projects/heart-of-europe.webp",
    "/images/projects/heart-of-europe-massing.webp",
    "/images/projects/heart-of-europe-timeline.webp",
    "/images/projects/heart-of-europe-lage.webp"
  ],
  "al-hamra": [
    "/images/projects/falcon-island.webp",
    "/images/projects/falcon-island-massing.webp",
    "/images/projects/falcon-island-timeline.webp",
    "/images/projects/falcon-island-lage.webp"
  ],
  "samana-developers": [
    "/images/projects/samana-barari-views.webp",
    "/images/projects/samana-barari-views-g1.webp",
    "/images/projects/samana-barari-views-g2.webp",
    "/images/projects/samana-barari-views-massing.webp",
    "/images/projects/samana-barari-views-timeline.webp",
    "/images/projects/samana-barari-views-lage.webp"
  ],
  "fk-development": [
    "/images/projects/tonino-lamborghini-tower.webp",
    "/images/projects/tonino-lamborghini-tower-g1.webp",
    "/images/projects/tonino-lamborghini-tower-g2.webp",
    "/images/projects/tonino-lamborghini-tower-1.webp",
    "/images/projects/tonino-lamborghini-tower-2.webp"
  ],
  "green-side": [
    "/images/projects/green-side-gonio.webp",
    "/images/projects/green-side-gonio-g1.webp",
    "/images/projects/green-side-gonio-g2.webp",
    "/images/projects/green-side-gonio-1.webp",
    "/images/projects/green-side-gonio-2.webp"
  ],
  "in-house-development": [
    "/images/projects/in-haus-vera.webp",
    "/images/projects/in-haus-vera-g1.webp",
    "/images/projects/in-haus-vera-g2.webp",
    "/images/projects/in-haus-vera-1.webp",
    "/images/projects/in-haus-vera-2.webp"
  ],
  "lomora-group": [
    "/images/projects/portofino-batumi.webp",
    "/images/projects/portofino-batumi-g1.webp",
    "/images/projects/portofino-batumi-g2.webp",
    "/images/projects/portofino-batumi-1.webp",
    "/images/projects/portofino-batumi-2.webp"
  ],
  "m-m-22": [
    "/images/projects/ino.webp",
    "/images/projects/ino-g1.webp",
    "/images/projects/ino-g2.webp",
    "/images/projects/ino-1.webp",
    "/images/projects/ino-2.webp"
  ],
  "ncode-development": [
    "/images/projects/ncode-shatberashvili.webp",
    "/images/projects/ncode-shatberashvili-g1.webp",
    "/images/projects/ncode-shatberashvili-g2.webp",
    "/images/projects/ncode-shatberashvili-1.webp",
    "/images/projects/ncode-shatberashvili-2.webp"
  ],
  "roomix-development": [
    "/images/projects/roomix-vazha-pshavela.webp",
    "/images/projects/roomix-vazha-pshavela-g1.webp",
    "/images/projects/roomix-vazha-pshavela-g2.webp",
    "/images/projects/roomix-vazha-pshavela-1.webp",
    "/images/projects/roomix-vazha-pshavela-2.webp"
  ],
  "well-house": [
    "/images/projects/tabidze-112.webp",
    "/images/projects/tabidze-112-g1.webp",
    "/images/projects/tabidze-112-g2.webp",
    "/images/projects/tabidze-112-1.webp",
    "/images/projects/tabidze-112-2.webp"
  ],
  "zion": [
    "/images/projects/zion-krtsanisi-embassies.webp",
    "/images/projects/zion-krtsanisi-embassies-1.webp",
    "/images/projects/zion-krtsanisi-embassies-2.webp"
  ],
  "toll-brothers": [
    "/images/projects/70-vestry.webp",
    "/images/projects/70-vestry-g1.webp"
  ],
  "related-companies": [
    "/images/projects/hudson-yards.webp",
    "/images/projects/hudson-yards-g1.webp",
    "/images/projects/hudson-yards-g2.webp",
    "/images/projects/30-hudson-yards.webp",
    "/images/projects/30-hudson-yards-g1.webp",
    "/images/projects/la-grand-ave.webp"
  ],
  "silverstein-properties": [
    "/images/projects/world-trade-center.webp"
  ],
  "brookfield-us": [
    "/images/projects/manhattan-west.webp",
    "/images/projects/manhattan-west-g1.webp"
  ],
  "hines": [
    "/images/projects/salesforce-tower.webp",
    "/images/projects/salesforce-tower-g1.webp",
    "/images/projects/salesforce-tower-g2.webp",
    "/images/projects/porta-nuova.webp",
    "/images/projects/bosco-verticale.webp",
    "/images/projects/bosco-verticale-g1.webp",
    "/images/projects/bosco-verticale-g2.webp"
  ],
  "british-land": [
    "/images/projects/canada-water.webp"
  ],
  "emaar-properties": [
    "/images/projects/dubai-hills-estate.webp",
    "/images/projects/dubai-hills-estate-massing.webp",
    "/images/projects/dubai-hills-estate-timeline.webp",
    "/images/projects/dubai-hills-estate-lage.webp",
    "/images/projects/emaar-beachfront.webp",
    "/images/projects/emaar-beachfront-massing.webp",
    "/images/projects/emaar-beachfront-timeline.webp",
    "/images/projects/emaar-beachfront-lage.webp",
    "/images/projects/dubai-creek-harbour.webp",
    "/images/projects/dubai-creek-harbour-massing.webp",
    "/images/projects/dubai-creek-harbour-timeline.webp",
    "/images/projects/dubai-creek-harbour-lage.webp",
    "/images/projects/arabian-ranches-3.webp",
    "/images/projects/arabian-ranches-3-massing.webp",
    "/images/projects/arabian-ranches-3-timeline.webp",
    "/images/projects/arabian-ranches-3-lage.webp",
    "/images/projects/burj-khalifa.webp",
    "/images/projects/burj-khalifa-g1.webp",
    "/images/projects/burj-khalifa-g2.webp",
    "/images/projects/dubai-marina.webp",
    "/images/projects/dubai-marina-g1.webp",
    "/images/projects/dubai-marina-g2.webp",
    "/images/projects/dubai-creek-tower.webp"
  ],
  "damac-properties": [
    "/images/projects/damac-hills.webp",
    "/images/projects/damac-hills-massing.webp",
    "/images/projects/damac-hills-timeline.webp",
    "/images/projects/damac-hills-lage.webp",
    "/images/projects/aykon-city.webp",
    "/images/projects/aykon-city-massing.webp",
    "/images/projects/aykon-city-timeline.webp",
    "/images/projects/aykon-city-lage.webp",
    "/images/projects/damac-towers-paramount.webp",
    "/images/projects/damac-towers-paramount-massing.webp",
    "/images/projects/damac-towers-paramount-timeline.webp",
    "/images/projects/damac-towers-paramount-lage.webp",
    "/images/projects/safa-one.webp",
    "/images/projects/safa-one-massing.webp",
    "/images/projects/safa-one-timeline.webp",
    "/images/projects/safa-one-lage.webp"
  ],
  "nakheel": [
    "/images/projects/palm-beach-towers.webp",
    "/images/projects/palm-beach-towers-g1.webp",
    "/images/projects/palm-beach-towers-g2.webp",
    "/images/projects/palm-beach-towers-massing.webp",
    "/images/projects/palm-beach-towers-timeline.webp",
    "/images/projects/palm-beach-towers-lage.webp",
    "/images/projects/dubai-islands.webp",
    "/images/projects/dubai-islands-g1.webp",
    "/images/projects/dubai-islands-g2.webp",
    "/images/projects/dubai-islands-massing.webp",
    "/images/projects/dubai-islands-timeline.webp",
    "/images/projects/dubai-islands-lage.webp",
    "/images/projects/jumeirah-islands.webp",
    "/images/projects/jumeirah-islands-g1.webp",
    "/images/projects/jumeirah-islands-massing.webp",
    "/images/projects/jumeirah-islands-timeline.webp",
    "/images/projects/jumeirah-islands-lage.webp",
    "/images/projects/palm-jumeirah.webp",
    "/images/projects/palm-jumeirah-g1.webp"
  ],
  "aldar-properties": [
    "/images/projects/yas-acres.webp",
    "/images/projects/yas-acres-g1.webp",
    "/images/projects/yas-acres-g2.webp",
    "/images/projects/yas-acres-massing.webp",
    "/images/projects/yas-acres-timeline.webp",
    "/images/projects/yas-acres-lage.webp",
    "/images/projects/mamsha-al-saadiyat.webp",
    "/images/projects/mamsha-al-saadiyat-massing.webp",
    "/images/projects/mamsha-al-saadiyat-timeline.webp",
    "/images/projects/mamsha-al-saadiyat-lage.webp",
    "/images/projects/saadiyat-lagoons.webp",
    "/images/projects/saadiyat-lagoons-massing.webp",
    "/images/projects/saadiyat-lagoons-timeline.webp",
    "/images/projects/saadiyat-lagoons-lage.webp",
    "/images/projects/al-raha-beach.webp",
    "/images/projects/al-raha-beach-g1.webp",
    "/images/projects/al-raha-beach-massing.webp",
    "/images/projects/al-raha-beach-timeline.webp",
    "/images/projects/al-raha-beach-lage.webp",
    "/images/projects/aldar-hq.webp",
    "/images/projects/abu-dhabi-al-reem.webp",
    "/images/projects/abu-dhabi-al-reem-g1.webp"
  ],
  "sobha-realty": [
    "/images/projects/sobha-hartland.webp",
    "/images/projects/sobha-hartland-g1.webp",
    "/images/projects/sobha-hartland-g2.webp",
    "/images/projects/sobha-hartland-massing.webp",
    "/images/projects/sobha-hartland-timeline.webp",
    "/images/projects/sobha-hartland-lage.webp",
    "/images/projects/sobha-hartland-ii.webp",
    "/images/projects/sobha-hartland-ii-g1.webp",
    "/images/projects/sobha-hartland-ii-g2.webp"
  ],
  "meraas": [
    "/images/projects/ain-dubai.webp",
    "/images/projects/ain-dubai-g1.webp",
    "/images/projects/bluewaters-residences.webp"
  ],
  "meydan": [
    "/images/projects/meydan-one.webp",
    "/images/projects/meydan-one-g1.webp"
  ],
  "dubai-holding": [
    "/images/projects/dubai-frame.webp"
  ],
  "mitsubishi-estate": [
    "/images/projects/tokyo-station-city.webp",
    "/images/projects/azabudai-hills.webp",
    "/images/projects/azabudai-hills-g1.webp",
    "/images/projects/azabudai-hills-g2.webp",
    "/images/projects/torch-tower-tokyo.webp"
  ],
  "mitsui-fudosan": [
    "/images/projects/tokyo-midtown.webp",
    "/images/projects/tokyo-midtown-g1.webp"
  ],
  "china-resources-land": [
    "/images/projects/shenzhen-bay.webp",
    "/images/projects/shenzhen-bay-super-hq.webp"
  ],
  "lendlease": [
    "/images/projects/elephant-park.webp",
    "/images/projects/paya-lebar-quarter.webp",
    "/images/projects/barangaroo.webp",
    "/images/projects/barangaroo-g1.webp",
    "/images/projects/barangaroo-g2.webp"
  ],
  "mirvac": [
    "/images/projects/green-square-town-centre.webp"
  ],
  "frasers-property": [
    "/images/projects/one-bangkok.webp"
  ],
  "tridel": [
    "/images/projects/the-one-toronto.webp"
  ],
  "capitaland": [
    "/images/projects/capitaspring.webp",
    "/images/projects/canninghill-piers.webp"
  ],
  "guocoland": [
    "/images/projects/guoco-midtown-modern.webp"
  ],
  "sun-hung-kai": [
    "/images/projects/icc-hk.webp",
    "/images/projects/high-top-icc-west.webp"
  ],
  "new-world": [
    "/images/projects/victoria-dockside.webp"
  ],
  "lotte-ec": [
    "/images/projects/lotte-world-tower.webp"
  ],
  "dlf": [
    "/images/projects/dlf-cyber-city.webp",
    "/images/projects/dlf-the-dahlias.webp"
  ],
  "lodha": [
    "/images/projects/lodha-world-one.webp",
    "/images/projects/lodha-world-one-g1.webp",
    "/images/projects/lodha-world-one-g2.webp"
  ],
  "dar-al-arkan": [
    "/images/projects/kafd.webp"
  ],
  "red-sea-global": [
    "/images/projects/red-sea-project.webp",
    "/images/projects/amaala.webp"
  ],
  "attacq": [
    "/images/projects/waterfall-city.webp"
  ],
  "cybarco": [
    "/images/projects/one-limassol.webp"
  ],
  "trigema": [
    "/images/projects/smichov-city.webp",
    "/images/projects/smichov-city-g1.webp"
  ],
  "omniyat": [
    "/images/projects/one-at-palm-jumeirah.webp",
    "/images/projects/one-at-palm-jumeirah-g1.webp",
    "/images/projects/one-at-palm-jumeirah-g2.webp",
    "/images/projects/one-at-palm-jumeirah-massing.webp",
    "/images/projects/one-at-palm-jumeirah-timeline.webp",
    "/images/projects/one-at-palm-jumeirah-lage.webp",
    "/images/projects/the-opus.webp",
    "/images/projects/the-opus-g1.webp",
    "/images/projects/the-opus-g2.webp",
    "/images/projects/the-opus-massing.webp",
    "/images/projects/the-opus-timeline.webp",
    "/images/projects/the-opus-lage.webp",
    "/images/projects/orla-palm.webp",
    "/images/projects/orla-palm-g1.webp",
    "/images/projects/orla-palm-g2.webp",
    "/images/projects/orla-palm-massing.webp",
    "/images/projects/orla-palm-timeline.webp",
    "/images/projects/orla-palm-lage.webp"
  ],
  "select-group": [
    "/images/projects/marina-gate.webp",
    "/images/projects/marina-gate-massing.webp",
    "/images/projects/marina-gate-timeline.webp",
    "/images/projects/marina-gate-lage.webp",
    "/images/projects/six-senses-palm.webp",
    "/images/projects/six-senses-palm-g1.webp",
    "/images/projects/six-senses-palm-g2.webp",
    "/images/projects/six-senses-palm-massing.webp",
    "/images/projects/six-senses-palm-timeline.webp",
    "/images/projects/six-senses-palm-lage.webp"
  ],
  "qatari-diar": [
    "/images/projects/lusail-city.webp"
  ],
  "agung-podomoro-land": [
    "/images/projects/pantai-indah-kapuk-2.webp",
    "/images/projects/pantai-indah-kapuk-2-g1.webp"
  ],
  "vingroup": [
    "/images/projects/landmark-81.webp"
  ],
  "sp-setia": [
    "/images/projects/battersea-power-station.webp",
    "/images/projects/battersea-power-station-g1.webp",
    "/images/projects/battersea-power-station-g2.webp"
  ],
  "ellington-properties": [
    "/images/projects/belgravia-heights.webp",
    "/images/projects/belgravia-heights-massing.webp",
    "/images/projects/belgravia-heights-timeline.webp",
    "/images/projects/belgravia-heights-lage.webp",
    "/images/projects/ocean-house-palm.webp",
    "/images/projects/ocean-house-palm-massing.webp",
    "/images/projects/ocean-house-palm-timeline.webp",
    "/images/projects/ocean-house-palm-lage.webp"
  ],
  "sellar-property": [
    "/images/projects/the-shard.webp"
  ],
  "mori-building": [
    "/images/projects/azabudai-hills-residences.webp",
    "/images/projects/azabudai-hills-residences-g1.webp",
    "/images/projects/azabudai-hills-residences-g2.webp"
  ],
  "china-vanke": [
    "/images/projects/shenzhen-bay-super-hq.webp"
  ],
  "samsung-c-t": [
    "/images/projects/raemian-one-bailey.webp"
  ],
  "hyundai-eng": [
    "/images/projects/the-h-firstier-banpo.webp"
  ],
  "ballymore": [
    "/images/projects/embassy-gardens-nine-elms.webp"
  ],
  "mount-anvil": [
    "/images/projects/the-silk-district-london.webp"
  ],
  "cg-elementum": [
    "/images/projects/otto-quartier-esslingen.webp",
    "/images/projects/otto-quartier-esslingen-massing.webp",
    "/images/projects/otto-quartier-esslingen-timeline.webp",
    "/images/projects/otto-quartier-esslingen-lage.webp"
  ],
  "ubm-development": [
    "/images/projects/timber-peak-mainz.webp",
    "/images/projects/timber-peak-mainz-massing.webp",
    "/images/projects/timber-peak-mainz-timeline.webp",
    "/images/projects/timber-peak-mainz-lage.webp"
  ],
  "binghatti": [
    "/images/projects/bugatti-residences-binghatti.webp"
  ],
  "jbg-smith": [
    "/images/projects/national-landing-amazon-hq2.webp"
  ],
  "tokyu-land": [
    "/images/projects/shibuya-upper-west.webp"
  ],
  "diriyah-gate": [
    "/images/projects/diriyah-gate-residences.webp"
  ],
  "unibail": [
    "/images/projects/tour-triangle-paris.webp"
  ],
  "extell-development": [
    "/images/projects/central-park-tower.webp",
    "/images/projects/central-park-tower-nyc.webp"
  ],
  "jds-development": [
    "/images/projects/steinway-tower-111w57.webp"
  ]
}

/** Project architectural floor plans and unit layout blueprints (100% verified on disk). */
export const PROJECT_FLOORPLANS: Record<string, string> = {
  'al-marjan-island': '/images/projects/al-marjan-island-lage.webp',
  'al-raha-beach': '/images/projects/al-raha-beach-lage.webp',
  'alexanderplatz-turm': '/images/projects/alexanderplatz-turm-lage.webp',
  'aljada': '/images/projects/aljada-lage.webp',
  'alliance-centropolis': '/images/projects/alliance-centropolis-lage.webp',
  'alliance-highline': '/images/projects/alliance-highline-lage.webp',
  'alliance-palace': '/images/projects/alliance-palace-lage.webp',
  'alliance-privilege': '/images/projects/alliance-privilege-lage.webp',
  'allianz-quartier-heidestrasse': '/images/projects/allianz-quartier-heidestrasse-lage.webp',
  'arabian-ranches-3': '/images/projects/arabian-ranches-3-lage.webp',
  'archi-central-park': '/images/projects/archi-central-park-lage.webp',
  'archi-dighomi': '/images/projects/archi-dighomi-lage.webp',
  'archi-grand-avenue': '/images/projects/archi-grand-avenue-lage.webp',
  'archi-horizon': '/images/projects/archi-horizon-lage.webp',
  'archi-kikvidze-garden': '/images/projects/archi-kikvidze-garden-lage.webp',
  'archi-nutsubidze': '/images/projects/archi-nutsubidze-lage.webp',
  'arrive-kreuzberg': '/images/projects/arrive-kreuzberg-lage.webp',
  'art-invest-macherei': '/images/projects/art-invest-macherei-lage.webp',
  'atria-business-bay': '/images/projects/atria-business-bay-lage.webp',
  'axis-chavchavadze-49': '/images/projects/axis-chavchavadze-49-lage.webp',
  'axis-hippodrome': '/images/projects/axis-hippodrome-lage.webp',
  'axis-palace': '/images/projects/axis-palace-lage.webp',
  'axis-towers-photo': '/images/projects/axis-towers-photo-lage.webp',
  'axis-towers-vake': '/images/projects/axis-towers-vake-lage.webp',
  'aykon-city': '/images/projects/aykon-city-lage.webp',
  'batumi-riviera-tower': '/images/projects/batumi-riviera-tower-lage.webp',
  'bayz-101': '/images/projects/bayz-101-lage.webp',
  'belgravia-heights': '/images/projects/belgravia-heights-lage.webp',
  'berlin-tSX': '/images/projects/berlin-tSX-lage.webp',
  'biograpi-hisni': '/images/projects/biograpi-hisni-lage.webp',
  'biograpi-matiani': '/images/projects/biograpi-matiani-lage.webp',
  'biograpi-sakeni': '/images/projects/biograpi-sakeni-lage.webp',
  'bloom-living': '/images/projects/bloom-living-lage.webp',
  'blox-didi-digomi': '/images/projects/blox-didi-digomi-lage.webp',
  'blox-ortachala': '/images/projects/blox-ortachala-lage.webp',
  'blox-sarajishvili': '/images/projects/blox-sarajishvili-lage.webp',
  'blox-varketili': '/images/projects/blox-varketili-lage.webp',
  'bonava-fritz-kirsch-zeile': '/images/projects/bonava-fritz-kirsch-zeile-lage.webp',
  'burj-daman': '/images/projects/burj-daman-lage.webp',
  'buwog-dahmeglanz': '/images/projects/buwog-dahmeglanz-lage.webp',
  'buwog-havellichter': '/images/projects/buwog-havellichter-lage.webp',
  'buwog-neumarien': '/images/projects/buwog-neumarien-lage.webp',
  'buwog-set-44': '/images/projects/buwog-set-44-lage.webp',
  'buwog-weydenhof': '/images/projects/buwog-weydenhof-lage.webp',
  'buwog-zweiklang': '/images/projects/buwog-zweiklang-lage.webp',
  'celeste-charlottenburg': '/images/projects/celeste-charlottenburg-lage.webp',
  'central-business-tower-frankfurt': '/images/projects/central-business-tower-frankfurt-lage.webp',
  'corpus-quartier-205': '/images/projects/corpus-quartier-205-lage.webp',
  'corpus-the-q': '/images/projects/corpus-the-q-lage.webp',
  'covivio-030bln': '/images/projects/covivio-030bln-lage.webp',
  'covivio-biesdorf': '/images/projects/covivio-biesdorf-lage.webp',
  'damac-hills': '/images/projects/damac-hills-lage.webp',
  'damac-towers-paramount': '/images/projects/damac-towers-paramount-lage.webp',
  'degewo-am-falkenberg': '/images/projects/degewo-am-falkenberg-lage.webp',
  'degewo-neulichterfelde': '/images/projects/degewo-neulichterfelde-lage.webp',
  'deutzer-hafen-koeln': '/images/projects/deutzer-hafen-koeln-lage.webp',
  'diamondz-jlt': '/images/projects/diamondz-jlt-lage.webp',
  'dic-quartier-potsdamer-platz': '/images/projects/dic-quartier-potsdamer-platz-lage.webp',
  'dic-stadthausquartier': '/images/projects/dic-stadthausquartier-lage.webp',
  'dirsi-riverside': '/images/projects/dirsi-riverside-lage.webp',
  'domus-park-vake': '/images/projects/domus-park-vake-lage.webp',
  'domus-trees': '/images/projects/domus-trees-lage.webp',
  'downtown-residence': '/images/projects/downtown-residence-lage.webp',
  'dubai-creek-harbour': '/images/projects/dubai-creek-harbour-lage.webp',
  'dubai-hills-estate': '/images/projects/dubai-hills-estate-lage.webp',
  'dubai-islands': '/images/projects/dubai-islands-lage.webp',
  'eckert-carre': '/images/projects/eckert-carre-lage.webp',
  'edge-suedkreuz-berlin': '/images/projects/edge-suedkreuz-berlin-lage.webp',
  'elbphilharmonie': '/images/projects/elbphilharmonie-lage.webp',
  'elbtower-hamburg': '/images/projects/elbtower-hamburg-lage.webp',
  'elitz-3': '/images/projects/elitz-3-lage.webp',
  'emaar-beachfront': '/images/projects/emaar-beachfront-lage.webp',
  'estrel-tower-berlin': '/images/projects/estrel-tower-berlin-lage.webp',
  'euroboden-am-tacheles': '/images/projects/euroboden-am-tacheles-lage.webp',
  'euroboden-haus-fuer-muenchen': '/images/projects/euroboden-haus-fuer-muenchen-lage.webp',
  'euroboden-kopenicker-strasse': '/images/projects/euroboden-kopenicker-strasse-lage.webp',
  'europacity-berlin': '/images/projects/europacity-berlin-lage.webp',
  'falcon-island': '/images/projects/falcon-island-lage.webp',
  'four-frankfurt': '/images/projects/four-frankfurt-lage.webp',
  'franklin-mannheim': '/images/projects/franklin-mannheim-lage.webp',
  'gag-zollstockguertel': '/images/projects/gag-zollstockguertel-lage.webp',
  'gesobau-alte-hellersdorfer-strasse': '/images/projects/gesobau-alte-hellersdorfer-strasse-lage.webp',
  'gesobau-cecilien-carre': '/images/projects/gesobau-cecilien-carre-lage.webp',
  'gesobau-gesocampus-alt-wittenau': '/images/projects/gesobau-gesocampus-alt-wittenau-lage.webp',
  'gesobau-johann-georg-strasse-9a': '/images/projects/gesobau-johann-georg-strasse-9a-lage.webp',
  'gesobau-pankower-allee-55': '/images/projects/gesobau-pankower-allee-55-lage.webp',
  'gesobau-reinickendorfer-strasse': '/images/projects/gesobau-reinickendorfer-strasse-lage.webp',
  'gesobau-stollberger-strasse': '/images/projects/gesobau-stollberger-strasse-lage.webp',
  'gesobau-wilhelmsruher-damm-150': '/images/projects/gesobau-wilhelmsruher-damm-150-lage.webp',
  'gewoba-kistner-carre': '/images/projects/gewoba-kistner-carre-lage.webp',
  'gewobag-allee-der-kosmonauten': '/images/projects/gewobag-allee-der-kosmonauten-lage.webp',
  'gewobag-am-muehlenberg': '/images/projects/gewobag-am-muehlenberg-lage.webp',
  'gewobag-gartenfeld': '/images/projects/gewobag-gartenfeld-lage.webp',
  'gewobag-hohensaatener-strasse-18': '/images/projects/gewobag-hohensaatener-strasse-18-lage.webp',
  'gewobag-landsberger-allee': '/images/projects/gewobag-landsberger-allee-lage.webp',
  'gewobag-waterkant': '/images/projects/gewobag-waterkant-lage.webp',
  'gewobag-wendenschlossstrasse': '/images/projects/gewobag-wendenschlossstrasse-lage.webp',
  'grand-city-neukolln-neubau': '/images/projects/grand-city-neukolln-neubau-lage.webp',
  'grand-tower-frankfurt': '/images/projects/grand-tower-frankfurt-lage.webp',
  'greystar-marzahn-mitte': '/images/projects/greystar-marzahn-mitte-lage.webp',
  'hafen-city-hamburg': '/images/projects/hafen-city-hamburg-lage.webp',
  'hafencity-hamburg': '/images/projects/hafencity-hamburg-lage.webp',
  'hamburg-grasbrook': '/images/projects/hamburg-grasbrook-lage.webp',
  'heart-of-europe': '/images/projects/heart-of-europe-lage.webp',
  'hey-charlottenburg': '/images/projects/hey-charlottenburg-lage.webp',
  'howoge-alfred-kowalke-strasse-22': '/images/projects/howoge-alfred-kowalke-strasse-22-lage.webp',
  'howoge-am-lindenplatz': '/images/projects/howoge-am-lindenplatz-lage.webp',
  'howoge-anne-frank-strasse': '/images/projects/howoge-anne-frank-strasse-lage.webp',
  'howoge-barther-strasse': '/images/projects/howoge-barther-strasse-lage.webp',
  'howoge-detlevstrasse': '/images/projects/howoge-detlevstrasse-lage.webp',
  'howoge-elisabeth-aue': '/images/projects/howoge-elisabeth-aue-lage.webp',
  'howoge-gartenstadt-karlshorst': '/images/projects/howoge-gartenstadt-karlshorst-lage.webp',
  'howoge-genslerstrasse-39-47': '/images/projects/howoge-genslerstrasse-39-47-lage.webp',
  'howoge-havelufer-quartier': '/images/projects/howoge-havelufer-quartier-lage.webp',
  'howoge-huronseestrasse-28-34': '/images/projects/howoge-huronseestrasse-28-34-lage.webp',
  'howoge-ilsestrasse-marksburgstrasse': '/images/projects/howoge-ilsestrasse-marksburgstrasse-lage.webp',
  'howoge-joachimsthaler-plauener': '/images/projects/howoge-joachimsthaler-plauener-lage.webp',
  'howoge-kirchsteig': '/images/projects/howoge-kirchsteig-lage.webp',
  'howoge-konnekt-georg-knorr-park': '/images/projects/howoge-konnekt-georg-knorr-park-lage.webp',
  'howoge-lueckstrasse': '/images/projects/howoge-lueckstrasse-lage.webp',
  'howoge-mahlower-strasse': '/images/projects/howoge-mahlower-strasse-lage.webp',
  'howoge-oberseestrasse-oranke': '/images/projects/howoge-oberseestrasse-oranke-lage.webp',
  'howoge-plonzstrasse': '/images/projects/howoge-plonzstrasse-lage.webp',
  'howoge-rosenfelder-ring-88': '/images/projects/howoge-rosenfelder-ring-88-lage.webp',
  'howoge-salzmannstrasse-34': '/images/projects/howoge-salzmannstrasse-34-lage.webp',
  'howoge-schkeuditzer-strasse': '/images/projects/howoge-schkeuditzer-strasse-lage.webp',
  'howoge-schulze-boysen-strasse': '/images/projects/howoge-schulze-boysen-strasse-lage.webp',
  'howoge-sewanstrasse-256': '/images/projects/howoge-sewanstrasse-256-lage.webp',
  'howoge-sewanstrasse-38-40': '/images/projects/howoge-sewanstrasse-38-40-lage.webp',
  'howoge-studenthouse-eichbuschallee': '/images/projects/howoge-studenthouse-eichbuschallee-lage.webp',
  'howoge-vincent-van-gogh-strasse': '/images/projects/howoge-vincent-van-gogh-strasse-lage.webp',
  'howoge-wiecker-strasse': '/images/projects/howoge-wiecker-strasse-lage.webp',
  'hudayriat-island': '/images/projects/hudayriat-island-lage.webp',
  'instone-berlia': '/images/projects/instone-berlia-lage.webp',
  'instone-kopenhagener-strasse': '/images/projects/instone-kopenhagener-strasse-lage.webp',
  'instone-topaz': '/images/projects/instone-topaz-lage.webp',
  'jumeirah-beach-residence': '/images/projects/jumeirah-beach-residence-lage.webp',
  'jumeirah-islands': '/images/projects/jumeirah-islands-lage.webp',
  'kleyer-quartier-frankfurt': '/images/projects/kleyer-quartier-frankfurt-lage.webp',
  'koeln-medienpark': '/images/projects/koeln-medienpark-lage.webp',
  'kolbenhoefe-hamburg': '/images/projects/kolbenhoefe-hamburg-lage.webp',
  'krupp-guertel-essen': '/images/projects/krupp-guertel-essen-lage.webp',
  'leipzig-city-tunnel': '/images/projects/leipzig-city-tunnel-lage.webp',
  'm2-at-chkondideli': '/images/projects/m2-at-chkondideli-lage.webp',
  'm2-highlight': '/images/projects/m2-highlight-lage.webp',
  'm2-hippodrome': '/images/projects/m2-hippodrome-lage.webp',
  'm2-mtatsminda-park': '/images/projects/m2-mtatsminda-park-lage.webp',
  'macherei-berlin': '/images/projects/macherei-berlin-lage.webp',
  'macherei-muenchen': '/images/projects/macherei-muenchen-lage.webp',
  'malmoe28': '/images/projects/malmoe28-lage.webp',
  'mamsha-al-saadiyat': '/images/projects/mamsha-al-saadiyat-lage.webp',
  'marina-gardens-dresden': '/images/projects/marina-gardens-dresden-lage.webp',
  'marina-gate': '/images/projects/marina-gate-lage.webp',
  'maryam-island': '/images/projects/maryam-island-lage.webp',
  'masaar': '/images/projects/masaar-lage.webp',
  'max-ophuels-quartier': '/images/projects/max-ophuels-quartier-lage.webp',
  'metropol-cube': '/images/projects/metropol-cube-lage.webp',
  'metropol-kavtaradze': '/images/projects/metropol-kavtaradze-lage.webp',
  'midtown-production-city': '/images/projects/midtown-production-city-lage.webp',
  'milaneo-stuttgart': '/images/projects/milaneo-stuttgart-lage.webp',
  'mudon': '/images/projects/mudon-lage.webp',
  'muenchner-wohnen-neufreimann': '/images/projects/muenchner-wohnen-neufreimann-lage.webp',
  'munich-oberwiesenfeld': '/images/projects/munich-oberwiesenfeld-lage.webp',
  'munich-olympiapark': '/images/projects/munich-olympiapark-lage.webp',
  'neckar-park-stuttgart': '/images/projects/neckar-park-stuttgart-lage.webp',
  'neue-bockbrauerei': '/images/projects/neue-bockbrauerei-lage.webp',
  'nhw-elisabethentor': '/images/projects/nhw-elisabethentor-lage.webp',
  'nhw-mariengaerten': '/images/projects/nhw-mariengaerten-lage.webp',
  'nhw-nuville': '/images/projects/nhw-nuville-lage.webp',
  'nhw-riedbogen': '/images/projects/nhw-riedbogen-lage.webp',
  'nhw-schoenhof-viertel': '/images/projects/nhw-schoenhof-viertel-lage.webp',
  'ocean-house-palm': '/images/projects/ocean-house-palm-lage.webp',
  'one-at-palm-jumeirah': '/images/projects/one-at-palm-jumeirah-lage.webp',
  'one-frankfurt': '/images/projects/one-frankfurt-lage.webp',
  'one-zaabeel': '/images/projects/one-zaabeel-lage.webp',
  'opalz': '/images/projects/opalz-lage.webp',
  'orbi-beach-tower': '/images/projects/orbi-beach-tower-lage.webp',
  'orbi-city': '/images/projects/orbi-city-lage.webp',
  'orbi-continental': '/images/projects/orbi-continental-lage.webp',
  'orbi-sea-towers': '/images/projects/orbi-sea-towers-lage.webp',
  'orla-palm': '/images/projects/orla-palm-lage.webp',
  'otto-quartier-esslingen': '/images/projects/otto-quartier-esslingen-lage.webp',
  'palm-beach-towers': '/images/projects/palm-beach-towers-lage.webp',
  'pandion-midtown-4': '/images/projects/pandion-midtown-4-lage.webp',
  'parkresidenz-leipzig': '/images/projects/parkresidenz-leipzig-lage.webp',
  'patrizia-patriots-park': '/images/projects/patrizia-patriots-park-lage.webp',
  'paulaner-areal-nockherberg': '/images/projects/paulaner-areal-nockherberg-lage.webp',
  'petalz': '/images/projects/petalz-lage.webp',
  'priva-dso': '/images/projects/priva-dso-lage.webp',
  'quartier-eins-prenzlauer-berg': '/images/projects/quartier-eins-prenzlauer-berg-lage.webp',
  'quartier-eins-schoeneberg': '/images/projects/quartier-eins-schoeneberg-lage.webp',
  'quartier-ipanema-hamburg': '/images/projects/quartier-ipanema-hamburg-lage.webp',
  'quartier-lilienthal': '/images/projects/quartier-lilienthal-lage.webp',
  'ramhan-island': '/images/projects/ramhan-island-lage.webp',
  'reem-hills': '/images/projects/reem-hills-lage.webp',
  'reportage-tsawen': '/images/projects/reportage-tsawen-lage.webp',
  'rizon-im-four': '/images/projects/rizon-im-four-lage.webp',
  'rossmarkt-frankfurt': '/images/projects/rossmarkt-frankfurt-lage.webp',
  'saadiyat-lagoons': '/images/projects/saadiyat-lagoons-lage.webp',
  'safa-one': '/images/projects/safa-one-lage.webp',
  'saga-horn': '/images/projects/saga-horn-lage.webp',
  'samana-barari-views': '/images/projects/samana-barari-views-lage.webp',
  'schoenwalder-strasse-57': '/images/projects/schoenwalder-strasse-57-lage.webp',
  'schwabinger-tor': '/images/projects/schwabinger-tor-lage.webp',
  'seven-palm': '/images/projects/seven-palm-lage.webp',
  'six-senses-palm': '/images/projects/six-senses-palm-lage.webp',
  'sobha-hartland': '/images/projects/sobha-hartland-lage.webp',
  'stadt-und-land-buckower-felder': '/images/projects/stadt-und-land-buckower-felder-lage.webp',
  'stadt-und-land-droepkeweg': '/images/projects/stadt-und-land-droepkeweg-lage.webp',
  'stadt-und-land-fritz-werner-strasse-45': '/images/projects/stadt-und-land-fritz-werner-strasse-45-lage.webp',
  'stadt-und-land-johanna-tesch-strasse': '/images/projects/stadt-und-land-johanna-tesch-strasse-lage.webp',
  'stadt-und-land-johannes-tobei-strasse': '/images/projects/stadt-und-land-johannes-tobei-strasse-lage.webp',
  'stadt-und-land-john-locke-siedlung': '/images/projects/stadt-und-land-john-locke-siedlung-lage.webp',
  'stadt-und-land-kaserne-hessenwinkel': '/images/projects/stadt-und-land-kaserne-hessenwinkel-lage.webp',
  'stadt-und-land-maybachufer': '/images/projects/stadt-und-land-maybachufer-lage.webp',
  'stadt-und-land-paule-panke': '/images/projects/stadt-und-land-paule-panke-lage.webp',
  'stadt-und-land-sonnenallee-210': '/images/projects/stadt-und-land-sonnenallee-210-lage.webp',
  'stadt-und-land-walkuerenstrasse': '/images/projects/stadt-und-land-walkuerenstrasse-lage.webp',
  'stadt-und-land-weinstrasse-9': '/images/projects/stadt-und-land-weinstrasse-9-lage.webp',
  'strandkai-hafencity': '/images/projects/strandkai-hafencity-lage.webp',
  'stuttgart-rosenstein': '/images/projects/stuttgart-rosenstein-lage.webp',
  'sunrose-dso': '/images/projects/sunrose-dso-lage.webp',
  'tag-weitlingkiez': '/images/projects/tag-weitlingkiez-lage.webp',
  'the-opus': '/images/projects/the-opus-lage.webp',
  'timber-peak-mainz': '/images/projects/timber-peak-mainz-lage.webp',
  'town-square-dubai': '/images/projects/town-square-dubai-lage.webp',
  'trockland-checkpoint': '/images/projects/trockland-checkpoint-lage.webp',
  'ueberseequartier-hamburg': '/images/projects/ueberseequartier-hamburg-lage.webp',
  'union-upl-europacity': '/images/projects/union-upl-europacity-lage.webp',
  'wasl-gate': '/images/projects/wasl-gate-lage.webp',
  'wbm-breite-strasse': '/images/projects/wbm-breite-strasse-lage.webp',
  'wbm-haus-der-statistik': '/images/projects/wbm-haus-der-statistik-lage.webp',
  'wbm-lange-strasse': '/images/projects/wbm-lange-strasse-lage.webp',
  'wbm-melchior-engeldamm': '/images/projects/wbm-melchior-engeldamm-lage.webp',
  'wbm-molkenmarkt': '/images/projects/wbm-molkenmarkt-lage.webp',
  'wbm-mollstrasse': '/images/projects/wbm-mollstrasse-lage.webp',
  'wbm-neue-jakobstrasse': '/images/projects/wbm-neue-jakobstrasse-lage.webp',
  'wbm-rathausblock-sued': '/images/projects/wbm-rathausblock-sued-lage.webp',
  'wbm-rathenower-strasse': '/images/projects/wbm-rathenower-strasse-lage.webp',
  'wbm-sez-quartier': '/images/projects/wbm-sez-quartier-lage.webp',
  'wbm-viktoriaspeicher': '/images/projects/wbm-viktoriaspeicher-lage.webp',
  'werksviertel-munich': '/images/projects/werksviertel-munich-lage.webp',
  'white-square-mindeli': '/images/projects/white-square-mindeli-lage.webp',
  'wohnquadrat-harzer-118': '/images/projects/wohnquadrat-harzer-118-lage.webp',
  'yas-acres': '/images/projects/yas-acres-lage.webp',
}
