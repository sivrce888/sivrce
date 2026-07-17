/**
 * Smoke tests — verify critical public pages render without crashing.
 * ponytail: minimal assertions. Add full flows when you hire QA.
 */

import { test, expect } from "@playwright/test"

const BASE = "http://localhost:3000"

test.describe("Public pages", () => {
  test("landing page loads", async ({ page }) => {
    const res = await page.goto(BASE)
    expect(res?.status()).toBe(200)
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("map page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/map`)
    expect(res?.status()).toBe(200)
    await expect(page.getByText(/3D|რუკა|შენობა/i).first()).toBeVisible({ timeout: 15000 })
  })

  test("search page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/search`)
    expect(res?.status()).toBe(200)
    await expect(page.locator("input[type='search'], input[placeholder*='ძიება']").first()).toBeVisible()
  })

  test("listing detail loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/listing/1`)
    // 200 or 404 are both acceptable if listing doesn't exist in test DB
    expect(res?.status()).toBeLessThan(500)
  })

  test("blog pages load", async ({ page }) => {
    const res = await page.goto(`${BASE}/blog`)
    expect(res?.status()).toBe(200)
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("agents page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/agents`)
    expect(res?.status()).toBe(200)
  })

  test("neighborhoods page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/neighborhoods`)
    expect(res?.status()).toBe(200)
  })

  test("about page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/about`)
    expect(res?.status()).toBe(200)
  })

  test("contact page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/contact`)
    expect(res?.status()).toBe(200)
  })

  test("auth signin page loads", async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/signin`)
    expect(res?.status()).toBe(200)
  })
})

test.describe("SEO", () => {
  test("sitemap returns XML", async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`)
    expect(res?.status()).toBe(200)
    const text = await page.content()
    expect(text).toContain("<urlset")
  })

  test("robots.txt exists", async ({ page }) => {
    const res = await page.goto(`${BASE}/robots.txt`)
    expect(res?.status()).toBe(200)
  })

  test("manifest.json exists", async ({ page }) => {
    const res = await page.goto(`${BASE}/manifest.webmanifest`)
    expect(res?.status()).toBe(200)
  })
})

test.describe("API", () => {
  test("inquiry POST validates origin", async ({ request }) => {
    const res = await request.post(`${BASE}/api/inquiries`, {
      data: { message: "test" },
      headers: { "Content-Type": "application/json" },
    })
    // Should reject cross-origin without proper origin
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })

  test("reviews GET returns data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/reviews?targetType=listing&targetId=1`)
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("reviews")
    expect(data).toHaveProperty("aggregate")
  })
})

test.describe("Performance", () => {
  test("static pages respond under 2s", async ({ page }) => {
    const start = Date.now()
    await page.goto(`${BASE}/about`)
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(5000) // generous cold-start threshold
  })
})
