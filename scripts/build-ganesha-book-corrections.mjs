#!/usr/bin/env node
/**
 * The Ganesha pooja, corrected against a printed Tamil Smartha source.
 *
 *   node scripts/build-ganesha-book-corrections.mjs          # validate only
 *   node scripts/build-ganesha-book-corrections.mjs --emit   # write it
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi*, published by Giri. Scanned to PDF in
 * the user's Drive folder; the review that produced this migration is in
 * REVIEW-2026-09-26-book-vs-app.md beside it.
 *
 * WHY THIS IS DIFFERENT FROM EVERY OTHER GENERATOR HERE.
 *
 * Every other source in this project is a web page, read as text and proved by
 * round trip: convert Telugu or IAST to Devanagari, convert back, assert the
 * input returns. That proof does not exist for a photograph. These pages carry
 * no text layer; the Devanagari below was read off the image by eye. So the
 * discipline has to change shape:
 *
 *   - Nothing here is new liturgy pulled from nowhere. Every string is DIFFED
 *     against what the database already holds, and the diff is printed on a dry
 *     run so it can be checked line by line before it is emitted.
 *   - Where the book agrees with the existing text, that is two independent
 *     witnesses and the text does not move.
 *   - source_ref records the page AND says the text came from a photograph, so
 *     it never inherits the confidence of a round-tripped string.
 *
 * THE RULE APPLIED, because "correct it against the book" is ambiguous:
 *
 *   ADD what the book has and the app lacks.
 *   DO NOT REMOVE what the app has and the book lacks -- a shorter printed
 *     recension is not evidence that a longer recitation is wrong.
 *   REPLACE only where the book gives a direct alternative for the same slot,
 *     or where the app has a demonstrable defect.
 *
 * Each replacement is called out individually below with its reason. There are
 * four of them; everything else is an addition.
 */
import Sanscript from '@indic-transliteration/sanscript';
import { transliterate } from './_tamil.mjs';
import { checkScripts } from './_sources.mjs';
import { emitMigration } from './_migration.mjs';

let failed = false;
const fail = (m) => {
  failed = true;
  console.error(`  FAIL ${m}`);
};

const BOOK = 'Sampradaya Vratha Pooja Vidhi (Giri)';
/** Appended to every source_ref written here. */
const PHOTO =
  'Transcribed from a photograph of the printed page, so unlike the rest of this project it carries no round-trip proof; diffed line by line against the previous text before it was written.';

// -----------------------------------------------------------------------------
// The text, as the book prints it.
// -----------------------------------------------------------------------------

/**
 * 1. ACHAMANAM (book p.1)
 *
 * The book prints these as three full recitation lines, each with the pranava:
 * "ओं अच्युताय नमः  Om achyutaaya namaha". The app had them without it. This is
 * an addition, not a replacement -- the three names and their order already
 * agreed, which is itself the confirmation that the app was right to choose the
 * short acyuta-ananta-govinda form over the longer Smartha paddhati one.
 *
 * NOT changed: the Anga Vandanam that follows. The book prints those twelve as
 * bare stems -- "केशव - kEshava / Right cheek with the Thumb" -- but that is a
 * teaching layout pairing a name to a limb, not a recitation line; note it has
 * no नमः, where the achamanam lines all do. The app's "ॐ केशवाय नमः" is the
 * recited form. Flagged for a vaidika rather than changed on a typographic
 * argument.
 */
const ACHAMANAM = [
  'ॐ अच्युताय नमः ।',
  'ॐ अनन्ताय नमः ।',
  'ॐ गोविन्दाय नमः ।',
];

/**
 * 2. DHYANAM & AVAHANAM (book pp.55-56)
 *
 * The app had one dhyana verse of the three the book gives, and no आवाहयामि
 * object at all.
 *
 * REPLACEMENT 1: the second pada of the atraagachCHa verse. Book reads
 * "गीर्वाण सुरपूजित"; the app had "गौरीगर्भसमुद्भव", from the Telugu kalpam.
 * These are alternative second lines of one verse and cannot both stand. The
 * book wins because it is the Tamil Smartha recension this app is written for.
 * The displaced reading is recorded in source_ref.
 *
 * The restored "अस्मिन् मृत्तिकाबिम्बे" is the clause naming what the deity is
 * invoked INTO -- a clay image. Migration 0020 removed its sibling
 * "हरिद्राबिम्बे" as spurious; the book uses both, deliberately, for the two
 * different substances. See §4.5 of the review.
 */
const DHYANAM = [
  'करिष्ये गणनाथस्य व्रतं संपत्करं शुभम् ।',
  'भक्तानामिष्ट वरदं सर्वमङ्गल कारणम् ॥',
  'एकदन्तं शूर्पकर्णं गजवक्त्रं चतुर्भुजम् ।',
  'पाशाङ्कुशधरं देवं ध्यायेत् सिद्धिविनायकम् ॥',
  'ध्यायेद्गजाननं देवं तप्तकांचनसन्निभम् ।',
  'चतुर्भुजं महाकायं सर्वाभरणभूषितम् ॥',
  'अस्मिन् मृत्तिकाबिम्बे सिद्धिविनायकं ध्यायामि ।',
  'अत्रागच्छ जगद्वंद्य सुरराजार्चितेश्वर ।',
  'अनाथनाथ सर्वज्ञ गीर्वाण सुरपूजित ॥',
  'गणानां त्वा गणपतिं हवामहे कविं कवीनामुपमश्रवस्तमम् ।',
  'ज्येष्ठराजं ब्रह्मणां ब्रह्मणस्पत आ नः शृण्वन्नूतिभिः सीद सादनम् ॥',
  'अस्मिन् मृत्तिकाबिम्बे सिद्धिविनायकम् आवाहयामि ।',
  'मौक्तिकैः पुष्परागैश्च नानारत्नैर्विराजितम् ।',
  'रत्नसिंहासनं चारु प्रीत्यर्थं प्रतिगृह्यताम् ॥',
  'ॐ श्री सिद्धिविनायक स्वामिने नमः आसनं समर्पयामि ।',
];

/**
 * 3. NAIVEDYAM (book p.76, and the same frame at p.11-12 of the purvangam)
 *
 * Two additions and one replacement.
 *
 * ADDITION: "ॐ ब्रह्मणे स्वाहा". The book gives SIX offerings -- the five
 * pranas and then brahman -- and the app stopped at five, in both poojas.
 *
 * REPLACEMENT 2: "सत्यं त्वा ऋतेन" becomes "सत्यं त्वर्तेन". Same words; the
 * book applies the sandhi (tvā + ṛtena → tvartena) and the app did not.
 *
 * The evening form goes in variant_mantra_sanskrit, a column that already
 * exists and was unused here. The book labels the two explicitly (Morning) and
 * (Evening); a Ganesha pooja performed in the evening was reciting the wrong
 * one, with nothing on screen to say so.
 *
 * NOT removed: "अमृतमस्तु", which the book does not print. It is widely
 * recited and the rule above says a shorter printed recension is not evidence
 * against it.
 */
const SAVITA_MORNING = 'देवसवितः प्रसुव । सत्यं त्वर्तेन परिषिञ्चामि ।';
const SAVITA_EVENING = 'देवसवितः प्रसुव । ऋतं त्वा सत्येन परिषिञ्चामि ।';

const NAIVEDYAM_FRAME = [
  'ॐ भूर्भुवस्सुवः । तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।',
  'धियो यो नः प्रचोदयात् ॥',
  SAVITA_MORNING,
  'अमृतमस्तु । अमृतोपस्तरणमसि ।',
  'ॐ प्राणाय स्वाहा । ॐ अपानाय स्वाहा ।',
  'ॐ व्यानाय स्वाहा । ॐ उदानाय स्वाहा ।',
  'ॐ समानाय स्वाहा । ॐ ब्रह्मणे स्वाहा ।',
];

const GANESHA_NAIVEDYAM = [
  ...NAIVEDYAM_FRAME,
  'सुगंधान् सुकृतांश्चैव मोदकान् घृत पाचितान् ।',
  'नैवेद्यं गृह्यतां देव चणमुद्गैः प्रकल्पितान् ॥',
  'भक्ष्यं भोज्यं च लेह्यं च चोष्यं पानीयमेव च ।',
  'इदं गृहाण नैवेद्यं मया दत्तं विनायक ॥',
  'ॐ श्री सिद्धिविनायक स्वामिने नमः नैवेद्यं समर्पयामि ।',
  'मध्ये मध्ये पानीयं समर्पयामि ।',
  'अमृतापिधानमसि । उत्तरापोशनं समर्पयामि ।',
  'हस्तौ प्रक्षालयामि । पादौ प्रक्षालयामि ।',
  'शुद्धाचमनीयं समर्पयामि ।',
  'पूगीफलसमायुक्तं नागवल्लीदळैर्युतम् ।',
  'कर्पूरचूर्णसंयुक्तं तांबूलं प्रतिगृह्यताम् ॥',
  'ॐ श्री सिद्धिविनायक स्वामिने नमः तांबूलं समर्पयामि ।',
  'तांबूल चर्वणानंतरं आचमनीयं समर्पयामि ।',
];

/**
 * The Varalakshmi naivedyam gets the same two frame corrections, and one more.
 *
 * REPLACEMENT 3, and the only outright bug in this migration: its five prana
 * offerings were stored TWICE -- once broken across three lines and then again
 * all on one. Nothing in any source doubles them. Someone reciting from the
 * screen would have said them twice.
 */
const VARALAKSHMI_NAIVEDYAM = [
  ...NAIVEDYAM_FRAME,
  'नैवेद्यं षड्रसोपेतं दधि मध्वाज्य संयुतं ।',
  'नानाभक्ष्यफलोपेतं गृहाण हरिवल्लभे ॥',
  'श्री वरलक्ष्मी देवतायै नमः नैवेद्यं समर्पयामि ॥',
  'घनसार सुगंधेन मिश्रितं पुष्पवासितं ।',
  'पानीयं गृह्यतां देवी शीतलं सुमनोहरं ॥',
  'श्री वरलक्ष्मी देवतायै नमः पानीयं समर्पयामि ॥',
  'पूगीफल समायुक्तं नागवल्ली दळैर्युतं ।',
  'कर्पूर चूर्ण संयुक्तं तांबूलं प्रतिगृह्यतां ॥',
  'श्री वरलक्ष्मी देवतायै नमः तांबूलं समर्पयामि ॥',
  'मध्ये मध्ये पानीयं समर्पयामि ।',
  'अमृतापिधानमसि । उत्तरापोशनं समर्पयामि ।',
  'हस्तौ प्रक्षालयामि । पादौ प्रक्षालयामि ।',
  'शुद्धाचमनीयं समर्पयामि ।',
];

/**
 * 4. MANTRA PUSHPAM (book p.78)
 *
 * The largest wording defect found. The app labelled a Ganesha namaskara shloka
 * "Mantra Pushpam". The actual mantra pushpam is a Vedic passage from the
 * Taittiriya Aranyaka -- "यो(अ)पां पुष्पं वेद" -- and it appeared nowhere in
 * either pooja.
 *
 * This is an ADDITION, not a replacement: the verses the app had are a genuine
 * Ganesha pushpanjali (they end "अर्पयामि सुमांजलिम्", I offer this handful of
 * flowers) and the book's own text places a pushpanjali verse immediately after
 * the Vedic passage. Both stand; the Vedic core goes first, as the book has it.
 */
const MANTRA_PUSHPAM = [
  'योऽपां पुष्पं वेद, पुष्पवान् प्रजावान् पशुमान् भवति ।',
  'चन्द्रमा वा अपां पुष्पम्, पुष्पवान् प्रजावान् पशुमान् भवति ।',
  'य एवं वेद, योऽपामायतनं वेद, आयतनवान् भवति ॥',
  'जाती चंपक पुन्नाग मल्लिका वकुलादिभिः ।',
  'पुष्पांजलिं प्रदास्यामि गृहाण द्विरदानन ॥',
  'गणाधिप नमस्तेऽस्तु उमापुत्राघनाशन ।',
  'विनायकेशतनय सर्वसिद्धिप्रदायक ॥',
  'एकदंतैकवदन तथा मूषकवाहन ।',
  'कुमारगुरवे तुभ्यमर्पयामि सुमांजलिम् ॥',
  'ॐ श्री सिद्धिविनायक स्वामिने नमः मंत्रपुष्पं समर्पयामि ।',
];

/**
 * 5. SANKALPAM (book pp.12-13 for the frame, p.55 for the deity tail)
 *
 * REPLACEMENT 4: the clause order. The book opens with "ममोपात्त समस्त
 * दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं" and only then goes to "शुभे शोभने
 * मुहूर्ते" and the geography. The stored mantra had it the other way round --
 * and renderSankalpam() in src/lib/sankalpam.ts already builds it the book's
 * way, so the engine and the stored text disagreed on the same screen. The
 * engine was right.
 *
 * Additions: "शकाब्दे", and "प्रभवादीनां षष्ट्याः संवत्सराणां मध्ये", the
 * phrase that introduces the samvatsara and was missing entirely.
 *
 * "धैर्य" becomes "वीर्य", as the book has it.
 *
 * The purpose clauses swap order to match the book -- mangala before durita --
 * and the book's own deity tail from the Siddhivinayaka page is added: the
 * pooja is resolved for jnana and vairagya and for every wished-for fruit, and
 * the kalasha pooja is announced as a limb of it, which is what puts the
 * Kalasha Pooja in the step that follows.
 *
 * The existing "devatamuddishya / prityartham / kalpokta-prakarena yavacchakti
 * dhyanavahanadi shodashopachara-poojam karishye" is KEPT rather than displaced
 * by the book's shorter "siddhivinayaka poojam karishye". The first draft of
 * this migration replaced it, which broke the rule stated at the top of this
 * file within the same file: the book being shorter here is not evidence the
 * longer declaration is wrong, and this app really does perform the sixteen
 * upacharas that clause announces.
 */
const SANKALPAM = [
  'मम उपात्त समस्त दुरितक्षय द्वारा श्री परमेश्वर प्रीत्यर्थं',
  'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे',
  'वैवस्वत मन्वन्तरे अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे',
  'भरतवर्षे भरतखण्डे मेरोः दक्षिणे पार्श्वे शकाब्दे',
  'अस्मिन् वर्तमाने व्यावहारिके',
  'प्रभवादीनां षष्ट्याः संवत्सराणां मध्ये',
  '[DYNAMIC_PANCHANGAM_DATA]',
  'अस्माकं सहकुटुंबानां क्षेम स्थैर्य वीर्य विजय आयुरारोग्य ऐश्वर्याणां अभिवृद्ध्यर्थं,',
  'धर्मार्थकाममोक्ष चतुर्विध पुरुषार्थफल सिद्ध्यर्थं,',
  'पुत्रपौत्राभिवृद्ध्यर्थं,',
  'इष्टकाम्यार्थ सिद्ध्यर्थं,',
  'समस्त मंगळावाप्त्यर्थं,',
  'समस्त दुरितोपशांत्यर्थं,',
  'श्री सिद्धिविनायक प्रसादेन ज्ञान वैराग्य सिद्ध्यर्थं,',
  'मनोवांछित सकल अभीष्ट फलसिद्ध्यर्थं',
  'वरसिद्धिविनायक देवतामुद्दिश्य,',
  'वरसिद्धिविनायक प्रीत्यर्थं',
  'कल्पोक्तप्रकारेण यावच्छक्ति ध्यानावाहनादि षोडशोपचारपूजां करिष्ये ।',
  'तदंगं कलश पूजां च करिष्ये ॥',
];

// -----------------------------------------------------------------------------
// Build the three scripts, and check the fault classes this project has shipped.
// -----------------------------------------------------------------------------

const scripts = (deva) => {
  const o = {
    deva,
    ta: transliterate(Sanscript, deva, 'tamil'),
    iast: transliterate(Sanscript, deva, 'iast'),
  };
  return o;
};

const EDITS = [
  {
    pooja: 'ganesha_standard',
    step: 'Achamanam',
    deva: ACHAMANAM.join('\n'),
    ref: `${BOOK}, p.1, poorvaanga pooja step 1. The book prints all three with the pranava. Three-name acyuta-ananta-govinda form independently confirmed against the previous Tamil Smartha sourcing.`,
  },
  {
    pooja: 'ganesha_standard',
    step: 'Avahanam & Asanam',
    deva: DHYANAM.join('\n'),
    ref: `${BOOK}, pp.55-56, dhyaanam and aavaahanam. Adds the two dhyana verses the app lacked, the Vedic gaṇānāṃ tvā, and "asmin mṛttikābimbe" -- the clause naming the clay image the deity is invoked into. Second pada of the atrāgaccha verse follows the book's "gīrvāṇa surapūjita"; the previous text read "gaurīgarbhasamudbhava", from the Telugu kalpam, which is an alternative for the same slot.`,
  },
  {
    pooja: 'ganesha_standard',
    step: 'Naivedyam & Tambulam',
    deva: GANESHA_NAIVEDYAM.join('\n'),
    variant: SAVITA_EVENING,
    variantNote:
      'Recited in place of the morning line when the pooja is performed in the evening. The book prints the two forms side by side, labelled (Morning) and (Evening).',
    ref: `${BOOK}, p.76, naivedya mantras. Adds "ॐ ब्रह्मणे स्वाहा" -- the book gives six offerings, the app had five -- and applies the sandhi the book has in "satyaṃ tvartena". Placement of "deva savitaḥ prasuva" after the gāyatrī is confirmed against the book.`,
  },
  {
    pooja: 'varalakshmi_vratham',
    step: 'Naivedyam, Paniyam & Tambulam',
    deva: VARALAKSHMI_NAIVEDYAM.join('\n'),
    variant: SAVITA_EVENING,
    variantNote:
      'Recited in place of the morning line when the vratham is performed in the evening. The book prints the two forms side by side, labelled (Morning) and (Evening).',
    ref: `${BOOK}, p.76 and pp.11-12, the naivedya frame, which belongs to the act and not to the deity. Adds "ॐ ब्रह्मणे स्वाहा" and the sandhi in "satyaṃ tvartena". Also removes a duplicated block: the five prāṇa offerings were stored twice.`,
  },
  {
    pooja: 'ganesha_standard',
    step: 'Mantra Pushpam & Namaskaram',
    // The namaskara, pradakshina and prarthana blocks that follow are untouched
    // and are appended from the existing row by the migration, not restated
    // here -- see the SQL below.
    prepend: MANTRA_PUSHPAM.join('\n'),
    after: 'ॐ श्री सिद्धिविनायक स्वामिने नमः मंत्रपुष्पं समर्पयामि ।',
    ref: `${BOOK}, p.78, mantrapuSHpam. The step previously opened with a Ganesha namaskara shloka under the heading "Mantra Pushpam"; the actual mantra pushpam, the Taittirīya Āraṇyaka passage "yo'pāṃ puṣpaṃ veda", was absent from both poojas. The previous verses are kept -- they are a genuine pushpāñjali and the book places one in the same position -- with the Vedic passage before them, as the book has it.`,
  },
  {
    pooja: 'ganesha_standard',
    step: 'Sankalpam',
    deva: SANKALPAM.join('\n'),
    ref: `${BOOK}, pp.12-13 pradhaana poojaa sankalpaha, with the deity tail from p.55. Clause order follows the book, opening with "mama upātta … prītyarthaṃ" before the geography, which is also the order renderSankalpam() in src/lib/sankalpam.ts already used. Adds "śakābde" and "prabhavādīnāṃ ṣaṣṭyāḥ saṃvatsarāṇāṃ madhye". "dhairya" corrected to "vīrya". The book's generic "śubhayoga śubhakaraṇa" is NOT used: the panchangam engine computes and names the actual yoga and karana into [DYNAMIC_PANCHANGAM_DATA], which is the fuller of the two attested forms.`,
  },
];

console.log('--- building ---\n');
/**
 * checkScripts rejects latin letters outside the IAST field, which is right --
 * it is how "undefined" was once caught sitting inside a Devanagari mantra. The
 * panchangam slot is the one legitimate exception: it is a token the viewer
 * substitutes, deliberately carried through transliteration by PROTECTED. Mask
 * it for the check rather than weakening the check.
 */
const SLOT = /\[[A-Z0-9_]+\]/g;
const masked = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.replace(SLOT, '') : v]),
  );

const built = EDITS.map((e) => {
  const o = e.deva ? scripts(e.deva) : scripts(e.prepend);
  checkScripts(`${e.pooja}/${e.step}`, masked(o), fail);
  if (e.variant) {
    const v = scripts(e.variant);
    checkScripts(`${e.pooja}/${e.step} variant`, masked(v), fail);
    o.variantDeva = v.deva;
  }
  // The slot must survive into all three scripts or the viewer cannot
  // substitute the panchangam.
  if (e.deva && e.deva.includes('[DYNAMIC_PANCHANGAM_DATA]')) {
    for (const k of ['deva', 'ta', 'iast']) {
      if (!o[k].includes('[DYNAMIC_PANCHANGAM_DATA]')) {
        fail(`${e.step}.${k} lost the panchangam slot`);
      }
    }
  }
  console.log(`  ${e.pooja}/${e.step}: ${o.deva.split('\n').length} lines`);
  return { ...e, ...o };
});

if (failed) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// The diff. This is the substitute for the round trip.
// -----------------------------------------------------------------------------
//
// A round-tripped conversion proves itself. A line read off a photograph cannot,
// so the check is the other direction: show what is about to change against what
// production holds, and require a human to read it. Nothing here is new liturgy
// arriving from nowhere -- every line is either identical to the existing text,
// or a difference somebody has to agree with.
//
// Runs on the dry run, before --emit, and needs the live database.
async function printDiff() {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
  const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!U || !K) {
    console.log('\n(no .env.local; skipping the diff against live)');
    return;
  }
  const rows = await (
    await fetch(`${U}/rest/v1/pooja_steps?select=pooja_id,step_title_en,mantra_sanskrit`, {
      headers: { apikey: K, Authorization: `Bearer ${K}` },
    })
  ).json();
  const live = new Map(rows.map((r) => [`${r.pooja_id}::${r.step_title_en}`, r.mantra_sanskrit || '']));

  for (const e of built) {
    const before = (live.get(`${e.pooja}::${e.step}`) ?? '').split('\n');
    // The prepend case keeps everything already there, so the comparison is
    // against the new block alone rather than against the whole row.
    const after = e.prepend ? [...e.deva.split('\n'), ...before] : e.deva.split('\n');
    const keep = new Set(before);
    const had = new Set(after);
    const added = after.filter((l) => l && !keep.has(l));
    const removed = before.filter((l) => l && !had.has(l));
    console.log(`\n  ${e.pooja} / ${e.step}  (${before.length} -> ${after.length} lines)`);
    if (!added.length && !removed.length) {
      console.log('    unchanged');
      continue;
    }
    for (const l of removed) console.log(`    - ${l}`);
    for (const l of added) console.log(`    + ${l}`);
  }
}

if (!process.argv.includes('--no-diff')) {
  console.log('\n--- diff against live ---');
  await printDiff();
}

// -----------------------------------------------------------------------------
// SQL
// -----------------------------------------------------------------------------

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0024_ganesha_book_corrections.sql');
out('--');
out('-- GENERATED by scripts/build-ganesha-book-corrections.mjs. Do not hand-edit.');
out('--');
out('-- The Ganesha pooja corrected against Sampradaya Vratha Pooja Vidhi (Giri), a');
out('-- printed Tamil Smartha source. Until now every step in this database traced to');
out('-- one publisher and mostly to its TELUGU pages; this is the first independent');
out('-- witness and the first in the recension the app is actually written for.');
out('--');
out('-- Additions: the pranava on the achamanam, two dhyana verses, the Vedic');
out('-- gananam tva, "asmin mrttikabimbe", "Om brahmane svaha" as the sixth naivedya');
out('-- offering, the evening savita form, the Vedic mantra pushpam, "shakabde" and');
out('-- "prabhavadinam shashtyah samvatsaranam madhye" in the sankalpam.');
out('--');
out('-- Four replacements, each argued in the generator:');
out('--   1. gaurigarbhasamudbhava -> girvana surapujita  (same slot, book recension)');
out('--   2. satyam tva rtena -> satyam tvartena          (sandhi as printed)');
out('--   3. Varalakshmi prana offerings stored TWICE      (defect)');
out('--   4. sankalpam clause order                        (engine was already right)');
out('--');
out('-- Nothing the app had and the book lacks is removed. A shorter printed');
out('-- recension is not evidence that a longer recitation is wrong.');
out('--');
out('-- Idempotent.');
out('-- =============================================================================');
out();
out('begin;');
out();

for (const e of built) {
  out(`-- --- ${e.pooja} / ${e.step}`);
  if (e.prepend) {
    // Put the Vedic passage in front of whatever the row already holds, without
    // restating the twenty lines of namaskara that follow it. Guarded on the
    // text not already being there, so re-running cannot stack two copies.
    out('update public.pooja_steps set');
    out(`  mantra_sanskrit = ${q(e.deva)} || chr(10) || mantra_sanskrit,`);
    out(`  mantra_tamil = ${q(e.ta)} || chr(10) || mantra_tamil,`);
    out(`  mantra_translit = ${q(e.iast)} || chr(10) || mantra_translit,`);
    out(`  source_ref = ${q(`${e.ref} ${PHOTO}`)},`);
    out('  verified_by = null,');
    out('  verified_at = null,');
    out('  updated_at = now()');
    out(`where pooja_id = '${e.pooja}' and step_title_en = ${q(e.step)}`);
    out(`  and position(${q('योऽपां पुष्पं वेद')} in mantra_sanskrit) = 0;`);
  } else {
    out('update public.pooja_steps set');
    out(`  mantra_sanskrit = ${q(e.deva)},`);
    out(`  mantra_tamil = ${q(e.ta)},`);
    out(`  mantra_translit = ${q(e.iast)},`);
    if (e.variantDeva) {
      out(`  variant_mantra_sanskrit = ${q(e.variantDeva)},`);
      out(`  variant_note_en = ${q(e.variantNote)},`);
    }
    out(`  source_ref = ${q(`${e.ref} ${PHOTO}`)},`);
    out('  verified_by = null,');
    out('  verified_at = null,');
    out('  updated_at = now()');
    out(`where pooja_id = '${e.pooja}' and step_title_en = ${q(e.step)};`);
  }
  out();
}

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
// The needle for the three-script assertion is GENERATED, not typed. The first
// version of this hand-wrote the Tamil as ப்³ரஹ்மணே, with the Grantha voicing
// superscript this project does not use, so the migration asserted against a
// string it could never produce and refused to apply. Same class of mistake as
// the source_ref that once quoted its own gate's placeholder.
const needle = (deva) => ({
  deva,
  ta: transliterate(Sanscript, deva, 'tamil'),
  iast: transliterate(Sanscript, deva, 'iast'),
});
const BRAHMANE = needle('ब्रह्मणे स्वाहा');

out('  -- The sixth naivedya offering reaches both poojas, in all three scripts.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en like 'Naivedyam%'");
out(`     and mantra_sanskrit like '%' || ${q(BRAHMANE.deva)} || '%'`);
out(`     and mantra_tamil like '%' || ${q(BRAHMANE.ta)} || '%'`);
out(`     and mantra_translit like '%' || ${q(BRAHMANE.iast)} || '%';`);
out("  if n <> 2 then raise exception 'expected 2 naivedyam steps with brahmane svaha, found %', n; end if;");
out('  -- and the evening form is stored beside it.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en like 'Naivedyam%' and variant_mantra_sanskrit is not null;");
out("  if n <> 2 then raise exception 'expected 2 naivedyam steps with an evening variant, found %', n; end if;");
out('  -- The prana offerings appear ONCE, not twice. Five "svaha" for the pranas');
out('  -- plus one for brahman is six; the duplicated row had eleven.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en like 'Naivedyam%'");
out("     and (length(mantra_sanskrit) - length(replace(mantra_sanskrit, 'स्वाहा', ''))) / length('स्वाहा') <> 6;");
out("  if n > 0 then raise exception '% naivedyam steps do not have exactly 6 svaha offerings', n; end if;");
out('  -- The mantra pushpam is a mantra pushpam.');
out('  select count(*) into n from public.pooja_steps');
out("   where step_title_en = 'Mantra Pushpam & Namaskaram'");
out("     and mantra_sanskrit like '%योऽपां पुष्पं वेद%';");
out("  if n <> 1 then raise exception 'the Vedic mantra pushpam is not in place'; end if;");
out('  -- and it was not stacked twice by a re-run.');
out('  select count(*) into n from public.pooja_steps');
out("   where (length(mantra_sanskrit) - length(replace(mantra_sanskrit, 'योऽपां पुष्पं वेद', ''))) > length('योऽपां पुष्पं वेद');");
out("  if n > 0 then raise exception 'the mantra pushpam was inserted more than once'; end if;");
out('  -- The sankalpam keeps its slot and now opens with the resolve.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Sankalpam'");
out("     and mantra_sanskrit like 'मम उपात्त%'");
out("     and mantra_sanskrit like '%[DYNAMIC_PANCHANGAM_DATA]%'");
out("     and mantra_tamil like '%[DYNAMIC_PANCHANGAM_DATA]%'");
out("     and mantra_translit like '%[DYNAMIC_PANCHANGAM_DATA]%';");
out("  if n <> 1 then raise exception 'the Ganesha sankalpam is not in the expected shape'; end if;");
out('  -- The invocation has an object again.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_title_en = 'Avahanam & Asanam'");
out("     and mantra_sanskrit like '%मृत्तिकाबिम्बे%';");
out("  if n <> 1 then raise exception 'asmin mrttikabimbe is missing from the avahanam'; end if;");
out('  -- Nothing anywhere is an unreviewed draft or a truncation.');
out('  select count(*) into n from public.pooja_steps');
out("   where source_ref is null or source_ref like '%pending vaidika review%'");
out("      or position('...' in coalesce(mantra_sanskrit, '')) > 0;");
out("  if n > 0 then raise exception '% steps are unsourced or truncated', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select step_title_en, left(mantra_sanskrit, 60) from pooja_steps");
out("--    where step_title_en like 'Naivedyam%';");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0024_ganesha_book_corrections.sql', sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
