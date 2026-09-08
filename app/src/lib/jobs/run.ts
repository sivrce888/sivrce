import { db } from "@/lib/db"

/**
 * Wraps a cron job body and persists its outcome to JobRun so the admin
 * System → Health tab sees failures and missed runs. The audit write is
 * best-effort: it never masks the job's own result or error.
 *
 * `okOf` lets jobs that report failure without throwing (e.g. search sync
 * returning ok:false) still count as failed runs.
 */
export async function withJobRun<R>(
  job: string,
  fn: () => Promise<R>,
  countOf: (r: R) => number = () => 0,
  okOf: (r: R) => boolean = () => true,
): Promise<R> {
  const t0 = Date.now()
  try {
    const result = await fn()
    const ok = okOf(result)
    await db.jobRun
      .create({
        data: { job, ok, count: countOf(result), ms: Date.now() - t0 },
      })
      .catch(() => {})
    return result
  } catch (e) {
    await db.jobRun
      .create({
        data: {
          job,
          ok: false,
          error: (e as Error).message?.slice(0, 500),
          ms: Date.now() - t0,
        },
      })
      .catch(() => {})
    throw e
  }
}
