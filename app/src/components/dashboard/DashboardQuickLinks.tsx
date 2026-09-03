import LocalizedLink from "@/components/LocalizedLink"

export default function DashboardQuickLinks({
  links,
}: {
  links: { href: string; label: string; primary?: boolean }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      {links.map((link) => (
        <LocalizedLink
          key={link.href + link.label}
          href={link.href}
          className={
            link.primary
              ? "rounded-full bg-sv-orange px-5 py-3.5 text-center text-[14px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
              : "rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
          }
        >
          {link.label}
        </LocalizedLink>
      ))}
    </div>
  )
}
