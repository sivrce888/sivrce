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

interface Star {
  top: string
  left: string
  size: number
  duration: string
  delay: string
  min: string
  max: string
  hue: 'warm' | 'blue' | 'white'
  flare: boolean
}

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

/* Sparse twinkling star field — confined to the upper sky so it never collides with the H1/search panel */
function buildStars(): Star[] {
  const rnd = seeded(91)
  return Array.from({ length: 30 }, () => {
    const size = 1.5 + rnd() * 2.1
    const h = rnd()
    return {
      top: `${(4 + rnd() * 42).toFixed(2)}%`,
      left: `${(rnd() * 96).toFixed(2)}%`,
      size,
      duration: `${(3 + rnd() * 6).toFixed(1)}s`,
      delay: `${(-rnd() * 9).toFixed(1)}s`,
      min: (0.12 + rnd() * 0.25).toFixed(2),
      max: (0.75 + rnd() * 0.25).toFixed(2),
      /* ponytail: mostly brand-blue/white, a few warm champagne stars echo the moon */
      hue: h > 0.86 ? 'warm' : h > 0.42 ? 'blue' : 'white',
      flare: size > 3,
    }
  })
}

const particles = buildParticles()
const stars = buildStars()

export default function HeroBackground() {
  const root = useRef<HTMLDivElement>(null)

  // Pause ambient animations off-screen; pointer parallax for fine pointers only
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('sv-anim-paused', !entry.isIntersecting)
    })
    io.observe(el)

    const fine = window.matchMedia('(pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const host = el.parentElement ?? el
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--px', `${(x * 18).toFixed(1)}px`)
      el.style.setProperty('--py', `${(y * 12).toFixed(1)}px`)
    }
    if (fine.matches && !calm.matches) host.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      io.disconnect()
      host.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div ref={root} className="sv-sky-in absolute inset-0 overflow-hidden bg-sv-navy" aria-hidden>
      {/* Aurora gradient field — brand blue / violet / orange; drifts with the pointer */}
      <div
        className="absolute inset-0 will-change-transform [transition:transform_0.9s_cubic-bezier(0.21,0.65,0.2,1)]"
        style={{ transform: 'translate3d(var(--px, 0px), var(--py, 0px), 0)' }}
      >
        {/* ponytail: static aurora — scale keyframes on blur blobs scored CLS 0.30 in LH */}
        <div className="absolute -left-[15%] top-[-25%] h-[70%] w-[60%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue)_34%,transparent),transparent_65%)] blur-[90px]" />
        <div className="absolute right-[-12%] top-[-10%] h-[65%] w-[55%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-violet)_26%,transparent),transparent_65%)] blur-[100px]" />
        <div className="absolute bottom-[-30%] left-[25%] h-[70%] w-[50%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-orange)_16%,transparent),transparent_65%)] blur-[110px]" />
        <div className="absolute left-1/2 top-[30%] h-[50%] w-[46%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-blue)_14%,transparent),transparent_70%)] blur-[110px]" />
      </div>

      {/* Moon — warm gibbous carved from bg, champagne glow (brand orange-light) */}
      <div className="animate-float absolute right-[10%] top-[8%] hidden h-24 w-24 md:block">
        <div className="sv-moon-halo absolute -inset-8 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--sv-orange-light)_38%,transparent),transparent_65%)] blur-3xl" />
        <div className="absolute left-4 top-3 h-14 w-14 overflow-hidden rounded-full shadow-[0_0_30px_6px_color-mix(in_srgb,var(--sv-orange-light)_36%,transparent)]">
          {/* ponytail: warm moon + 2 craters in one background shorthand — zero new tokens, zero extra divs */}
          <div className="absolute left-0 top-0 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_62%,color-mix(in_srgb,var(--sv-navy)_16%,transparent)_0_11%,transparent_12%),radial-gradient(circle_at_52%_38%,color-mix(in_srgb,var(--sv-navy)_12%,transparent)_0_7%,transparent_8%),radial-gradient(circle_at_36%_30%,#ffffff_0%,color-mix(in_srgb,#ffffff_26%,var(--sv-orange-light))_46%,var(--sv-orange-light)_100%)]" />
          {/* ponytail: crescent carved with an offset navy disc — same color as section bg, zero new tokens */}
          <div className="absolute left-8 top-[-5px] h-14 w-14 rounded-full bg-sv-navy" />
        </div>
      </div>

      {/* Comet — rare streak across the upper sky */}
      <span className="sv-comet absolute right-[6%] top-[10%] hidden h-[2px] w-[130px] rounded-full bg-[linear-gradient(90deg,transparent,var(--sv-blue-light))] opacity-0 shadow-[0_0_10px_2px_color-mix(in_srgb,var(--sv-blue-light)_60%,transparent)] md:block" />

      {/* Twinkling stars — upper sky only, staggered; closest parallax layer */}
      <div
        className="absolute inset-0 will-change-transform [transition:transform_0.9s_cubic-bezier(0.21,0.65,0.2,1)]"
        style={{ transform: 'translate3d(calc(var(--px, 0px) * 1.6), calc(var(--py, 0px) * 1.6), 0)' }}
      >
        {stars.map((s, i) => (
          <span
            key={i}
            className={`sv-star absolute hidden rounded-full md:block${s.flare ? ' sv-star-flare' : ''}`}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              background: s.hue === 'warm' ? 'var(--sv-orange-light)' : s.hue === 'blue' ? 'var(--sv-blue-light)' : 'rgba(255,255,255,0.85)',
              boxShadow: `0 0 6px color-mix(in srgb, ${s.hue === 'warm' ? 'var(--sv-orange)' : 'var(--sv-blue-light)'} 70%, transparent)`,
              '--st-duration': s.duration,
              '--st-delay': s.delay,
              '--st-min': s.min,
              '--st-max': s.max,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Map dot-grid + faint line grid */}
      <div className="bg-dots-dark absolute inset-0 [mask-image:radial-gradient(75%_65%_at_50%_42%,black,transparent)]" />
      <div className="bg-grid-faint absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_75%,transparent)]" />

      {/* City light glow above the horizon */}
      <div className="absolute bottom-[34%] left-1/2 h-[24%] w-[72%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_bottom,color-mix(in_srgb,var(--sv-blue)_17%,transparent),transparent_70%)] blur-2xl" />

      {/* ponytail: CSS horizon only — SVG skyline scored CLS 0.35 under LH mobile */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[42svh] bg-[linear-gradient(to_top,var(--sv-navy)_0%,var(--sv-navy-soft)_55%,transparent_100%)] opacity-90"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[18svh] h-px bg-gradient-to-r from-transparent via-sv-blue/35 to-transparent"
      />

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
