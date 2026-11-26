begin;
create extension if not exists pg_cron;

delete from public.rooms
where status = 'ended'
  and room_code in ('TBTN', '9V98', 'PGUY', 'UC9X', 'FRXU', 'E2LB', 'NR9A', 'ZRPL');

select cron.schedule('shabah-prune-ended-rooms', '23 3 * * *', $job$
  delete from public.rooms
  where status = 'ended' and updated_at < now() - interval '7 days';
$job$);

commit;
