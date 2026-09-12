/**
 * SIVRCE Agent OS — Agent Workspace Intelligence & CRM AI engine.
 *
 * Provides lead scoring, client matching, follow-up prioritization ("Which leads to contact today"),
 * valuation tools, and agent trust metrics.
 */

export interface AgentLead {
  id: string
  name: string
  phone: string
  email?: string
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'offer_made' | 'negotiating' | 'closed_won' | 'closed_lost'
  budgetUSD?: number
  targetDistrict?: string
  preferredDealType?: 'sale' | 'rent' | 'daily'
  lastContactedAt?: string
  nextFollowUpAt?: string
  notes?: string
}

export interface RecommendedAction {
  leadId: string
  leadName: string
  priorityScore: number // 0 to 100
  actionType: 'call' | 'schedule_viewing' | 'send_matching_properties' | 'follow_up_offer'
  reasonEn: string
  reasonKa: string
}

/** Scores agent leads and returns the top priority actions for the day */
export function prioritizeAgentLeads(leads: AgentLead[]): RecommendedAction[] {
  const actions: RecommendedAction[] = []
  const now = new Date()

  for (const lead of leads) {
    let score = 50
    let actionType: RecommendedAction['actionType'] = 'call'
    let reasonEn = 'Regular follow-up scheduled'
    let reasonKa = 'გეგმიური დაკავშირება'

    // Status weighting
    if (lead.status === 'offer_made' || lead.status === 'negotiating') {
      score += 35
      actionType = 'follow_up_offer'
      reasonEn = 'Active offer / negotiation requires prompt decision'
      reasonKa = 'აქტიური შეთავაზების ან მოლაპარაკების მონიტორინგი'
    } else if (lead.status === 'viewing_scheduled') {
      score += 25
      actionType = 'schedule_viewing'
      reasonEn = 'Confirm viewing details with client'
      reasonKa = 'დაათვალიერების დეტალების დადასტურება'
    } else if (lead.status === 'new') {
      score += 30
      actionType = 'send_matching_properties'
      reasonEn = 'New lead — send initial property matching report'
      reasonKa = 'ახალი ლიდი — შესაბამისი ბინების გაგზავნა'
    }

    // Overdue follow-up check
    if (lead.nextFollowUpAt) {
      const followUpDate = new Date(lead.nextFollowUpAt)
      if (followUpDate <= now) {
        score += 20
        reasonEn += ' (Overdue follow-up date)'
        reasonKa += ' (ვადაგადაცილებული)'
      }
    }

    actions.push({
      leadId: lead.id,
      leadName: lead.name,
      priorityScore: Math.min(100, score),
      actionType,
      reasonEn,
      reasonKa,
    })
  }

  return actions.sort((a, b) => b.priorityScore - a.priorityScore)
}

export interface ClientMatchResult {
  propertyId: string
  matchScore: number // 0 to 100
  matchingFactors: string[]
}

/** Matches client budget, district, and deal preferences against available listings */
export function matchListingsForLead(
  lead: AgentLead,
  listings: { id: string; priceUSD: number; district?: string; dealType?: string }[]
): ClientMatchResult[] {
  const results: ClientMatchResult[] = []

  for (const prop of listings) {
    let score = 50
    const matchingFactors: string[] = []

    if (lead.preferredDealType && prop.dealType && lead.preferredDealType === prop.dealType) {
      score += 20
      matchingFactors.push(`Matching deal type (${prop.dealType})`)
    }

    if (lead.targetDistrict && prop.district && lead.targetDistrict === prop.district) {
      score += 25
      matchingFactors.push(`Target district match (${prop.district})`)
    }

    if (lead.budgetUSD && prop.priceUSD) {
      if (prop.priceUSD <= lead.budgetUSD) {
        score += 25
        matchingFactors.push(`Within budget ($${prop.priceUSD.toLocaleString()} <= $${lead.budgetUSD.toLocaleString()})`)
      } else if (prop.priceUSD <= lead.budgetUSD * 1.1) {
        score += 10
        matchingFactors.push('Slightly above budget (within 10%)')
      }
    }

    if (score >= 60) {
      results.push({
        propertyId: prop.id,
        matchScore: Math.min(100, score),
        matchingFactors,
      })
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore)
}
