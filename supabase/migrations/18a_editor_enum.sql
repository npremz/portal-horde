-- 18a. Add editor value to user_role enum
-- Must be committed before using the value in policies
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'editor';
