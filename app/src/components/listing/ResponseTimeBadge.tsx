'use client'

/**
 * ResponseTimeBadge — shows agent/agency average response time.
 * ponytail: display-only component, accepts data as props.
 * Wire to chat message timestamps when ready.
 */

import { Clock, Zap, MessageCircle } from 'lucide-react'

interface ResponseTimeBadgeProps {
  /** Average response time in minutes. Null = not enough data. */
  avgMinutes: number | null
  /** Total messages responded to (for confidence). */
  responseCount?: number
  lang?: 'en' | 'de' | 'ka'
  className?: string
}

function formatTime(minutes: number, lang: 'en' | 'de' | 'ka'): string {
  if (minutes < 1) {
    return lang === 'de' ? 'Sofort' : lang === 'ka' ? 'მყისიერად' : 'Instant'
  }
  if (minutes < 60) {
    const m = Math.round(minutes)
    if (lang === 'de') return `${m} Min.`
    if (lang === 'ka') return `${m} წთ.`
    return `${m} min`
  }
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (lang === 'de') return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
  if (lang === 'ka') return m > 0 ? `${h} სთ ${m} წთ.` : `${h} სთ`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function speedLabel(minutes: number | null, lang: 'en' | 'de' | 'ka'): { label: string; color: string; icon: typeof Zap } {
  if (minutes === null) {
    return {
      label: lang === 'de' ? 'Noch keine Daten' : lang === 'ka' ? 'მონაცემები არ არის' : 'No data yet',
      color: '#999',
      icon: Clock,
    }
  }
  if (minutes < 5) {
    return {
      label: lang === 'de' ? 'Blitzschnell' : lang === 'ka' ? 'ელვისებურად სწრაფი' : 'Lightning fast',
      color: '#007a33',
      icon: Zap,
    }
  }
  if (minutes < 30) {
    return {
      label: lang === 'de' ? 'Sehr schnell' : lang === 'ka' ? 'ძალიან სწრაფი' : 'Very fast',
      color: '#3aa44a',
      icon: MessageCircle,
    }
  }
  if (minutes < 120) {
    return {
      label: lang === 'de' ? 'Schnell' : lang === 'ka' ? 'სწრაფი' : 'Fast',
      color: '#ffd700',
      icon: Clock,
    }
  }
  return {
    label: lang === 'de' ? 'Mittel' : lang === 'ka' ? 'საშუალო' : 'Average',
    color: '#f58220',
    icon: Clock,
  }
}

export function ResponseTimeBadge({ avgMinutes, responseCount = 0, lang = 'en', className = '' }: ResponseTimeBadgeProps) {
  const { label, color, icon: Icon } = speedLabel(avgMinutes, lang)
  const timeStr = avgMinutes !== null ? formatTime(avgMinutes, lang) : null

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
      </span>
      <div className="flex flex-col">
        <span className="text-[13px] font-black" style={{ color }}>
          {timeStr ?? label}
        </span>
        {avgMinutes !== null && responseCount > 0 && (
          <span className="text-[10px] font-bold text-sv-ink/40">{label}</span>
        )}
      </div>
    </div>
  )
}

/** Compact inline variant for listing agent strip. */
export function ResponseTimeInline({ avgMinutes, lang = 'en', className = '' }: { avgMinutes: number | null; lang?: 'en' | 'de' | 'ka'; className?: string }) {
  const timeStr = avgMinutes !== null ? formatTime(avgMinutes, lang) : null
  if (!timeStr) return null
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold text-sv-ink/50 ${className}`}>
      <Clock className="h-3 w-3" aria-hidden />
      {timeStr}
    </span>
  )
}
