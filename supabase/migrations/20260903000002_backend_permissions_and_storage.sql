-- The API uses the server-only service_role key. Keep client access behind
-- the Express API; do not grant the public anon role write access.
grant select, insert, update, delete on table public.issues to service_role;
grant select, insert, update, delete on table public.issue_images to service_role;
grant select, insert, update, delete on table public.issue_timeline to service_role;
grant select, insert, update, delete on table public.activity_events to service_role;
grant select, insert, update, delete on table public.profiles to service_role;

grant execute on function public.find_nearby_issues(double precision, double precision, double precision) to service_role;
grant execute on function public.get_category_trends() to service_role;

-- Supabase Storage bucket used by the backend for issue photos and avatars.
insert into storage.buckets (id, name, public)
values ('civicfix', 'civicfix', true)
on conflict (id) do update set public = true;
