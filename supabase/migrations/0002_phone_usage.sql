-- Separate append/update stream: Android never writes the personal snapshot.
create table public.phone_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi teléfono' check (length(name) between 1 and 100),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_sync_at timestamptz,
  revoked_at timestamptz
);
create index phone_devices_user_idx on public.phone_devices(user_id);
alter table public.phone_devices enable row level security;
revoke all on public.phone_devices from anon;
grant select, insert, update on public.phone_devices to authenticated;
create policy phone_devices_owner_select on public.phone_devices for select to authenticated using ((select auth.uid())=user_id);
create policy phone_devices_owner_insert on public.phone_devices for insert to authenticated with check ((select auth.uid())=user_id);
create policy phone_devices_owner_update on public.phone_devices for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table public.phone_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.phone_devices(id) on delete cascade,
  day date not null,
  timezone text not null check (length(timezone) between 1 and 80),
  complete boolean not null,
  observed_until timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  primary key (device_id,day)
);
create index phone_usage_user_day_idx on public.phone_usage_daily(user_id,day desc);
alter table public.phone_usage_daily enable row level security;
revoke all on public.phone_usage_daily from anon, authenticated;
grant select on public.phone_usage_daily to authenticated;
create policy phone_usage_owner_select on public.phone_usage_daily for select to authenticated using ((select auth.uid())=user_id);

create function public.ingest_phone_usage(p_token text,p_days jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  device public.phone_devices;
  row jsonb;
  p jsonb;
  app jsonb;
  value jsonb;
  captured timestamptz;
  day_value date;
  hours_total bigint;
  apps_total bigint;
  app_ids text[];
  saved integer=0;
  affected integer;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'Invalid device token' using errcode='28000';
  end if;
  select * into device from public.phone_devices
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and revoked_at is null for update;
  if device.id is null then raise exception 'Device is not linked' using errcode='28000'; end if;
  if p_days is null or jsonb_typeof(p_days)<>'array' then raise exception 'Invalid days'; end if;
  if jsonb_array_length(p_days) not between 1 and 31 or octet_length(p_days::text)>1000000 then raise exception 'Invalid batch size'; end if;
  for row in select * from jsonb_array_elements(p_days) loop
    day_value=(row->>'day')::date; captured=(row->>'observed_until')::timestamptz; p=row->'payload';
    if day_value is null or captured is null or day_value<current_date-733 or day_value>current_date+1
      or captured>now()+interval '5 minutes' or captured<day_value::timestamptz-interval '24 hours' or captured>day_value::timestamptz+interval '48 hours'
      or jsonb_typeof(row->'complete') is distinct from 'boolean'
      or length(coalesce(row->>'timezone','')) not between 1 and 80
      or not exists(select 1 from pg_catalog.pg_timezone_names where name=row->>'timezone')
      or ((row->>'complete')::boolean and day_value>=(now() at time zone (row->>'timezone'))::date)
      or jsonb_typeof(p) is distinct from 'object'
      or jsonb_typeof(p->'hours') is distinct from 'array'
      or jsonb_typeof(p->'apps') is distinct from 'array'
      or jsonb_typeof(p->'total') is distinct from 'number'
      or (p->>'total') !~ '^[0-9]+$' or (p->>'total')::bigint>90000000
      or jsonb_typeof(p->'sessions') is distinct from 'number'
      or (p->>'sessions') !~ '^[0-9]+$' or (p->>'sessions')::bigint>200000
      or (p->'notifications' is not null and p->'notifications'<>'null'::jsonb and (jsonb_typeof(p->'notifications')<>'number' or (p->>'notifications') !~ '^[0-9]+$' or (p->>'notifications')::bigint>200000))
      then raise exception 'Invalid day payload'; end if;
    if jsonb_array_length(p->'hours')<>24 or jsonb_array_length(p->'apps')>500 then raise exception 'Invalid detail'; end if;
    hours_total=0;
    for value in select * from jsonb_array_elements(p->'hours') loop
      if jsonb_typeof(value)<>'number' or value::text !~ '^[0-9]+$' or value::text::bigint>7200000 then raise exception 'Invalid hour'; end if;
      hours_total=hours_total+value::text::bigint;
    end loop;
    apps_total=0;app_ids=array[]::text[];
    for app in select * from jsonb_array_elements(p->'apps') loop
      if jsonb_typeof(app) is distinct from 'object' or length(coalesce(app->>'id','')) not between 1 and 200
       or length(coalesce(app->>'name','')) not between 1 and 200 or app->>'id'=any(app_ids)
       or jsonb_typeof(app->'ms') is distinct from 'number' or (app->>'ms') !~ '^[0-9]+$' or (app->>'ms')::bigint>90000000 then raise exception 'Invalid app'; end if;
      app_ids=array_append(app_ids,app->>'id');apps_total=apps_total+(app->>'ms')::bigint;
    end loop;
    if hours_total<>(p->>'total')::bigint or apps_total<>(p->>'total')::bigint then raise exception 'Inconsistent totals'; end if;
    insert into public.phone_usage_daily(user_id,device_id,day,timezone,complete,observed_until,payload)
    values(device.user_id,device.id,day_value,row->>'timezone',(row->>'complete')::boolean,captured,p)
    on conflict(device_id,day) do update set timezone=excluded.timezone,complete=excluded.complete,observed_until=excluded.observed_until,payload=excluded.payload,received_at=now()
    where excluded.observed_until>=phone_usage_daily.observed_until and (not phone_usage_daily.complete or excluded.complete);
    get diagnostics affected=row_count;saved=saved+affected;
  end loop;
  update public.phone_devices set last_sync_at=now() where id=device.id;
  return jsonb_build_object('saved',saved);
end;
$$;
revoke all on function public.ingest_phone_usage(text,jsonb) from public;
grant execute on function public.ingest_phone_usage(text,jsonb) to anon;
