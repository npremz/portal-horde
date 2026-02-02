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

## Next Steps (Manual)

1. Run migrations on Supabase:
   ```bash
   supabase db push
   ```

2. Test the CRM workflow:
   - Create a client without account
   - Add contacts
   - Create a project with selected phases
   - Invite the client
   - Verify client can log in and see their project

3. Test the prospection workflow:
   - Send a first message to a client
   - Verify first_contact_date is set
   - Verify next_followup_date is set (now + 10 days)
   - Verify message appears in timeline
   - Verify client status changes to "contacted"
   - Wait/modify date to test "A relancer" filter

4. Verify RLS policies work correctly for both admin and client access
