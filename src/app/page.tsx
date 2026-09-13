import React from 'react';
import { supabase } from '@/lib/supabase';
import { PoojaViewer } from '@/components/PoojaViewer';
import { TempleBell } from '@/components/TempleBell';
import { Pooja, PoojaStep } from '@/types/pooja';

// Fallback Mock Data for Ganesha Pooja if database table is not yet populated
const FALLBACK_POOJA: Pooja = {
  id: 'ganesha_standard',
  title_en: 'Shri Maha Ganesha Standard Vidhi & Archana',
  title_ta: 'ஸ்ரீ மகா கணபதி பூஜை & அஷ்டோத்திர அர்ச்சனை',
  description_en: 'Complete authentic guided Ganesh Puja vidhi with Samagri checklist, 108 Ashtottara Namavali Archana, and camphor Aarti.',
  description_ta: 'சகல காரிய சித்திக்கான ஸ்ரீ மகா கணபதி பூஜை மற்றும் 108 அஷ்டோத்திர நாமவாளி அர்ச்சனை வழிபாட்டு முறை.',
  samagri_list: [
    { item_en: 'Ganesha Idol / Picture', item_ta: 'கணபதி விக்கிரகம் / படம்', quantity: '1', required: true },
    { item_en: 'Turmeric Powder (Manjal)', item_ta: 'மஞ்சள் பொடி (பிள்ளையார் செய்ய)', quantity: '50g', required: true },
    { item_en: 'Kumkum & Sandalwood Paste', item_ta: 'குங்குமம் & சந்தனம்', quantity: '1 pack', required: true },
    { item_en: 'Durva Grass (Arugampul)', item_ta: 'அறுகம்புல்', quantity: '1 bunch', required: true },
    { item_en: 'Red Flowers & Marigold', item_ta: 'சிவப்பு மலர்கள் & சாமந்தி', quantity: '1 basket', required: true },
    { item_en: 'Coconut, Betel Leaves & Nuts', item_ta: 'தேங்காய், வெற்றிலை பாக்கு', quantity: '2 coconuts', required: true },
    { item_en: 'Incense Sticks & Camphor', item_ta: 'ஊதுபத்தி & கற்பூரம்', quantity: '1 pack', required: true },
    { item_en: 'Ghee Lamp / Oil Diya', item_ta: 'நெய் தீபம்', quantity: '2 lamps', required: true },
    { item_en: 'Modak / Kozhukattai & Jaggery', item_ta: 'மோதகம் / கொழுக்கட்டை & வெல்லம்', quantity: 'As needed', required: true },
    { item_en: 'Panchamrit & Bananas', item_ta: 'பஞ்சாமிர்தம் & வாழைப்பழங்கள்', quantity: '1 bowl', required: true },
    { item_en: 'Temple Bell & Holy Water Bowl', item_ta: 'பூஜை மணி & தீர்த்த பாத்திரம்', quantity: '1 set', required: true },
  ],
  naivedyam_suggestions: [
    {
      id: 'n1',
      name_en: 'Steamed Modak (Kozhukattai)',
      name_ta: 'பூரண கொழுக்கட்டை',
      description_en: 'Steamed rice flour dumplings stuffed with sweet jaggery and freshly grated coconut.',
      description_ta: 'தேங்காய் மற்றும் வெல்லப் பூரணம் நிரப்பிய அருமையான சுவைமிக்க கொழுக்கட்டை.',
    },
    {
      id: 'n2',
      name_en: 'Black Chickpea Sundal',
      name_ta: 'கருப்பு கொண்டைக்கடலை சுண்டல்',
      description_en: 'Protein-rich boiled chickpeas tempered with mustard, curry leaves, and grated coconut.',
      description_ta: 'கடுகு, கருவேப்பிலை, தேங்காய் துருவல் தாளித்த சத்தான சுண்டல்.',
    },
    {
      id: 'n3',
      name_en: 'Fresh Panchamrit',
      name_ta: 'தேவாமிர்த பஞ்சாமிர்தம்',
      description_en: 'Sacred mixture of Milk, Curd, Ghee, Honey, and Bananas.',
      description_ta: 'பால், தயிர், நெய், தேன் மற்றும் வாழைப்பழம் கலந்த புனித நைவேத்தியம்.',
    },
    {
      id: 'n4',
      name_en: 'Sweet Boondi Laddu',
      name_ta: 'இனிப்பு பூந்தி லட்டு',
      description_en: 'Traditional golden laddus scented with cardamom and saffron.',
      description_ta: 'ஏலக்காய் மணத்துடன் கூடிய சுவையான பூந்தி லட்டு.',
    },
  ],
};

const FALLBACK_STEPS: PoojaStep[] = [
  {
    id: 'step-1',
    pooja_id: 'ganesha_standard',
    step_number: 1,
    step_title_en: 'Dhyanam & Avahanam (Meditation & Invocation)',
    step_title_ta: 'தியானம் & ஆவாஹனம் (பிரார்த்தனை)',
    instruction_en: 'Sit comfortably facing East. Light the Ghee Lamps and Incense sticks. Meditate upon Lord Ganesha’s divine radiant form removing all obstacles.',
    instruction_ta: 'கிழக்கு நோக்கி அமர்ந்து தீபம் மற்றும் தூபம் ஏற்றவும். விக்னங்களை தீர்க்கும் கணபதியை தியானித்து பூஜையைத் தொடங்கவும்.',
    mantra_sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
    mantra_tamil: 'வக்ரதுண்ட மஹாகாய சூர்யகோடி சமப்ரப। நிர்விக்னம் குரு மே தேவ ஸர்வகார்யேஷு ஸர்வதா॥',
    mantra_translit: 'Vakratunda Mahakaya Suryakoti Samaprabha | Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ||',
    meaning_en: 'O Lord with the curved trunk and immense body, whose brilliance equals ten million suns, please make all my endeavors free of obstacles always.',
    is_dynamic_sankalpam: false,
  },
  {
    id: 'step-2',
    pooja_id: 'ganesha_standard',
    step_number: 2,
    step_title_en: 'Sankalpam (Sacred Vow & Intention)',
    step_title_ta: 'சங்கல்பம் (பூஜை லட்சிய உறுதி)',
    instruction_en: 'Take a small amount of Akshata (rice) and water in your right palm. Recite your name, Gotram, and location to dedicate the pooja.',
    instruction_ta: 'வலது கையில் சிறிது அட்சதை மற்றும் நீர் எடுத்துக்கொண்டு, உங்கள் பெயர் மற்றும் கோத்திரத்தைக் கூறி சங்கல்பம் செய்யவும்.',
    mantra_sanskrit: 'ममोपात्त समस्त दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं श्री महागणपति पूजनानि करिष्ये।',
    mantra_tamil: 'மமோபாத்த சமஸ்த துரிதக்ஷயத்வாரா ஸ்ரீ பரமேஸ்வர ப்ரீத்யர்த்தம் ஸ்ரீ மஹாகணபதி பூஜனானி கரிஷ்யே।',
    mantra_translit: 'Mamopatta samasta duritakshayadvara shri parameshvara prityartham shri mahaganapati pujanani karishye |',
    meaning_en: 'I perform this Ganesha Puja to dissolve all sins and miseries and to earn the supreme grace and love of the Divine Lord.',
    is_dynamic_sankalpam: true,
  },
  {
    id: 'step-3',
    pooja_id: 'ganesha_standard',
    step_number: 3,
    step_title_en: 'Shodasa Upachara (Offering Flowers & Sandalwood)',
    step_title_ta: 'ஷோடசோபசாரம் (சந்தனம், குங்குமம் & மலர் சமர்ப்பணம்)',
    instruction_en: 'Offer Sandalwood paste, Kumkum, and fresh red flowers or Durva grass to Lord Ganesha while chanting the mantras.',
    instruction_ta: 'கணபதிக்கு சந்தனம், குங்குமம் இட்டு, சிவப்பு மலர்கள் மற்றும் அறுகம்புல் சமர்ப்பிக்கவும்.',
    mantra_sanskrit: 'ॐ गं गणपतये नमः। गन्धं समर्पयामि। पुष्पं समर्पयामि। दूर्वाङ्कुरान् समर्पयामि॥',
    mantra_tamil: 'ஓம் கம் கணபதயே நமஃ। கந்தம் சமர்ப்பயாமி। புஷ்பம் சமர்ப்பயாமி। தூர்வாங்குரான் சமர்ப்பயாமி॥',
    mantra_translit: 'Om Gam Ganapataye Namah | Gandham Samarpayami | Pushpam Samarpayami | Durvankuran Samarpayami ||',
    meaning_en: 'Salutations to Lord Ganesha! I humbly offer divine fragrance, flowers, and holy Durva grass.',
    is_dynamic_sankalpam: false,
  },
  {
    id: 'step-4',
    pooja_id: 'ganesha_standard',
    step_number: 4,
    step_title_en: 'Ashtottara Shatanamavali Archana (108 Holy Names)',
    step_title_ta: 'ஸ்ரீ கணேச அஷ்டோத்திர நாமவாளி (108 நாமாவளி அர்ச்சனை)',
    instruction_en: 'Chant each holy name of Lord Ganesha, offering a blade of Durva grass or flower petal with every single chant.',
    instruction_ta: 'ஒவ்வொரு நாமத்தைக் கூறி அறுகம்புல் அல்லது மலர் இதழ்களை கணபதியின் திருப்பாதங்களில் அர்ச்சனை செய்யவும்.',
    mantra_sanskrit: 'ॐ विनयाकाय नमः। ॐ विघ्नराजाय नमः। ॐ गणेशोवाय नमः॥',
    mantra_tamil: 'ஓம் விநாயகாய நமஃ। ஓம் விக்னராஜாய நமஃ। ஓம் கணேஸ்வராய நமஃ॥',
    mantra_translit: 'Om Vinayakaya Namah | Om Vighnarajaya Namah | Om Ganesvaraya Namah ||',
    meaning_en: 'Salutations to Vinayaka, the Leader of all; Salutations to Vighnaraja, the Remover of all obstacles.',
    is_dynamic_sankalpam: false,
    archana_list: [
      { number: 1, sanskrit: 'ॐ विनायकाय नमः', tamil: 'ஓம் விநாயகாய நமஃ', translit: 'Om Vinayakaya Namah', meaning_en: 'Salutations to the Supreme Leader' },
      { number: 2, sanskrit: 'ॐ विघ्नराजाय नमः', tamil: 'ஓம் விக்னராஜாய நமஃ', translit: 'Om Vighnarajaya Namah', meaning_en: 'Lord of Obstacles' },
      { number: 3, sanskrit: 'ॐ गौरीपुत्राय नमः', tamil: 'ஓம் கெளரிபுத்ராய நமஃ', translit: 'Om Gauriputraya Namah', meaning_en: 'Son of Goddess Gauri' },
      { number: 4, sanskrit: 'ॐ गणेशोवाय नमः', tamil: 'ஓம் கணேஸ்வராய நமஃ', translit: 'Om Ganesvaraya Namah', meaning_en: 'Lord of all Ganas' },
      { number: 5, sanskrit: 'ॐ स्कन्दाग्रजाय नमः', tamil: 'ஓம் ஸ்கந்தாக்ரஜாய நமஃ', translit: 'Om Skandagrajaya Namah', meaning_en: 'Elder Brother of Lord Murugan' },
      { number: 6, sanskrit: 'ॐ अव्ययाय नमः', tamil: 'ஓம் அவ்யயாய நமஃ', translit: 'Om Avyayaya Namah', meaning_en: 'The Imperishable Lord' },
      { number: 7, sanskrit: 'ॐ पूताय नमः', tamil: 'ஓம் பூதாய நமஃ', translit: 'Om Putaya Namah', meaning_en: 'The Pure One' },
      { number: 8, sanskrit: 'ॐ दक्षाया नमः', tamil: 'ஓம் தக்ஷாய நமஃ', translit: 'Om Dakshaya Namah', meaning_en: 'The Most Efficient' },
      { number: 9, sanskrit: 'ॐ अध्यक्षाया नमः', tamil: 'ॐ அத்யக்ஷாய நமஃ', translit: 'Om Adhyakshaya Namah', meaning_en: 'The Supreme Overseer' },
      { number: 10, sanskrit: 'ॐ द्विजप्रियाय नमः', tamil: 'ॐ த்விஜப்ரியாய நமஃ', translit: 'Om Dwijapriyaya Namah', meaning_en: 'Beloved of the Seekers' },
      { number: 11, sanskrit: 'ॐ अग्निगर्भच्छिदे नमः', tamil: 'ॐ அக்நிகர்பச்சிதே நமஃ', translit: 'Om Agnigarbhacchide Namah', meaning_en: 'Subduer of Fire' },
      { number: 12, sanskrit: 'ॐ इन्द्रश्रीप्रदाय नमः', tamil: 'ॐ இந்திரஸ்ரீப்ரதாய நமஃ', translit: 'Om Indrashripradaya Namah', meaning_en: 'Bestower of Divine Prosperity' },
      { number: 13, sanskrit: 'ॐ वाणीप्रदाय नमः', tamil: 'ॐ வாணீப்ரதாய நமஃ', translit: 'Om Vanipradaya Namah', meaning_en: 'Grantor of Eloquence & Knowledge' },
      { number: 14, sanskrit: 'ॐ सर्वसिद्धिप्रदाय नमः', tamil: 'ॐ ஸர்வஸித்திப்ரதாய நமஃ', translit: 'Om Sarvasiddhipradaya Namah', meaning_en: 'Giver of All Accomplishments' },
      { number: 15, sanskrit: 'ॐ शूर्पकर्णाय नमः', tamil: 'ॐ சூர்ணகர்ணாய நமஃ', translit: 'Om Shurpakarnaya Namah', meaning_en: 'Lord with Fan-like Ears' },
      { number: 16, sanskrit: 'ॐ एकदन्ताय नमः', tamil: 'ॐ ஏகதந்தாய நமஃ', translit: 'Om Ekadantaya Namah', meaning_en: 'The Single-Tusked Lord' },
    ],
  },
  {
    id: 'step-5',
    pooja_id: 'ganesha_standard',
    step_number: 5,
    step_title_en: 'Naivedyam & Camphor Aarti (நைவேத்தியம் & கற்பூர ஆரத்தி)',
    step_title_ta: 'நைவேத்திய சமர்ப்பணம் & தீபாராதனை',
    instruction_en: 'Offer Modak, Fruits, and Coconut as Naivedyam. Light camphor on the Aarti plate, ring the temple bell continuously, and perform Aarti.',
    instruction_ta: 'மோதகம் மற்றும் பழங்களை நைவேத்தியம் செய்து, கற்பூர ஆரத்தி காட்டி மணியடித்து வழிபாடு செய்யவும்.',
    mantra_sanskrit: 'ॐ जय गणेश जय गणेश जय गणेश देवा। माता जाकी पार्वती पिता महादेवा॥ कर्पूरगौरं करुणावतारं संसारसारम् भुजगेन्द्रहारम्। सदावसन्तं हृदयारविन्दे भवं भवानीसहितं नमामि॥',
    mantra_tamil: 'ஓம் ஜய கணேச ஜய கணேச ஜய கணேச தேவா। மாதா ஜாகீ பார்வதீ பிதா மஹாதேவா॥ கற்பூர கெளரம் கருணாவதாரம் ஸன்ஸாரஸாரம் புஜகேந்திரஹாரம்। ஸதா வஸந்தம் ஹ்ருதயாரவிந்தே பவம் பவானீஸஹிதம் நமாமி॥',
    mantra_translit: 'Om Jai Ganesh Jai Ganesh Deva | Mata Jaki Parvati Pita Mahadeva || Karpuura-Gauram Karuna-Avataaram Samsaara-Saaram Bhujagendra-Haaram | Sadaa-Vasantam Hrdaya-Aravinde Bhavam Bhavaanii-Sahitam Namaami ||',
    meaning_en: 'Glory to Lord Ganesha, son of Goddess Parvati and Lord Shiva! Pure like camphor, incarnation of compassion, I bow to Lord Shiva & Ganesha residing in the lotus of my heart.',
    is_dynamic_sankalpam: false,
  },
  {
    id: 'step-6',
    pooja_id: 'ganesha_standard',
    step_number: 6,
    step_title_en: 'Pradakshina, Pushpanjali & Mantrapushpam',
    step_title_ta: 'பிரதக்ஷிணம் & புஷ்பாஞ்சலி (நிறைவு வழிபாடு)',
    instruction_en: 'Stand up and turn clockwise three times (Pradakshina). Offer handfuls of flowers (Pushpanjali) at the Lord’s lotus feet and seek forgiveness for any shortcomings.',
    instruction_ta: 'மூன்று முறை வலமாக வலம் வந்து (பிரதக்ஷிணம்), மலர்களை அஞ்சலியாகச் சமர்ப்பித்து மங்கள நிறைவு பெறவும்.',
    mantra_sanskrit: 'यानिकानि च पापानि जन्मान्तरकृतानि च। तानि तानि विनश्यन्ति प्रदक्षिण पदे पदे॥ कायेन वाचा मनसेन्द्रियैर्वा बुद्ध्यात्मना वा प्रकृतेः स्वभावात्। करोमि यद्यत् सकलं परस्मै नारायणायेति समर्पयामि॥',
    mantra_tamil: 'யானிகானி ச பாபானி ஜன்மாந்தரக்ருதானி ச। தானி தானி விநஷ்யந்தி ப்ரதக்ஷிண பதே பதே॥ காயேன வாசா மனஸேந்த்ரியைர்வா புத்யாத்மனா வா ப்ரக்ருதேஃ ஸ்வபாவாத்। கரோமி யத்யத் ஸகலம் பரஸ்மை நாராயணாயேதி சமர்ப்பயாமி॥',
    mantra_translit: 'Yani Kani Cha Papani Janmantara Kritani Cha | Tani Tani Vinashyanti Pradaksina Pade Pade || Kayena Vacha Manasendriyairva Buddhyatmana Va Prakriteh Swabhavat | Karomi Yadyat Sakalam Parasmai Narayanayeti Samarpayami ||',
    meaning_en: 'Whatever sins have been committed across births are destroyed with every step of circumambulation. Whatever actions I perform with body, speech, mind, or senses, I dedicate them all unto the Supreme Divine Lord.',
    is_dynamic_sankalpam: false,
  },
];

export default async function HomePage() {
  let pooja: Pooja = FALLBACK_POOJA;
  let steps: PoojaStep[] = FALLBACK_STEPS;

  try {
    // Attempt to query Supabase for ganesha_standard pooja
    const { data: poojaData, error: poojaError } = await supabase
      .from('poojas')
      .select('*')
      .eq('id', 'ganesha_standard')
      .single();

    if (!poojaError && poojaData) {
      pooja = poojaData as Pooja;

      // Query pooja_steps for this pooja
      const { data: stepsData, error: stepsError } = await supabase
        .from('pooja_steps')
        .select('*')
        .eq('pooja_id', 'ganesha_standard')
        .order('step_number', { ascending: true });

      if (!stepsError && stepsData && stepsData.length > 0) {
        steps = stepsData as PoojaStep[];
      }
    }
  } catch (err) {
    console.warn('Supabase query fallback:', err);
  }

  return (
    <div className="relative min-h-screen bg-stone-950">
      <PoojaViewer pooja={pooja} steps={steps} />
      <TempleBell />
    </div>
  );
}
