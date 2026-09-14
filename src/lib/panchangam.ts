import { getDailyPanchang } from 'panchang-ts';
import Sanscript from '@indic-transliteration/sanscript';

/**
 * The Sankalpam's astronomical coordinates.
 *
 * Replaces the arithmetic placeholder that computed tithi as
 * `(dayOfMonth - 1) % 15`, ignored the coordinates it was handed, and carried a
 * hardcoded samvatsara two years out of date.
 *
 * Verified against a recited Sankalpam for 14 September 2026 at Chennai. Every
 * slot matches: Parabhava samvatsara, Dakshinayana, Varsha ritu, SIMHA masa,
 * Shukla paksha, "Tritiyayam upari Chaturthyam", Indu vasara, Chitra nakshatra,
 * Brahma yoga, Gara karana.
 *
 * Two things this gets right that the old one could not.
 *
 * SOLAR MONTH. Tamil Smartha recites the saura month, Simha, not the lunar
 * Bhadrapada. They are different calendars and drift apart every year. The
 * lunar name is still returned for traditions that use chandramana.
 *
 * TWO TITHIS. When the tithi turns during the day the Sankalpam names both:
 * "tritiyayam upari chaturthyam". The old engine could only ever name one, and
 * named the wrong one.
 */

// Tamil and roman forms are derived from the Devanagari so the three scripts
// cannot drift, exactly as the mantra text is handled.
const toTamil = (deva: string) =>
  Sanscript.t(deva, 'devanagari', 'tamil').replace(/ஃ/g, '꞉').replace(/'/g, '');
const toIast = (deva: string) => Sanscript.t(deva, 'devanagari', 'iast');

export interface Slot {
  deva: string;
  tamil: string;
  iast: string;
}
const slot = (deva: string): Slot => ({
  deva,
  tamil: toTamil(deva),
  iast: toIast(deva),
});

// --- value tables ------------------------------------------------------------
// Locative forms, because that is how they appear in the sentence.

const SAMVATSARA: Record<string, string> = {
  Prabhava: 'प्रभव', Vibhava: 'विभव', Shukla: 'शुक्ल', Pramoda: 'प्रमोद',
  Prajapati: 'प्रजापति', Angirasa: 'अङ्गिरस', Srimukha: 'श्रीमुख', Bhava: 'भाव',
  Yuva: 'युव', Dhatri: 'धातृ', Ishvara: 'ईश्वर', Bahudhanya: 'बहुधान्य',
  Pramathi: 'प्रमाथी', Vikrama: 'विक्रम', Vrisha: 'वृष', Chitrabhanu: 'चित्रभानु',
  Svabhanu: 'स्वभानु', Tarana: 'तारण', Parthiva: 'पार्थिव', Vyaya: 'व्यय',
  Sarvajit: 'सर्वजित्', Sarvadhari: 'सर्वधारी', Virodhi: 'विरोधी', Vikriti: 'विकृति',
  Khara: 'खर', Nandana: 'नन्दन', Vijaya: 'विजय', Jaya: 'जय', Manmatha: 'मन्मथ',
  Durmukhi: 'दुर्मुखी', Hevilambi: 'हेविळम्बि', Vilambi: 'विळम्बि', Vikari: 'विकारी',
  Sharvari: 'शार्वरी', Plava: 'प्लव', Shubhakrit: 'शुभकृत्', Shobhakrit: 'शोभकृत्',
  Krodhi: 'क्रोधी', Vishvavasu: 'विश्वावसु', Parabhava: 'पराभव', Plavanga: 'प्लवङ्ग',
  Kilaka: 'कीलक', Saumya: 'सौम्य', Sadharana: 'साधारण', Virodhakrit: 'विरोधकृत्',
  Paridhavi: 'परिधावी', Pramadi: 'प्रमादी', Ananda: 'आनन्द', Rakshasa: 'राक्षस',
  Nala: 'नल', Pingala: 'पिङ्गल', Kalayukti: 'कालयुक्ति', Siddharthi: 'सिद्धार्थी',
  Raudri: 'रौद्री', Durmati: 'दुर्मति', Dundubhi: 'दुन्दुभि',
  Rudhirodgari: 'रुधिरोद्गारी', Raktakshi: 'रक्ताक्षी', Krodhana: 'क्रोधन',
  Akshaya: 'अक्षय',
};

// Solar months. Tamil Smartha recites these, not the lunar names.
const SAURA_MASA = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनुस्', 'मकर', 'कुम्भ', 'मीन',
];

// Paired to the SOLAR months, which is the Tamil convention. The lunar pairing
// found in most references would put Bhadrapada in Sharad and be wrong here.
const RITU_FOR_SAURA = [
  'वसन्त', 'वसन्त', 'ग्रीष्म', 'ग्रीष्म', 'वर्षा', 'वर्षा',
  'शरद्', 'शरद्', 'हेमन्त', 'हेमन्त', 'शिशिर', 'शिशिर',
];

const TITHI_LOCATIVE: Record<string, string> = {
  Pratipada: 'प्रथमायाम्', Prathama: 'प्रथमायाम्', Dwitiya: 'द्वितीयायाम्',
  Dvitiya: 'द्वितीयायाम्', Tritiya: 'तृतीयायाम्', Chaturthi: 'चतुर्थ्याम्',
  Panchami: 'पञ्चम्याम्', Shashthi: 'षष्ठ्याम्', Sashti: 'षष्ठ्याम्',
  Saptami: 'सप्तम्याम्', Ashtami: 'अष्टम्याम्', Navami: 'नवम्याम्',
  Dashami: 'दशम्याम्', Ekadashi: 'एकादश्याम्', Dwadashi: 'द्वादश्याम्',
  Dvadashi: 'द्वादश्याम्', Trayodashi: 'त्रयोदश्याम्', Chaturdashi: 'चतुर्दश्याम्',
  Purnima: 'पौर्णमास्याम्', Amavasya: 'अमावास्यायाम्',
};

// Ritual day names. The Sankalpam says Indu, not Somavara.
const VASARA = ['भानु', 'इन्दु', 'भौम', 'सौम्य', 'गुरु', 'भृगु', 'स्थिर'];

const NAKSHATRA: Record<string, string> = {
  Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका', Rohini: 'रोहिणी',
  Mrigashira: 'मृगशीर्ष', Mrigashirsha: 'मृगशीर्ष', Ardra: 'आर्द्रा',
  Punarvasu: 'पुनर्वसु', Pushya: 'पुष्य', Ashlesha: 'आश्लेषा', Magha: 'मघा',
  'Purva Phalguni': 'पूर्वफल्गुनी', 'Uttara Phalguni': 'उत्तरफल्गुनी',
  Hasta: 'हस्त', Chitra: 'चित्रा', Swati: 'स्वाती', Vishakha: 'विशाखा',
  Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा', Mula: 'मूल', Moola: 'मूल',
  'Purva Ashadha': 'पूर्वाषाढा', 'Uttara Ashadha': 'उत्तराषाढा',
  Shravana: 'श्रवण', Dhanishta: 'धनिष्ठा', Shatabhisha: 'शतभिषक्',
  'Purva Bhadrapada': 'पूर्वभाद्रपदा', 'Uttara Bhadrapada': 'उत्तरभाद्रपदा',
  Revati: 'रेवती',
};

const YOGA: Record<string, string> = {
  Vishkambha: 'विष्कम्भ', Priti: 'प्रीति', Ayushman: 'आयुष्मान्',
  Saubhagya: 'सौभाग्य', Shobhana: 'शोभन', Atiganda: 'अतिगण्ड', Sukarma: 'सुकर्मा',
  Dhriti: 'धृति', Shula: 'शूल', Ganda: 'गण्ड', Vriddhi: 'वृद्धि', Dhruva: 'ध्रुव',
  Vyaghata: 'व्याघात', Harshana: 'हर्षण', Vajra: 'वज्र', Siddhi: 'सिद्धि',
  Vyatipata: 'व्यतीपात', Variyan: 'वरीयान्', Parigha: 'परिघ', Shiva: 'शिव',
  Siddha: 'सिद्ध', Sadhya: 'साध्य', Shubha: 'शुभ', Shukla: 'शुक्ल',
  Brahma: 'ब्रह्म', Indra: 'इन्द्र', Vaidhriti: 'वैधृति',
};

const KARANA: Record<string, string> = {
  Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव', Taitila: 'तैतिल',
  Gara: 'गरज', Garaja: 'गरज', Vanija: 'वणिज', Vishti: 'विष्टि',
  Shakuni: 'शकुनि', Chatushpada: 'चतुष्पाद', Naga: 'नाग', Kimstughna: 'किंस्तुघ्न',
};

const PAKSHA: Record<string, string> = { Shukla: 'शुक्ल', Krishna: 'कृष्ण' };

// --- result ------------------------------------------------------------------
export interface Panchangam {
  samvatsara: Slot;
  ayana: Slot;
  ritu: Slot;
  /** Solar month, which is what Tamil Smartha recites. */
  masa: Slot;
  /** Lunar month, for chandramana traditions. */
  chandramasa: Slot;
  paksha: Slot;
  /** The tithi prevailing at sunrise. */
  tithi: Slot;
  /** The tithi that follows during the day, when it turns. Null if it does not. */
  tithiUpari: Slot | null;
  vasara: Slot;
  nakshatra: Slot;
  yoga: Slot;
  karana: Slot;
  sunriseLocal: string | null;
  meta: {
    solarLongitude: number;
    tithiEndsLocal: string | null;
    lunarMasaName: string;
  };
}

function lookup(table: Record<string, string>, name: string): string {
  if (table[name]) return table[name];
  // Panchang-ts sometimes returns "Shukla Tritiya" rather than "Tritiya".
  const tail = name.split(/\s+/).pop() ?? name;
  return table[tail] ?? table[name.replace(/\s+/g, ' ')] ?? name;
}

export function computePanchangam(
  when: Date,
  latitude: number,
  longitude: number,
  timezone = 'Asia/Kolkata',
): Panchangam | null {
  const p = getDailyPanchang(when, { latitude, longitude }, { timezone });
  if (!p) return null;

  const tithis = p.angas.tithis ?? [];
  const atSunrise = tithis.find((t) => t.isActiveAtSunrise) ?? tithis[0];
  const following = tithis.find((t) => t !== atSunrise) ?? null;

  const pakshaName = atSunrise?.paksha ?? 'Shukla';
  const sunLon = p.sun?.siderealLongitude ?? 0;

  // Sidereal Karka (90 deg) through Dhanus (270 deg) is the southward course.
  const isDakshina = sunLon >= 90 && sunLon < 270;
  const sauraIndex = Math.floor(((sunLon % 360) + 360) % 360 / 30);

  return {
    samvatsara: slot(
      lookup(SAMVATSARA, p.calendar?.samvat?.shakaSamvatsara ?? '') + ' नाम',
    ),
    ayana: slot(isDakshina ? 'दक्षिणायने' : 'उत्तरायणे'),
    ritu: slot(RITU_FOR_SAURA[sauraIndex]),
    masa: slot(SAURA_MASA[sauraIndex]),
    chandramasa: slot(p.calendar?.chandramasa?.name ?? ''),
    paksha: slot(lookup(PAKSHA, pakshaName)),
    tithi: slot(lookup(TITHI_LOCATIVE, atSunrise?.name ?? '')),
    tithiUpari: following ? slot(lookup(TITHI_LOCATIVE, following.name)) : null,
    vasara: slot(VASARA[p.angas.vara?.index ?? 0]),
    nakshatra: slot(lookup(NAKSHATRA, p.angas.nakshatras?.[0]?.name ?? '')),
    yoga: slot(lookup(YOGA, p.angas.yogas?.[0]?.name ?? '')),
    karana: slot(lookup(KARANA, p.angas.karanas?.[0]?.name ?? '')),
    sunriseLocal: p.sun?.riseLocal ?? null,
    meta: {
      solarLongitude: sunLon,
      tithiEndsLocal: atSunrise?.endTimeLocal ?? null,
      lunarMasaName: p.calendar?.chandramasa?.name ?? '',
    },
  };
}
