// node --test scripts/tts-bakeoff/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  stripSvara,
  replaceGum,
  normalize,
  splitLines,
  visargaEcho,
  homorganicAnusvara,
  toKannada,
  toIast,
  prepare,
  DEVANAGARI_RE,
} from './sanskrit-prep.mjs';

const MANTRAS = JSON.parse(readFileSync(new URL('./mantras.json', import.meta.url), 'utf8')).mantras;

test('svara marks are stripped', () => {
  // अ॒ग्निमी॑ळे पु॒रोहि॑तं (RV 1.1.1 with udātta/anudātta), plus a Vedic Extensions mark.
  const accented = 'अ॒ग्निमी॑ळे पु॒रोहि॑तम् ᳚᳒';
  const out = stripSvara(accented);
  assert.equal(out, 'अग्निमीळे पुरोहितम् ');
  assert.ok(!/[॑-॔᳐-᳿]/.test(out));
  // Devanagari Extended svara letters/digits go too.
  assert.equal(stripSvara('क꣠꣱ख'), 'कख');
});

test('ꣳ becomes गुं, ꣴ becomes ग्गुं', () => {
  assert.equal(replaceGum('स भूमिꣳ विश्वतो'), 'स भूमिगुं विश्वतो');
  assert.equal(replaceGum('ओꣳ सुवः'), 'ओगुं सुवः');
  assert.equal(replaceGum('छन्दाꣴसि'), 'छन्दाग्गुंसि');
  assert.equal(normalize('आपो वा इदꣳ सर्वं'), 'आपो वा इदगुं सर्वं');
  for (const m of MANTRAS) assert.ok(!/[ꣳꣴ]/.test(normalize(m.text)), m.id);
});

test('normalize tidies dandas, dashes, numbering and spaces', () => {
  assert.equal(normalize('नमः || '), 'नमः॥');
  assert.equal(normalize('नमः । । '), 'नमः॥');
  assert.equal(normalize('ओम्-भूर्भुवस्सुवः'), 'ओम् भूर्भुवस्सुवः');
  assert.equal(normalize('देवानामसि–सस्निततमम् – पप्रितमं'), 'देवानामसि सस्निततमम् पप्रितमं');
  assert.equal(normalize('1. सोमो वा  एतस्य\n2. यो वैतां'), 'सोमो वा एतस्य\nयो वैतां');
  assert.equal(normalize('भोगम् ।'), 'भोगम्।');
});

test('splitLines splits at । ॥ and newlines and drops empty lines', () => {
  assert.deepEqual(splitLines('ॐ भूर्भुवस्सुवः । तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥\n\n'), [
    'ॐ भूर्भुवस्सुवः',
    'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि',
    'धियो यो नः प्रचोदयात्',
  ]);
  assert.deepEqual(splitLines('शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम्।\nप्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये॥'), [
    'शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम्',
    'प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये',
  ]);
  // A line with only punctuation is not a clip.
  assert.deepEqual(splitLines('नमः ।, ॥ ।'), ['नमः']);
});

test('every test mantra splits into the expected number of lines', () => {
  const counts = Object.fromEntries(MANTRAS.map((m) => [m.id, splitLines(m.text).length]));
  assert.deepEqual(counts, {
    gayatri: 3,
    asunite: 6,
    'apo-va-idam': 5,
    shuklambaradharam: 2,
    'lakshmi-names': 5,
  });
});

test('visargaEcho echoes only the pausal visarga', () => {
  assert.equal(visargaEcho('ॐ प्रकृत्यै नमः'), 'ॐ प्रकृत्यै नमह');
  assert.equal(visargaEcho('हरिः'), 'हरिहि');
  assert.equal(visargaEcho('गुरुः'), 'गुरुहु');
  assert.equal(visargaEcho('देवाः'), 'देवाह');
  // Mid-line visarga untouched.
  assert.equal(visargaEcho('धियो यो नः प्रचोदयात्'), 'धियो यो नः प्रचोदयात्');
});

test('homorganicAnusvara before stops only', () => {
  assert.equal(homorganicAnusvara('शंकर'), 'शङ्कर');
  assert.equal(homorganicAnusvara('संध्या'), 'सन्ध्या');
  assert.equal(homorganicAnusvara('पंच'), 'पञ्च');
  assert.equal(homorganicAnusvara('कंठ'), 'कण्ठ');
  assert.equal(homorganicAnusvara('संपूर्ण'), 'सम्पूर्ण');
  // Kept before semivowels/sibilants and at word end.
  assert.equal(homorganicAnusvara('संस्कृत संयम सर्वं'), 'संस्कृत संयम सर्वं');
});

test('Kannada variant contains no Devanagari, for every test mantra', () => {
  for (const m of MANTRAS) {
    for (const { input } of prepare(m.text, { script: 'kannada' })) {
      assert.ok(!DEVANAGARI_RE.test(input), `${m.id}: Devanagari leaked into "${input}"`);
      assert.ok(/[ಀ-೿]/.test(input), `${m.id}: no Kannada in "${input}"`);
    }
    // Also with the optional rules on.
    for (const { input } of prepare(m.text, { script: 'kannada', visargaEcho: true, homorganic: true })) {
      assert.ok(!DEVANAGARI_RE.test(input), `${m.id}: Devanagari leaked into "${input}"`);
    }
  }
  // Even with svaras and ꣳ in the source.
  for (const { input } of prepare('स भूमि॑ꣳ वि॒श्वतो॥ ओꣴ', { script: 'kannada' })) {
    assert.ok(!DEVANAGARI_RE.test(input), input);
  }
});

test('Kannada transliteration keeps ꣳ as गुं and ॐ as ಓಂ', () => {
  const [line] = prepare('आपो वा इदꣳ सर्वं', { script: 'kannada' });
  assert.equal(line.input, 'ಆಪೋ ವಾ ಇದಗುಂ ಸರ್ವಂ');
  assert.equal(toKannada('ॐ'), 'ಓಂ');
});

test('Devanagari variant is the normalised line, untouched otherwise', () => {
  const lines = prepare('ओꣳ सुवः। धियो यो नः प्रचोदयात्।');
  assert.deepEqual(lines, [
    { deva: 'ओगुं सुवः', input: 'ओगुं सुवः' },
    { deva: 'धियो यो नः प्रचोदयात्', input: 'धियो यो नः प्रचोदयात्' },
  ]);
});

test('IAST is plain roman for display', () => {
  assert.equal(toIast('ॐ असुनीते'), 'oṃ asunīte');
});
