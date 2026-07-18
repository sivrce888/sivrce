import Link from "next/link";

/**
 * Root 404 — fires when the [lang] layout rejects an invalid locale
 * ("/xx/search") or a URL matches no route tree. There is no root layout
 * above it, so this page renders its own <html>/<body> with inline brand
 * tokens (no CSS/providers guaranteed here — same pattern as global-error).
 */
export default function RootNotFound() {
  return (
    <html lang="ka">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F6F7FB",
          color: "#0A1030",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>
            გვერდი ვერ მოიძებნა
          </h1>
          <p style={{ marginTop: 12, color: "rgba(10,16,48,0.5)", fontWeight: 600 }}>
            Page not found — ბმული არასწორია ან გვერდი წაშლილია.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 24,
              height: 48,
              lineHeight: "48px",
              padding: "0 28px",
              borderRadius: 999,
              background: "#FF6A2D",
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            მთავარზე დაბრუნება
          </Link>
        </div>
      </body>
    </html>
  );
}
