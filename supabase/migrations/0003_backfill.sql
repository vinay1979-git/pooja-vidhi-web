-- =============================================================================
-- 0003_backfill.sql
--
-- Moves the existing data out of the jsonb blobs into the new tables, fixes the
-- duplicate step_number, and only then adds the unique constraint that would
-- have prevented it.
--
-- Idempotent: safe to re-run. It does NOT invent missing content; 9 of the 27
-- screens are still absent and have to be written.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. The deity. forbidden_offerings is the single rule that drives both the
--    naivedyam advice and the patra pooja.
-- -----------------------------------------------------------------------------

insert into public.deities
  (id, name_en, name_deva, name_ta, name_dative_deva, class, forbidden_offerings)
values
  ('ganesha', 'Ganesha', 'गणेश', 'விநாயகர்', 'श्री महागणपतये', 'god',
   '{"leaves": ["tulasi"], "reason": "Brahma Vaivarta Purana prohibition; Tamil household practice omits it"}'::jsonb)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Calendar rule for the existing pooja. Bhadrapada shukla chaturthi, recited
--    in the SOLAR month for Tamil Smartha: Simha / Aavani.
-- -----------------------------------------------------------------------------

update public.poojas set
  deity_id       = coalesce(deity_id, 'ganesha'),
  ritual_class   = 'deity_pooja',
  eligibility    = 'all',
  rule_type      = coalesce(rule_type, 'tithi_in_month'),
  rule_month     = coalesce(rule_month, 'aavani'),
  rule_reckoning = coalesce(rule_reckoning, 'saura'),
  rule_paksha    = coalesce(rule_paksha, 'shukla'),
  rule_tithi     = coalesce(rule_tithi, 'chaturthi'),
  rule_notes     = coalesce(rule_notes, 'Performed in madhyahna kala.')
where id = 'ganesha_standard';

-- -----------------------------------------------------------------------------
-- 3. samagri_list -> samagri_items
--    The blob holds a JSON *string*, so unwrap_json() is needed before
--    jsonb_array_elements can walk it.
-- -----------------------------------------------------------------------------

insert into public.samagri_items (pooja_id, seq, item_en)
select p.id,
       e.ord::int,
       case jsonb_typeof(e.val) when 'string' then e.val #>> '{}'
                                else coalesce(e.val ->> 'item_en', e.val ->> 'name_en') end
from public.poojas p
cross join lateral jsonb_array_elements(public.unwrap_json(p.samagri_list))
     with ordinality as e(val, ord)
where p.samagri_list is not null
  and jsonb_typeof(public.unwrap_json(p.samagri_list)) = 'array'
on conflict (pooja_id, seq) do nothing;

-- -----------------------------------------------------------------------------
-- 4. naivedyam_suggestions -> naivedyam_items
--    Your rows already carry "priority": Primary / Secondary, so the tiering
--    you asked for is half-built and survives the move.
-- -----------------------------------------------------------------------------

insert into public.naivedyam_items (pooja_id, tier, seq, name_en, recipe_note)
select pooja_id, tier, row_number() over (partition by pooja_id, tier order by ord), name_en, note
from (
  select p.id as pooja_id,
         (case lower(coalesce(e.val ->> 'priority', 'secondary'))
            when 'primary' then 'primary' else 'secondary' end)::offering_tier as tier,
         e.ord,
         coalesce(e.val ->> 'item_name', e.val ->> 'name_en') as name_en,
         e.val ->> 'description' as note
  from public.poojas p
  cross join lateral jsonb_array_elements(public.unwrap_json(p.naivedyam_suggestions))
       with ordinality as e(val, ord)
  where p.naivedyam_suggestions is not null
    and jsonb_typeof(public.unwrap_json(p.naivedyam_suggestions)) = 'array'
) s
on conflict (pooja_id, tier, seq) do nothing;

-- -----------------------------------------------------------------------------
-- 5. gender_target -> gender_rule
--    'male' becomes a FILTER, not a variant: women do not perform Pranayamam and
--    the screen is removed entirely rather than substituted.
-- -----------------------------------------------------------------------------

update public.pooja_steps set gender_rule =
  case lower(coalesce(gender_target, 'all'))
    when 'male'   then 'filter_male_only'
    when 'female' then 'filter_female_only'
    else 'all'
  end::gender_rule
where gender_rule = 'all';

-- -----------------------------------------------------------------------------
-- 6. phase, assigned from the known step titles.
-- -----------------------------------------------------------------------------

update public.pooja_steps s set phase = v.phase::ritual_phase
from (values
  ('Achamanam',                     'purvangam'),
  ('Anga Vandanam',                 'purvangam'),
  ('Vighneshwara Dhyanam',          'purvangam'),
  ('Pranayamam',                    'purvangam'),
  ('Sankalpam',                     'purvangam'),
  ('Kalasha Pooja',                 'purvangam'),
  ('Ghanta Pooja',                  'purvangam'),
  ('Avahanam & Asanam',             'pradhana'),
  ('Padyam & Arghyam',              'pradhana'),
  ('Snanam & Vastram',              'pradhana'),
  ('Gandham, Kumkumam & Pushpam',   'pradhana'),
  ('Anga Pooja',                    'pradhana'),
  ('Pushpa Pooja (Archana)',        'pradhana'),
  ('Dhoopam & Deepam',              'uttara'),
  ('Naivedyam',                     'uttara'),
  ('Karpura Neerajanam',            'uttara'),
  ('Mantra Pushpam & Namaskaram',   'uttara'),
  ('Kshama Prarthana & Conclusion', 'uttara')
) as v(title, phase)
where s.step_title_en = v.title;

-- -----------------------------------------------------------------------------
-- 7. archana_list -> archana_items
-- -----------------------------------------------------------------------------

insert into public.archana_items
  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit)
select s.id,
       e.ord::int,
       coalesce(e.val ->> 'sanskrit', e.val ->> 'deva', ''),
       e.val ->> 'tamil',
       e.val ->> 'translit'
from public.pooja_steps s
cross join lateral jsonb_array_elements(public.unwrap_json(s.archana_list))
     with ordinality as e(val, ord)
where s.archana_list is not null
  and jsonb_typeof(public.unwrap_json(s.archana_list)) = 'array'
on conflict (pooja_step_id, seq) do nothing;

-- -----------------------------------------------------------------------------
-- 8. Fix the duplicate step_number, THEN constrain it.
--
--    'Gandham, Kumkumam & Pushpam' and 'Anga Pooja' both sit at 11, so Postgres
--    returns them in arbitrary order and the ritual sequence is undefined.
--    Gandham/akshatai/pushpam precedes the anga pooja in the paddhati, so that
--    is the tie-break. Everything is then renumbered densely from 1.
-- -----------------------------------------------------------------------------

with ordered as (
  select id,
         row_number() over (
           partition by pooja_id
           order by step_number,
                    case when step_title_en = 'Anga Pooja' then 2 else 1 end,
                    step_title_en
         ) as n
  from public.pooja_steps
)
update public.pooja_steps s
set step_number = -ordered.n          -- negative first, to dodge collisions
from ordered where s.id = ordered.id;

update public.pooja_steps set step_number = -step_number where step_number < 0;

-- Guarded by an existence check rather than an exception handler: a UNIQUE
-- constraint also creates an index, so re-running raises duplicate_table
-- (42P07), which a "when duplicate_object" handler does not catch.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'pooja_steps_pooja_step_uk'
  ) then
    alter table public.pooja_steps
      add constraint pooja_steps_pooja_step_uk unique (pooja_id, step_number);
  end if;
end $$;

create index if not exists pooja_steps_pooja_order_idx
  on public.pooja_steps (pooja_id, step_number);

commit;

-- =============================================================================
-- Verification. Run after the three migrations.
-- =============================================================================
--
-- select count(*) from samagri_items;        -- expect 7
-- select tier, count(*) from naivedyam_items group by 1;   -- 1 primary, 1 secondary
-- select count(*) from archana_items;        -- expect 20
-- select step_number, phase, step_title_en, gender_rule
--   from pooja_steps order by step_number;   -- expect 1..18, no gaps, no dupes
--
-- -- still to be written: 9 absent screens, the empty Tamil layer, meaning_en
-- select count(*) filter (where mantra_tamil is null) as missing_tamil,
--        count(*) filter (where meaning_en   is null) as missing_meaning,
--        count(*) filter (where step_title_ta is null) as missing_title_ta
-- from pooja_steps;
