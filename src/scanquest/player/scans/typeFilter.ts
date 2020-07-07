import { CreatureTribe, generify, parseTribe, parseType } from '../../../common/card_types';
import { API } from '../../../database';
import { Creature } from '../../../definitions';
import { toScannable } from '../../scanner';
import Scannable from '../../scanner/Scannable';
import Scanned from '../../scanner/Scanned';

type Filter = (scan: Scanned) => Scannable | undefined;

export function setFilter(content: string): Filter {
  const args = content.toLowerCase().split(' ').slice(1);

  if (args.length > 0) {
    let type = parseType(args[0]);
    if (type === 'Attacks') throw new Error("Attacks aren't collectable");
    else if (type === 'Battlegear') return filterBattlegear;
    else if (type === 'Creatures') {
      if (args.length > 1) {
        return tribeCreatures(parseTribe(args[1], 'Creatures') as CreatureTribe);
      }
      return filterCreature;
    }
    else if (type === 'Locations') return filterLocation;
    else if (type === 'Mugic') throw new Error("Mugic aren't currently collectable");
    else if (args.length > 1) {
      const tribe = parseTribe(args[0]);
      if (tribe !== undefined) {
        type = parseType(args[1]);
        if (type === 'Mugic') throw new Error("Mugic aren't currently collectable");
        if (type === 'Creatures') return tribeCreatures(generify(tribe, 'Creatures'));
      }
      else throw new Error(`${args[0].replace('@', '')} isn't an active tribe`);
    }
  }

  return noFilter;
}

const noFilter: Filter = (scan: Scanned) => toScannable(scan);

const filterBattlegear: Filter = (scan: Scanned) => {
  if (scan.type === 'Battlegear') return toScannable(scan);
};

const filterCreature: Filter = (scan: Scanned) => {
  if (scan.type === 'Creatures') return toScannable(scan);
};

const filterLocation: Filter = (scan: Scanned) => {
  if (scan.type === 'Locations') return toScannable(scan);
};

const tribeCreatures = (tribe: CreatureTribe): Filter => {
  return (scan: Scanned) => {
    if (scan.type === 'Creatures') {
      const card = API.find_cards_by_name(scan.name)[0] as Creature;
      if (parseTribe(card.gsx$tribe) === tribe) return toScannable(scan);
    }
  };
};
