-- 14. Message type enum for CRM prospection

create type message_type as enum (
  'prospecting',  -- Initial outreach
  'followup',     -- Follow-up message
  'custom'        -- Custom/other message
);
