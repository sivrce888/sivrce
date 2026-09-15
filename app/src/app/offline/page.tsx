/**
 * Offline fallback served by the service worker (public/sw.js caches it at
 * install). Self-contained like not-found.tsx: no layout, no CSS, no JS —
 * it must render even when nothing else loads. Copy ships bilingual (ka + en).
 */
/* eslint-disable @next/next/no-html-link-for-pages --
   A plain <a> is the point: this page is shown when the network is gone, so
   next/link's client router is exactly the thing that cannot be relied on.
   The retry link must be a full document request. */
export default function OfflinePage() {
  return (
    <html lang="ka">
      <head>
        <title>ინტერნეტი არ არის · You&rsquo;re offline — sivrce</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#050B26" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#050B26",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <svg
            viewBox="0 0 48 48"
            fill="none"
            width="64"
            height="64"
            style={{ margin: "0 auto 20px", display: "block" }}
            aria-hidden
          >
            <circle cx="24" cy="24" r="22" stroke="#2A5FEF" strokeWidth="2" />
            <path
              d="M16 28l8-16 8 16"
              stroke="#FF6A2D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>
            ინტერნეტ კავშირი გაწყვეტილია
          </h1>
          <h2
            style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginTop: 6 }}
            lang="en"
          >
            You&rsquo;re offline
          </h2>
          <p style={{ marginTop: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            შეამოწმე კავშირი და სცადე ხელახლა.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: 22,
              padding: "12px 28px",
              borderRadius: 999,
              background: "#FF6A2D",
              color: "#0A1030",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            ხელახლა ცდა · Retry
          </a>
        </div>
      </body>
    </html>
  );
}
