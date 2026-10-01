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
  /** The way back to the two catalogues. "Catalog" was library furniture. */
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
  /** The prefix in the step-jump list, where the total is already obvious. */
  stepNumber: (n: number) => string;
  skipped: string;
  previous: string;
  nextStep: string;
  /**
   * The chrome must not call the rite a pooja.
   *
   * Sandhyavandanam is a nitya karma, not a pooja, and the buttons said "Start
   * Pooja" and "Complete Pooja" over it regardless. The page header already
   * names the rite -- SANDHYAVANDANAM, in capitals, at the top -- so the
   * surrounding furniture does not need to restate the category and is simply
   * wrong when it guesses. Generic here rather than conditional on
   * ritual_class: a button that reads "Begin" is right for every rite that will
   * ever be added, where a branch is right until the next kind of rite arrives.
   */
  beginRite: string;
  completeRite: string;
  finish: string;

  /* preparation screen */
  ritualPreparation: string;
  prepLede: string;
  prepWho: string;
  prepWhere: string;
  prepWhat: string;
  sankalpamSettings: string;
  whichDay: string;
  /** The same question for a rite whose modes are sittings, not days. */
  whichSitting: string;
  /** The first line of the preparation checklist, for such a rite. */
  prepWhoSitting: string;
  /** ...and when the karta toggle is hidden too, so there is only one choice. */
  prepSittingOnly: string;
  /**
   * The heading over the karta buttons, in the form that matches the selection.
   *
   * Karta is the masculine nominative of the stem kartR. A woman performing is
   * a kartri -- Whitney: the feminine of a -tR agent noun is made with -ii, as
   * daatR gives daatrii -- and a husband and wife performing together are the
   * dampati, which is the word the tradition uses for the pair and is itself
   * already dual. So the heading inflects rather than calling every karta by
   * the masculine form.
   */
  kartaHeading: (who: 'male' | 'female' | 'couple') => string;
  /** That word on its own, for prose that has to name it mid-sentence. */
  kartaTerm: (who: 'male' | 'female' | 'couple') => string;
  male: string;
  female: string;
  couple: string;
  /** Badge under the karta this rite is traditionally performed by. */
  recommended: string;
  /**
   * The line under the karta buttons, when the rite recommends one.
   * `who` is the button word ("Female"), `term` the Sanskrit one ("Kartri").
   */
  kartaRecommendation: (who: string, term: string) => string;
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
  /** Sampoornam, with no "Pooja" in front of it. See beginRite. */
  riteComplete: string;

  /**
   * The preparation checklist. These were hardcoded English in the JSX rather
   * than living here, which is why the heading could say "Pooja Samagri
   * Checklist" over a rite that is not a pooja without anything noticing: a
   * string that never passes through this table is a string nobody reviews
   * when the vocabulary changes.
   */
  samagriChecklist: string;
  samagriCollected: (done: number, total: number) => string;
  checkAll: string;
  resetList: string;
  preparationProgress: string;
  naivedyamSub: string;

  /** Heading over the pooja-level "why is this kept at all" card. */
  whyWeDoIt: string;

  /* steps sheet and resuming */
  /** Title of the sheet that lists every step. */
  stepsTitle: string;
  /** The three sections of a rite, as pooja_steps.phase names them. */
  phasePurvangam: string;
  phasePradhana: string;
  phaseUttara: string;
  /** The preparation-screen offer to pick up where you stopped. */
  resumeHeading: (step: number, total: number, title: string) => string;
  resumeContinue: string;
  resumeStartOver: string;
  /** Opens the step sheet from the preparation screen. */
  browseSteps: string;

  /* the honest gap */
  noTranslationYet: string;
}

/**
 * What to call the person performing, in the form that fits who they are.
 *
 * KARTA is the masculine nominative singular of the agent stem kartR, so
 * calling a woman the karta is not a neutral choice but a masculine one. The
 * feminine is KARTRI: Whitney's rule for the -tR agent nouns is that the
 * feminine stem is made with -ii -- daatR gives daatrii, netR gives netrii --
 * so kartR gives kartrii, कर्त्री.
 *
 * DAMPATI for the two of them together. The strict dual of the agent noun would
 * be kartaarau, "the two doers", but dampati is the word the tradition actually
 * uses for a husband and wife acting as one -- etymologically the joint owners
 * of a household, and the unit the grihya sutras make responsible for the five
 * daily yajnas. It is already a dual, so it needs no help to mean both of them.
 * The Tamil side has said thampathi all along.
 *
 * NOT romanised in IAST here, unlike the mantra columns. These are chrome, read
 * at a glance by someone who is about to light a lamp, and kartrii with its
 * macrons would be the only word on the screen wearing them.
 */
const KARTA_TERM_EN = { male: 'Karta', female: 'Kartri', couple: 'Dampati' } as const;
const KARTA_TERM_TA = { male: 'கர்த்தா', female: 'கர்த்ரீ', couple: 'தம்பதி' } as const;

const en: UiText = {
  catalog: 'Home',
  settings: 'Settings',
  instructionLanguage: 'Instructions',
  mantraScript: 'Mantra script',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  close: 'Close',

  stepOf: (n, total) => `Step ${n} of ${total}`,
  stepNumber: (n) => `Step ${n}`,
  skipped: 'Skipped',
  previous: 'Previous',
  nextStep: 'Next Step',
  beginRite: 'Begin',
  completeRite: 'Complete',
  finish: 'Finish',

  ritualPreparation: 'Ritual Preparation',
  prepLede: 'Work down this page before you begin. The button to start is at the end of it.',
  prepWho: 'The karta, and which day',
  prepWhere: 'Your location, for the Sankalpam',
  prepWhat: 'Samagri and naivedyam',
  sankalpamSettings: 'Sankalpam & Location',
  whichDay: 'Which day?',
  whichSitting: 'Which sitting?',
  prepWhoSitting: 'The karta, and which sitting',
  prepSittingOnly: 'Which sitting you are keeping',
  kartaHeading: (who) => `${KARTA_TERM_EN[who]} — who is performing`,
  kartaTerm: (who) => KARTA_TERM_EN[who],
  male: 'Male',
  female: 'Female',
  couple: 'Couple',
  recommended: 'Recommended',
  kartaRecommendation: (who, term) =>
    `Traditionally kept by a ${who.toLowerCase()} karta, so ${term} is pre-selected. It is a recommendation, not a rule — choose whichever fits your household.`,
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
  riteComplete: 'Sampoornam!',
  samagriChecklist: 'Samagri Checklist',
  samagriCollected: (done, total) => `Collected ${done} of ${total} items`,
  checkAll: 'Check All',
  resetList: 'Reset',
  preparationProgress: 'Preparation Progress',
  naivedyamSub: 'Sacred food offerings for this rite',

  whyWeDoIt: 'Why we do it',
  stepsTitle: 'Steps',
  phasePurvangam: 'Purvangam — the opening',
  phasePradhana: 'Pradhana — the worship itself',
  phaseUttara: 'Uttara — the closing',
  resumeHeading: (step, total, title) => `You stopped at step ${step} of ${total} — ${title}`,
  resumeContinue: 'Continue',
  resumeStartOver: 'Start over',
  browseSteps: 'See all the steps',
  noTranslationYet: 'No Tamil text for this step yet — showing English.',
};

const ta: UiText = {
  catalog: 'முகப்பு',
  settings: 'அமைப்புகள்',
  instructionLanguage: 'விளக்க மொழி',
  mantraScript: 'மந்திர எழுத்து',
  theme: 'தோற்றம்',
  themeLight: 'ஒளி',
  themeDark: 'இருள்',
  close: 'மூடு',

  stepOf: (n, total) => `படி ${n} / ${total}`,
  stepNumber: (n) => `படி ${n}`,
  skipped: 'தவிர்க்கப்பட்டது',
  previous: 'முந்தைய',
  nextStep: 'அடுத்த படி',
  beginRite: 'தொடங்கு',
  completeRite: 'நிறைவு',
  finish: 'நிறைவு',

  ritualPreparation: 'தயாரிப்பு',
  prepLede:
    'பூஜையைத் தொடங்கும் முன் இந்தப் பக்கத்தை முழுவதும் பார்க்கவும். தொடங்கும் பொத்தான் இறுதியில் உள்ளது.',
  prepWho: 'கர்த்தா, எந்த நாள்',
  prepWhere: 'இடம், சங்கல்பத்திற்கு',
  prepWhat: 'சாமக்ரி மற்றும் நைவேத்யம்',
  sankalpamSettings: 'சங்கல்பம் & இடம்',
  whichDay: 'எந்த நாள்?',
  whichSitting: 'எந்த வேளை?',
  prepWhoSitting: 'கர்த்தா, எந்த வேளை',
  prepSittingOnly: 'எந்த வேளை அனுஷ்டிக்கிறீர்கள்',
  kartaHeading: (who) => `${KARTA_TERM_TA[who]} — யார் செய்கிறார்`,
  kartaTerm: (who) => KARTA_TERM_TA[who],
  male: 'ஆண்',
  female: 'பெண்',
  couple: 'தம்பதி',
  recommended: 'பரிந்துரை',
  kartaRecommendation: (who, term) =>
    `இந்த வழிபாடு மரபாக ${who} கர்த்தாவால் செய்யப்படுகிறது; எனவே ${term} முன்னே தேர்ந்தெடுக்கப்பட்டுள்ளது. இது ஒரு பரிந்துரையே, கட்டாயம் அல்ல — உங்கள் குடும்பத்திற்கு ஏற்றதைத் தேர்ந்தெடுக்கவும்.`,
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
  riteComplete: 'பூர்த்தி!',
  samagriChecklist: 'சாமக்ரி பட்டியல்',
  samagriCollected: (done, total) => `${total} இல் ${done} சேகரிக்கப்பட்டது`,
  checkAll: 'அனைத்தையும் தேர்வு',
  resetList: 'மீட்டமை',
  preparationProgress: 'தயாரிப்பு நிலை',
  naivedyamSub: 'இந்தச் சடங்கிற்கான நைவேத்தியங்கள்',

  // Shown when the DATA has no Tamil, not when the chrome has none. The chrome
  // above is always complete; some step content is not yet translated.
  whyWeDoIt: 'ஏன் இந்த வழிபாடு',
  stepsTitle: 'படிகள்',
  phasePurvangam: 'பூர்வாங்கம் — தொடக்கம்',
  phasePradhana: 'ப்ரதானம் — மூல வழிபாடு',
  phaseUttara: 'உத்தரம் — நிறைவு',
  resumeHeading: (step, total, title) =>
    `${total}-இல் ${step}-வது படியில் நிறுத்தினீர்கள் — ${title}`,
  resumeContinue: 'தொடர்க',
  resumeStartOver: 'முதலிலிருந்து',
  browseSteps: 'எல்லா படிகளையும் பார்',
  noTranslationYet: 'இந்தப் படிக்கு தமிழ் விளக்கம் இன்னும் இல்லை. ஆங்கிலம் காட்டப்படுகிறது.',
};

const TABLE: Record<InstructionLang, UiText> = { en, ta };

export function uiText(lang: InstructionLang): UiText {
  return TABLE[lang] ?? en;
}
