-- =============================================================================
-- 0004_drop_legacy.sql
--
-- DO NOT RUN YET.
--
-- Run this only after the rebuilt app is live and nothing reads the legacy
-- columns any more. Until then the old code on main keeps working against them,
-- which is the whole point of doing 0001-0003 additively.
--
-- Check before running:
--   grep -rn "archana_list\|samagri_list\|naivedyam_suggestions\|gender_target" src/
-- should return nothing.
-- =============================================================================

begin;

alter table public.poojas
  drop column if exists samagri_list,
  drop column if exists naivedyam_suggestions;

alter table public.pooja_steps
  drop column if exists archana_list,
  drop column if exists gender_target,
  drop column if exists audio_url,
  drop column if exists gif_url;

-- unwrap_json existed only to read the legacy string-encoded blobs.
drop function if exists public.unwrap_json(jsonb);

commit;
