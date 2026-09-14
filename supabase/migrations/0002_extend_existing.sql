-- =============================================================================
-- 0002_extend_existing.sql
--
-- ADDITIVE. Adds columns to the two tables that already exist and wires the new
-- tables to them. The legacy jsonb columns (samagri_list, naivedyam_suggestions,
-- archana_list) and the legacy gender_target are LEFT IN PLACE so the code on
-- main keeps running. 0004 drops them, after cutover.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- poojas
-- -----------------------------------------------------------------------------

alter table public.poojas
  add column if not exists ritual_class   ritual_class not null default 'deity_pooja',
  add column if not exists deity_id       text,
  add column if not exists description_en text,
  add column if not exists description_ta text,
  add column if not exists duration_mins  integer,
  -- 'all' | 'male_only' | 'female_only' | 'initiated_male_only'
  add column if not exists eligibility    text not null default 'all',

  -- Calendar. Nullable: a pooja can be performed on any day.
  add column if not exists rule_type      calendar_rule_type,
  add column if not exists rule_month     text,
  -- Tamil Smartha recites the SOLAR month (Simha/Aavani); Telugu and Kannada
  -- Smartha say chandramanena and recite the lunar month (Bhadrapada). The
  -- current engine picks the lunar name and pairs it with a Tamil solar name
  -- two months out of step, which is both traditions wrong at once.
  add column if not exists rule_reckoning text,
  add column if not exists rule_paksha    text,
  add column if not exists rule_tithi     text,
  add column if not exists rule_nakshatra text,
  add column if not exists rule_weekday   text,
  add column if not exists rule_ordinal   integer,
  add column if not exists rule_notes     text,
  add column if not exists requires_veda_attr  boolean not null default false,
  add column if not exists requires_sutra_attr boolean not null default false,

  add column if not exists source_ref  text,
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz,
  add column if not exists created_at  timestamptz not null default now(),
  add column if not exists updated_at  timestamptz not null default now();

do $$ begin
  alter table public.poojas
    add constraint poojas_deity_fk foreign key (deity_id) references public.deities(id);
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.poojas
    add constraint poojas_reckoning_ck check (rule_reckoning in ('saura','chandra'));
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.poojas
    add constraint poojas_paksha_ck check (rule_paksha in ('shukla','krishna'));
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.poojas
    add constraint poojas_eligibility_ck
    check (eligibility in ('all','male_only','female_only','initiated_male_only'));
exception when duplicate_object or duplicate_table then null; end $$;

create index if not exists poojas_ritual_class_idx on public.poojas (ritual_class);
create index if not exists poojas_deity_idx        on public.poojas (deity_id);

comment on column public.poojas.samagri_list is
  'DEPRECATED. Superseded by public.samagri_items. Dropped in 0004.';
comment on column public.poojas.naivedyam_suggestions is
  'DEPRECATED. Superseded by public.naivedyam_items. Dropped in 0004.';

-- -----------------------------------------------------------------------------
-- pooja_steps
-- -----------------------------------------------------------------------------

alter table public.pooja_steps
  add column if not exists phase ritual_phase not null default 'pradhana',
  -- null = bespoke step (Varalakshmi's dora granthi, Navaratri's golu).
  add column if not exists upachara_template_id text,

  add column if not exists philosophy_ta text,

  -- mantra_sanskrit is the CANONICAL source, hand-entered in Devanagari.
  -- mantra_tamil and mantra_translit are GENERATED from it at build time by
  -- @indic-transliteration/sanscript. Hand-typing all three is how the current
  -- data ended up with an empty Tamil column on all 18 rows.
  add column if not exists scripts_generated boolean not null default false,

  add column if not exists gender_rule gender_rule not null default 'all',
  add column if not exists variant_mantra_sanskrit text,
  add column if not exists variant_note_en text,

  add column if not exists namavali_id text,

  add column if not exists source_ref  text,
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz,
  add column if not exists created_at  timestamptz not null default now(),
  add column if not exists updated_at  timestamptz not null default now();

do $$ begin
  alter table public.pooja_steps
    add constraint pooja_steps_upachara_fk
    foreign key (upachara_template_id) references public.upachara_templates(id);
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.pooja_steps
    add constraint pooja_steps_namavali_fk
    foreign key (namavali_id) references public.namavalis(id);
exception when duplicate_object or duplicate_table then null; end $$;

comment on column public.pooja_steps.archana_list is
  'DEPRECATED. Superseded by public.archana_items. Dropped in 0004.';
comment on column public.pooja_steps.gender_target is
  'DEPRECATED. Superseded by gender_rule, which distinguishes filter from variant. Dropped in 0004.';
comment on column public.pooja_steps.audio_url is
  'DEPRECATED. Superseded by public.media_assets. Dropped in 0004.';
comment on column public.pooja_steps.gif_url is
  'DEPRECATED. Superseded by public.media_assets. Dropped in 0004.';

-- -----------------------------------------------------------------------------
-- Wire the new tables to the existing ones.
-- -----------------------------------------------------------------------------

do $$ begin
  alter table public.archana_items
    add constraint archana_items_step_fk
    foreign key (pooja_step_id) references public.pooja_steps(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.media_assets
    add constraint media_assets_step_fk
    foreign key (pooja_step_id) references public.pooja_steps(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.samagri_items
    add constraint samagri_items_pooja_fk
    foreign key (pooja_id) references public.poojas(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.naivedyam_items
    add constraint naivedyam_items_pooja_fk
    foreign key (pooja_id) references public.poojas(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.pooja_date_overrides
    add constraint pooja_date_overrides_pooja_fk
    foreign key (pooja_id) references public.poojas(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table public.user_sessions
    add constraint user_sessions_pooja_fk
    foreign key (pooja_id) references public.poojas(id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

-- auth.users exists on Supabase but not in a bare Postgres test harness.
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'auth' and table_name = 'users') then
    begin
      alter table public.user_sessions
        add constraint user_sessions_user_fk
        foreign key (user_id) references auth.users(id) on delete cascade;
    exception when duplicate_object then null; end;
  end if;
end $$;

drop trigger if exists t_poojas_touch on public.poojas;
create trigger t_poojas_touch before update on public.poojas
  for each row execute function public.touch_updated_at();

drop trigger if exists t_pooja_steps_touch on public.pooja_steps;
create trigger t_pooja_steps_touch before update on public.pooja_steps
  for each row execute function public.touch_updated_at();

commit;
