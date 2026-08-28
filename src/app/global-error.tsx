"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches a crash in the root layout itself (AuthProvider,
 * NativeBootstrap, a server call during an outage), which `error.tsx` cannot.
 * Must render its OWN <html>/<body> and stay dependency-free (the tree is broken),
 * so it uses inline styles instead of the design system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#10141b",
          color: "#ECEAE3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 24,
          fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 22px" }}>
            Something broke at the app level. Reload to recover.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#b8860b",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "13px 22px",
              fontSize: 16,
              fontWeight: 700,
              minHeight: 48,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
