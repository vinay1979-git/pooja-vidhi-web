#!/usr/bin/env node
/**
 * Tamil step titles and instructions.
 *
 * Switching the instruction language to Tamil did nothing visible because
 * step_title_ta and instruction_ta were null on all 18 rows. Transliteration
 * cannot fix that: these are English prose, so they need translating.
 *
 * The titles are standard Tamil ritual terms and are safe. The instructions are
 * a careful draft and are marked as such in source_ref, because a mistranslated
 * ritual direction is worse than an English one. A vaidika should read them
 * before this is called finished.
 *
 *   node scripts/tamil-content.mjs --emit > supabase/migrations/0006_tamil_content.sql
 */

const ROWS = [
  {
    en: 'Achamanam',
    ta: 'ஆசமனம்',
    instruction:
      'கிழக்கு நோக்கி அமரவும். பஞ்சபாத்திரத்திலிருந்து உத்தரிணியால் சிறிது நீரை வலது உள்ளங்கையில் எடுத்து, ஒவ்வொரு நாமத்தையும் சொல்லிய பின் அருந்தவும். உதடுகள் கையில் படாமல் உள்ளே இழுத்துக் கொள்ளவும்.',
  },
  {
    en: 'Anga Vandanam',
    ta: 'அங்க வந்தனம்',
    instruction:
      'வலது கையால், விஷ்ணுவின் பன்னிரண்டு நாமங்களைச் சொல்லியபடி உடலின் பின்வரும் இடங்களைத் தொடவும்: 1. கேசவாய நம: (வலது கன்னம், கட்டைவிரல்) 2. நாராயணாய (இடது கன்னம், கட்டைவிரல்) 3. மாதவாய (வலது கண், மோதிரவிரல்) 4. கோவிந்தாய (இடது கண், மோதிரவிரல்) 5. விஷ்ணவே (வலது நாசி, ஆள்காட்டிவிரல்) 6. மதுசூதனாய (இடது நாசி, ஆள்காட்டிவிரல்) 7. த்ரிவிக்ரமாய (வலது காது, சுண்டுவிரல்) 8. வாமனாய (இடது காது, சுண்டுவிரல்) 9. ஸ்ரீதராய (வலது தோள், நடுவிரல்) 10. ஹ்ருஷீகேசாய (இடது தோள், நடுவிரல்) 11. பத்மநாபாய (மார்பு, அனைத்து விரல்கள்) 12. தாமோதராய (தலை உச்சி, அனைத்து விரல்கள்).',
  },
  {
    en: 'Vighneshwara Dhyanam',
    ta: 'விக்னேஸ்வர த்யானம்',
    instruction:
      'இரு கைகளின் விரல் மூட்டுகளால் நெற்றிப் பொட்டுகளில் ஐந்து முறை மெல்லத் தட்டியபடி இந்த கணபதி மந்திரத்தைச் சொல்லவும்.',
  },
  {
    en: 'Pranayamam',
    ta: 'ப்ராணாயாமம்',
    instruction:
      'கட்டைவிரலால் வலது நாசியை மூடி, இடது நாசி வழியாக மூச்சை உள்ளிழுக்கவும். இரு நாசிகளையும் மூடி மூச்சை நிறுத்தி, மனதிற்குள் மந்திரத்தைச் சொல்லவும். பின் வலது நாசி வழியாக மெல்ல வெளியிடவும்.',
  },
  {
    en: 'Sankalpam',
    ta: 'சங்கல்பம்',
    instruction:
      'வலது உள்ளங்கையில் சிறிது அட்சதையும் ஒரு துளி நீரும் வைத்து, இடது கையால் மூடி, வலது தொடையின் மீது வைத்துக் கொள்ளவும்.',
  },
  {
    en: 'Kalasha Pooja',
    ta: 'கலச பூஜை',
    instruction:
      'பஞ்சபாத்திரத்தின் மீது வலது கையை வைத்து, புனித நதிகளை அந்த நீரில் ஆவாஹனம் செய்யவும்.',
  },
  {
    en: 'Ghanta Pooja',
    ta: 'கண்டா பூஜை (மணி)',
    instruction:
      'இடது கையால் மணியை அடித்து, தெய்வ சாந்நித்தியத்தை வரவேற்று, தீய சக்திகளை விலக்கவும்.',
  },
  {
    en: 'Avahanam & Asanam',
    ta: 'ஆவாஹனம் & ஆசனம்',
    instruction:
      'அட்சதையும் மலர்களும் சமர்ப்பித்து, விக்கிரகத்தில் அல்லது மஞ்சள் பிள்ளையாரில் எழுந்தருளுமாறு கணபதியை வேண்டி, ஆசனம் அளிக்கவும்.',
  },
  {
    en: 'Padyam & Arghyam',
    ta: 'பாத்யம் & அர்க்யம்',
    instruction:
      'உத்தரிணியால் சிறிது நீரை இறைவனின் திருவடிகளுக்கு (பாத்யம்), பின் கைகளுக்கு (அர்க்யம்), பின் ஆசமனத்திற்கு (ஆசமனீயம்) சமர்ப்பிக்கவும். நீரைத் தனிப் பாத்திரத்தில் விடவும்.',
  },
  {
    en: 'Snanam & Vastram',
    ta: 'ஸ்நானம் & வஸ்திரம்',
    instruction:
      'சில துளி நீரைச் சமர்ப்பித்து அபிஷேகமாகக் கொள்ளவும். பின் வஸ்திரம் சமர்ப்பிக்கவும். துணி இல்லையெனில் அட்சதை அல்லது மலர்களைப் பயன்படுத்தவும்.',
  },
  {
    en: 'Gandham, Kumkumam & Pushpam',
    ta: 'கந்தம், குங்குமம் & புஷ்பம்',
    instruction:
      'சந்தனமும் குங்குமமும் சாற்றவும். அறுகம்புல் மற்றும் மலர்களால் அலங்கரிக்கவும்.',
  },
  {
    en: 'Anga Pooja',
    ta: 'அங்க பூஜை',
    instruction:
      'மந்திரம் சொல்லியபடி, இறைவனின் ஒவ்வொரு அங்கத்திற்கும் மலர் அல்லது அட்சதை சமர்ப்பிக்கவும்.',
  },
  {
    en: 'Pushpa Pooja (Archana)',
    ta: 'புஷ்ப பூஜை (அர்ச்சனை)',
    instruction:
      'ஒவ்வொரு நாமத்தின் முடிவிலும், "நம:" என்று சொல்லும்போது, ஒரு மலர் அல்லது சிறிது அட்சதை சமர்ப்பிக்கவும்.',
  },
  {
    en: 'Dhoopam & Deepam',
    ta: 'தூபம் & தீபம்',
    instruction:
      'ஊதுபத்தியைக் காட்டி (தூபம்), மணி அடித்து, நீர் சமர்ப்பிக்கவும். பின் ஏற்றிய தீபத்தைக் காட்டி (தீபம்), மணி அடித்து, நீர் சமர்ப்பிக்கவும்.',
  },
  {
    en: 'Naivedyam',
    ta: 'நைவேத்யம்',
    instruction:
      'நைவேத்தியப் பொருட்களின் மீது சிறிது நீரைத் தெளிக்கவும். வலது கையால் இறைவனை நோக்கி ஐந்து முறை முன்னோக்கி அசைத்தபடி மந்திரம் சொல்லவும்.',
  },
  {
    en: 'Karpura Neerajanam',
    ta: 'கற்பூர நீராஜனம்',
    instruction:
      'எழுந்து நிற்கவும். கற்பூரம் ஏற்றி, மணி அடித்தபடி இறைவனுக்கு முன் வட்டமாக ஆரத்தி காட்டவும்.',
  },
  {
    en: 'Mantra Pushpam & Namaskaram',
    ta: 'மந்திர புஷ்பம் & நமஸ்காரம்',
    instruction:
      'கூப்பிய கைகளில் மலர்களை வைத்து மந்திரம் சொல்லி, இறைவனின் திருவடிகளில் சமர்ப்பிக்கவும். பின் நின்ற இடத்திலேயே வலமாக மூன்று முறை சுற்றி நமஸ்காரம் செய்யவும்.',
  },
  {
    en: 'Kshama Prarthana & Conclusion',
    ta: 'க்ஷமா ப்ரார்த்தனை & நிறைவு',
    instruction:
      'மந்திரத்திலோ முறையிலோ ஏற்பட்ட குறைகளுக்கு மன்னிப்பு வேண்டி பூஜையை நிறைவு செய்யவும்.',
  },
];

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out('-- =============================================================================');
out('-- 0006_tamil_content.sql');
out('--');
out('-- GENERATED by scripts/tamil-content.mjs.');
out('--');
out('-- Fills step_title_ta and instruction_ta, which were null on all 18 rows.');
out('-- That is why switching the instruction language to Tamil changed nothing:');
out('-- there was no Tamil to switch to. Transliteration cannot help here, because');
out('-- these are English prose rather than Sanskrit in another script.');
out('--');
out('-- The titles are standard Tamil ritual terms. The instructions are a careful');
out('-- draft, marked as such in source_ref, and want a vaidika\'s eye before this');
out('-- is called finished: a mistranslated ritual direction is worse than an');
out('-- English one.');
out('-- Idempotent; safe to re-run.');
out('-- =============================================================================');
out('');
out('begin;');
out('');

for (const r of ROWS) {
  out(`update public.pooja_steps set
  step_title_ta = ${q(r.ta)},
  instruction_ta = ${q(r.instruction)},
  source_ref = coalesce(source_ref, 'Tamil draft, pending vaidika review')
where pooja_id = 'ganesha_standard' and step_title_en = ${q(r.en)};`);
  out('');
}

out('commit;');
out('');
out('-- Verify:');
out('--   select count(*) from pooja_steps where instruction_ta is null; -- expect 0');
out('--   select count(*) from pooja_steps where step_title_ta is null;  -- expect 0');

console.error(`rows: ${ROWS.length}`);
if (!emit) console.error('(no SQL written; pass --emit)');
