import type { InstructionLang } from '@/lib/preferences';

/**
 * Every word of chrome, in one language at a time.
 *
 * The viewer used to print its labels bilingually -- "Sacred Mantra / வேதம் &
 * ஸ்லோகம்", "Meaning / அர்த்தம்", "Performed By / வழிபாடு செய்பவர்" -- about
 * twenty-five of them. The instruction toggle switched the instruction FIELD and
 * nothing else, so a reader who picked Tamil still met English in every heading,
 * and a reader who picked English met Tamil in every heading. Both of them were
 * reading half a screen they had not asked for.
 *
 * That was tolerable with two languages. It does not survive a third: every
 * label would have to carry every language at once, and the headings would be
 * longer than the content under them.
 *
 * So the instruction language now governs ALL prose the app writes itself. It
 * deliberately does NOT govern the mantra, which has its own script control --
 * someone may well want the instructions in Tamil and the mantra in Devanagari,
 * and that is the normal case rather than an edge one.
 *
 * ADDING A LANGUAGE: add the code to InstructionLang in preferences.tsx, then
 * add one block here. TypeScript will then refuse to build until every key is
 * present, which is the point of the Record<InstructionLang, ...> type rather
 * than a looser lookup.
 */

export interface UiText {
  /* chrome */
  catalog: string;
  settings: string;
  instructionLanguage: string;
  mantraScript: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  close: string;

  /* navigation */
  stepOf: (n: number, total: number) => string;
  previous: string;
  nextStep: string;
  startPooja: string;
  finish: string;

  /* preparation screen */
  ritualPreparation: string;
  prepLede: string;
  prepWho: string;
  prepWhere: string;
  prepWhat: string;
  sankalpamSettings: string;
  whichDay: string;
  performedBy: string;
  male: string;
  female: string;
  couple: string;
  poojaDate: string;
  cityLocation: string;
  detectLocation: string;
  verify: string;
  devoteeName: string;
  gotra: string;
  samagri: string;
  naivedyamSuggestions: string;

  /* step screen */
  sacredMantra: string;
  meaning: string;
  spiritualSignificance: string;
  spiritualSignificanceSub: string;
  dynamicSankalpam: string;
  offerings: string;
  offer: string;
  offered: string;
  offeredCount: (done: number, total: number) => string;
  sameMantraEach: string;
  ifUnavailable: (what: string) => string;
  poojaComplete: string;

  /* the honest gap */
  noTranslationYet: string;
}

const en: UiText = {
  catalog: 'Catalog',
  settings: 'Settings',
  instructionLanguage: 'Instructions',
  mantraScript: 'Mantra script',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  close: 'Close',

  stepOf: (n, total) => `Step ${n} of ${total}`,
  previous: 'Previous',
  nextStep: 'Next Step',
  startPooja: 'Start Pooja',
  finish: 'Finish',

  ritualPreparation: 'Ritual Preparation',
  prepLede: 'Work down this page before you begin. The button to start is at the end of it.',
  prepWho: 'Who is performing, and which day',
  prepWhere: 'Your location, for the Sankalpam',
  prepWhat: 'Samagri and naivedyam',
  sankalpamSettings: 'Sankalpam & Location',
  whichDay: 'Which day?',
  performedBy: 'Performed by',
  male: 'Male',
  female: 'Female',
  couple: 'Couple',
  poojaDate: 'Pooja date',
  cityLocation: 'City / Location',
  detectLocation: 'Detect GPS Location',
  verify: 'Verify',
  devoteeName: 'Devotee name',
  gotra: 'Gotra (Gothram)',
  samagri: 'Samagri',
  naivedyamSuggestions: 'Naivedyam suggestions',

  sacredMantra: 'Sacred Mantra',
  meaning: 'Meaning',
  spiritualSignificance: 'Why We Do This',
  spiritualSignificanceSub: 'Philosophical roots and symbolic meaning',
  dynamicSankalpam: 'Dynamic Sankalpam',
  offerings: 'Offerings',
  offer: 'Offer',
  offered: 'Offered',
  offeredCount: (done, total) => `${done} of ${total} offered`,
  sameMantraEach: 'The same mantra for each',
  ifUnavailable: (what) => `If unavailable: ${what}`,
  poojaComplete: 'Pooja Sampoornam!',

  noTranslationYet: 'No Tamil text for this step yet — showing English.',
};

const ta: UiText = {
  catalog: 'பட்டியல்',
  settings: 'அமைப்புகள்',
  instructionLanguage: 'விளக்க மொழி',
  mantraScript: 'மந்திர எழுத்து',
  theme: 'தோற்றம்',
  themeLight: 'ஒளி',
  themeDark: 'இருள்',
  close: 'மூடு',

  stepOf: (n, total) => `படி ${n} / ${total}`,
  previous: 'முந்தைய',
  nextStep: 'அடுத்த படி',
  startPooja: 'பூஜையைத் தொடங்கு',
  finish: 'நிறைவு',

  ritualPreparation: 'தயாரிப்பு',
  prepLede:
    'பூஜையைத் தொடங்கும் முன் இந்தப் பக்கத்தை முழுவதும் பார்க்கவும். தொடங்கும் பொத்தான் இறுதியில் உள்ளது.',
  prepWho: 'யார் செய்கிறார், எந்த நாள்',
  prepWhere: 'இடம், சங்கல்பத்திற்கு',
  prepWhat: 'சாமக்ரி மற்றும் நைவேத்யம்',
  sankalpamSettings: 'சங்கல்பம் & இடம்',
  whichDay: 'எந்த நாள்?',
  performedBy: 'வழிபாடு செய்பவர்',
  male: 'ஆண்',
  female: 'பெண்',
  couple: 'தம்பதி',
  poojaDate: 'பூஜை நாள்',
  cityLocation: 'ஊர் / இடம்',
  detectLocation: 'இடத்தைக் கண்டறி',
  verify: 'சரிபார்',
  devoteeName: 'பக்தர் பெயர்',
  gotra: 'கோத்ரம்',
  samagri: 'சாமக்ரி',
  naivedyamSuggestions: 'நைவேத்ய பரிந்துரைகள்',

  sacredMantra: 'வேதம் & ஸ்லோகம்',
  meaning: 'அர்த்தம்',
  spiritualSignificance: 'ஏன் இதைச் செய்கிறோம்',
  spiritualSignificanceSub: 'தத்துவ விளக்கமும் உள்ளர்த்தமும்',
  dynamicSankalpam: 'சங்கல்பம்',
  offerings: 'சமர்ப்பணங்கள்',
  offer: 'சமர்ப்பி',
  offered: 'சமர்ப்பித்தாயிற்று',
  offeredCount: (done, total) => `${total}-இல் ${done} சமர்ப்பித்தாயிற்று`,
  sameMantraEach: 'ஒவ்வொன்றுக்கும் இந்த மந்திரம்',
  ifUnavailable: (what) => `கிடைக்கவில்லையெனில்: ${what}`,
  poojaComplete: 'பூஜை பூர்த்தி!',

  // Shown when the DATA has no Tamil, not when the chrome has none. The chrome
  // above is always complete; some step content is not yet translated.
  noTranslationYet: 'இந்தப் படிக்கு தமிழ் விளக்கம் இன்னும் இல்லை. ஆங்கிலம் காட்டப்படுகிறது.',
};

const TABLE: Record<InstructionLang, UiText> = { en, ta };

export function uiText(lang: InstructionLang): UiText {
  return TABLE[lang] ?? en;
}
