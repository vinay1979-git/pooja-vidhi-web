export interface NaivedyamItem {
  id?: string;
  name_en: string;
  name_ta?: string;
  description_en?: string;
  description_ta?: string;
  image_url?: string;
}

export interface ArchanaItem {
  number?: number;
  sanskrit: string;
  tamil?: string;
  translit?: string;
  meaning_en?: string;
  /**
   * What is physically offered at this name. Null for a plain namavali, where
   * the same flower or akshatai is offered at every name; set for the patra and
   * durva poojas, where each line offers a different thing.
   */
  offering_en?: string;
  offering_ta?: string;
  offering_sanskrit?: string;
  botanical?: string;
  /** True when the offering is hard to get and substitute_with names the stand-in. */
  is_substitutable?: boolean;
  substitute_with?: string;
}

export interface SamagriItem {
  item_en: string;
  item_ta?: string;
  quantity?: string;
  category?: string;
  required?: boolean;
}

/**
 * Which performance of a rite a step belongs to.
 *
 * A plain string, and deliberately not a union. It used to be
 * 'main' | 'punar' | 'udvasana', which named the days of a multi-day
 * observance -- day one, a later day, the final day with the release. That was
 * every pooja the app had.
 *
 * Sandhyavandanam's modes are not days, they are the three SITTINGS: pratah,
 * madhyahnika, sayam. The same machinery answers both questions -- which
 * performance does this step belong to -- but the values are open, so the union
 * would have to grow for every rite and the type would say less each time.
 *
 * The valid values for a given pooja are its rows in pooja_modes, which also
 * carry the labels. 0047 asserts that every mode a step CLAIMS is declared
 * there, so the openness here is checked in the database rather than the type.
 */
export type PoojaMode = string;

/** One selectable mode, with the words the picker shows. From pooja_modes. */
export interface PoojaModeOption {
  mode: PoojaMode;
  seq: number;
  label_en: string;
  label_ta: string;
  hint_en: string;
  hint_ta: string;
}

/**
 * Who performs the rite. Karta is the ordinary word for the one performing it --
 * the karta of a shraddha, the karta of the household -- so it is the word the
 * app uses; "performer" was a translation of a term the reader already had.
 *
 * THE FORM IS INFLECTED, which matters because the app pre-selects a woman for
 * Varalakshmi. Karta is the masculine nominative singular of the stem kartR, so
 * calling a woman the karta is a masculine choice rather than a neutral one.
 * The screen therefore says Karta, Kartri or Dampati according to what is
 * selected; the forms and the grammar behind them are in KARTA_TERM_EN in
 * lib/ui-text.ts.
 *
 * Living usage would have allowed the lazier answer -- karta is widely treated
 * as a role title that takes any karta, Hindupedia's Shraddha article writes of
 * the karta invoking "his/her parent", and Indian law has recognised a female
 * Karta of a joint family since Sujata Sharma v Manu Gupta (Delhi HC, 2016),
 * upheld 2023. The app takes the stricter reading because it is the one place
 * on the screen that knows who is sitting there. Step PROSE keeps the bare role
 * noun, since those sentences are about whoever is performing rather than about
 * a particular karta.
 *
 * 'couple' is not a third gender. It is the dampati case, where husband and
 * wife perform together, and it is modelled here rather than as a pair of
 * kartas because every rule in the data that turns on this asks one question:
 * does this step apply to the person in front of the lamp.
 */
export type KartaGender = 'male' | 'female' | 'couple';

export interface NaivedyamAvoidItem {
  name_en: string;
  name_ta?: string;
  reason_en?: string;
  /** 'custom' vs 'shastra' matters: the no-deep-frying rule on Chaturthi is
   *  widely observed but has no shastraic citation, so it is presented as custom. */
  basis?: 'shastra' | 'custom';
}

export interface Pooja {
  id: string;
  title_en: string;
  title_ta: string;
  samagri_list?: (string | SamagriItem)[];
  naivedyam_suggestions?: (string | NaivedyamItem)[];
  /** tier='avoid' rows. No tulasi for Ganesha; no tasting the pongal before it
   *  is offered. Kept separate because these are not offerings. */
  naivedyam_avoid?: NaivedyamAvoidItem[];
  description_en?: string;
  description_ta?: string;
  duration_mins?: number;
  image_url?: string;
  category?: string;
  deity?: string;
  /**
   * The karta this rite is traditionally performed by, if it has one.
   *
   * A RECOMMENDATION, deliberately not a rule, and deliberately not the
   * `eligibility` column -- that one is worded male_only / female_only and
   * would be a claim the book does not make. Undefined means the rite makes no
   * recommendation and the app makes none either. All it does is choose the
   * opening value of the karta toggle.
   */
  karta_recommended?: KartaGender;
  /**
   * The modes this rite offers, in picker order. Empty for a pooja with no
   * modes at all; one entry for a rite like the daily panchayatana, where the
   * picker hides itself.
   */
  modes?: PoojaModeOption[];
  /**
   * 'planned' means listed but not yet written: the catalogue shows a card
   * rather than a link, because the rite has no steps and opening it would
   * give a preparation screen and a Start button for something that does not
   * exist. Absent or 'published' behaves exactly as before.
   */
  status?: 'published' | 'planned';
  /**
   * Why the rite is kept at all: purpose, the idea behind its shape, what it is
   * for. Four to seven sentences, shown on the preparation screen.
   *
   * Distinct from PoojaStep.philosophy_en, which explains one step. This is the
   * answer to "why are you doing this", not "why this bit of it".
   */
  why_en?: string;
  why_ta?: string;
}

export interface PoojaStep {
  id: string;
  pooja_id: string;
  step_number: number;
  step_title_en: string;
  step_title_ta: string;
  instruction_en: string;
  instruction_ta: string;
  mantra_sanskrit?: string | null;
  mantra_tamil?: string | null;
  mantra_translit?: string | null;
  meaning_en?: string | null;
  is_dynamic_sankalpam?: boolean | null;
  archana_list?: ArchanaItem[] | null;
  phase?: 'purvangam' | 'pradhana' | 'uttara';
  /** Which pooja modes include this step. See PoojaMode. */
  modes?: PoojaMode[];
  /** Authoritative. 'filter_*' removes the screen entirely; 'variant_*' keeps it
   *  and swaps the mantra. */
  gender_rule?:
    | 'all'
    | 'filter_male_only'
    | 'filter_female_only'
    | 'variant_by_initiation'
    | 'variant_by_gender';
  /** Derived from gender_rule for the existing viewer. Only 'filter_*' maps to a
   *  gender here; every 'variant_*' maps to 'all' so the step is never dropped. */
  gender_target?: 'all' | 'male' | 'female';
  variant_mantra_sanskrit?: string;
  variant_note_en?: string;
  philosophy_en?: string;
  philosophy_ta?: string;
}
