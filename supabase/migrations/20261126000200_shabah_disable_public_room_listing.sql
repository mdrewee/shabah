-- Apply after the website uses lookup_shabah_room.
begin;
drop policy if exists shabah_room_lookup on public.rooms;
revoke select on public.rooms from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
