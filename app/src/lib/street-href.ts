import { DISTRICTS } from "@/lib/seo-pages"
import { STREETS, streetCore, type TbilisiStreet } from "@/data/tbilisi-streets"

function includesWord(hay: string, needle: string): boolean {
  let i = hay.indexOf(needle)
  while (i !== -1) {
    const before = hay[i - 1] ?? ""
    const after = hay[i + needle.length] ?? ""
    if (!/[ა-ჿ]/.test(before) && !/[ა-ჿ]/.test(after)) return true
    i = hay.indexOf(needle, i + 1)
  }
  return false
}

function coreVariants(core: string): string[] {
  const out = new Set([core])
  const chars = [...core]
  chars.forEach((c, i) => {
    if (c !== "ჭ" && c !== "ჩ") return
    for (const v of [...out]) {
      out.add(v.slice(0, i) + (v[i] === "ჭ" ? "ჩ" : "ჭ") + v.slice(i + 1))
    }
  })
  return [...out]
}

/**
 * Best street SEO path for a listing address, or null if unknown.
 * ponytail: longest core match — structured streetId when publish form stores it.
 */
export function streetHrefForListing(
  address: string,
  districtSlugOrKa: string,
  city: string,
): string | null {
  if (city !== "თბილისი") return null
  const district = DISTRICTS.find(
    (d) => d.slug === districtSlugOrKa || d.ka === districtSlugOrKa,
  )
  if (!district || district.citySlug !== "tbilisi") return null

  let best: TbilisiStreet | null = null
  let bestLen = 0
  for (const s of STREETS) {
    if (s.district && s.district !== district.slug) continue
    for (const v of coreVariants(streetCore(s.ka))) {
      if (v.length >= 4 && v.length > bestLen && includesWord(address, v)) {
        best = s
        bestLen = v.length
      }
    }
  }
  if (!best?.district) return null
  return `/tbilisi/${best.district}/${best.slug}`
}
