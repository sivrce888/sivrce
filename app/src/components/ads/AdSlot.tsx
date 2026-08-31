import { AdCreative } from "@/components/ads/AdCreative"
import { audienceFromRole, SLOT_META, sponsoredLabel, type AdSlotId } from "@/lib/ads"
import { pickAd } from "@/lib/ads-db"
import { getSessionUser } from "@/lib/guards"
import type { Lang } from "@/lib/i18n/core"

const PAD: Partial<Record<AdSlotId, string>> = {
  home_hero: "mx-auto max-w-[1440px] px-5 pb-4 pt-2 md:px-10",
  home_mid: "mx-auto max-w-[1440px] px-5 py-8 md:px-10",
  home_after_projects: "mx-auto max-w-[1440px] px-5 py-6 md:px-10",
  neighborhoods: "mx-auto max-w-[1440px] px-5 pb-4 md:px-10",
  blog: "mx-auto max-w-[1200px] px-5 pb-8 md:px-10",
  agents: "mx-auto max-w-[1440px] px-5 pb-4 md:px-10",
  developers: "mx-auto max-w-[1440px] px-5 pb-4 md:px-10",
  projects: "mx-auto max-w-[1440px] px-5 pb-6 md:px-10",
  mortgage: "mx-auto max-w-[1100px] px-5 pb-8 md:px-10",
  advertise: "mx-auto max-w-6xl px-6 pb-10",
  services: "mx-auto max-w-[1440px] px-5 pb-4 md:px-10",
}

/** Server slot — empty when no live creative matches audience/lang/window. */
export async function AdSlot({
  slot,
  lang = "ka",
  className,
}: {
  slot: AdSlotId
  lang?: Lang
  className?: string
}) {
  const user = await getSessionUser()
  const ad = await pickAd(slot, { audience: audienceFromRole(user?.role), lang })
  if (!ad) return null
  const format = ad.format || SLOT_META[slot].format
  return (
    <section className={className ?? PAD[slot] ?? "px-5 py-6"} aria-label={sponsoredLabel(lang)}>
      <AdCreative ad={{ ...ad, format }} lang={lang} />
    </section>
  )
}
