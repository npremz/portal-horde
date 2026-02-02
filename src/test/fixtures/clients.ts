import type { Client, ClientContact, ClientMessage } from "@/types/database";

export const mockClients: Client[] = [
  {
    id: "client-1",
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+32 471 123 456",
    website: "https://acme.com",
    socials: {
      linkedin: "https://linkedin.com/company/acme",
    },
    status: "in_project",
    project_type: "website",
    sector: "tech",
    notes: "Client important",
    profile_id: null,
    first_contact_date: "2025-06-01",
    next_followup_date: "2026-02-01",
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2026-01-15T14:30:00Z",
  },
  {
    id: "client-2",
    name: "Beta Industries",
    email: "info@beta.be",
    phone: "+32 2 123 45 67",
    website: "https://beta.be",
    socials: {},
    status: "lead",
    project_type: "e-commerce",
    sector: "retail",
    notes: null,
    profile_id: null,
    first_contact_date: "2026-01-10",
    next_followup_date: "2026-01-20",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:00Z",
  },
];

export const mockContacts: ClientContact[] = [
  {
    id: "contact-1",
    client_id: "client-1",
    name: "Jean Dupont",
    email: "jean@acme.com",
    phone: "+32 471 111 111",
    role: "decision_maker",
    is_primary: true,
    notes: null,
    created_at: "2025-06-01T10:00:00Z",
  },
  {
    id: "contact-2",
    client_id: "client-1",
    name: "Marie Martin",
    email: "marie@acme.com",
    phone: null,
    role: "technical",
    is_primary: false,
    notes: "Dev lead",
    created_at: "2025-06-01T10:00:00Z",
  },
];

export const mockMessages: ClientMessage[] = [
  {
    id: "msg-1",
    client_id: "client-1",
    contact_id: "contact-1",
    subject: "Proposition commerciale",
    content: "Bonjour, suite a notre echange...",
    sent_at: "2025-06-15T14:00:00Z",
    sent_by: "user-1",
    message_type: "prospecting",
  },
];
