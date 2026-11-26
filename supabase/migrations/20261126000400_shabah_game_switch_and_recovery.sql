begin;

create table shabah_private.room_game_snapshots (
  room_code text primary key references public.rooms(room_code) on delete cascade,
  event text not null,
  payload jsonb not null,
  sequence bigint not null
);
alter table shabah_private.room_game_snapshots enable row level security;
revoke all on shabah_private.room_game_snapshots from public, anon, authenticated;

create function shabah_private.keep_room_snapshot()
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
        when 'ai-judge' then 'JUDGE_STATE_SYNC'
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

create trigger shabah_keep_room_snapshot
after insert on shabah_private.room_commands
for each row execute function shabah_private.keep_room_snapshot();

create function public.read_shabah_room_snapshot(code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('event', s.event, 'payload', s.payload)
  from shabah_private.room_game_snapshots s
  join public.rooms r on r.room_code = s.room_code
  where s.room_code = $1 and r.status = 'playing';
$$;

create function public.change_shabah_room_game(code text, secret text, game text, sequence bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  result uuid;
begin
  if game is null or game not in ('ai-coach','ai-broker','ai-arabic','ai-judge','ai-guide','ai-flying')
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

revoke all on function public.read_shabah_room_snapshot(text) from public;
revoke all on function public.change_shabah_room_game(text,text,text,bigint) from public;
grant execute on function public.read_shabah_room_snapshot(text) to anon, authenticated;
grant execute on function public.change_shabah_room_game(text,text,text,bigint) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
