-- Add geo coordinates to profiles so vakmensen can be filtered by location
alter table public.profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Index for spatial queries (bbox filter before haversine)
create index if not exists profiles_lat_lng_idx on public.profiles (lat, lng)
  where lat is not null and lng is not null;

-- Also add uurtarief to vakmensen if missing (used in search page)
alter table public.vakmensen
  add column if not exists uurtarief int,
  add column if not exists gemiddelde_rating numeric(3,1);
