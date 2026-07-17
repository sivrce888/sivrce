import Link from 'next/link'

/* ponytail: pure SVG + next/link only — no framer-motion, so Footer/Navbar
   don't pull the whole animation lib just for the logo. */
export function LogoMark({ size = 36 }: { size?: number }) {
  /* The Space Point — brand-locked geometry (logo/README.md, 48-unit grid):
     blue squircle r=14/48 · infinite S (two tangent arcs, 180° symmetry)
     · orange space point. Optical build below 32px: heavier stroke + point. */
  const small = size <= 32
  return (
    <span
      className="relative block shrink-0 transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
        <rect width="48" height="48" rx="14" fill="var(--sv-blue)" />
        <path
          d="M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857"
          fill="none"
          stroke="#ffffff"
          strokeWidth={small ? 7 : 6.4}
          strokeLinecap="round"
        />
        <circle cx="38.2" cy="38.2" r={small ? 3.3 : 3} fill="var(--sv-orange)" />
      </svg>
      {/* Soft brand shadow */}
      <span className="absolute inset-0 -z-10 rounded-[14px] bg-sv-blue opacity-40 blur-md" />
    </span>
  )
}

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="სივრცე — მთავარი">
      <LogoMark size={36} />
      {!compact && (
        <span
          className={`text-[22px] font-extrabold tracking-[-0.045em] ${
            light ? 'text-white' : 'text-sv-ink'
          }`}
        >
          sivrce
          <span className="text-sv-orange">.</span>
        </span>
      )}
    </Link>
  )
}
