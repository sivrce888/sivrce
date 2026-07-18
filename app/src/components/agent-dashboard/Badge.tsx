import type { BadgeTone } from "./format"

const tones: Record<BadgeTone, string> = {
  green: "bg-sv-blue/10 text-sv-blue",
  blue: "bg-sv-blue/10 text-sv-blue",
  orange: "bg-sv-orange/10 text-sv-orange",
  red: "bg-sv-orange/10 text-sv-orange",
  neutral: "bg-sv-ink/6 text-sv-ink/60",
}

/** Small status pill. Server component. */
export default function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}
    >
      {label}
    </span>
  )
}
