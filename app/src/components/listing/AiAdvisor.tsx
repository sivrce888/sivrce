'use client'

/**
 * AI Advisor — scam-radar shield + instant Q&A + TCO/ROI panel.
 * Pure functions from ai-copilot / scam-radar / 10x-engine — zero network,
 * zero deps. Lazy chunk (dynamic import) keeps it off the critical path.
 * ponytail: en/ka bilingual inline (CompareClient precedent); upgrade to
 * full 10-locale dict in listing/i18n.ts when other locales demand it.
 */

import { useState } from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { answerPropertyQuestion, type PropertyCopilotContext } from '@/lib/ai-copilot'
import { evaluateListingFraudRisk, type FraudRiskTier } from '@/lib/trust/scam-radar'
import { calculate5YearRoiForecast, calculateTotalCostOfOwnership } from '@/lib/10x-engine'
import { useI18n } from '@/lib/i18n/context'
import { formatUSD } from '@/lib/listing-format'

const TIER_CHIP: Record<FraudRiskTier, string> = {
  SAFE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  LOW_RISK: 'bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light',
  MEDIUM_RISK: 'bg-sv-orange/10 text-sv-orange-deep',
  HIGH_RISK_SUSPICIOUS: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const TIER_LABEL: Record<FraudRiskTier, [string, string]> = {
  SAFE: ['Safety check passed', 'უსაფრთხოების შემოწმება გავლილია'],
  LOW_RISK: ['Low risk — verify details', 'დაბალი რისკი — შეამოწმეთ დეტალები'],
  MEDIUM_RISK: ['Medium risk — caution advised', 'საშუალო რისკი — იყავით ფრთხილად'],
  HIGH_RISK_SUSPICIOUS: ['High risk — likely suspicious', 'მაღალი რისკი — სავარაუდოდ საეჭვოა'],
}

const FACT_LABEL: Record<string, [string, string]> = {
  FACT: ['Fact', 'ფაქტი'],
  ESTIMATE: ['Estimate', 'შეფასება'],
  PREDICTION: ['Projection', 'პროგნოზი'],
}

const QUESTIONS: { key: string; en: string; ka: string }[] = [
  { key: 'Is the price fair?', en: 'Is the price fair?', ka: 'ფასი სამართლიანია?' },
  { key: 'Investment potential?', en: 'Investment yield?', ka: 'საინვესტიციო პოტენციალი?' },
  { key: 'Hidden costs and taxes?', en: 'Hidden costs?', ka: 'დამალული ხარჯები?' },
  { key: 'Is it safe and verified?', en: 'Is it safe?', ka: 'უსაფრთხოა?' },
]

const S = {
  title: ['AI Advisor', 'AI მრჩეველი'],
  sub: ['Instant answers from verified data — no waiting, no calls', 'მყისიერი პასუხები გადამოწმებული მონაცემებით'],
  ask: ['Ask about this property', 'ჰკითხე ქონების შესახებ'],
  confidence: ['{n}% confidence', 'სანდოობა {n}%'],
  tcoTitle: ['True cost of ownership', 'სრული მფლობელობის ღირებულება'],
  acquisition: ['Total acquisition', 'სრული შესყიდვა'],
  fiveYear: ['5-year total cost', '5 წლის ჯამური ხარჯი'],
  roi: ['Projected 5-yr ROI', '5 წლის პროგნოზული ROI'],
  cap: ['Cap rate', 'Cap rate'],
  flags: ['Risk factors', 'რისკ-ფაქტორები'],
  tips: ['Safety tips', 'უსაფრთხოების რჩევები'],
} as const

export default function AiAdvisor({ ctx, isSale }: { ctx: PropertyCopilotContext; isSale: boolean }) {
  const { lang } = useI18n()
  const ka = lang === 'ka'
  const pick = (p: [string, string] | readonly [string, string]) => (ka ? p[1] : p[0])

  const [active, setActive] = useState(0)
  const answer = answerPropertyQuestion(QUESTIONS[active].key, ctx)
  const fraud = evaluateListingFraudRisk({
    priceUSD: ctx.priceUSD,
    areaSqm: ctx.areaSqm,
    districtMedianPerSqm: ctx.districtMedianPerSqm,
    description: ctx.description,
    sellerPhoneVerified: ctx.sellerPhoneVerified,
    photosCount: ctx.photosCount,
    hasCadastralCode: ctx.hasCadastralCode,
  })
  const tco = isSale ? calculateTotalCostOfOwnership(ctx.priceUSD, ctx.countryCode ?? 'GE') : null
  const roi = isSale && ctx.estimatedMonthlyRentUSD
    ? calculate5YearRoiForecast(ctx.priceUSD, ctx.estimatedMonthlyRentUSD)
    : null

  return (
    <section
      className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8"
      aria-label={pick(S.title)}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-control bg-sv-violet/10">
          <Sparkles className="h-5 w-5 text-sv-violet" aria-hidden />
        </span>
        <div>
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{pick(S.title)}</h2>
          <p className="text-[12px] font-bold text-sv-ink/60">{pick(S.sub)}</p>
        </div>
      </div>

      {/* Fraud shield */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black ${TIER_CHIP[fraud.tier]}`}>
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {pick(TIER_LABEL[fraud.tier])}
        </span>
        {fraud.riskScore > 0 && (
          <span className="text-[11px] font-bold text-sv-ink/50">
            {ka ? `რისკი ${fraud.riskScore}/100` : `Risk ${fraud.riskScore}/100`}
          </span>
        )}
      </div>
      {fraud.tier === 'HIGH_RISK_SUSPICIOUS' && (
        <div className="mt-3 rounded-module bg-red-500/[0.06] p-4 ring-1 ring-inset ring-red-500/15">
          <div className="text-[12px] font-black text-red-600 dark:text-red-400">{pick(S.flags)}</div>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] font-bold text-sv-ink/70">
            {fraud.flags.map((f) => <li key={f.code}>{ka ? f.titleKa : f.titleEn}</li>)}
          </ul>
          <div className="mt-3 text-[12px] font-black text-sv-ink">{pick(S.tips)}</div>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] font-bold text-sv-ink/70">
            {(ka ? fraud.safetyTipsKa : fraud.safetyTipsEn).map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      )}

      {/* Q&A */}
      <div className="mt-6">
        <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{pick(S.ask)}</div>
        <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={pick(S.ask)}>
          {QUESTIONS.map((q, i) => (
            <button
              key={q.key}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
                i === active
                  ? 'bg-sv-violet text-white'
                  : 'text-sv-ink/70 ring-1 ring-sv-ink/10 hover:text-sv-ink hover:ring-sv-violet/40'
              }`}
            >
              {ka ? q.ka : q.en}
            </button>
          ))}
        </div>
        <div
          aria-live="polite"
          className="mt-4 rounded-module bg-gradient-to-r from-sv-violet/[0.07] to-sv-blue/[0.07] p-5 ring-1 ring-inset ring-sv-violet/15"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-black tracking-[-0.01em] text-sv-ink">
              {ka ? answer.headlineKa : answer.headlineEn}
            </span>
            <span className="rounded-full bg-sv-ink/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sv-ink/60">
              {pick(FACT_LABEL[answer.factState] ?? FACT_LABEL.FACT)}
            </span>
          </div>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sv-ink/70">
            {ka ? answer.bodyKa : answer.bodyEn}
          </p>
          <div className="mt-2 text-[11px] font-bold text-sv-ink/50">
            {pick(S.confidence).replace('{n}', String(answer.confidenceScore))}
          </div>
        </div>
      </div>

      {/* TCO + ROI — sale only */}
      {tco && roi && (
        <div className="mt-6">
          <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{pick(S.tcoTitle)}</div>
          <dl className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              [pick(S.acquisition), formatUSD(tco.totalAcquisitionCostUSD)],
              [pick(S.fiveYear), formatUSD(tco.total5YearCostUSD)],
              [pick(S.roi), `+${roi.total5YearRoiPct}%`],
              [pick(S.cap), `${roi.capRatePct}%`],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-module bg-sv-cloud p-3.5">
                <dt className="text-[10px] font-black uppercase tracking-wider text-sv-ink/50">{label}</dt>
                <dd className="mt-1 text-[17px] font-black tracking-tight text-sv-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
