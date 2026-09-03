import { Studio } from "@/components/admin/content/studio/Studio"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { getCmsOverrides, getHomeLayout } from "@/lib/cms"
import { rowsForPage, rowsForSection } from "@/lib/cms-admin"
import {
  HOME_SECTIONS,
  STUDIO_PAGES,
  studioPageById,
} from "@/lib/cms-studio"
import { isValidLang, type Lang } from "@/lib/i18n/core"

export const metadata = { title: "Studio" }

export default async function AdminStudioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const langRaw = param(sp.lang)
  const lang: Lang = isValidLang(langRaw) ? langRaw : "ka"
  const page = studioPageById(param(sp.page)) ?? STUDIO_PAGES[0]
  const overrides = await getCmsOverrides(lang)
  const layout = await getHomeLayout()

  const homeRows: Record<string, ReturnType<typeof rowsForSection>> = {}
  for (const s of HOME_SECTIONS) {
    homeRows[s.id] = rowsForSection(lang, s, overrides)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-sv-cloud lg:left-[264px]">
      <Studio
        lang={lang}
        pageId={page.id}
        pages={STUDIO_PAGES}
        layout={layout}
        homeRows={homeRows}
        pageRows={rowsForPage(lang, page, overrides)}
      />
    </div>
  )
}
