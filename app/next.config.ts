import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const isDev = process.env.NODE_ENV === "development";

/* ponytail: Capacitor origins — capacitor:// for iOS, http://localhost for Android WebView */
const capacitorOrigins = isDev
  ? " capacitor://localhost http://localhost:* http://192.168.*.*:* ws://localhost:*"
  : " capacitor://localhost"

// Map: basemap is same-origin /api/map (OFM proxied). Optional MapTiler override.
const mapOrigins = " https://*.maptiler.com https://api.maptiler.com"

// First-party media CDN only (R2). No third-party aggregator hosts.
const mediaOrigins = ""


// ponytail: analytics — GTM + top.ge + reserved Sentry/PostHog
const analyticsOrigins =
  " https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://counter.top.ge https://*.sentry.io https://*.posthog.com https://*.i.posthog.com"

// First-party feature APIs: Open-Meteo (weather badges) + open.er-api (FX rates)
const featureApiOrigins = " https://api.open-meteo.com https://open.er-api.com"

const csp = [
  "default-src 'self'",
  // Next inline bootstrap + JSON-LD require 'unsafe-inline' for scripts
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}${capacitorOrigins}${mapOrigins}${analyticsOrigins}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://cdn.sivrce.ge https://images.sivrce.ge${capacitorOrigins}${mapOrigins}${mediaOrigins}${analyticsOrigins}`,
  "font-src 'self' data:",
  `connect-src 'self'${capacitorOrigins} https://sivrce.ge https://*.sivrce.ge${mapOrigins}${analyticsOrigins}${featureApiOrigins}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://www.googletagmanager.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Locked: never ship browser source maps (bloat + source leak).
  productionBrowserSourceMaps: false,
  // Strip console.* from prod client/server bundles; keep warn/error for ops.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  // ponytail: cold Prisma connects can exceed the 60s default on DB-backed
  // SSG pages. Bump timeout; make builds warm the DB instead.
  staticPageGenerationTimeout: 180,
  // Keep native/heavy pkgs out of the serverless trace — smaller Vercel functions.
  outputFileTracingExcludes: {
    "*": [
      "./ios/**/*",
      "./android/**/*",
      "./e2e/**/*",
      "./resources/**/*",
      "./icons/**/*",
      "./mobile/**/*",
      "./scripts/**/*",
      "node_modules/@capacitor/**/*",
      "node_modules/@capacitor/assets/**/*",
      "node_modules/playwright/**/*",
      "node_modules/@playwright/**/*",
    ],
  },
  experimental: {
    // 9 workers × Prisma pools can exhaust pooler slots mid-build;
    // cap concurrency so SSG DB traffic stays under the connection ceiling.
    staticGenerationMaxConcurrency: 3,
    cpus: 2,
    // Tree-shake barrel imports (lucide already defaulted by Next).
    optimizePackageImports: ["framer-motion", "@base-ui/react"],
    // ponytail: inline critical CSS → drop render-blocking <link>s (~600ms LCP).
    // Ceiling: large CSS grows HTML; revisit if homepage HTML > ~50KB gzip.
    inlineCss: true,
  },
  images: {
    // AVIF first → WebP fallback. Fewer sizes/qualities = fewer Image Opt variants.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Mobile-first breakpoints only — matches our card/hero sizes attrs.
    deviceSizes: [640, 750, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    // Long CDN TTL for optimized images (immutable URLs via Next Image).
    minimumCacheTTL: 31_536_000,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sivrce.ge" },
      { protocol: "https", hostname: "images.sivrce.ge" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Hashed Next assets — immutable in prod. Dev must not cache or HMR CSS goes stale
      // (turbopack keeps a stable globals hash → browser never refetches xl:* utilities).
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "development"
                ? "no-store"
                : "public, max-age=31536000, immutable",
          },
        ],
      },
      ...["/images/:path*", "/icons/:path*", "/logo/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      })),
    ];
  },
};

// BotID proxy rewrites + optional Sentry wrapper later.
export default withBotId(nextConfig);
