begin;

alter table shabah_private.room_hosts enable row level security;
alter table shabah_private.room_commands enable row level security;

create or replace function public.issue_shabah_room_command(code text, secret text, command text, body jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  command_id uuid;
begin
  if command is null or command not in ('GAME_STARTED', 'ROOM_TERMINATED', 'FORCE_PLAYER_KICK',
      'RETURN_TO_LOBBY', 'AI_RESPONSE', 'COACH_STATE_SYNC', 'BROKER_STATE_SYNC',
      'ARABIC_STATE_SYNC', 'JUDGE_STATE_SYNC', 'GUIDE_STATE_SYNC', 'FLYING_STATE_SYNC',
      'JUDGE_NEW_ROUND', 'JUDGE_START_DEFENSE', 'JUDGE_RESULTS_READY', 'JUDGE_TIME_UP',
      'BROKER_NEW_ROUND', 'BROKER_ITEM_SYNC', 'COACH_MODE_SELECTED',
      'PLAYER_CLAIM_SUCCESS', 'CLAIM_PLAYER_REJECTED', 'BINGO_PLAYER_SELECTED',
      'ARABIC_TIME_UP', 'ARABIC_RESULTS_READY', 'ARABIC_OBJECTION_RESOLVED',
      'FLYING_NEW_ROUND', 'FLYING_ROUND_RESULTS', 'FLYING_RESULTS_READY', 'FLYING_GAME_OVER')
    or jsonb_typeof(body) is distinct from 'object' or pg_column_size(body) > 524288
    or (command = 'FORCE_PLAYER_KICK' and
      (jsonb_typeof(body->'targetPlayerId') is distinct from 'string' or
        length(body->>'targetPlayerId') not between 1 and 64))
    or secret is null or secret !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid room command' using errcode = '22023';
  end if;

  perform 1 from public.rooms r
  join shabah_private.room_hosts h on h.room_code = r.room_code
  where r.room_code = code and r.status in ('lobby', 'playing')
    and h.secret_hash = sha256(convert_to(secret, 'UTF8'))
  for update of r;
  if not found then raise exception 'Room command denied' using errcode = '42501'; end if;

  if command = 'ROOM_TERMINATED' then
    update public.rooms set status = 'ended', updated_at = now() where room_code = code;
    delete from shabah_private.room_hosts where room_code = code;
  elsif command = 'RETURN_TO_LOBBY' then
    update public.rooms set status = 'lobby', updated_at = now() where room_code = code;
  elsif command = 'GAME_STARTED' then
    update public.rooms set status = 'playing', updated_at = now() where room_code = code;
  end if;

  delete from shabah_private.room_commands
  where room_code = code and created_at < now() - interval '1 minute';
  insert into shabah_private.room_commands (room_code, event, payload)
  values (code, command, body) returning id into command_id;
  return command_id;
end;
$$;


create table shabah_private.ai_requests (
  room_code text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);
alter table shabah_private.ai_requests enable row level security;

create function public.reserve_shabah_ai_request(code text, secret text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from shabah_private.room_hosts h join public.rooms r on r.room_code = h.room_code
  where h.room_code = code and r.status in ('lobby', 'playing')
    and h.secret_hash = sha256(convert_to(secret, 'UTF8'));
  if not found then return false; end if;

  insert into shabah_private.ai_requests (room_code, request_count) values (code, 1)
  on conflict (room_code) do update
  set window_started_at = case when ai_requests.window_started_at < now() - interval '1 minute' then now() else ai_requests.window_started_at end,
      request_count = case when ai_requests.window_started_at < now() - interval '1 minute' then 1 else ai_requests.request_count + 1 end
  where ai_requests.window_started_at < now() - interval '1 minute' or ai_requests.request_count < 30;
  return found;
end;
$$;
revoke all on function public.reserve_shabah_ai_request(text, text) from public, anon, authenticated;
grant execute on function public.reserve_shabah_ai_request(text, text) to service_role;
notify pgrst, 'reload schema';
commit;
