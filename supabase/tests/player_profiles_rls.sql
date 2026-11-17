-- SQL Editor on the dedicated site project. All test users and profiles roll back.
begin;
insert into auth.users (id, email) values
 ('d1600000-0000-4000-8000-000000000001', 'rls-a@example.invalid'),
 ('d1600000-0000-4000-8000-000000000002', 'rls-b@example.invalid');
insert into public.player_profiles (id,display_name,avatar_id) values
 ('d1600000-0000-4000-8000-000000000001','Test A','yuki'),
 ('d1600000-0000-4000-8000-000000000002','Test B','hana');
set local role authenticated;
select set_config('request.jwt.claim.sub','d1600000-0000-4000-8000-000000000001',true);
do $$
declare affected integer;
begin
 if (select count(*) from public.player_profiles) <> 1 then
  raise exception 'RLS failure: reader can see another profile';
 end if;
 update public.player_profiles set avatar_id='mio' where id='d1600000-0000-4000-8000-000000000001';
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'RLS failure: own update blocked'; end if;
 update public.player_profiles set avatar_id='rei' where id='d1600000-0000-4000-8000-000000000002';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'RLS failure: another profile was changed'; end if;
 begin
  insert into public.player_profiles (id,display_name) values ('d1600000-0000-4000-8000-000000000002','Illegal');
  raise exception 'RLS failure: foreign insert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
set local role anon;
do $$ begin
 begin
  perform 1 from public.player_profiles;
  raise exception 'RLS failure: anonymous SELECT permitted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select 'PASS: own profile only; foreign read/write and anonymous access blocked' as verification;
rollback;
