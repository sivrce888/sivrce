'use client'

/**
 * AI Advisor — scam-radar shield + instant Q&A + TCO/ROI panel.
 * Pure functions from ai-copilot / scam-radar / 10x-engine — zero network,
 * zero deps. Lazy chunk (dynamic import) keeps it off the critical path.
 * Copy lives in listing/i18n.ts (all 10 locales, lt()); lib answers/flags
 * (ai-copilot, scam-radar) are ka/en/de — other locales fall back to English.
 */

import { useState } from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { answerPropertyQuestion, type PropertyCopilotContext } from '@/lib/ai-copilot'
import { evaluateListingFraudRisk, type FraudRiskTier } from '@/lib/trust/scam-radar'
import { calculate5YearRoiForecast, calculateTotalCostOfOwnership } from '@/lib/10x-engine'
import { useI18n } from '@/lib/i18n/context'
import { lt } from '@/components/listing/i18n'
import { formatUSD } from '@/lib/listing-format'

const TIER_CHIP: Record<FraudRiskTier, string> = {
  SAFE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  LOW_RISK: 'bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light',
  MEDIUM_RISK: 'bg-sv-orange/10 text-sv-orange-deep',
  HIGH_RISK_SUSPICIOUS: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const TIER_KEY: Record<FraudRiskTier, 'tierSafe' | 'tierLow' | 'tierMedium' | 'tierHigh'> = {
  SAFE: 'tierSafe',
  LOW_RISK: 'tierLow',
  MEDIUM_RISK: 'tierMedium',
  HIGH_RISK_SUSPICIOUS: 'tierHigh',
}

const FACT_KEY = {
  FACT: 'factFact',
  ESTIMATE: 'factEstimate',
  PREDICTION: 'factPrediction',
} as const

const QUESTION_KEYS: { key: string; label: 'aiQ1' | 'aiQ2' | 'aiQ3' | 'aiQ4' }[] = [
  { key: 'Is the price fair?', label: 'aiQ1' },
  { key: 'Investment potential?', label: 'aiQ2' },
  { key: 'Hidden costs and taxes?', label: 'aiQ3' },
  { key: 'Is it safe and verified?', label: 'aiQ4' },
]

export default function AiAdvisor({ ctx, isSale }: { ctx: PropertyCopilotContext; isSale: boolean }) {
  const { lang } = useI18n()
  const ka = lang === 'ka'

  const [active, setActive] = useState(0)
  const answer = answerPropertyQuestion(QUESTION_KEYS[active].key, ctx)
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
      aria-label={lt(lang, 'aiTitle')}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-control bg-sv-violet/10">
          <Sparkles className="h-5 w-5 text-sv-violet" aria-hidden />
        </span>
        <div>
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{lt(lang, 'aiTitle')}</h2>
          <p className="text-[12px] font-bold text-sv-ink/60">{lt(lang, 'aiSub')}</p>
        </div>
      </div>

      {/* Fraud shield */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black ${TIER_CHIP[fraud.tier]}`}>
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {lt(lang, TIER_KEY[fraud.tier])}
        </span>
        {fraud.riskScore > 0 && (
          <span className="text-[11px] font-bold text-sv-ink/50">
            {lt(lang, 'aiRiskScore', { n: fraud.riskScore })}
          </span>
        )}
      </div>
      {fraud.tier === 'HIGH_RISK_SUSPICIOUS' && (
        <div className="mt-3 rounded-module bg-red-500/[0.06] p-4 ring-1 ring-inset ring-red-500/15">
          <div className="text-[12px] font-black text-red-600 dark:text-red-400">{lt(lang, 'aiFlags')}</div>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] font-bold text-sv-ink/70">
            {fraud.flags.map((f) => (
              <li key={f.code}>{lang === 'ka' ? f.titleKa : lang === 'de' ? f.titleDe : f.titleEn}</li>
            ))}
          </ul>
          <div className="mt-3 text-[12px] font-black text-sv-ink">{lt(lang, 'aiTips')}</div>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] font-bold text-sv-ink/70">
            {(lang === 'ka'
              ? fraud.safetyTipsKa
              : lang === 'de'
              ? fraud.safetyTipsDe
              : fraud.safetyTipsEn
            ).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Q&A */}
      <div className="mt-6">
        <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{lt(lang, 'aiAsk')}</div>
        <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={lt(lang, 'aiAsk')}>
          {QUESTION_KEYS.map((q, i) => (
            <button
              key={q.key}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
                i === active
                  ? 'bg-sv-navy text-white'
                  : 'text-sv-ink/70 ring-1 ring-sv-ink/10 hover:text-sv-ink hover:ring-sv-violet/40'
              }`}
            >
              {lt(lang, q.label)}
            </button>
          ))}
        </div>
        <div
          aria-live="polite"
          className="mt-4 rounded-module bg-gradient-to-r from-sv-violet/[0.07] to-sv-blue/[0.07] p-5 ring-1 ring-inset ring-sv-violet/15"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-black tracking-[-0.01em] text-sv-ink">
              {ka ? answer.headlineKa : lang === 'de' ? answer.headlineDe : answer.headlineEn}
            </span>
            <span className="rounded-full bg-sv-ink/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sv-ink/60">
              {lt(lang, FACT_KEY[answer.factState] ?? 'factFact')}
            </span>
          </div>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sv-ink/70">
            {ka ? answer.bodyKa : lang === 'de' ? answer.bodyDe : answer.bodyEn}
          </p>
          <div className="mt-2 text-[11px] font-bold text-sv-ink/50">
            {lt(lang, 'aiConfidence', { n: answer.confidenceScore })}
          </div>
        </div>
      </div>

      {/* TCO + ROI — sale only */}
      {tco && roi && (
        <div className="mt-6">
          <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{lt(lang, 'aiTcoTitle')}</div>
          <dl className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              [lt(lang, 'aiAcquisition'), formatUSD(tco.totalAcquisitionCostUSD)],
              [lt(lang, 'aiFiveYear'), formatUSD(tco.total5YearCostUSD)],
              [lt(lang, 'aiRoi'), `+${roi.total5YearRoiPct}%`],
              [lt(lang, 'aiCap'), `${roi.capRatePct}%`],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-module bg-sv-cloud p-3.5">
                <dt className="text-[10px] font-black uppercase tracking-wider text-sv-ink/60">{label}</dt>
                <dd className="mt-1 text-[17px] font-black tracking-tight text-sv-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
