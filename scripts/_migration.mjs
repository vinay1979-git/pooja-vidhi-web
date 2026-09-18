/**
 * Writing a migration file, with the one guard every migration in this project
 * needs and none of them had.
 *
 * THE FAULT THIS PREVENTS: the SQL is applied by pasting it into a browser SQL
 * editor, and a textarea normalises every newline it holds to CRLF. So every
 * multi-line string literal in the pasted text arrives in the database with a
 * carriage return on each line. Nothing in this repo can stop that -- the files
 * on disk are LF, .gitattributes pins them to LF, and it happened anyway; see
 * the header of 0023, and 0016, which fixed the symptom and misdiagnosed it.
 *
 * The transport cannot be fixed from here, so the migration repairs itself
 * instead: it ends by stripping CR from the rows it just wrote. Idempotent,
 * costs nothing when the SQL was applied some other way, and immune to which
 * way it was.
 */
import { writeFileSync } from 'node:fs';

/**
 * Appended to every generated migration, INSIDE its transaction, so a migration
 * that rolls back does not leave a half-applied cleanup behind.
 *
 * It sweeps every text column rather than only the rows this transaction wrote.
 * Scoping it looked tidier and was tried first -- xmin = txid_current() -- but
 * xmin is a 32-bit xid and txid_current() is the 64-bit epoch-extended counter,
 * so the comparison is correct only until the first wraparound and then silently
 * matches nothing. An unscoped sweep is 53 rows, needs no such reasoning, and
 * cleaning up after a migration that ran before this guard existed is a feature.
 */
export const CR_GUARD = `
-- Carriage returns, from pasting this file into a browser SQL editor. See
-- scripts/_migration.mjs.
do $$
declare
  r record;
  n bigint;
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
      'update public.%I set %I = replace(%I, chr(13), %L)'
      || ' where position(chr(13) in %I) > 0',
      r.table_name, r.column_name, r.column_name, '', r.column_name
    );
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'stripped CR from % row(s) of %.%', n, r.table_name, r.column_name;
    end if;
  end loop;
end $$;
`;

/**
 * Write a migration, with the guard spliced in before the final commit.
 *
 * It has to go INSIDE the transaction, and generated SQL in this project always
 * ends with `commit;`, so this splits on the last one rather than appending.
 */
export function emitMigration(path, sql) {
  const at = sql.lastIndexOf('\ncommit;');
  if (at < 0) throw new Error(`${path}: no commit; to splice the CR guard before`);
  const out = sql.slice(0, at) + '\n' + CR_GUARD + sql.slice(at);
  writeFileSync(path, out);
  console.log(`wrote ${path}`);
}
