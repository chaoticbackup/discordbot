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

export const toplist: Array<deck_names[number]> = [
  "Aszil Compost",
  "Arrthoa Ulmquad",
  "Blazvatan Warbeast",
  "Danian Burn",
  "Kolmpost",
  "PoP",
  "Rawr",
  "Strike",
  "Stelphor (Kraken)",
  "UnderWorld Burn",
  "Ursis Dagger",
  "Wise Guys"
];

// The names in the decklist have to be found in this list
// This is to prevent crashes with the tierlist command if a deckname is mispelled or missing
export const sortedlist = {
  S: [
    "Danian Burn",
    "Kolmpost",
    "Rawr",
    "Strike",
    "Swimming Team",
    "UnderWorld Discipline Burn"
  ],
  A: [
    "Aszil Compost",
    "Arrthoa Ulmquad",
    "Elegy Spam",
    "Fliandar",
    "Grantkae Nivenna",
    "Healdrom",
    "Sis Ops",
    "Stelphor (Kraken)",
    "Ursis Dagger",
    "Wise Guys"
  ],
  B: [
    "Blazvatan Warbeast",
    "Compost Malvone",
    "Gan'trak Bladez",
    "Hermatred",
    "Oath",
    "PoP",
    "Tartareklessness",
    "Tree Frogs",
    "Trampling Mammoth"
  ],
  curated: [
    "Erak'tabb Tartarek",
    "Feasting",
    "Firefly",
    "Flame On",
    "Nimmei",
    "Ocean Man",
    "OverWorld Muges",
    "OverWorld Elemental",
    "Ursis D Muge"
  ],
  // Place any unranked decks here for the purpose of linting
  _: [
    "Arrthoa Loyal",
    "Aszil Courage",
    "Aa'une Tarterek",
    "Brathe Yourself",
    "Bodal's Boys",
    "Crack the Whep",
    "Fire and Brimstone",
    "Flying Frogs",
    "Four Arms",
    "Gan'trak Issaley",
    "GearEater",
    "Getting Ripped",
    "Gintanai",
    "Grounded",
    "Khorror",
    "Lankerek",
    "Lyssta Mixed",
    "Mandiblor Printer",
    "MaxWreck",
    "Mip Reckless",
    "No Healing",
    "Stelgar Compost",
    "UnderWorld Burn",
  ]
} as const;

export const tierlist = sortedlist as any as {[key in Tier]: string[]};

type deck_names = typeof sortedlist["S"] | typeof sortedlist["A"] | typeof sortedlist["B"] | typeof sortedlist["_"] | typeof sortedlist["curated"];
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
  "Arrthoa Loyal": {
    url: "https://chaoticbackup.forumotion.com/t1616-arrthoa-loyal#15193",
    tribe: "OverWorld",
    tags: ["Water", "Prexxor Chasm"],
    type: ["Midrange"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Lomma, Desert Wanderer", "Maxxor, Elemental Champion", "Rellim, Watermaster", "Herken", "Tangath Toborn, In Training"]
  },
  "Aa'une Tarterek": {
    url: "https://chaoticbackup.forumotion.com/t1724-aa-une",
    tribe: "M'arrillian",
    tags: ["Water", "Psionic Serenade"],
    type: ["Gimmick"],
    creatures: ["Aa'une", "Tarterek, Psi Overloader", "Nunk'worn", "Lam'inkal"]
  },
  "Blazvatan Warbeast": {
    url: "https://chaoticbackup.forumotion.com/t1582-blazvatan",
    tribe: "Mipedian",
    tags: ["Warbeast", "Air", "Earth"],
    type: ["Midrange"],
    creatures: ["Blazvatan, The Epic Warbeast", "Ailav", "Kileron, Warbeast of the Dust Storm", "Malvadine, The King's Herald", "Bylkian", "Ranun", "Gaffat-ra"]
  },
  "Bodal's Boys": {
    url: "https://chaoticbackup.forumotion.com/t1563-wise-guys",
    tribe: "OverWorld",
    tags: ["Dagger"],
    type: ["Control"],
    creatures: ["Ikkatosh, The Aich King", "Aivenna", "Drabe", "Garv", "Porthyn"]
  },
  "Brathe Yourself": {
    url: "https://chaoticbackup.forumotion.com/t1598-brathe-yourself",
    tribe: "Mixed",
    tags: ["Strike", "Dagger"],
    type: ["Aggro"],
    creatures: ["Brathe", "Bladez", "Vunhra", "Smildon", "Ikkatosh, The Aich King"]
  },
  "Arrthoa Ulmquad": {
    url: "https://chaoticbackup.forumotion.com/t1680-master-of-the-sails",
    tribe: "Mixed",
    tags: ["Fluidmorph"],
    type: ["Aggro-Control"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Nunk'worm", "Lomma, Desert Wanderer", "Ulmquad", "Rellim, Watermaster"]
  },
  "Compost Malvone": {
    url: "https://chaoticbackup.forumotion.com/t1710-compost-malvone#15183",
    tribe: "Mixed",
    tags: ["Beaver"],
    type: ["Aggro"],
    creatures: ["Alazdan", "Gorram, Danian General", "Malvadine, The King's Herald", "Taffial", "Ajfak", "Tiaane"]
  },
  "Crack the Whep": {
    url: "https://chaoticbackup.forumotion.com/t1589-crack-the-whep",
    tribe: "Mixed",
    tags: ["Fire", "Power"],
    type: ["Aggro"],
    creatures: ["Magmon, Engulfed", "Tangath Toborn, In Training", "Tangath Toborn, OverWorld General", "Akkalbi"]
  },
  "Danian Burn": {
    url: "https://chaoticbackup.forumotion.com/t1669-danian-burn#15092",
    tribe: "Danian",
    tags: ["Water", "Air", "Burn"],
    type: ["Midrange"],
    creatures: ["Gareep", "Ulmquad", "Illexia, The Danian Queen", "Irrabeq", "Nunkworm, Assimilated"]
  },
  "Elegy Spam": {
    url: "https://chaoticbackup.forumotion.com/t1708-elegy-spam",
    tribe: "Mixed",
    tags: ["Elemental Elegy"],
    type: ["Control"],
    creatures: ["Ulmquad", "Najarin, Younger", "Na-inna", "Lamin'kal", "Na-inna"]
  },
  "Erak'tabb Tartarek": {
    url: "https://chaoticbackup.forumotion.com/t1689-erak-tabb-tartarek",
    tribe: "M'arrillian",
    tags: [],
    type: ["Midrange"],
    creatures: ["Blaaxa", "Okaxor", "Erak'tabb", "Tarterek, Psi Overloader", "Arrthoa", "Jaidwarl", "Neth'uar", "Xis'torq"]
  },
  Feasting: {
    url: "https://chaoticbackup.forumotion.com/t1679-herken-morph#15160",
    tribe: "Mixed",
    type: ["Midrange"],
    tags: ["Fluidmorph"],
    creatures: ["Arrthoa, Captain of the Ezoa", "Lomma, Desert Wanderer", "Nunk'worm", "Rellim, Watermaster", "Herken", "Na-inna", "Lam'inkal"]
  },
  "Fire and Brimstone": {
    url: "https://chaoticbackup.forumotion.com/t1571-fire-and-brimstone",
    tribe: "UnderWorld",
    tags: ["Fire", "Air"],
    type: ["Aggro"],
    creatures: ["Brimflame", "Chaor", "Bladez", "Takinom, The Shadowknight", "Kopond, High Muge of the Hearth"]
  },
  Firefly: {
    url: "https://chaoticbackup.forumotion.com/t1585-firefly#15015",
    tribe: "M'arrillian",
    tags: ["Mipedian Fulgurite"],
    type: ["Gimmick"],
    creatures: ["Lam'inkal", "Rellim, Watermaster", "Bahrakatan, The Coralsmith", "Ulmquad", "Rol'doi"]
  },
  "Flame On": {
    url: "https://chaoticbackup.forumotion.com/t1577-flame-on",
    tribe: "Mixed",
    tags: ["Fire"],
    type: ["Aggro-Control", "Combo"],
    creatures: ["Gronmor", "Na-inna", "Nunk'worn", "Piddan", "Tangath Toborn, In Training", "Tangath Toborn, OverWorld General"]
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
  "Gan'trak Issaley": {
    url: "https://chaoticbackup.forumotion.com/t1655-gan-trak-bladez#15165",
    tribe: "M'arrillian",
    tags: [],
    type: ["Anti-Meta"],
    creatures: ["Gan'trak", "Issaley", "Okaxor", "Bladez", "Uksum"]
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
  "Grantkae Nivenna": {
    url: "https://chaoticbackup.forumotion.com/t1651-grantkae-control#15207",
    tribe: "Mixed",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Grantkae, Mipedian General", "Kalt", "Nivenna, UnderWorld Lieutenant", "Malvadine, The King's Herald", "Ulmquad", "Illiar", "Kolmo, Purified"]
  },
  Grounded: {
    url: "https://chaoticbackup.forumotion.com/t1660-grounded",
    tribe: "UnderWorld",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Agitos, Eloquent Motivator", "Galmedar", "Kopond, High Muge of the Hearth", "Lord Van Bloot"]
  },
  Healdrom: {
    url: "https://chaoticbackup.forumotion.com/t1705-healdrom",
    tribe: "Mixed",
    tags: ["Scouts' Monocular"],
    type: ["Combo"],
    creatures: ["Olkiex", "Lam'inkal", "Lomma, Desert Wanderer", "Hiadrom, Rock Ripper", "Garv", "Xelfe"]
  },
  Hermatred: {
    url: "https://chaoticbackup.forumotion.com/t1672-hermatred",
    tribe: "Danian",
    tags: ["Compost", "Infection", "Courage"],
    type: ["Combo"],
    creatures: ["Tabaal", "Illexia, The Danian Queen", "Ivelaan", "Elhadd", "Hermatred"]
  },
  Khorror: {
    url: "https://chaoticbackup.forumotion.com/t1588-khorror",
    tribe: "Mipedian",
    tags: ["Warbeast"],
    type: ["Prison"],
    creatures: ["Ailav", "Khorror", "Ranun", "Savell", "Xelfe"]
  },
  Kolmpost: {
    url: "https://chaoticbackup.forumotion.com/t1681-danian-discipline-compost#15200",
    tribe: "Danian",
    tags: ["Compost"],
    type: ["Midrange"],
    creatures: ["Tarin", "Makanaz", "Ivelaan", "Elhadd", "Mhein", "Illexia, The Danian Queen", "Kolmo, Assimilated"]
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
  "Mandiblor Printer": {
    url: "https://chaoticbackup.forumotion.com/t1702-mandiblor-printer-aka-kolmo-compost",
    tribe: "Danian",
    tags: ["Compost"],
    type: ["Prison"],
    creatures: ["Kolmo, Assimilated", "Hiadrom", "Illexia, The Danian Queen", "Makanaz", "Ivelaan"]
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
  Nimmei: {
    url: "https://chaoticbackup.forumotion.com/t1688-reporting-for-duty",
    tribe: "Danian",
    tags: ["Infection"],
    type: ["Combo", "Aggro-Control"],
    creatures: ["Amblox", "Illexia, The Danian Queen", "Nimmei", "Elna", "Wamma, Hive Ordnance", "Tabaal"]
  },
  "No Healing": {
    url: "https://chaoticbackup.forumotion.com/t1579-no-healing",
    tribe: "Mixed",
    tags: ["Tribeless", "Infection"],
    type: ["Midrange"],
    creatures: ["Ursis", "Galmedar", "Smildon", "Vunhra"]
  },
  Oath: {
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
  "OverWorld Muges": {
    url: "https://chaoticbackup.forumotion.com/t1690-overworld-muge",
    tribe: "OverWorld",
    tags: [],
    type: ["Midrange"],
    creatures: ["Tangath Toborn, In Training", "Maxxor, Elemental Champion", "Attacat, Tactical Aide", "Drabe", "Lomma, Desert Wanderer", "Karraba"]
  },
  PoP: {
    url: "https://chaoticbackup.forumotion.com/t1674-pop-in-off",
    tribe: "OverWorld",
    tags: [],
    type: ["Aggro-Control"],
    creatures: ["Maxxor, Protector of Perim", "Najarin, High Muge of the Lake", "Arbeid", "Drabe", "Tarterek, Psi Overloader", "Garv"]
  },
  Rawr: {
    url: "https://chaoticbackup.forumotion.com/t1682-rawr#15201",
    tribe: "Mipedian",
    tags: ["Warbeast"],
    type: ["Control"],
    creatures: ["Enre-hep", "Ailav", "Ranun", "Ixxik", "Xelfe", "Smildon", "Yterio"]
  },
  "Sis Ops": {
    url: "https://chaoticbackup.forumotion.com/t1667-multi-tribe-mash-up",
    tribe: "Mixed",
    tags: [],
    type: ["Combo"],
    creatures: ["Kepiaan, Danian Lieutenant", "Tangath Toborn, OverWorld General", "Aivenna, OverWorld Lieutenant", "Nunk'worn", "Na-inna", "Nivenna, UnderWorld Lieutenant"]
  },
  "Stelgar Compost": {
    url: "https://chaoticbackup.forumotion.com/t1599-hivemind",
    tribe: "Mixed",
    tags: ["Compost"],
    type: ["Control"],
    creatures: ["Elhadd", "Ivelaan", "Makanaz", "Stelgar, Vicious Mutation"]
  },
  "Stelphor (Kraken)": {
    url: "https://chaoticbackup.forumotion.com/t1586-kraken#15168",
    tribe: "Mixed",
    tags: [],
    type: ["Control"],
    creatures: ["Stelgar, Vicious Mutation", "Lomma, Desert Wanderer", "Ifjann", "Kepiaan, Danian Lieutenant", "Phelphor, Of the Deep", "Xelfe", "Tangath Toborn, OverWorld General"]
  },
  Strike: {
    url: "https://chaoticbackup.forumotion.com/t1568-strike",
    tribe: "Mipedian",
    tags: ["Strike", "Prexxor Chasm"],
    type: ["Midrange"],
    creatures: ["Malvadine, The King's Herald", "Headmaster Ankhyja", "Ifjann", "Owayki", "Iflar, The Crown Prince"]
  },
  "Swimming Team": {
    url: "https://chaoticbackup.forumotion.com/t1567-swimming-team",
    tribe: "Mixed",
    tags: [],
    type: ["Midrange"],
    creatures: ["Ulmquad", "Lomma, Desert Wanderer", "Phelphor, Of the Deep", "Tangath Toborn, OverWorld General", "Na-inna"]
  },
  Tartareklessness: {
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
  "UnderWorld Burn": {
    url: "https://chaoticbackup.forumotion.com/t1661-uw-burn#15077",
    tribe: "UnderWorld",
    tags: ["Burn", "Fire"],
    type: ["Aggro"],
    creatures: ["Chaor, The Fierce", "Ulmar, Perithon Racer", "Takinom, The Shadowknight", "Kaal", "Kopond, High Muge of the Hearth", "Nivena"]
  },
  "UnderWorld Discipline Burn": {
    url: "https://chaoticbackup.forumotion.com/t1661-uw-burn#15170",
    tribe: "UnderWorld",
    tags: ["Burn"],
    type: ["Aggro"],
    creatures: ["Chaor", "Rothar, Forceful Negotiator", "Ulmar, Perithon Racer", "Kopond, High Muge of the Hearth"]
  },
  "Ursis Dagger": {
    url: "https://chaoticbackup.forumotion.com/t1670-ursis-dagger#15191",
    tribe: "Mixed",
    tags: ["Tribeless", "Dagger", "Infection"],
    type: ["Aggro-Control"],
    creatures: ["Bladez", "Lomma, Desert Wanderer", "Ursis", "Ragetrod", "Vunhra", "Smildon", "Taffial", "Ajara", "Tangath Toborn, In Training", "Xelfe", "Arkanin"]
  },
  "Ursis D Muge": {
    url: "https://chaoticbackup.forumotion.com/t1670-ursis-dagger#15192",
    tribe: "Mixed",
    tags: ["Tribeless", "Dagger", "Muge"],
    type: ["Aggro"],
    creatures: ["Ursis", "Arkanin", "Ulmar, Perithon Racer", "Lore", "Slufurah"]
  },
  "Wise Guys": {
    url: "https://chaoticbackup.forumotion.com/t1563-wise-guys",
    tribe: "OverWorld",
    tags: ["Prexxor Chasm"],
    type: ["Control"],
    creatures: ["Ikkatosh, The Aich King", "Aivenna", "Drabe", "Garv", "Porthyn", "Tarterek, Psi Overloader", "Lomma, Desert Wanderer"]
  },
};

export const decklist = _decklist as {[key: string]: Deck};
