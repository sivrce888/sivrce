// Hand-curated gallery paths for projects the mirror script never matched.
// Kept out of project-galleries.ts because that file is regenerated wholesale by
// `scripts/mirror-project-renders.ts --emit` — edits there are lost, and a slug
// added to both files produced duplicate object keys (TS1117).
// massing/timeline/lage renders are NOT listed here: withGeoRenders/withDERenders
// in professionals.ts append that trio for every slug that has one.
export const CURATED_GALLERIES: Record<string, string[]> = {
  'axis-towers-vake': ['/images/projects/axis-towers-vake-g1.webp', '/images/projects/axis-towers-vake-g2.webp'],
  'dirsi-riverside': ['/images/projects/dirsi-riverside-g1.webp', '/images/projects/dirsi-riverside-g2.webp'],
  'm2-hippodrome': ['/images/projects/m2-hippodrome-g1.webp'],
  'metropol-lisi': ['/images/projects/metropol-lisi-g1.webp', '/images/projects/metropol-lisi-g2.webp'],
}
