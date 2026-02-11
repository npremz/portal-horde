import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { FileUploadZone } from "../file-upload-zone";
import type { FileUploadProgress } from "../file-upload-zone";

describe("FileUploadZone", () => {
  let mockOnUpload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpload = vi.fn().mockResolvedValue(undefined);
  });

  describe("Rendu initial", () => {
    it("affiche la zone de drop", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      expect(
        screen.getByText("Glisser-déposer ou cliquer pour uploader")
      ).toBeInTheDocument();
    });

    it("affiche le message de taille max", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      expect(
        screen.getByText("Images, PDF, documents... (max 50 Mo)")
      ).toBeInTheDocument();
    });

    it("contient un input file avec aria-label", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const input = screen.getByLabelText("Téléverser des fichiers");
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("multiple");
    });
  });

  describe("Upload via input change", () => {
    it("appelle onUpload quand un fichier est sélectionné", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const input = screen.getByLabelText("Téléverser des fichiers");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });

    it("n'appelle pas onUpload si aucun fichier sélectionné", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const input = screen.getByLabelText("Téléverser des fichiers");
      fireEvent.change(input, { target: { files: [] } });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  describe("Drag and drop", () => {
    it("ajoute la classe active au dragover", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const zone = screen
        .getByText("Glisser-déposer ou cliquer pour uploader")
        .closest("div.relative");

      fireEvent.dragEnter(zone!);

      expect(zone).toHaveClass("border-primary");
    });

    it("retire la classe active au dragleave", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const zone = screen
        .getByText("Glisser-déposer ou cliquer pour uploader")
        .closest("div.relative");

      fireEvent.dragEnter(zone!);
      expect(zone).toHaveClass("border-primary");

      fireEvent.dragLeave(zone!);
      expect(zone).not.toHaveClass("border-primary");
    });

    it("appelle onUpload au drop de fichiers", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const zone = screen
        .getByText("Glisser-déposer ou cliquer pour uploader")
        .closest("div.relative");

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.drop(zone!, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });

    it("n'appelle pas onUpload au drop sans fichiers", () => {
      render(<FileUploadZone onUpload={mockOnUpload} />);

      const zone = screen
        .getByText("Glisser-déposer ou cliquer pour uploader")
        .closest("div.relative");

      fireEvent.drop(zone!, {
        dataTransfer: { files: [] },
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  describe("État uploading", () => {
    it("affiche 'Upload en cours...' quand uploading est true", () => {
      render(<FileUploadZone onUpload={mockOnUpload} uploading={true} />);

      expect(screen.getByText("Upload en cours...")).toBeInTheDocument();
    });

    it("désactive l'input quand uploading est true", () => {
      render(<FileUploadZone onUpload={mockOnUpload} uploading={true} />);

      const input = screen.getByLabelText("Téléverser des fichiers");
      expect(input).toBeDisabled();
    });
  });

  describe("Progress", () => {
    it("affiche la barre de progression", () => {
      const progress: FileUploadProgress = {
        fileName: "document.pdf",
        percent: 45,
        current: 1,
        total: 1,
      };

      render(
        <FileUploadZone
          onUpload={mockOnUpload}
          uploading={true}
          progress={progress}
        />
      );

      expect(screen.getByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("45%")).toBeInTheDocument();
    });

    it("affiche le compteur de fichiers multiples", () => {
      const progress: FileUploadProgress = {
        fileName: "image.png",
        percent: 30,
        current: 2,
        total: 5,
      };

      render(
        <FileUploadZone
          onUpload={mockOnUpload}
          uploading={true}
          progress={progress}
        />
      );

      expect(screen.getByText("image.png")).toBeInTheDocument();
      expect(screen.getByText(/Fichier 2 \/ 5/)).toBeInTheDocument();
    });

    it("n'affiche pas le compteur pour un seul fichier", () => {
      const progress: FileUploadProgress = {
        fileName: "doc.pdf",
        percent: 80,
        current: 1,
        total: 1,
      };

      render(
        <FileUploadZone
          onUpload={mockOnUpload}
          uploading={true}
          progress={progress}
        />
      );

      expect(screen.queryByText(/Fichier/)).not.toBeInTheDocument();
    });
  });
});
