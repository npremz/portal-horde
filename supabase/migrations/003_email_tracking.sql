-- Add email tracking columns to client_messages
ALTER TABLE client_messages
  ADD COLUMN resend_email_id text,
  ADD COLUMN clicked_at timestamptz,
  ADD COLUMN clicked_link text;

-- Index for webhook lookups by resend email id
CREATE INDEX idx_client_messages_resend_id ON client_messages(resend_email_id) WHERE resend_email_id IS NOT NULL;
