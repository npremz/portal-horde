import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { NotificationBell } from "../notification-bell";
import type { Notification } from "@/types/database";

// ResizeObserver class mock (floating-ui needs a real constructor)
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockRouterPush = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Configurable mock data
let currentNotifications: Notification[] = [];
let currentUnreadCount = 0;

// Mock the useNotifications hook
vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    get notifications() { return currentNotifications; },
    get unreadCount() { return currentUnreadCount; },
    loading: false,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    refresh: vi.fn(),
  }),
}));

const mockNotifications: Notification[] = [
  {
    id: "n1",
    user_id: "user-1",
    type: "deliverable_ready",
    title: "Nouveau livrable prêt",
    message: "Maquette V2 est disponible",
    link: "/projects/p1/deliverables/d1",
    read_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "n2",
    user_id: "user-1",
    type: "new_comment",
    title: "Nouveau commentaire",
    message: "Alice a commenté",
    link: "/projects/p1/deliverables/d2",
    read_at: "2026-01-15T10:00:00Z",
    created_at: "2026-01-15T09:00:00Z",
  },
];

describe("NotificationBell - avec notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentNotifications = mockNotifications;
    currentUnreadCount = 1; // n1 is unread
  });

  describe("Badge", () => {
    it("affiche un badge avec le nombre de non lus", () => {
      render(<NotificationBell />);

      const button = screen.getByRole("button", { name: "Notifications" });
      const badge = button.querySelector(".bg-red-500");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("1");
    });

    it("a un bouton accessible", () => {
      render(<NotificationBell />);

      expect(
        screen.getByRole("button", { name: "Notifications" })
      ).toBeInTheDocument();
    });
  });

  describe("Popover", () => {
    it("ouvre le popover au clic", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );

      expect(screen.getByText("Nouveau livrable prêt")).toBeInTheDocument();
      expect(screen.getByText("Nouveau commentaire")).toBeInTheDocument();
    });

    it("affiche le titre 'Notifications' dans le popover", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );

      expect(screen.getByText("Notifications", { selector: "h4" })).toBeInTheDocument();
    });

    it("affiche les messages des notifications", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );

      expect(
        screen.getByText("Maquette V2 est disponible")
      ).toBeInTheDocument();
      expect(screen.getByText("Alice a commenté")).toBeInTheDocument();
    });

    it("affiche le bouton 'Tout marquer lu' quand il y a des non lus", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );

      expect(
        screen.getByRole("button", { name: /Tout marquer lu/ })
      ).toBeInTheDocument();
    });
  });

  describe("Mark as read", () => {
    it("appelle markAsRead au clic sur une notification non lue", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );
      await user.click(screen.getByText("Nouveau livrable prêt"));

      expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
    });

    it("ne rappelle pas markAsRead pour une notification déjà lue", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );
      await user.click(screen.getByText("Nouveau commentaire"));

      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });

    it("navigue vers le lien de la notification", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );
      await user.click(screen.getByText("Nouveau livrable prêt"));

      expect(mockRouterPush).toHaveBeenCalledWith(
        "/projects/p1/deliverables/d1"
      );
    });

    it("appelle markAllAsRead au clic sur 'Tout marquer lu'", async () => {
      const { user } = render(<NotificationBell />);

      await user.click(
        screen.getByRole("button", { name: "Notifications" })
      );
      await user.click(
        screen.getByRole("button", { name: /Tout marquer lu/ })
      );

      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });
});

describe("NotificationBell - sans notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentNotifications = [];
    currentUnreadCount = 0;
  });

  it("n'affiche pas de badge sans notification non lue", () => {
    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: "Notifications" });
    const badge = button.querySelector(".bg-red-500");
    expect(badge).not.toBeInTheDocument();
  });

  it("affiche 'Aucune notification' quand la liste est vide", async () => {
    const { user } = render(<NotificationBell />);

    await user.click(
      screen.getByRole("button", { name: "Notifications" })
    );

    expect(screen.getByText("Aucune notification")).toBeInTheDocument();
  });

  it("n'affiche pas le bouton 'Tout marquer lu' sans non lus", async () => {
    const { user } = render(<NotificationBell />);

    await user.click(
      screen.getByRole("button", { name: "Notifications" })
    );

    expect(
      screen.queryByRole("button", { name: /Tout marquer lu/ })
    ).not.toBeInTheDocument();
  });
});
