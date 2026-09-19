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
        <style>{`a:focus-visible{outline:2px solid #8FB4FF;outline-offset:3px;border-radius:999px}`}</style>
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
          padding:
            "max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
        }}
      >
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- self-contained offline page: the optimizer is unreachable exactly when this shows */}
          <img
            src="/logo/mark-144.png"
            alt="სივრცე · Sivrce"
            width={83}
            height={88}
            style={{
              margin: "0 auto 28px",
              display: "block",
              filter: "drop-shadow(0 16px 32px rgba(46,107,255,.35))",
            }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
            ინტერნეტ კავშირი გაწყვეტილია
          </h1>
          <h2
            style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 8, letterSpacing: "0.01em" }}
            lang="en"
          >
            You&rsquo;re offline
          </h2>
          <p style={{ marginTop: 16, marginBottom: 0, color: "rgba(255,255,255,0.5)", fontWeight: 500, fontSize: 15 }}>
            შეამოწმე კავშირი და სცადე ხელახლა.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: 26,
              padding: "13px 30px",
              borderRadius: 999,
              background: "#FF6A2D",
              color: "#0A1030",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "0.01em",
              textDecoration: "none",
              boxShadow: "0 12px 32px -8px rgba(255,106,45,.8)",
            }}
          >
            ხელახლა ცდა · Retry
          </a>
        </div>
      </body>
    </html>
  );
}
