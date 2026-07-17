"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Crown, Flame, Sparkles, Loader2, ChevronRight } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TierInfo {
  key: string
  label: string
  priceTetri: number
  durationDays: number
  icon: typeof Crown
  gradient: string
  description: string
}

const TIERS: TierInfo[] = [
  {
    key: "vip",
    label: "VIP",
    priceTetri: 99_00,
    durationDays: 30,
    icon: Flame,
    gradient: "from-sv-blue to-sv-violet",
    description: "გამორჩეული განცხადება, მეტი ნახვა, პრიორიტეტი ძიებაში",
  },
  {
    key: "super_vip",
    label: "VIP+",
    priceTetri: 199_00,
    durationDays: 30,
    icon: Flame,
    gradient: "from-sv-blue to-sv-violet",
    description: "TOP პოზიცია, გაზრდილი ნდობის ქულა, 3x მეტი ნახვა",
  },
  {
    key: "diamond",
    label: "SUPER VIP",
    priceTetri: 499_00,
    durationDays: 30,
    icon: Crown,
    gradient: "from-sv-orange to-sv-orange-deep",
    description: "მაქსიმალური ხილვადობა, AI რეკომენდაციები, ექსკლუზივი",
  },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TierPurchaseButtonProps {
  listingId: string
  currentTier: string
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TierPurchaseButton({
  listingId,
  currentTier,
  className = "",
}: TierPurchaseButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number> | null>(null)

  // Live prices on first open — displayed price must match what the server charges.
  useEffect(() => {
    if (!open || prices) return
    fetch("/api/payments/create-order")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { tiers?: Record<string, { priceTetri: number }> } | null) => {
        if (!d?.tiers) return
        setPrices(
          Object.fromEntries(
            Object.entries(d.tiers).map(([k, v]) => [k, v.priceTetri]),
          ),
        )
      })
      .catch(() => {}) // ponytail: hardcoded TIERS fallback is fine when offline
  }, [open, prices])

  const purchase = async (tier: string) => {
    setLoading(tier)
    setError(null)
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "შეცდომა")
        return
      }
      // Redirect to payment page
      if (data.order?.redirectUrl) {
        window.location.assign(data.order.redirectUrl)
      }
    } catch {
      setError("ქსელის შეცდომა")
    } finally {
      setLoading(null)
    }
  }

  const tierRank: Record<string, number> = { standard: 0, vip: 1, super_vip: 2, diamond: 3 }
  const currentRank = tierRank[currentTier] ?? 0

  // Only show tiers above current
  const available = TIERS.filter((t) => tierRank[t.key] > currentRank)

  if (available.length === 0) {
    return (
      <div className={`rounded-control bg-gradient-to-r from-sv-orange to-sv-orange-deep px-4 py-2 text-[11px] font-black text-white ${className}`}>
        <Crown className="mr-1 inline h-3.5 w-3.5" />
        მაქსიმალური
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-control bg-gradient-to-r from-sv-blue to-sv-violet px-4 py-2 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition-all hover:shadow-glow-blue active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        გააძლიერე
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-panel-dark"
        >
          <h3 className="text-[14px] font-black text-sv-ink">აირჩიეთ პაკეტი</h3>
          <p className="mt-1 text-[12px] font-medium text-sv-ink/50">
            30 დღიანი გაძლიერება
          </p>

          {error && (
            <p className="mt-2 rounded-control bg-sv-orange/10 px-3 py-2 text-[12px] font-bold text-sv-orange">
              {error}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {available.map((tier) => (
              <button
                key={tier.key}
                onClick={() => purchase(tier.key)}
                disabled={loading !== null}
                className={`flex w-full items-center gap-3 rounded-module border p-3 text-left transition-all ${
                  loading === tier.key
                    ? "border-sv-blue/30 bg-sv-blue/[0.06]"
                    : "border-sv-ink/[0.06] hover:border-sv-blue/20 hover:bg-sv-blue/[0.04]"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-control bg-gradient-to-br ${tier.gradient} text-white`}
                >
                  <tier.icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold text-sv-ink">
                    {tier.label}
                  </div>
                  <div className="text-[11px] font-medium text-sv-ink/45 truncate">
                    {tier.description}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[15px] font-black text-sv-ink">
                    {((prices?.[tier.key] ?? tier.priceTetri) / 100).toFixed(0)} ₾
                  </div>
                  {loading === tier.key ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sv-blue" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-sv-ink/30" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-control py-2 text-[12px] font-bold text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.04]"
          >
            დახურვა
          </button>
        </motion.div>
      )}
    </div>
  )
}
