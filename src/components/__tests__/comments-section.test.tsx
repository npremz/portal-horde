import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { CommentsSection } from "../comments-section";
import type { Comment, Profile } from "@/types/database";

interface CommentWithAuthor extends Comment {
  author?: Profile;
}

const mockAuthor: Profile = {
  id: "user-1",
  email: "alice@example.com",
  full_name: "Alice Dupont",
  avatar_url: null,
  company: null,
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
};

const mockComments: CommentWithAuthor[] = [
  {
    id: "c1",
    deliverable_id: "d1",
    author_id: "user-1",
    content: "Premier commentaire",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    author: mockAuthor,
  },
  {
    id: "c2",
    deliverable_id: "d1",
    author_id: "user-2",
    content: "Second commentaire",
    created_at: "2026-01-15T11:00:00Z",
    updated_at: "2026-01-15T11:00:00Z",
    author: {
      ...mockAuthor,
      id: "user-2",
      email: "bob@example.com",
      full_name: "Bob Martin",
    },
  },
];

describe("CommentsSection", () => {
  let mockOnSendComment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSendComment = vi.fn().mockResolvedValue(undefined);
  });

  describe("Liste de commentaires", () => {
    it("affiche les commentaires existants", () => {
      render(
        <CommentsSection
          comments={mockComments}
          currentUserId="user-1"
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText("Premier commentaire")).toBeInTheDocument();
      expect(screen.getByText("Second commentaire")).toBeInTheDocument();
    });

    it("affiche le compteur de commentaires", () => {
      render(
        <CommentsSection
          comments={mockComments}
          currentUserId="user-1"
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText("Commentaires (2)")).toBeInTheDocument();
    });

    it("affiche le nom des auteurs", () => {
      render(
        <CommentsSection
          comments={mockComments}
          currentUserId="user-1"
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText(/Alice Dupont/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Martin/)).toBeInTheDocument();
    });

    it("indique '(vous)' pour l'utilisateur courant", () => {
      render(
        <CommentsSection
          comments={mockComments}
          currentUserId="user-1"
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText(/Alice Dupont \(vous\)/)).toBeInTheDocument();
      expect(screen.getByText("Bob Martin")).toBeInTheDocument();
    });

    it("affiche 'Anonyme' sans auteur", () => {
      const commentSansAuteur: CommentWithAuthor[] = [
        {
          id: "c3",
          deliverable_id: "d1",
          author_id: null,
          content: "Commentaire anonyme",
          created_at: "2026-01-15T12:00:00Z",
          updated_at: "2026-01-15T12:00:00Z",
        },
      ];

      render(
        <CommentsSection
          comments={commentSansAuteur}
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText("Anonyme")).toBeInTheDocument();
    });
  });

  describe("État vide", () => {
    it("affiche 'Aucun commentaire' sans commentaires", () => {
      render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText("Aucun commentaire")).toBeInTheDocument();
    });

    it("affiche le compteur à 0", () => {
      render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByText("Commentaires (0)")).toBeInTheDocument();
    });
  });

  describe("Ajout de commentaire", () => {
    it("appelle onSendComment avec le contenu sanitisé", async () => {
      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      await user.type(
        screen.getByPlaceholderText("Ajouter un commentaire..."),
        "Mon nouveau commentaire"
      );
      await user.click(screen.getByRole("button", { name: /Envoyer/ }));

      await waitFor(() => {
        expect(mockOnSendComment).toHaveBeenCalledWith("Mon nouveau commentaire");
      });
    });

    it("réinitialise le textarea après envoi réussi", async () => {
      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      const textarea = screen.getByPlaceholderText("Ajouter un commentaire...");
      await user.type(textarea, "Mon commentaire");
      await user.click(screen.getByRole("button", { name: /Envoyer/ }));

      await waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("ne réinitialise PAS le textarea si onSendComment rejette", async () => {
      mockOnSendComment.mockRejectedValue(new Error("Erreur réseau"));

      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      const textarea = screen.getByPlaceholderText("Ajouter un commentaire...");
      await user.type(textarea, "Mon commentaire");
      await user.click(screen.getByRole("button", { name: /Envoyer/ }));

      await waitFor(() => {
        expect(textarea).toHaveValue("Mon commentaire");
      });
    });
  });

  describe("Bouton Envoyer", () => {
    it("est désactivé si le textarea est vide", () => {
      render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      expect(screen.getByRole("button", { name: /Envoyer/ })).toBeDisabled();
    });

    it("est désactivé si le textarea ne contient que des espaces", async () => {
      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      await user.type(
        screen.getByPlaceholderText("Ajouter un commentaire..."),
        "   "
      );

      expect(screen.getByRole("button", { name: /Envoyer/ })).toBeDisabled();
    });

    it("est activé quand le textarea contient du texte", async () => {
      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      await user.type(
        screen.getByPlaceholderText("Ajouter un commentaire..."),
        "Hello"
      );

      expect(screen.getByRole("button", { name: /Envoyer/ })).toBeEnabled();
    });
  });

  describe("État d'envoi", () => {
    it("désactive le textarea et le bouton pendant l'envoi", async () => {
      mockOnSendComment.mockImplementation(() => new Promise(() => {})); // never resolves

      const { user } = render(
        <CommentsSection
          comments={[]}
          onSendComment={mockOnSendComment}
        />
      );

      await user.type(
        screen.getByPlaceholderText("Ajouter un commentaire..."),
        "Test"
      );
      await user.click(screen.getByRole("button", { name: /Envoyer/ }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Envoyer/ })).toBeDisabled();
      });
    });
  });
});
