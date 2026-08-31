import { TabLinks } from "@/components/admin/ui/TabLinks"

const TABS = [
  { href: "/admin/content/studio", label: "Studio" },
  { href: "/admin/content/pages", label: "All texts" },
  { href: "/admin/content/blog", label: "Blog" },
  { href: "/admin/content/reviews", label: "Reviews" },
  { href: "/admin/content/forum", label: "Forum" },
  { href: "/admin/content/services", label: "Services" },
] as const

/** Sub-navigation shared by all /admin/content pages. */
export function ContentTabs({ active }: { active: string }) {
  return <TabLinks items={TABS.map((t) => ({ ...t, active: t.href === active }))} />
}
