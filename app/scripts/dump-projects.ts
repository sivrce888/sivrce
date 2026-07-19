// One-off dump: project metadata for the mirror pipeline.
import { PROJECTS } from '../src/data/professionals'
import { NEW_PROJECTS_TBILISI } from '../src/data/projects-new-tbilisi'
import { NEW_PROJECTS_BATUMI } from '../src/data/projects-new-batumi'
import { NEW_PROJECTS_REGIONS } from '../src/data/projects-new-regions'

const all = [
  ...NEW_PROJECTS_TBILISI.map((p) => ({ ...p, file: 'tbilisi' })),
  ...NEW_PROJECTS_BATUMI.map((p) => ({ ...p, file: 'batumi' })),
  ...NEW_PROJECTS_REGIONS.map((p) => ({ ...p, file: 'regions' })),
  ...PROJECTS.map((p) => ({ ...p, file: 'professionals' })),
]
const out = all.map((p) => ({
  slug: p.slug,
  name: p.name,
  dev: p.developerSlug,
  city: p.city,
  img: p.img,
  file: p.file,
}))
console.log(JSON.stringify(out, null, 0))
