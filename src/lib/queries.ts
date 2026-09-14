import { supabase } from '@/lib/supabase';
import type { Pooja, PoojaStep, ArchanaItem, SamagriItem, NaivedyamItem } from '@/types/pooja';

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

// recipe_note_ta arrives with migration 0007. Selecting a column that does not
// exist yet fails the whole query, so the app would break between deploying the
// code and running the migration. Ask for it, and fall back to the older shape
// if Postgres says it is not there (42703). Purely additive display data, so
// degrading is correct; a genuinely broken query still throws below.
const POOJA_SELECT = (withTamilNotes: boolean) => `
  id, title_en, title_ta, description_en, description_ta, duration_mins,
  ritual_class, deity_id, eligibility,
  samagri_items ( seq, item_en, item_ta, quantity, category, is_required ),
  naivedyam_items ( tier, seq, name_en, name_ta, recipe_note${
    withTamilNotes ? ', recipe_note_ta' : ''
  }, prohibition_basis, reason_en )`;

export async function getPooja(poojaId: string): Promise<Pooja | null> {
  let { data, error } = await supabase
    .from('poojas')
    .select(POOJA_SELECT(true))
    .eq('id', poojaId)
    .single();

  if (error?.code === '42703') {
    ({ data, error } = await supabase
      .from('poojas')
      .select(POOJA_SELECT(false))
      .eq('id', poojaId)
      .single());
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

export async function getSteps(poojaId: string): Promise<PoojaStep[]> {
  const { data, error } = await supabase
    .from('pooja_steps')
    .select(
      `id, pooja_id, step_number, phase, step_title_en, step_title_ta,
       instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil,
       mantra_translit, meaning_en, philosophy_en, philosophy_ta,
       gender_rule, variant_mantra_sanskrit, variant_note_en,
       is_dynamic_sankalpam,
       archana_items ( seq, invoked_name_deva, invoked_name_ta,
                       invoked_name_translit, offering_en, botanical, meaning_en )`,
    )
    .eq('pooja_id', poojaId)
    .order('step_number', { ascending: true });

  if (error) {
    throw new Error(
      `Loading steps for "${poojaId}" failed: ${error.message}` +
        (error.hint ? ` (${error.hint})` : '') +
        '. If this names a missing column, a migration in supabase/migrations has not been run yet.',
    );
  }
  if (!data) return [];

  return data.map((s: Record<string, unknown>) => {
    const archana: ArchanaItem[] = ((s.archana_items as Record<string, unknown>[]) ?? [])
      .slice()
      .sort((a, b) => (a.seq as number) - (b.seq as number))
      .map((a) => ({
        number: a.seq as number,
        sanskrit: String(a.invoked_name_deva ?? ''),
        tamil: (a.invoked_name_ta as string) ?? undefined,
        translit: (a.invoked_name_translit as string) ?? undefined,
        meaning_en: (a.meaning_en as string) ?? undefined,
      }));

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
      archana_list: archana.length ? archana : null,
      gender_rule: s.gender_rule as GenderRule,
      gender_target: toLegacyGender(s.gender_rule as GenderRule),
      variant_mantra_sanskrit: (s.variant_mantra_sanskrit as string) ?? undefined,
      variant_note_en: (s.variant_note_en as string) ?? undefined,
    };
  });
}
