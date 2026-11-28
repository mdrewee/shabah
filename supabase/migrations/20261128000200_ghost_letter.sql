begin;

create table if not exists shabah_private.ghost_letter_games (
  room_code text primary key references public.rooms(room_code) on delete cascade,
  board jsonb not null,
  prompts jsonb,
  version bigint not null default 0
);
create table if not exists shabah_private.ghost_letter_players (
  room_code text not null references public.rooms(room_code) on delete cascade,
  player_id text not null,
  display_name text not null,
  device_hash bytea not null,
  seen_at timestamptz not null,
  primary key (room_code, player_id)
);
create table if not exists shabah_private.ghost_letter_history (
  owner_key text primary key,
  used_ids text[] not null default '{}'
);
alter table shabah_private.ghost_letter_games enable row level security;
alter table shabah_private.ghost_letter_players enable row level security;
alter table shabah_private.ghost_letter_history enable row level security;

create or replace function public.read_ghost_letter(code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select g.board || jsonb_build_object('version', g.version, 'serverNow',
    floor(extract(epoch from statement_timestamp()) * 1000)::bigint)
  from shabah_private.ghost_letter_games g
  join public.rooms r on r.room_code = g.room_code
  where g.room_code = upper($1) and r.game_id = 'ai-arabic';
$$;

create or replace function shabah_private.next_ghost_letter_question(owner text, bank jsonb, in_match text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  seen_ids text[];
  pick jsonb;
begin
  insert into shabah_private.ghost_letter_history(owner_key) values (owner) on conflict do nothing;
  select h.used_ids into seen_ids from shabah_private.ghost_letter_history h where h.owner_key = owner for update;
  select q into pick from jsonb_array_elements(bank) q
    where not ((q->>'id') = any(seen_ids) or (q->>'id') = any(in_match)) order by random() limit 1;
  if not found then
    seen_ids := '{}';
    select q into pick from jsonb_array_elements(bank) q
      where not ((q->>'id') = any(in_match)) order by random() limit 1;
  end if;
  update shabah_private.ghost_letter_history h set used_ids = array_append(seen_ids, pick->>'id') where h.owner_key = owner;
  return pick;
end;
$$;

create or replace function public.play_ghost_letter(code text, player text, device text, action text, body jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  room public.rooms%rowtype;
  stamp timestamptz := clock_timestamp();
  ms bigint := floor(extract(epoch from stamp) * 1000);
  device_key bytea;
  original_host boolean;
  match shabah_private.ghost_letter_games%rowtype;
  board jsonb;
  roster jsonb;
  anchor text;
  actor text;
  target text;
  next_player text;
  current_letter text;
  correct boolean;
  last_alive text;
  event_name text;
  event_player text;
  seen timestamptz;
  account_key text;
  question jsonb;
  question_bank jsonb;
  round_no integer;
  round_seconds integer;
begin
  if code is null or code !~ '^[A-HJ-NP-Z2-9]{4}$'
    or player is null or player !~ '^[A-Za-z0-9_-]{1,64}$'
    or device is null or device !~ '^[0-9a-f]{64}$'
    or jsonb_typeof(body) is distinct from 'object' or pg_column_size(body) > 175000 then
    raise exception 'Invalid letter action' using errcode = '22023';
  end if;
  device_key := sha256(convert_to(device, 'UTF8'));

  if action = 'register' then
    if length(trim(coalesce(body->>'name',''))) not between 1 and 18 then return null; end if;
    insert into shabah_private.ghost_letter_players(room_code,player_id,display_name,device_hash,seen_at)
      select code, player, trim(body->>'name'), device_key, stamp
      from public.rooms r where r.room_code = code and r.game_id = 'ai-arabic' and r.status = 'lobby'
      on conflict (room_code,player_id) do update set seen_at = excluded.seen_at, display_name = excluded.display_name
      where ghost_letter_players.device_hash = excluded.device_hash;
    return public.read_ghost_letter(code);
  end if;

  select r.* into room from public.rooms r where r.room_code = code
    and r.game_id = 'ai-arabic' and r.status in ('lobby','playing') for update;
  if not found then return null; end if;
  stamp := clock_timestamp();
  ms := floor(extract(epoch from stamp) * 1000);
  update shabah_private.ghost_letter_players p set seen_at = stamp
    where p.room_code = code and p.player_id = player and p.device_hash = device_key;
  if not found then raise exception 'Player credential denied' using errcode = '42501'; end if;
  original_host := player = room.host_id and exists (
    select from shabah_private.room_hosts h where h.room_code = code
      and h.secret_hash = sha256(convert_to(body->>'hostSecret', 'UTF8'))
  );
  select * into match from shabah_private.ghost_letter_games g where g.room_code = code;
  board := coalesce(match.board, '{"phase":"lobby","mode":"classic","duration":8}'::jsonb);
  round_seconds := (board->>'duration')::integer;

  if action = 'configure' then
    if not original_host or room.status <> 'lobby' or coalesce(body->>'mode','') not in ('classic','letter')
       or coalesce(body->>'duration','') not in ('5','8','12') then return public.read_ghost_letter(code); end if;
    if board->>'mode' = body->>'mode' and board->>'duration' = body->>'duration' then return public.read_ghost_letter(code); end if;
    board := jsonb_build_object('phase','lobby','mode',body->>'mode','duration',(body->>'duration')::int);
  elsif action = 'start' then
    if not original_host or room.status <> 'lobby' or board->>'mode' <> 'letter'
      or jsonb_typeof(body->'roster') is distinct from 'array' or jsonb_array_length(body->'roster') not between 2 and 10
      or not (body->'roster' ? player) then
      raise exception 'Letter start denied' using errcode = '22023';
    end if;
    select jsonb_agg(jsonb_build_object('id', p.player_id, 'name', p.display_name, 'score', 0, 'alive', true)
      order by (p.player_id <> player), p.seen_at, p.player_id)
      into roster from shabah_private.ghost_letter_players p
      where p.room_code = code and body->'roster' ? p.player_id;
    if jsonb_array_length(coalesce(roster,'[]')) <> jsonb_array_length(body->'roster') then
      raise exception 'Letter players not ready' using errcode = '22023';
    end if;
    question_bank := body->'questions';
    if jsonb_typeof(question_bank) is distinct from 'array' or jsonb_array_length(question_bank) not between 400 and 700 then
      raise exception 'Invalid question bank' using errcode = '22023';
    end if;
    if (select count(distinct q->>'id') from jsonb_array_elements(question_bank) q
        where q->>'id' ~ '^[a-z0-9-]{2,40}$' and length(q->>'text') between 8 and 160) <> jsonb_array_length(question_bank) then
      raise exception 'Invalid questions' using errcode = '22023';
    end if;
    -- A signed-in owner shares history across devices; guests use a durable device key.
    account_key := case when auth.uid() is not null and (auth.jwt()->>'is_anonymous') is distinct from 'true'
      then 'account:' || auth.uid()::text else 'device:' || encode(device_key, 'hex') end;
    question := shabah_private.next_ghost_letter_question(account_key, question_bank, '{}');
    match.prompts := jsonb_build_object('owner',account_key,'bank',question_bank,'picked',jsonb_build_array(question->>'id'));
    board := board || jsonb_build_object('phase','turn','round',1,'players',roster,'judge',player,'turn',player,
      'serial',1,'question',question->>'text','used',jsonb_build_array(),'letter',null,'paused',null,
      'endsAt',ms + round_seconds * 1000, 'event',null);
    update public.rooms set status = 'playing', updated_at = stamp where room_code = code;
  elsif action = 'lobby' then
    if not original_host or room.status <> 'playing' or board->>'phase' = 'lobby' then return public.read_ghost_letter(code); end if;
    board := jsonb_build_object('phase','lobby','mode','letter','duration',round_seconds);
    match.prompts := null;
    update public.rooms set status = 'lobby', updated_at = stamp where room_code = code;
  elsif room.status = 'playing' and board->>'phase' in ('turn','between') then
    roster := board->'players';
    if not exists (select from jsonb_array_elements(roster) p where p->>'id' = player) then return public.read_ghost_letter(code); end if;
    actor := board->>'turn';
    if action = 'tick' then
      select p.seen_at into seen from shabah_private.ghost_letter_players p
        where p.room_code = code and p.player_id = board->>'judge';
      if seen <= stamp - interval '30 seconds' then
        select p->>'id' into target
        from jsonb_array_elements(roster) with ordinality a(p,n)
        join shabah_private.ghost_letter_players l on l.room_code = code and l.player_id = p->>'id'
        where (p->>'alive')::boolean and l.seen_at > stamp - interval '12 seconds' order by n limit 1;
        -- A sole connected spectator can keep automatic turns progressing.
        if target is not null then
          board := board || jsonb_build_object('judge',target);
          if board->>'paused' is not null then
            board := board || jsonb_build_object('endsAt',ms + (board->>'paused')::bigint,'paused',null);
          end if;
        elsif board->>'paused' is not null then
          board := board || jsonb_build_object('endsAt',ms + (board->>'paused')::bigint,'paused',null);
        end if;
      end if;
      if board->>'phase' = 'between' and (board->>'endsAt')::bigint <= ms then
        round_no := (board->>'round')::int + 1;
        question := shabah_private.next_ghost_letter_question(match.prompts->>'owner',match.prompts->'bank',
          array(select jsonb_array_elements_text(match.prompts->'picked')));
        match.prompts := jsonb_set(match.prompts,'{picked}',(match.prompts->'picked') || to_jsonb(question->>'id'));
        select jsonb_agg(p || '{"alive":true}'::jsonb order by n) into roster from jsonb_array_elements(roster) with ordinality a(p,n);
        select p->>'id' into target from jsonb_array_elements(roster) with ordinality a(p,n)
          join shabah_private.ghost_letter_players l on l.room_code = code and l.player_id = p->>'id'
          order by (l.seen_at <= stamp - interval '12 seconds'), mod(n - round_no + jsonb_array_length(roster),jsonb_array_length(roster)) limit 1;
        board := board || jsonb_build_object('round',round_no,'phase','turn','players',roster,'turn',target,
          'serial',(board->>'serial')::int + 1,'question',question->>'text',
          'used',jsonb_build_array(),'letter',null,'paused',null,'endsAt',ms + round_seconds * 1000,'event',null);
      elsif board->>'phase' = 'turn' and board->>'paused' is null then
        select p.seen_at into seen from shabah_private.ghost_letter_players p
          where p.room_code = code and p.player_id = actor;
        if (board->>'endsAt')::bigint <= ms then
          if board->>'letter' is not null then
            event_name := 'correct';
          elsif seen <= stamp - interval '8 seconds' then
            event_name := 'skip';
          elsif seen > stamp - interval '5 seconds' then
            event_name := 'wrong';
          end if;
          event_player := actor;
        end if;
      end if;
    elsif board->>'phase' = 'turn' and body->>'serial' = board->>'serial' then
      current_letter := board->>'letter';
      if action = 'letter' and player = actor and current_letter is null and (board->>'endsAt')::bigint > ms
        and length(body->>'letter') = 1 and body->>'letter' ~ '^[ابتثجحخدذرزسشصضطظعغفقكلمنهوي]$'
        and not (board->'used' ? (body->>'letter')) then
        board := board || jsonb_build_object('letter',body->>'letter');
      elsif player = board->>'judge' then
        if action in ('correct','wrong','pause') and body->>'letter' = current_letter
          and (board->>'paused' is not null or (board->>'endsAt')::bigint > ms) then
          if action = 'pause' then
            board := case when board->>'paused' is null then board || jsonb_build_object('paused',greatest(1,(board->>'endsAt')::bigint-ms),'endsAt',null)
              else board || jsonb_build_object('endsAt',ms+(board->>'paused')::bigint,'paused',null) end;
          else
            event_name := action;
            event_player := actor;
          end if;
        elsif action in ('lose','restore') and exists (select from jsonb_array_elements(roster) p where p->>'id' = body->>'target') then
          event_player := body->>'target';
          if action = 'lose' then
            if exists (select from jsonb_array_elements(roster) p where p->>'id' = event_player and (p->>'alive')::boolean) then
              event_name := 'wrong';
            end if;
          else
            -- Reopen the edited player's most recent accepted letter when correcting the immediately preceding ruling.
            if board->'event'->>'player' = event_player and board->'event'->>'kind' = 'correct' then
              board := jsonb_set(board, '{used}', (board->'used') - (board->'event'->>'letter'));
            end if;
            select jsonb_agg(p || case when p->>'id' = event_player then '{"alive":true}'::jsonb else '{}'::jsonb end order by n)
              into roster from jsonb_array_elements(roster) with ordinality a(p,n);
            board := board || jsonb_build_object('players',roster,'turn',event_player,'serial',(board->>'serial')::int+1,
              'endsAt',ms+round_seconds*1000,'paused',null,'letter',null,'event',null);
          end if;
        end if;
      end if;
    end if;

    if event_name is not null then
      correct := event_name = 'correct';
      current_letter := case when event_player = actor then board->>'letter' end;
      if correct then
        board := jsonb_set(board,'{used}',(board->'used') || to_jsonb(current_letter));
      elsif event_name = 'wrong' then
        select jsonb_agg(p || case when p->>'id' = event_player then '{"alive":false}'::jsonb else '{}'::jsonb end order by n)
          into roster from jsonb_array_elements(roster) with ordinality a(p,n);
      end if;
      board := board || jsonb_build_object('players',roster,'event',jsonb_build_object(
        'kind',event_name,'player',event_player,'letter',current_letter,'at',ms,'serial',board->'serial'));
      if (select count(*) from jsonb_array_elements(roster) p where (p->>'alive')::boolean) = 1 then
        select p->>'id' into last_alive from jsonb_array_elements(roster) p where (p->>'alive')::boolean;
        select jsonb_agg(p || jsonb_build_object('score',(p->>'score')::int + case p->>'id'
          when last_alive then 2 when event_player then 1 else 0 end) order by n)
          into roster from jsonb_array_elements(roster) with ordinality a(p,n);
        board := board || jsonb_build_object('players',roster,'winner',last_alive,'turn',null,'letter',null,'paused',null,
          'phase',case when board->>'round' = '3' then 'final' else 'between' end,'endsAt',ms+4500);
      elsif event_player = actor then
        select n::text into anchor from jsonb_array_elements(roster) with ordinality a(p,n) where p->>'id' = actor;
        select p->>'id' into next_player from jsonb_array_elements(roster) with ordinality a(p,n)
          join shabah_private.ghost_letter_players l on l.room_code=code and l.player_id=p->>'id'
          where (p->>'alive')::boolean
          order by (l.seen_at <= stamp - interval '8 seconds'),
            mod(n-anchor::bigint+jsonb_array_length(roster)-1,jsonb_array_length(roster)) limit 1;
        board := board || jsonb_build_object('turn',next_player,'serial',(board->>'serial')::int+1,'letter',null,
          'paused',null,'endsAt',ms+round_seconds*1000);
      end if;
    end if;
  end if;

  if board is distinct from match.board and (match.room_code is not null or action in ('configure','start')) then
    insert into shabah_private.ghost_letter_games(room_code,board,prompts,version)
    values (code,board,match.prompts,1) on conflict (room_code) do update
      set board = excluded.board, prompts = excluded.prompts, version = ghost_letter_games.version + 1
      returning version into match.version;
    perform realtime.send(jsonb_build_object('version',match.version), 'letter_state', 'shabah-letter:' || code, false);
  end if;
  return public.read_ghost_letter(code);
end;
$$;

create or replace function shabah_private.clear_ghost_letter_on_room_exit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update shabah_private.ghost_letter_games
    set board = case when new.status = 'ended' then '{"phase":"ended"}'::jsonb
        else '{"phase":"lobby","mode":"classic","duration":8}'::jsonb end,
      prompts = null, version = version + 1
    where room_code = new.room_code;
  if found then
    perform realtime.send('{}'::jsonb, 'letter_state', 'shabah-letter:' || new.room_code, false);
  end if;
  return new;
end;
$$;
create or replace trigger shabah_ghost_letter_room_exit after update of status,game_id on public.rooms
  for each row when (old.game_id = 'ai-arabic' and
    (new.status = 'ended' or new.game_id is distinct from old.game_id))
  execute function shabah_private.clear_ghost_letter_on_room_exit();

revoke all on function public.read_ghost_letter(text), public.play_ghost_letter(text,text,text,text,jsonb) from public;
grant execute on function public.read_ghost_letter(text), public.play_ghost_letter(text,text,text,text,jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
