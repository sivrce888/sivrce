/**
 * SIVRCE AI Co-Pilot — Instant Conversational Advisor & Decision Engine.
 *
 * Answers property questions (price analysis, investment yield, hidden costs, neighborhood fit)
 * with deterministic evidence and transparency.
 * DB-free, lightweight, SSR-safe.
 */

import { calculateInvestmentMetrics } from '@/lib/sivrce-score'
import { calculateTotalCostOfOwnership } from '@/lib/10x-engine'
import { evaluateListingFraudRisk } from '@/lib/trust/scam-radar'

export interface PropertyCopilotContext {
  id: string
  title: string
  priceUSD: number
  areaSqm: number
  district: string
  city: string
  countryCode?: string
  /** Median $/m² of real district comps — absent when there are none, so
   *  answers never present the listing's own price as a "district average". */
  districtMedianPerSqm?: number
  estimatedMonthlyRentUSD?: number
  /** Listing body copy — drives the scam-radar payment-phrase check (+35 risk). */
  description?: string
  sellerPhoneVerified?: boolean
  photosCount: number
  hasCadastralCode?: boolean
}

export interface CopilotAnswer {
  questionCategory: 'valuation' | 'investment' | 'tco_hidden_costs' | 'trust_safety' | 'general'
  headlineEn: string
  headlineKa: string
  headlineDe: string
  bodyEn: string
  bodyKa: string
  bodyDe: string
  confidenceScore: number
  factState: 'FACT' | 'ESTIMATE' | 'PREDICTION'
}

export function answerPropertyQuestion(
  question: string,
  context: PropertyCopilotContext
): CopilotAnswer {
  const q = question.toLowerCase()

  // 1. Valuation Question ("Why is it cheap / expensive / value?")
  if (/cheap|expensive|price|value|ფასი|იაფი|ძვირი|ღირს/i.test(q)) {
    const pricePerSqm = Math.round(context.priceUSD / Math.max(1, context.areaSqm))

    // No real comps → say so. A benchmark against the listing's own $/m²
    // would be a circular claim dressed as a FACT.
    if (!context.districtMedianPerSqm) {
      return {
        questionCategory: 'valuation',
        headlineEn: 'Not enough local comps for a price verdict yet',
        headlineKa: 'საკმარისი ადგილობრივი ანალოგი ფასის შესაფასებლად ჯერ არ არის',
        bodyEn: `This one is $${pricePerSqm}/m², but there aren't enough recent ${context.district} listings to benchmark it honestly. Verified cadastral data and the photo set are the best signals for now.`,
        bodyKa: `ფასი $${pricePerSqm}/მ²-ია, მაგრამ ${context.district}-ში ბოლო განცხადებები მწირია პატიოსანი შედარებისთვის. ჯერ საუკეთესი საყრდენი საკადასტრო მონაცემები და ფოტოებია.`,
        headlineDe: 'Noch nicht genug Vergleichsangebote für ein Preisurteil',
        bodyDe: `Dieser hier liegt bei $${pricePerSqm}/m², doch es gibt zu wenige aktuelle Angebote in ${context.district} für einen ehrlichen Vergleich. Katasterdaten und Fotos sind vorerst die besten Anhaltspunkte.`,
        confidenceScore: 40,
        factState: 'ESTIMATE',
      }
    }

    const diffPct = Math.round(((pricePerSqm - context.districtMedianPerSqm) / context.districtMedianPerSqm) * 100)

    if (diffPct < -10) {
      return {
        questionCategory: 'valuation',
        headlineEn: `Priced ${Math.abs(diffPct)}% below district median ($${pricePerSqm}/m² vs $${context.districtMedianPerSqm}/m²)`,
        headlineKa: `ფასი უბნის საშუალოზე ${Math.abs(diffPct)}%-ით დაბალია ($${pricePerSqm}/მ² vs $${context.districtMedianPerSqm}/მ²)`,
        bodyEn: `This property is priced attractively compared to the ${context.district} median. Check photos and cadastral verification to ensure no renovation is required.`,
        bodyKa: `ეს ბინა ${context.district}-ის საშუალოზე იაფია. შეამოწმეთ ფოტოები და საკადასტრო კოდი რემონტის საჭიროების დასადგენად.`,
        headlineDe: `Preis ${Math.abs(diffPct)}% unter Bezirksmedian ($${pricePerSqm}/m² vs. $${context.districtMedianPerSqm}/m²)`,
        bodyDe: `Diese Immobilie ist im Vergleich zum Median in ${context.district} attraktiv bepreist. Prüfen Sie Fotos und Kataster-Nachweis, um einen Renovierungsbedarf auszuschließen.`,
        confidenceScore: 90,
        factState: 'FACT',
      }
    }

    return {
      questionCategory: 'valuation',
      headlineEn: `Fair market pricing within ${context.district} benchmark`,
      headlineKa: `საბაზრო ფასი ${context.district}-ის ფარგლებში`,
      bodyEn: `At $${pricePerSqm}/m², this listing aligns closely with the current ${context.district} district average of $${context.districtMedianPerSqm}/m².`,
      bodyKa: `$${pricePerSqm}/მ² ფასით ეს ბინა სრულად შეესაბამება ${context.district}-ის საშუალო საბაზრო ნორმას ($${context.districtMedianPerSqm}/მ²).`,
      headlineDe: `Marktgerechter Preis im Rahmen des ${context.district}-Benchmarks`,
      bodyDe: `Mit $${pricePerSqm}/m² liegt dieses Inserat nahe am aktuellen Bezirksdurchschnitt von $${context.districtMedianPerSqm}/m² in ${context.district}.`,
      confidenceScore: 85,
      factState: 'FACT',
    }
  }

  // 2. Investment Yield Question ("Is this good for rent / investment / ROI?")
  if (/invest|yield|rent|roi|ინვესტიც|იჯარა|მომგებიან/i.test(q)) {
    const monthlyRent = context.estimatedMonthlyRentUSD ?? Math.round((context.priceUSD * 0.08) / 12)
    const metrics = calculateInvestmentMetrics({
      price: context.priceUSD,
      estimatedMonthlyRent: monthlyRent,
      areaSqm: context.areaSqm,
      districtMedianPerSqm: context.districtMedianPerSqm,
    })

    return {
      questionCategory: 'investment',
      headlineEn: `Projected Gross Yield: ${metrics.grossYieldPct}% per year`,
      headlineKa: `საორიენტაციო წლიური მომგებიანობა: ${metrics.grossYieldPct}%`,
      bodyEn: `Estimated monthly rental income is ~$${monthlyRent}/month. Expected annual gross yield is ${metrics.grossYieldPct}%, with net cashflow estimated at ~$${metrics.cashflowMonthlyEst}/month.`,
      bodyKa: `საორიენტაციო თვიური იჯარა ~$${monthlyRent}/თვეში. მოსალოდნელი წლიური მომგებიანობა ${metrics.grossYieldPct}%-ია.`,
      headlineDe: `Prognostizierte Bruttorendite: ${metrics.grossYieldPct}% pro Jahr`,
      bodyDe: `Die geschätzte Monatsmiete beträgt ~$${monthlyRent}. Die erwartete jährliche Bruttorendite liegt bei ${metrics.grossYieldPct}%, der Nettocashflow bei ~$${metrics.cashflowMonthlyEst}/Monat.`,
      confidenceScore: 80,
      factState: 'ESTIMATE',
    }
  }

  // 3. TCO / Hidden Costs Question ("What are closing fees / taxes / total cost?")
  if (/tax|cost|fees|notary|tco|ხარჯი|გადასახად|ნოტარიუს/i.test(q)) {
    const tco = calculateTotalCostOfOwnership(context.priceUSD, context.countryCode ?? 'GE')

    return {
      questionCategory: 'tco_hidden_costs',
      headlineEn: `Total Acquisition Cost: ~$${tco.totalAcquisitionCostUSD.toLocaleString()}`,
      headlineKa: `სრული შესყიდვის ხარჯი: ~$${tco.totalAcquisitionCostUSD.toLocaleString()}`,
      bodyEn: `Includes registration tax (~$${tco.registrationTaxUSD}) and legal/notary fees (~$${tco.notaryLegalUSD}). Estimated annual upkeep is ~$${tco.estimatedAnnualUpkeepUSD}/year.`,
      bodyKa: `მოიცავს რეგისტრაციას (~$${tco.registrationTaxUSD}) და სანოტარო მომსახურებას (~$${tco.notaryLegalUSD}). წლიური მოვლის ხარჯი ~$${tco.estimatedAnnualUpkeepUSD}/წელში.`,
      headlineDe: `Gesamterwerbskosten: ~$${tco.totalAcquisitionCostUSD.toLocaleString()}`,
      bodyDe: `Enthält Registrierungssteuer (~$${tco.registrationTaxUSD}) und Notar-/Rechtskosten (~$${tco.notaryLegalUSD}). Geschätzte jährliche Instandhaltung ~$${tco.estimatedAnnualUpkeepUSD}/Jahr.`,
      confidenceScore: 95,
      factState: 'FACT',
    }
  }

  // 4. Trust & Safety Question ("Is this safe / verified / real?")
  if (/safe|scam|trust|verified|უსაფრთხო|ნდობა|დამოწმებულ/i.test(q)) {
    const fraud = evaluateListingFraudRisk({
      priceUSD: context.priceUSD,
      areaSqm: context.areaSqm,
      districtMedianPerSqm: context.districtMedianPerSqm,
      description: context.description,
      sellerPhoneVerified: context.sellerPhoneVerified,
      photosCount: context.photosCount,
      hasCadastralCode: context.hasCadastralCode,
    })

    return {
      questionCategory: 'trust_safety',
      headlineEn: `Trust Assessment: ${fraud.tier} (Risk Score ${fraud.riskScore}/100)`,
      headlineKa: `ნდობის შეფასება: ${fraud.tier} (რისკის ქულა ${fraud.riskScore}/100)`,
      bodyEn: fraud.flags.length > 0 ? `Risk factors detected: ${fraud.flags.map((f) => f.titleEn).join('; ')}` : 'This listing passes all primary verification safety checks.',
      bodyKa: fraud.flags.length > 0 ? `დაფიქსირდა რისკ-ფაქტორები: ${fraud.flags.map((f) => f.titleKa).join('; ')}` : 'განცხადებამ წარმატებით გაიარა უსაფრთხოების შემოწმება.',
      headlineDe: `Vertrauensbewertung: ${fraud.tier} (Risikowert ${fraud.riskScore}/100)`,
      bodyDe: fraud.flags.length > 0 ? `Erkannte Risikofaktoren: ${fraud.flags.map((f) => f.titleDe).join('; ')}` : 'Dieses Inserat besteht alle primären Verifizierungs- und Sicherheitsprüfungen.',
      confidenceScore: 90,
      factState: 'FACT',
    }
  }

  // General Fallback
  return {
    questionCategory: 'general',
    headlineEn: `Property Summary for ${context.title}`,
    headlineKa: `ქონების შეფასება — ${context.title}`,
    bodyEn: `${context.areaSqm}m² property located in ${context.district}, ${context.city} for $${context.priceUSD.toLocaleString()} ($${Math.round(context.priceUSD / Math.max(1, context.areaSqm))}/m²).`,
    bodyKa: `${context.areaSqm}მ² ბინა ${context.district}-ში (${context.city}), ფასი $${context.priceUSD.toLocaleString()} ($${Math.round(context.priceUSD / Math.max(1, context.areaSqm))}/მ²).`,
    headlineDe: `Immobilien-Zusammenfassung für ${context.title}`,
    bodyDe: `${context.areaSqm} m² Immobilie in ${context.district}, ${context.city}, Preis $${context.priceUSD.toLocaleString()} ($${Math.round(context.priceUSD / Math.max(1, context.areaSqm))}/m²).`,
    confidenceScore: 85,
    factState: 'FACT',
  }
}
