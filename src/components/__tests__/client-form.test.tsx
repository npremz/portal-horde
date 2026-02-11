import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@/test/utils";
import { ClientForm } from "../client-form";
import type { Client } from "@/types/database";

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockClient: Client = {
  id: "client-1",
  name: "Acme Corp",
  email: "contact@acme.com",
  phone: "+33 6 12 34 56 78",
  website: "https://acme.com",
  socials: {
    linkedin: "https://linkedin.com/company/acme",
    instagram: "https://instagram.com/acme",
  },
  status: "in_project",
  project_type: "website",
  sector: "tech",
  notes: "Client important",
  profile_id: null,
  first_contact_date: null,
  next_followup_date: null,
  is_priority: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("ClientForm", () => {
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave = vi.fn().mockResolvedValue(undefined);
  });

  describe("Rendu initial - mode création", () => {
    it("affiche les champs vides sans client", () => {
      render(<ClientForm onSave={mockOnSave} />);

      expect(screen.getByLabelText(/Nom \/ Entreprise/)).toHaveValue("");
      expect(screen.getByLabelText(/Email/)).toHaveValue("");
      expect(screen.getByLabelText(/Telephone/)).toHaveValue("");
    });

    it("affiche le bouton 'Créer le client'", () => {
      render(<ClientForm onSave={mockOnSave} />);

      expect(screen.getByRole("button", { name: /Créer le client/ })).toBeInTheDocument();
    });

    it("n'affiche pas le bouton Annuler sans onCancel", () => {
      render(<ClientForm onSave={mockOnSave} />);

      expect(screen.queryByRole("button", { name: /Annuler/ })).not.toBeInTheDocument();
    });

    it("affiche le bouton Annuler avec onCancel", () => {
      const mockCancel = vi.fn();
      render(<ClientForm onSave={mockOnSave} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /Annuler/ })).toBeInTheDocument();
    });
  });

  describe("Rendu - mode édition", () => {
    it("pré-remplit les champs avec les données client", () => {
      render(<ClientForm client={mockClient} onSave={mockOnSave} />);

      expect(screen.getByLabelText(/Nom \/ Entreprise/)).toHaveValue("Acme Corp");
      expect(screen.getByLabelText(/Email/)).toHaveValue("contact@acme.com");
      expect(screen.getByLabelText(/Telephone/)).toHaveValue("+33 6 12 34 56 78");
      expect(screen.getByDisplayValue("https://acme.com")).toBeInTheDocument();
    });

    it("pré-remplit les réseaux sociaux", () => {
      render(<ClientForm client={mockClient} onSave={mockOnSave} />);

      expect(screen.getByDisplayValue("https://linkedin.com/company/acme")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://instagram.com/acme")).toBeInTheDocument();
    });

    it("affiche le bouton 'Enregistrer' en mode édition", () => {
      render(<ClientForm client={mockClient} onSave={mockOnSave} />);

      expect(screen.getByRole("button", { name: /Enregistrer/ })).toBeInTheDocument();
    });
  });

  describe("Validation inline", () => {
    it("affiche une erreur quand le nom est vide au submit", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      // Fill only email so name stays empty
      await user.type(screen.getByLabelText(/Email/), "test@test.com");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      expect(screen.getByRole("alert")).toHaveTextContent("Le nom est requis");
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("affiche une erreur quand l'email est vide au submit", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "Test Client");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      expect(screen.getByText("L'email est requis")).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("affiche une erreur pour un email invalide", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "Test Client");
      // Use fireEvent.change to set value, then fireEvent.submit to bypass HTML5 native validation
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "invalid-email" } });
      fireEvent.submit(screen.getByLabelText(/Nom \/ Entreprise/).closest("form")!);

      await waitFor(() => {
        expect(screen.getByText("Email invalide")).toBeInTheDocument();
      });
    });

    it("marque les champs invalides avec aria-invalid", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      expect(screen.getByLabelText(/Nom \/ Entreprise/)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("clearError", () => {
    it("efface l'erreur quand l'utilisateur tape dans le champ", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      // Submit to trigger errors
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));
      expect(screen.getByText("Le nom est requis")).toBeInTheDocument();

      // Type in the name field to clear error
      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "A");

      expect(screen.queryByText("Le nom est requis")).not.toBeInTheDocument();
    });

    it("efface l'erreur email quand l'utilisateur tape", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "Test");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));
      expect(screen.getByText("L'email est requis")).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Email/), "a");

      expect(screen.queryByText("L'email est requis")).not.toBeInTheDocument();
    });
  });

  describe("scroll to error", () => {
    it("appelle scrollIntoView sur le premier champ en erreur", async () => {
      const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView");
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      scrollSpy.mockRestore();
    });
  });

  describe("onSubmit", () => {
    it("appelle onSave avec les données sanitisées", async () => {
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "  Test Client  ");
      await user.type(screen.getByLabelText(/Email/), "  Test@Example.COM  ");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Client",
            email: "test@example.com",
          })
        );
      });
    });

    it("désactive le bouton pendant le chargement", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {})); // never resolves
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "Test Client");
      await user.type(screen.getByLabelText(/Email/), "test@example.com");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Créer le client/ })).toBeDisabled();
      });
    });

    it("affiche un toast d'erreur quand onSave rejette", async () => {
      const { toast } = await import("sonner");
      mockOnSave.mockRejectedValue(new Error("Erreur serveur"));
      const { user } = render(<ClientForm onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/Nom \/ Entreprise/), "Test Client");
      await user.type(screen.getByLabelText(/Email/), "test@example.com");
      await user.click(screen.getByRole("button", { name: /Créer le client/ }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erreur serveur");
      });
    });
  });

  describe("Annuler", () => {
    it("appelle onCancel au clic sur Annuler", async () => {
      const mockCancel = vi.fn();
      const { user } = render(
        <ClientForm onSave={mockOnSave} onCancel={mockCancel} />
      );

      await user.click(screen.getByRole("button", { name: /Annuler/ }));

      expect(mockCancel).toHaveBeenCalled();
    });
  });
});
