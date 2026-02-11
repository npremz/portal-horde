import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/utils";
import { ValidationCard } from "../validation-card";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ValidationCard", () => {
  let mockOnValidate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnValidate = vi.fn().mockResolvedValue(undefined);
  });

  describe("Rendu", () => {
    it("affiche le message d'attente de validation", () => {
      render(<ValidationCard onValidate={mockOnValidate} />);

      expect(
        screen.getByText("Ce livrable attend votre validation")
      ).toBeInTheDocument();
    });

    it("affiche les boutons Valider et Demander révision", () => {
      render(<ValidationCard onValidate={mockOnValidate} />);

      expect(screen.getByRole("button", { name: /Valider/ })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Demander révision/ })
      ).toBeInTheDocument();
    });

    it("désactive les boutons quand disabled=true", () => {
      render(<ValidationCard onValidate={mockOnValidate} disabled={true} />);

      expect(screen.getByRole("button", { name: /Valider/ })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Demander révision/ })
      ).toBeDisabled();
    });
  });

  describe("Approuver", () => {
    it("ouvre le dialog de confirmation au clic sur Valider", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      // "Confirmer la validation" appears as both DialogTitle (h2) and button text
      expect(within(dialog).getByRole("heading")).toHaveTextContent("Confirmer la validation");
    });

    it("appelle onValidate(true) à la confirmation", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Confirmer la validation/ })
      );

      await waitFor(() => {
        expect(mockOnValidate).toHaveBeenCalledWith(true);
      });
    });

    it("ferme le dialog après validation réussie", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Confirmer la validation/ })
      );

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("peut annuler la confirmation", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: /Annuler/ }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(mockOnValidate).not.toHaveBeenCalled();
    });
  });

  describe("Demander révision", () => {
    it("ouvre le dialog de révision", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(
        screen.getByRole("button", { name: /Demander révision/ })
      );

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Demander une révision")).toBeInTheDocument();
    });

    it("affiche un textarea pour le commentaire", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(
        screen.getByRole("button", { name: /Demander révision/ })
      );

      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByPlaceholderText(
          "Décrivez les modifications souhaitées (optionnel)..."
        )
      ).toBeInTheDocument();
    });

    it("appelle onValidate(false, comment) avec le commentaire", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(
        screen.getByRole("button", { name: /Demander révision/ })
      );

      const dialog = await screen.findByRole("dialog");

      await user.type(
        within(dialog).getByPlaceholderText(
          "Décrivez les modifications souhaitées (optionnel)..."
        ),
        "Le logo doit être plus grand"
      );

      await user.click(
        within(dialog).getByRole("button", { name: /Demander révision/ })
      );

      await waitFor(() => {
        expect(mockOnValidate).toHaveBeenCalledWith(
          false,
          "Le logo doit être plus grand"
        );
      });
    });

    it("appelle onValidate(false, '') sans commentaire", async () => {
      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(
        screen.getByRole("button", { name: /Demander révision/ })
      );

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Demander révision/ })
      );

      await waitFor(() => {
        expect(mockOnValidate).toHaveBeenCalledWith(false, "");
      });
    });
  });

  describe("Erreur", () => {
    it("affiche un toast d'erreur quand onValidate rejette (approuver)", async () => {
      const { toast } = await import("sonner");
      mockOnValidate.mockRejectedValue(new Error("Erreur réseau"));

      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Confirmer la validation/ })
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Erreur lors de la validation"
        );
      });
    });

    it("affiche un toast d'erreur quand onValidate rejette (révision)", async () => {
      const { toast } = await import("sonner");
      mockOnValidate.mockRejectedValue(new Error("Erreur réseau"));

      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(
        screen.getByRole("button", { name: /Demander révision/ })
      );

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Demander révision/ })
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Erreur lors de la validation"
        );
      });
    });
  });

  describe("Loading state", () => {
    it("désactive le bouton de confirmation pendant le chargement", async () => {
      mockOnValidate.mockImplementation(() => new Promise(() => {})); // never resolves

      const { user } = render(
        <ValidationCard onValidate={mockOnValidate} />
      );

      await user.click(screen.getByRole("button", { name: /Valider/ }));

      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /Confirmer la validation/ })
      );

      await waitFor(() => {
        expect(
          within(dialog).getByRole("button", { name: /Confirmer la validation/ })
        ).toBeDisabled();
      });
    });
  });
});
