/* eslint-disable max-len */

const tiers = ['A', 'B'] as const;

const tribes = ['OverWorld', 'UnderWorld', 'Danian', 'Mipedian', "M'arrillian", 'Mixed'] as const;

// https://en.wikipedia.org/wiki/Magic:_The_Gathering_deck_types#:~:text=The%20traditional%20archetypes%20fit
const types = ['Aggro', 'Control', 'Combo', 'Aggro-Control', 'Gimmick', 'Midrange', 'Meta', 'Prison'] as const;

type Tier = typeof tiers[number];

type DeckType = typeof types[number];

type Tribe = typeof tribes[number];

export function isTier(input: any): input is Tier {
  return tiers.includes(input);
}

export function isType(input: any): input is DeckType {
  return types.includes(input);
}

export const tierlist: Record<Tier, string[]> = {
  A: [
    'Wise Guys',
    'LankerTosh',
    'Swimming Team',
    'Strike',
    'Elementalist',
    'UW Burn',
    "Bodal's Boys",
    'Fliandar',
    'Aszil Compost',
    'UrsisKanin',
    'Aszil Courage',
    'Grantkae Control'
  ],
  B: [
    'Fire and Brimstone',
    'Lyssta Mixed',
    'No Healing',
    'Warbeast',
    'Ursis Dagger',
    'Kraken',
    'Ocean Man',
    'FireFly',
    'Mip Reckless'
  ]
};

interface Deck {
  url: string
  tribe: Tribe
  type: DeckType[]
  tags: string[]
}

export const decklist: Record<string, Deck> = {
  'Aszil Compost': {
    url: 'https://chaoticbackup.forumotion.com/t1580-aszil-compost',
    tribe: 'Danian',
    tags: ['Aszil, the Young Queen', 'Hiadrom', 'Illexia, The Danian Queen', 'Makanaz', 'Compost', 'Earth', 'Courage'],
    type: ['Control']
  },
  'Aszil Courage': {
    url: 'https://chaoticbackup.forumotion.com/t1574-aszil-courage',
    tribe: 'Danian',
    tags: ['Aszil, the Young Queen', 'Illexia, The Danian Queen', 'Odu-Bathax, Reservoir Reclaimer', 'Earth', 'Courage'],
    type: ['Control', 'Combo']
  },
  Arrthoa: {
    url: 'https://chaoticbackup.forumotion.com/t1616-arrthoa',
    tribe: 'OverWorld',
    tags: ['Arrthoa, Captian of the Ezoa', 'Lomma, Desert Wanderer', 'Maxxor, Elemental Champion', 'Rellim, Watermaster', 'Herken', 'Water'],
    type: ['Midrange']
  },
  Warbeast: {
    url: 'https://chaoticbackup.forumotion.com/t1582-blazvatan',
    tribe: 'Mipedian',
    tags: ['Blazvatan', 'Ailav', 'Kileron', 'Warbeast', 'Air', 'Earth'],
    type: ['Midrange']
  },
  'Brathe Yourself': {
    url: 'https://chaoticbackup.forumotion.com/t1598-brathe-yourself',
    tribe: 'Mixed',
    tags: ['Strike', 'Dagger'],
    type: ['Aggro']
  },
  "Bodal's Boys": {
    url: 'https://chaoticbackup.forumotion.com/t1602-bodal-s-boys',
    tribe: 'OverWorld',
    tags: ['Aivenna', "Bodal's Dagger", 'Ikkatosh, The Aich King', 'Garv'],
    type: ['Aggro-Control']
  },
  Burn: {
    url: 'https://chaoticbackup.forumotion.com/t1661-burn#15077',
    tribe: 'UnderWorld',
    tags: ['Burn'],
    type: ['Aggro']
  },
  CrackTheWhep: {
    url: 'https://chaoticbackup.forumotion.com/t1589-crack-the-whep',
    tribe: 'Mixed',
    tags: ['Fire', 'Power', 'Magmon, Engulfed'],
    type: ['Aggro']
  },
  Elementalist: {
    url: 'https://chaoticbackup.forumotion.com/t1570-elementalist-ow-update',
    tribe: 'OverWorld',
    tags: ['Fire', 'Earth', 'Water'],
    type: ['Midrange']
  },
  'Flame On!': {
    url: 'https://chaoticbackup.forumotion.com/t1577-flame-on',
    tribe: 'Mixed',
    tags: ['Fire'],
    type: ['Aggro-Control', 'Combo']
  },
  FireFly: {
    url: 'https://chaoticbackup.forumotion.com/t1585-firefly',
    tribe: "M'arrillian",
    tags: ['Ulmquad', 'Bahrakatan, The Coralsmith'],
    type: ['Aggro-Control']
  },
  'Flying Frogs': {
    url: 'https://chaoticbackup.forumotion.com/t1590-flying-frogs',
    tribe: 'Mixed',
    tags: [],
    type: ['Midrange']
  },
  'Four Arms': {
    url: 'https://chaoticbackup.forumotion.com/t1593-four-arms',
    tribe: 'Mixed',
    tags: [],
    type: ['Combo', 'Midrange']
  },
  Fliandar: {
    url: 'https://chaoticbackup.forumotion.com/t1572-fliandar-mixed',
    tribe: 'Mixed',
    tags: [],
    type: ['Control', 'Combo']
  },
  "Gan'trak Bladez": {
    url: 'https://chaoticbackup.forumotion.com/t1601-gan-trak-update',
    tribe: "M'arrillian",
    tags: [],
    type: ['Aggro']
  },
  GearEater: {
    url: 'https://chaoticbackup.forumotion.com/t1591-ilx-geareater',
    tribe: 'Mixed',
    tags: [],
    type: ['Gimmick']
  },
  Gintanai: {
    url: 'https://chaoticbackup.forumotion.com/t1592-gintanai',
    tribe: 'Mipedian',
    tags: ['Warbeast'],
    type: ['Aggro-Control']
  },
  'Gorram Malvadine': {
    url: 'https://chaoticbackup.forumotion.com/t1583-gorram-malvadine',
    tribe: 'Mixed',
    tags: ['Malvadine', 'Gorram'],
    type: ['Combo', 'Gimmick']
  },
  'Grantkae Control': {
    url: 'https://chaoticbackup.forumotion.com/t1633-grantkae-control',
    tribe: 'Mixed',
    tags: ['Ulmquad'],
    type: ['Aggro-Control']
  },
  Grounded: {
    url: 'https://chaoticbackup.forumotion.com/t1660-grounded#15076',
    tribe: 'UnderWorld',
    tags: [],
    type: ['Aggro-Control']
  },
  'Heard Melody': {
    url: 'https://chaoticbackup.forumotion.com/t1631-heard-melody',
    tribe: 'Mipedian',
    tags: [],
    type: ['Combo']
  },
  HiveMind: {
    url: 'https://chaoticbackup.forumotion.com/t1599-hivemind',
    tribe: 'Danian',
    tags: [],
    type: ['Control']
  },
  'Fire and Brimstone': {
    url: 'https://chaoticbackup.forumotion.com/t1571-hot-air-rises',
    tribe: 'UnderWorld',
    tags: ['Fire', 'Air'],
    type: ['Aggro']
  },
  Khorror: {
    url: 'https://chaoticbackup.forumotion.com/t1588-khorror',
    tribe: 'Mipedian',
    tags: [],
    type: ['Midrange']
  },
  Kraken: {
    url: 'https://chaoticbackup.forumotion.com/t1586-kraken',
    tribe: 'Mixed',
    tags: [],
    type: ['Control']
  },
  LankerTosh: {
    url: 'https://chaoticbackup.forumotion.com/t1565-lanarkiar',
    tribe: 'Mixed',
    tags: ['Lanker', 'Ikkatosh, The Aichking', 'Anarkiar'],
    type: ['Aggro-Control']
  },
  Lankerek: {
    url: 'https://chaoticbackup.forumotion.com/t1569-lankerek',
    tribe: 'Mixed',
    tags: ['Lanker'],
    type: ['Aggro-Control']
  },
  'Lyssta Mixed': {
    url: 'https://chaoticbackup.forumotion.com/t1576-lyssta-mixed',
    tribe: 'Mixed',
    tags: [],
    type: ['Midrange']
  },
  'Mip Reckless': {
    url: 'https://chaoticbackup.forumotion.com/t1596-mipedian-reckless',
    tribe: 'Mipedian',
    tags: ['Enre-hep'],
    type: ['Midrange']
  },
  'Marr Reckless': {
    url: 'https://chaoticbackup.forumotion.com/t1597-marr-reckless',
    tribe: "M'arrillian",
    tags: [],
    type: ['Aggro-Control']
  },
  MaxWreck: {
    url: 'https://chaoticbackup.forumotion.com/t1566-maxwreck',
    tribe: 'OverWorld',
    tags: [],
    type: ['Midrange']
  },
  "Muge's Dagger": {
    url: 'https://chaoticbackup.forumotion.com/t1628-muge-s-dagger-ivan',
    tribe: 'Mixed',
    tags: ['Tribeless'],
    type: ['Aggro-Control', 'Gimmick']
  },
  'No Healing': {
    url: 'https://chaoticbackup.forumotion.com/t1579-no-healing',
    tribe: 'Mixed',
    tags: ['Tribeless'],
    type: ['Midrange']
  },
  'Ocean Man': {
    url: 'https://chaoticbackup.forumotion.com/t1595-ocean-man',
    tribe: 'Mixed',
    tags: [],
    type: ['Midrange']
  },
  Strike: {
    url: 'https://chaoticbackup.forumotion.com/t1568-strike',
    tribe: 'Mipedian',
    tags: ['Strike'],
    type: ['Midrange']
  },
  'Swimming Team': {
    url: 'https://chaoticbackup.forumotion.com/t1567-swimming-team',
    tribe: 'Mixed',
    tags: ['Ulmquad'],
    type: ['Midrange']
  },
  'A Trampling Mammoth': {
    url: 'https://chaoticbackup.forumotion.com/t1658-proboscartosh-a-trampling-mammoth',
    tribe: 'Mixed',
    tags: ['Tribeless', 'Proboscar', 'Lanker', 'Ikkatosh, The Aich King'],
    type: ['Aggro-Control']
  },
  'Ursis Dagger': {
    url: 'https://chaoticbackup.forumotion.com/t1594-ursis-dagger',
    tribe: 'Mixed',
    tags: ['Tribeless', 'Ursis'],
    type: ['Aggro-Control']
  },
  UrsisKanin: {
    url: 'https://chaoticbackup.forumotion.com/t1573-ursiskanin',
    tribe: 'Mixed',
    tags: ['Tribeless', 'Ursis'],
    type: ['Midrange']
  },
  'UW Burn': {
    url: 'https://chaoticbackup.forumotion.com/t1575-uw-burn',
    tribe: 'UnderWorld',
    tags: ['Burn', 'Fire'],
    type: ['Aggro']
  },
  'Wise Guys': {
    url: 'https://chaoticbackup.forumotion.com/t1563-wise-guys',
    tribe: 'OverWorld',
    tags: ['Ikkatosh, The Aich King'],
    type: ['Control']
  },
  '6 Arms': {
    url: 'https://chaoticbackup.forumotion.com/t1581-6-arms',
    tribe: 'Mixed',
    tags: [],
    type: ['Combo']
  }
};
