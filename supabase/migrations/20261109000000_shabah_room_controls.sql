begin;

alter table public.rooms enable row level security;
revoke insert, update, delete on public.rooms from public, anon, authenticated;
grant select on public.rooms to anon, authenticated;
create policy shabah_room_lookup on public.rooms for select to anon, authenticated
  using (status in ('lobby', 'playing'));

create schema if not exists shabah_private;
revoke all on schema shabah_private from public, anon, authenticated;

create table shabah_private.room_hosts (
  room_code text primary key,
  secret_hash bytea not null
);

create table shabah_private.room_commands (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  event text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index shabah_room_commands_by_room on shabah_private.room_commands (room_code, created_at);

create function public.create_shabah_room(code text, game text, player text, secret text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if code is null or code !~ '^[A-HJ-NP-Z2-9]{4}$'
    or game is null or game not in ('ai-judge', 'ai-coach', 'ai-broker', 'ai-arabic', 'ai-guide', 'ai-flying')
    or player is null or player !~ '^[A-Za-z0-9_-]{1,64}$'
    or secret is null or secret !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid room parameters' using errcode = '22023';
  end if;

  insert into public.rooms (room_code, game_id, host_id, status, created_at, updated_at)
  values (code, game, player, 'lobby', now(), now())
  on conflict (room_code) do nothing;
  if not found then return false; end if;

  insert into shabah_private.room_hosts (room_code, secret_hash)
  values (code, sha256(convert_to(secret, 'UTF8')));
  return true;
end;
$$;

create function public.issue_shabah_room_command(code text, secret text, command text, body jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  command_id uuid;
begin
  if command is null or command not in ('GAME_STARTED', 'ROOM_TERMINATED', 'FORCE_PLAYER_KICK')
    or jsonb_typeof(body) is distinct from 'object' or pg_column_size(body) > 65536
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

create function public.read_shabah_room_command(code text, command_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('event', c.event, 'payload', c.payload)
  from shabah_private.room_commands c
  where c.room_code = code and c.id = command_id
    and c.created_at >= now() - interval '1 minute';
$$;

revoke all on function public.create_shabah_room(text, text, text, text) from public;
revoke all on function public.issue_shabah_room_command(text, text, text, jsonb) from public;
revoke all on function public.read_shabah_room_command(text, uuid) from public;
grant execute on function public.create_shabah_room(text, text, text, text) to anon, authenticated;
grant execute on function public.issue_shabah_room_command(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.read_shabah_room_command(text, uuid) to anon, authenticated;

commit;
