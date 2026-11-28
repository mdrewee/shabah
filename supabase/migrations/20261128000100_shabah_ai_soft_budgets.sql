begin;

create table if not exists shabah_private.ai_account_requests (
  account_id text primary key,
  window_started_at timestamptz not null default now(),
  request_count bigint not null default 0
);
alter table shabah_private.ai_account_requests enable row level security;
revoke all on shabah_private.ai_account_requests from public, anon, authenticated;

create or replace function public.measure_shabah_ai_request(code text, secret text, account text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  account_key text;
  game_key text;
  room_count bigint;
  account_count bigint;
begin
  select r.host_id, r.game_id into account_key, game_key
  from public.rooms r join shabah_private.room_hosts h on h.room_code = r.room_code
  where r.room_code = code and r.status in ('lobby', 'playing')
    and h.secret_hash = sha256(convert_to(secret, 'UTF8'));
  if not found then return null; end if;

  insert into shabah_private.ai_requests (room_code, request_count) values (code, 1)
  on conflict (room_code) do update
  set window_started_at = case when ai_requests.window_started_at <= now() - interval '1 minute' then now() else ai_requests.window_started_at end,
      request_count = case when ai_requests.window_started_at <= now() - interval '1 minute' then 1 else ai_requests.request_count + 1 end
  returning request_count into room_count;

  insert into shabah_private.ai_account_requests (account_id, request_count)
  values (coalesce(nullif(account, ''), nullif(account_key, ''), code), 1)
  on conflict (account_id) do update
  set window_started_at = case when ai_account_requests.window_started_at <= now() - interval '1 minute' then now() else ai_account_requests.window_started_at end,
      request_count = case when ai_account_requests.window_started_at <= now() - interval '1 minute' then 1 else ai_account_requests.request_count + 1 end
  returning request_count into account_count;

  return jsonb_build_object('game', game_key, 'roomCount', room_count, 'accountCount', account_count);
end;
$$;

revoke all on function public.measure_shabah_ai_request(text,text,text) from public, anon, authenticated;
grant execute on function public.measure_shabah_ai_request(text,text,text) to service_role;

create or replace function public.reserve_shabah_ai_request(code text, secret text)
returns boolean language sql security definer set search_path = '' as $$
  select public.measure_shabah_ai_request(code, secret) is not null
$$;

notify pgrst, 'reload schema';
commit;
