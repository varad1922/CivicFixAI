-- Create type for verification status
create type verification_status as enum ('pending', 'verified', 'rejected', 'suspended');

-- Add verification_status column to profiles
alter table public.profiles
add column verification_status verification_status default 'verified'::verification_status;

-- Make sure existing citizens are verified, but authorities might need checking
-- By default 'verified' is fine for citizens. For authorities, the backend handles it.
