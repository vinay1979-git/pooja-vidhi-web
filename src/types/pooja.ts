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

export interface Pooja {
  id: string;
  title_en: string;
  title_ta: string;
  samagri_list?: (string | SamagriItem)[];
  naivedyam_suggestions?: (string | NaivedyamItem)[];
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
  gender_target?: 'all' | 'male' | 'female';
  philosophy_en?: string;
}
