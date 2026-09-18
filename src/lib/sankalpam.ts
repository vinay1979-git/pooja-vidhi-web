import { computePanchangam, type Panchangam, type Slot } from '@/lib/panchangam';

/**
 * The Sankalpam sentence.
 *
 * Modelled on a recited Sankalpam for Ganesha Chaturthi, 14 September 2026,
 * Chennai:
 *
 *   PARABHAVA NAMA SAMVATHSARE DAKSHINAYANE VARSHA RUTHOU SIMMA MASE
 *   SHUKLA PAKSHE THRITHIYAYAM UPARI CHATHURTHYAM SHUBA THITHOU
 *   INDU VASARA YUKTHAYAM CHITHRA NAKSHATHRA YUKTHAYAM
 *   BRAHMMA NAMAYOGA KARAJA KARANA YUKTHAYAM
 *   YEVANGUNA VISESHANA VISISHTAYAM ASYAM VARTTHAMANAYAM
 *   GANESHA CHATHURTHYAM SHUBA THITHOU
 *
 * Four things the previous placeholder left out entirely: the yoga, the karana,
 * the second tithi when it turns during the day, and the naming of the festival
 * at the end. It also used the lunar month where Tamil Smartha recites the solar
 * one, and collapsed everything into a single [DYNAMIC_PANCHANGAM_DATA] token
 * with no slot for gotra or name.
 */

export type Script = 'deva' | 'tamil' | 'iast';

export interface SankalpamPerson {
  /** Family gotra, e.g. "Kashyapa". Recited as "...gotrah". */
  gotra?: string;
  /** The performer's name, recited as "...sharma aham" or the feminine form. */
  name?: string;
  gender?: 'male' | 'female';
}

export interface SankalpamContext extends SankalpamPerson {
  /** Named at the close: "asyam varthamanayam GANESHA CHATURTHYAM shubha tithau". */
  occasionDeva?: string;
  /** Appended after the fixed geography, e.g. "Chennai, Tamil Nadu, India". */
  place?: string;
}

const pick = (s: Slot | null, script: Script): string =>
  !s ? '' : script === 'deva' ? s.deva : script === 'tamil' ? s.tamil : s.iast;

// The fixed cosmological preamble, identical in every Sankalpam.
const PREAMBLE: Record<Script, string> = {
  deva:
    'शुभे शोभने मुहूर्ते आद्य ब्रह्मणः द्वितीय परार्धे श्वेत वराह कल्पे ' +
    'वैवस्वत मन्वन्तरे अष्टाविंशतितमे कलियुगे प्रथमे पादे जम्बूद्वीपे ' +
    'भरतवर्षे भरतखण्डे मेरोः दक्षिणे पार्श्वे अस्मिन् वर्तमाने व्यावहारिके',
  tamil: '',
  iast:
    'śubhe śobhane muhūrte ādya brahmaṇaḥ dvitīya parārdhe śveta varāha kalpe ' +
    'vaivasvata manvantare aṣṭāviṃśatitame kaliyuge prathame pāde jambūdvīpe ' +
    'bharatavarṣe bharatakhaṇḍe meroḥ dakṣiṇe pārśve asmin vartamāne vyāvahārike',
};

const PHRASE: Record<Script, Record<string, string>> = {
  deva: {
    samvatsare: 'संवत्सरे',
    ritau: 'ऋतौ',
    mase: 'मासे',
    pakshe: 'पक्षे',
    upari: 'उपरि',
    shubhaTithau: 'शुभ तिथौ',
    vasaraYuktayam: 'वासर युक्तायाम्',
    nakshatraYuktayam: 'नक्षत्र युक्तायाम्',
    namaYoga: 'नाम योग',
    karanaYuktayam: 'करण युक्तायाम्',
    evam: 'एवंगुण विशेषण विशिष्टायाम्',
    asyam: 'अस्यां वर्तमानायाम्',
    opener:
      'मम उपात्त समस्त दुरितक्षय द्वारा श्री परमेश्वर प्रीत्यर्थं',
    gotrah: 'गोत्रः',
    sharma: 'शर्मा अहं',
    namni: 'नाम्नी अहं',
    closer: 'श्री महागणपति पूजां करिष्ये',
  },
  tamil: {},
  iast: {
    samvatsare: 'saṃvatsare',
    ritau: 'ṛtau',
    mase: 'māse',
    pakshe: 'pakṣe',
    upari: 'upari',
    shubhaTithau: 'śubha tithau',
    vasaraYuktayam: 'vāsara yuktāyām',
    nakshatraYuktayam: 'nakṣatra yuktāyām',
    namaYoga: 'nāma yoga',
    karanaYuktayam: 'karaṇa yuktāyām',
    evam: 'evaṃguṇa viśeṣaṇa viśiṣṭāyām',
    asyam: 'asyāṃ vartamānāyām',
    opener: 'mama upātta samasta duritakṣaya dvārā śrī parameśvara prītyarthaṃ',
    gotrah: 'gotraḥ',
    sharma: 'śarmā ahaṃ',
    namni: 'nāmnī ahaṃ',
    closer: 'śrī mahāgaṇapati pūjāṃ kariṣye',
  },
};

// Tamil is derived from the Devanagari at module load, so the three scripts
// cannot drift apart. Same rule as the mantra text.
import Sanscript from '@indic-transliteration/sanscript';
const toTamil = (d: string) =>
  Sanscript.t(d, 'devanagari', 'tamil').replace(/ஃ/g, '꞉').replace(/'/g, '');
PREAMBLE.tamil = toTamil(PREAMBLE.deva);
for (const [k, v] of Object.entries(PHRASE.deva)) PHRASE.tamil[k] = toTamil(v);

/** The dynamic middle: everything from the samvatsara to the occasion. */
export function renderSankalpamCore(
  p: Panchangam,
  script: Script,
  ctx: SankalpamContext = {},
): string {
  const t = PHRASE[script];
  const parts: string[] = [
    pick(p.samvatsara, script),
    t.samvatsare,
    pick(p.ayana, script),
    pick(p.ritu, script),
    t.ritau,
    pick(p.masa, script),
    t.mase,
    pick(p.paksha, script),
    t.pakshe,
    pick(p.tithi, script),
  ];

  // "tritiyayam upari chaturthyam" when the tithi turns during the day.
  if (p.tithiUpari) parts.push(t.upari, pick(p.tithiUpari, script));

  parts.push(
    t.shubhaTithau,
    pick(p.vasara, script),
    t.vasaraYuktayam,
    pick(p.nakshatra, script),
    t.nakshatraYuktayam,
    pick(p.yoga, script),
    t.namaYoga,
    pick(p.karana, script),
    t.karanaYuktayam,
    t.evam,
    t.asyam,
  );

  if (ctx.occasionDeva) {
    parts.push(
      script === 'deva'
        ? ctx.occasionDeva
        : script === 'tamil'
          ? toTamil(ctx.occasionDeva)
          : Sanscript.t(ctx.occasionDeva, 'devanagari', 'iast'),
      t.shubhaTithau,
    );
  }

  return parts.filter(Boolean).join(' ');
}

/** The whole sentence: preamble, place, coordinates, person, purpose. */
export function renderSankalpam(
  p: Panchangam,
  script: Script,
  ctx: SankalpamContext = {},
): string {
  const t = PHRASE[script];
  const bits = [t.opener, PREAMBLE[script]];
  if (ctx.place) bits.push(ctx.place);
  bits.push(renderSankalpamCore(p, script, ctx));

  if (ctx.gotra) bits.push(ctx.gotra, t.gotrah);
  if (ctx.name) {
    bits.push(ctx.name);
    // sharma is the brahmana varna suffix and is not used by women, who take
    // the neutral naamni form.
    bits.push(ctx.gender === 'female' ? t.namni : t.sharma);
  }
  bits.push(t.closer);
  return bits.filter(Boolean).join(' ');
}

export interface SankalpamResult {
  panchangam: Panchangam;
  deva: string;
  tamil: string;
  iast: string;
  coreDeva: string;
  coreTamil: string;
  coreIast: string;
}

export function buildSankalpam(
  when: Date,
  latitude: number,
  longitude: number,
  ctx: SankalpamContext = {},
  timezone = 'Asia/Kolkata',
): SankalpamResult | null {
  const p = computePanchangam(when, latitude, longitude, timezone);
  if (!p) return null;
  return {
    panchangam: p,
    deva: renderSankalpam(p, 'deva', ctx),
    tamil: renderSankalpam(p, 'tamil', ctx),
    iast: renderSankalpam(p, 'iast', ctx),
    coreDeva: renderSankalpamCore(p, 'deva', ctx),
    coreTamil: renderSankalpamCore(p, 'tamil', ctx),
    coreIast: renderSankalpamCore(p, 'iast', ctx),
  };
}

/**
 * The performer, in the genitive, to sit between the panchangam and "mama
 * upātta ... pūjāṃ kariṣye".
 *
 * renderSankalpam builds its own person clause in the NOMINATIVE ("X gotraḥ, Y
 * śarmā ahaṃ") because it puts the opener first. The Sankalpam step's stored
 * mantra is ordered the other way -- preamble, panchangam, person, purpose --
 * and there the genitive is what agrees with mama. Both forms are recited; they
 * are not interchangeable within a sentence.
 *
 * This exists because PoojaViewer was assembling the clause inline, where it
 * had drifted: it spelt गोत्रोत्भवस्य for गोत्रोद्भवस्य (udbhava, "arisen from"),
 * and it used the masculine ending for everyone.
 */
export function renderPerson(
  script: Script,
  ctx: { gotra?: string; name?: string; gender?: 'male' | 'female' | 'couple' } = {},
): string {
  const f = ctx.gender === 'female';
  const words: Record<Script, { from: string; named: string }> = {
    deva: {
      from: f ? 'गोत्रोद्भवायाः' : 'गोत्रोद्भवस्य',
      named: f ? 'नामधेयायाः' : 'नामधेयस्य',
    },
    iast: {
      from: f ? 'gotrodbhavāyāḥ' : 'gotrodbhavasya',
      named: f ? 'nāmadheyāyāḥ' : 'nāmadheyasya',
    },
    tamil: { from: '', named: '' },
  };
  words.tamil = { from: toTamil(words.deva.from), named: toTamil(words.deva.named) };
  const w = words[script];
  const bits: string[] = [];
  if (ctx.gotra) bits.push(ctx.gotra, w.from);
  if (ctx.name) bits.push(ctx.name, w.named);
  return bits.join(' ');
}

/** Ganesha Chaturthi, for the occasion slot. */
export const OCCASION_GANESHA_CHATURTHI = 'गणेश चतुर्थ्याम्';
