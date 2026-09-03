/**
 * Filtered /projects sub-hubs that share the [hub]/page/[pg] pagination route.
 * Single source of truth: static pages AND paginated pages must apply the
 * exact same predicate, or page 2 drifts out of sync with page 1.
 */
import type { Project } from '@/data/professionals'
import type { ProjectHubKey } from '@/lib/directory-seo'

export interface SubHub {
  hub: ProjectHubKey
  /** Canonical page-1 path — the pager links `${path}/page/N`. */
  path: string
  filter: (p: Project) => boolean
}

export const SUB_HUBS: Record<string, SubHub> = {
  ready: {
    hub: 'ready',
    path: '/projects/ready',
    // Completed = 100% built.
    filter: (p) => p.done === 100,
  },
  installment: {
    hub: 'installment',
    path: '/projects/installment',
    // Installment plans exist while a project is under construction.
    filter: (p) => p.done < 100,
  },
  tbilisi: { hub: 'tbilisi', path: '/projects/tbilisi', filter: (p) => p.city === 'თბილისი' },
  batumi: { hub: 'batumi', path: '/projects/batumi', filter: (p) => p.city === 'ბათუმი' },
}
