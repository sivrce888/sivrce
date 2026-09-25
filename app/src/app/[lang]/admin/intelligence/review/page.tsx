import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Panel } from "@/components/admin/dashboard/Panel"
import { StatCard } from "@/components/admin/ui/StatCard"
import { requireAdmin } from "@/lib/admin/guard"
import { fmtNum } from "@/lib/admin/format"
import { getReviewQueue, getGeGaps } from "@/lib/intelligence/review"
import { getLatestCoverage } from "@/lib/intelligence/coverage"
import { AlertTriangle, ClipboardList, GitMerge, Clock, WifiOff } from "lucide-react"

export const metadata = { title: "Review Queue" }

const KIND_LABEL: Record<string, string> = {
  duplicate_candidate: "Duplicate",
  conflict: "Conflict",
  stale_data: "Stale",
  failed_source: "Source failed",
  low_confidence: "Low confidence",
  needs_review: "Needs review",
  new_entity: "New entity",
}

export default async function ReviewQueuePage() {
  await requireAdmin()
  const [{ counts, items }, gaps, coverage] = await Promise.all([
    getReviewQueue(),
    getGeGaps(),
    getLatestCoverage("GE"),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review Queue & Coverage"
        description="Duplicates, conflicts, stale records and coverage gaps found by the GE data pipeline (scripts/ge-data-hub.ts)."
      />

      <section aria-label="Queue by kind" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Duplicates" value={fmtNum(counts.duplicate_candidate ?? 0)} icon={GitMerge} tone="orange" />
        <StatCard label="Conflicts" value={fmtNum(counts.conflict ?? 0)} icon={AlertTriangle} tone="orange" />
        <StatCard label="Stale records" value={fmtNum(counts.stale_data ?? 0)} icon={Clock} />
        <StatCard label="Failed sources" value={fmtNum(counts.failed_source ?? 0)} icon={WifiOff} tone="danger" />
      </section>

      <section aria-label="Coverage" className="grid gap-4 lg:grid-cols-2">
        <Panel title="Georgia coverage" hint={coverage ? `calculated ${coverage.calculatedAt.toISOString().slice(0, 10)}` : "run ge-data-hub quality"}>
          {coverage ? (
            <table className="w-full text-[13px]">
              <caption className="sr-only">Georgia coverage metrics</caption>
              <tbody className="divide-y divide-sv-ink/5">
                {([
                  ["Projects", coverage.projectCoverage],
                  ["Geographic (has coords)", coverage.geographicCoverage],
                  ["Active projects", coverage.activeProjectCoverage],
                  ["Sources active", coverage.sourceCoverage],
                  ["Verified facts", coverage.verifiedRatio],
                  ["Freshness / overall", coverage.freshnessScore],
                ] as const).map(([label, v]) => (
                  <tr key={label}>
                    <th scope="row" className="py-2 text-left font-semibold text-sv-ink/75">{label}</th>
                    <td className="py-2 text-right font-bold tabular-nums text-sv-ink">{Math.round(v)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-[13px] text-sv-ink/60">No coverage metrics yet.</p>
          )}
        </Panel>

        <Panel title="Missing data" hint={`${fmtNum(gaps.total)} projects total`}>
          <table className="w-full text-[13px]">
            <caption className="sr-only">Projects with missing fields</caption>
            <tbody className="divide-y divide-sv-ink/5">
              {([
                ["No coordinates", gaps.noCoords],
                ["No ready-by date", gaps.noReadyBy],
                ["No image", gaps.noImage],
                ["No description", gaps.noBody],
                ["Discovered via OSM", gaps.osmRows],
              ] as const).map(([label, n]) => (
                <tr key={label}>
                  <th scope="row" className="py-2 text-left font-semibold text-sv-ink/75">{label}</th>
                  <td className="py-2 text-right font-bold tabular-nums text-sv-ink">{fmtNum(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <Panel title="Open items" hint={`${fmtNum(items.length)} shown (latest)`}>
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-sv-ink/20" />
            <p className="mt-2 text-[15px] font-bold text-sv-ink/60">Queue is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Open review queue items</caption>
              <thead>
                <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                  <th scope="col" className="py-2 font-bold">Kind</th>
                  <th scope="col" className="py-2 font-bold">Entity</th>
                  <th scope="col" className="py-2 font-bold">Reason</th>
                  <th scope="col" className="py-2 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/5">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5">
                      <span className="rounded-full bg-sv-ink/5 px-2 py-0.5 text-[11px] font-bold text-sv-ink/70">
                        {KIND_LABEL[i.kind] ?? i.kind}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-sv-ink/60">{i.entityId}</td>
                    <td className="py-2.5 text-sv-ink/80">{i.reason}</td>
                    <td className="py-2.5 max-w-[420px] truncate font-mono text-[11px] text-sv-ink/50">
                      {i.details ? JSON.stringify(i.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
