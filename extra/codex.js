/* Hog Exe Matchup Codex — data + render + search/filter
 *
 * CARD_BASE: where to load card icons from.
 *   - Default uses the RoyaleAPI CDN (works immediately).
 *   - Once you download icons into ../cards/, switch CARD_BASE to './cards'.
 *
 * Each matchup carries:
 *   deck:   the 8-card opponent deck (slugs, lowercase-hyphen)
 *   main:   2-5 identity cards (subset of deck — shown in the collapsed row)
 *   extras: optional alt cards they might run instead of the standard 8
 *
 * Cards auto-categorize into Troop / Building / Spell via the sets below.
 * "Main" overrides — anything in `main` shows under Main, never duplicated.
 */

const CARD_BASE = 'https://cdn.royaleapi.com/static/img/cards-150';

const SOURCE_VIDEO = 'https://www.youtube.com/watch?v=13_rx0x-rk0&list=PLx_HedVtjNZd6L6w2fvAeFVi1EKn3Ks6Q&index=4';

const SPELLS = new Set([
  'lightning','fireball','rocket','the-log','tornado','poison',
  'freeze','zap','arrows','giant-snowball','barbarian-barrel',
  'goblin-curse','royal-delivery','graveyard','goblin-barrel',
  'mirror','clone','rage','earthquake'
]);

const BUILDINGS = new Set([
  'cannon','tesla','bomb-tower','inferno-tower','tombstone','furnace',
  'goblin-cage','elixir-collector','mortar','x-bow','xbow',
  'goblin-hut','barbarian-hut','goblinstein','goblin-drill'
]);

// Win conditions surfaced at the TOP of the card index for fast filtering.
// Includes troop, building, and spell win cons together.
const WIN_CONS = new Set([
  // tanks / heavy
  'hog-rider','royal-giant','giant','golem','electro-giant',
  // air win cons
  'balloon','lava-hound',
  // spam / bridge spam
  'royal-hogs','royal-recruits','three-musketeers','wall-breakers',
  'battle-ram','ram-rider','goblin-demolisher','goblin-machine',
  // special troop win cons / centerpieces
  'miner','giant-skeleton','pekka','magic-archer','archer-queen',
  // spell win cons
  'goblin-barrel','graveyard',
  // building win cons
  'mortar','x-bow','xbow','goblin-drill','goblinstein'
]);

function cardType(slug) {
  if (SPELLS.has(slug)) return 'spell';
  if (BUILDINGS.has(slug)) return 'building';
  return 'troop';
}

function cardBucket(slug) {
  if (WIN_CONS.has(slug)) return 'win';
  return cardType(slug);
}

// Elixir cost per card. Used to sub-sort the card index by cost.
// If a slug is missing here it falls back to 4 (median) so it still renders.
const ELIXIR = {
  // 1
  'skeletons': 1, 'ice-spirit': 1, 'electro-spirit': 1, 'fire-spirit': 1, 'heal-spirit': 1,
  // 2
  'goblins': 2, 'spear-goblins': 2, 'bats': 2, 'wall-breakers': 2, 'bomber': 2,
  'the-log': 2, 'zap': 2, 'giant-snowball': 2, 'barbarian-barrel': 2,
  'goblin-curse': 2, 'rage': 2, 'suspicious-bush': 2,
  // 3
  'minions': 3, 'knight': 3, 'archers': 3, 'goblin-gang': 3,
  'mega-minion': 3, 'dart-goblin': 3, 'fisherman': 3, 'bandit': 3,
  'ice-wizard': 3, 'princess': 3, 'miner': 3, 'boss-bandit': 3,
  'cannon': 3, 'tombstone': 3,
  'tornado': 3, 'arrows': 3, 'royal-delivery': 3, 'earthquake': 3, 'clone': 3,
  'goblin-barrel': 3, 'skeleton-barrel': 3,
  // 4
  'hog-rider': 4, 'mini-pekka': 4, 'valkyrie': 4, 'royal-ghost': 4,
  'baby-dragon': 4, 'musketeer': 4, 'inferno-dragon': 4, 'hunter': 4,
  'magic-archer': 4, 'electro-wizard': 4, 'dark-prince': 4,
  'lumberjack': 4, 'mother-witch': 4, 'golden-knight': 4,
  'battle-ram': 4, 'goblin-demolisher': 4, 'mighty-miner': 4,
  'flying-machine': 4, 'zappies': 4,
  'tesla': 4, 'bomb-tower': 4, 'furnace': 4, 'goblin-cage': 4, 'mortar': 4,
  'fireball': 4, 'poison': 4, 'freeze': 4,
  // 5
  'giant': 5, 'balloon': 5, 'royal-hogs': 5, 'archer-queen': 5,
  'goblin-machine': 5, 'prince': 5, 'bowler': 5, 'executioner': 5,
  'wizard': 5, 'rascals': 5, 'monk': 5, 'royal-chef': 5,
  'goblinstein': 5, 'inferno-tower': 5, 'goblin-hut': 5,
  'graveyard': 5,
  // 6
  'royal-giant': 6, 'giant-skeleton': 6, 'elite-barbarians': 6,
  'elixir-collector': 6, 'barbarian-hut': 6,
  'x-bow': 6, 'xbow': 6, 'goblin-drill': 6,
  'lightning': 6, 'rocket': 6,
  // 7
  'electro-giant': 7, 'lava-hound': 7, 'pekka': 7, 'royal-recruits': 7,
  // 8
  'golem': 8,
  // 9
  'three-musketeers': 9
};

function elixir(slug) {
  return ELIXIR[slug] != null ? ELIXIR[slug] : 4;
}

// Cost sub-bucket used inside each card-index group.
// Schemes:
//   'wincon' → '5+' or '4-'    (two buckets, per user spec)
//   'three'  → '5+', '4', '3-' (three buckets, used for troops/buildings/spells)
function costBucket(slug, scheme) {
  const c = elixir(slug);
  if (scheme === 'wincon') return c >= 5 ? '5+' : '4-';
  if (c >= 5) return '5+';
  if (c === 4) return '4';
  return '3-';
}

// Player deck — shown at the bottom as small reference only.
const playerDeck = [
  'hog-rider','executioner','valkyrie','goblins',
  'ice-spirit','the-log','tornado','rocket'
];

const matchups = [
  {
    title: "Giant Graveyard",
    difficulty: "hard",
    short: "Tornado splash to King • Hog opposite lane • Save Valk for Giant/Mini Pekka",
    deck: ['giant','graveyard','mini-pekka','bowler','baby-dragon','musketeer','tornado','poison'],
    main: ['giant','graveyard'],
    extras: [],
    notes: [
      "Tornado their splash unit (Mini Pekka, etc.) to King Tower early",
      "<strong>King Tower active = leaking is fine</strong>",
      "Hog down the middle vs Bowler/Executioner to protect Exi",
      "Save Valk for Giant and Mini Pekka",
      "Use Goblins to DPS Giant + block Graveyard skeletons",
      "Play Hog <em>opposite lane</em> to prevent Bowler + Giant stack",
      "Hover rocket on counter pushes for Bowler/Mini Pekka/Musk value",
      "Cycle Bowler mid = free rocket value",
      "When counter pushing Valk + Hog, hover NATO to pull Musk/Bowler"
    ]
  },
  {
    title: "Mortar Lightning",
    difficulty: "hard",
    short: "Don't get caught down elixir • Rocket stacked Cannon Cart + Mortar",
    deck: ['mortar','lightning','cannon-cart','goblinstein','royal-ghost','ice-spirit','the-log','skeletons'],
    main: ['mortar','lightning'],
    extras: [],
    notes: [
      "<em>Never get caught down elixir</em>",
      "Outside mortar, their defense is weak — abuse no-mortar moments",
      "NATO Ghost to King ASAP to activate it",
      "If Cannon Cart + Mortar stacked → <strong>rocket both</strong>",
      "Never stack Valk + Exi close (double lightning bait)",
      "Only Hog + Exi at river if they have <em>no Cannon Cart in hand</em>",
      "Vs Evo Mortar w/o rocket: split Goblins mid + Hog across to DPS",
      "When up damage, play passive not aggressive",
      "Save Evo Valk for Goblinstein counter push"
    ]
  },
  {
    title: "E-Giant Lightning",
    difficulty: "hard",
    short: "One of the WORST matchups • Survive single, rocket cycle in triple",
    deck: ['electro-giant','lightning','inferno-dragon','baby-dragon','goblin-cage','golden-knight','ice-wizard','tornado'],
    main: ['electro-giant','lightning'],
    extras: [],
    notes: [
      "<em>One of the worst matchups alongside Icebow</em>",
      "Goal: survive single → rocket cycle in triple",
      "Kite Inferno + Baby Dragon to opposite lane (Goblins/Ice Spirit)",
      "<strong>Priority: cycle to Evo Valk</strong>",
      "If Egiant has solo card in a lane → put Hog/Valk opposite",
      "Hog same time as E-Giant to prevent lightning combo",
      "Hero Goblins: destroy Cages, tank Golden Knight, counter Inferno",
      "Use Bowler to push Valk out of lightning range",
      "Two Exis high = bridge control, forces wasted lightning"
    ]
  },
  {
    title: "Royal Giant",
    difficulty: "med",
    short: "Don't Hog without NATO • Valk same lane • Evo Exi shreds RG",
    deck: ['royal-giant','fisherman','lightning','mega-minion','hunter','dart-goblin','the-log','skeletons'],
    main: ['royal-giant','fisherman'],
    extras: [],
    notes: [
      "Don't Hog without NATO/counter-push cards in single",
      "Leak and save Valk for RG",
      "RG in back → <strong>Valk same lane</strong>",
      "Exi to DPS RG, Goblins to block Fisherman",
      "Better to defend RG cleanly than force a bad counter push",
      "Hover NATO — tornado Fisherman away before it pulls Hog to King",
      "<strong>Evo Exi double damage shreds RG</strong>",
      "Play passive, wait for one chance to NATO Fisherman opposite lane"
    ]
  },
  {
    title: "Golem Lightning",
    difficulty: "hard",
    short: "Aggressive Hogs in single • Hover Exi high • Every HP matters",
    deck: ['golem','lightning','baby-dragon','ice-wizard','lumberjack','mega-minion','tornado','the-log'],
    main: ['golem','lightning'],
    extras: [],
    notes: [
      "Be aggressive with Hogs in single — don't let early damage lead",
      "Block Baby Dragon + Ice Wiz from hitting Exi (prevents lightning kill)",
      "Don't place Valk in back — Baby Dragon splashes tower 3-4×",
      "Hog opposite lane from Brawler so you can NATO Brawler to King",
      "<strong>Hover Exi high</strong> to snipe supports + force lightning away",
      "NATO Golem back to reduce damage",
      "<em>Every HP matters for rocket/lightning cycle</em>",
      "Evo Valk + Evo Exi defend without extra elixir",
      "After they lightning, immediately pressure with Hog + Goblins"
    ]
  },
  {
    title: "Balloon Freeze",
    difficulty: "med",
    short: "ALWAYS rocket Balloon • Hog freely • Learn tornado-to-king tech",
    deck: ['balloon','freeze','baby-dragon','ice-wizard','barbarian-barrel','ice-spirit','skeletons','knight'],
    main: ['balloon','freeze'],
    extras: [],
    notes: [
      "<strong>60/40 in Hog Exe's favor</strong> (harder post-Exi nerf)",
      "<em>ALWAYS rocket the Balloon — push it BACK, not toward your tower</em>",
      "Hog freely — they can't punish it",
      "Hero Goblins strong (their only small spell is Barb Barrel)",
      "Pop Goblin ability to block Tornado or pull Dragon back",
      "If caught w/o rocket: Tornado Balloon to King (learn placement)",
      "Counter-pushing Exi → always Hog with it to force NATO",
      "Don't play Evo Valk in back — bridge Balloon pulls Valk to tower",
      "Ice Spirit + NATO mid-map Balloon → free King activation",
      "If they Freeze on defense, their next Balloon push is toothless"
    ]
  },
  {
    title: "Giant Double Prince",
    difficulty: "med",
    short: "Don't Hog if Prince in hand • Valk in front of King vs Dark Prince",
    deck: ['giant','prince','dark-prince','mega-minion','ice-spirit','heal-spirit','the-log','fireball'],
    main: ['giant','prince','dark-prince'],
    extras: [],
    notes: [
      "Don't Hog in single if Prince might be in hand",
      "<strong>Valk → Dark Prince | Goblins → Prince | Exi → Giant + Mega Minion</strong>",
      "Hero Goblins ability often enough vs Prince — pop with Ice Spirit",
      "Dark Prince from back → <em>play Valk in front of King</em> (no splash)",
      "Play Exi out of range of Giant's swing",
      "Evo Exi cleans Giant + Prince with double damage",
      "In double: safer to Hog counter-push with Exi + Evo Valk",
      "Save Evo Valk for Giant push; use Exi + Goblins for Dark Prince",
      "Play Evo Valk FAR from Giant so Giant punches a Goblin"
    ]
  },
  {
    title: "Giant Skull BridgeSpam",
    difficulty: "med",
    short: "Tornado Ghost to King • Exi (not Valk) into Giant Skelly",
    deck: ['giant-skeleton','dark-prince','royal-ghost','battle-ram','wizard','mother-witch','tornado','fireball'],
    main: ['giant-skeleton','battle-ram'],
    extras: [],
    notes: [
      "Play cautious in single — don't Hog with counter-push Exi early",
      "<strong>Tornado Ghost to King immediately</strong>",
      "Prefer <em>Exi over Valk</em> for Giant Skelly",
      "Save Valk for Dark Prince, Ghost, Ram",
      "Use Goblins to pull everything into Exi",
      "Ram → <strong>Goblins LOW</strong> (in case of Wizard/Mother Witch)",
      "NATO Mother Witch/Wizard to opposite lane",
      "Evo Valk pulls Mother Witch to opposite lane",
      "Vs Evo Ghost: always have Valk ready (no Goblins risk)"
    ]
  },
  {
    title: "Miner Balloon (2.9)",
    difficulty: "hard",
    short: "ZERO Balloon hits all game • Hog same time as Miner Balloon",
    deck: ['miner','balloon','musketeer','bomb-tower','ice-spirit','electro-spirit','the-log','fireball'],
    main: ['miner','balloon'],
    extras: [],
    notes: [
      "<em>Super tough — play near-perfectly</em>",
      "<strong>Take ZERO Balloon hits the entire 5 minutes</strong>",
      "Hog same time as Miner Balloon — they can't defend both",
      "Always keep Rocket + Goblins in hand when they have Miner + Balloon",
      "Don't Exi into Musk if it leaves you w/o rocket/goblins",
      "Goblins on Miner = tower + gobs DPS Miner before Balloon hits",
      "Cycle Exi when they have no Balloon in hand",
      "Block for Exi using Valk + Ice Spirit",
      "Don't Hog vs Bomb Tower — wait until they go Miner Balloon",
      "<strong>Track Evo Musketeer cycle</strong> — getting caught off guard is costly"
    ]
  },
  {
    title: "Archer Queen Pigs (2.9)",
    difficulty: "easy",
    short: "Play passive in single • Defend Pigs → rocket tower • Rarely Hog",
    deck: ['archer-queen','royal-hogs','cannon','musketeer','ice-spirit','electro-spirit','the-log','fireball'],
    main: ['archer-queen','royal-hogs'],
    extras: [],
    notes: [
      "<strong>Good matchup</strong> — play passive in single to avoid Pigs damage",
      "Rarely worth Hogging",
      "Loop: defend Pigs → rocket tower",
      "King activation: Goblins one side + NATO other Pigs to King",
      "Valk + Hog if they're down elixir (Valk one-shots Ice Spirit)",
      "Don't rocket Queen until triple",
      "If Queen counter-pushes with split Pigs → Exi in Queen lane splashes both",
      "No Rocket for Pigs? Ice Spirit Exi or NATO Exi works",
      "Don't overcommit — one bad play loses both towers"
    ]
  },
  {
    title: "Hog Lightning",
    difficulty: "med",
    short: "Ice Spirit/Log resets Mighty Miner • Don't over-rocket in triple",
    deck: ['hog-rider','lightning','mighty-miner','furnace','ice-golem','ice-spirit','skeletons','the-log'],
    main: ['hog-rider','lightning','mighty-miner'],
    extras: [],
    notes: [
      "Get cycle right for double + triple; don't take Hog damage to King",
      "Evo Furnace annoying — save Valk+Log or Exi+Log to clear it",
      "<strong>Ice Spirit/Log resets Mighty Miner charge</strong> (saves Valk)",
      "Don't over-rocket in triple — lose lightning cycle",
      "Exi same lane as Furnace OK in single (play early, before fire spirits)",
      "Don't stack Valk + Exi (easy lightning)",
      "Abuse Hero Goblins ability — free damage on range troops",
      "When you Exi a Hog → <em>always Hog yourself</em> to block lightning",
      "Force Mighty Miner to switch lanes = reduces his threat",
      "Don't be scared to NATO offense if you have Evo Exi/Valk for defense"
    ]
  },
  {
    title: "Recruits Spam",
    difficulty: "hard",
    short: "DON'T LOSE IN SINGLE • Mighty Miner WILL swap • Hover Exi",
    deck: ['royal-recruits','mighty-miner','wall-breakers','minions','electro-spirit','royal-delivery','the-log','fireball'],
    main: ['royal-recruits','mighty-miner'],
    extras: [],
    notes: [
      "<em>DON'T LOSE IN SINGLE — that's the entire key</em>",
      "Valk/Exi one lane → opponent <strong>almost always</strong> swaps with Mighty Miner",
      "Keep Ice Spirit to reset Mighty Miner",
      "Keep Exi + Valk healthy — DPS'd troops can't defend anything",
      "OK to let small damage through (Minions/Wall Breakers) if hand is bad",
      "<strong>King Tower essential</strong> — use Wall Breakers to activate",
      "<strong>Hover Exi rather than placing</strong> — wait for lane swap",
      "Tornado Minions into Exi (no other good response)",
      "Out of single: matchup is almost free"
    ]
  },
  {
    title: "Hyperbait",
    difficulty: "easy",
    short: "Free matchup • Hog into Bush + Log • Save Exi for Skeleton Barrel",
    deck: ['goblin-barrel','dart-goblin','goblin-curse','suspicious-bush','goblin-gang','skeleton-barrel','rascals','rocket'],
    main: ['goblin-barrel','goblin-curse','dart-goblin'],
    extras: [],
    notes: [
      "<strong>Pretty free in current meta</strong> (Rocket version harder than Fireball)",
      "Bush = confirmed Hyperbait → Hog into it + Log = multi-card value",
      "Get King Tower — huge vs spam",
      "<strong>Save Exi for Skeleton Barrel + Rascals</strong> (best counter)",
      "Valk → Ghost / counter pushes",
      "Log → Goblins, Bush, Dark Goblin",
      "Don't overcommit in single",
      "Tornado Dark Goblin into Valk (otherwise impossible to log)",
      "Hog usually guaranteed a hit OR forces overspend → rocket cycle",
      "Hogexy at bridge sometimes works as prediction, but defend+rocket is more consistent"
    ]
  },
  {
    title: "3M Pump",
    difficulty: "hard",
    short: "Rocket FIRST pump only (none if Monk) • NATO+Rocket stacked Musks",
    deck: ['three-musketeers','elixir-collector','elite-barbarians','mini-pekka','heal-spirit','the-log','ice-spirit','monk'],
    main: ['three-musketeers','elixir-collector'],
    extras: [],
    notes: [
      "Difficult matchup vs good 3M players",
      "<strong>Rocket the FIRST pump only</strong> (none if they run Monk)",
      "Hero Goblins block E-Barbs + Mini Pekkas — keeps Hog alive",
      "Get King Tower",
      "Musks stacked one lane + not down elixir → <strong>NATO + Rocket all</strong>",
      "<em>Don't play random Valk at bridge</em> — baits free pump",
      "Exi must line up on troops IN FRONT of Musks AND the Musks",
      "Pump down middle → Hog down middle to kill it fast",
      "Predict Heal Spirit with Log (E-Barbs healing up kills Valk)",
      "When opponent spends all elixir → Hog gets guaranteed hit"
    ]
  },
  {
    title: "LavaLoon",
    difficulty: "med",
    short: "Save rocket for Balloon • Don't Exi until Lava Hound drops",
    deck: ['lava-hound','balloon','inferno-dragon','mega-minion','tombstone','fireball','zap','skeletons'],
    main: ['lava-hound','balloon'],
    extras: [],
    notes: [
      "Standard decent matchup (slight harder with Mega Minion)",
      "Play a card BEFORE Exi (Ice Spirit or Goblins) to protect it",
      "Early bridge Balloons: rocket; if no rocket, Tornado to King",
      "<strong>Hog anytime — they can't punish</strong>",
      "Whichever lane they play primary ground troop → Valk same lane",
      "<em>Don't play Exi until they play Lava Hound</em>",
      "Give Lava Hound a second before placing Exi (don't let it walk up)",
      "<strong>Save Rocket for Balloon</strong>",
      "Ice Spirit resets Evo Inferno Dragon",
      "On every counter push, support Exi (Valk in front)",
      "Log Tombstone so Hog goes straight to tower"
    ]
  },
  {
    title: "Mirror Match (Hog Exe)",
    difficulty: "med",
    short: "Don't be first to play Valk/Exi • Exi BEHIND Hog (harder to react)",
    deck: ['hog-rider','executioner','valkyrie','goblins','ice-spirit','the-log','tornado','rocket'],
    main: ['hog-rider','executioner'],
    extras: [],
    notes: [
      "Goblins + Ice Spirit OR Goblins + Log = full counter to their Hog",
      "<strong>Don't be first to play Valk or Exi</strong> — wait and react",
      "Don't tornado too many Hogs to King — King HP matters late",
      "Late game: NATO Hog to King + Ice Spirit so only one tower hit",
      "Vs Evo Valk: Hog → Exi BEHIND Hog → their Evo Valk pulls Hog+Exi into their tower → line up Exi on their Valk",
      "<strong>Put Exi behind Hog, not in front</strong> (harder to react to)",
      "<em>Play troop BEFORE rocket</em> — forces them to defend AND rocket back",
      "Don't go Valk + Exi together — they stack on your push"
    ]
  },
  {
    title: "Graveyard Freeze",
    difficulty: "med",
    short: "King Tower early = easy game • Rocket after every defense",
    deck: ['graveyard','freeze','bowler','ice-wizard','knight','ice-spirit','the-log','tornado'],
    main: ['graveyard','freeze'],
    extras: [],
    notes: [
      "<strong>King Tower early = easy game</strong>",
      "Play passive in single until King Tower opportunity",
      "Right Exi placement makes opponent miss Tornado (Bowler pushes Exi back)",
      "Rocket vs going Exi if they likely have Freeze ready",
      "NATO Valk + Exi same lane = clogs lane, easier Graveyard defense",
      "Hog opposite lane forces Tornado (easier) OR forces Evo Exi (rocket it)",
      "With King Tower → Graveyard defense becomes easy",
      "<strong>Rocket after every Graveyard defense</strong> when not down elixir",
      "Cycle logs → eventually puts you in rocket range"
    ]
  },
  {
    title: "Graveyard Poison",
    difficulty: "med",
    short: "KING TOWER IS EVERYTHING • Hog mid kites Valk → tower locks Graveyard",
    deck: ['graveyard','poison','valkyrie','furnace','ice-spirit','tornado','the-log','baby-dragon'],
    main: ['graveyard','poison'],
    extras: [],
    notes: [
      "<em>Most important Graveyard variant to get King Tower — almost guarantees the win</em>",
      "<strong>NATO Fire Spirit tech to activate King early</strong>",
      "Valk Graveyard → <strong>Hog down middle kites Valk back</strong> → tower + King lock on Graveyard",
      "Even with Evo Furnace, you can still rocket (King Tower defends both)",
      "Without King Tower: less aggressive with rockets",
      "NATO their Valk behind river when Graveyard is in their hand",
      "Rocket tower after every defense (even if you hit nothing else)",
      "Random Valk Graveyard at bridge → Hog kites Valk → they can't Poison + defend Hog",
      "Keep Exi out of Furnace fire spirit range",
      "NATO Evo Furnace to opposite lane + Rocket"
    ]
  },
  {
    title: "Drill Poison (w/ Demolisher)",
    difficulty: "hard",
    short: "NEED King Tower • Hog same time as Drill • Save Valk for Knight+Demo",
    deck: ['goblin-drill','poison','goblin-demolisher','knight','goblins','giant-snowball','the-log','ice-spirit'],
    main: ['goblin-drill','poison','goblin-demolisher'],
    extras: [],
    notes: [
      "<strong>NEED King Tower — if you don't get it, you lose</strong>",
      "One Goblin stab for King is worth it",
      "Save Valk for Knight + Demolisher",
      "Knight + Demolisher + Drill push → Hog same time to kite Knight back",
      "<em>Hog when they Drill</em> = they can't Poison/Snowball instantly",
      "Demolisher low enough → rocket it in double",
      "Demolisher mid → Tornado + Rocket",
      "Don't place Exi low enough for Poison",
      "Log first Drill, Goblins second, NATO third to King if needed",
      "One Exi throw + Log + tower shot = destroys a Drill",
      "Evo Valk excellent vs Demolisher",
      "After each Drill defense (not down elixir) → rocket tower"
    ]
  },
  {
    title: "2.6 Hog",
    difficulty: "med",
    short: "Keep Rocket for Ice Golem + Hog • Don't commit early on split pushes",
    deck: ['hog-rider','ice-golem','cannon','musketeer','skeletons','ice-spirit','the-log','fireball'],
    main: ['hog-rider','ice-golem'],
    extras: [],
    notes: [
      "<em>Harder matchup post-heroes</em> — Ice Golem is what makes it tough",
      "Keep Rocket for Ice Golem + Hog in single",
      "Play passive — don't get caught taking damage",
      "Tornado one card away: Hog alone isn't a threat (just Tornado to King)",
      "Without Rocket/NATO: Goblins + Ice Spirit defends Hog",
      "Ice Golem + Hog → Goblins+Ice Spirit kill Ice Golem → NATO Hog (sparingly — King HP matters)",
      "Regular Exi is useless here — prioritize cycling to Evo",
      "<strong>Evo Valk is your best Hog counter</strong>",
      "Two split pushes → <em>don't commit to either side early</em>",
      "When they Ice Golem + Hog, you can rocket (they can't Ice Golem Hog again)",
      "Triple: only rocket cycle if necessary"
    ]
  },
  {
    title: "Classic Pekka BridgeSpam",
    difficulty: "med",
    short: "Don't be aggressive in single • Get King Tower to win",
    deck: ['pekka','battle-ram','royal-ghost','bandit','magic-archer','electro-wizard','poison','the-log'],
    main: ['pekka','battle-ram'],
    extras: [],
    notes: [
      "Don't be aggressive in single — they build counter pushes off everything",
      "Tornado Magic Archer into Valk when possible",
      "Beware Hero Magic Archer ability",
      "Don't Exi in back on weaker lane (Fireball range)",
      "<strong>Get King Tower — main win condition</strong>",
      "<strong>Valk → Ghost/Bandit | Exi+Goblins → Pekka | Log/Ice → Ram</strong>",
      "NATO E-Wiz forward so Hog hits tower",
      "Double: Pekka in back → rocket it (free trade)",
      "Place Exi so it hits BOTH lanes (may need weird NATO)",
      "Tornado everything into Exi double damage",
      "Exi to reset Pekka (don't play too early)",
      "Evo Ram: Evo Exi + Log | Magic Archer: Evo Valk pull"
    ]
  },
  {
    title: "Drill Magic Archer Tornado",
    difficulty: "hard",
    short: "One of the HARDEST matchups • Track Evo Drill cycle • Stack 2 Exis high",
    deck: ['goblin-drill','magic-archer','tornado','bomb-tower','bomber','knight','ice-spirit','rocket'],
    main: ['goblin-drill','magic-archer'],
    extras: [],
    notes: [
      "<em>One of the hardest matchups in the game</em> (especially with Hero MA)",
      "NATO + Drill in deck = confirmed Magic Archer → predict with Iceberg",
      "<strong>King Tower essential</strong>",
      "Rarely worth Hogging with counter-pushing troops (Bomb Tower + NATO counter Hog hard)",
      "<strong>Track Evo Drill cycle</strong> → Hog same time as Evo Drill",
      "Rocket after almost every Drill defense (no MA on board, not down elixir)",
      "Use Hog to block Magic Archer from getting tower lineup",
      "<em>Don't NATO on offense</em> — save it to stop MA hits",
      "<strong>Stack 2 Exis up high</strong> → Magic Archer can't lineup",
      "Log + Exi throw + Goblins defends Drill stab-free (if Bomb Tower already played)",
      "Play Valk very high vs Magic Archer"
    ]
  },
  {
    title: "3.0 Xbow",
    difficulty: "hard",
    short: "Every HP matters • Valk tank + Hog vs middle Xbow • Cycle Log constantly",
    deck: ['x-bow','tesla','archers','knight','ice-spirit','skeletons','fireball','the-log'],
    main: ['x-bow','tesla'],
    extras: [],
    notes: [
      "<em>Every bit of damage matters</em>",
      "Evo Archers/Evo Tesla → consider rocketing Xbow (lock prevention)",
      "Watch for last-second Log on 1HP troop for tiny lock",
      "Single elixir Fireball on tower: not worth rocketing back yet",
      "<strong>Xbow down middle: Valk tank + Hog across river</strong> — too fast to catch",
      "Abuse Hero Goblins ability — forces multi-elixir responses",
      "Xbow alone → predict Fireball on Exi → place Valk preemptively",
      "Hog mid for Xbow → forces Evo Tesla defense",
      "<strong>Keep cycling Log on tower</strong> — clip archers when you can",
      "Hold NATO → if Xbow + Knight, split Goblins + Rocket",
      "Valk at bridge + Exi splashes Knight onto Xbow = wins games"
    ]
  },
  {
    title: "Recruits Fireball Bait",
    difficulty: "easy",
    short: "Flying Machine = #1 threat • Hog same time as Pigs bridge",
    deck: ['royal-recruits','flying-machine','goblin-cage','royal-hogs','zappies','fireball','the-log','royal-delivery'],
    main: ['royal-recruits','royal-hogs','flying-machine'],
    extras: [],
    notes: [
      "<strong>Good matchup</strong> for Hog Exe",
      "<em>Flying Machine is the #1 threat</em> — don't let it sit at river out of tower range",
      "Save Exi same lane as Flying Machine, OR play Exi center + Tornado FM in",
      "Don't overdefend in single — they'll Pigs you for free damage",
      "Pigs bridge → <strong>Hog same time</strong> (they can't instantly Cage without taking a hit)",
      "Only use Valk to protect Exi (even vs Evo Cage)",
      "Tornado Flying Machine into Exi",
      "Double: <em>don't NATO Flying Machine into Rocket</em> — only rocket if free",
      "Valk + Log completely cleans one side",
      "Hog on counter push with Tornado usually gets a hit",
      "Log + NATO clips Zappies + Cage together"
    ]
  }
];

// ---------- helpers ----------

function slugToName(slug) {
  return slug
    .split('-')
    .map(s => s === 'x' ? 'X' : s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
    .replace('Pekka', 'P.E.K.K.A')
    .replace('X Bow', 'X-Bow');
}

function cardChip(slug, opts) {
  opts = opts || {};
  const name = slugToName(slug);
  const cls = ['card-chip'];
  if (opts.mini) cls.push('mini');
  if (state.filterCards.has(slug)) cls.push('active');
  // The label is always rendered. CSS hides it for mini chips on success;
  // onerror flips the chip to .no-img which shows the label as fallback.
  return `<button type="button" class="${cls.join(' ')}" data-card="${slug}" title="${name}" aria-label="Filter by ${name}">
    <img src="${CARD_BASE}/${slug}.png" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-img'); this.remove();">
    <span class="card-chip-label">${name}</span>
  </button>`;
}

function deckRow(slugs, opts) {
  return `<div class="deck-row">${slugs.map(s => cardChip(s, opts)).join('')}</div>`;
}

function categorizeDeck(deck, main) {
  const mainSet = new Set(main || []);
  const groups = { main: [], troop: [], building: [], spell: [] };
  for (const slug of deck) {
    if (mainSet.has(slug)) groups.main.push(slug);
    else groups[cardType(slug)].push(slug);
  }
  // Preserve main order from the `main` array, not deck order
  if (main && main.length) {
    groups.main = main.filter(s => deck.includes(s));
  }
  return groups;
}

// Build the card index dynamically from a list of matchups. Cards not present
// in any of the supplied matchups get omitted — so as the user filters down,
// the picker shrinks to only cards still useful for further filtering.
function buildCardIndex(matchupList) {
  const count = new Map();
  for (const m of matchupList) {
    for (const slug of m.deck) {
      count.set(slug, (count.get(slug) || 0) + 1);
    }
  }
  const by = { win: [], troop: [], building: [], spell: [] };
  for (const [slug, c] of count) {
    by[cardBucket(slug)].push({ slug, count: c });
  }
  // Within each bucket, sort by elixir then by frequency.
  for (const k of Object.keys(by)) {
    by[k].sort((a, b) => elixir(a.slug) - elixir(b.slug) || b.count - a.count || a.slug.localeCompare(b.slug));
  }
  return by;
}

// Split a flat list of card entries into cost sub-buckets, preserving order.
function splitByCost(cards, scheme) {
  const order = scheme === 'wincon' ? ['5+','4-'] : ['5+','4','3-'];
  const groups = {};
  for (const k of order) groups[k] = [];
  for (const c of cards) groups[costBucket(c.slug, scheme)].push(c);
  return order.filter(k => groups[k].length).map(k => ({ label: k, cards: groups[k] }));
}

function difficultyLabel(d) {
  return d === 'hard' ? 'Hard' : d === 'med' ? 'Medium' : 'Easy';
}

function matchupSearchBlob(m) {
  return (m.title + ' ' + m.short + ' ' + m.notes.join(' ') + ' ' + m.deck.map(slugToName).join(' ')).toLowerCase();
}

// ---------- state ----------

const state = {
  query: '',
  filterCards: new Set(),
  difficulty: 'all',
  // Hidden by default — user must explicitly open the picker.
  // localStorage value '0' = explicitly shown, anything else (incl. null) = hidden.
  indexHidden: localStorage.getItem('codex-index-hidden') !== '0'
};

function filterActive() {
  return !!(state.query || state.filterCards.size || state.difficulty !== 'all');
}

function visibleMatchups() {
  return matchups.map((m, i) => ({ m, i })).filter(({ m }) => {
    if (state.difficulty !== 'all' && m.difficulty !== state.difficulty) return false;
    if (state.filterCards.size) {
      for (const slug of state.filterCards) {
        if (!m.deck.includes(slug)) return false;
      }
    }
    if (state.query && !matchupSearchBlob(m).includes(state.query)) return false;
    return true;
  });
}

// ---------- render ----------

const universalTipsHTML = `
<div class="matchup universal">
  <div class="matchup-header">
    <div class="num">★</div>
    <div class="title-block">
      <div class="matchup-title">Universal Tips</div>
      <div class="matchup-short">King Tower • Hero Goblins ability • Hog with counter push</div>
    </div>
    <div class="arrow">▼</div>
  </div>
  <div class="content">
    <div class="content-inner">
      <h4>Always Remember</h4>
      <ul>
        <li><strong>Get King Tower in almost every matchup</strong></li>
        <li>Hero Goblins ability is <em>broken</em> — abuse it constantly</li>
        <li>Counter-pushing Exi/Valk → always Hog with it</li>
        <li>Hover NATO/Rocket on counter pushes for value snipes</li>
        <li>Play troop BEFORE rocket — forces opponent to defend AND rocket back</li>
        <li>Don't stack Valk + Exi close together (lightning bait)</li>
      </ul>
    </div>
  </div>
</div>`;

function renderCardIndex() {
  const el = document.getElementById('card-index');
  if (!el) return;

  // Recompute from currently visible matchups so the picker dynamically prunes
  // cards that wouldn't add useful narrowing.
  const idx = buildCardIndex(visibleMatchups().map(v => v.m));

  const sections = [
    { key: 'win',      label: 'Win Conditions', scheme: 'wincon', emphasize: true },
    { key: 'troop',    label: 'Troops',         scheme: 'three' },
    { key: 'building', label: 'Buildings',      scheme: 'three' },
    { key: 'spell',    label: 'Spells',         scheme: 'three' }
  ];

  el.innerHTML = `
    <div class="index-header">
      <div class="index-label">Filter by Card
        <span class="index-hint">tap any card to filter • sorted by elixir cost</span>
      </div>
      <button type="button" id="index-toggle" class="index-toggle">${state.indexHidden ? '▶ Show' : '▼ Hide'}</button>
    </div>
    <div class="index-body" ${state.indexHidden ? 'hidden' : ''}>
      ${sections.map(s => {
        const cards = idx[s.key];
        if (!cards.length) return '';
        const sub = splitByCost(cards, s.scheme);
        // Flatten cost buckets into a single inline flow with cost-pill separators.
        // Way more compact than one row per bucket — panel height drops by ~half
        // once a filter is applied and bucket counts shrink.
        const inline = sub.map(g => `
          <span class="cost-label">${g.label}<span class="cost-elixir">⚡</span></span>
          ${g.cards.map(c => cardChip(c.slug, { mini: true })).join('')}
        `).join('');
        return `
          <div class="index-group ${s.emphasize ? 'index-group-emphasize' : ''}">
            <div class="index-group-label">${s.label} <span class="index-group-count">${cards.length}</span></div>
            <div class="deck-row index-row index-row-flat">${inline}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPlayerDeck() {
  const el = document.getElementById('player-deck-bottom');
  if (!el) return;
  el.innerHTML = `
    <div class="deck-label">Reference — Your Deck (Hog Exe)</div>
    ${deckRow(playerDeck, { mini: true })}
  `;
}

function renderActiveFilters() {
  const el = document.getElementById('active-filters');
  if (!el) return;
  if (!state.filterCards.size) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  el.innerHTML = `<span class="filter-tag-label">Filtering by:</span>` +
    [...state.filterCards].map(slug => `
      <button type="button" class="filter-tag" data-card="${slug}">
        <img src="${CARD_BASE}/${slug}.png" alt="" onerror="this.style.opacity=0.15">
        ${slugToName(slug)} ✕
      </button>
    `).join('') +
    `<button type="button" class="filter-clear" id="clear-filters">Clear all</button>`;
}

function renderMatchupContent(m) {
  const cats = categorizeDeck(m.deck, m.main);
  // Order: Main first, then Spells (deck identity together), then Support,
  // then Defence, then Extras. With flex-wrap this naturally puts the
  // identity-defining cards on the first visible row.
  const sections = [];
  if (cats.main.length)     sections.push({ key: 'main',     label: 'Main',     cards: cats.main });
  if (cats.spell.length)    sections.push({ key: 'spells',   label: 'Spells',   cards: cats.spell });
  if (cats.troop.length)    sections.push({ key: 'support',  label: 'Support',  cards: cats.troop });
  if (cats.building.length) sections.push({ key: 'defence',  label: 'Defence',  cards: cats.building });
  if (m.extras && m.extras.length) sections.push({ key: 'extras', label: 'Possible Variants', cards: m.extras });

  return `
    <div class="content-inner">
      <h4>Opponent Deck</h4>
      <div class="deck-grid">
        ${sections.map(s => `
          <div class="deck-group group-${s.key}">
            <div class="deck-group-label">${s.label}</div>
            ${deckRow(s.cards)}
          </div>
        `).join('')}
      </div>
      <h4>Full Notes</h4>
      <ul>${m.notes.map(n => `<li>${n}</li>`).join('')}</ul>
    </div>
  `;
}

function render() {
  const container = document.getElementById('matchups');
  const list = visibleMatchups();
  // Auto-open only when filter has narrowed results down to exactly one.
  const autoOpen = list.length === 1 && filterActive();

  if (!list.length) {
    container.innerHTML = `<div class="empty-state">No matchups match the current filters.</div>` + universalTipsHTML;
  } else {
    container.innerHTML = list.map(({ m, i }) => `
      <div class="matchup ${autoOpen ? 'open' : ''}" data-difficulty="${m.difficulty}">
        <div class="matchup-header">
          <div class="num">${String(i + 1).padStart(2, '0')}</div>
          <div class="title-block">
            <div class="matchup-title">${m.title} <span class="badge ${m.difficulty}">${difficultyLabel(m.difficulty)}</span></div>
            ${m.main && m.main.length ? `<div class="main-cards">${m.main.map(s => cardChip(s, { mini: true })).join('')}</div>` : ''}
            <div class="matchup-short">${m.short}</div>
          </div>
          <div class="arrow">▼</div>
        </div>
        <div class="content">
          ${renderMatchupContent(m)}
        </div>
      </div>
    `).join('') + universalTipsHTML;
  }

  renderActiveFilters();
  renderCardIndex();
  const visEl = document.getElementById('stat-visible');
  if (visEl) visEl.textContent = list.length;
}

// ---------- interactions ----------

function toggle(el) {
  el.parentElement.classList.toggle('open');
}

function expandAll() {
  document.querySelectorAll('#matchups .matchup').forEach(m => m.classList.add('open'));
}

function collapseAll() {
  document.querySelectorAll('#matchups .matchup').forEach(m => m.classList.remove('open'));
}

function toggleCardFilter(slug) {
  if (state.filterCards.has(slug)) state.filterCards.delete(slug);
  else state.filterCards.add(slug);
  render();
}

function clearFilters() {
  state.filterCards.clear();
  state.query = '';
  state.difficulty = 'all';
  const search = document.getElementById('search-input');
  if (search) search.value = '';
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
  render();
}

function wireGlobalHandlers() {
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.card-chip');
    if (chip && chip.dataset.card) {
      toggleCardFilter(chip.dataset.card);
      return;
    }
    const tag = e.target.closest('.filter-tag');
    if (tag && tag.dataset.card) {
      toggleCardFilter(tag.dataset.card);
      return;
    }
    if (e.target.id === 'clear-filters') {
      clearFilters();
      return;
    }
    if (e.target.id === 'index-toggle') {
      state.indexHidden = !state.indexHidden;
      localStorage.setItem('codex-index-hidden', state.indexHidden ? '1' : '0');
      renderCardIndex();
      return;
    }
    const header = e.target.closest('.matchup-header');
    if (header) {
      toggle(header);
      return;
    }
  });

  const search = document.getElementById('search-input');
  if (search) {
    search.addEventListener('input', (e) => {
      state.query = e.target.value.trim().toLowerCase();
      render();
    });
  }

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });
}

window.toggle = toggle;
window.expandAll = expandAll;
window.collapseAll = collapseAll;

document.addEventListener('DOMContentLoaded', () => {
  renderCardIndex();
  renderPlayerDeck();
  render();
  wireGlobalHandlers();
});
