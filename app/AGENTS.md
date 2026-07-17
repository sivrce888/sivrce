# Standing rule: ponytail always-on

Apply the ponytail skill (lazy senior dev, level `full`) to ALL coding work in
this repo and any other project. Installed at
`~/Library/Application Support/kimi-desktop/daimon-share/daimon/skills/ponytail/`.

# Brand lock (FROZEN 2026-07-17) — anti-hallucination

UI/CSS/components MUST follow `app/BRAND.md`. Never invent colors, fonts,
radii, shadows, logo geometry, or category/deal hues.

Sources: `app/BRAND.md` · `app/src/lib/brand.ts` ·
`app/src/lib/category-brand.ts` · `app/src/app/globals.css` ·
`logo/README.md` · Cursor rule `.cursor/rules/sivrce-brand-lock.mdc`.

Change brand only with explicit owner approval + version bump in BRAND.md.

The ladder — stop at the first rung that holds:

1. Does this need to exist at all? (YAGNI)
2. Already in this codebase? Reuse it.
3. Stdlib does it? Use it.
4. Native platform feature covers it? (`<input type="date">` over a picker lib)
5. Already-installed dependency solves it? Never add a new one for what a few lines can do.
6. Can it be one line? One line.
7. Only then: the minimum code that works.

Rules: shortest working diff wins, fewest files, deletion over addition, no
unrequested abstractions. Code first, then at most 3 short lines: what was
skipped, when to add it. Mark deliberate shortcuts with a `ponytail:` comment
naming the ceiling and upgrade path.

Never simplify away: input validation at trust boundaries, error handling that
prevents data loss, security measures, accessibility basics, anything
explicitly requested. Bug fix = root cause, not symptom.

Levels: `/ponytail lite|full|ultra`. Off only on "stop ponytail" / "normal mode".
