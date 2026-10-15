"use client";

/** Last-resort boundary when the root layout itself fails (no app styles). */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#fdfaf6",
          color: "#2b1d14",
        }}
      >
        <div role="alert" style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
          <p>Please reload the page.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 12,
              padding: "10px 18px",
              borderRadius: 10,
              border: 0,
              background: "#b4471a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
