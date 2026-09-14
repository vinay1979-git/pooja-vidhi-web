-- =============================================================================
-- 0007_tamil_prep_items.sql
--
-- Tamil for the preparation screen.
--
-- samagri_items.item_ta and naivedyam_items.name_ta were never populated, so
-- switching the instruction language to Tamil left the checklist in English
-- while the secondary line vanished. The names are standard; the naivedyam
-- descriptions are a draft and marked as such, like 0006.
--
-- Adds recipe_note_ta, which the schema did not have: the Tamil description had
-- nowhere to live.
--
-- Idempotent; safe to re-run.
-- =============================================================================

begin;

alter table public.naivedyam_items
  add column if not exists recipe_note_ta text;

-- --- samagri ----------------------------------------------------------------
update public.samagri_items set item_ta = 'மஞ்சள் தூள்'
  where pooja_id = 'ganesha_standard' and item_en = 'Turmeric powder';
update public.samagri_items set item_ta = 'குங்குமம் & சந்தனம்'
  where pooja_id = 'ganesha_standard' and item_en = 'Kumkumam & Chandanam';
update public.samagri_items set item_ta = 'அட்சதை'
  where pooja_id = 'ganesha_standard' and item_en = 'Akshatai';
update public.samagri_items set item_ta = 'அறுகம்புல்'
  where pooja_id = 'ganesha_standard' and item_en = 'Arukampul (Bermuda Grass)';
update public.samagri_items set item_ta = 'வெற்றிலை & பாக்கு'
  where pooja_id = 'ganesha_standard' and item_en = 'Betel leaves & nuts';
update public.samagri_items set item_ta = 'முழுத் தேங்காய்'
  where pooja_id = 'ganesha_standard' and item_en = 'Whole Coconut';
update public.samagri_items set item_ta = 'பஞ்சபாத்திரம் & உத்தரிணி'
  where pooja_id = 'ganesha_standard' and item_en = 'Panchapatra & Uddharani';

-- --- naivedyam --------------------------------------------------------------
update public.naivedyam_items set
  name_ta = 'மோதகம் / கொழுக்கட்டை',
  recipe_note_ta = 'வெல்லமும் தேங்காயும் நிரப்பிய அரிசி மாவு கொழுக்கட்டை, ஆவியில் வேகவைத்தது.'
  where pooja_id = 'ganesha_standard' and name_en = 'Modakam / Kozhukattai';

update public.naivedyam_items set
  name_ta = 'சுண்டல்',
  recipe_note_ta = 'கடுகு தாளித்து தேங்காய் சேர்த்த வேகவைத்த கொண்டைக்கடலை.'
  where pooja_id = 'ganesha_standard' and name_en = 'Sundal';

commit;

-- Verify:
--   select count(*) from samagri_items where item_ta is null;   -- expect 0
--   select count(*) from naivedyam_items where name_ta is null; -- expect 0
