const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f3f3; margin: 0; padding: 40px 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
  .header { background: #222121; color: #f4f3f3; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 2px; }
  .content { padding: 32px 24px; }
  .content h2 { margin: 0 0 16px; font-size: 18px; color: #222121; }
  .content p { margin: 0 0 16px; color: #4c4b4b; line-height: 1.6; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .button { display: inline-block; background: #222121; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin-top: 8px; }
  .meta { background: #f4f3f3; padding: 16px 24px; border-top: 1px solid #e5e5e5; }
  .meta p { margin: 0; font-size: 13px; color: #6b6b6b; }
  .footer { padding: 24px; text-align: center; }
  .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HORDE</h1>
    </div>
    ${content}
    <div class="footer">
      <p>Horde Agence Web &bull; Bruxelles</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface DeliverableEmailParams {
  clientName: string;
  projectName: string;
  deliverableTitle: string;
  phaseName: string;
  portalUrl: string;
  deliverableUrl: string;
}

// Email sent to CLIENT when deliverable is ready to review
export function deliverablePendingReviewEmail(params: DeliverableEmailParams): string {
  const { clientName, projectName, deliverableTitle, phaseName, portalUrl, deliverableUrl } = params;

  return wrapTemplate(`
    <div class="content">
      <h2>Nouveau livrable a valider</h2>
      <p>Bonjour ${clientName || ""},</p>
      <p>Un nouveau livrable est pret pour votre validation sur le projet <strong>${projectName}</strong>.</p>
    </div>
    <div class="meta">
      <p><strong>Etape:</strong> ${phaseName}</p>
      <p><strong>Livrable:</strong> ${deliverableTitle}</p>
      <p style="margin-top: 12px;"><span class="badge badge-yellow">En attente de validation</span></p>
    </div>
    <div class="content">
      <p>Consultez les fichiers et laissez vos commentaires directement sur le portail.</p>
      <a href="${deliverableUrl}" class="button">Voir le livrable</a>
    </div>
  `);
}

interface ValidationEmailParams {
  adminName: string;
  clientName: string;
  projectName: string;
  deliverableTitle: string;
  phaseName: string;
  deliverableUrl: string;
  approved: boolean;
}

// Email sent to ADMIN when client validates or requests revision
export function deliverableValidatedEmail(params: ValidationEmailParams): string {
  const { adminName, clientName, projectName, deliverableTitle, phaseName, deliverableUrl, approved } = params;

  const statusText = approved ? "a valide" : "demande une revision sur";
  const badgeClass = approved ? "badge-green" : "badge-red";
  const badgeText = approved ? "Valide" : "Revision demandee";

  return wrapTemplate(`
    <div class="content">
      <h2>${clientName} ${statusText} un livrable</h2>
      <p>Bonjour ${adminName || ""},</p>
      <p><strong>${clientName}</strong> ${statusText} le livrable <strong>${deliverableTitle}</strong> du projet <strong>${projectName}</strong>.</p>
    </div>
    <div class="meta">
      <p><strong>Projet:</strong> ${projectName}</p>
      <p><strong>Etape:</strong> ${phaseName}</p>
      <p><strong>Livrable:</strong> ${deliverableTitle}</p>
      <p style="margin-top: 12px;"><span class="badge ${badgeClass}">${badgeText}</span></p>
    </div>
    <div class="content">
      ${!approved ? '<p>Consultez les commentaires du client pour comprendre les modifications demandees.</p>' : '<p>Vous pouvez passer a la suite.</p>'}
      <a href="${deliverableUrl}" class="button">Voir le livrable</a>
    </div>
  `);
}
