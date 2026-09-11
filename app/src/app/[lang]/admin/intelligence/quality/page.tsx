import { AlertTriangle, TrendingDown } from "lucide-react"

import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Panel } from "@/components/admin/dashboard/Panel"
import { requireAdmin } from "@/lib/admin/guard"
import { getLowQualityEntities } from "@/lib/intelligence/quality-score"
import { fmtNum } from "@/lib/admin/format"

export const metadata = { title: "Data Quality" }

export default async function IntelligenceQualityPage() {
  await requireAdmin()
  const lowQuality = await getLowQualityEntities(100)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Quality"
        description="Entities with quality scores below 40. Improving these improves overall platform confidence."
      />

      <Panel title="Low Quality Entities" hint={`${lowQuality.length} entities below threshold`}>
        {lowQuality.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[15px] font-bold text-sv-ink/60">All entities above threshold</p>
            <p className="mt-1 text-[13px] text-sv-ink/40">No entities with quality score below 40.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Low quality entities</caption>
              <thead>
                <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                  <th scope="col" className="py-2 font-bold">Entity</th>
                  <th scope="col" className="py-2 text-right font-bold">Overall</th>
                  <th scope="col" className="py-2 text-right font-bold">Completeness</th>
                  <th scope="col" className="py-2 text-right font-bold">Accuracy</th>
                  <th scope="col" className="py-2 text-right font-bold">Freshness</th>
                  <th scope="col" className="py-2 text-right font-bold">Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/5">
                {lowQuality.map((q) => (
                  <tr key={q.entityType + q.entityId}>
                    <td className="py-2.5">
                      <p className="font-semibold text-sv-ink capitalize">{q.entityType}</p>
                      <p className="text-[11px] text-sv-ink/50 font-mono">{q.entityId.slice(0, 12)}…</p>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        {q.overall}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-sv-ink/65">{q.completeness}</td>
                    <td className="py-2.5 text-right tabular-nums text-sv-ink/65">{q.accuracy}</td>
                    <td className="py-2.5 text-right tabular-nums text-sv-ink/65">{q.freshness}</td>
                    <td className="py-2.5 text-right tabular-nums text-sv-ink/65">{q.crossSource}</td>
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
