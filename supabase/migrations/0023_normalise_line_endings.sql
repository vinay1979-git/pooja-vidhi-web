-- =============================================================================
-- 0023_normalise_line_endings.sql
--
-- Carriage returns are back: 681 of them across 17 steps and 3 script columns,
-- plus 5 in archana_items and 6 in the deities table.
--
-- 0016 stripped the same junk and said ".gitattributes now pins *.sql to LF so
-- this cannot recur." That diagnosis was wrong. The files really are LF -- git
-- ls-files --eol reports w/lf and there is not one CR in any of 0017..0022 on
-- disk -- and the carriage returns arrived anyway. They are not coming from the
-- file. They are coming from the TRANSPORT: the SQL is pasted into a browser
-- textarea, and a textarea normalises every newline it holds to CRLF. Every
-- multi-line string literal in the pasted text picks one up per line.
--
-- The proof is in the data. Achamanam got its line breaks from 0022's
--   replace(mantra_sanskrit, '। ', '।' || chr(10))
-- which the SERVER computed, and it is clean. Karpura Neerajanam got its lines
-- as literal newlines inside a quoted literal in the same pasted file, and every
-- one of them is CRLF. Same migration, same run, different transport.
--
-- So no setting in this repo can prevent it, and every future migration that
-- carries a multi-line mantra will do it again. The durable fix is that each
-- migration strips CR from what it touched as its last act, which is immune to
-- how it was applied -- see CR_GUARD in scripts/_migration.mjs.
--
-- These render harmlessly: the browser treats CRLF as one segment break, which
-- is why nothing looks wrong on screen. They are still junk, they still break
-- anything that compares or splits on exact text, and proofread.mjs is right to
-- refuse to pass with them in place.
--
-- This sweeps EVERY text column in the schema rather than a list. The list is
-- what failed last time: 0016 enumerated pooja_steps, archana_items and
-- namavali_items, and missed deities, whose dhyana_sloka_deva has carried four
-- carriage returns ever since.
--
-- Idempotent.
-- =============================================================================

begin;

do $$
declare
  r record;
  n bigint;
  total bigint := 0;
begin
  for r in
    select c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type = 'BASE TABLE'
       and c.data_type in ('text', 'character varying', 'character')
     order by c.table_name, c.column_name
  loop
    execute format(
      'update public.%I set %I = replace(%I, chr(13), %L) where position(chr(13) in %I) > 0',
      r.table_name, r.column_name, r.column_name, '', r.column_name
    );
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'stripped CR from % row(s) of %.%', n, r.table_name, r.column_name;
      total := total + n;
    end if;
  end loop;
  raise notice 'total columns-rows cleaned: %', total;
end $$;

-- Prove it, over the same sweep, so a column added later is covered too.
do $$
declare
  r record;
  n bigint;
  bad text := '';
begin
  for r in
    select c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type = 'BASE TABLE'
       and c.data_type in ('text', 'character varying', 'character')
  loop
    execute format(
      'select count(*) from public.%I where position(chr(13) in %I) > 0',
      r.table_name, r.column_name
    ) into n;
    if n > 0 then bad := bad || format(' %s.%s(%s)', r.table_name, r.column_name, n); end if;
  end loop;
  if bad <> '' then raise exception 'carriage returns survive in:%', bad; end if;
end $$;

-- updated_at is touched separately: the sweep above runs one column at a time,
-- and bumping the timestamp inside it would fire once per column.
update public.pooja_steps set updated_at = now()
 where step_title_en in (
   'Vighneshwara Dhyanam','Pranayamam','Sankalpam','Kalasha Pooja','Ghanta Pooja',
   'Avahanam & Asanam','Prana Pratishtha','Padyam & Arghyam','Snanam & Vastram',
   'Gandham, Kumkumam & Pushpam','Dhoopam & Deepam','Naivedyam & Tambulam',
   'Karpura Neerajanam','Mantra Pushpam & Namaskaram','Kshama Prarthana & Conclusion',
   'Udvasanam','Naivedyam, Paniyam & Tambulam');

commit;

-- Verify:
--   select count(*) from pooja_steps where position(chr(13) in mantra_sanskrit) > 0;  -- 0
