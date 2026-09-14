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
}

export interface SamagriItem {
  item_en: string;
  item_ta?: string;
  quantity?: string;
  category?: string;
  required?: boolean;
}

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
