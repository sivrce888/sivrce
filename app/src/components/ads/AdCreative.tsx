"use client"

import LocalizedLink from "@/components/LocalizedLink"
import { isInternalHref, sponsoredLabel, type PublicAd } from "@/lib/ads"
import type { Lang } from "@/lib/i18n/core"

function trackClick(id: string) {
  const url = `/api/ads/${encodeURIComponent(id)}/click`
  try {
    if (navigator.sendBeacon(url)) return
  } catch {
    /* fall through */
  }
  void fetch(url, { method: "POST", keepalive: true })
}

function Cta({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-white shadow-glow-orange transition group-hover:-translate-y-0.5">
      {label}
    </span>
  )
}

function Sponsored({ lang, onDark }: { lang: Lang; onDark?: boolean }) {
  return (
    <span
      className={`text-[10px] font-black uppercase tracking-[0.16em] ${onDark ? "text-white/40" : "text-sv-ink/35"}`}
    >
      {sponsoredLabel(lang)}
    </span>
  )
}

function CreativeInner({ ad, lang }: { ad: PublicAd; lang: Lang }) {
  const cta = ad.ctaLabel || (lang === "ka" ? "ნახვა" : "See more")

  switch (ad.format) {
    case "billboard":
      return (
        <span className="relative block overflow-hidden rounded-card bg-sv-navy shadow-card">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- advertiser CDN / R2
            <img
              src={ad.imageUrl}
              alt=""
              className="h-[min(52vw,420px)] w-full object-cover sm:h-[380px]"
            />
          ) : (
            <span className="block h-[220px] bg-gradient-to-br from-sv-navy via-sv-navy-soft to-sv-blue sm:h-[320px]" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-sv-navy/85 via-sv-navy/25 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 sm:p-9">
            <Sponsored lang={lang} onDark />
            <span className="max-w-[22ch] text-[26px] font-black tracking-[-0.035em] text-white sm:text-[36px]">
              {ad.title}
            </span>
            {ad.subtitle ? (
              <span className="max-w-[42ch] text-[14px] font-medium text-white/70 sm:text-[16px]">
                {ad.subtitle}
              </span>
            ) : null}
            <Cta label={cta} />
          </span>
        </span>
      )
    case "strip":
      return (
        <span className="flex overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition group-hover:shadow-card-hover sm:flex-row">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- advertiser CDN / R2
            <img
              src={ad.imageUrl}
              alt=""
              className="h-40 w-full object-cover sm:h-auto sm:w-[240px] sm:shrink-0"
            />
          ) : (
            <span className="h-28 w-full bg-gradient-to-br from-sv-blue to-sv-violet sm:h-auto sm:w-[200px]" />
          )}
          <span className="flex flex-1 flex-col justify-center gap-2 p-5 sm:p-7">
            <Sponsored lang={lang} />
            <span className="text-[20px] font-black tracking-[-0.03em] text-sv-ink sm:text-[24px]">
              {ad.title}
            </span>
            {ad.subtitle ? (
              <span className="text-[14px] font-medium text-sv-ink/55">{ad.subtitle}</span>
            ) : null}
            <span className="pt-1">
              <Cta label={cta} />
            </span>
          </span>
        </span>
      )
    case "native":
      return (
        <span className="flex h-full flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition group-hover:-translate-y-1.5 group-hover:shadow-card-hover">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- advertiser CDN / R2
            <img src={ad.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
          ) : (
            <span className="aspect-[16/10] bg-gradient-to-br from-sv-navy to-sv-blue" />
          )}
          <span className="flex flex-1 flex-col gap-2 p-5">
            <Sponsored lang={lang} />
            <span className="text-[17px] font-black leading-snug tracking-[-0.02em] text-sv-ink">
              {ad.title}
            </span>
            {ad.subtitle ? (
              <span className="line-clamp-2 text-[13px] font-medium text-sv-ink/55">{ad.subtitle}</span>
            ) : null}
            <span className="mt-auto pt-2">
              <Cta label={cta} />
            </span>
          </span>
        </span>
      )
    case "tile":
      return (
        <span className="block overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition group-hover:shadow-card-hover">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- advertiser CDN / R2
            <img src={ad.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
          ) : (
            <span className="block aspect-[16/9] bg-gradient-to-br from-sv-navy-soft to-sv-blue" />
          )}
          <span className="flex flex-col gap-2 p-5">
            <Sponsored lang={lang} />
            <span className="text-[16px] font-black tracking-[-0.02em] text-sv-ink">{ad.title}</span>
            {ad.subtitle ? (
              <span className="text-[13px] font-medium leading-relaxed text-sv-ink/55">{ad.subtitle}</span>
            ) : null}
            <span className="pt-1">
              <Cta label={cta} />
            </span>
          </span>
        </span>
      )
    default: {
      const _exhaustive: never = ad.format
      return _exhaustive
    }
  }
}

export function AdCreative({
  ad,
  lang,
  className = "",
}: {
  ad: PublicAd
  lang: Lang
  className?: string
}) {
  const inner = <CreativeInner ad={ad} lang={lang} />
  const cls = `group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${className}`

  if (isInternalHref(ad.href)) {
    return (
      <LocalizedLink href={ad.href} className={cls} onClick={() => trackClick(ad.id)}>
        {inner}
      </LocalizedLink>
    )
  }

  return (
    <a
      href={ad.href}
      className={cls}
      rel="noopener noreferrer sponsored"
      target="_blank"
      onClick={() => trackClick(ad.id)}
    >
      {inner}
    </a>
  )
}
