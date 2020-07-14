import { parseTribe, parseType, MugicTribe, CreatureTribe, CardType, generify } from '../../common/card_types';

const { agame, goodstuff } = require('./config/goodstuff.json') as { agame: string[], goodstuff: GoodStuff };

type bp = '0' | '1' | '2' | '3' | '4' | '5';

interface GoodStuff {
  Attacks: {[key in bp]: string[] }
  Battlegear: string[]
  Creatures: {[key in CreatureTribe]: string[] }
  Locations: string[]
  Mugic: {[key in MugicTribe]: string[] }
}

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

  const type = parseType(args[0]);
  if (type === 'Attacks') return Attacks(args[1]);
  else if (type === 'Battlegear') return `**Strong Battlegear:**${Type('Battlegear')}`;
  else if (type === 'Creatures') return 'Please specify a tribe:\n``!good <tribe> creatures``';
  else if (type === 'Locations') return `**Strong Locations:**${Type('Locations')}`;
  else if (type === 'Mugic') return `**Strong Mugic:**${Mugic()}`;
  else {
    const tribe = parseTribe(args[0]);
    if (!tribe) { /* */ }
    else if (args.length > 1) {
      return Tribe(tribe, parseType(args[1]));
    }
    else if (tribe === 'Tribeless') {
      let message = '**Strong Tribeless Creatures:**';
      goodstuff.Creatures.Tribeless.forEach((card: string) => {
        message += `\n${card}`;
      });
      return message;
    }
    else if (tribe === 'Generic') {
      let message = '**Strong Generic Mugic:**';
      goodstuff.Mugic.Generic.forEach((card: string) => {
        message += `\n${card}`;
      });
      return message;
    }
  }
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

function Tribe(tribe: CreatureTribe | MugicTribe, type: CardType | undefined) {
  let msg = '';
  // If specified mugic or creatures
  if (type) {
    if (type === 'Creatures') {
      msg = `**Strong ${generify(tribe, type)} ${type}**`;
      goodstuff[type][generify(tribe, type)].forEach((card: string) => {
        msg += `\n${card}`;
      });
    }
    else if (type === 'Mugic') {
      msg = `**Strong ${generify(tribe, type)} ${type}**`;
      goodstuff[type][generify(tribe, type)].forEach((card: string) => {
        msg += `\n${card}`;
      });
    }
    else {
      msg = `!good ${generify(tribe, 'Creatures')} Creatures\n` +
        `!good ${generify(tribe, 'Mugic')} Mugic`;
    }
  }
  else {
    msg = `**Strong ${tribe} Cards:**`;
    [...goodstuff.Mugic[generify(tribe, 'Mugic')], ...goodstuff.Creatures[generify(tribe, 'Creatures')]]
    .sort((a, b) => a.localeCompare(b))
    .forEach((card) => {
      msg += `\n${card}`;
    });
  }
  return msg;
}
