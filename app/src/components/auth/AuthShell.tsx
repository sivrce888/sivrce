import type { ReactNode } from "react"
import Link from "next/link"

import { LogoMark } from "@/components/Logo"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sv-navy px-5 py-14 sm:px-6">
      {/* Atmosphere — brand navy, not competitor pastel or flat blue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(46,107,255,0.42),transparent_52%),radial-gradient(ellipse_at_88%_95%,rgba(255,106,45,0.14),transparent_48%),radial-gradient(ellipse_at_50%_120%,rgba(122,92,255,0.18),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-sv-blue/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-sv-orange/10 blur-3xl"
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <Link href="/" className="group flex flex-col items-center focus-visible:outline-none">
            <LogoMark size={52} />
            <p className="mt-4 font-[family-name:var(--font-manrope)] text-[30px] font-black tracking-[-0.045em] text-white transition group-hover:opacity-90">
              sivrce<span className="text-sv-orange">.</span>
            </p>
          </Link>
          <h1 className="mt-5 text-[22px] font-black tracking-[-0.025em] text-white sm:text-[24px]">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-[13.5px] font-medium leading-relaxed text-white/55">
            {subtitle}
          </p>
        </div>

        {/* White card — clearer than glass, beats ss/myhome clutter */}
        <div className="rounded-card border border-white/10 bg-sv-surface p-6 shadow-glow-navy sm:p-8">
          {children}
        </div>

        {footer ? <div className="mt-5 text-center">{footer}</div> : null}

        <p className="mt-7 text-center text-[11.5px] font-medium leading-relaxed text-white/35">
          გაგრძელებით ეთანხმები{" "}
          <Link href="/terms" className="underline decoration-white/25 underline-offset-2 hover:text-white/65">
            პირობებს
          </Link>{" "}
          და{" "}
          <Link
            href="/privacy"
            className="underline decoration-white/25 underline-offset-2 hover:text-white/65"
          >
            კონფიდენციალურობას
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
