-- Remaining attendee workshop-preparation choices.
-- Added as nullable fields to preserve historical applications.
ALTER TABLE public.attendee_registrations
 ADD COLUMN IF NOT EXISTS preferred_contact_method text,
 ADD COLUMN IF NOT EXISTS representative_data_permission text,
 ADD COLUMN IF NOT EXISTS participation_support text,
 ADD COLUMN IF NOT EXISTS heard_about text;
