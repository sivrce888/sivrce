"use client"

import { useEffect, useRef, useState } from "react"

import { avatarInitials, avatarVisual, ICONS, isValidAvatarColor, isValidAvatarIcon, isValidAvatarStyle } from "@/lib/avatar"

const SHAPE = {
  full: "rounded-full",
  module: "rounded-module",
  card: "rounded-card",
} as const

/**
 * User photo, or an Apple-style monogram: a brand-palette gradient
 * derived from the name, or the gradient the user picked in settings.
 * A pinned gradient also rings a photo, Contacts-style. A pinned glyph
 * (icon) replaces the initials on the monogram.
 */
export default function UserAvatar({
  name,
  image,
  label,
  gradient = null,
  color = null,
  icon = null,
  size = 40,
  shape = "full",
  className = "",
}: {
  name?: string | null
  image?: string | null
  /** Monogram override (e.g. agent-custom avatarText). */
  label?: string | null
  /** User-chosen gradient index (settings); null = auto from name. */
  gradient?: number | null
  /** User-picked gradient color "#rrggbb" (settings); wins over `gradient`. */
  color?: string | null
  /** User-chosen glyph key (settings); null = initials. */
  icon?: string | null
  size?: number
  shape?: keyof typeof SHAPE
  className?: string
}) {
  const pinned = isValidAvatarStyle(gradient) || isValidAvatarColor(color)
  const { from, to, angle } = avatarVisual(name ?? "", gradient, color)
  const Glyph = isValidAvatarIcon(icon) ? ICONS[icon] : null

  // Dead remote URLs (OAuth avatar rotated away, scraped host gone) fall back
  // to the monogram instead of the browser's broken-image icon.
  const [broken, setBroken] = useState(false)
  // onError misses images that failed before hydration attached handlers —
  // re-check load state once on mount.
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth === 0) setBroken(true)
  }, [image])
  if (image && !broken) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={image}
        alt=""
        width={pinned ? size - 4 : size}
        height={pinned ? size - 4 : size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${SHAPE[shape]} object-cover`}
      />
    )
    if (pinned) {
      return (
        <span
          aria-hidden
          className={`${SHAPE[shape]} shrink-0 overflow-hidden ${className}`}
          style={{
            width: size,
            height: size,
            padding: 2,
            background: `linear-gradient(${angle}deg, ${from}, ${to})`,
          }}
        >
          {img}
        </span>
      )
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={image}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${SHAPE[shape]} shrink-0 object-cover ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden font-black text-white ${SHAPE[shape]} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(${angle}deg, ${from}, ${to})`,
        // navy-tint lift (BRAND §3) — keeps the monogram legible on light stops
        textShadow: '0 1px 2px rgba(5,11,38,.22)',
      }}
    >
      {Glyph ? (
        <Glyph size={Math.round(size * 0.5)} aria-hidden />
      ) : (
        label?.trim() || avatarInitials(name)
      )}
    </span>
  )
}
