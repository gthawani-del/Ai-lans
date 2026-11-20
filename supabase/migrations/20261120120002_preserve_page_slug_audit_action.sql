-- Keep M2.7-A slug edits working alongside Job 1-A homepage audit actions.
alter table public.cms_audit_events drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events add constraint cms_audit_events_action_check check (action in (
  'page_created','page_duplicated','page_previewed','page_draft_saved','page_published','page_archived','page_revision_restored','page_slug_changed',
  'homepage_draft_saved','homepage_published','homepage_revision_restored'
));
