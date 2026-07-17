import { TabLinks } from "@/components/admin/ui/TabLinks"

const TABS = [
  { href: "/admin/system/config", label: "Config" },
  { href: "/admin/system/audit", label: "Audit log" },
  { href: "/admin/system/notifications", label: "Notifications" },
  { href: "/admin/system/data", label: "Data" },
] as const

/** Sub-navigation shared by all /admin/system pages. */
export function SystemTabs({ active }: { active: string }) {
  return <TabLinks items={TABS.map((t) => ({ ...t, active: t.href === active }))} />
}
