begin;

create or replace function public.create_shabah_room(code text, game text, player text, secret text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if code is null or code !~ '^[A-HJ-NP-Z2-9]{4}$'
    or game is null or game not in ('ai-coach', 'ai-broker', 'ai-arabic', 'ai-guide', 'ai-flying')
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

create or replace function public.issue_shabah_room_command(code text, secret text, command text, body jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  command_id uuid;
begin
  if command is null or command not in ('GAME_STARTED', 'ROOM_TERMINATED', 'FORCE_PLAYER_KICK',
      'RETURN_TO_LOBBY', 'AI_RESPONSE', 'COACH_STATE_SYNC', 'BROKER_STATE_SYNC',
      'ARABIC_STATE_SYNC', 'GUIDE_STATE_SYNC', 'FLYING_STATE_SYNC',
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

create or replace function public.change_shabah_room_game(code text, secret text, game text, sequence bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  result uuid;
begin
  if game is null or game not in ('ai-coach','ai-broker','ai-arabic','ai-guide','ai-flying')
    or secret is null or secret !~ '^[a-f0-9]{64}$' or sequence is null or sequence < 1 then
    return null;
  end if;

  update public.rooms r set game_id = game, updated_at = now()
  from shabah_private.room_hosts h
  where r.room_code = code and r.room_code = h.room_code and r.status = 'lobby'
    and r.game_id <> game and h.secret_hash = sha256(convert_to(secret, 'UTF8'));
  if not found then return null; end if;

  insert into shabah_private.room_commands(room_code, event, payload)
  values (code, 'SHABAH_GAME_CHANGED', jsonb_build_object('gameId', game, '_hostSequence', sequence))
  returning id into result;
  return result;
end;
$$;

create or replace function shabah_private.keep_room_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.event in ('RETURN_TO_LOBBY', 'ROOM_TERMINATED', 'SHABAH_GAME_CHANGED') then
    delete from shabah_private.room_game_snapshots where room_code = new.room_code;
  elsif exists (
    select 1 from public.rooms r
    where r.room_code = new.room_code and r.status = 'playing'
      and new.event = case r.game_id
        when 'ai-coach' then 'COACH_STATE_SYNC'
        when 'ai-broker' then 'BROKER_STATE_SYNC'
        when 'ai-arabic' then 'ARABIC_STATE_SYNC'
        when 'ai-guide' then 'GUIDE_STATE_SYNC'
        when 'ai-flying' then 'FLYING_STATE_SYNC'
      end
  ) and new.payload ->> '_hostSequence' ~ '^[0-9]{1,16}$' then
    insert into shabah_private.room_game_snapshots (room_code, event, payload, sequence)
    values (new.room_code, new.event, new.payload, (new.payload ->> '_hostSequence')::bigint)
    on conflict (room_code) do update
      set event = excluded.event, payload = excluded.payload, sequence = excluded.sequence
      where excluded.sequence > room_game_snapshots.sequence;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
commit;
