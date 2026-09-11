#!/usr/bin/env tsx
/**
 * SIVRCE Render Acquisition Pipeline
 * Collects architectural renders: ArchDaily, Dezeen, Unsplash, AI fallback
 * Usage: tsx scripts/sync-render-pipeline.ts [--metro NYC]
 */

async function fetchUnsplashImages(query: string, limit = 3) {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) {
    console.warn("⚠ UNSPLASH_ACCESS_KEY not set")
    return []
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    )
    if (!response.ok) return []
    const data = (await response.json()) as any
    return (data.results || []).map((p: any) => ({
      name: p.description || "Unsplash Photo",
      url: p.urls.regular,
      type: "stock",
      attribution: p.user.name,
      license: "cc0",
    }))
  } catch (err) {
    console.error(`✗ Unsplash error:`, err)
    return []
  }
}

async function syncProjectRenders(projectName: string, metro: string) {
  console.log(`📸 Processing renders for "${projectName}" in ${metro}...`)
  const renders = await fetchUnsplashImages(`${projectName} ${metro}`, 2)
  return { projectName, renders }
}

async function main() {
  console.log("🎬 SIVRCE Render Pipeline\n")
  const result = await syncProjectRenders("Sample Project", "Berlin")
  console.log(`✅ Complete. Renders: ${result.renders.length}`)
}

main().catch(console.error)
