-- =============================================================================
-- 0016_strip_carriage_returns.sql
--
-- Git's core.autocrlf rewrote the migration files to CRLF on checkout, so the
-- multi-line mantra literals in 0011 carried \r into the database: 76 carriage
-- returns in each of the three script fields, across the 16 Varalakshmi steps
-- whose mantras span several lines.
--
-- They render harmlessly, because HTML collapses \r as whitespace, which is why
-- nothing looked wrong on screen. They are still junk in the data, and anything
-- that compares or splits on exact text would trip over them.
--
-- .gitattributes now pins *.sql to LF so this cannot recur.
--
-- Idempotent.
-- =============================================================================

begin;

update public.pooja_steps set
  mantra_sanskrit = replace(mantra_sanskrit, chr(13), ''),
  mantra_tamil    = replace(mantra_tamil,    chr(13), ''),
  mantra_translit = replace(mantra_translit, chr(13), ''),
  instruction_en  = replace(instruction_en,  chr(13), ''),
  instruction_ta  = replace(instruction_ta,  chr(13), ''),
  meaning_en      = replace(meaning_en,      chr(13), ''),
  philosophy_en   = replace(philosophy_en,   chr(13), ''),
  updated_at = now()
where mantra_sanskrit like '%' || chr(13) || '%'
   or mantra_tamil    like '%' || chr(13) || '%'
   or mantra_translit like '%' || chr(13) || '%'
   or instruction_en  like '%' || chr(13) || '%'
   or instruction_ta  like '%' || chr(13) || '%'
   or meaning_en      like '%' || chr(13) || '%'
   or philosophy_en   like '%' || chr(13) || '%';

update public.archana_items set
  invoked_name_deva     = replace(invoked_name_deva,     chr(13), ''),
  invoked_name_ta       = replace(invoked_name_ta,       chr(13), ''),
  invoked_name_translit = replace(invoked_name_translit, chr(13), ''),
  offering_deva         = replace(offering_deva,         chr(13), '')
where invoked_name_deva like '%' || chr(13) || '%'
   or invoked_name_ta   like '%' || chr(13) || '%'
   or offering_deva     like '%' || chr(13) || '%';

update public.namavali_items set
  name_deva     = replace(name_deva,     chr(13), ''),
  name_ta       = replace(name_ta,       chr(13), ''),
  name_translit = replace(name_translit, chr(13), '')
where name_deva like '%' || chr(13) || '%' or name_ta like '%' || chr(13) || '%';

do $$
declare n integer;
begin
  select count(*) into n from public.pooja_steps
   where mantra_sanskrit like '%' || chr(13) || '%'
      or mantra_tamil like '%' || chr(13) || '%'
      or mantra_translit like '%' || chr(13) || '%';
  if n > 0 then raise exception '% steps still carry carriage returns', n; end if;
end $$;

commit;

-- Verify:
--   select count(*) from pooja_steps where mantra_sanskrit like '%' || chr(13) || '%';  -- 0
