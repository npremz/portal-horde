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
