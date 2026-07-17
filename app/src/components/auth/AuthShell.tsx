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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sv-navy px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(46,107,255,0.35),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(122,92,255,0.22),transparent_50%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={52} />
          <p className="mt-5 font-[family-name:var(--font-manrope)] text-[28px] font-black tracking-[-0.045em] text-white">
            sivrce<span className="text-sv-orange">.</span>
          </p>
          <h1 className="mt-4 text-[22px] font-black tracking-[-0.02em] text-white">{title}</h1>
          <p className="mt-2 max-w-sm text-[13.5px] font-medium leading-relaxed text-white/60">
            {subtitle}
          </p>
        </div>

        <div className="rounded-card border border-white/10 bg-white/[0.06] p-7 shadow-glow-navy backdrop-blur-xl">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center">{footer}</div> : null}

        <p className="mt-8 text-center text-[11.5px] font-medium leading-relaxed text-white/35">
          გაგრძელებით ეთანხმები{" "}
          <Link href="/terms" className="underline hover:text-white/70">
            პირობებს
          </Link>{" "}
          და{" "}
          <Link href="/privacy" className="underline hover:text-white/70">
            კონფიდენციალურობას
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
