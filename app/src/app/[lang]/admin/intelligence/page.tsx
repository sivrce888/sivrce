import { Database, AlertTriangle, CheckCircle2, Clock, GitBranch, Layers, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatCard } from "@/components/admin/ui/StatCard"
import { Panel } from "@/components/admin/dashboard/Panel"
import { DistributionBars } from "@/components/admin/dashboard/DistributionBars"
import { fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { getDashboardStats } from "@/lib/intelligence/admin-stats"

export const metadata = { title: "Data Intelligence" }

export default async function IntelligenceDashboardPage() {
  await requireAdmin()
  const stats = await getDashboardStats()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Intelligence Platform"
        description="Source registry, entity resolution, provenance tracking, quality scoring, and coverage metrics."
      />

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Data Sources" value={fmtNum(stats.totals.sources)} hint={`${fmtNum(stats.totals.activeSources)} active`} icon={Layers} tone="blue" href="/admin/intelligence/sources" />
        <StatCard label="Provenance Facts" value={fmtNum(stats.totals.provenances)} hint="Source-traced facts" icon={Database} tone="blue" />
        <StatCard label="Changes Tracked" value={fmtNum(stats.totals.changes)} hint="Historical changes" icon={GitBranch} />
        <StatCard label="Snapshots" value={fmtNum(stats.totals.snapshots)} hint="Immutable state captures" icon={Clock} />
      </section>

      <section aria-label="Health" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Changes Today" value={fmtNum(stats.health.changesToday)} icon={TrendingUp} tone="success" />
        <StatCard label="Changes This Week" value={fmtNum(stats.health.changesThisWeek)} icon={TrendingUp} />
        <StatCard label="Low Quality Entities" value={fmtNum(stats.health.lowQualityEntities)} hint="Score < 40" icon={AlertTriangle} tone="orange" href="/admin/intelligence/quality" />
        <StatCard label="Pending Review" value={fmtNum(stats.health.pendingReviewItems)} icon={AlertTriangle} tone="orange" />
      </section>

      <section aria-label="Entity Totals" className="grid grid-cols-3 gap-3">
        <StatCard label="Developers" value={fmtNum(stats.totals.developers)} icon={Database} />
        <StatCard label="Projects" value={fmtNum(stats.totals.projects)} icon={Database} />
        <StatCard label="Active Listings" value={fmtNum(stats.totals.listings)} icon={Database} />
      </section>

      <section aria-label="Quality Distribution" className="grid gap-4 lg:grid-cols-2">
        <Panel title="Quality by Entity Type" hint="Average overall quality score">
          {stats.qualityDistribution.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-sv-ink/60">No quality scores calculated yet.</p>
          ) : (
            <table className="w-full text-[13px]">
              <caption className="sr-only">Quality scores by entity type</caption>
              <thead>
                <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                  <th scope="col" className="py-2 font-bold">Entity Type</th>
                  <th scope="col" className="py-2 text-right font-bold">Avg Score</th>
                  <th scope="col" className="py-2 text-right font-bold">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/5">
                {stats.qualityDistribution.map((q) => (
                  <tr key={q.entityType}>
                    <th scope="row" className="py-2 text-left font-semibold text-sv-ink/75 capitalize">{q.entityType}</th>
                    <td className="py-2 text-right font-bold tabular-nums text-sv-ink">{Math.round(q.avgOverall)}</td>
                    <td className="py-2 text-right tabular-nums text-sv-ink/65">{fmtNum(q.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Top Sources" hint="By record count">
          {stats.topSources.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-sv-ink/60">No sources registered yet.</p>
          ) : (
            <DistributionBars
              items={stats.topSources.map((s) => ({
                label: s.name,
                count: s.recordCount,
              }))}
              emptyHint="No records yet."
            />
          )}
        </Panel>
      </section>

      <section aria-label="Recent Changes">
        <Panel title="Recent Changes" hint="Last 20 changes across all entities">
          {stats.recentChanges.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-sv-ink/60">No changes tracked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <caption className="sr-only">Recent data changes</caption>
                <thead>
                  <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                    <th scope="col" className="py-2 font-bold">Entity</th>
                    <th scope="col" className="py-2 font-bold">Change</th>
                    <th scope="col" className="py-2 font-bold">Field</th>
                    <th scope="col" className="py-2 font-bold">Old</th>
                    <th scope="col" className="py-2 font-bold">New</th>
                    <th scope="col" className="py-2 font-bold">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sv-ink/5">
                  {stats.recentChanges.map((c) => (
                    <tr key={c.entityType + c.entityId + c.createdAt.toISOString()}>
                      <td className="py-2 font-semibold text-sv-ink/75 capitalize">{c.entityType}</td>
                      <td className="py-2 text-sv-ink/65 capitalize">{c.changeKind.replace(/_/g, " ")}</td>
                      <td className="py-2 text-sv-ink/65">{c.field ?? "—"}</td>
                      <td className="py-2 max-w-[120px] truncate text-sv-ink/50">{c.oldValue ?? "—"}</td>
                      <td className="py-2 max-w-[120px] truncate text-sv-ink/70">{c.newValue ?? "—"}</td>
                      <td className="py-2 text-sv-ink/50 tabular-nums">{c.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </div>
  )
}
