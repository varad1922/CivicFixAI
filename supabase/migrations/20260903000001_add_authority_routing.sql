-- Add department and jurisdiction to profiles
alter table public.profiles
add column department text,
add column jurisdiction text;

-- Add assigned_authority_id to issues
alter table public.issues
add column assigned_authority_id uuid references public.profiles(id);

-- Update RLS policies for issues to allow authorities to update ONLY if assigned, or keep general for now.
-- Given the prompt: "Only VERIFIED and ACTIVE authorities should receive operational complaints."
-- We will handle this in the backend, but we need the field in the database.

-- Index for assigned_authority_id
create index issues_assigned_authority_idx on public.issues (assigned_authority_id);
