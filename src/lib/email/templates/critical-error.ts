/**
 * Email template for critical error notifications.
 * Sent to admins when logger.critical() is called.
 */

const brandColors = {
  primary: "#222121",
  background: "#f8f8f8",
  white: "#ffffff",
  border: "#e5e5e5",
  muted: "#6b7280",
  red: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

interface CriticalErrorEmailParams {
  message: string;
  timestamp: string;
  requestId?: string;
  code?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

export function criticalErrorEmail(params: CriticalErrorEmailParams): string {
  const { message, timestamp, requestId, code, stack, url, userAgent } = params;

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("fr-BE", {
        dateStyle: "full",
        timeStyle: "medium",
      });
    } catch {
      return ts;
    }
  };

  const infoRow = (label: string, value: string | undefined) => {
    if (!value) return "";
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${brandColors.border};">
          <span style="font-size: 12px; color: ${brandColors.muted}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span><br>
          <span style="font-size: 14px; color: ${brandColors.primary}; word-break: break-all;">${value}</span>
        </td>
      </tr>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur Critique - Horde Portal</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${brandColors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: ${brandColors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Alert Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: ${brandColors.red.bg}; border-bottom: 3px solid ${brandColors.red.border};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 16px;">
                    <div style="width: 48px; height: 48px; background-color: ${brandColors.red.text}; border-radius: 50%; text-align: center; line-height: 48px;">
                      <span style="color: white; font-size: 24px;">⚠</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: ${brandColors.red.text};">
                      Erreur Critique
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: ${brandColors.red.text};">
                      Horde Portal - Alerte Automatique
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Error Message -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background-color: ${brandColors.background}; border-radius: 8px; padding: 16px; border-left: 4px solid ${brandColors.red.border};">
                <p style="margin: 0; font-size: 15px; color: ${brandColors.primary}; line-height: 1.5; font-weight: 500;">
                  ${escapeHtml(message)}
                </p>
              </div>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background}; border-radius: 8px; overflow: hidden;">
                ${infoRow("Date & Heure", formatTimestamp(timestamp))}
                ${infoRow("Code d'erreur", code)}
                ${infoRow("Request ID", requestId)}
                ${infoRow("URL", url)}
                ${infoRow("User Agent", userAgent)}
              </table>
            </td>
          </tr>

          ${
            stack
              ? `
          <!-- Stack Trace -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: ${brandColors.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
                Stack Trace
              </p>
              <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; overflow-x: auto;">
                <pre style="margin: 0; font-size: 11px; color: #e5e7eb; white-space: pre-wrap; word-break: break-all; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${escapeHtml(stack)}</pre>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: ${brandColors.background}; border-top: 1px solid ${brandColors.border};">
              <p style="margin: 0; font-size: 12px; color: ${brandColors.muted}; text-align: center;">
                Cette alerte a été générée automatiquement par le système de monitoring de Horde Portal.<br>
                <a href="https://portal.hordeagence.com" style="color: ${brandColors.primary};">portal.hordeagence.com</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
