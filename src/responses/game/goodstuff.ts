import { parseTribe, parseType, MugicTribe, CreatureTribe, CardType, generify } from '../../common/card_types';
import commands from '../command_help.json';

import gsjson from './config/goodstuff.json';

type bp = '0' | '1' | '2' | '3' | '4' | '5';

interface GoodStuff {
  Attacks: { [key in bp]: string[] }
  Battlegear: string[]
  Creatures: { [key in CreatureTribe]: string[] }
  Locations: string[]
  Mugic: { [key in MugicTribe]: string[] }
}

const { goodstuff, support } = gsjson as { support: string[], goodstuff: GoodStuff };

function gs(args: string[]) {
  if (args.length === 0 || args[0] === '') {
    return "Due to the length, I can't send all the cards.\nPlease specify a card type/tribe";
  }

  if (args[0].toLowerCase() === 'support') {
    let message = '';
    support.forEach((card) => {
      message += `${card}\n`;
    });
    return message;
  }

  let type = parseType(args[0]);
  if (type === 'Attacks') return Attacks(args[1]);
  else if (type === 'Battlegear') return `**Strong Battlegear:**${Type('Battlegear')}`;
  else if (type === 'Creatures') return 'Please specify a tribe:\n``!good <tribe> creatures``';
  else if (type === 'Locations') return `**Strong Locations:**${Type('Locations')}`;
  else if (type === 'Mugic') return `**Strong Mugic:**${Mugic()}`;
  else {
    let tribe;

    if (args.length > 1) {
      type = parseType(args[1]);
      if (type === 'Creatures') {
        tribe = parseTribe(args[0], type);
      }
      else if (type === 'Mugic') {
        tribe = parseTribe(args[0], type);
      }
    } else {
      tribe = parseTribe(args[0]);
    }

    if (!tribe) {
      return commands.good.cmd;
    }

    return Tribe(tribe, type);
  }
}

export { gs as goodstuff };

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

function Tribe(tribe: CreatureTribe | MugicTribe | 'Mixed', type: CardType | undefined) {
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
