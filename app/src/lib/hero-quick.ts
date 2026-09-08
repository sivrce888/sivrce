/**
 * Hero quick-search chips — plain data shared by the server (Hero validates
 * each district href against live inventory) and the client (HeroSearch).
 * ponytail: hand-curated list; auto-derive from seo-pages if chips multiply.
 */
export interface HeroQuickChip {
  labelKey:
    | 'home.search.quick.nearMetro'
    | 'home.search.quick.dailyTbilisi'
    | 'home.search.quick.vake'
    | 'home.search.quick.saburtalo'
    | 'home.search.quick.mtatsminda'
    | 'home.search.quick.batumi'
    | 'home.search.quick.oldTbilisi'
    | 'home.search.quick.digomi'
  sale: string
  rent: string
  pledge: string
  daily: string
  projects: string
}

export const QUICK: HeroQuickChip[] = [
  // ponytail: metro chip → utilitarian /search (shortest path to listings);
  // link the /metro hub from a content surface if the orphan ever hurts rankings.
  {
    labelKey: 'home.search.quick.nearMetro',
    sale: '/search?deal=sale&metro=1',
    rent: '/search?deal=rent&metro=1',
    pledge: '/search?deal=pledge&metro=1',
    daily: '/search?deal=daily&metro=1',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.dailyTbilisi',
    sale: '/daily/apartments/tbilisi',
    rent: '/daily/apartments/tbilisi',
    pledge: '/search?deal=pledge&city=თბილისი',
    daily: '/daily/apartments/tbilisi',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.vake',
    sale: '/sale/apartments/tbilisi/vake',
    rent: '/rent/apartments/tbilisi/vake',
    pledge: '/search?deal=pledge&city=თბილისი&district=ვაკე',
    daily: '/daily/apartments/tbilisi/vake',
    projects: '/projects/tbilisi/vake',
  },
  {
    labelKey: 'home.search.quick.saburtalo',
    sale: '/sale/apartments/tbilisi/saburtalo',
    rent: '/rent/apartments/tbilisi/saburtalo',
    pledge: '/search?deal=pledge&city=თბილისი&district=საბურთალო',
    daily: '/daily/apartments/tbilisi/saburtalo',
    projects: '/projects/tbilisi/saburtalo',
  },
  {
    labelKey: 'home.search.quick.mtatsminda',
    sale: '/sale/apartments/tbilisi/mtatsminda',
    rent: '/rent/apartments/tbilisi/mtatsminda',
    pledge: '/search?deal=pledge&city=თბილისი&district=მთაწმინდა',
    daily: '/daily/apartments/tbilisi',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.batumi',
    sale: '/sale/apartments/batumi',
    rent: '/rent/apartments/batumi',
    pledge: '/search?deal=pledge&city=ბათუმი',
    daily: '/daily/apartments/batumi',
    projects: '/projects/batumi',
  },
  {
    labelKey: 'home.search.quick.oldTbilisi',
    sale: '/sale/apartments/tbilisi/old-tbilisi',
    rent: '/rent/apartments/tbilisi/old-tbilisi',
    pledge: '/search?deal=pledge&city=თბილისი&district=ძველი თბილისი',
    daily: '/daily/apartments/tbilisi/old-tbilisi',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.digomi',
    sale: '/sale/apartments/tbilisi/didi-dighomi',
    rent: '/rent/apartments/tbilisi/didi-dighomi',
    pledge: '/search?deal=pledge&city=თბილისი&district=დიდი დიღომი',
    daily: '/daily/apartments/tbilisi',
    projects: '/projects/tbilisi/didi-dighomi',
  },
]
