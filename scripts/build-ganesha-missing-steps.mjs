#!/usr/bin/env node
/**
 * The steps the Ganesha pooja never had.
 *
 *   node scripts/build-ganesha-missing-steps.mjs          # validate + diff
 *   node scripts/build-ganesha-missing-steps.mjs --emit   # write it
 *
 * SOURCE: *Sampradaya Vratha Pooja Vidhi* (Giri), the common Purvanga Pooja
 * section, pp.1-21, and the Siddhivinayaka section p.82. Same photograph
 * discipline as 0024: no round trip is possible, so every source_ref says so.
 *
 * WHAT WAS WRONG. The book's purvangam has EIGHTEEN numbered steps. This pooja
 * had seven. That was never a decision anybody made -- it is an artefact of
 * what the Telugu web pages happened to contain, and it left the Ganesha pooja
 * in the one state least defensible of all: the rite that removes obstacles
 * before every other rite is itself a Ganesha pooja, and the app's flagship
 * Ganesha pooja skipped it entirely.
 *
 * THIRTEEN steps are added and the order changes to the book's:
 *
 *      purvangam
 *   5  Vighneshwara Sankalpam        the short resolve, for the preliminary rite
 *   6  Sakala Devata Vandanam
 *   7  Deepa Pooja
 *   8  Asana Pooja
 *   9  Ghanta Pooja                  (was 7)
 *  10  Vighneshwara Pooja            the preliminary pooja, dhyana to pushpa
 *  11  Vighneshwara Shodasha Nama Archana   its sixteen names
 *  12  Vighneshwara Naivedyam & Neerajanam  its offering and camphor
 *  13  Sankalpam                     the MAIN resolve (was 5)
 *  14  Vighneshwara Udvasanam        the preliminary Ganesha is sent back
 *  15  Kalasha Pooja                 (was 6)
 *  16  Shankha Pooja                 skippable; not every house has a conch
 *  17  Atma Pooja
 *  18  Peetha Pooja
 *  19  Guru Dhyanam
 *      ... pradhana and uttara unchanged, renumbered
 *  34  Upayana Danam                 the gift to the priest or an elder
 *
 * The reordering matters as much as the additions. The book puts Ghanta Pooja
 * BEFORE the preliminary rite and Kalasha Pooja AFTER the main sankalpam; the
 * app had Kalasha before Ghanta and both before everything. And the main
 * sankalpam's own tail, written in 0024, ends "tadangam kalasha poojam cha
 * karishye" -- I shall also perform the kalasha pooja as a limb of this -- which
 * only makes sense if the kalasha pooja comes after it. It now does.
 *
 * NOT added as its own step: the book's second Pranayamam (step 9), which sits
 * between the preliminary pooja and the main sankalpam. Steps here are addressed
 * by the natural key (pooja_id, step_title_en) in every migration, so a second
 * row titled "Pranayamam" would collide with the first. It is carried in the
 * Sankalpam step's instruction instead, where the book places it.
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
const PHOTO =
  'Transcribed from a photograph of the printed page, so unlike the round-tripped sources in this project it carries no reversibility proof.';
const TA_DRAFT =
  'Tamil instruction prose is this project’s own drafting, not the book’s, and is the least reviewed text here.';

// -----------------------------------------------------------------------------
// The new steps, in the book's order.
// -----------------------------------------------------------------------------
//
// `deva` is the mantra. `archana`, where present, replaces it: the viewer
// renders a step as EITHER a recitation or a list of offerings, never both, so
// the sixteen names are their own step exactly as the Durva and Patra poojas
// are.

const STEPS = [
  {
    n: 5,
    en: 'Vighneshwara Sankalpam',
    ta: 'விக்னேஸ்வர சங்கல்பம்',
    phase: 'purvangam',
    page: 'p.4, step 4',
    deva: [
      'ममोपात्त समस्त दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं',
      'करिष्यमाणस्य कर्मणः निर्विघ्नेन परिसमाप्त्यर्थं',
      'आदौ विघ्नेश्वर पूजां करिष्ये ।',
    ],
    instr:
      'Hold the left palm upright on the right thigh with the right palm crossed over it, and resolve to perform the Vighneshwara pooja first. This is the SHORT resolve, for the obstacle-removing rite only; the main resolve for the Ganesha pooja itself comes later, after that rite is complete. Wash the hands afterwards.',
    instrTa:
      'இடது உள்ளங்கையை வலது தொடையின் மீது நிமிர்த்தி வைத்து, வலது உள்ளங்கையை அதன் மேல் குறுக்காக வைக்கவும். விக்னேஸ்வர பூஜையை முதலில் செய்யச் சங்கல்பம் செய்யவும். இது தடைகளை நீக்கும் சிறு பூஜைக்கான சுருக்கமான சங்கல்பம்; முழு கணேச பூஜைக்கான சங்கல்பம் பின்னர் வரும். பிறகு கைகளைக் கழுவவும்.',
    meaning:
      'For the pleasure of Parameshvara, through the destruction of all the sin I have accumulated, and so that the rite I am about to perform reaches its end without obstruction, I shall first worship Vighneshwara.',
  },
  {
    n: 6,
    en: 'Sakala Devata Vandanam',
    ta: 'ஸகல தேவதா வந்தனம்',
    phase: 'purvangam',
    page: 'p.4, step 5',
    deva: [
      'आब्रह्मलोकात् आशेषात् आलोकालोकपर्वतात् ।',
      'ये वसन्ति द्विजा देवाः तेभ्यो नित्यं नमो नमः ॥',
    ],
    instr:
      'Join the palms and salute every deity, from the world of Brahma down to the Lokaloka mountain at the edge of the worlds. Nothing is offered here; it is a salutation made before the household rite begins.',
    instrTa:
      'கைகளைக் கூப்பி, ப்ரம்மலோகம் முதல் உலகங்களின் எல்லையிலுள்ள லோகாலோக பர்வதம் வரை வாழும் அனைத்து தேவர்களையும் வணங்கவும். இங்கு எதுவும் சமர்ப்பிக்கப்படுவதில்லை; வீட்டுப் பூஜை தொடங்கும் முன் செய்யும் வணக்கம்.',
    meaning:
      'To the twice-born and the gods who dwell everywhere, from the world of Brahma to the Lokaloka mountain, salutation again and again, always.',
  },
  {
    n: 7,
    en: 'Deepa Pooja',
    ta: 'தீப பூஜை',
    phase: 'purvangam',
    page: 'p.5',
    deva: [
      'दीपज्योतिः परं ब्रह्म दीपज्योतिर्जनार्दनः ।',
      'दीपो हरतु मे पापम् दीपज्योतिर्नमोऽस्तु ते ॥',
    ],
    instr:
      'Light the lamps facing east while reciting this. Then apply kumkumam to the base and the rim of the lamp and offer flowers and akshatai to it.',
    instrTa:
      'கிழக்கு நோக்கி விளக்குகளை ஏற்றி இதைச் சொல்லவும். பிறகு விளக்கின் அடியிலும் விளிம்பிலும் குங்குமம் இட்டு, பூவும் அட்சதையும் சமர்ப்பிக்கவும்.',
    meaning:
      'The light of the lamp is the supreme Brahman; the light of the lamp is Janardana. May the lamp take away my sin. Salutation to you, light of the lamp.',
  },
  {
    n: 8,
    en: 'Asana Pooja',
    ta: 'ஆஸன பூஜை',
    phase: 'purvangam',
    page: 'p.5, step 6',
    deva: [
      'पृथ्वी त्वया धृता लोका देवि त्वं विष्णुना धृता ।',
      'त्वं च धारय मां देवि पवित्रं कुरु च आसनम् ॥',
    ],
    instr:
      'Sprinkle a little water on your seat while reciting this, sitting OUTSIDE the seat. Then take your place on it. The seat is consecrated before the performer occupies it, not after.',
    instrTa:
      'ஆஸனத்திற்கு வெளியே அமர்ந்து, இதைச் சொல்லிக்கொண்டே ஆஸனத்தின் மீது சிறிது நீரைத் தெளிக்கவும். பிறகு அதில் அமரவும். பூஜை செய்பவர் அமருவதற்கு முன்பே ஆஸனம் சுத்தி செய்யப்படுகிறது.',
    meaning:
      'Earth, by you the worlds are borne, and you yourself are borne by Vishnu. Bear me too, O Devi, and make this seat pure.',
  },
  {
    n: 10,
    en: 'Vighneshwara Pooja',
    ta: 'விக்னேஸ்வர பூஜை',
    phase: 'purvangam',
    page: 'pp.6-9, step 8',
    deva: [
      'शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् ।',
      'प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥',
      'ॐ गणानां त्वा गणपतिं हवामहे कविं कवीनामुपमश्रवस्तमम् ।',
      'ज्येष्ठराजं ब्रह्मणां ब्रह्मणस्पत आ नः शृण्वन्नूतिभिः सीद सादनम् ॥',
      'ॐ भूर्भुवस्सुवरोम् ॥',
      'अगजानन पद्मार्कं गजाननमहर्निशम् ।',
      'अनेकदं तं भक्तानां एकदन्तमुपास्महे ॥',
      'अस्मिन् हरिद्राबिम्बे विघ्नेश्वरं ध्यायामि, विघ्नेश्वरं आवाहयामि ॥',
      'विघ्नेश्वराय नमः आसनं समर्पयामि ।',
      'विघ्नेश्वराय नमः पाद्यं समर्पयामि ।',
      'विघ्नेश्वराय नमः अर्घ्यं समर्पयामि ।',
      'विघ्नेश्वराय नमः आचमनीयं समर्पयामि ।',
      'विघ्नेश्वराय नमः स्नानं समर्पयामि ।',
      'विघ्नेश्वराय नमः स्नानानन्तरं आचमनीयं समर्पयामि ।',
      'विघ्नेश्वराय नमः वस्त्रयुग्मम् समर्पयामि ।',
      'विघ्नेश्वराय नमः यज्ञोपवीतम् समर्पयामि ।',
      'विघ्नेश्वराय नमः गन्धान् धारयामि, गन्धोपरि हरिद्रा कुङ्कुमम् समर्पयामि ।',
      'विघ्नेश्वराय नमः आभरणम् समर्पयामि ।',
      'विघ्नेश्वराय नमः अक्षतान् समर्पयामि ।',
      'विघ्नेश्वराय नमः पुष्पमालां समर्पयामि, पुष्पैः पूजयामि ।',
    ],
    instr:
      'This pooja is performed before every important rite and at the start of anything auspicious. Make a small cone of turmeric mixed with water and invoke Ganesha into it. Tap both temples gently five times with the knuckles while reciting the dhyanam. The Vedic gananam tva is for those who have learnt it with the proper intonation; anyone who has not begins at "agajanana padmarkam" instead, which the book gives in its place. Then offer the upacharas in order, using a little water and akshatai for each.',
    instrTa:
      'ஒவ்வொரு முக்கியமான காரியத்திற்கும் முன் செய்யப்படும் பூஜை இது. மஞ்சளைத் தண்ணீரில் பிசைந்து சிறு கூம்பு செய்து, அதில் விநாயகரை ஆவாஹனம் செய்யவும். த்யானம் சொல்லும்போது இரு கைகளின் முட்டிகளால் நெற்றிப் பொட்டுகளில் ஐந்து முறை மெதுவாகத் தட்டவும். "கணானாம் த்வா" வேத மந்திரம் முறையான ஸ்வரத்துடன் கற்றவர்களுக்கு மட்டுமே; கற்காதவர்கள் "அகஜானன பத்மார்க்கம்" என்பதிலிருந்து தொடங்கவும். பிறகு உபசாரங்களை வரிசையாக, சிறிது நீரும் அட்சதையும் கொண்டு சமர்ப்பிக்கவும்.',
    meaning:
      'He who wears white, who pervades all, moon-hued and four-armed, of gracious face: on him one meditates for the stilling of every obstacle. We invoke you, lord of the ganas, sage among sages, eldest king of prayers; hear us and take your seat. Into this turmeric image I meditate on Vighneshwara and invoke him, and offer him a seat, water for the feet, the arghyam, water to sip, bathing, cloth, the sacred thread, sandal and turmeric and kumkumam, an ornament, akshatai, and a garland of flowers.',
  },
  {
    n: 11,
    en: 'Vighneshwara Shodasha Nama Archana',
    ta: 'விக்னேஸ்வர ஷோடஶ நாம அர்ச்சனை',
    phase: 'purvangam',
    page: 'pp.9-10, step 8',
    instr:
      'Offer a flower, or a blade of arugampul, at each of the sixteen names. Durva is preferred to any flower for Ganesha.',
    instrTa:
      'பதினாறு நாமங்கள் ஒவ்வொன்றிலும் ஒரு பூ அல்லது ஒரு அருகம்புல் இதழ் சமர்ப்பிக்கவும். விநாயகருக்குப் பூவை விட அருகம்புல்லே உகந்தது.',
    meaning:
      'The sixteen names of Ganesha recited at the preliminary pooja: fair-faced, single-tusked, tawny, elephant-eared, pot-bellied, formidable, king over obstacles, the remover, the comet-bannered, chief of the ganas, moon-browed, elephant-faced, curve-trunked, winnow-eared, Heramba, and elder brother of Skanda.',
    archana: [
      ['ॐ सुमुखाय नमः', 'To the fair-faced one'],
      ['ॐ एकदन्ताय नमः', 'To the single-tusked one'],
      ['ॐ कपिलाय नमः', 'To the tawny one'],
      ['ॐ गजकर्णकाय नमः', 'To the elephant-eared one'],
      ['ॐ लम्बोदराय नमः', 'To the pot-bellied one'],
      ['ॐ विकटाय नमः', 'To the formidable one'],
      ['ॐ विघ्नराजाय नमः', 'To the king over obstacles'],
      ['ॐ विनायकाय नमः', 'To the remover'],
      ['ॐ धूमकेतवे नमः', 'To the comet-bannered one'],
      ['ॐ गणाध्यक्षाय नमः', 'To the chief of the ganas'],
      ['ॐ फालचन्द्राय नमः', 'To him who wears the moon on his brow'],
      ['ॐ गजाननाय नमः', 'To the elephant-faced one'],
      ['ॐ वक्रतुण्डाय नमः', 'To the curve-trunked one'],
      ['ॐ शूर्पकर्णाय नमः', 'To the winnow-eared one'],
      ['ॐ हेरम्बाय नमः', 'To Heramba'],
      ['ॐ स्कन्दपूर्वजाय नमः', 'To the elder brother of Skanda'],
    ],
    offeringDeva: 'पुष्पैः पूजयामि',
    offeringEn: 'Offer a flower or a blade of durva',
    offeringTa: 'ஒரு பூ அல்லது அருகம்புல் சமர்ப்பிக்கவும்',
  },
  {
    n: 12,
    en: 'Vighneshwara Naivedyam & Neerajanam',
    ta: 'விக்னேஸ்வர நைவேத்யம் & நீராஜனம்',
    phase: 'purvangam',
    page: 'pp.10-12, step 8',
    deva: [
      'महागणपतये नमः नानाविध परिमल पत्र पुष्पाणि समर्पयामि ।',
      'धूपमाघ्रापयामि, दीपं दर्शयामि ।',
      'धूप दीपानन्तरं आचमनीयं समर्पयामि ।',
      'ॐ भूर्भुवस्सुवः ।',
      'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि, धियो यो नः प्रचोदयात् ।',
      'देवसवितः प्रसुव । सत्यं त्वर्तेन परिषिञ्चामि ।',
      'अमृतोपस्तरणमसि ।',
      'ॐ प्राणाय स्वाहा । ॐ अपानाय स्वाहा ।',
      'ॐ व्यानाय स्वाहा । ॐ उदानाय स्वाहा ।',
      'ॐ समानाय स्वाहा । ॐ ब्रह्मणे स्वाहा ।',
      'मध्ये मध्ये अमृतपानीयं समर्पयामि ।',
      'अमृतापिधानमसि । आचमनीयं समर्पयामि ।',
      'उत्तरापोशनम् समर्पयामि ।',
      'कर्पूरनीराजनं सन्दर्शयामि ।',
    ],
    variantDeva: 'देवसवितः प्रसुव । ऋतं त्वा सत्येन परिषिञ्चामि ।',
    variantNote:
      'Recited in place of the morning line when the pooja is performed in the evening. The book prints the two forms side by side, labelled (Morning) and (Evening).',
    instr:
      'Offer incense and wave the ghee lamp. Then place the naivedyam — a fruit or a piece of jaggery is enough for this preliminary rite — sprinkle water over it, circle water around the plate clockwise three times, and make the six offerings, gesturing with the right hand as if feeding the deity at each "svaha". Finish by waving camphor clockwise.',
    instrTa:
      'தூபம் காட்டி, நெய் தீபம் ஏற்றிக் காட்டவும். பிறகு நைவேத்யத்தை — இந்தச் சிறு பூஜைக்கு ஒரு பழமோ சிறிது வெல்லமோ போதும் — வைத்து, அதன் மீது நீர் தெளித்து, தட்டைச் சுற்றி மூன்று முறை வலம் வரும்படி நீர் சுற்றவும். ஒவ்வொரு "ஸ்வாஹா"விலும் வலக்கையால் ஊட்டுவது போல் சைகை செய்யவும். இறுதியில் கற்பூரம் ஏற்றி வலமாகச் சுற்றிக் காட்டவும்.',
    meaning:
      'I offer fragrant leaves and flowers of many kinds. I offer incense and show the lamp, and water to sip after them. Then the vyahritis, the Gayatri, and the offering of the food to the five breaths and to Brahman, water in between, and finally the camphor light.',
  },
  {
    n: 14,
    en: 'Vighneshwara Udvasanam',
    ta: 'விக்னேஸ்வர உத்வாசனம்',
    phase: 'purvangam',
    page: 'p.14, step 11',
    deva: [
      'वक्रतुण्ड महाकाय कोटिसूर्यसमप्रभ ।',
      'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
      'श्री विघ्नेश्वरं यथास्थानं प्रतिष्ठापयामि,',
      'शोभनार्थे क्षेमाय पुनरागमनाय च ।',
      'विघ्नेश्वर प्रसादं शिरसा गृह्णामि ॥',
    ],
    instr:
      'The obstacle-removing rite is complete, so its Ganesha is sent back. Move the turmeric cone a little towards the north. Receive the flowers that were offered to it, touch them to your eyes and place them on your head, or give them to the women of the household. Then take water in the uddharani and wash the hands.',
    instrTa:
      'தடை நீக்கும் பூஜை முடிந்ததால், அந்த விநாயகரை யதாஸ்தானம் செய்யவும். மஞ்சள் கூம்பைச் சிறிது வடக்கு நோக்கி நகர்த்தவும். சமர்ப்பித்த பூக்களைப் பக்தியுடன் பெற்று, கண்களில் ஒற்றி, தலையில் வைக்கவும், அல்லது வீட்டுப் பெண்களுக்குக் கொடுக்கவும். பிறகு உத்தரணியில் நீர் எடுத்துக் கைகளைக் கழுவவும்.',
    meaning:
      'Curve-trunked, mighty-bodied, bright as a crore of suns: make all my undertakings free of obstacles, always. I establish Sri Vighneshwara back in his own place, for grace, for wellbeing, and so that he may come again. I receive his prasadam upon my head.',
  },
  {
    n: 16,
    en: 'Shankha Pooja',
    ta: 'ஶங்க பூஜை',
    phase: 'purvangam',
    page: 'pp.16-17, step 13',
    deva: [
      'शङ्खं चन्द्रार्क दैवत्यं मध्ये वरुण दैवतम् ।',
      'पृष्ठे प्रजापति विद्यात् अग्रे गङ्गा सरस्वती ॥',
      'त्वं पुरा सागरोत्पन्नः विष्णुना विधृतः करे ।',
      'पूजितः सर्व देवैश्च पाञ्चजन्य नमोऽस्तु ते ॥',
      'त्रैलोक्ये यानि तीर्थानि वासुदेवस्य च आज्ञया ।',
      'शङ्खे तिष्ठन्ति विप्रेन्द्र तस्माच्छङ्खं प्रपूजयेत् ॥',
      'पाञ्चजन्याय विद्महे पवमानाय धीमहि ।',
      'तन्नः शङ्खः प्रचोदयात् ॥',
      'शङ्खाय नमः । पर्जन्याय नमः । पाञ्चजन्याय नमः ।',
      'अं अर्कमण्डलाय नमः । रं वह्निमण्डलाय नमः ।',
      'सं सोममण्डलाय नमः । सप्तकोटि महातीर्थेभ्यो नमः ।',
      'शङ्खराजाय नमः । समस्तोपचारान् समर्पयामि ॥',
    ],
    instr:
      'SKIP THIS STEP IF THERE IS NO CONCH IN THE HOUSE — the book says so plainly, while adding that it is worth keeping at least a small one, since the conch stands for the pranava and is a dwelling of Lakshmi. Set the conch on a firm stand, anoint it with sandal paste and kumkumam, and fill it with water from the panchapatra while saying the Gayatri or Om three times. After the mantras, sprinkle every article set aside for the pooja with water from the conch, then refill it.',
    instrTa:
      'வீட்டில் ஶங்கு இல்லையென்றால் இந்தப் படியைத் தவிர்க்கலாம் — புத்தகமே இதைத் தெளிவாகச் சொல்கிறது. ஆயினும் ஶங்கு ப்ரணவத்தைக் குறிப்பதாலும் லக்ஷ்மியின் இருப்பிடம் என்பதாலும் சிறியதாவது வைத்திருப்பது நல்லது. ஶங்கை உறுதியான பீடத்தில் வைத்து, சந்தனமும் குங்குமமும் இட்டு, காயத்ரி அல்லது ஓம் மூன்று முறை சொல்லிப் பஞ்சபாத்திரத்திலிருந்து நீர் நிரப்பவும். மந்திரங்களுக்குப் பிறகு, பூஜைக்கு வைத்துள்ள பொருட்கள் அனைத்தின் மீதும் ஶங்கு நீரைத் தெளித்து, மீண்டும் நிரப்பவும்.',
    meaning:
      'The conch has the sun and moon for its deity, Varuna at its middle, Prajapati at its back, and Ganga and Sarasvati at its mouth. You rose long ago from the ocean and were held in Vishnu’s hand, worshipped by all the gods: salutation to you, Panchajanya. By Vasudeva’s command, every sacred water in the three worlds abides in the conch; therefore let the conch be worshipped.',
  },
  {
    n: 17,
    en: 'Atma Pooja',
    ta: 'ஆத்ம பூஜை',
    phase: 'purvangam',
    page: 'p.18, step 14',
    deva: [
      'देहो देवालयः प्रोक्तः जीवो देवः सनातनः ।',
      'त्यजेदज्ञान निर्माल्यं सोऽहं भावेन पूजयेत् ॥',
    ],
    instr:
      'Turn the mind inward for a few seconds, holding that the self dwelling within pervades the world and is one in essence with the supreme Self. Then place a little akshatai on your own head, as an act of worshipping yourself.',
    instrTa:
      'சில வினாடிகள் மனதை உள்நோக்கித் திருப்பி, உள்ளே உறையும் ஆத்மா உலகெங்கும் நிறைந்தது என்றும், பரமாத்மாவுடன் ஒன்றே என்றும் நினைக்கவும். பிறகு உங்கள் தலையிலேயே சிறிது அட்சதை இட்டுக்கொள்ளவும் — அது தன்னைத் தானே பூஜிக்கும் செயல்.',
    meaning:
      'The body is called a temple; the living self is the eternal deity. Cast away the withered flowers of ignorance, and worship with the thought "I am That."',
  },
  {
    n: 18,
    en: 'Peetha Pooja',
    ta: 'பீட பூஜை',
    phase: 'purvangam',
    page: 'pp.18-19, step 15',
    deva: [
      'ॐ आधारशक्त्यै नमः ।',
      'ॐ मूलप्रकृत्यै नमः ।',
      'ॐ आदि कूर्माय नमः ।',
      'ॐ आदि वराहाय नमः ।',
      'ॐ अनन्ताय नमः ।',
      'ॐ पृथिव्यै नमः ।',
      'ॐ रत्नमण्डपाय नमः ।',
      'ॐ रत्नवेदिकायै नमः ।',
      'ॐ स्वर्ण स्तम्भाय नमः ।',
      'ॐ श्वेतच्छत्राय नमः ।',
      'ॐ कल्पक वृक्षाय नमः ।',
      'ॐ क्षीर समुद्राय नमः ।',
      'ॐ सित चामराभ्यां नमः ।',
      'ॐ योगपीठासनाय नमः ॥',
    ],
    instr:
      'Worship the seat on which the deity will be enshrined, offering a flower and akshatai at each name. The fourteen names build the seat upward from the power that holds everything, through the tortoise and the boar and the earth, to the jewelled pavilion, the golden pillar, the white parasol, the wish-giving tree, the ocean of milk, the two white whisks, and last the yoga seat itself.',
    instrTa:
      'தெய்வம் எழுந்தருளப் போகும் பீடத்தைப் பூஜிக்கவும்; ஒவ்வொரு நாமத்திலும் ஒரு பூவும் அட்சதையும் சமர்ப்பிக்கவும். இந்தப் பதினான்கு நாமங்கள் அனைத்தையும் தாங்கும் ஆதாரசக்தியிலிருந்து தொடங்கி, கூர்மம், வராகம், பூமி வழியாக, ரத்ன மண்டபம், ஸ்வர்ண ஸ்தம்பம், வெண்குடை, கற்பக விருக்ஷம், க்ஷீர ஸமுத்திரம், வெண் சாமரங்கள், இறுதியாக யோக பீடாஸனம் வரை பீடத்தைக் கட்டுகின்றன.',
    meaning:
      'Salutation to the supporting power, to primordial nature, to the first tortoise, to the first boar, to Ananta, to the earth, to the jewelled pavilion, to the jewelled altar, to the golden pillar, to the white parasol, to the wish-giving tree, to the ocean of milk, to the two white whisks, and to the seat of yoga.',
  },
  {
    n: 19,
    en: 'Guru Dhyanam',
    ta: 'குரு த்யானம்',
    phase: 'purvangam',
    page: 'p.19, step 16',
    deva: [
      'गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः ।',
      'गुरुस्साक्षात् परं ब्रह्म तस्मै श्री गुरवे नमः ॥',
    ],
    instr:
      'Contemplate your own teacher, as your family tradition holds. This is the last step before the deity is meditated upon and invoked.',
    instrTa:
      'உங்கள் குடும்ப மரபின்படி உங்கள் குருவை த்யானிக்கவும். தெய்வத்தை த்யானித்து ஆவாஹனம் செய்வதற்கு முந்தைய கடைசிப் படி இது.',
    meaning:
      'The guru is Brahma, the guru is Vishnu, the guru is the god Maheshwara; the guru is verily the supreme Brahman. To that guru, salutation.',
  },
  {
    n: 34,
    en: 'Upayana Danam',
    ta: 'உபாயன தானம்',
    phase: 'uttara',
    page: 'p.82',
    deva: [
      'महागणपति स्वरूपस्य ब्राह्मणस्य इदमासनम् ।',
      'अमीते गन्धाः सकलाराधनैः स्वर्चितम् ॥',
      'गणेशो प्रतिगृह्णाति गणेशो वै ददाति च ।',
      'गणेशस्तारकोद्वाभ्यां गणेशाय नमो नमः ॥',
      'इदं उपायनं सदक्षिणाकं सताम्बूलं',
      'महागणपति स्वरूपाय ब्राह्मणाय तुभ्यं अहं संप्रददे न मम ॥',
    ],
    instr:
      'Give fruit, tambulam and dakshinai either to the priest who performed the pooja or to an elder of the house, after prostrating before them and asking their blessing. Offer them a seat, sandal paste and akshatai first. The words say plainly that the gift is not yours to keep: Ganesha receives it and Ganesha gives it.',
    instrTa:
      'பூஜை செய்த புரோகிதருக்கோ, வீட்டின் மூத்தவருக்கோ பழம், தாம்பூலம், தக்ஷிணை ஆகியவற்றை அளிக்கவும். அதற்கு முன் அவர்களை நமஸ்கரித்து ஆசி பெறவும். முதலில் ஆஸனம், சந்தனம், அட்சதை சமர்ப்பிக்கவும். "இது என்னுடையதல்ல" என்று மந்திரமே தெளிவாகச் சொல்கிறது — கணேசரே பெறுகிறார், கணேசரே அளிக்கிறார்.',
    meaning:
      'This seat is for the brahmana who is the very form of Mahaganapati; these fragrances are offered with every act of worship. Ganesha receives and Ganesha gives; Ganesha is on both sides of the crossing. Salutation to Ganesha. This gift, with its dakshinai and its tambulam, I present to you, the brahmana who is the form of Mahaganapati — it is not mine.',
  },
];

/** Steps that keep their content but move, and the number they move to. */
const RENUMBER = [
  ['Achamanam', 1],
  ['Anga Vandanam', 2],
  ['Vighneshwara Dhyanam', 3],
  ['Pranayamam', 4],
  ['Ghanta Pooja', 9],
  ['Sankalpam', 13],
  ['Kalasha Pooja', 15],
  ['Avahanam & Asanam', 20],
  ['Prana Pratishtha', 21],
  ['Padyam & Arghyam', 22],
  ['Snanam & Vastram', 23],
  ['Gandham, Kumkumam & Pushpam', 24],
  ['Anga Pooja', 25],
  ['Patra Pooja (21 Leaves)', 26],
  ['Pushpa Pooja (21 Flowers)', 27],
  ['Durva Pooja (21 Names)', 28],
  ['Ganapathi Ashtottara Shatanamavali', 29],
  ['Dhoopam & Deepam', 30],
  ['Naivedyam & Tambulam', 31],
  ['Karpura Neerajanam', 32],
  ['Mantra Pushpam & Namaskaram', 33],
  ['Ksheera Arghyam', 35],
  ['Kshama Prarthana & Conclusion', 36],
  ['Udvasanam', 37],
];

/**
 * The second pranayamam, which cannot be its own row -- see the header. Carried
 * in the main sankalpam's instruction, which is where the book puts it.
 */
const SANKALPAM_INSTR_PREFIX =
  'Perform pranayamam once more before this, holding a little akshatai and touching the right ear with the right hand. Then ';

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------

const SLOT = /\[[A-Z0-9_]+\]/g;
const masked = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.replace(SLOT, '') : v]),
  );

const scripts = (deva) => ({
  deva,
  ta: transliterate(Sanscript, deva, 'tamil'),
  iast: transliterate(Sanscript, deva, 'iast'),
});

console.log('--- building ---\n');

const seen = new Set();
const built = STEPS.map((s) => {
  if (seen.has(s.en)) fail(`two steps titled "${s.en}"; the natural key would collide`);
  seen.add(s.en);
  const o = { ...s };
  if (s.deva) {
    // NOT Object.assign(o, scripts(...)). scripts() returns a key named `ta`,
    // and so does a step -- its Tamil TITLE. Assigning one over the other put
    // the Tamil MANTRA into step_title_ta on twelve of the thirteen steps this
    // migration added, and checkScripts could not see it because a mantra is
    // perfectly valid Tamil. Only the archana step, which has no mantra,
    // escaped. Named explicitly now so the collision cannot recur.
    const m = scripts(s.deva.join('\n'));
    o.mantraDeva = m.deva;
    o.mantraTa = m.ta;
    o.mantraIast = m.iast;
    checkScripts(`${s.en}`, masked(m), fail);
  }
  if (s.variantDeva) {
    const v = scripts(s.variantDeva);
    checkScripts(`${s.en} variant`, masked(v), fail);
    o.variant = v.deva;
  }
  if (s.archana) {
    o.archanaRows = s.archana.map(([deva, en], i) => {
      const a = scripts(deva);
      checkScripts(`${s.en}[${i + 1}]`, masked(a), fail);
      return { seq: i + 1, ...a, meaning: en };
    });
    const off = scripts(s.offeringDeva);
    checkScripts(`${s.en} offering`, masked(off), fail);
    o.offering = off;
  }
  if (!s.deva && !s.archana) fail(`${s.en} has neither a mantra nor an archana list`);
  if (!s.instrTa) fail(`${s.en} has no Tamil instruction`);
  // A title is a few words. A mantra has dandas and runs to hundreds of
  // characters. This is the check that would have caught the collision above.
  for (const [k, v] of [['en', s.en], ['ta', s.ta]]) {
    if (v.length > 60 || /[।॥\n]/.test(v)) {
      fail(`${s.en}: step_title_${k} looks like mantra text, not a title`);
    }
  }
  console.log(
    `  ${String(s.n).padStart(2)} ${s.en.padEnd(38)} ${
      s.archana ? `${s.archana.length} offerings` : `${s.deva.length} lines`
    }`,
  );
  return o;
});

// Every number in the finished pooja must be used exactly once.
const finalNumbers = [...built.map((s) => s.n), ...RENUMBER.map(([, n]) => n)].sort((a, b) => a - b);
for (let i = 0; i < finalNumbers.length; i++) {
  if (finalNumbers[i] !== i + 1) {
    fail(`step numbers are not 1..${finalNumbers.length}: expected ${i + 1}, got ${finalNumbers[i]}`);
    break;
  }
}
console.log(`\n  ${finalNumbers.length} steps after this migration (${built.length} new)`);

if (failed) {
  console.error('\nRefusing to emit: fix the failures above.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// SQL
// -----------------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [];
const out = (s = '') => lines.push(s);

out('-- =============================================================================');
out('-- 0025_ganesha_missing_steps.sql');
out('--');
out('-- GENERATED by scripts/build-ganesha-missing-steps.mjs. Do not hand-edit.');
out('--');
out('-- The book’s purvangam has eighteen numbered steps. This pooja had seven.');
out('-- Thirteen are added and the order becomes the book’s: 24 steps -> 37.');
out('--');
out('-- The largest gap was the preliminary Vighneshwara Pooja, a complete rite with');
out('-- its own upacharas, sixteen-name archana, naivedyam and camphor, performed');
out('-- before every important act. The app’s flagship GANESHA pooja skipped it.');
out('--');
out('-- Reordering matters as much: the book puts Ghanta Pooja before the preliminary');
out('-- rite and Kalasha Pooja AFTER the main sankalpam. 0024 gave that sankalpam the');
out('-- tail "tadangam kalasha poojam cha karishye" -- and as a limb of this I shall');
out('-- also perform the kalasha pooja -- which only parses if the kalasha pooja');
out('-- follows it. It now does.');
out('--');
out('-- Idempotent: inserts are guarded on the natural key, and the renumber is a');
out('-- straight assignment rather than an increment.');
out('-- =============================================================================');
out();
out('begin;');
out();

out('-- --- 0. enforce the natural key ----------------------------------------------');
out('-- Every migration in this project addresses a step by (pooja_id,');
out('-- step_title_en) -- uuids differ per environment, so they have never been');
out('-- usable -- and the database has never enforced it. That is why this migration');
out('-- cannot use ON CONFLICT without adding it first, and it is worth adding on its');
out('-- own account: two rows sharing a title would silently make every later');
out('-- migration update the wrong one, or both. Verified clean on 53 rows before');
out('-- this was written.');
out('do $$');
out('begin');
out('  if not exists (');
out('    select 1 from pg_constraint where conname = \'pooja_steps_pooja_title_uk\'');
out('  ) then');
out('    alter table public.pooja_steps');
out('      add constraint pooja_steps_pooja_title_uk unique (pooja_id, step_title_en);');
out('  end if;');
out('end $$;');
out();

out('-- --- 1. park every existing number out of the way ----------------------------');
out('-- The unique constraint on (pooja_id, step_number) makes an in-place shuffle');
out('-- impossible: some intermediate state always has two rows on one number.');
out("update public.pooja_steps set step_number = step_number + 1000");
out(" where pooja_id = 'ganesha_standard' and step_number < 1000;");
out();

out('-- --- 2. the new steps ---------------------------------------------------------');
for (const s of built) {
  const ref = `${BOOK}, purvanga pooja ${s.page}. ${PHOTO} ${TA_DRAFT}`;
  out(`-- ${s.n} ${s.en}`);
  out('insert into public.pooja_steps');
  out('  (pooja_id, step_number, step_title_en, step_title_ta, phase,');
  out('   instruction_en, instruction_ta, mantra_sanskrit, mantra_tamil, mantra_translit,');
  out('   variant_mantra_sanskrit, variant_note_en, meaning_en, source_ref, gender_rule, modes)');
  out('values (');
  out(`  'ganesha_standard', ${s.n}, ${q(s.en)}, ${q(s.ta)}, ${q(s.phase)},`);
  out(`  ${q(s.instr)},`);
  out(`  ${q(s.instrTa)},`);
  // An archana step has no mantra at all; the three script columns stay null
  // and the offerings carry the text. Asserted at the end of the migration.
  out(`  ${q(s.mantraDeva ?? null)},`);
  out(`  ${q(s.mantraTa ?? null)},`);
  out(`  ${q(s.mantraIast ?? null)},`);
  out(`  ${q(s.variant ?? null)}, ${q(s.variantNote ?? null)},`);
  // modes is text[], NOT jsonb. PostgREST serialises it as ["main","punar"] in
  // its JSON output, which is what made it look like jsonb; the column is an
  // array of text and an ::jsonb cast is rejected outright.
  out(`  ${q(s.meaning)}, ${q(ref)}, 'all', '{main,punar}'::text[]`);
  out(')');
  out("on conflict (pooja_id, step_title_en) do update set");
  out('  step_number = excluded.step_number,');
  out('  step_title_ta = excluded.step_title_ta,');
  out('  phase = excluded.phase,');
  out('  instruction_en = excluded.instruction_en,');
  out('  instruction_ta = excluded.instruction_ta,');
  out('  mantra_sanskrit = excluded.mantra_sanskrit,');
  out('  mantra_tamil = excluded.mantra_tamil,');
  out('  mantra_translit = excluded.mantra_translit,');
  out('  variant_mantra_sanskrit = excluded.variant_mantra_sanskrit,');
  out('  variant_note_en = excluded.variant_note_en,');
  out('  meaning_en = excluded.meaning_en,');
  out('  source_ref = excluded.source_ref,');
  out('  modes = excluded.modes,');
  out('  updated_at = now();');
  out();

  if (s.archanaRows) {
    out(`-- ${s.en}: ${s.archanaRows.length} offerings`);
    out('delete from public.archana_items a using public.pooja_steps s');
    out(` where a.pooja_step_id = s.id and s.pooja_id = 'ganesha_standard'`);
    out(`   and s.step_title_en = ${q(s.en)};`);
    out('insert into public.archana_items');
    out('  (pooja_step_id, seq, invoked_name_deva, invoked_name_ta, invoked_name_translit,');
    out('   offering_deva, offering_en, offering_ta, meaning_en)');
    out('select s.id, v.seq, v.deva, v.ta, v.iast,');
    out(`       ${q(s.offering.deva)}, ${q(s.offeringEn)}, ${q(s.offeringTa)}, v.meaning`);
    out('  from public.pooja_steps s, (values');
    out(
      s.archanaRows
        .map(
          (r) =>
            `    (${r.seq}, ${q(r.deva)}, ${q(r.ta)}, ${q(r.iast)}, ${q(r.meaning)})`,
        )
        .join(',\n'),
    );
    out('  ) as v(seq, deva, ta, iast, meaning)');
    out(` where s.pooja_id = 'ganesha_standard' and s.step_title_en = ${q(s.en)};`);
    out();
  }
}

out('-- --- 3. the steps that keep their content and move ---------------------------');
for (const [title, n] of RENUMBER) {
  out(
    `update public.pooja_steps set step_number = ${n}, updated_at = now()` +
      ` where pooja_id = 'ganesha_standard' and step_title_en = ${q(title)};`,
  );
}
out();

out('-- --- 4. the second pranayamam, carried in the sankalpam instruction ----------');
out('-- The book performs pranayamam again between the preliminary rite and the main');
out('-- resolve. It cannot be a row of its own: every migration addresses steps by');
out('-- (pooja_id, step_title_en), so a second "Pranayamam" would collide.');
out('update public.pooja_steps set');
out(`  instruction_en = ${q(SANKALPAM_INSTR_PREFIX)} || instruction_en,`);
out('  updated_at = now()');
out(" where pooja_id = 'ganesha_standard' and step_title_en = 'Sankalpam'");
out(`   and position(${q(SANKALPAM_INSTR_PREFIX)} in instruction_en) = 0;`);
out();

out('-- --- assert -------------------------------------------------------------------');
out('do $$');
out('declare n int;');
out('begin');
out(`  select count(*) into n from public.pooja_steps where pooja_id = 'ganesha_standard';`);
out(`  if n <> ${finalNumbers.length} then raise exception 'expected ${finalNumbers.length} Ganesha steps, found %', n; end if;`);
out('  -- Nothing parked, and the numbers are 1..n with no gap and no repeat.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard' and step_number >= 1000;");
out("  if n > 0 then raise exception '% Ganesha steps were left parked above 1000', n; end if;");
out('  select (max(step_number) - min(step_number) + 1) - count(*) into n');
out("    from public.pooja_steps where pooja_id = 'ganesha_standard';");
out("  if n <> 0 then raise exception 'Ganesha step numbers are not dense'; end if;");
out('  select count(*) into n from (');
out("    select step_number from public.pooja_steps where pooja_id = 'ganesha_standard'");
out('     group by 1 having count(*) > 1) x;');
out("  if n > 0 then raise exception '% Ganesha step numbers are used twice', n; end if;");
out("  if (select min(step_number) from public.pooja_steps where pooja_id = 'ganesha_standard') <> 1");
out("    then raise exception 'Ganesha steps do not start at 1'; end if;");
out('  -- The preliminary rite exists, and comes before the main resolve.');
out('  select count(*) into n from public.pooja_steps p, public.pooja_steps k');
out("   where p.pooja_id = 'ganesha_standard' and p.step_title_en = 'Vighneshwara Pooja'");
out("     and k.pooja_id = 'ganesha_standard' and k.step_title_en = 'Sankalpam'");
out('     and p.step_number < k.step_number;');
out("  if n <> 1 then raise exception 'the preliminary Vighneshwara pooja is missing or misplaced'; end if;");
out('  -- and the kalasha pooja now follows the sankalpam that announces it.');
out('  select count(*) into n from public.pooja_steps s, public.pooja_steps k');
out("   where s.pooja_id = 'ganesha_standard' and s.step_title_en = 'Sankalpam'");
out("     and k.pooja_id = 'ganesha_standard' and k.step_title_en = 'Kalasha Pooja'");
out('     and k.step_number > s.step_number;');
out("  if n <> 1 then raise exception 'the kalasha pooja does not follow the sankalpam'; end if;");
out('  -- The sixteen names landed.');
out('  select count(*) into n from public.archana_items a join public.pooja_steps s');
out('    on s.id = a.pooja_step_id');
out("   where s.step_title_en = 'Vighneshwara Shodasha Nama Archana';");
out("  if n <> 16 then raise exception 'expected 16 shodasha namas, found %', n; end if;");
out('  -- Every new step is sourced, in Tamil as well as English.');
out('  select count(*) into n from public.pooja_steps');
out("   where pooja_id = 'ganesha_standard'");
out('     and (source_ref is null or instruction_ta is null or step_title_ta is null);');
out("  if n > 0 then raise exception '% Ganesha steps are missing a source or Tamil text', n; end if;");
out('  -- A step is a recitation or a list, never both.');
out('  select count(*) into n from public.pooja_steps s');
out("   where s.pooja_id = 'ganesha_standard' and s.mantra_sanskrit is not null");
out('     and exists (select 1 from public.archana_items a where a.pooja_step_id = s.id);');
out("  if n > 0 then raise exception '% steps have both a mantra and an archana list', n; end if;");
out('end $$;');
out();
out('commit;');
out();
out('-- Verify:');
out("--   select step_number, phase, step_title_en from pooja_steps");
out("--    where pooja_id = 'ganesha_standard' order by step_number;");

const sql = lines.join('\n') + '\n';

if (process.argv.includes('--emit')) {
  emitMigration('supabase/migrations/0025_ganesha_missing_steps.sql', sql);
} else {
  console.log('\n--- validated, not written (pass --emit) ---');
}
