'use client'

/* Deterministic pseudo-random so SSR/build output is stable */
import { useEffect, useRef } from 'react'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface Particle {
  left: string
  bottom: string
  size: number
  duration: string
  delay: string
  drift: string
  opacity: number
  orange: boolean
}

interface WindowCell {
  x: number
  y: number
  duration: string
  delay: string
  orange: boolean
}

interface Star {
  top: string
  left: string
  size: number
  duration: string
  delay: string
  blue: boolean
}

/* Skyline: [x, width, height] — a stylized city silhouette */
const BUILDINGS: Array<[number, number, number]> = [
  [0, 52, 120], [58, 38, 176], [102, 64, 96], [172, 44, 210], [222, 60, 140],
  [288, 36, 258], [330, 56, 168], [392, 70, 116], [468, 42, 226], [516, 62, 152],
  [584, 48, 300], [638, 66, 132], [710, 40, 196], [756, 58, 104], [820, 46, 244],
  [872, 68, 158], [946, 40, 208], [992, 60, 122], [1058, 50, 268], [1114, 64, 148],
  [1184, 42, 188], [1232, 58, 108], [1296, 52, 224], [1354, 46, 144],
]

const SV_W = 1400
const SV_H = 340

/* Pure decorative layer — deterministic, so it renders on the server */
function buildParticles(): Particle[] {
  const rnd = seeded(42)
  return Array.from({ length: 26 }, () => ({
    left: `${(rnd() * 100).toFixed(2)}%`,
    bottom: `${(rnd() * 18).toFixed(2)}%`,
    size: 2 + rnd() * 3.5,
    duration: `${(11 + rnd() * 14).toFixed(1)}s`,
    delay: `${(-rnd() * 20).toFixed(1)}s`,
    drift: `${((rnd() - 0.5) * 90).toFixed(0)}px`,
    opacity: 0.25 + rnd() * 0.45,
    orange: rnd() > 0.82,
  }))
}

function buildWindows(): WindowCell[] {
  const rnd = seeded(7)
  const cells: WindowCell[] = []
  BUILDINGS.forEach(([bx, bw, bh]) => {
    const cols = Math.floor((bw - 14) / 14)
    const rows = Math.floor((bh - 20) / 18)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.78) {
          cells.push({
            x: bx + 8 + c * 14,
            y: SV_H - bh + 12 + r * 18,
            duration: `${(3.5 + rnd() * 5).toFixed(1)}s`,
            delay: `${(-rnd() * 6).toFixed(1)}s`,
            orange: rnd() > 0.75,
          })
        }
      }
    }
  })
  return cells
}

/* Sparse twinkling star field — confined to the upper sky so it never collides with the H1/search panel */
function buildStars(): Star[] {
  const rnd = seeded(91)
  return Array.from({ length: 18 }, () => ({
    top: `${(4 + rnd() * 42).toFixed(2)}%`,
    left: `${(rnd() * 96).toFixed(2)}%`,
    size: 1.5 + rnd() * 1.8,
    duration: `${(3 + rnd() * 5).toFixed(1)}s`,
    delay: `${(-rnd() * 6).toFixed(1)}s`,
    blue: rnd() > 0.55,
  }))
}

const particles = buildParticles()
const windows = buildWindows()
const stars = buildStars()

export default function HeroBackground() {
  const root = useRef<HTMLDivElement>(null)

  // Pause ambient animations while the hero is off-screen
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('sv-anim-paused', !entry.isIntersecting)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden bg-sv-navy" aria-hidden>
      {/* Aurora gradient field — brand blue / violet / orange */}
      <div className="animate-aurora-a absolute -left-[15%] top-[-25%] h-[70%] w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue)_34%,transparent),transparent_65%)] blur-[90px]" />
      <div className="animate-aurora-b absolute right-[-12%] top-[-10%] h-[65%] w-[55%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-violet)_26%,transparent),transparent_65%)] blur-[100px]" />
      <div className="animate-aurora-c absolute bottom-[-30%] left-[25%] h-[70%] w-[50%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-orange)_16%,transparent),transparent_65%)] blur-[110px]" />
      <div className="absolute left-1/2 top-[30%] h-[50%] w-[46%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue)_14%,transparent),transparent_70%)] blur-[110px]" />

      {/* Moon — top-right crescent carved from bg, soft brand-blue glow */}
      <div className="animate-float absolute right-[10%] top-[8%] hidden h-24 w-24 md:block">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue-light)_28%,transparent),transparent_65%)] blur-2xl" />
        <div className="absolute left-4 top-3 h-14 w-14 overflow-hidden rounded-full">
          <div className="absolute left-0 top-0 h-14 w-14 rounded-full bg-white" />
          {/* ponytail: crescent carved with an offset navy disc — same color as section bg, zero new tokens */}
          <div className="absolute left-5 top-[-4px] h-14 w-14 rounded-full bg-sv-navy" />
        </div>
      </div>

      {/* Twinkling stars — upper sky only, staggered, pauses off-screen + under reduced-motion */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="sv-star absolute hidden rounded-full md:block"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.blue ? 'var(--sv-blue-light)' : 'rgba(255,255,255,0.85)',
            boxShadow: '0 0 6px color-mix(in srgb, var(--sv-blue-light) 70%, transparent)',
            '--st-duration': s.duration,
            '--st-delay': s.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Map dot-grid + faint line grid */}
      <div className="bg-dots-dark absolute inset-0 [mask-image:radial-gradient(75%_65%_at_50%_42%,black,transparent)]" />
      <div className="bg-grid-faint absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_75%,transparent)]" />

      {/* Stylized skyline silhouette with glowing windows */}
      <svg
        viewBox={`0 0 ${SV_W} ${SV_H}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 h-[46%] w-full min-w-[900px]"
      >
        <defs>
          <linearGradient id="skylineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-navy-soft)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--sv-navy)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {BUILDINGS.map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={SV_H - h} width={w} height={h} fill="url(#skylineFill)" />
            <rect x={x} y={SV_H - h} width={w} height={2} fill="var(--sv-blue)" opacity="0.22" />
          </g>
        ))}
        {/* Antenna on tallest */}
        <line x1={584 + 24} y1={SV_H - 300} x2={584 + 24} y2={SV_H - 332} stroke="var(--sv-blue)" strokeWidth="2" opacity="0.5" />
        <circle cx={584 + 24} cy={SV_H - 334} r="3" fill="var(--sv-orange)" opacity="0.9" />
        {windows.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width={5}
            height={7}
            rx={1}
            className="sv-window hidden md:block"
            fill={w.orange ? 'var(--sv-orange-light)' : 'var(--sv-blue-light)'}
            style={{ '--w-duration': w.duration, '--w-delay': w.delay } as React.CSSProperties}
          />
        ))}
        {/* Ground fade */}
        <rect x="0" y={SV_H - 90} width={SV_W} height={90} fill="url(#skylineFill)" opacity="0.6" />
      </svg>

      {/* Rising particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="sv-particle absolute hidden rounded-full md:block"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: p.orange ? 'var(--sv-orange-light)' : 'var(--sv-blue-light)',
            boxShadow: p.orange
              ? '0 0 12px color-mix(in srgb, var(--sv-orange) 80%, transparent)'
              : '0 0 10px color-mix(in srgb, var(--sv-blue-light) 70%, transparent)',
            '--p-duration': p.duration,
            '--p-delay': p.delay,
            '--p-drift': p.drift,
            '--p-opacity': p.opacity,
          } as React.CSSProperties}
        />
      ))}

      {/* Brand map pins */}
      <span className="absolute left-[16%] top-[30%] hidden h-3 w-3 animate-pin rounded-full bg-sv-orange md:block" />
      <span className="absolute right-[20%] top-[24%] hidden h-2.5 w-2.5 animate-pin rounded-full bg-sv-blue md:block" style={{ animationDelay: '1.2s' }} />

      {/* Vignette + transition into next section */}
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_40%,transparent_55%,color-mix(in_srgb,var(--sv-navy)_55%,transparent))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-sv-navy/60 to-sv-surface" />
    </div>
  )
}
