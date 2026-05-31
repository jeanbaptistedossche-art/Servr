-- ═══════════════════════════════════════════════════════════
--  SERVR — Volledig database schema
--  Plak dit in: Supabase dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis" schema extensions;

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (één per auth-gebruiker, beide rollen)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null,
  email         text,
  phone         text,
  address       text,
  city          text default 'Amsterdam',
  country       text default 'BE',  -- BE of NL
  avatar_url    text,
  rol           text not null default 'klant'  -- 'klant' | 'vakman' | 'beide'
    check (rol in ('klant','vakman','beide')),
  active_view   text not null default 'klant'
    check (active_view in ('klant','vakman')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. VAKMENSEN  (extra info voor vakman-profiel)
-- ─────────────────────────────────────────────────────────────
create table public.vakmensen (
  id              uuid references public.profiles(id) on delete cascade primary key,
  specialty       text,                    -- "Loodgieter", "Elektricien", ...
  bio             text,
  kvk             text,                    -- KvK / Ondernemingsnummer
  btw_nummer      text,
  iban            text,
  stripe_account  text,                    -- Stripe Connect account ID
  radius_km       int  default 10,         -- spoed-straal
  beschikbaar     boolean default false,   -- nu online voor spoed
  rating          numeric(3,1) default 0,
  review_count    int default 0,
  klus_count      int default 0,
  omzet_maand     int default 0,           -- in centen
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. DIENSTEN  (wat de vakman aanbiedt)
-- ─────────────────────────────────────────────────────────────
create table public.diensten (
  id              uuid default uuid_generate_v4() primary key,
  vakman_id       uuid references public.vakmensen(id) on delete cascade not null,
  naam            text not null,
  beschrijving    text,
  prijs           int not null,             -- in centen
  eenheid         text default 'per uur'
    check (eenheid in ('per uur','per dag','vast bedrag','per m²','per stuk')),
  duur_minuten    int default 60,
  buffer_minuten  int default 15,
  categorie       text,
  btw             boolean default true,
  btw_percentage  int default 21,
  actief          boolean default true,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. BOEKINGEN
-- ─────────────────────────────────────────────────────────────
create table public.boekingen (
  id              uuid default uuid_generate_v4() primary key,
  klant_id        uuid references public.profiles(id) not null,
  vakman_id       uuid references public.vakmensen(id) not null,
  dienst_id       uuid references public.diensten(id),
  status          text default 'gepland'
    check (status in ('gepland','bezig','afgerond','geannuleerd')),
  start_tijd      timestamptz not null,
  eind_tijd       timestamptz,
  adres           text,
  notities        text,
  bedrag          int,                      -- in centen (totaal)
  stripe_intent   text,                     -- Stripe PaymentIntent ID
  betaald         boolean default false,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. SPOED-OPROEPEN
-- ─────────────────────────────────────────────────────────────
create table public.spoed_oproepen (
  id              uuid default uuid_generate_v4() primary key,
  klant_id        uuid references public.profiles(id) not null,
  categorie       text not null,            -- 'lekkage','geen-stroom', ...
  titel           text,
  omschrijving    text,
  adres           text,
  foto_urls       text[],
  status          text default 'open'
    check (status in ('open','aangenomen','verlopen','geannuleerd')),
  aangenomen_door uuid references public.vakmensen(id),
  boeking_id      uuid references public.boekingen(id),
  prijs_min       int,                      -- indicatie in centen
  prijs_max       int,
  created_at      timestamptz default now(),
  expires_at      timestamptz default (now() + interval '30 minutes')
);

-- ─────────────────────────────────────────────────────────────
-- 6. GESPREKKEN  (chat threads)
-- ─────────────────────────────────────────────────────────────
create table public.gesprekken (
  id              uuid default uuid_generate_v4() primary key,
  klant_id        uuid references public.profiles(id) not null,
  vakman_id       uuid references public.vakmensen(id) not null,
  boeking_id      uuid references public.boekingen(id),
  spoed_id        uuid references public.spoed_oproepen(id),
  context         text,                     -- "Spoed · Lekkende kraan"
  laatste_bericht text,
  laatste_tijd    timestamptz default now(),
  ongelezen_klant int default 0,
  ongelezen_vakman int default 0,
  gearchiveerd    boolean default false,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 7. BERICHTEN
-- ─────────────────────────────────────────────────────────────
create table public.berichten (
  id              uuid default uuid_generate_v4() primary key,
  gesprek_id      uuid references public.gesprekken(id) on delete cascade not null,
  afzender_id     uuid references public.profiles(id) not null,
  tekst           text,
  bijlage_url     text,
  bijlage_type    text,                     -- 'foto','pdf','factuur'
  gelezen         boolean default false,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 8. REVIEWS
-- ─────────────────────────────────────────────────────────────
create table public.reviews (
  id              uuid default uuid_generate_v4() primary key,
  boeking_id      uuid references public.boekingen(id) unique not null,
  klant_id        uuid references public.profiles(id) not null,
  vakman_id       uuid references public.vakmensen(id) not null,
  score           int not null check (score between 1 and 5),
  tekst           text,
  created_at      timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) — wie mag wat zien
-- ═══════════════════════════════════════════════════════════

-- Activeer RLS op alle tabellen
alter table public.profiles        enable row level security;
alter table public.vakmensen       enable row level security;
alter table public.diensten        enable row level security;
alter table public.boekingen       enable row level security;
alter table public.spoed_oproepen  enable row level security;
alter table public.gesprekken      enable row level security;
alter table public.berichten       enable row level security;
alter table public.reviews         enable row level security;

-- PROFILES: eigen profiel lezen/bewerken; andere profielen alleen lezen
create policy "Eigen profiel lezen"
  on public.profiles for select using (true);
create policy "Eigen profiel bewerken"
  on public.profiles for update using (auth.uid() = id);
create policy "Profiel aanmaken"
  on public.profiles for insert with check (auth.uid() = id);

-- VAKMENSEN: iedereen kan vakmensen zien; alleen zichzelf bewerken
create policy "Vakmensen lezen"
  on public.vakmensen for select using (true);
create policy "Eigen vakman bewerken"
  on public.vakmensen for all using (auth.uid() = id);

-- DIENSTEN: iedereen leest; vakman bewerkt eigen diensten
create policy "Diensten lezen"
  on public.diensten for select using (true);
create policy "Eigen diensten beheren"
  on public.diensten for all using (auth.uid() = vakman_id);

-- BOEKINGEN: klant en vakman zien eigen boekingen
create policy "Boeking zien"
  on public.boekingen for select
  using (auth.uid() = klant_id or auth.uid() = vakman_id);
create policy "Boeking aanmaken"
  on public.boekingen for insert with check (auth.uid() = klant_id);
create policy "Boeking bijwerken"
  on public.boekingen for update
  using (auth.uid() = klant_id or auth.uid() = vakman_id);

-- SPOED: klant maakt aan; vakmensen zien open oproepen in hun gebied
create policy "Spoed aanmaken"
  on public.spoed_oproepen for insert with check (auth.uid() = klant_id);
create policy "Spoed lezen"
  on public.spoed_oproepen for select
  using (
    auth.uid() = klant_id
    or status = 'open'
    or auth.uid() = aangenomen_door
  );
create policy "Spoed bijwerken"
  on public.spoed_oproepen for update
  using (auth.uid() = klant_id or auth.uid() = aangenomen_door);

-- GESPREKKEN: alleen de twee deelnemers
create policy "Gesprek zien"
  on public.gesprekken for select
  using (auth.uid() = klant_id or auth.uid() = vakman_id);
create policy "Gesprek aanmaken"
  on public.gesprekken for insert
  with check (auth.uid() = klant_id or auth.uid() = vakman_id);
create policy "Gesprek bijwerken"
  on public.gesprekken for update
  using (auth.uid() = klant_id or auth.uid() = vakman_id);

-- BERICHTEN: alleen deelnemers van het gesprek
create policy "Berichten lezen"
  on public.berichten for select
  using (
    exists (
      select 1 from public.gesprekken g
      where g.id = gesprek_id
      and (auth.uid() = g.klant_id or auth.uid() = g.vakman_id)
    )
  );
create policy "Bericht sturen"
  on public.berichten for insert
  with check (
    auth.uid() = afzender_id
    and exists (
      select 1 from public.gesprekken g
      where g.id = gesprek_id
      and (auth.uid() = g.klant_id or auth.uid() = g.vakman_id)
    )
  );

-- REVIEWS: iedereen leest; klant schrijft na boeking
create policy "Reviews lezen"
  on public.reviews for select using (true);
create policy "Review schrijven"
  on public.reviews for insert
  with check (
    auth.uid() = klant_id
    and exists (
      select 1 from public.boekingen b
      where b.id = boeking_id
      and b.klant_id = auth.uid()
      and b.status = 'afgerond'
    )
  );

-- ═══════════════════════════════════════════════════════════
--  AUTOMATISCHE TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Profiel aanmaken zodra iemand registreert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'klant')
  );
  -- Als rol vakman is: ook vakmensen-rij aanmaken
  if coalesce(new.raw_user_meta_data->>'rol', 'klant') in ('vakman','beide') then
    insert into public.vakmensen (id, specialty)
    values (new.id, new.raw_user_meta_data->>'specialty');
  end if;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Rating automatisch herberekenen na nieuwe review
create or replace function public.update_vakman_rating()
returns trigger language plpgsql as $$
begin
  update public.vakmensen
  set
    rating       = (select round(avg(score)::numeric, 1) from public.reviews where vakman_id = new.vakman_id),
    review_count = (select count(*) from public.reviews where vakman_id = new.vakman_id)
  where id = new.vakman_id;
  return new;
end;
$$;

create or replace trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_vakman_rating();

-- updated_at automatisch bijwerken
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
--  REALTIME inschakelen voor live chat & spoed
-- ═══════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.berichten;
alter publication supabase_realtime add table public.spoed_oproepen;
alter publication supabase_realtime add table public.gesprekken;
