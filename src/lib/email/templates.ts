const brandColors = {
  primary: "#222121",
  primaryLight: "#4c4b4b",
  background: "#f8f8f8",
  white: "#ffffff",
  border: "#e5e5e5",
  muted: "#6b7280",
  yellow: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  green: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  red: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  blue: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
};

const baseTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{TITLE}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 24px 20px !important; }
      .button { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${brandColors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preview text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    {{PREVIEW}}
  </div>

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" class="container" style="max-width: 520px; background-color: ${brandColors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 24px; background-color: ${brandColors.primary};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 24px; font-weight: 700; letter-spacing: 4px; color: ${brandColors.white};">
                    HORDE
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.7); padding-top: 4px;">
                    PORTAIL CLIENT
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{CONTENT}}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: ${brandColors.background}; border-top: 1px solid ${brandColors.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 12px; color: ${brandColors.muted}; line-height: 1.5;">
                    <p style="margin: 0;">Horde Agence Web</p>
                    <p style="margin: 4px 0 0;">Bruxelles, Belgique</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Bottom link -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <a href="{{PORTAL_URL}}" style="font-size: 12px; color: ${brandColors.muted}; text-decoration: none;">
                portal.hordeagence.com
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

function createButton(text: string, url: string, variant: "primary" | "secondary" = "primary"): string {
  const bgColor = variant === "primary" ? brandColors.primary : brandColors.white;
  const textColor = variant === "primary" ? brandColors.white : brandColors.primary;
  const border = variant === "primary" ? "none" : `2px solid ${brandColors.border}`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: ${bgColor}; border: ${border};">
          <a href="${url}" target="_blank" class="button" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: ${textColor}; text-decoration: none;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function createBadge(text: string, color: "yellow" | "green" | "red" | "blue"): string {
  const colors = brandColors[color];
  return `
    <span style="display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; background-color: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border};">
      ${text}
    </span>
  `;
}

function createInfoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${brandColors.border};">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size: 13px; color: ${brandColors.muted}; width: 100px;">${label}</td>
            <td style="font-size: 13px; color: ${brandColors.primary}; font-weight: 500;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function wrapTemplate(content: string, title: string, preview: string, portalUrl: string): string {
  return baseTemplate
    .replace("{{TITLE}}", title)
    .replace("{{PREVIEW}}", preview)
    .replace("{{CONTENT}}", content)
    .replace("{{PORTAL_URL}}", portalUrl);
}

// ============================================
// WELCOME / ONBOARDING EMAIL
// ============================================

interface WelcomeEmailParams {
  clientName: string;
  projectName: string;
  portalUrl: string;
  loginUrl: string;
}

export function welcomeEmail(params: WelcomeEmailParams): string {
  const { clientName, projectName, portalUrl, loginUrl } = params;

  const content = `
    <!-- Hero -->
    <tr>
      <td class="content" style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${brandColors.primary}; line-height: 1.3;">
          Bienvenue sur votre espace projet
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          Bonjour ${clientName || ""},<br><br>
          Votre espace client Horde est prêt ! Vous pouvez maintenant suivre l'avancement de votre projet <strong>${projectName}</strong> en temps réel.
        </p>
      </td>
    </tr>

    <!-- Features -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background}; border-radius: 8px;">
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: ${brandColors.muted}; text-transform: uppercase; letter-spacing: 1px;">
                Ce que vous pouvez faire
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: ${brandColors.primaryLight};">
                    <span style="color: ${brandColors.green.text}; margin-right: 8px;">&#10003;</span>
                    Suivre l'avancement étape par étape
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: ${brandColors.primaryLight};">
                    <span style="color: ${brandColors.green.text}; margin-right: 8px;">&#10003;</span>
                    Télécharger et valider les livrables
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: ${brandColors.primaryLight};">
                    <span style="color: ${brandColors.green.text}; margin-right: 8px;">&#10003;</span>
                    Communiquer via les commentaires
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: ${brandColors.primaryLight};">
                    <span style="color: ${brandColors.green.text}; margin-right: 8px;">&#10003;</span>
                    Recevoir des notifications en temps réel
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="center" style="padding: 0 32px 40px;">
        ${createButton("Accéder à mon espace", loginUrl)}
        <p style="margin: 16px 0 0; font-size: 13px; color: ${brandColors.muted};">
          Pas de mot de passe requis &mdash; un lien magique vous sera envoyé
        </p>
      </td>
    </tr>
  `;

  return wrapTemplate(
    content,
    `Bienvenue sur votre espace projet - ${projectName}`,
    `Votre espace client Horde est prêt ! Suivez l'avancement de ${projectName} en temps réel.`,
    portalUrl
  );
}

// ============================================
// DELIVERABLE PENDING REVIEW (for CLIENT)
// ============================================

interface DeliverableEmailParams {
  clientName: string;
  projectName: string;
  deliverableTitle: string;
  phaseName: string;
  portalUrl: string;
  deliverableUrl: string;
}

export function deliverablePendingReviewEmail(params: DeliverableEmailParams): string {
  const { clientName, projectName, deliverableTitle, phaseName, portalUrl, deliverableUrl } = params;

  const content = `
    <!-- Main content -->
    <tr>
      <td class="content" style="padding: 40px 32px 24px;">
        <p style="margin: 0 0 8px;">
          ${createBadge("Nouveau livrable", "yellow")}
        </p>
        <h1 style="margin: 16px 0; font-size: 22px; font-weight: 700; color: ${brandColors.primary}; line-height: 1.3;">
          Un livrable attend votre validation
        </h1>
        <p style="margin: 0; font-size: 15px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          Bonjour ${clientName || ""},<br><br>
          Un nouveau livrable est prêt pour votre validation sur le projet <strong>${projectName}</strong>.
        </p>
      </td>
    </tr>

    <!-- Info card -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background}; border-radius: 8px; border-left: 4px solid ${brandColors.yellow.border};">
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${createInfoRow("Projet", projectName)}
                ${createInfoRow("Étape", phaseName)}
                ${createInfoRow("Livrable", deliverableTitle)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td class="content" style="padding: 0 32px 40px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          Consultez les fichiers, laissez vos commentaires et validez directement depuis le portail.
        </p>
        ${createButton("Voir le livrable", deliverableUrl)}
      </td>
    </tr>
  `;

  return wrapTemplate(
    content,
    `Nouveau livrable à valider - ${projectName}`,
    `Un nouveau livrable "${deliverableTitle}" est prêt pour votre validation.`,
    portalUrl
  );
}

// ============================================
// DELIVERABLE VALIDATED / REVISION (for ADMIN)
// ============================================

interface ValidationEmailParams {
  adminName: string;
  clientName: string;
  projectName: string;
  deliverableTitle: string;
  phaseName: string;
  deliverableUrl: string;
  approved: boolean;
  portalUrl?: string;
}

export function deliverableValidatedEmail(params: ValidationEmailParams): string {
  const {
    adminName,
    clientName,
    projectName,
    deliverableTitle,
    phaseName,
    deliverableUrl,
    approved,
    portalUrl = "https://portal.hordeagence.com"
  } = params;

  const badgeColor = approved ? "green" : "red";
  const badgeText = approved ? "Validé" : "Révision demandée";
  const title = approved
    ? `${clientName} a validé le livrable`
    : `${clientName} demande une révision`;
  const message = approved
    ? `Le livrable a été validé. Vous pouvez passer à la suite !`
    : `Des modifications sont demandées. Consultez les commentaires du client pour plus de détails.`;
  const borderColor = approved ? brandColors.green.border : brandColors.red.border;

  const content = `
    <!-- Main content -->
    <tr>
      <td class="content" style="padding: 40px 32px 24px;">
        <p style="margin: 0 0 8px;">
          ${createBadge(badgeText, badgeColor)}
        </p>
        <h1 style="margin: 16px 0; font-size: 22px; font-weight: 700; color: ${brandColors.primary}; line-height: 1.3;">
          ${title}
        </h1>
        <p style="margin: 0; font-size: 15px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          Bonjour ${adminName || ""},<br><br>
          <strong>${clientName}</strong> a ${approved ? "validé" : "demandé une révision sur"} le livrable <strong>${deliverableTitle}</strong>.
        </p>
      </td>
    </tr>

    <!-- Info card -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background}; border-radius: 8px; border-left: 4px solid ${borderColor};">
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${createInfoRow("Projet", projectName)}
                ${createInfoRow("Étape", phaseName)}
                ${createInfoRow("Livrable", deliverableTitle)}
                ${createInfoRow("Client", clientName)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td class="content" style="padding: 0 32px 40px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          ${message}
        </p>
        ${createButton("Voir le livrable", deliverableUrl)}
      </td>
    </tr>
  `;

  return wrapTemplate(
    content,
    approved ? `Livrable validé - ${projectName}` : `Révision demandée - ${projectName}`,
    `${clientName} a ${approved ? "validé" : "demandé une révision sur"} "${deliverableTitle}".`,
    portalUrl
  );
}

// ============================================
// NEW COMMENT NOTIFICATION
// ============================================

interface CommentEmailParams {
  recipientName: string;
  authorName: string;
  projectName: string;
  deliverableTitle: string;
  commentPreview: string;
  deliverableUrl: string;
  portalUrl?: string;
}

export function newCommentEmail(params: CommentEmailParams): string {
  const {
    recipientName,
    authorName,
    projectName,
    deliverableTitle,
    commentPreview,
    deliverableUrl,
    portalUrl = "https://portal.hordeagence.com"
  } = params;

  const content = `
    <!-- Main content -->
    <tr>
      <td class="content" style="padding: 40px 32px 24px;">
        <p style="margin: 0 0 8px;">
          ${createBadge("Nouveau commentaire", "blue")}
        </p>
        <h1 style="margin: 16px 0; font-size: 22px; font-weight: 700; color: ${brandColors.primary}; line-height: 1.3;">
          ${authorName} a commenté
        </h1>
        <p style="margin: 0; font-size: 15px; color: ${brandColors.primaryLight}; line-height: 1.6;">
          Bonjour ${recipientName || ""},<br><br>
          Un nouveau commentaire a été ajouté sur le livrable <strong>${deliverableTitle}</strong> du projet <strong>${projectName}</strong>.
        </p>
      </td>
    </tr>

    <!-- Comment preview -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${brandColors.background}; border-radius: 8px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: ${brandColors.muted};">
                ${authorName} a écrit :
              </p>
              <p style="margin: 0; font-size: 14px; color: ${brandColors.primaryLight}; font-style: italic; line-height: 1.6;">
                "${commentPreview.length > 200 ? commentPreview.substring(0, 200) + "..." : commentPreview}"
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="center" style="padding: 0 32px 40px;">
        ${createButton("Voir la conversation", deliverableUrl)}
      </td>
    </tr>
  `;

  return wrapTemplate(
    content,
    `Nouveau commentaire - ${projectName}`,
    `${authorName} a commenté sur "${deliverableTitle}".`,
    portalUrl
  );
}
