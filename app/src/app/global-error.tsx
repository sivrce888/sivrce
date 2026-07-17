'use client'

/* ponytail: root-layout failure path — no CSS/fonts/i18n available here,
   so inline brand tokens and hardcoded Georgian. Ceiling: full brand shell. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ka">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F6F7FB',
          color: '#0A1030',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>
            რაღაც შეცდომა მოხდა
          </h1>
          <p style={{ marginTop: 12, color: 'rgba(10,16,48,0.5)', fontWeight: 600 }}>
            გვერდის ჩატვირთვა ვერ მოხერხდა. სცადე თავიდან.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 48,
              padding: '0 28px',
              borderRadius: 999,
              border: 0,
              background: '#FF6A2D',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            თავიდან ცდა
          </button>
        </div>
      </body>
    </html>
  )
}
