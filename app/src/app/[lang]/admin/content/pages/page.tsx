import { Languages } from "lucide-react"

import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { PagesEditor } from "@/components/admin/content/pages/PagesEditor"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { cmsGroups, cmsRowsForGroup, getCmsOverrides } from "@/lib/cms"
import { isValidLang, LANGS, type Lang } from "@/lib/i18n/core"

export const metadata = { title: "Page Content" }

const LANG_LABEL: Record<Lang, string> = {
  ka: "ქართული",
  en: "English",
  ru: "Русский",
  he: "עברית",
  ar: "العربية",
  tr: "Türkçe",
  uk: "Українська",
  hy: "Հայերեն",
  az: "Azərbaycan",
}

export default async function AdminPagesContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const langRaw = param(sp.lang)
  const lang: Lang = isValidLang(langRaw) ? langRaw : "ka"
  const groups = cmsGroups()
  const groupRaw = param(sp.group)
  const group = groups.some((g) => g.id === groupRaw) ? groupRaw : groups[0].id

  const rows = cmsRowsForGroup(lang, group, await getCmsOverrides(lang))
  const qs = (l: string, g: string) => `/admin/content/pages?lang=${l}&group=${g}`

  return (
    <>
      <PageHeader
        title="Page Content"
        description="Edit any text on the site — pick a language and a section, type, save. Blank reverts to the default."
      />
      <ContentTabs active="/admin/content/pages" />
      <div className="mb-1 flex items-center gap-2 text-[12px] font-bold tracking-wide text-sv-ink/40 uppercase">
        <Languages className="h-3.5 w-3.5" /> Language
      </div>
      <TabLinks
        items={LANGS.map((l) => ({
          href: qs(l, group),
          label: LANG_LABEL[l],
          active: l === lang,
        }))}
      />
      <TabLinks
        items={groups.map((g) => ({
          href: qs(lang, g.id),
          label: g.label,
          count: g.count,
          active: g.id === group,
        }))}
      />
      <PagesEditor key={`${lang}:${group}`} lang={lang} group={group} rows={rows} />
    </>
  )
}
