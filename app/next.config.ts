import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* ponytail: Capacitor origins — capacitor:// for iOS, http://localhost for Android WebView */
const capacitorOrigins = isDev
  ? " capacitor://localhost http://localhost:* http://192.168.*.*:* ws://localhost:*"
  : " capacitor://localhost"

// MapLibre workers + OpenFreeMap (or custom NEXT_PUBLIC_MAP_STYLE_URL) tiles
const mapOrigins =
  " https://*.openfreemap.org https://tiles.openfreemap.org https://*.maptiler.com https://api.maptiler.com https://*.googleapis.com https://*.gstatic.com"

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
  `img-src 'self' data: blob:${capacitorOrigins}${mapOrigins}${analyticsOrigins}`,
  "font-src 'self' data:",
  `connect-src 'self'${capacitorOrigins} https://*.sivrce.ge${mapOrigins}${analyticsOrigins}${featureApiOrigins}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.googletagmanager.com",
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
  poweredByHeader: false,
  compress: true,
  // ponytail: Neon cold-starts + per-worker Prisma connects can exceed the 60s
  // default on DB-backed SSG pages. Bump timeout; make builds warm the DB instead.
  staticPageGenerationTimeout: 180,
  experimental: {
    // 9 workers × Prisma pools socket-timeout Neon's free tier mid-build;
    // cap concurrency so SSG DB traffic stays under the connection ceiling.
    staticGenerationMaxConcurrency: 3,
    cpus: 2,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...["/images/:path*", "/icons/:path*", "/logo/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      })),
    ];
  },
};

// ponytail: withSentryConfig when @sentry/nextjs is installed
export default nextConfig;
