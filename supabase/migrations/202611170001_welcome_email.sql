-- One welcome delivery per verified account; no newsletter membership is created.
begin;
create table public.player_welcome_emails (
 user_id uuid primary key references auth.users(id) on delete cascade,
 delivery_id uuid not null unique default gen_random_uuid(),
 state text not null default 'queued' check (state in ('queued','sending','accepted','failed','review')),
 created_at timestamptz not null default now(),
 locked_at timestamptz,
 claim_token uuid,
 attempts integer not null default 0 check (attempts between 0 and 3),
 next_attempt_at timestamptz not null default now(),
 accepted_at timestamptz,
 provider_message_id text,
 error_code text
);
alter table public.player_welcome_emails enable row level security;
revoke all on public.player_welcome_emails from public, anon, authenticated;
grant select,insert,update on public.player_welcome_emails to service_role;
create function public.claim_welcome_email(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare delivery public.player_welcome_emails;
begin
 if not exists (select 1 from auth.users where id=p_user_id and email_confirmed_at is not null and last_sign_in_at is not null) then
  return null;
 end if;
 update public.player_welcome_emails set state='review', error_code='worker_interrupted'
 where user_id=p_user_id and state='sending' and locked_at < now()-interval '10 minutes';
 insert into public.player_welcome_emails(user_id) values(p_user_id) on conflict do nothing;
 update public.player_welcome_emails set state='sending',locked_at=now(),claim_token=gen_random_uuid(),attempts=attempts+1
 where user_id=p_user_id and state='queued' and next_attempt_at<=now() and attempts<3
 returning * into delivery;
 if not found then return null; end if;
 return jsonb_build_object('delivery_id',delivery.delivery_id,'claim_token',delivery.claim_token);
end $$;
create function public.finish_welcome_email(p_user_id uuid,p_claim_token uuid,p_state text,p_message_id text default null,p_error_code text default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_state not in ('accepted','failed','review','queued') then raise exception 'Invalid delivery state'; end if;
 update public.player_welcome_emails set state=case when p_state='queued' and attempts>=3 then 'failed' else p_state end,
 accepted_at=case when p_state='accepted' then now() else accepted_at end,
 provider_message_id=left(p_message_id,240),error_code=left(p_error_code,64),
 next_attempt_at=case when p_state='queued' then now()+interval '5 minutes' else next_attempt_at end
 where user_id=p_user_id and state='sending' and claim_token=p_claim_token;
 return found;
end $$;
revoke all on function public.claim_welcome_email(uuid) from public,anon,authenticated;
revoke all on function public.finish_welcome_email(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_welcome_email(uuid) to service_role;
grant execute on function public.finish_welcome_email(uuid,uuid,text,text,text) to service_role;
commit;
