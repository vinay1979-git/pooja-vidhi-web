import { supabase } from '@/lib/supabase';
import type {
  Pooja, PoojaStep, ArchanaItem, SamagriItem, NaivedyamItem, KartaGender,
} from '@/types/pooja';

/** The only values karta_recommended may hold. Mirrors the check constraint. */
const KARTA_GENDERS: readonly KartaGender[] = ['male', 'female', 'couple'];

/**
 * Data access for the migrated schema.
 *
 * Migrations 0001-0004 moved the jsonb blobs into real tables:
 *   poojas.samagri_list          -> samagri_items
 *   poojas.naivedyam_suggestions -> naivedyam_items
 *   pooja_steps.archana_list     -> archana_items
 *   pooja_steps.gender_target    -> pooja_steps.gender_rule
 *
 * These functions read the new tables and return the shape the existing viewer
 * already expects, so the UI keeps working while it is rewritten.
 */

type GenderRule =
  | 'all'
  | 'filter_male_only'
  | 'filter_female_only'
  | 'variant_by_initiation'
  | 'variant_by_gender';

/** The viewer still speaks the old vocabulary. Translate at the boundary. */
function toLegacyGender(rule: GenderRule | null): 'all' | 'male' | 'female' {
  switch (rule) {
    case 'filter_male_only':
      return 'male';
    case 'filter_female_only':
      return 'female';
    default:
      // variant_* keeps the step for everyone and swaps the mantra instead, so
      // it must NOT be filtered out. Dropping yajnopavitam for a woman would be
      // as wrong as showing her pranayamam.
      return 'all';
  }
}

// Columns that arrive with a later migration than the code that asks for them:
// recipe_note_ta with 0007, karta_recommended with 0041, status with 0043,
// why_en/why_ta with 0044, the whole pooja_modes table with 0047 and from_hour
// with 0051. Selecting a column that does not exist yet fails the WHOLE query,
// so the app would break in the window between deploying the code and running
// the migration.
//
// A LADDER, NOT A TRUTH TABLE. Each rung drops strictly more than the one above
// and we walk down until a query succeeds. The alternative -- a retry per
// column, testing which combination exists -- is the combinatorial mess this
// comment used to warn against, and the warning stands.
//
// WHY from_hour GETS ITS OWN RUNG when the others share one. Everything in the
// bottom rung is additive display data: lose karta_recommended and a
// recommendation badge goes missing. from_hour sits INSIDE the pooja_modes
// join, so dropping it the old way took the entire modes list with it -- and a
// sandhyavandanam with no declared modes does not degrade quietly. The picker
// falls through to the mode strings its steps claim and offers the reader three
// buttons reading `pratah`, `madhyahnika` and `sayam`. Losing an hour costs a
// picker that opens on the wrong sitting, which is where we were anyway; losing
// the labels is worse than not shipping this at all.
const enum Tier { All = 0, NoHours = 1, NoOptional = 2 }

const POOJA_SELECT = (tier: Tier) => `
  id, title_en, title_ta, description_en, description_ta, duration_mins,
  ritual_class, deity_id, eligibility${
    tier <= Tier.NoHours
      ? ', status, karta_recommended, why_en, why_ta,' +
        ' pooja_modes ( mode, seq, label_en, label_ta, hint_en, hint_ta' +
        (tier === Tier.All ? ', from_hour' : '') + ' )'
      : ''
  },
  samagri_items ( seq, item_en, item_ta, quantity, category, is_required ),
  naivedyam_items ( tier, seq, name_en, name_ta, recipe_note${
    tier <= Tier.NoHours ? ', recipe_note_ta' : ''
  }, prohibition_basis, reason_en )`;

export async function getPooja(poojaId: string): Promise<Pooja | null> {
  let data = null as unknown;
  let error: { code?: string; message?: string; hint?: string } | null = null;

  // Down the ladder until one works. 42703 is undefined_column; anything else
  // is a real failure and stops here rather than being retried into a vaguer
  // version of itself.
  for (const tier of [Tier.All, Tier.NoHours, Tier.NoOptional]) {
    ({ data, error } = await supabase
      .from('poojas')
      .select(POOJA_SELECT(tier))
      .eq('id', poojaId)
      .single());
    if (error?.code !== '42703') break;
  }

  // A failed query and a missing row are different problems and must not look
  // the same. Returning null for both turned "column does not exist" into a
  // 404, which is exactly the silent-failure pattern this file was written to
  // remove. PGRST116 is PostgREST's "no rows" for .single().
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(
      `Loading pooja "${poojaId}" failed: ${error.message}` +
        (error.hint ? ` (${error.hint})` : '') +
        '. If this names a missing column, a migration in supabase/migrations has not been run yet.',
    );
  }
  if (!data) return null;

  // The select string is built at runtime, which defeats supabase-js's generic
  // inference. Name the shape once here rather than casting at every use.
  const row = data as unknown as {
    id: string;
    title_en: string;
    title_ta: string;
    description_en: string | null;
    description_ta: string | null;
    duration_mins: number | null;
    ritual_class?: string | null;
    status?: string | null;
    karta_recommended?: string | null;
    why_en?: string | null;
    why_ta?: string | null;
    pooja_modes?: Record<string, unknown>[];
    samagri_items?: Record<string, unknown>[];
    naivedyam_items?: Record<string, unknown>[];
  };

  const samagri: SamagriItem[] = (row.samagri_items ?? [])
    .slice()
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.seq as number) - (b.seq as number))
    .map((s: Record<string, unknown>) => ({
      item_en: String(s.item_en ?? ''),
      item_ta: (s.item_ta as string) ?? undefined,
      quantity: (s.quantity as string) ?? undefined,
      category: (s.category as string) ?? undefined,
      required: (s.is_required as boolean) ?? true,
    }));

  // Primary first, then secondary. 'avoid' is not an offering, so it is carried
  // separately rather than mixed into the suggestion list.
  const tierRank: Record<string, number> = { primary: 0, secondary: 1, avoid: 2 };
  const naivedyamRows = (row.naivedyam_items ?? [])
    .slice()
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (tierRank[a.tier as string] ?? 9) - (tierRank[b.tier as string] ?? 9) ||
        (a.seq as number) - (b.seq as number),
    );

  const naivedyam: NaivedyamItem[] = naivedyamRows
    .filter((n: Record<string, unknown>) => n.tier !== 'avoid')
    .map((n: Record<string, unknown>) => ({
      name_en: String(n.name_en ?? ''),
      name_ta: (n.name_ta as string) ?? undefined,
      description_en: (n.recipe_note as string) ?? undefined,
      description_ta: (n.recipe_note_ta as string) ?? undefined,
    }));

  return {
    id: row.id,
    title_en: row.title_en,
    title_ta: row.title_ta,
    description_en: row.description_en ?? undefined,
    description_ta: row.description_ta ?? undefined,
    duration_mins: row.duration_mins ?? undefined,
    // Anything the database does not recognise is dropped rather than passed
    // through: a typo in this column must not become a karta the toggle has no
    // button for, which would leave every button looking unselected.
    karta_recommended: KARTA_GENDERS.includes(row.karta_recommended as KartaGender)
      ? (row.karta_recommended as KartaGender)
      : undefined,
    // Selected since 0002 and never mapped through, so pooja.ritual_class was
    // undefined everywhere downstream. The catalogue never noticed because it
    // uses select('*'); the viewer did, the moment something needed to know
    // whether a rite's modes are days or sittings.
    ritual_class: row.ritual_class ?? undefined,
    status: row.status === 'planned' ? 'planned' : 'published',
    // Sorted here rather than trusted from PostgREST: the picker's order is the
    // rite's order -- morning before noon before evening -- and seq is stored
    // precisely because no sort the client could invent would get it right.
    modes: (row.pooja_modes ?? [])
      .slice()
      .sort((a, b) => (a.seq as number) - (b.seq as number))
      .map((m) => ({
        mode: String(m.mode ?? ''),
        seq: Number(m.seq ?? 0),
        label_en: String(m.label_en ?? ''),
        label_ta: String(m.label_ta ?? ''),
        hint_en: String(m.hint_en ?? ''),
        hint_ta: String(m.hint_ta ?? ''),
        // NOT Number(m.from_hour ?? null), which is 0 -- and 0 is a meaningful
        // hour here, so every unset mode of every pooja would silently claim
        // midnight and the clock would start choosing days for observances
        // that have none. Null has to survive as null.
        from_hour: typeof m.from_hour === 'number' ? m.from_hour : null,
      })),
    why_en: row.why_en ?? undefined,
    why_ta: row.why_ta ?? undefined,
    samagri_list: samagri,
    naivedyam_suggestions: naivedyam,
    naivedyam_avoid: naivedyamRows
      .filter((n: Record<string, unknown>) => n.tier === 'avoid')
      .map((n: Record<string, unknown>) => ({
        name_en: String(n.name_en ?? ''),
        name_ta: (n.name_ta as string) ?? undefined,
        reason_en: (n.reason_en as string) ?? undefined,
        basis: (n.prohibition_basis as 'shastra' | 'custom') ?? undefined,
      })),
  };
}

// modes arrives with migration 0009. Same rule as recipe_note_ta: ask for it,
// and fall back to the older shape if Postgres says the column is not there
// yet, so code and migration can land in either order. Selecting a missing
// column fails the whole query, and last time that surfaced as a bare 404.
const STEPS_SELECT = (withModes: boolean) => `
  id, pooja_id, step_number, phase, step_title_en, step_title_ta,
  instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil,
  mantra_translit, meaning_en, philosophy_en, philosophy_ta,
  gender_rule, variant_mantra_sanskrit, variant_note_en,
  is_dynamic_sankalpam${withModes ? ', modes' : ''},
  archana_items ( seq, invoked_name_deva, invoked_name_ta,
                  invoked_name_translit, offering_deva, offering_en, offering_ta,
                  botanical, is_substitutable, substitute_with, meaning_en ),
  namavalis ( id, namavali_items ( seq, name_deva, name_ta, name_translit, meaning_en ) )`;

export async function getSteps(poojaId: string): Promise<PoojaStep[]> {
  let { data, error } = await supabase
    .from('pooja_steps')
    .select(STEPS_SELECT(true))
    .eq('pooja_id', poojaId)
    .order('step_number', { ascending: true });

  if (error?.code === '42703') {
    ({ data, error } = await supabase
      .from('pooja_steps')
      .select(STEPS_SELECT(false))
      .eq('pooja_id', poojaId)
      .order('step_number', { ascending: true }));
  }

  if (error) {
    throw new Error(
      `Loading steps for "${poojaId}" failed: ${error.message}` +
        (error.hint ? ` (${error.hint})` : '') +
        '. If this names a missing column, a migration in supabase/migrations has not been run yet.',
    );
  }
  if (!data) return [];

  // The select string is built at runtime, which defeats supabase-js's generic
  // inference, same as in getPooja.
  const rows = data as unknown as Record<string, unknown>[];

  return rows.map((s) => {
    const bySeq = (a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.seq as number) - (b.seq as number);

    const archana: ArchanaItem[] = ((s.archana_items as Record<string, unknown>[]) ?? [])
      .slice()
      .sort(bySeq)
      .map((a) => ({
        number: a.seq as number,
        sanskrit: String(a.invoked_name_deva ?? ''),
        tamil: (a.invoked_name_ta as string) ?? undefined,
        translit: (a.invoked_name_translit as string) ?? undefined,
        meaning_en: (a.meaning_en as string) ?? undefined,
        offering_sanskrit: (a.offering_deva as string) ?? undefined,
        offering_en: (a.offering_en as string) ?? undefined,
        offering_ta: (a.offering_ta as string) ?? undefined,
        botanical: (a.botanical as string) ?? undefined,
        is_substitutable: (a.is_substitutable as boolean) ?? false,
        substitute_with: (a.substitute_with as string) ?? undefined,
      }));

    // A 108-name list lives in namavali_items and is shared between poojas
    // rather than copied per step, so it arrives through namavali_id instead of
    // archana_items. Both render as the same numbered list.
    const namavali: ArchanaItem[] = (
      ((s.namavalis as Record<string, unknown>)?.namavali_items as Record<string, unknown>[]) ?? []
    )
      .slice()
      .sort(bySeq)
      .map((n) => ({
        number: n.seq as number,
        sanskrit: String(n.name_deva ?? ''),
        tamil: (n.name_ta as string) ?? undefined,
        translit: (n.name_translit as string) ?? undefined,
        meaning_en: (n.meaning_en as string) ?? undefined,
      }));

    const list = archana.length ? archana : namavali;

    return {
      id: String(s.id),
      pooja_id: String(s.pooja_id),
      step_number: s.step_number as number,
      phase: s.phase as PoojaStep['phase'],
      step_title_en: String(s.step_title_en ?? ''),
      step_title_ta: String(s.step_title_ta ?? ''),
      instruction_en: String(s.instruction_en ?? ''),
      instruction_ta: String(s.instruction_ta ?? ''),
      mantra_sanskrit: (s.mantra_sanskrit as string) ?? null,
      mantra_tamil: (s.mantra_tamil as string) ?? null,
      mantra_translit: (s.mantra_translit as string) ?? null,
      meaning_en: (s.meaning_en as string) ?? null,
      philosophy_en: (s.philosophy_en as string) ?? undefined,
      philosophy_ta: (s.philosophy_ta as string) ?? undefined,
      is_dynamic_sankalpam: (s.is_dynamic_sankalpam as boolean) ?? false,
      archana_list: list.length ? list : null,
      modes: ((s.modes as string[]) ?? ['main']) as PoojaStep['modes'],
      gender_rule: s.gender_rule as GenderRule,
      gender_target: toLegacyGender(s.gender_rule as GenderRule),
      variant_mantra_sanskrit: (s.variant_mantra_sanskrit as string) ?? undefined,
      variant_note_en: (s.variant_note_en as string) ?? undefined,
    };
  });
}
