# CRM Client System Implementation

## Completed Tasks

- [x] Create database migrations for CRM system
  - `08_crm_enums.sql`: client_status and contact_role enums
  - `09_clients_table.sql`: clients table with CRM fields
  - `10_client_contacts_table.sql`: multiple contacts per client
  - `11_phase_templates.sql`: reusable phase templates
  - `12_modify_projects_fk.sql`: migrate projects.client_id from profiles to clients
  - `13_rls_updates.sql`: update RLS policies for new relationship chain

- [x] Update TypeScript types and constants
  - Added `Client`, `ClientContact`, `PhaseTemplate` types
  - Added `ClientStatus`, `ContactRole` type unions
  - Added `clientStatusConfig`, `contactRoleConfig` to constants
  - Added validation functions: `validatePhone`, `validateWebsite`, `validateSocials`, `validateNotes`

- [x] Create CRM components
  - `client-form.tsx`: Full client creation/editing form
  - `contacts-section.tsx`: Manage multiple contacts with roles
  - `create-client-dialog.tsx`: Quick client creation dialog
  - `invite-client-button.tsx`: Smart invitation with status check
  - `phase-templates-selector.tsx`: Select and reorder phases for projects
  - `checkbox.tsx`: Added missing UI component

- [x] Update admin pages for CRM
  - `admin/clients/page.tsx`: Now queries clients table instead of profiles
  - `admin/clients/[id]/page.tsx`: New CRM detail page with contacts, projects, invite button
  - `admin/projects/new/page.tsx`: Uses clients table, phase templates selector
  - `admin/projects/[id]/page.tsx`: Links to client CRM page
  - `admin/projects/[id]/edit/page.tsx`: Uses clients table for dropdown
  - `admin/projects/page.tsx`: Uses clients table for display

- [x] Create invitation API and update dashboard
  - `api/clients/[id]/invite/route.ts`: New API for inviting existing clients
  - `dashboard/page.tsx`: Updated to use clients table via profile_id
  - `projects/[id]/page.tsx`: Updated access check for new relationship

## Database Schema Changes

### New Tables
- `clients`: CRM entities (name, email, phone, website, socials, status, notes, profile_id)
- `client_contacts`: Multiple contacts per client (name, email, phone, role, is_primary, notes)
- `phase_templates`: Reusable phase templates with is_default flag

### Modified Tables
- `projects.client_id`: Now references `clients(id)` instead of `profiles(id)`

### Relationship Chain
```
profiles (auth) -> clients (profile_id) -> projects (client_id)
```

## Prospection System (Completed)

- [x] Database migrations
  - `14_message_type_enum.sql`: message_type enum (prospecting, followup, custom)
  - `15_client_messages_table.sql`: client_messages table with RLS
  - `16_clients_contact_fields.sql`: first_contact_date and next_followup_date columns

- [x] TypeScript types and constants
  - Added `MessageType`, `ClientMessage` types
  - Added `messageTypeConfig` and `prospectingTemplates` constants
  - Added `FOLLOWUP_DELAY_DAYS` constant (10 days)

- [x] Email template
  - Added `prospectingEmail()` function with clean HTML template
  - Added `replaceTemplateVariables()` helper for {{nom}}, {{prenom}}, {{entreprise}}, {{email}}

- [x] UI Components
  - `send-message-dialog.tsx`: Dialog with contact selector, template editor, type selector
  - `messages-timeline.tsx`: Message history display
  - `followup-badge.tsx`: Badge showing count of clients to follow up

- [x] API Route
  - `api/clients/[id]/message/route.ts`: Send email, record in history, update dates/status

- [x] Page Updates
  - Client detail page: Added SendMessageDialog button and MessagesTimeline
  - Clients list page: Added "A relancer" filter with badge
  - Sidebar: Added FollowupBadge next to "Clients" menu item

### Prospection Workflow

1. Admin goes to client detail page
2. Clicks "Envoyer un message" button
3. Selects contact, message type (template auto-fills)
4. Customizes and sends message
5. System:
   - Sends email via Resend
   - Records message in client_messages
   - Sets first_contact_date (if first message)
   - Sets next_followup_date = now + 10 days
   - Updates client status to "contacted" (if was "lead")
6. Admin can filter "A relancer" to see clients needing followup
7. Sidebar badge shows count of pending followups

## Dashboard Analytics (Completed)

- [x] Install recharts dependency
- [x] Create API route `/api/dashboard/stats` with aggregated stats
- [x] Create dashboard components:
  - `stats-cards.tsx`: 4 KPI cards (Total Clients, Pipeline Actif, Projets Actifs, A Relancer)
  - `pipeline-chart.tsx`: Horizontal bar chart of clients by CRM status
  - `projects-chart.tsx`: Donut chart of projects by status
  - `activity-chart.tsx`: Line chart of messages and actions over 30 days
  - `followup-table.tsx`: Table of clients needing followup
  - `active-projects-table.tsx`: Table of active projects with progress
- [x] Create admin dashboard page at `/admin/dashboard`
- [x] Update navigation in `app-sidebar.tsx` to point admins to `/admin/dashboard`

### Dashboard Features
- 4 KPI cards with icons and secondary metrics
- Pipeline CRM bar chart showing distribution by status
- Projects donut chart with total in center
- 30-day activity line chart (messages + client actions)
- Top 5 clients needing followup with days overdue indicator
- Top 5 active projects with progress bars
- Responsive design (2 columns on desktop, stack on mobile)
- Loading skeletons for all components
- Admin/Editor only access (verified in API route)

## Test Suite (Completed)

- [x] Install test dependencies (Vitest, RTL, Playwright, MSW)
- [x] Create test configuration (vitest.config.ts, playwright.config.ts)
- [x] Create test utilities and mocks
  - MSW handlers for API mocking
  - Test fixtures for clients, projects, users
  - Custom render function with user event support
- [x] Write unit tests (115 tests)
  - `validation.ts`: 67 tests for all sanitization and validation functions
  - `permissions.ts`: 20 tests for role-based access control
  - `utils.ts`: 21 tests for cn(), getFileIcon(), formatFileSize(), formatDate()
  - `activity.ts`: 7 tests for actionLabels and actionColors
- [x] Write API integration tests (21 tests)
  - `/api/dashboard/stats`: Auth, role checks, stats calculation
  - `/api/users`: User creation, validation, role checks
  - `/api/contact`: Contact form validation and email sending
- [x] Write component tests (19 tests)
  - `StatsCards`: Loading states, KPI display, null handling
  - `PipelineChart`: Empty states, data rendering
  - `ThemeToggle`: Theme switching functionality
- [x] Write E2E tests (Playwright)
  - `auth.spec.ts`: Login page, redirects, public pages
  - `permissions.spec.ts`: Route protection, unauthenticated access
  - `contact.spec.ts`: Contact form validation
  - `smoke.spec.ts`: App health, responsive design
- [x] Create GitHub Actions CI/CD workflow
  - Unit tests with coverage
  - Lint check
  - Build verification
  - E2E tests with Playwright

### Test Commands
```bash
npm test              # Run unit tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # Run E2E tests with UI
```

### Coverage Targets
- Global: > 70%
- lib/: > 90%
- API routes: > 80%
- E2E critical paths: 100%

## Bot API System (Completed)

- [x] Database migration `20_api_keys.sql`
  - api_keys table (id, profile_id, name, key_hash, key_prefix, permissions, is_active, expires_at, last_used_at)
  - Indexes and RLS policies (admin only)
  - Function to update last_used_at

- [x] TypeScript types
  - `ApiPermission` type (clients:read, clients:write, clients:delete, messages:send, stats:read)
  - `ApiKey` interface

- [x] API authentication helper `src/lib/api-auth.ts`
  - `generateApiKey()`: Creates key with hash and prefix
  - `validateApiKey()`: Validates and returns auth info
  - `hasApiPermission()`: Checks permission
  - `extractApiKey()`: Parses Authorization header
  - `API_PERMISSIONS`: Permission definitions

- [x] Bot API endpoints `/api/v1/`
  - `GET /clients`: List with pagination, filters
  - `POST /clients`: Create client
  - `GET /clients/:id`: Get details with contacts
  - `PATCH /clients/:id`: Update client
  - `DELETE /clients/:id`: Delete client
  - `GET /clients/:id/contacts`: List contacts
  - `POST /clients/:id/contacts`: Add contact
  - `PATCH /contacts/:id`: Update contact
  - `DELETE /contacts/:id`: Delete contact
  - `GET /stats`: Dashboard statistics

- [x] Admin API for key management `/api/api-keys/`
  - `GET`: List all keys
  - `POST`: Create key (returns full key once)
  - `PATCH /:id`: Update (toggle active, permissions)
  - `DELETE /:id`: Delete key

- [x] Admin UI `/admin/api-keys`
  - Page with table of keys
  - Create dialog (shows key once)
  - Permissions selector
  - Toggle active/inactive
  - Delete confirmation

- [x] Documentation
  - `docs/api/BOT_API.md`: Markdown quick reference
  - `docs/api/openapi.yaml`: OpenAPI 3.1 specification

- [x] Navigation
  - Added "Cles API" to admin sidebar

### API Response Format
- Minimal JSON to save tokens
- Null fields omitted
- Pagination with meta object

### Tests (54 tests)
- [x] `src/lib/__tests__/api-auth.test.ts` (27 tests)
  - `generateApiKey()`: Key format, hash, prefix, uniqueness
  - `hashApiKey()`: Consistency, SHA-256 format
  - `hasApiPermission()`: Permission checking
  - `extractApiKey()`: Header parsing
  - `validateApiKey()`: Auth validation, expiry, disabled keys
- [x] `src/app/api/v1/clients/__tests__/route.test.ts` (12 tests)
  - Auth: 401 missing key, 401 invalid key, 403 missing permission
  - GET: Pagination, status filter, null field omission
  - POST: Validation, creation, duplicate email handling
- [x] `src/app/api/v1/stats/__tests__/route.test.ts` (6 tests)
  - Auth: 401/403 handling
  - Stats calculation, conversion rate, pending followups
- [x] `src/app/api/api-keys/__tests__/route.test.ts` (9 tests)
  - Admin-only access (401, 403)
  - Key listing, creation with permissions
  - Full key returned only once on creation

## Next Steps (Manual)

1. Test the CRM workflow:
   - Create a client without account
   - Add contacts
   - Create a project with selected phases
   - Invite the client
   - Verify client can log in and see their project

2. Test the prospection workflow:
   - Send a first message to a client
   - Verify first_contact_date is set
   - Verify next_followup_date is set (now + 10 days)
   - Verify message appears in timeline
   - Verify client status changes to "contacted"
   - Wait/modify date to test "A relancer" filter

3. Test the Bot API:
   - Create an API key from `/admin/api-keys`
   - Copy the key (shown once)
   - Test with curl:
     ```bash
     curl -H "Authorization: Bearer horde_xxx" \
       https://portal.hordeagence.com/api/v1/clients
     ```
   - Test permission errors (missing permission -> 403)
   - Test invalid key (-> 401)

4. Verify RLS policies work correctly for both admin and client access

## Error Handling System (Completed)

- [x] Create error codes and messages (`src/lib/errors/error-codes.ts`)
  - ErrorCode enum with 13 error types (UNKNOWN, UNAUTHORIZED, NOT_FOUND, etc.)
  - French error messages for all codes
  - HTTP status code mapping for all errors

- [x] Create AppError class (`src/lib/errors/app-error.ts`)
  - Custom error class with code, statusCode, requestId, timestamp
  - `fromUnknown()` static method for catch blocks
  - `toJSON()` for API responses

- [x] Create database error mapper (`src/lib/errors/db-error-mapper.ts`)
  - Maps PostgreSQL error codes to AppError
  - Helpers: `isNotFoundError()`, `isDuplicateError()`, `isAuthError()`
  - Extracts user-friendly messages from constraint violations

- [x] Create critical error email template (`src/lib/email/templates/critical-error.ts`)
  - Red alert header with timestamp
  - Error details table (code, requestId, URL)
  - Stack trace section (code block)
  - Auto-generated alert footer

- [x] Create structured logger (`src/lib/errors/logger.ts`)
  - Log levels: debug, info, warn, error, critical
  - Formatted output: `[Horde] [Prefix] [LEVEL] timestamp - message {context}`
  - `createLogger(prefix)` for module-specific loggers
  - `critical()` sends email notification to admin
  - Anti-spam: 5min cooldown per message, 10 emails/hour max
  - Env vars: `ADMIN_EMAIL`, `DISABLE_ERROR_EMAILS`

- [x] Create API response helpers (`src/lib/errors/api-response.ts`)
  - `generateRequestId()`: Unique request tracking
  - `apiError()`: Standardized error response with logging
  - `apiSuccess<T>()`: Standardized success response
  - `apiErrors.*`: Shortcut helpers (unauthorized, forbidden, notFound, etc.)

- [x] Create Error Boundaries
  - `src/app/global-error.tsx`: Critical errors (standalone HTML)
  - `src/app/error.tsx`: Root route errors
  - `src/app/(dashboard)/error.tsx`: Dashboard errors
  - `src/app/admin/error.tsx`: Admin errors
  - All show: icon, message, reference, retry/home buttons

- [x] Create useAsync hook (`src/hooks/use-async.ts`)
  - Loading, error, success states
  - Retry with exponential backoff
  - Toast notifications on error (sonner)
  - Parses API error response format
  - `useFetch()` variant for fetch operations

- [x] Migrate `/api/users/route.ts` as reference
  - Uses `generateRequestId()`, `apiErrors.*`, `apiSuccess()`
  - Uses `createLogger()` for structured logging
  - Uses `mapDatabaseError()` for DB errors

- [x] Write unit tests (49 new tests)
  - `src/lib/__tests__/errors.test.ts` (33 tests)
  - `src/hooks/__tests__/use-async.test.ts` (16 tests)
  - Updated `src/app/api/users/__tests__/route.test.ts` (8 tests)

### API Response Format
```typescript
// Success
{ data: T, meta?: Record<string, unknown> }

// Error
{ error: { code: ErrorCode, message: string, requestId?: string } }
```

### Console Log Format
```
[Horde] [ModuleName] [ERROR] 2024-01-15T10:30:00.000Z - Message {"requestId":"req_abc","code":"NOT_FOUND"}
```

### Environment Variables
```
ADMIN_EMAIL=admin@hordeagence.com
DISABLE_ERROR_EMAILS=false
```

### Migration Guide (Other Routes)
```typescript
import {
  generateRequestId,
  apiError,
  apiSuccess,
  apiErrors,
  createLogger,
  mapDatabaseError,
} from "@/lib/errors";

const log = createLogger("MyRoute");

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    if (!user) return apiErrors.unauthorized(requestId);
    if (dbError) return apiError(mapDatabaseError(dbError, requestId), requestId);
    return apiSuccess(data, undefined, 201);
  } catch (error) {
    return apiError(error, requestId);
  }
}
```

---

## Production Readiness (Completed - 2026-02-03)

### Phase 1: Security

- [x] **Security Headers** (`next.config.ts`)
  - CSP (Content-Security-Policy)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
  - HSTS (production only)

- [x] **CORS Configuration** (`src/middleware.ts`)
  - Allowed origins via `ALLOWED_ORIGINS` env var
  - CORS headers on `/api/*` routes
  - Preflight (OPTIONS) handling

- [x] **Rate Limiting** (`src/lib/security/rate-limiter.ts`, `src/middleware.ts`)
  - In-memory sliding window rate limiter
  - API public (`/api/v1/*`): 100 req/min
  - API auth (`/api/*`): 30 req/min
  - Contact form: 5 req/min
  - Login: 5 attempts/15min

### Phase 2: Validation & Robustesse

- [x] **Environment Validation** (`src/lib/env.ts`, `src/lib/supabase/*.ts`)
  - Zod schema for client vars
  - Zod schema for server vars
  - Fail-fast on startup
  - TypeScript types
  - Updated Supabase files to use validated env

- [x] **Health Check** (`src/app/api/health/route.ts`)
  - GET `/api/health` endpoint
  - Database connectivity check
  - Auth service check
  - Version and timestamp

- [x] **API Request Validation** (`src/lib/api/schemas.ts`, `src/lib/api/validate-request.ts`)
  - Zod schemas for all entities
  - `validateBody()`, `validateQuery()`, `validateId()` helpers
  - Uniform error responses

### Phase 3: Monitoring

- [x] **Structured Logging** (`src/middleware.ts`)
  - Request ID on all requests
  - Duration tracking
  - JSON log format
  - IP logging for rate limit debug

### Phase 4: DevOps

- [x] **Deploy Pipeline** (`.github/workflows/deploy.yml`)
  - GitHub Actions workflow
  - Lint + Test + Build steps
  - Preview deploy for PRs
  - Production deploy for main
  - Smoke tests post-deploy

- [x] **Deployment Guide** (`tasks/deployment-guide.md`)
  - GitHub secrets configuration
  - Vercel env vars setup
  - Rollback procedure
  - Pre-deploy checklist
  - Troubleshooting guide

### Files Created/Modified

| File | Action |
|------|--------|
| `next.config.ts` | Modified - Added security headers |
| `src/middleware.ts` | Modified - CORS, rate limiting, logging |
| `.env.example` | Modified - Added new env vars |
| `src/lib/env.ts` | Created - Environment validation |
| `src/lib/security/rate-limiter.ts` | Created - Rate limiting |
| `src/lib/supabase/client.ts` | Modified - Use validated env |
| `src/lib/supabase/server.ts` | Modified - Use validated env |
| `src/lib/supabase/admin.ts` | Modified - Use validated env |
| `src/lib/supabase/middleware.ts` | Modified - Use validated env |
| `src/app/api/health/route.ts` | Created - Health endpoint |
| `src/lib/api/schemas.ts` | Created - Zod schemas |
| `src/lib/api/validate-request.ts` | Created - Validation utilities |
| `.github/workflows/deploy.yml` | Created - CI/CD pipeline |
| `tasks/deployment-guide.md` | Created - Documentation |

### Verification Results

- ✅ `npm run build` - Success
- ✅ `npm test` - 259 tests passed
