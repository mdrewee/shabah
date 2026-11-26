begin;

create function public.lookup_shabah_room(code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.game_id::text
  from public.rooms as r
  where $1 ~ '^[A-HJ-NP-Z2-9]{4}$'
    and r.room_code = $1
    and r.status in ('lobby', 'playing')
  limit 1
$$;

revoke all on function public.lookup_shabah_room(text) from public;
grant execute on function public.lookup_shabah_room(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
