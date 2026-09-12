import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Panel } from "@/components/admin/dashboard/Panel"
import { requireAdmin } from "@/lib/admin/guard"
import { getSourceHealth } from "@/lib/intelligence/source-registry"
import { fmtNum } from "@/lib/admin/format"

export const metadata = { title: "Data Sources" }

export default async function IntelligenceSourcesPage() {
  await requireAdmin()
  const sources = await getSourceHealth()

  const healthy = sources.filter((s) => s.health === "healthy").length
  const degraded = sources.filter((s) => s.health === "degraded").length
  const failed = sources.filter((s) => s.health === "failed").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Sources"
        description="Registry of all ingested data sources with health monitoring."
      />

      <section className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-[14px] border border-sv-ink/6 bg-white p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-[22px] font-extrabold tabular-nums text-sv-ink">{fmtNum(healthy)}</p>
            <p className="text-[11px] font-bold text-sv-ink/50 uppercase">Healthy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[14px] border border-sv-ink/6 bg-white p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-[22px] font-extrabold tabular-nums text-sv-ink">{fmtNum(degraded)}</p>
            <p className="text-[11px] font-bold text-sv-ink/50 uppercase">Degraded</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[14px] border border-sv-ink/6 bg-white p-4">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-[22px] font-extrabold tabular-nums text-sv-ink">{fmtNum(failed)}</p>
            <p className="text-[11px] font-bold text-sv-ink/50 uppercase">Failed</p>
          </div>
        </div>
      </section>

      <Panel title="All Sources" hint={`${sources.length} registered sources`}>
        {sources.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-sv-ink/60">No sources registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Data sources</caption>
              <thead>
                <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                  <th scope="col" className="py-2 font-bold">Source</th>
                  <th scope="col" className="py-2 font-bold">Kind</th>
                  <th scope="col" className="py-2 font-bold">Reliability</th>
                  <th scope="col" className="py-2 text-right font-bold">Records</th>
                  <th scope="col" className="py-2 text-right font-bold">Error Rate</th>
                  <th scope="col" className="py-2 font-bold">Last Success</th>
                  <th scope="col" className="py-2 font-bold">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/5">
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5">
                      <p className="font-semibold text-sv-ink">{s.name}</p>
                      <p className="text-[11px] text-sv-ink/50">{s.country}</p>
                    </td>
                    <td className="py-2.5 capitalize text-sv-ink/65">{s.kind.replace(/_/g, " ")}</td>
                    <td className="py-2.5 capitalize text-sv-ink/65">{s.reliability.replace(/_/g, " ")}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums text-sv-ink">{fmtNum(s.recordCount)}</td>
                    <td className="py-2.5 text-right tabular-nums text-sv-ink/65">{(s.errorRate * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-sv-ink/50">
                      {s.lastSuccessAt ? s.lastSuccessAt.toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                        s.health === "healthy" ? "bg-emerald-50 text-emerald-700" :
                        s.health === "degraded" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {s.health === "healthy" ? <CheckCircle2 className="h-3 w-3" /> :
                         s.health === "degraded" ? <AlertTriangle className="h-3 w-3" /> :
                         <XCircle className="h-3 w-3" />}
                        {s.health}
                      </span>
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
