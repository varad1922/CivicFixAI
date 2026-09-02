-- Enable PostGIS extension for geospatial features
create extension if not exists postgis schema extensions;
-- Enable UUID extension
create extension if not exists "uuid-ossp" schema extensions;

-- Create custom types (enums)
create type user_role as enum ('citizen', 'authority', 'admin');
create type issue_category as enum (
  'Pothole',
  'Garbage Accumulation',
  'Water Leakage',
  'Broken Streetlight',
  'Drainage Issue',
  'Damaged Road',
  'Illegal Dumping',
  'Traffic Signal Issue',
  'Public Property Damage',
  'Other'
);
create type issue_severity as enum ('Low', 'Medium', 'High', 'Critical');
create type issue_status as enum ('Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed');

-- PROFILES TABLE (Linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text unique not null,
  role user_role default 'citizen'::user_role,
  avatar text default '',
  auth_provider text default 'email',
  is_active boolean default true,
  last_login timestamp with time zone,
  last_active timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ISSUES TABLE
create table public.issues (
  id uuid default uuid_generate_v4() primary key,
  title varchar(100) not null,
  description varchar(1000) not null,
  category issue_category not null,
  severity issue_severity not null,
  status issue_status default 'Reported'::issue_status,
  location geometry(Point, 4326), -- PostGIS Point
  lat numeric not null,
  lng numeric not null,
  address text,
  reported_by uuid references public.profiles(id) not null,
  support_count integer default 0,
  priority_score integer default 0,
  -- AI Analysis Fields
  ai_category text,
  ai_severity text,
  ai_confidence numeric,
  ai_suggested_title text,
  ai_suggested_description text,
  ai_safety_impact text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ISSUE IMAGES TABLE
create table public.issue_images (
  id uuid default uuid_generate_v4() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  url text not null,
  public_id text,
  created_at timestamp with time zone default now()
);

-- ISSUE TIMELINE TABLE
create table public.issue_timeline (
  id uuid default uuid_generate_v4() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  status issue_status not null,
  user_id uuid references public.profiles(id),
  note text,
  timestamp timestamp with time zone default now()
);

-- ACTIVITY EVENTS TABLE
create table public.activity_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null,
  user_id uuid references public.profiles(id),
  issue_id uuid references public.issues(id),
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Create Indexes
create index issues_location_idx on public.issues using gist (location);
create index issues_reported_by_idx on public.issues (reported_by);
create index issue_images_issue_id_idx on public.issue_images (issue_id);
create index issue_timeline_issue_id_idx on public.issue_timeline (issue_id);
create index activity_events_user_id_idx on public.activity_events (user_id);
create index activity_events_issue_id_idx on public.activity_events (issue_id);

-- Setup Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_images enable row level security;
alter table public.issue_timeline enable row level security;
alter table public.activity_events enable row level security;

-- PROFILES POLICIES
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ISSUES POLICIES
create policy "Issues are viewable by everyone" on public.issues
  for select using (true);
create policy "Users can create issues" on public.issues
  for insert with check (auth.uid() = reported_by);
create policy "Authorities can update issues" on public.issues
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('authority', 'admin')
    )
  );

-- ISSUE IMAGES POLICIES
create policy "Issue images are viewable by everyone" on public.issue_images
  for select using (true);
create policy "Authenticated users can upload issue images" on public.issue_images
  for insert with check (auth.role() = 'authenticated');

-- ISSUE TIMELINE POLICIES
create policy "Issue timeline is viewable by everyone" on public.issue_timeline
  for select using (true);
create policy "Authorities can insert timeline events" on public.issue_timeline
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('authority', 'admin')
    )
  );
-- Citizens can also insert timeline events when they report
create policy "Citizens can insert initial timeline event" on public.issue_timeline
  for insert with check (auth.uid() = user_id);

-- ACTIVITY EVENTS POLICIES
create policy "Admins can view activity events" on public.activity_events
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
create policy "System can insert activity events" on public.activity_events
  for insert with check (true); -- Usually restricted to server-side only via Service Key, but we'll allow all inserts for now and enforce via backend.

-- Rpc for Duplicate Checking
create or replace function find_nearby_issues(
  lon double precision,
  lat double precision,
  radius_meters double precision
)
returns setof public.issues
language sql
as $$
  select *
  from public.issues
  where st_dwithin(
    location,
    st_setsrid(st_makepoint(lon, lat), 4326),
    radius_meters
  );
$$;

-- Rpc for Category Trends
create or replace function get_category_trends()
returns table(category text, count bigint)
language sql
as $$
  select category::text, count(*)
  from public.issues
  group by category
  order by count desc;
$$;
