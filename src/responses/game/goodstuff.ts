type tribes = 'Danian' | 'Mipedian' | 'M\'arrillian' | 'OverWorld' | 'UnderWorld' | 'Generic';
type bp = '0' | '1' | '2' | '3' | '4' | '5';

interface GoodStuff {
  Attacks: {[key in bp]: string[] }
  Battlegear: string[]
  Creatures: {[key in tribes]: string[] }
  Locations: string[]
  Mugic: {[key in tribes]: string[] }
}
const { agame, goodstuff } = require('../config/goodstuff.json') as { agame: string[], goodstuff: GoodStuff };

export { fs as funstuff, gs as goodstuff };

function fs() {
  let message = '';
  agame.sort((a, b) => a.localeCompare(b))
  .forEach((card) => {
    message += `${card}\n`;
  });
  return message;
}

function gs(args: string[]) {
  if (args.length === 0 || args[0] === '') {
    return "Due to the length, I can't send all the cards.\nPlease specify a card type/tribe";
  }

  let message = '';

  switch (args[0].toLowerCase()) {
    case 'creature':
    case 'creatures':
      return 'Please specify a tribe:\n``!good <tribe> creatures``';
    case 'mugic':
      return `**Strong Mugic:**${Mugic()}`;
    case 'attack':
    case 'attacks':
      return Attacks(args[1]);
    case 'battlegear':
      return `**Strong Battlegear:**${Type('Battlegear')}`;
    case 'location':
    case 'locations':
      return `**Strong Locations:**${Type('Locations')}`;
    case 'danian':
    case 'danians':
      return Tribe('Danian', args[1]);
    case 'marrillian':
    case 'marrillians':
    case 'm\'arrillian':
    case 'm\'arrillians':
      return Tribe("M'arrillian", args[1]);
    case 'mipedian':
    case 'mipedians':
      return Tribe('Mipedian', args[1]);
    case 'overworld':
    case 'overworlders':
      return Tribe('OverWorld', args[1]);
    case 'underworld':
    case 'underworlders':
      return Tribe('UnderWorld', args[1]);
    case 'tribeless':
      message = '**Strong Tribeless Creatures:**';
      goodstuff.Creatures.Generic.forEach((card: string) => {
        message += `\n${card}`;
      });
      break;
    case 'generic':
      message = '**Strong Generic Mugic:**';
      goodstuff.Mugic.Generic.forEach((card: string) => {
        message += `\n${card}`;
      });
      break;
  }

  return message;
}

function Mugic() {
  let msg = '';
  const ar: string[] = [];
  ar.concat(goodstuff.Mugic.Danian, goodstuff.Mugic["M'arrillian"],
    goodstuff.Mugic.Mipedian, goodstuff.Mugic.OverWorld,
    goodstuff.Mugic.UnderWorld, goodstuff.Mugic.Generic)
  .sort((a, b) => a.localeCompare(b))
  .forEach((card) => {
    msg += `\n${card}`;
  });
  return msg;
}

function Attacks(bp: string): string {
  let msg = `**Strong ${bp} BP Attacks:**`;
  if (bp && +bp >= 0 && +bp <= 5) {
    goodstuff.Attacks[bp as bp].forEach((card: string) => {
      msg += `\n${card}`;
    });
  }
  else return '!good Attacks <build point>';
  return msg;
}

function Type(type: 'Battlegear' | 'Locations') {
  let msg = '';
  goodstuff[type].forEach((card: string) => {
    msg += `\n${card}`;
  });
  return msg;
}

function Tribe(tribe: tribes, type: string) {
  let msg = '';
  // If specified mugic or creatures
  if (type) {
    if (type.toLowerCase() === 'creatures') {
      msg = `**Strong ${tribe} Creatures**`;
      goodstuff.Creatures[tribe].forEach((card: string) => {
        msg += `\n${card}`;
      });
    }
    else if (type.toLowerCase() === 'mugic') {
      msg = `**Strong ${tribe} Mugic**`;
      goodstuff.Mugic[tribe].forEach((card: string) => {
        msg += `\n${card}`;
      });
    }
    else {
      msg = `!good ${tribe} Creatures\n!good ${tribe} Mugic`;
    }
  }
  else {
    msg = `**Strong ${tribe} Cards:**`;
    [...goodstuff.Mugic[tribe], ...goodstuff.Creatures[tribe]]
    .sort((a, b) => a.localeCompare(b))
    .forEach((card) => {
      msg += `\n${card}`;
    });
  }
  return msg;
}
