import { z } from "zod";

/**
 * API request validation schemas using Zod.
 * These schemas validate incoming request bodies for API endpoints.
 */

// ============================================
// Client Schemas
// ============================================

const clientStatusSchema = z.enum([
  "lead",
  "contacted",
  "in_project",
  "pending_review",
  "completed",
  "archived",
]);

const projectTypeSchema = z.enum([
  "website",
  "ecommerce",
  "webapp",
  "mobile",
  "branding",
  "seo",
  "maintenance",
  "other",
]);

const sectorSchema = z.enum([
  "restaurant",
  "retail",
  "health",
  "realestate",
  "tech",
  "finance",
  "education",
  "industry",
  "services",
  "nonprofit",
  "creative",
  "other",
]);

const socialsSchema = z
  .object({
    linkedin: z.string().url().optional(),
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
  })
  .optional();

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable(),
  status: clientStatusSchema.optional().default("lead"),
  notes: z.string().max(5000).optional().nullable(),
  project_type: projectTypeSchema.optional().nullable(),
  sector: sectorSchema.optional().nullable(),
  socials: socialsSchema,
  is_priority: z.boolean().optional().default(false),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable(),
  status: clientStatusSchema.optional(),
  notes: z.string().max(5000).optional().nullable(),
  project_type: projectTypeSchema.optional().nullable(),
  sector: sectorSchema.optional().nullable(),
  socials: socialsSchema,
  first_contact_date: z.string().datetime().optional().nullable(),
  next_followup_date: z.string().datetime().optional().nullable(),
  is_priority: z.boolean().optional(),
});

// ============================================
// Contact Schemas
// ============================================

const contactRoleSchema = z.enum([
  "decision_maker",
  "technical",
  "billing",
  "marketing",
  "other",
]);

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: contactRoleSchema.optional().default("other"),
  is_primary: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: contactRoleSchema.optional(),
  is_primary: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// ============================================
// API Key Schemas
// ============================================

const apiPermissionSchema = z.enum([
  "clients:read",
  "clients:write",
  "clients:delete",
  "messages:send",
  "stats:read",
]);

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  permissions: z.array(apiPermissionSchema).min(1, "At least one permission is required"),
  expires_at: z.string().datetime().optional().nullable(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(apiPermissionSchema).min(1).optional(),
  is_active: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
});

// ============================================
// Message Schemas
// ============================================

const messageTypeSchema = z.enum(["prospecting", "followup", "custom"]);

export const createMessageSchema = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  subject: z.string().min(1, "Subject is required").max(255),
  content: z.string().min(1, "Content is required").max(50000),
  message_type: messageTypeSchema.optional().default("custom"),
});

// ============================================
// Contact Form Schema (public endpoint)
// ============================================

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  company: z.string().max(255).optional().nullable(),
  category: z.string().min(1, "Category is required").max(100),
  subject: z.string().min(1, "Subject is required").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(10000),
});

// ============================================
// Query Parameter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export const clientsQuerySchema = paginationSchema.extend({
  status: clientStatusSchema.optional(),
  search: z.string().max(255).optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ClientsQueryInput = z.infer<typeof clientsQuerySchema>;
