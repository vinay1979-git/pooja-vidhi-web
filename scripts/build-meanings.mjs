#!/usr/bin/env node
/**
 * meaning_en for every step of both poojas.
 *
 *   node scripts/build-meanings.mjs --emit > supabase/migrations/0013_meanings.sql
 *
 * WHAT THESE ARE. Each meaning renders the mantra that step actually stores,
 * not a description of the step -- the instruction field already says what to
 * do and the philosophy field already says why. If the stored mantra is three
 * offering formulas, the meaning is those three formulas in English and nothing
 * more. Where a verse names the deity by an epithet the epithet is translated,
 * because that is usually the whole content of the line: hari-vallabhe is "you
 * who are dear to Hari", vidhu-sodari is "sister of the moon".
 *
 * The eight steps whose content is a namavali or an archana list have no mantra
 * to render, so their meaning says what the list is saying instead.
 *
 * These are translations, not liturgy. They carry no source_ref because they
 * are this project's own English, and a vaidika review should treat them as
 * such -- unlike the mantras, which are published text and must not be edited.
 */

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

const G = 'ganesha_standard';
const V = 'varalakshmi_vratham';

// [pooja_id, step_title_en, meaning_en]
const MEANINGS = [
  // --- shared purvangam, identical text in both poojas ----------------------
  ...[G, V].flatMap((p) => [
    [p, 'Achamanam',
      'To Achyuta, who never falls away; to Ananta, who has no end; to Govinda, who recovers what is lost. A sip of water at each of the three names.'],
    [p, 'Anga Vandanam',
      'Salutations to Keshava, Narayana, Madhava, Govinda, Vishnu, Madhusudana, Trivikrama, Vamana, Shridhara, Hrishikesha, Padmanabha and Damodara. Twelve names of Vishnu, each touched to a different place on the body.'],
    [p, 'Vighneshwara Dhyanam',
      'Robed in white, all-pervading, the colour of the moon, four-armed, his face at peace: on him one should meditate, for the quieting of every obstacle.'],
    [p, 'Pranayamam',
      'Om: earth, mid-air, heaven, the great, the world of beings, the world of austerity, the true. We contemplate the adorable brilliance of that divine Sun; may it set our thinking in motion. Om: the waters, the light, the sap, the deathless, Brahman, earth, mid-air and heaven.'],
    [p, 'Kalasha Pooja',
      'Ganga and Yamuna, Godavari and Sarasvati, Narmada, Sindhu and Kaveri: be present in this water.'],
    [p, 'Ghanta Pooja',
      'Sound the bell, for the arrival of the gods and the departure of what should not be here. It is the sign by which the deities are called.'],
  ]),

  // --- Ganesha ---------------------------------------------------------------
  [G, 'Sankalpam',
    'At this auspicious hour, in the second half of Brahma\'s life, in the Shveta Varaha kalpa, the age of Vaivasvata Manu, the twenty-eighth cycle, the first quarter of the Kali age, on the continent of Jambu, in the land of Bharata, on the day named here from the panchangam: that all the wrong I have gathered may fall away, and for the pleasure of the Supreme, I shall perform the worship of Sri Mahaganapati.'],
  [G, 'Avahanam & Asanam',
    'Into this turmeric form I invoke Sri Mahaganapati. I offer akshatai for him to sit on.'],
  [G, 'Prana Pratishtha',
    'May the life breaths be established here; may they move here. May the godhead be present here to be worshipped, and may nothing at all be wanting. To Sri Mahaganapati, salutations: I establish the breath of life.'],
  [G, 'Padyam & Arghyam',
    'At the feet I offer water for washing; at the hands, the water of welcome; at the mouth, water to sip.'],
  [G, 'Snanam & Vastram',
    'I offer the bath. I offer akshatai in place of cloth.'],
  [G, 'Gandham, Kumkumam & Pushpam',
    'I offer divine sandal paste. I offer kumkumam. I worship with flowers.'],
  [G, 'Anga Pooja',
    'Twenty-nine names, each addressing Ganesha by a quality that begins with the same sound as the limb it worships: Parvatinandana at the feet, Guhagraja at the groin, Heramba at the heart, Phalachandra at the forehead, Sarvamangalasuta for the whole body. Worship travels upward, feet first.'],
  [G, 'Patra Pooja (21 Leaves)',
    'Twenty-one lines, each naming Ganesha and offering one leaf: to Umaputra the machi leaf, to Heramba the brihati, to Lambodara the bilva, to Dvipadanana the durva, on to Arkaprabha and the arka leaf last. Most of the names alliterate with the plant they accompany.'],
  [G, 'Pushpa Pooja (21 Flowers)',
    'Twenty-one flowers offered to twenty-one Ganapatis: Maha, Dhira, Vishvaksena, Amoda, Pramatha, Rudra, Vidya, Vighna, Brahma, Jnana and the rest. The same god met twenty-one ways.'],
  [G, 'Durva Pooja (21 Names)',
    'To the lord of the ganas, the son of Uma, the remover of sin, the one-tusked, the elephant-faced, the mouse-borne, and fifteen names more: at each, a pair of arugampul blades.'],
  [G, 'Ganapathi Ashtottara Shatanamavali',
    'One hundred and eight names, opening with Gajanana, the elephant-faced, and closing with Varasiddhi Vinayaka, the form worshipped on Chaturthi itself. Not a hundred and eight gods but one guest, described until the description runs out.'],
  [G, 'Dhoopam & Deepam',
    'I let the incense be smelled. I show the lamp before you. After the incense and the lamp, I offer water to sip.'],
  [G, 'Naivedyam',
    'To the outward breath, hail; to the inward breath, hail; to the diffused breath, the upward breath and the balancing breath, hail. To Sri Mahaganapati I offer this food.'],
  [G, 'Karpura Neerajanam',
    'I show the camphor flame before you, continuously.'],
  [G, 'Mantra Pushpam & Namaskaram',
    'Whatever wrongs there are, done in this birth and in others, they are destroyed at every step of the circumambulation. I offer the mantra-flower.'],
  [G, 'Ksheera Arghyam',
    'Ganeshvara, eldest lord, risen from the body of Gauri: receive this arghyam I give, elephant-faced one, salutations to you. Receive the arghyam, Heramba, giver of every accomplishment; Vinayaka, I give it with flowers and akshatai. Salutations to you, Vinayaka, with sandal, flowers and akshatai: receive this arghyam I give, and be the granter of all that is wished for. By this giving of arghyam may the Lord, the self of all, Siddhi Vinayaka, be pleased.'],
  [G, 'Kshama Prarthana & Conclusion',
    'Short of mantra, short of rite, short of devotion, lord of the ganas: whatever I have worshipped, let it stand complete for you.'],
  [G, 'Udvasanam',
    'By sacrifice the gods sacrificed to sacrifice; these were the first observances. To Sri Mahaganapati, salutations: I take leave of you to your own place.'],

  // --- Varalakshmi ------------------------------------------------------------
  [V, 'Manjal Pillaiyar Pooja',
    'Turmeric-hued, four-armed, turmeric-faced lord, holding noose and goad, the modaka and a tusk: giver of fearlessness to those who trust him, I salute the destroyer of obstacles. To the turmeric Ganapati, salutations. Into this turmeric form I invoke Sri Mahaganapati, establish him, and worship him.'],
  [V, 'Sankalpam',
    'On this auspicious day, already described by all the qualities named from the panchangam: for the welfare, steadiness, victory, long life, health and increasing prosperity of ourselves together with our household; for the gaining of the four ends of life, duty, means, desire and release; for good children and good fortune; addressing the goddess Sri Varalakshmi and for her pleasure, I shall perform the sixteen upacharas, beginning with meditation and invocation, as the kalpa prescribes and as far as I am able.'],
  [V, 'Peeta Pooja',
    'Shining like ten thousand suns, adorned with flashing jewels: goddess, worshipped by the gods, be seated on this throne. To Sri Varalakshmi, salutations: I offer the jewelled seat.'],
  [V, 'Dhyanam & Avahanam',
    'Seated on the lotus, lotus in hand, worshipped by every world, dear to Narayana: goddess, be well pleased always. Risen from the ocean of milk, Kamala, dwelling in the lotus, saluted by gods and demons alike: be settled in my house. I meditate on you. Auspiciousness of all that is auspicious, dwelling on the breast of Vishnu: I invite you, goddess; be well pleased always.'],
  [V, 'Prana Pratishtha',
    'May the life breaths be established here; may they move here. May her godhead be present here to be worshipped, and may nothing at all be wanting. To Sri Varalakshmi, salutations: I establish the breath of life. The verse is in the feminine throughout.'],
  [V, 'Padyam, Arghyam & Achamaniyam',
    'Clean water in a vessel, mixed with sandal and flowers: I shall give you this arghyam, goddess; receive it, you who are dear to Hari. Fragrant water, lovely, risen from every sacred ford: receive this water for the feet, goddess, saluted by all the gods. Brought in a golden pot, with sandal and aloe: receive this water to sip, goddess, given by me, you who grant what is auspicious.'],
  [V, 'Panchamrita & Shuddhodaka Snanam',
    'Milk and curd with ghee, together with sugar and honey: receive this bath of the five nectars, you who dwell in the lotus. Ganga water I have brought, which rests on the head of Mahadeva: receive this bath of clean water, sister of the moon. After the bath I offer water to sip.'],
  [V, 'Vastram, Abharanam & Mangalyam',
    'You whose feet the gods worship, who love fine cloth: I shall give a pair of garments; receive them, you whom the gods worship. Armlets, bangles, necklace, anklets and girdle, ornaments beyond price: receive them, you whom the sages worship. Made of heated gold, goddess, the mangalyam that brings auspiciousness: offered by me, receive it, you who grant what is auspicious.'],
  [V, 'Gandham, Akshatai & Pushpam',
    'Blended with camphor, aloe, musk and gorochana: I give you this sandal, goddess; receive it for my sake. Whole rice, white and shining, unbroken and fine, mixed with turmeric and kumkumam: receive it, daughter of the ocean. With jasmine and jaji blossoms, with champaka and vakula, with the hundred-petalled lotus and the kalhara: I worship you, beloved of Hari.'],
  [V, 'Anga Pooja',
    'Fourteen names, each naming a limb, from the feet upward to the head, and a fifteenth for the whole body: Chanchala at the feet, Padmalaya at the navel, Kambukanthi at the throat, Kamala at the head, and Varalakshmi for all the limbs together.'],
  [V, 'Lakshmi Ashtottara Shatanamavali',
    'One hundred and eight names, opening with Prakriti and Vikriti, nature and its transformation, and closing with Bhuvaneshvari, mistress of the worlds. The list begins by naming change itself, which frames what is being asked for.'],
  [V, 'Dhoopam & Deepam',
    'Ten-ingredient incense with guggulu, fragrant and pleasing: I shall give you this incense, goddess; receive it, lover of the lotus. A wick soaked in ghee, destroyer of darkness: I shall give you this lamp, goddess; receive it and be glad.'],
  [V, 'Naivedyam, Paniyam & Tambulam',
    'To the outward, inward, diffused, upward and balancing breaths, hail. Food complete in the six tastes, with curd, honey and ghee, with many dishes and fruits: receive it, you who are dear to Hari. Mixed with camphor\'s fragrance and scented with flowers: receive this drink, goddess, cool and delightful. With areca nut and betel leaves and powdered camphor: let this tambulam be received.'],
  [V, 'Karpura Neerajanam',
    'The lamp is brought, together with camphor: I shall give it to you, goddess; receive it, beloved of Vishnu.'],
  [V, 'Pushpanjali & Mantra Pushpam',
    'Seated on the lotus, lotus in hand, worshipped by every world, dear to Narayana: goddess, be well pleased always. To Sri Varalakshmi, salutations: I offer the mantra-flower.'],
  [V, 'Pradakshina',
    'Whatever wrongs there are, done in other births as well as this, they perish at every step of the circumambulation. I am wrong, my acts are wrong, my nature is wrong, I am born of wrong: save me by your mercy, goddess, who love those who come for refuge. There is no other refuge; you alone are my refuge. So, out of compassion, protect me, protect me, Janardani.'],
  [V, 'Namaskaram & Varalakshmi Prarthana',
    'Salutations to you, mother of the world; salutations to you, beloved of Vishnu. Protect me, giver of boons to those who trust you: Varalakshmi, salutations again and again.'],
  [V, 'Nonbu Sharadu Pooja',
    'Nine knots, nine names: Kamala at the first, Rama at the second, Lokamata at the third, Vishvajanani, Mahalakshmi, Kshirabdhitanaya the daughter of the milk-ocean, Vishvasakshini the witness of all, Chandrasodari sister of the moon, and Harivallabha, dear to Hari, at the ninth.'],
  [V, 'Sharadu Dharanam',
    'I tie on the right hand this nine-stranded thread that brings what is auspicious. Grant me increase of children and grandchildren, and good fortune, Rama.'],
  [V, 'Vayana Dhanam',
    'Having worshipped the auspicious Varalakshmi in this way, as far as one is able, twelve cakes are to be given as vayanam to a brahmana. Let Lakshmi receive it, and it is to Lakshmi that it is given; Lakshmi in both the giver and the receiver, salutations again and again to Lakshmi.'],
  [V, 'Ksheera Arghyam',
    'Clean water in a vessel, mixed with sandal and flowers: I shall give you this arghyam, goddess; receive it, you who are dear to Hari. At the close it is given in milk.'],
  [V, 'Kshama Prarthana & Conclusion',
    'By whose remembrance and by the speaking of whose name whatever is lacking in austerity, worship or rite at once becomes complete: him, Achyuta, I salute. Short of mantra, short of rite, short of devotion, Maheshvari: whatever I have worshipped, goddess, let it stand complete for you. By this sixteen-upachara worship performed as the kalpa prescribes, may the goddess Sri Varalakshmi, who is the self of all, be well pleased, gracious, and a granter of boons. May what I wish for be accomplished.'],
  [V, 'Udvasanam',
    'By sacrifice the gods sacrificed to sacrifice; these were the first observances. To Sri Varalakshmi, salutations: I take leave of you to your own place.'],
];

// ---------------------------------------------------------------------------
const EXPECTED = { [G]: 24, [V]: 29 };
const problems = [];
const seen = new Set();
for (const [p, t, m] of MEANINGS) {
  const k = `${p}|${t}`;
  if (seen.has(k)) problems.push(`duplicate: ${k}`);
  seen.add(k);
  if (!m || m.length < 40) problems.push(`${k}: meaning is missing or too short`);
  if (/^This step|^In this step|^Here the/.test(m)) {
    problems.push(`${k}: describes the step instead of rendering the mantra`);
  }
}
for (const [p, n] of Object.entries(EXPECTED)) {
  const got = MEANINGS.filter(([x]) => x === p).length;
  if (got !== n) problems.push(`${p}: ${got} meanings, expected ${n}`);
}
if (problems.length) { problems.forEach((x) => console.error('FAIL ' + x)); process.exit(1); }

const emit = process.argv.includes('--emit');
const out = emit ? console.log : () => {};

out(`-- =============================================================================
-- 0013_meanings.sql
--
-- GENERATED by scripts/build-meanings.mjs. Do not hand-edit.
--
-- meaning_en for all ${MEANINGS.length} steps across both poojas, so the Meaning block
-- stops being empty everywhere.
--
-- Each meaning renders the mantra that step stores. It is not a second
-- description of the step: instruction_en already says what to do and
-- philosophy_en already says why. The eight steps whose content is a namavali
-- or archana list have no mantra, so their meaning says what the list says.
--
-- This is the project's own English, not published text, and carries no
-- source_ref for that reason. A vaidika review should treat it as editable,
-- unlike the mantras.
--
-- Idempotent.
-- =============================================================================

begin;
`);

for (const [p, t, m] of MEANINGS) {
  out(`update public.pooja_steps set meaning_en = ${q(m)}, updated_at = now()
where pooja_id = ${q(p)} and step_title_en = ${q(t)};`);
}

out(`
-- Every step must have come out with one. A renamed step would silently miss.
do $$
declare missing text;
begin
  select string_agg(pooja_id || ' / ' || step_title_en, ', ')
    into missing
    from public.pooja_steps
   where pooja_id in (${q(G)}, ${q(V)}) and meaning_en is null;
  if missing is not null then
    raise exception 'steps left without a meaning: %', missing;
  end if;
end $$;

commit;

-- Verify:
--   select count(*) from pooja_steps where meaning_en is null;   -- 0`);

console.error(`${MEANINGS.length} meanings: ${MEANINGS.filter(([x]) => x === G).length} Ganesha, ${MEANINGS.filter(([x]) => x === V).length} Varalakshmi`);
if (!emit) console.error('\n(no SQL written; pass --emit)');
