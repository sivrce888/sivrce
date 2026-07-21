/* ponytail: CLS-safe hero wash — no overflow % blobs / parallax / SVG.
   Those scored 0.30–0.56 CLS under LH mobile. Atmosphere stays via CSS only. */

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-sv-navy" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 70% 55% at 25% 18%, color-mix(in srgb, var(--sv-blue) 32%, transparent), transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 82% 12%, color-mix(in srgb, var(--sv-violet) 22%, transparent), transparent 58%)',
            'radial-gradient(ellipse 55% 40% at 50% 100%, color-mix(in srgb, var(--sv-blue) 14%, transparent), transparent 55%)',
          ].join(','),
        }}
      />
      <div className="bg-dots-dark absolute inset-0 [mask-image:radial-gradient(75%_65%_at_50%_42%,black,transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_40%,transparent_55%,color-mix(in_srgb,var(--sv-navy)_55%,transparent))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-sv-navy/60 to-sv-surface" />
    </div>
  )
}
