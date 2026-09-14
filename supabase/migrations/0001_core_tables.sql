-- =============================================================================
-- 0001_core_tables.sql
--
-- ADDITIVE. Creates only NEW tables. Touches nothing that exists, so the code
-- currently on main keeps working after this runs.
--
-- Run order: 0001 -> 0002 -> 0003. Then cut over the app, then 0004.
-- =============================================================================

begin;

-- gen_random_uuid() is core Postgres since 13, so no extension is required.
-- Left as a tolerant no-op in case an older instance needs pgcrypto.
do $$ begin
  create extension if not exists "pgcrypto";
exception when others then null; end $$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

do $$ begin
  create type ritual_class as enum (
    'deity_pooja',   -- shodashopachara: Vinayaka Chaturthi, Saraswati Pooja
    'vratam',        -- vow, often thread or kalasha: Varalakshmi, Karadaiyan Nombu
    'tarpanam',      -- pitru karma: Amavasai, Mahalaya Paksham
    'homam',         -- fire ritual; app gives preparation guidance only
    'domestic',      -- no mantra sequence: Thai Pongal, Bhogi, Mattu Pongal
    'temple'         -- little home ritual: Thaipusam, Panguni Uthiram
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type ritual_phase as enum ('purvangam', 'pradhana', 'uttara');
exception when duplicate_object then null; end $$;

-- 'filter_*' removes the screen entirely and the step counter renumbers around
-- it: a woman never sees Pranayamam. 'variant_*' keeps the screen and swaps the
-- mantra: svaha/namah in achamanam, Vedic vs Puranic at yajnopavitam and mantra
-- pushpam. Conflating the two would drop yajnopavitam for a woman, which is as
-- wrong as showing her Pranayamam.
do $$ begin
  create type gender_rule as enum (
    'all',
    'filter_male_only',
    'filter_female_only',
    'variant_by_initiation',
    'variant_by_gender'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type deity_class as enum ('god', 'goddess');
exception when duplicate_object then null; end $$;

-- Every date rule in the Tamil year reduces to one of these eight.
do $$ begin
  create type calendar_rule_type as enum (
    'tithi_in_month',      -- Vinayaka Chaturthi: Aavani, shukla chaturthi
    'nakshatra_in_month',  -- Karthigai Deepam: Krittika with pournami
    'ordinal_weekday',     -- Varalakshmi: Friday before Sravana pournami
    'solar_sankranti',     -- Thai Pongal: sun enters Makara
    'paksha_span',         -- Mahalaya Paksham: a 16-day window, not a day
    'monthly_recurrence',  -- Sankatahara Chaturthi, Pradosham, Ekadasi
    'ordinal_solar_day',   -- Aadi Perukku: 18th solar day of Aadi
    'sankranti_instant'    -- Karadaiyan Nombu: an instant, not a day
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type offering_tier as enum ('primary', 'secondary', 'avoid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('audio', 'mudra', 'image');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Helper: the existing jsonb columns hold JSON *strings*, not objects, so a
-- plain cast is not enough. This unwraps one level of string encoding.
-- -----------------------------------------------------------------------------

create or replace function public.unwrap_json(v jsonb)
returns jsonb
language sql immutable as $$
  select case
    when v is null then null
    when jsonb_typeof(v) = 'string' then (v #>> '{}')::jsonb
    else v
  end
$$;

-- -----------------------------------------------------------------------------
-- Deities. Without this there is nowhere to put "tulasi is forbidden for
-- Ganesha, required for Perumal, not offered to Shiva in Smartha practice".
-- That one rule drives the naivedyam advice and the patra pooja together.
-- -----------------------------------------------------------------------------

create table if not exists public.deities (
  id                text primary key,
  name_en           text not null,
  name_deva         text not null,
  name_ta           text not null,
  -- The dative is what gets substituted into every upachara line. Store once.
  name_dative_deva  text not null,
  class             deity_class not null,
  dhyana_sloka_deva text,
  avahana_deva      text,
  permitted_offerings jsonb not null default '{}'::jsonb,
  forbidden_offerings jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- The reusable kernel. This is the table that decides whether the app survives
-- deity two. The published paddhatis already work this way: the Durga
-- Shodashopachara does not restate the preliminaries, it says "purvangam
-- pasyatu" and points at one shared Smartha Purvangam whose text carries literal
-- blank slots, "sri ____ uddisya sri ____ prityartham".
--
-- mantra_deva uses {{deity}} as the substitution point for name_dative_deva.
-- -----------------------------------------------------------------------------

create table if not exists public.upachara_templates (
  id               text primary key,
  phase            ritual_phase not null,
  default_seq      integer not null,
  name_en          text not null,
  name_deva        text,
  name_ta          text,
  mantra_deva      text,
  instruction_en   text,
  instruction_ta   text,
  gender_rule      gender_rule not null default 'all',
  -- Ganesha's shodashopachara has yajnopavitam; Durga's replaces it with
  -- saubhagya sutram, haridra churnam, kumkumam, sinduram, kajjalam,
  -- abharanam, pushpamala. null = applies to both.
  applies_to_class deity_class,
  source_ref       text,
  created_at       timestamptz not null default now()
);

create index if not exists upachara_templates_phase_seq_idx
  on public.upachara_templates (phase, default_seq);

-- -----------------------------------------------------------------------------
-- Namavalis. Sanskrit Documents publishes three different Ganesha Ashtottara
-- recensions and they are not the same 108 names, so recension is a column.
-- This also lets you seed Giri's list now and add others later without a
-- migration.
-- -----------------------------------------------------------------------------

create table if not exists public.namavalis (
  id          text primary key,
  deity_id    text not null references public.deities(id) on delete cascade,
  recension   text not null,
  name_count  integer not null check (name_count in (12, 16, 108, 1008)),
  source_ref  text,
  verified_by text,
  verified_at timestamptz
);

create table if not exists public.namavali_items (
  id            uuid primary key default gen_random_uuid(),
  namavali_id   text not null references public.namavalis(id) on delete cascade,
  seq           integer not null,
  name_deva     text not null,
  name_ta       text,
  name_translit text,
  meaning_en    text,
  unique (namavali_id, seq)
);

-- -----------------------------------------------------------------------------
-- Enumerated archana lines. Replaces pooja_steps.archana_list, which is why
-- only 20 of 108 names exist today. Ganesha alone needs 189 rows here:
-- 18 limbs + 21 leaves + 21 flowers + 21 durva + 108 names.
-- -----------------------------------------------------------------------------

create table if not exists public.archana_items (
  id                    uuid primary key default gen_random_uuid(),
  pooja_step_id         uuid not null,
  seq                   integer not null,
  invoked_name_deva     text not null,
  invoked_name_ta       text,
  invoked_name_translit text,
  offering_deva         text,
  offering_en           text,
  offering_ta           text,
  botanical             text,
  is_substitutable      boolean not null default false,
  substitute_with       text,
  meaning_en            text,
  unique (pooja_step_id, seq)
);

-- -----------------------------------------------------------------------------
-- Preparation dashboard. samagri_list and naivedyam_suggestions as jsonb cannot
-- carry a tier, a quantity, a substitution or a prohibition, and cannot answer
-- "which poojas need arugampul".
-- -----------------------------------------------------------------------------

create table if not exists public.samagri_items (
  id               uuid primary key default gen_random_uuid(),
  pooja_id         text not null,
  seq              integer not null,
  item_en          text not null,
  item_ta          text,
  quantity         text,
  category         text,
  is_required      boolean not null default true,
  is_substitutable boolean not null default false,
  substitute_with  text,
  unique (pooja_id, seq)
);

create table if not exists public.naivedyam_items (
  id       uuid primary key default gen_random_uuid(),
  pooja_id text not null,
  tier     offering_tier not null,
  seq      integer not null,
  name_en  text not null,
  name_ta  text,
  quantity text,
  recipe_note text,
  -- Set on tier='avoid'. The distinction matters: the no-deep-frying rule on
  -- Chaturthi is widely observed but has no shastraic citation I could find,
  -- so the app should present it as custom rather than rule.
  prohibition_basis text check (prohibition_basis in ('shastra','custom')),
  reason_en text,
  unique (pooja_id, tier, seq)
);

create index if not exists naivedyam_items_pooja_tier_idx
  on public.naivedyam_items (pooja_id, tier);

-- -----------------------------------------------------------------------------
-- Media. Moved off the step: mudra animations are reusable across poojas, and
-- the 108 names each need their own audio file. reviewed_by is the gate: no
-- synthesised mantra audio ships without a human having listened to it.
-- -----------------------------------------------------------------------------

create table if not exists public.media_assets (
  id                   uuid primary key default gen_random_uuid(),
  kind                 media_kind not null,
  storage_path         text not null,
  pooja_step_id        uuid,
  archana_item_id      uuid references public.archana_items(id) on delete cascade,
  upachara_template_id text references public.upachara_templates(id) on delete cascade,
  script               text check (script in ('deva','tamil','translit')),
  voice                text,
  is_synthetic         boolean not null default false,
  reviewed_by          text,
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now(),
  check (num_nonnulls(pooja_step_id, archana_item_id, upachara_template_id) = 1)
);

create index if not exists media_assets_step_idx on public.media_assets (pooja_step_id);
create index if not exists media_assets_archana_idx on public.media_assets (archana_item_id);

-- -----------------------------------------------------------------------------
-- Per-year date overrides. Upakarma depends on the performer's Veda, and in
-- some years on their sutra. A pure rule engine gets this wrong exactly in the
-- years it matters. NOT NULL with '' meaning "anyone", because NULLs never
-- collide in a unique constraint and would let duplicates through.
-- -----------------------------------------------------------------------------

create table if not exists public.pooja_date_overrides (
  id             uuid primary key default gen_random_uuid(),
  pooja_id       text not null,
  gregorian_year integer not null,
  veda           text not null default '',
  sutra          text not null default '',
  observed_on    date not null,
  reason         text,
  unique (pooja_id, gregorian_year, veda, sutra)
);

-- -----------------------------------------------------------------------------
-- Resumable sessions. PoojaViewer holds all of this in React state today, so
-- closing the tab midway through a two-hour ritual loses it.
-- -----------------------------------------------------------------------------

create table if not exists public.user_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,
  pooja_id           text not null,
  current_step       integer not null default 0,
  performer_gender   text,
  gotra              text,
  performer_name     text,
  -- Resolved once and frozen, so a pooja that straddles a tithi boundary does
  -- not silently change its own sankalpam halfway through.
  sankalpam_snapshot jsonb,
  checked_samagri    jsonb not null default '{}'::jsonb,
  archana_progress   jsonb not null default '{}'::jsonb,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  updated_at         timestamptz not null default now()
);

create index if not exists user_sessions_user_pooja_idx
  on public.user_sessions (user_id, pooja_id);

-- -----------------------------------------------------------------------------
-- RLS. Same posture as your existing policies: public read, no public write.
-- Seeding uses the service_role key, which bypasses RLS.
-- -----------------------------------------------------------------------------

alter table public.deities              enable row level security;
alter table public.upachara_templates   enable row level security;
alter table public.namavalis            enable row level security;
alter table public.namavali_items       enable row level security;
alter table public.archana_items        enable row level security;
alter table public.samagri_items        enable row level security;
alter table public.naivedyam_items      enable row level security;
alter table public.media_assets         enable row level security;
alter table public.pooja_date_overrides enable row level security;
alter table public.user_sessions        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'deities','upachara_templates','namavalis','namavali_items','archana_items',
    'samagri_items','naivedyam_items','media_assets','pooja_date_overrides'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'public read ' || t
    ) then
      execute format(
        'create policy %I on public.%I for select using (true)',
        'public read ' || t, t
      );
    end if;
  end loop;
end $$;

-- Sessions are private to their owner.
do $$ begin
  create policy "own sessions select" on public.user_sessions
    for select using (auth.uid() = user_id);
  create policy "own sessions insert" on public.user_sessions
    for insert with check (auth.uid() = user_id);
  create policy "own sessions update" on public.user_sessions
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own sessions delete" on public.user_sessions
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists t_deities_touch on public.deities;
create trigger t_deities_touch before update on public.deities
  for each row execute function public.touch_updated_at();

drop trigger if exists t_user_sessions_touch on public.user_sessions;
create trigger t_user_sessions_touch before update on public.user_sessions
  for each row execute function public.touch_updated_at();

commit;
