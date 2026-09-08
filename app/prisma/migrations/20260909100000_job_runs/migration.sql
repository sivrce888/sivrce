-- CreateTable
CREATE TABLE "job_runs" (
    "id" VARCHAR(120) NOT NULL,
    "job" VARCHAR(60) NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "ms" INTEGER,
    "error" VARCHAR(500),
    "ran_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_runs_job_ran_idx" ON "job_runs"("job" ASC, "ran_at" ASC);

-- CreateIndex
CREATE INDEX "job_runs_ok_ran_idx" ON "job_runs"("ok" ASC, "ran_at" ASC);
