import { describe, it, expect } from "vitest";
import {
  welcomeEmail,
  deliverablePendingReviewEmail,
  deliverableValidatedEmail,
  contactFormEmail,
  newCommentEmail,
  prospectingEmail,
  replaceTemplateVariables,
} from "../templates";

describe("welcomeEmail", () => {
  const params = {
    clientName: "Jean Dupont",
    projectName: "Site Vitrine",
    portalUrl: "https://portal.hordeagence.com",
    loginUrl: "https://portal.hordeagence.com/login",
  };

  it("returns valid HTML", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("contains client name", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("Jean Dupont");
  });

  it("contains project name", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("Site Vitrine");
  });

  it("contains login URL", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("https://portal.hordeagence.com/login");
  });

  it("contains portal URL in footer", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("https://portal.hordeagence.com");
  });

  it("contains welcome heading", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("Bienvenue sur votre espace projet");
  });

  it("contains feature list", () => {
    const html = welcomeEmail(params);
    expect(html).toContain("Suivre l'avancement");
    expect(html).toContain("livrables");
    expect(html).toContain("commentaires");
  });

  it("handles empty client name gracefully", () => {
    const html = welcomeEmail({ ...params, clientName: "" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Bonjour");
  });
});

describe("deliverablePendingReviewEmail", () => {
  const params = {
    clientName: "Marie Martin",
    projectName: "E-commerce",
    deliverableTitle: "Maquette page d'accueil",
    phaseName: "Design",
    portalUrl: "https://portal.hordeagence.com",
    deliverableUrl: "https://portal.hordeagence.com/deliverables/123",
  };

  it("returns valid HTML", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("contains client name", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("Marie Martin");
  });

  it("contains project name", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("E-commerce");
  });

  it("contains deliverable title", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("Maquette page d'accueil");
  });

  it("contains phase name", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("Design");
  });

  it("contains deliverable URL", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("https://portal.hordeagence.com/deliverables/123");
  });

  it("contains badge 'Nouveau livrable'", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("Nouveau livrable");
  });

  it("contains validation call-to-action", () => {
    const html = deliverablePendingReviewEmail(params);
    expect(html).toContain("attend votre validation");
  });
});

describe("deliverableValidatedEmail", () => {
  const baseParams = {
    adminName: "Nicolas",
    clientName: "Jean Dupont",
    projectName: "Site Vitrine",
    deliverableTitle: "Logo final",
    phaseName: "Design",
    deliverableUrl: "https://portal.hordeagence.com/deliverables/456",
    portalUrl: "https://portal.hordeagence.com",
  };

  it("returns valid HTML for approved deliverable", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: true });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("shows 'Valide' badge when approved", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: true });
    expect(html).toContain("Validé");
  });

  it("shows 'Revision demandee' badge when not approved", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: false });
    expect(html).toContain("Révision demandée");
  });

  it("contains admin name", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: true });
    expect(html).toContain("Nicolas");
  });

  it("contains client name", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: true });
    expect(html).toContain("Jean Dupont");
  });

  it("mentions approval in text when approved", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: true });
    expect(html).toContain("a validé le livrable");
  });

  it("mentions revision in text when not approved", () => {
    const html = deliverableValidatedEmail({ ...baseParams, approved: false });
    expect(html).toContain("demande une révision");
  });

  it("uses default portalUrl when not provided", () => {
    const { portalUrl: _, ...paramsWithoutPortal } = baseParams;
    const html = deliverableValidatedEmail({ ...paramsWithoutPortal, approved: true });
    expect(html).toContain("https://portal.hordeagence.com");
  });
});

describe("contactFormEmail", () => {
  const params = {
    name: "Pierre Leblanc",
    email: "pierre@example.com",
    company: "Acme Corp",
    category: "project",
    subject: "Nouveau projet web",
    message: "Bonjour, je souhaite discuter d'un nouveau projet.",
  };

  it("returns valid HTML", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("contains sender name", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("Pierre Leblanc");
  });

  it("contains sender email", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("pierre@example.com");
  });

  it("contains company name", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("Acme Corp");
  });

  it("contains category label", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("Question sur un projet");
  });

  it("contains subject", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("Nouveau projet web");
  });

  it("contains message body", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("je souhaite discuter");
  });

  it("contains mailto reply link", () => {
    const html = contactFormEmail(params);
    expect(html).toContain("mailto:pierre@example.com");
  });

  it("handles null company", () => {
    const html = contactFormEmail({ ...params, company: null });
    expect(html).toContain("<!DOCTYPE html>");
    // Should not contain the company info row
    expect(html).not.toContain("Entreprise");
  });

  it("handles unknown category gracefully", () => {
    const html = contactFormEmail({ ...params, category: "unknown" });
    expect(html).toContain("unknown");
  });
});

describe("newCommentEmail", () => {
  const params = {
    recipientName: "Nicolas",
    authorName: "Jean Dupont",
    projectName: "Site Vitrine",
    deliverableTitle: "Logo final",
    commentPreview: "Ca me semble bien, on peut valider.",
    deliverableUrl: "https://portal.hordeagence.com/deliverables/789",
  };

  it("returns valid HTML", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("contains recipient name", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("Nicolas");
  });

  it("contains author name", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("Jean Dupont");
  });

  it("contains comment preview", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("Ca me semble bien");
  });

  it("contains deliverable URL", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("https://portal.hordeagence.com/deliverables/789");
  });

  it("contains badge 'Nouveau commentaire'", () => {
    const html = newCommentEmail(params);
    expect(html).toContain("Nouveau commentaire");
  });

  it("truncates long comment previews to 200 characters", () => {
    const longComment = "A".repeat(250);
    const html = newCommentEmail({ ...params, commentPreview: longComment });
    expect(html).toContain("A".repeat(200) + "...");
    expect(html).not.toContain("A".repeat(250));
  });

  it("does not truncate short comment previews", () => {
    const shortComment = "Court commentaire";
    const html = newCommentEmail({ ...params, commentPreview: shortComment });
    expect(html).toContain("Court commentaire");
    expect(html).not.toContain("...");
  });
});

describe("prospectingEmail", () => {
  it("returns simple HTML without HORDE branding", () => {
    const html = prospectingEmail({
      subject: "Collaboration",
      content: "Bonjour, je vous contacte pour une collaboration.",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).not.toContain("PORTAIL CLIENT");
  });

  it("contains message content", () => {
    const html = prospectingEmail({
      subject: "Test",
      content: "Ceci est un message de prospection.",
    });
    expect(html).toContain("Ceci est un message de prospection.");
  });

  it("converts URLs to anchor tags", () => {
    const html = prospectingEmail({
      subject: "Test",
      content: "Visitez https://example.com pour plus d'infos.",
    });
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("https://example.com</a>");
  });

  it("converts newlines to <br>", () => {
    const html = prospectingEmail({
      subject: "Test",
      content: "Ligne 1\nLigne 2",
    });
    expect(html).toContain("Ligne 1<br>Ligne 2");
  });

  it("converts bullet lists to HTML lists", () => {
    const html = prospectingEmail({
      subject: "Test",
      content: "Nos services :\n- Design\n- Développement\n- SEO",
    });
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("Design");
    expect(html).toContain("Développement");
    expect(html).toContain("SEO");
  });
});

describe("replaceTemplateVariables", () => {
  it("replaces all known variables", () => {
    const template = "Bonjour {{prenom}} {{nom}} de {{entreprise}} ({{email}}, {{website}})";
    const result = replaceTemplateVariables(template, {
      nom: "Dupont",
      prenom: "Jean",
      entreprise: "Acme",
      email: "jean@acme.com",
      website: "acme.com",
    });
    expect(result).toBe("Bonjour Jean Dupont de Acme (jean@acme.com, acme.com)");
  });

  it("replaces multiple occurrences of the same variable", () => {
    const template = "{{prenom}} est {{prenom}}";
    const result = replaceTemplateVariables(template, { prenom: "Jean" });
    expect(result).toBe("Jean est Jean");
  });

  it("leaves unmatched placeholders when variable is not provided", () => {
    const template = "Bonjour {{prenom}} de {{entreprise}}";
    const result = replaceTemplateVariables(template, { prenom: "Jean" });
    expect(result).toBe("Bonjour Jean de {{entreprise}}");
  });

  it("returns template unchanged when no variables provided", () => {
    const template = "Bonjour {{prenom}}";
    const result = replaceTemplateVariables(template, {});
    expect(result).toBe("Bonjour {{prenom}}");
  });
});
