/* eslint-disable max-len */
/* eslint @typescript-eslint/quotes: ["error", "double"] */

/*
 I do a lot of funny Typescript stuff in this file to force validation for the linter
*/

export const tiers = ["S", "A", "B"] as const;

const tribes = ["OverWorld", "UnderWorld", "Danian", "Mipedian", "M'arrillian", "Mixed"] as const;

// https://en.wikipedia.org/wiki/Magic:_The_Gathering_deck_types#:~:text=The%20traditional%20archetypes%20fit
const types = ["Aggro", "Control", "Combo", "Aggro-Control", "Gimmick", "Midrange", "Anti-Meta", "Prison"] as const;

type Tier = typeof tiers[number];

type Tribe = typeof tribes[number];

type DeckType = typeof types[number];

export function isTier(input: string): input is Tier {
  return tiers.includes(input as any);
}

export function isType(input: string): input is DeckType {
  return types.includes(input as any);
}

export const axes: {[key in DeckType]: string} = {
  Aggro: "Threats, Tempo, Redundant",
  Control: "Answers, Inevitable, Redundant",
  Combo: "Threats, Inevitable, Essential",
  "Aggro-Control": "Answers, Tempo, Redundant",
  Midrange: "Threats, Inevitable, Redundant",
  Prison: "Answers, Inevitable, Essential",
  Gimmick: "Threats, Tempo, Essential",
  "Anti-Meta": "Answers, Tempo, Essential"
};

// The names in the decklist have to be found in this list
// This is to prevent crashes with the tierlist command if a deckname is mispelled or missing
const _tierlist = {
  S: [
    "Healdrom",
    "Rawr",
    "Strike",
    "Swimming Team",
    "UnderWorld Burn",
  ],
  A: [
    "Aszil Compost",
    "Danian Burn",
    "Fliandar",
    "Heartmatred's Attack",
    "Master of the Sails",
    "PoP'in Off",
    "Sis Ops",
    "Stelphor (Kraken)",
    "Tree Frogs",
    "Wise Guys"
  ],
  B: [
    "Danian Discipline Compost",
    "Gan'trak Bladez",
    "Grantkae Control",
    "Feasting",
    "Oath of the Oasis",
    "Ocean Man",
    "OverWorld Elemental",
    "OverWorld Muge",
    "Tartereklessness",
    "Trampling Mammoth",
    "Ursis Dagger",
    "Warbeast"
  ],
  // Place any unranked decks here for the purpose of linting
  _: [
    "Arrthoa Herken Loyal",
    "Aszil Courage",
    "Brathe Yourself",
    "Crack the Whep",
    "Erak'tabb",
    "Fire and Brimstone",
    "FireFly",
    "Flame On!",
    "Flying Frogs",
    "Four Arms",
    "GearEater",
    "Getting Ripped",
    "Gintanai",
    "Gorram Malvadine",
    "Grounded",
    "Hive Mind",
    "Khorror",
    "Lankerek",
    "Lyssta Mixed",
    "M'arr Courage Wisdom",
    "MaxWreck",
    "Mip Reckless",
    "No Healing",
    "Reporting for Duty",
    "UnderWorld Discipline Burn"
  ]
} as const;

export const tierlist = _tierlist as any as {[key in Tier]: string[]};

type deck_names = typeof _tierlist["S"] | typeof _tierlist["A"] | typeof _tierlist["B"] | typeof _tierlist["_"];

interface Deck {
  url: string
  tribe: Tribe
  type: DeckType[]
  tags: string[]
  creatures: string[]
}

const _decklist: {[key in deck_names[number]]: Deck} = {
  "Aszil Compost": {
    url: "https://chaoticbackup.forumotion.com/t1580-aszil-compost",
    tribe: "Danian",
    type: ["Control"],
    tags: ["Compost", "Earth", "Courage"],
    creatures: ["Aszil, the Young Queen", "Elna", "Hiadrom", "Illexia, The Danian Queen", "Makanaz"]
  },
  "Aszil Courage": {
    url: "https://chaoticbackup.forumotion.com/t1574-aszil-courage",
    tribe: "Danian",
    tags: ["Earth", "Courage"],
    type: ["Control", "Combo"],
    creatures: ["Aszil, the Young Queen", "Kolmo, Assimilated", "Illexia, The Danian Queen", "Odu-Bathax, Reservoir Reclaimer", "Tassanil, High Elementalist", "Lore"]
  },
  "Arrthoa Herken Loyal": {
    url: "https://chaoticbackup.forumotion.com/t1616-arrthoa",
    tribe: "OverWorld",
    tags: ["Water"],
    type: ["Midrange"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Lomma, Desert Wanderer", "Maxxor, Elemental Champion", "Rellim, Watermaster", "Herken"]
  },
  Feasting: {
    url: "https://chaoticbackup.forumotion.com/t1679-herken-morph#15160",
    tribe: "Mixed",
    type: ["Midrange"],
    tags: ["Fluidmorph"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Lomma, Desert Wanderer", "Nunk'worm", "Rellim, Watermaster", "Herken", "Na-inna", "Lam'inkal"]
  },
  "Brathe Yourself": {
    url: "https://chaoticbackup.forumotion.com/t1598-brathe-yourself",
    tribe: "Mixed",
    tags: ["Strike", "Dagger"],
    type: ["Aggro"],
    creatures: ["Brathe", "Bladez", "Vunhra", "Smildon", "Ikkatosh, The Aich King"]
  },
  "UnderWorld Burn": {
    url: "https://chaoticbackup.forumotion.com/t1661-uw-burn#15077",
    tribe: "UnderWorld",
    tags: ["Burn", "Fire"],
    type: ["Aggro"],
    creatures: ["Chaor, The Fierce", "Ulmar, Perithon Racer", "Takinom, The Shadowknight", "Kaal", "Kopond, High Muge of the Hearth", "Nivena"]
  },
  "Crack the Whep": {
    url: "https://chaoticbackup.forumotion.com/t1589-crack-the-whep",
    tribe: "Mixed",
    tags: ["Fire", "Power"],
    type: ["Aggro"],
    creatures: ["Magmon, Engulfed", "Tangath Toborn, In Training", "Tangath Toborn, OverWorld General", "Akkalbi"]
  },
  "Danian Burn": {
    url: "https://chaoticbackup.forumotion.com/t1669-danian-burn",
    tribe: "Danian",
    tags: ["Water", "Air", "Burn"],
    type: ["Midrange"],
    creatures: ["Gareep", "Ulmquad", "Illexia, The Danian Queen", "Irrabeq", "Nunkworm, Assimilated"]
  },
  "Danian Discipline Compost": {
    url: "https://chaoticbackup.forumotion.com/t1681-danian-discipline-compost",
    tribe: "Danian",
    tags: ["Compost"],
    type: ["Midrange"],
    creatures: ["Tarin", "Makanaz", "Ivelaan", "Elhadd", "Mhein", "Illexia, The Danian Queen"]
  },
  "Erak'tabb": {
    url: "https://chaoticbackup.forumotion.com/t1695-erak-tabb",
    tribe: "M'arrillian",
    tags: [],
    type: ["Midrange"],
    creatures: ["Blaaxa", "Okaxor", "Erak'tab", "Tarterek, Psi Overloader", "Arrthoa"]
  },
  "Flame On!": {
    url: "https://chaoticbackup.forumotion.com/t1577-flame-on",
    tribe: "Mixed",
    tags: ["Fire"],
    type: ["Aggro-Control", "Combo"],
    creatures: ["Gronmor", "Na-inna", "Nunk'worn", "Piddan", "Tangath Toborn, In Training", "Tangath Toborn, OverWorld General"]
  },
  FireFly: {
    url: "https://chaoticbackup.forumotion.com/t1585-firefly",
    tribe: "M'arrillian",
    tags: ["Water"],
    type: ["Aggro-Control"],
    creatures: ["Ulmquad", "Bahrakatan, The Coralsmith", "Rellim, Watermaster", "Lam'inkal"]
  },
  "Flying Frogs": {
    url: "https://chaoticbackup.forumotion.com/t1590-flying-frogs",
    tribe: "Mixed",
    tags: ["Fire"],
    type: ["Midrange"],
    creatures: ["Anarkiar", "Garv", "Ikkatosh, The Aich King", "Magmon, Engulfed"]
  },
  "Four Arms": {
    url: "https://chaoticbackup.forumotion.com/t1593-four-arms",
    tribe: "Mixed",
    tags: [],
    type: ["Combo", "Midrange"],
    creatures: ["Aggroar", "Ebbikka", "Ikkatosh, The Aich King", "Olkiex, Driver Extraordinaire", "Vunhra"]
  },
  Fliandar: {
    url: "https://chaoticbackup.forumotion.com/t1572-fliandar-mixed",
    tribe: "Mixed",
    tags: ["Infection"],
    type: ["Control"],
    creatures: ["Amblox", "Fliandar", "Lomma, Desert Wanderer", "Topar", "Akkalbi"]
  },
  "Gan'trak Bladez": {
    url: "https://chaoticbackup.forumotion.com/t1655-gan-trak#15068",
    tribe: "M'arrillian",
    tags: [],
    type: ["Anti-Meta"],
    creatures: ["Gan'trak", "Jaidwarl", "Okaxor", "Bladez", "Brimflame", "Nunk'worm", "Gronmor"]
  },
  GearEater: {
    url: "https://chaoticbackup.forumotion.com/t1591-ilx-geareater",
    tribe: "Mixed",
    tags: [],
    type: ["Gimmick"],
    creatures: ["Ilx", "Lomma, Desert Wanderer", "Vlar", "Akkalbi", "Zapetur"]
  },
  "Getting Ripped": {
    url: "https://chaoticbackup.forumotion.com/t1687-getting-ripped",
    tribe: "Danian",
    tags: [],
    type: ["Combo", "Midrange"],
    creatures: ["Aszil, The Young Queen", "Illexia, The Danian Queen", "Hiadrom, Rock Ripper", "Elna", "Tassanil, High Elementalist"]
  },
  Gintanai: {
    url: "https://chaoticbackup.forumotion.com/t1592-gintanai",
    tribe: "Mipedian",
    tags: ["Warbeast"],
    type: ["Aggro-Control"],
    creatures: ["Noaz, Mipedian Cavalerist", "Headmaster Ankyja", "Gintanai, The Forgotten", "Xelfe"]
  },
  "Gorram Malvadine": {
    url: "https://chaoticbackup.forumotion.com/t1583-gorram-malvadine",
    tribe: "Mixed",
    tags: [],
    type: ["Combo", "Gimmick"],
    creatures: ["Alazdan", "Gorram, Danian General", "Illiar", "Malvadine, The King's Herald", "Taffial"]
  },
  "Grantkae Control": {
    url: "https://chaoticbackup.forumotion.com/t1651-grantkae-control",
    tribe: "Mixed",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Grantkae, Mipedian General", "Kalt", "Nivenna, UnderWorld Lieutenant", "Malvadine, The King's Herald", "Ulmquad"]
  },
  Grounded: {
    url: "https://chaoticbackup.forumotion.com/t1660-grounded",
    tribe: "UnderWorld",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Agitos, Eloquent Motivator", "Galmedar", "Kopond, High Muge of the Hearth", "Lord Van Bloot"]
  },
  Healdrom: {
    url: "https://chaoticbackup.forumotion.com/t1698-healdrom",
    tribe: "Mixed",
    tags: ["Scouts' Monocular"],
    type: ["Combo"],
    creatures: ["Olkiex", "Lam'inkal", "Lomma, Desert Wanderer", "Hiadrom, Rock Ripper", "Garv"]
  },
  "Heartmatred's Attack": {
    url: "https://chaoticbackup.forumotion.com/t1672-hermatred",
    tribe: "Danian",
    tags: ["Compost", "Infection", "Courage"],
    type: ["Combo"],
    creatures: ["Tabaal", "Illexia, The Danian Queen", "Ivelaan", "Elhadd", "Hermatred"]
  },
  "Hive Mind": {
    url: "https://chaoticbackup.forumotion.com/t1599-hivemind",
    tribe: "Mixed",
    tags: ["Compost"],
    type: ["Control"],
    creatures: ["Elhadd", "Ivelaan", "Makanaz", "Stelgar, Vicious Mutation"]
  },
  "Fire and Brimstone": {
    url: "https://chaoticbackup.forumotion.com/t1571-fire-and-brimstone",
    tribe: "UnderWorld",
    tags: ["Fire", "Air"],
    type: ["Aggro"],
    creatures: ["Brimflame", "Chaor", "Bladez", "Takinom, The Shadowknight", "Kopond, High Muge of the Hearth"]
  },
  "Stelphor (Kraken)": {
    url: "https://chaoticbackup.forumotion.com/t1586-kraken#15168",
    tribe: "Mixed",
    tags: [],
    type: ["Control"],
    creatures: ["Stelgar, Vicious Mutation", "Lomma, Desert Wanderer", "Ifjann", "Kepiaan, Danian Lieutenant", "Phelphor, Of the Deep", "Xelfe", "Tangath Toborn, OverWorld General"]
  },
  Khorror: {
    url: "https://chaoticbackup.forumotion.com/t1588-khorror",
    tribe: "Mipedian",
    tags: ["Warbeast"],
    type: ["Prison"],
    creatures: ["Ailav", "Khorror", "Ranun", "Savell", "Xelfe"]
  },
  Lankerek: {
    url: "https://chaoticbackup.forumotion.com/t1569-lankerek",
    tribe: "Mixed",
    tags: ["Infection"],
    type: ["Aggro-Control"],
    creatures: ["Garv", "Tarterek, Psi Overloader", "Lomma, Desert Wanderer", "Vunhra", "Lanker"]
  },
  "Lyssta Mixed": {
    url: "https://chaoticbackup.forumotion.com/t1576-lyssta-mixed",
    tribe: "Mixed",
    tags: [],
    type: ["Midrange"],
    creatures: ["Grantkae, Mipedian General", "Lyssta", "Malvadine, The King's Herald", "Ursis", "Vunhra"]
  },
  "M'arr Courage Wisdom": {
    url: "https://chaoticbackup.forumotion.com/t1689-marr-courage-wisdom",
    tribe: "M'arrillian",
    tags: [],
    type: ["Aggro"],
    creatures: ["Tarterek, Psi Overloader", "Gimwei", "Erak'tabb", "Neth'uar", "Xis'torq"]
  },
  "Master of the Sails": {
    url: "https://chaoticbackup.forumotion.com/t1680-master-of-the-sails",
    tribe: "Mixed",
    tags: ["Fluidmorph"],
    type: ["Aggro-Control"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Nunk'worm", "Lomma, Desert Wanderer", "Ulmquad", "Rellim, Watermaster"]
  },
  MaxWreck: {
    url: "https://chaoticbackup.forumotion.com/t1566-maxwreck",
    tribe: "OverWorld",
    tags: [],
    type: ["Midrange"],
    creatures: ["Tarterek, Psi Overloader", "Tangath Toborn, In Training", "Maxxor", "Najarin, High Muge of the Lake"]
  },
  "Mip Reckless": {
    url: "https://chaoticbackup.forumotion.com/t1596-mipedian-reckless",
    tribe: "Mipedian",
    tags: ["Enre-hep"],
    type: ["Midrange"],
    creatures: ["Malvadine, The King's Herald", "Ribbian", "Na-inna, Rebel of the Rao'Pa Sahkk", "Enre-hep"]
  },
  "No Healing": {
    url: "https://chaoticbackup.forumotion.com/t1579-no-healing",
    tribe: "Mixed",
    tags: ["Tribeless", "Infection"],
    type: ["Midrange"],
    creatures: ["Ursis", "Galmedar", "Smildon", "Vunhra"]
  },
  "Oath of the Oasis": {
    url: "https://chaoticbackup.forumotion.com/t1683-oath-of-the-oasis",
    tribe: "Mixed",
    tags: [],
    type: ["Midrange"],
    creatures: ["Glapaal", "Kinnianne, Ambassador to the Mipedians", "Malvadine, The King's Herald", "Lam'inkal", "Na-inna"]
  },
  "Ocean Man": {
    url: "https://chaoticbackup.forumotion.com/t1595-ocean-man",
    tribe: "Mixed",
    tags: [],
    type: ["Midrange", "Gimmick"],
    creatures: ["Ontinee", "Na-inna", "Phelphor, Of the Deep", "Tangath Toborn, OverWorld General", "Glapaal"]
  },
  "OverWorld Elemental": {
    url: "https://chaoticbackup.forumotion.com/t1570-overworld-elemental",
    tribe: "OverWorld",
    tags: ["Fire", "Earth", "Water"],
    type: ["Midrange"],
    creatures: ["Gronmor", "Tangath Toborn, In Training", "Intress, Natureforce", "Najarin, High Muge of the Lake"]
  },
  "OverWorld Muge": {
    url: "https://chaoticbackup.forumotion.com/t1690-overworld-muge",
    tribe: "OverWorld",
    tags: [],
    type: ["Midrange"],
    creatures: ["Tangath Toborn, In Training", "Maxxor, Elemental Champion", "Attacat, Tactical Aide", "Drabe", "Lomma, Desert Wanderer", "Karraba"]
  },
  "PoP'in Off": {
    url: "https://chaoticbackup.forumotion.com/t1674-pop-in-off",
    tribe: "OverWorld",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Maxxor, Protector of Perim", "Najarin, High Muge of the Lake", "Arbeid", "Drabe", "Tarterek, Psi Overloader", "Garv"]
  },
  Rawr: {
    url: "https://chaoticbackup.forumotion.com/t1682-rawr",
    tribe: "Mipedian",
    tags: [],
    type: ["Control"],
    creatures: ["Enre-hep", "Ailav", "Ranun", "Ixxik", "Xelfe"]
  },
  "Reporting for Duty": {
    url: "https://chaoticbackup.forumotion.com/t1688-reporting-for-duty",
    tribe: "Danian",
    tags: ["Infection"],
    type: ["Combo", "Aggro-Control"],
    creatures: ["Amblox", "Illexia, The Danian Queen", "Nimmei", "Elna", "Wamma, Hive Ordnance", "Tabaal"]
  },
  "Sis Ops": {
    url: "https://chaoticbackup.forumotion.com/t1667-multi-tribe-mash-up",
    tribe: "Mixed",
    tags: [],
    type: ["Combo"],
    creatures: ["Kepiaan, Danian Lieutenant", "Tangath Toborn, OverWorld General", "Aivenna, OverWorld Lieutenant", "Nunk'worn", "Na-inna", "Nivenna, UnderWorld Lieutenant"]
  },
  // "Six Arms": {
  //   url: "https://chaoticbackup.forumotion.com/t1581-6-arms",
  //   tribe: "Mixed",
  //   tags: ["Infection"],
  //   type: ["Combo"],
  //   creatures: ["Ebbikka", "Olkiex, Driver Extraordinaire", "Ikkatosh, The Aich King", "Vunhra"]
  // },
  Strike: {
    url: "https://chaoticbackup.forumotion.com/t1568-strike",
    tribe: "Mipedian",
    tags: ["Strike"],
    type: ["Midrange"],
    creatures: ["Malvadine, The King's Herald", "Headmaster Ankhyja", "Ifjann", "Owayki"]
  },
  "Swimming Team": {
    url: "https://chaoticbackup.forumotion.com/t1567-swimming-team",
    tribe: "Mixed",
    tags: [],
    type: ["Midrange"],
    creatures: ["Ulmquad", "Lomma, Desert Wanderer", "Phelphor, Of the Deep", "Tangath Toborn, OverWorld General", "Na-inna"]
  },
  Tartereklessness: {
    url: "https://chaoticbackup.forumotion.com/t1686-tartereklessness",
    tribe: "M'arrillian",
    tags: [],
    type: ["Midrange"],
    creatures: ["Tartarek, Psi Overloader", "Akkalbi", "Xis'torq", "Jaidwarl", "Gimwei"]
  },
  "Trampling Mammoth": {
    url: "https://chaoticbackup.forumotion.com/t1658-proboscartosh-a-trampling-mammoth",
    tribe: "Mixed",
    tags: ["Tribeless"],
    type: ["Aggro-Control"],
    creatures: ["Proboscar", "Lanker", "Ikkatosh, The Aich King", "Porthyn", "Xelfe"]
  },
  "Tree Frogs": {
    url: "https://chaoticbackup.forumotion.com/t1565-lanarkiar",
    tribe: "Mixed",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Lanker", "Ikkatosh, The Aich King", "Anarkiar", "Garv", "Lomma, Desert Wanderer"]
  },
  "UnderWorld Discipline Burn": {
    url: "https://chaoticbackup.forumotion.com/t1661-uw-burn#15170",
    tribe: "UnderWorld",
    tags: ["Burn"],
    type: ["Aggro"],
    creatures: ["Chaor", "Rothar, Forceful Negotiator", "Ulmar, Perithon Racer", "Kopond, High Muge"]
  },
  "Ursis Dagger": {
    url: "https://chaoticbackup.forumotion.com/t1670-ursis",
    tribe: "Mixed",
    tags: ["Tribeless", "Dagger", "Infection"],
    type: ["Aggro-Control"],
    creatures: ["Bladez", "Lomma, Desert Wanderer", "Ursis", "Ragetrod", "Vunhra", "Smildon", "Taffial", "Ajara", "Tangath Toborn, In Training"]
  },
  Warbeast: {
    url: "https://chaoticbackup.forumotion.com/t1582-blazvatan",
    tribe: "Mipedian",
    tags: ["Warbeast", "Air", "Earth"],
    type: ["Midrange"],
    creatures: ["Blazvatan, The Epic Warbeast", "Ailav", "Kileron, Warbeast of the Dust Storm", "Malvadine, The King's Herald", "Bylkian", "Ranun", "Gaffat-ra"]
  },
  "Wise Guys": {
    url: "https://chaoticbackup.forumotion.com/t1563-wise-guys",
    tribe: "OverWorld",
    tags: [],
    type: ["Control"],
    creatures: ["Ikkatosh, The Aich King", "Aivenna", "Drabe", "Garv", "Porthyn", "Tarterek, Psi Overloader", "Lomma, Desert Wanderer"]
  }
};

export const decklist = _decklist as {[key: string]: Deck};
