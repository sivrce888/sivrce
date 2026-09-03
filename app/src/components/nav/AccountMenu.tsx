"use client"

import { useSession } from "next-auth/react"
import {
  ArrowLeftRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react"

import { signOutToHome } from "@/app/auth/actions"
import LocalizedLink from "@/components/LocalizedLink"
import { isPhoneEmail } from "@/lib/auth-phone"

const MENU = [
  { href: "/account", label: "ანგარიში", icon: User },
  { href: "/settings", label: "პარამეტრები", icon: Settings },
  { href: "/dashboard", label: "ჩემი პანელი", icon: LayoutDashboard },
  { href: "/favorites", label: "ფავორიტები", icon: Heart },
  { href: "/compare", label: "შედარება", icon: ArrowLeftRight },
] as const

function Avatar({
  name,
  image,
  size = 32,
}: {
  name: string | null | undefined
  image: string | null | undefined
  size?: number
}) {
  if (image) {
    return (
      // Remote OAuth avatar — next/image remotePatterns not configured
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }
  const letter = (name?.trim()?.[0] ?? "S").toUpperCase()
  return (
    <span
      className="grid place-items-center rounded-full bg-sv-blue font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {letter}
    </span>
  )
}

export function AccountMenu({
  light = false,
  variant = "icon",
  onNavigate,
}: {
  light?: boolean
  variant?: "icon" | "panel"
  onNavigate?: () => void
}) {
  const { data: session, status } = useSession()
  const user = session?.user
  const signedIn = status === "authenticated" && Boolean(user?.id)
  const emailLine =
    user?.email && !isPhoneEmail(user.email) ? user.email : null

  const chrome = light
    ? "text-sv-ink/70 hover:bg-sv-ink/5"
    : "text-sv-ink/70 hover:bg-sv-ink/5 dark:text-white/85 dark:hover:bg-white/10"

  if (!signedIn) {
    if (variant === "panel") {
      return (
        <LocalizedLink
          href="/dashboard"
          onClick={onNavigate}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-sv-ink/[0.06] px-4 py-3.5 text-[15px] font-extrabold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          <User className="h-4 w-4" aria-hidden />
          შესვლა
        </LocalizedLink>
      )
    }
    return (
      <LocalizedLink
        href="/dashboard"
        aria-label="შესვლა"
        className={`grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${chrome}`}
      >
        <User className="h-4 w-4" />
      </LocalizedLink>
    )
  }

  const links = (
    <ul className="py-1.5">
      {MENU.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.href}>
            <LocalizedLink
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-bold text-sv-ink/80 transition hover:bg-sv-cloud hover:text-sv-ink"
            >
              <Icon className="h-4 w-4 text-sv-blue" aria-hidden />
              {item.label}
            </LocalizedLink>
          </li>
        )
      })}
    </ul>
  )

  const signOutRow = (
    <form action={signOutToHome} className="border-t border-sv-ink/8 p-2">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-control px-2 py-2.5 text-left text-[13.5px] font-bold text-sv-ink/70 transition hover:bg-sv-cloud hover:text-sv-ink"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        გასვლა
      </button>
    </form>
  )

  const identity = (
    <div className="flex items-center gap-3 border-b border-sv-ink/8 px-4 py-3">
      <Avatar name={user?.name} image={user?.image} size={40} />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-extrabold text-sv-ink">
          {user?.name ?? "ანგარიში"}
        </p>
        {emailLine ? (
          <p className="truncate text-[12px] font-semibold text-sv-ink/45">{emailLine}</p>
        ) : null}
      </div>
    </div>
  )

  if (variant === "panel") {
    return (
      <div className="mt-2 overflow-hidden rounded-tile border border-sv-ink/8 bg-sv-surface">
        {identity}
        {links}
        {signOutRow}
      </div>
    )
  }

  return (
    <details className="relative">
      <summary
        aria-label="ანგარიში"
        className={`flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden ${chrome}`}
      >
        <Avatar name={user?.name} image={user?.image} size={28} />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-card border border-sv-ink/8 bg-sv-surface shadow-card">
        {identity}
        {links}
        {signOutRow}
      </div>
    </details>
  )
}
