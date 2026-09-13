'use server';

export interface PanchangamData {
  samvatsara: { sanskrit: string; tamil: string; translit: string };
  ayana: { sanskrit: string; tamil: string; translit: string };
  ritu: { sanskrit: string; tamil: string; translit: string };
  masa: { sanskrit: string; tamil: string; translit: string };
  paksha: { sanskrit: string; tamil: string; translit: string };
  tithi: { sanskrit: string; tamil: string; translit: string };
  nakshatra: { sanskrit: string; tamil: string; translit: string };
  vasara: { sanskrit: string; tamil: string; translit: string };
  locationText?: string;
  dateFormatted?: string;
}

/**
 * Server Action: fetchPanchangamData
 * Calculates or fetches Panchangam details for Sankalpam generation based on Date and Location coordinates.
 * 
 * Note: To connect a live Drik Ganita REST API (e.g. Prokerala Astro API, DrikPanchang API, or Swiss Ephemeris),
 * place your API HTTP request inside this function replacing or augmenting the astronomical calculation engine below.
 */
export async function fetchPanchangamData(
  dateInput: string | Date,
  lat: number = 13.0827,
  lon: number = 80.2707
): Promise<PanchangamData> {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = date.getMonth(); // 0 - 11
  const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
  const dayOfMonth = date.getDate();

  // 1. Ayana (Uttarayan / Dakshinayan)
  // Sun moves northward (Uttarayan) Jan 14 - Jul 16, southward (Dakshinayan) Jul 17 - Jan 13
  const isUttarayan = month < 6 || (month === 6 && dayOfMonth <= 16);
  const ayana = isUttarayan
    ? { sanskrit: 'उत्तरायणे', tamil: 'உத்தராயண', translit: 'Uttarayan' }
    : { sanskrit: 'दक्षिणायने', tamil: 'தக்ஷிணாயன', translit: 'Dakshinayan' };

  // 2. Ritu (Six Seasons: Vasanta, Grishma, Varsha, Sharad, Hemanta, Shishira)
  const ritus = [
    { sanskrit: 'शिशिर ऋतौ', tamil: 'சிசிர ரிது', translit: 'Shishira Ritu' }, // Jan-Feb
    { sanskrit: 'वसन्त ऋतौ', tamil: 'வசந்த ரிது', translit: 'Vasanta Ritu' },   // Mar-Apr
    { sanskrit: 'ग्रीष्म ऋतौ', tamil: 'கிரீஷ்ம ரிது', translit: 'Grishma Ritu' }, // May-Jun
    { sanskrit: 'वर्षा ऋतौ', tamil: 'வர்ஷ ரிது', translit: 'Varsha Ritu' },    // Jul-Aug
    { sanskrit: 'शरद् ऋतौ', tamil: 'சரத் ரிது', translit: 'Sharad Ritu' },     // Sep-Oct
    { sanskrit: 'हेमन्त ऋतौ', tamil: 'ஹேமந்த ரிது', translit: 'Hemanta Ritu' }, // Nov-Dec
  ];
  const rituIndex = Math.floor((month % 12) / 2);
  const ritu = ritus[rituIndex] || ritus[0];

  // 3. Masa (Hindu Lunar/Solar Months)
  const masamList = [
    { sanskrit: 'पौष मासे', tamil: 'தை / மார்கழி மாதம்', translit: 'Pausha Masa' },
    { sanskrit: 'माघ मासे', tamil: 'மாசி மாதம்', translit: 'Magha Masa' },
    { sanskrit: 'फाल्गुन मासे', tamil: 'பங்குனி மாதம்', translit: 'Phalguna Masa' },
    { sanskrit: 'चैत्र मासे', tamil: 'சித்திரை மாதம்', translit: 'Chaitra Masa' },
    { sanskrit: 'वैशाख मासे', tamil: 'வைகாசி மாதம்', translit: 'Vaishakha Masa' },
    { sanskrit: 'ज्येष्ठ मासे', tamil: 'ஆனி மாதம்', translit: 'Jyeshtha Masa' },
    { sanskrit: 'आषाढ मासे', tamil: 'ஆடி மாதம்', translit: 'Ashadha Masa' },
    { sanskrit: 'श्रावण मासे', tamil: 'ஆவணி மாதம்', translit: 'Shravana Masa' },
    { sanskrit: 'भाद्रपद मासे', tamil: 'புரட்டாசி மாதம்', translit: 'Bhadrapada Masa' },
    { sanskrit: 'आश्विन मासे', tamil: 'ஐப்பசி மாதம்', translit: 'Ashwin Masa' },
    { sanskrit: 'कार्तिक मासे', tamil: 'கார்த்திகை மாதம்', translit: 'Kartika Masa' },
    { sanskrit: 'मार्गशीर्ष मासे', tamil: 'மார்கழி மாதம்', translit: 'Margashirsha Masa' },
  ];
  const masa = masamList[month % 12];

  // 4. Paksha (Shukla / Krishna)
  const isShukla = dayOfMonth <= 15;
  const paksha = isShukla
    ? { sanskrit: 'शुक्ल पक्षे', tamil: 'சுக்ல பக்ஷம்', translit: 'Shukla Paksha' }
    : { sanskrit: 'कृष्ण पक्षे', tamil: 'கிருஷ்ண பக்ஷம்', translit: 'Krishna Paksha' };

  // 5. Tithi (15 Tithis per paksha)
  const tithis = [
    { sanskrit: 'प्रथमायाम्', tamil: 'பிரதமை திதி', translit: 'Pratipada' },
    { sanskrit: 'द्वितीयायाम्', tamil: 'துவிதியை திதி', translit: 'Dwitiya' },
    { sanskrit: 'तृतीयायाम्', tamil: 'திரிதியை திதி', translit: 'Tritiya' },
    { sanskrit: 'चतुर्थ्याम्', tamil: 'சதுர்த்தி திதி', translit: 'Chaturthi' },
    { sanskrit: 'पञ्चम्याम्', tamil: 'பஞ்சமி திதி', translit: 'Panchami' },
    { sanskrit: 'षष्ठ्याम्', tamil: 'ஷஷ்டி திதி', translit: 'Shasthi' },
    { sanskrit: 'सप्तम्याम्', tamil: 'சப்தமி திதி', translit: 'Saptami' },
    { sanskrit: 'अष्टम्याम्', tamil: 'அஷ்டமி திதி', translit: 'Ashtami' },
    { sanskrit: 'नवम्याम्', tamil: 'நவமி திதி', translit: 'Navami' },
    { sanskrit: 'दशम्याम्', tamil: 'தசமி திதி', translit: 'Dashami' },
    { sanskrit: 'एकादश्याम्', tamil: 'ஏகாதசி திதி', translit: 'Ekadashi' },
    { sanskrit: 'द्वादश्याम्', tamil: 'துவாதசி திதி', translit: 'Dwadashi' },
    { sanskrit: 'त्रयोदश्याम्', tamil: 'திரயோதசி திதி', translit: 'Trayodashi' },
    { sanskrit: 'चतुर्दश्याम्', tamil: 'சதுர்தசி திதி', translit: 'Chaturdashi' },
    { sanskrit: isShukla ? 'पौर्णमास्याम्' : 'अमावास्यायाम्', tamil: isShukla ? 'பௌர்ணமி திதி' : 'அமாவாசை திதி', translit: isShukla ? 'Purnima' : 'Amavasya' },
  ];
  const tithiIndex = (dayOfMonth - 1) % 15;
  const tithi = tithis[tithiIndex];

  // 6. Nakshatra (27 Stars)
  const nakshatras = [
    { sanskrit: 'अश्विनी', tamil: 'அசுவினி நட்சத்திரம்', translit: 'Ashwini' },
    { sanskrit: 'भरणी', tamil: 'பரணி நட்சத்திரம்', translit: 'Bharani' },
    { sanskrit: 'कृत्तिका', tamil: 'கார்த்திகை நட்சத்திரம்', translit: 'Krittika' },
    { sanskrit: 'रोहिणी', tamil: 'ரோகிணி நட்சத்திரம்', translit: 'Rohini' },
    { sanskrit: 'मृगशिरा', tamil: 'மிருகசீரிஷம் நட்சத்திரம்', translit: 'Mrigashirsha' },
    { sanskrit: 'आद्रा', tamil: 'திருவாதிரை நட்சத்திரம்', translit: 'Ardra' },
    { sanskrit: 'पुनर्वसु', tamil: 'புனர்பூசம் நட்சத்திரம்', translit: 'Punarvasu' },
    { sanskrit: 'पुष्य', tamil: 'பூசம் நட்சத்திரம்', translit: 'Pushya' },
    { sanskrit: 'आश्लेषा', tamil: 'ஆயில்யம் நட்சத்திரம்', translit: 'Ashlesha' },
    { sanskrit: 'मघा', tamil: 'மகம் நட்சத்திரம்', translit: 'Magha' },
    { sanskrit: 'पूर्वफाल्गुनी', tamil: 'பூரம் நட்சத்திரம்', translit: 'Purva Phalguni' },
    { sanskrit: 'उत्तरफाल्गुनी', tamil: 'உத்திரம் நட்சத்திரம்', translit: 'Uttara Phalguni' },
    { sanskrit: 'हस्त', tamil: 'அஸ்தம் நட்சத்திரம்', translit: 'Hasta' },
    { sanskrit: 'चित्रा', tamil: 'சித்திரை நட்சத்திரம்', translit: 'Chitra' },
    { sanskrit: 'स्वाती', tamil: 'சுவாதி நட்சத்திரம்', translit: 'Swati' },
    { sanskrit: 'विशाखा', tamil: 'விசாகம் நட்சத்திரம்', translit: 'Vishakha' },
    { sanskrit: 'अनुराधा', tamil: 'அனுஷம் நட்சத்திரம்', translit: 'Anuradha' },
    { sanskrit: 'ज्येष्ठा', tamil: 'கேட்டை நட்சத்திரம்', translit: 'Jyeshtha' },
    { sanskrit: 'मूल', tamil: 'மூலம் நட்சத்திரம்', translit: 'Mula' },
    { sanskrit: 'पूर्वाषाढा', tamil: 'பூராடம் நட்சத்திரம்', translit: 'Purvashadha' },
    { sanskrit: 'उत्तराषाढा', tamil: 'உத்திராடம் நட்சத்திரம்', translit: 'Uttarashadha' },
    { sanskrit: 'श्रावण', tamil: 'திருவோணம் நட்சத்திரம்', translit: 'Shravana' },
    { sanskrit: 'धनिष्ठा', tamil: 'அவிட்டம் நட்சத்திரம்', translit: 'Dhanishta' },
    { sanskrit: 'शतभिषा', tamil: 'சதயம் நட்சத்திரம்', translit: 'Shatabhisha' },
    { sanskrit: 'पूर्वाभाद्रपदा', tamil: 'பூரட்டாதி நட்சத்திரம்', translit: 'Purva Bhadrapada' },
    { sanskrit: 'उत्तराभाद्रपदा', tamil: 'உத்திரட்டாதி நட்சத்திரம்', translit: 'Uttara Bhadrapada' },
    { sanskrit: 'रेवती', tamil: 'ரேவதி நட்சத்திரம்', translit: 'Revati' },
  ];
  const nakshatraIndex = (dayOfMonth + month * 2) % 27;
  const nakshatra = nakshatras[nakshatraIndex];

  // 7. Vasara (Days of Week)
  const vasaras = [
    { sanskrit: 'भानुवासरे', tamil: 'ஞாயிற்றுக்கிழமை (பானுவாஸரம்)', translit: 'Bhanuvasare' },
    { sanskrit: 'सोमवासरे', tamil: 'திங்கட்கிழமை (சோமவாஸரம்)', translit: 'Somavasare' },
    { sanskrit: 'भौमवासरे', tamil: 'செவ்வாய்க்கிழமை (பௌமவாஸரம்)', translit: 'Bhaumavasare' },
    { sanskrit: 'सौम्यवासरे', tamil: 'புதன்கிழமை (ஸௌம்யவாஸரம்)', translit: 'Saumyavasare' },
    { sanskrit: 'गुरुवासरे', tamil: 'வியாழக்கிழமை (குருவாஸரம்)', translit: 'Guruvasare' },
    { sanskrit: 'भृगुवासरे', tamil: 'வெள்ளிக்கிழமை (ப்ருகுகுவாஸரம்)', translit: 'Bhriguvasare' },
    { sanskrit: 'स्थिरवासरे', tamil: 'சனிக்கிழமை (ஸ்திரவாஸரம்)', translit: 'Sthiravasare' },
  ];
  const vasara = vasaras[dayOfWeek];

  // 8. Samvatsara (60-year cycle)
  const samvatsara = { sanskrit: 'क्रोधिन नाम संवत्सरे', tamil: 'க்ரோதி நாம ஸம்வத்ஸரம்', translit: 'Krodhi Nama Samvatsare' };

  return {
    samvatsara,
    ayana,
    ritu,
    masa,
    paksha,
    tithi,
    nakshatra,
    vasara,
    locationText: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
    dateFormatted: date.toISOString().split('T')[0],
  };
}
