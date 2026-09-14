import { computePanchangam } from '../src/lib/panchangam.ts';
import { renderSankalpamCore, OCCASION_GANESHA_CHATURTHI } from '../src/lib/sankalpam.ts';

const p = computePanchangam(new Date('2026-09-14T12:00:00+05:30'), 13.0827, 80.2707, 'Asia/Kolkata')!;
// Strip diacritics before comparing: the recited text is written in a loose
// roman spelling, the engine emits IAST.
const plain = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/gi, '').toUpperCase();
const f = (k: string, got: string, want: string) =>
  console.log(`  ${plain(got).includes(plain(want)) ? 'ok  ' : 'FAIL'} ${k.padEnd(12)} ${got.padEnd(22)} want ~${want}`);

console.log('field-by-field against the recited Sankalpam:');
f('samvatsara', p.samvatsara.iast, 'PARABHAVA');
f('ayana',      p.ayana.iast,      'DAK');
f('ritu',       p.ritu.iast,       'VAR');
f('masa',       p.masa.iast,       'SIMHA');
f('paksha',     p.paksha.iast,     'ŚUKLA');
f('tithi',      p.tithi.iast,      'TṚTĪYĀYĀM');
f('upari',      p.tithiUpari?.iast ?? '-', 'CATURTHYĀM');
f('vasara',     p.vasara.iast,     'INDU');
f('nakshatra',  p.nakshatra.iast,  'CITRĀ');
f('yoga',       p.yoga.iast,       'BRAHMA');
f('karana',     p.karana.iast,     'GARAJA');
console.log();
console.log('lunar month (not used by Tamil Smartha):', p.meta.lunarMasaName);
console.log('sun sidereal longitude:', p.meta.solarLongitude.toFixed(2));
console.log();
console.log('CORE, roman:');
console.log(' ', renderSankalpamCore(p, 'iast', { occasionDeva: OCCASION_GANESHA_CHATURTHI }));
console.log();
console.log('CORE, tamil:');
console.log(' ', renderSankalpamCore(p, 'tamil', { occasionDeva: OCCASION_GANESHA_CHATURTHI }));
console.log();

// Whole-sentence comparison against the recited text, word by word.
const RECITED =
  'PARABHAVA NAMA SAMVATHSARE DAKSHINAYANE VARSHA RUTHOU SIMMA MASE SHUKLA PAKSHE ' +
  'THRITHIYAYAM UPARI CHATHURTHYAM SHUBA THITHOU INDU VASARA YUKTHAYAM CHITHRA ' +
  'NAKSHATHRA YUKTHAYAM BRAHMMA NAMAYOGA KARAJA KARANA YUKTHAYAM YEVANGUNA ' +
  'VISESHANA VISISHTAYAM ASYAM VARTTHAMANAYAM GANESHA CHATHURTHYAM SHUBA THITHOU';
const mine = renderSankalpamCore(p, 'iast', { occasionDeva: OCCASION_GANESHA_CHATURTHI });
// Reduce both sides to a bare phonetic skeleton. The recited text uses a loose
// popular romanisation: vocalic r written "ru", IAST c written "ch", au written
// "ou", doubled consonants for emphasis, and word joins like "namayoga".
// Spaces are dropped entirely so word-joining differences do not misalign it.
const skel = (s: string) =>
  s.toLowerCase()
    .replace(/[ṛṝ]/g, 'ru')          // r-vocalic -> ru
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ch/g, 'c')                        // ch and c both -> c
    .replace(/th/g, 't')
    .replace(/sh/g, 's')
    .replace(/au|ou/g, 'o')
    .replace(/[^a-z]/g, '')
    .replace(/(.)/g, '$1');
const a = skel(RECITED), b = skel(mine);
console.log('whole sentence, skeleton match:', a === b ? 'IDENTICAL' : 'differs');
if (a !== b) {
  console.log('  recited  :', a);
  console.log('  generated:', b);
  let i = 0; while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  console.log('  first divergence at char', i, ':', a.slice(i, i + 24), '|', b.slice(i, i + 24));
}
