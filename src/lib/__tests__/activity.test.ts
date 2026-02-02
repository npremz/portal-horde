import { describe, it, expect } from "vitest";
import { actionLabels, actionColors } from "../activity";
import type { ActivityAction } from "@/types/database";

const allActions: ActivityAction[] = [
  "login",
  "view_project",
  "view_deliverable",
  "download_file",
  "add_comment",
  "validate_deliverable",
  "request_revision",
  "email_sent",
];

describe("actionLabels", () => {
  it("has a label for every action type", () => {
    allActions.forEach((action) => {
      expect(actionLabels[action]).toBeDefined();
      expect(typeof actionLabels[action]).toBe("string");
      expect(actionLabels[action].length).toBeGreaterThan(0);
    });
  });

  it("has correct French labels", () => {
    expect(actionLabels.login).toBe("Connexion");
    expect(actionLabels.view_project).toBe("Consultation projet");
    expect(actionLabels.view_deliverable).toBe("Consultation livrable");
    expect(actionLabels.download_file).toBe("Telechargement");
    expect(actionLabels.add_comment).toBe("Commentaire");
    expect(actionLabels.validate_deliverable).toBe("Validation");
    expect(actionLabels.request_revision).toBe("Demande revision");
    expect(actionLabels.email_sent).toBe("Email envoye");
  });

  it("has exactly 8 labels (one per action)", () => {
    expect(Object.keys(actionLabels).length).toBe(8);
  });
});

describe("actionColors", () => {
  it("has a color for every action type", () => {
    allActions.forEach((action) => {
      expect(actionColors[action]).toBeDefined();
      expect(typeof actionColors[action]).toBe("string");
      expect(actionColors[action].length).toBeGreaterThan(0);
    });
  });

  it("uses Tailwind CSS classes", () => {
    allActions.forEach((action) => {
      const color = actionColors[action];
      expect(color).toMatch(/^bg-\w+-\d+\s+text-\w+-\d+$/);
    });
  });

  it("has expected colors for specific actions", () => {
    expect(actionColors.login).toContain("blue");
    expect(actionColors.validate_deliverable).toContain("green");
    expect(actionColors.request_revision).toContain("red");
    expect(actionColors.add_comment).toContain("yellow");
    expect(actionColors.download_file).toContain("purple");
  });

  it("has exactly 8 colors (one per action)", () => {
    expect(Object.keys(actionColors).length).toBe(8);
  });
});
