"use client";

import { useEffect } from "react";

/**
 * Global error boundary for critical errors that break the root layout.
 * This component renders independently without any dependencies on the app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error to console
    // Note: In production, this should also send to error monitoring
    console.error("[Horde] [CRITICAL] Global error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          backgroundColor: "#f8f8f8",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 24px",
            maxWidth: "480px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 24px",
              backgroundColor: "#fee2e2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#991b1b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "24px",
              fontWeight: 600,
              color: "#222121",
            }}
          >
            Une erreur critique s'est produite
          </h1>

          {/* Description */}
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "15px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            L'application a rencontré un problème inattendu. Notre équipe a été notifiée.
          </p>

          {/* Error reference */}
          {error.digest && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "12px",
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              Référence: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#ffffff",
                backgroundColor: "#222121",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#222121",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
