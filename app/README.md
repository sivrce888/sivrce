# sivrce — უძრავი ქონება ერთ სივრცეში

Premium real estate platform for Georgia. Next.js 16 (App Router, Turbopack) · Tailwind CSS v4 (CSS-first `@theme`, no config file) · React 19 · shadcn/ui · next/font (Manrope + Noto Sans Georgian).

## Stack

- **Framework:** Next.js 16 · App Router · Turbopack · TypeScript strict
- **Styling:** Tailwind CSS v4 — brand tokens live in `src/app/globals.css` (`@theme`)
- **Brand lock:** `BRAND.md` is the single source of truth — colors, radius, elevation, motion. Code tokens in `src/lib/brand.ts`.
- **UI:** shadcn/ui (Tailwind v4 native) in `src/components/ui/`
- **Motion:** framer-motion · custom keyframes in `globals.css`
- **SEO:** metadata API, OG/Twitter cards, JSON-LD (`WebSite` + `RealEstateAgent`, per-listing `RealEstateListing`), `sitemap.ts`, `robots.ts`

## Develop

```bash
npm install
npm run dev          # next dev (Turbopack) — http://localhost:3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint
```

## Structure

```
src/
  app/                  # routes: / (landing), /search, /listing/[id]
    globals.css         # Tailwind v4 @theme brand tokens + brand utilities
    layout.tsx          # fonts, SEO metadata, JSON-LD, Toaster
  components/
    sections/           # landing sections (Navbar, Hero, Stats, …)
    ui/                 # shadcn/ui components
    ListingCard.tsx     # shared listing card (VIP badges, AI score)
    Reveal.tsx          # scroll-reveal + LogoMark/Logo
  data/listings.ts      # shared listings data layer (client-side for now)
  lib/
    brand.ts            # locked brand tokens (mirror of BRAND.md)
    favorites.ts        # localStorage favorites
    utils.ts            # cn()
```

Deploys on Vercel (`vercel.json` → framework `nextjs`).
