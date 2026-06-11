-- ═══════════════════════════════════════════════════════════
--  SERVR — E2E flow migratie (11 juni 2026)
--  Plak dit in: Supabase dashboard → SQL Editor → Run
--  Volledig idempotent — veilig om opnieuw te draaien.
--
--  Maakt de volledige klant↔vakman flow mogelijk:
--  opdracht → offerte → accept → betaling → incheck → afgerond
--  → bevestigd → uitbetaald → review (beide kanten)
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. OPDRACHTEN (bestaat al live — create if not exists als vangnet)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.opdrachten (
  id            uuid default uuid_generate_v4() primary key,
  klant_id      uuid references public.profiles(id) on delete cascade not null,
  titel         text not null,
  beschrijving  text,
  categorie     text,
  adres         text,
  urgentie      text default 'middel',
  budget        text,
  status        text default 'open',
  lat           double precision,
  lng           double precision,
  foto_url      text,
  created_at    timestamptz default now()
);

alter table public.opdrachten add column if not exists foto_url text;

-- ─────────────────────────────────────────────────────────────
-- 2. OFFERTES (bestaat al live)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.offertes (
  id            uuid default uuid_generate_v4() primary key,
  opdracht_id   uuid references public.opdrachten(id) on delete cascade,
  vakman_id     uuid references public.profiles(id) on delete cascade not null,
  prijs         numeric not null,            -- in euro's
  omschrijving  text,
  eta           text,
  status        text default 'wachtend',     -- wachtend | geaccepteerd | geweigerd | ingetrokken
  gesprek_id    uuid references public.gesprekken(id),
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. NOTIFICATIES (bestaat al live)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notificaties (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null,
  titel         text not null,
  bericht       text,
  link          text,
  gelezen       boolean default false,
  created_at    timestamptz default now()
);

alter table public.notificaties add column if not exists link text;

-- ─────────────────────────────────────────────────────────────
-- 4. BOEKINGEN — kolommen + statussen voor de volledige flow
--    Statusmachine: gepland → ingecheckt → afgerond → bevestigd → uitbetaald
--    Zijpaden: geannuleerd, geschil ('bezig' blijft geldig voor oude rijen)
-- ─────────────────────────────────────────────────────────────
alter table public.boekingen add column if not exists opdracht_id    uuid references public.opdrachten(id);
alter table public.boekingen add column if not exists offerte_id     uuid references public.offertes(id);
alter table public.boekingen add column if not exists ingecheckt_at  timestamptz;
alter table public.boekingen add column if not exists afgerond_at    timestamptz;
alter table public.boekingen add column if not exists bevestigd_at   timestamptz;
alter table public.boekingen add column if not exists uitbetaald_at  timestamptz;
alter table public.boekingen add column if not exists transfer_id    text;

-- FK's expliciet (kolommen kunnen al bestaan zonder FK — joins via PostgREST vereisen ze)
do $$ begin
  alter table public.opdrachten add constraint opdrachten_klant_id_fkey
    foreign key (klant_id) references public.profiles(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.offertes add constraint offertes_vakman_id_fkey
    foreign key (vakman_id) references public.profiles(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.offertes add constraint offertes_opdracht_id_fkey
    foreign key (opdracht_id) references public.opdrachten(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.boekingen add constraint boekingen_opdracht_id_fkey
    foreign key (opdracht_id) references public.opdrachten(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.boekingen add constraint boekingen_offerte_id_fkey
    foreign key (offerte_id) references public.offertes(id);
exception when duplicate_object then null; end $$;

alter table public.boekingen drop constraint if exists boekingen_status_check;
alter table public.boekingen add constraint boekingen_status_check
  check (status in ('gepland','bezig','ingecheckt','afgerond','bevestigd','uitbetaald','geannuleerd','geschil'));

-- ─────────────────────────────────────────────────────────────
-- 5. REVIEWS — beide kanten kunnen reviewen (klant ↔ vakman)
-- ─────────────────────────────────────────────────────────────
alter table public.reviews add column if not exists reviewer_rol text default 'klant'
  check (reviewer_rol in ('klant','vakman'));

-- unique(boeking_id) → unique(boeking_id, reviewer_rol)
alter table public.reviews drop constraint if exists reviews_boeking_id_key;
do $$ begin
  alter table public.reviews add constraint reviews_boeking_rol_key unique (boeking_id, reviewer_rol);
exception when duplicate_table then null; when duplicate_object then null; end $$;

-- Schrijf-policy vervangen: klant reviewt vakman, vakman reviewt klant,
-- alleen na afronding (afgerond of later)
drop policy if exists "Review schrijven" on public.reviews;
create policy "Review schrijven"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.boekingen b
      where b.id = boeking_id
      and b.status in ('afgerond','bevestigd','uitbetaald')
      and (
        (reviewer_rol = 'klant'  and auth.uid() = b.klant_id  and auth.uid() = klant_id)
        or
        (reviewer_rol = 'vakman' and auth.uid() = b.vakman_id and auth.uid() = vakman_id)
      )
    )
  );

-- Rating-trigger: alleen klant→vakman reviews tellen mee voor vakman-rating
create or replace function public.update_vakman_rating()
returns trigger language plpgsql as $$
begin
  if new.reviewer_rol = 'klant' then
    update public.vakmensen
    set
      rating       = (select round(avg(score)::numeric, 1) from public.reviews where vakman_id = new.vakman_id and reviewer_rol = 'klant'),
      review_count = (select count(*) from public.reviews where vakman_id = new.vakman_id and reviewer_rol = 'klant')
    where id = new.vakman_id;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — opdrachten / offertes / notificaties
-- ─────────────────────────────────────────────────────────────
alter table public.opdrachten   enable row level security;
alter table public.offertes     enable row level security;
alter table public.notificaties enable row level security;

drop policy if exists "Opdrachten lezen" on public.opdrachten;
create policy "Opdrachten lezen"
  on public.opdrachten for select
  using (status = 'open' or status = 'offerte_ontvangen' or auth.uid() = klant_id
         or exists (select 1 from public.offertes o where o.opdracht_id = id and o.vakman_id = auth.uid()));

drop policy if exists "Opdracht aanmaken" on public.opdrachten;
create policy "Opdracht aanmaken"
  on public.opdrachten for insert with check (auth.uid() = klant_id);

drop policy if exists "Opdracht bijwerken" on public.opdrachten;
create policy "Opdracht bijwerken"
  on public.opdrachten for update
  using (auth.uid() = klant_id
         or exists (select 1 from public.offertes o where o.opdracht_id = id and o.vakman_id = auth.uid()));

drop policy if exists "Offertes lezen" on public.offertes;
create policy "Offertes lezen"
  on public.offertes for select
  using (auth.uid() = vakman_id
         or exists (select 1 from public.opdrachten op where op.id = opdracht_id and op.klant_id = auth.uid()));

drop policy if exists "Offerte aanmaken" on public.offertes;
create policy "Offerte aanmaken"
  on public.offertes for insert with check (auth.uid() = vakman_id);

drop policy if exists "Offerte bijwerken" on public.offertes;
create policy "Offerte bijwerken"
  on public.offertes for update
  using (auth.uid() = vakman_id
         or exists (select 1 from public.opdrachten op where op.id = opdracht_id and op.klant_id = auth.uid()));

drop policy if exists "Eigen notificaties lezen" on public.notificaties;
create policy "Eigen notificaties lezen"
  on public.notificaties for select using (auth.uid() = user_id);

drop policy if exists "Notificatie aanmaken" on public.notificaties;
create policy "Notificatie aanmaken"
  on public.notificaties for insert with check (auth.role() = 'authenticated');

drop policy if exists "Eigen notificaties bijwerken" on public.notificaties;
create policy "Eigen notificaties bijwerken"
  on public.notificaties for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 7. REALTIME — alle flow-tabellen live
-- ─────────────────────────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table public.opdrachten;   exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.offertes;     exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notificaties; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.boekingen;    exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- 8. STORAGE — buckets voor foto's
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('chat-fotos', 'chat-fotos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('opdracht-fotos', 'opdracht-fotos', true)
  on conflict (id) do nothing;

drop policy if exists "Chat fotos upload" on storage.objects;
create policy "Chat fotos upload"
  on storage.objects for insert
  with check (bucket_id in ('chat-fotos','opdracht-fotos') and auth.role() = 'authenticated');

drop policy if exists "Fotos lezen" on storage.objects;
create policy "Fotos lezen"
  on storage.objects for select
  using (bucket_id in ('chat-fotos','opdracht-fotos'));

-- ─────────────────────────────────────────────────────────────
-- 9. INDEXEN
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_opdrachten_status     on public.opdrachten(status);
create index if not exists idx_opdrachten_klant      on public.opdrachten(klant_id);
create index if not exists idx_offertes_opdracht     on public.offertes(opdracht_id);
create index if not exists idx_offertes_vakman       on public.offertes(vakman_id);
create index if not exists idx_notificaties_user     on public.notificaties(user_id, gelezen);
create index if not exists idx_boekingen_vakman_tijd on public.boekingen(vakman_id, start_tijd);
