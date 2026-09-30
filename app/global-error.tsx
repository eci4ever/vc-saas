"use client";

/**
 * Catches errors thrown by the root layout itself. It renders outside the
 * normal layout, so it carries its own <html>/<body> and inline styles
 * (global stylesheets are not applied here).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          margin: 0,
          padding: 24,
          background: "#fafafa",
          color: "#18181b",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#71717a", margin: 0 }}>
          The application failed to start rendering.{" "}
          {error.digest ? `Reference: ${error.digest}` : null}
        </p>
        <button
          onClick={() => retry()}
          style={{
            marginTop: 8,
            height: 40,
            padding: "0 24px",
            borderRadius: 9999,
            border: "none",
            background: "#09090b",
            color: "#ffffff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
