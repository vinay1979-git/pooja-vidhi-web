#!/usr/bin/env node
/**
 * Adds the two closing steps the video has and the database did not, and
 * introduces pooja MODES so a multi-day observance can be driven.
 *
 * Sathya Vadyar's Ganesha Chaturthi video ends:
 *   ... Manthra Pushpam -> ARGYA PRADHANAM -> PUNAR POOJA
 * and his Varalakshmi video ends:
 *   ... Dakshina Dhana -> KSHEERA ARGYAM -> NEXT DAY POONAR POOJA
 *
 * Both samagri lists call for "raw milk for argyam", so the arghyam is the
 * ksheerarghya given to the deity, placed after Mantra Pushpam and before the
 * closing. Mantras are the three verses of the Tamil Smartha paddhati; the
 * Udvasanam verse is the standard yajnena yajnam.
 *
 * MODES. Ganesha Chaturthi is kept for one, three, five, seven, nine or eleven
 * days. Day one is the full pooja. Later days are a Punar Pooja, an abbreviated
 * repeat: the deity is already installed, so Avahanam and Prana Pratishtha are
 * not repeated. The last day adds Udvasanam, moving the image to release the
 * invoked presence before immersion.
 *
 *   node scripts/add-closing-steps.mjs --emit > supabase/migrations/0009_closing_steps_and_modes.sql
 */

import Sanscript from '@indic-transliteration/sanscript';

const MISPLACED = /([க-ஹ])([ா-்]*)([ரல])([ா-்]*)([²³⁴])/g;
const fixSup = (t) => { let p; let c = t; do { p = c; c = c.replace(MISPLACED, '$1$2$5$3$4'); } while (c !== p); return c; };
const tidy = (t) => t.replace(/[௃௄]/g, '').replace(/ஃ/g, '꞉').replace(/'/g, '');
const PROTECTED = /(\[[A-Z0-9_]+\]|[।॥])/;
const tr = (text, to) =>
  String(text).split(PROTECTED).map((part) => {
    if (part === '' || PROTECTED.test(part)) return part;
    const d = Sanscript.t(part, 'devanagari', to);
    return to.startsWith('tamil') ? tidy(fixSup(d)) : d;
  }).join('');

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

// Which modes each existing step belongs to.
//   main     day one, the full pooja
//   punar    a later day's abbreviated repeat
//   udvasana the final day's release
const MODES = {
  'Achamanam': ['main', 'punar', 'udvasana'],
  'Anga Vandanam': ['main', 'punar'],
  'Vighneshwara Dhyanam': ['main', 'punar'],
  'Pranayamam': ['main', 'punar'],
  'Sankalpam': ['main', 'punar', 'udvasana'],
  'Kalasha Pooja': ['main', 'punar'],
  'Ghanta Pooja': ['main', 'punar', 'udvasana'],
  // The deity is invoked once. Later days do not re-invoke or re-install.
  'Avahanam & Asanam': ['main'],
  'Padyam & Arghyam': ['main', 'punar'],
  'Snanam & Vastram': ['main', 'punar'],
  'Gandham, Kumkumam & Pushpam': ['main', 'punar'],
  'Anga Pooja': ['main', 'punar'],
  'Pushpa Pooja (Archana)': ['main', 'punar'],
  'Dhoopam & Deepam': ['main', 'punar', 'udvasana'],
  'Naivedyam': ['main', 'punar', 'udvasana'],
  'Karpura Neerajanam': ['main', 'punar', 'udvasana'],
  'Mantra Pushpam & Namaskaram': ['main', 'punar', 'udvasana'],
  'Kshama Prarthana & Conclusion': ['main', 'punar', 'udvasana'],
};

const NEW_STEPS = [
  {
    title_en: 'Ksheera Arghyam',
    title_ta: 'க்ஷீர அர்க்யம்',
    at: 18, // after Mantra Pushpam, before Kshama Prarthana
    phase: 'uttara',
    modes: ['main', 'punar', 'udvasana'],
    instruction_en:
      'Mix a little water into raw milk. Holding the uddharani, pour the arghyam three times after each of the three verses, nine pourings in all. This is offered to Ganesha, not to the moon; the moon is deliberately not looked at today.',
    instruction_ta:
      'பச்சைப் பாலில் சிறிது நீர் கலக்கவும். உத்தரிணியால், மூன்று ஸ்லோகங்களில் ஒவ்வொன்றுக்கும் பின் மூன்று முறை வீதம், மொத்தம் ஒன்பது முறை அர்க்யம் விடவும். இது விநாயகருக்கு சமர்ப்பிக்கப்படுகிறது; இன்று சந்திரனைப் பார்க்கக் கூடாது.',
    deva:
      'गौर्यङ्गमल सम्भूत ज्येष्ठस्वामिन् गणेश्वर । गृहाणार्घ्यं मया दत्तं गजवक्त्र नमोऽस्तु ते ॥ ' +
      'अर्घ्यं गृहाण हेरम्ब सर्व सिद्धि प्रदायक । विनायक मया दत्तं पुष्पाक्षत समन्वितम् ॥ ' +
      'विनायक नमस्तेऽस्तु गन्ध पुष्पाक्षतैर्युतम् । गृहाणार्घ्यं मया दत्तं सर्वाभीष्ट प्रदो भव ॥ ' +
      'आनेन अर्घ्य प्रदानेन भगवान् सर्वात्मकः सिद्धि विनायकः प्रीयताम् ॥',
    philosophy_en:
      'Arghyam is the water offered to an honoured guest on arrival and again on leaving. Giving it in milk at the close returns the hospitality the whole pooja has been: the guest is seen out as carefully as he was received.',
    source_ref: 'Sathya Vadyar, Ganesha Chaturthi 2026; Tamil Smartha ksheerarghya pradanam',
  },
  {
    title_en: 'Udvasanam',
    title_ta: 'உத்வாசனம்',
    at: 20, // last
    phase: 'uttara',
    modes: ['udvasana'],
    instruction_en:
      'On the final day only. Move the idol slightly from its seat to release the presence invoked into it at Prana Pratishtha, then take leave. A clay image is immersed afterwards; a permanent metal idol or a photograph is not immersed, only moved.',
    instruction_ta:
      'இறுதி நாளில் மட்டும். பிராண பிரதிஷ்டையில் எழுந்தருளச் செய்த சாந்நித்தியத்தை விடுவிக்க, விக்கிரகத்தை அதன் இடத்திலிருந்து சிறிது நகர்த்தி விடைபெறவும். களிமண் விக்கிரகம் பின்னர் கரைக்கப்படும்; நிரந்தர உலோக விக்கிரகமோ படமோ கரைக்கப்படுவதில்லை, நகர்த்தப்படுகிறது மட்டுமே.',
    deva:
      'यज्ञेन यज्ञमयजन्त देवाः तानि धर्माणि प्रथमान्यासन् । ' +
      'श्री महागणपतये नमः यथास्थानं उद्वासयामि ॥',
    philosophy_en:
      'Prana Pratishtha made the clay a living presence, so something has to formally end that. Without Udvasanam the pooja is not closed. It is the step the diaspora most often does not know exists.',
    source_ref: 'Tamil Smartha paddhati; Sathya Vadyar Punar Pooja chapter',
  },
];

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out('-- =============================================================================');
out('-- 0009_closing_steps_and_modes.sql');
out('--');
out('-- GENERATED by scripts/add-closing-steps.mjs.');
out('--');
out('-- Adds Ksheera Arghyam and Udvasanam, both of which Sathya Vadyar performs');
out('-- and neither of which was in the database, and introduces pooja modes so a');
out('-- multi-day observance can be driven:');
out('--   main      day one, the full pooja');
out('--   punar     a later day, abbreviated: the deity is already installed, so');
out('--             Avahanam and Prana Pratishtha are not repeated');
out('--   udvasana  the final day, which adds the release');
out('-- Idempotent.');
out('-- =============================================================================');
out('');
out('begin;');
out('');
out(`alter table public.pooja_steps
  add column if not exists modes text[] not null default '{main}';`);
out('');
out('comment on column public.pooja_steps.modes is');
out("  'Which pooja modes include this step: main, punar, udvasana.';");
out('');

out('-- --- tag the existing steps ------------------------------------------------');
for (const [title, modes] of Object.entries(MODES)) {
  out(`update public.pooja_steps set modes = '{${modes.join(',')}}'
where pooja_id = 'ganesha_standard' and step_title_en = ${q(title)};`);
}
out('');

out('-- --- make room, then insert -------------------------------------------------');
out(`-- Ksheera Arghyam belongs after Mantra Pushpam and before the closing, so the
-- existing closing step moves from 18 to 19. Shift via negatives to dodge the
-- unique constraint on (pooja_id, step_number).`);
out(`update public.pooja_steps set step_number = -19
where pooja_id = 'ganesha_standard' and step_number = 18;`);
out(`update public.pooja_steps set step_number = 19
where pooja_id = 'ganesha_standard' and step_number = -19;`);
out('');

for (const s of NEW_STEPS) {
  out(`-- ${s.at}. ${s.title_en}`);
  out(`insert into public.pooja_steps
  (pooja_id, step_number, phase, modes, step_title_en, step_title_ta,
   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,
   philosophy_en, gender_rule, scripts_generated, source_ref)
values ('ganesha_standard', ${s.at}, ${q(s.phase)}, '{${s.modes.join(',')}}',
        ${q(s.title_en)}, ${q(s.title_ta)},
        ${q(s.instruction_en)},
        ${q(s.instruction_ta)},
        ${q(s.deva)},
        ${q(tr(s.deva, 'tamil'))},
        ${q(tr(s.deva, 'iast'))},
        ${q(s.philosophy_en)}, 'all', true, ${q(s.source_ref)})
on conflict (pooja_id, step_number) do update set
  step_title_en = excluded.step_title_en,
  step_title_ta = excluded.step_title_ta,
  instruction_en = excluded.instruction_en,
  instruction_ta = excluded.instruction_ta,
  mantra_sanskrit = excluded.mantra_sanskrit,
  mantra_tamil = excluded.mantra_tamil,
  mantra_translit = excluded.mantra_translit,
  philosophy_en = excluded.philosophy_en,
  modes = excluded.modes,
  phase = excluded.phase,
  source_ref = excluded.source_ref;`);
  out('');
  console.error(`${s.at}. ${s.title_en} [${s.modes.join(', ')}]`);
  console.error(`   tamil: ${tr(s.deva, 'tamil').slice(0, 72)}...`);
}

out('commit;');
out('');
out('-- Verify:');
out('--   select step_number, step_title_en, modes from pooja_steps order by step_number;');
out("--   select count(*) from pooja_steps where 'main' = any(modes);      -- 19");
out("--   select count(*) from pooja_steps where 'punar' = any(modes);     -- 18");
out("--   select count(*) from pooja_steps where 'udvasana' = any(modes);  -- 10");

if (!emit) console.error('\n(no SQL written; pass --emit)');
