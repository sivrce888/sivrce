import { TabLinks } from "@/components/admin/ui/TabLinks"

const TABS = [
  { tab: "config", href: "/admin/system", label: "Config" },
  { tab: "broadcast", href: "/admin/system?tab=broadcast", label: "Broadcast" },
  { tab: "audit", href: "/admin/system?tab=audit", label: "Audit log" },
] as const

/** Sub-navigation shared by all /admin/system pages. */
export function SystemTabs({ active }: { active: string }) {
  return (
    <TabLinks items={TABS.map((t) => ({ href: t.href, label: t.label, active: t.tab === active }))} />
  )
}
