-- Dedicated site project only. Synthetic accounts and delivery records roll back.
begin;
insert into auth.users(id,email,email_confirmed_at,last_sign_in_at) values
('d1700000-0000-4000-8000-000000000001','welcome-test@example.invalid',now(),now()),
('d1700000-0000-4000-8000-000000000002','unconfirmed@example.invalid',null,null);
set local role service_role;
do $$
declare claim jsonb; ok boolean;
begin
 if public.claim_welcome_email('d1700000-0000-4000-8000-000000000002') is not null then raise exception 'Unconfirmed account accepted'; end if;
 claim:=public.claim_welcome_email('d1700000-0000-4000-8000-000000000001');
 if claim is null then raise exception 'Verified account not claimed'; end if;
 if public.claim_welcome_email('d1700000-0000-4000-8000-000000000001') is not null then raise exception 'Duplicate reservation'; end if;
 ok:=public.finish_welcome_email('d1700000-0000-4000-8000-000000000001',gen_random_uuid(),'accepted');
 if ok then raise exception 'Wrong claim token accepted'; end if;
 ok:=public.finish_welcome_email('d1700000-0000-4000-8000-000000000001',(claim->>'claim_token')::uuid,'accepted','test-message');
 if not ok then raise exception 'Valid completion failed'; end if;
 if public.claim_welcome_email('d1700000-0000-4000-8000-000000000001') is not null then raise exception 'Accepted delivery repeated'; end if;
end $$;
set local role authenticated;
do $$ begin
 begin
  perform public.claim_welcome_email('d1700000-0000-4000-8000-000000000001');
  raise exception 'Authenticated caller can claim';
 exception when insufficient_privilege then null;
 end;
 begin
  perform 1 from public.player_welcome_emails;
  raise exception 'Authenticated caller can read deliveries';
 exception when insufficient_privilege then null;
 end;
end $$;
set local role anon;
do $$ begin
 begin
  perform public.claim_welcome_email('d1700000-0000-4000-8000-000000000001');
  raise exception 'Anonymous caller can claim';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select 'PASS: confirmed account, one claim, token ownership, no resend, no client access' as verification;
rollback;
