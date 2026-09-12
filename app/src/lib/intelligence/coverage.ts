import { db } from "@/lib/db";

export async function calculateCoverage(country: string) {
  const totalDevelopers = await db.developerProfile.count({
    where: { deletedAt: null },
  });
  const totalProjects = await db.projectDirectory.count({
    where: { deletedAt: null },
  });
  const activeSources = await db.dataSource.count({
    where: { isActive: true, country },
  });
  const totalSources = await db.dataSource.count({
    where: { country },
  });

  const provenanceCount = await db.dataProvenance.count({
    where: { isCurrent: true },
  });
  const verifiedCount = await db.dataProvenance.count({
    where: { isCurrent: true, confidence: "verified" },
  });

  const avgQuality = await db.dataQualityScore.aggregate({
    _avg: { overall: true },
  });

  const developerCoverage = totalDevelopers > 0 ? Math.min(100, (totalDevelopers / Math.max(totalDevelopers, 50)) * 100) : 0;
  const projectCoverage = totalProjects > 0 ? Math.min(100, (totalProjects / Math.max(totalProjects, 200)) * 100) : 0;
  const sourceCoverage = totalSources > 0 ? (activeSources / totalSources) * 100 : 0;
  const verifiedRatio = provenanceCount > 0 ? (verifiedCount / provenanceCount) * 100 : 0;
  const freshnessScore = avgQuality._avg.overall ?? 0;

  const overallScore = (
    developerCoverage * 0.15 +
    projectCoverage * 0.25 +
    sourceCoverage * 0.2 +
    verifiedRatio * 0.2 +
    freshnessScore * 0.2
  );

  const metric = await db.dataCoverageMetric.create({
    data: {
      country,
      developerCoverage,
      projectCoverage,
      activeProjectCoverage: projectCoverage,
      geographicCoverage: 0,
      sourceCoverage,
      freshnessScore,
      verifiedRatio,
      overallScore,
    },
  });

  return metric;
}

export async function getLatestCoverage(country: string) {
  return db.dataCoverageMetric.findFirst({
    where: { country },
    orderBy: { calculatedAt: "desc" },
  });
}
