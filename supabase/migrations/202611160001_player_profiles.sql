-- Apply to a dedicated Supabase project after review; never the HEART game database.
begin;
create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 32),
  avatar_id text not null default 'yuki' check (avatar_id in ('yuki','hana','rei','mio')),
  language text not null default 'fr' check (language in ('fr','en','ja')),
  updated_at timestamptz not null default now()
);
alter table public.player_profiles enable row level security;
revoke all on public.player_profiles from anon, authenticated;
grant select, insert, update on public.player_profiles to authenticated;
create policy own_profile_read on public.player_profiles for select to authenticated using ((select auth.uid()) = id);
create policy own_profile_create on public.player_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy own_profile_update on public.player_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No public directory, email column or newsletter auto-enrolment.
commit;
