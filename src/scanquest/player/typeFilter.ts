import { CreatureTribe, generify, parseTribe, parseType, MugicTribe } from '../../common/card_types';
import { API } from '../../database';
import { Creature, Mugic } from '../../definitions';
import { toScannable } from '../scan_type/toScannable';
import { Scannable } from '../scan_type/Scannable';
import { Scanned } from '../scan_type/Scanned';
import { stripMention } from '../../common';

type Filter = (scan: Scanned) => Scannable | undefined;

export function setFilter(content: string): Filter {
  const args = content.toLowerCase().split(' ').slice(1);

  if (args.length > 0) {
    let type = parseType(args[0]);
    if (type === 'Attacks') throw new Error("Attacks aren't collectable");
    else if (type === 'Battlegear') {
      return filterBattlegear;
    }
    else if (type === 'Creatures') {
      if (args.length > 1) {
        const tribe = parseTribe(args[1], 'Creatures');
        if (tribe !== undefined) {
          return tribeCreaturesFilter(tribe);
        }
      }
      return filterCreature;
    }
    else if (type === 'Locations') {
      return filterLocation;
    }
    else if (type === 'Mugic') {
      if (args.length > 1) {
        const tribe = parseTribe(args[1], 'Mugic');
        if (tribe !== undefined) {
          return tribeMugicFilter(tribe);
        }
      }
      return filterMugic;
    }
    else {
      const tribe = parseTribe(args[0]);
      if (tribe !== undefined) {
        if (args.length > 1) {
          type = parseType(args[1]);
          if (type === 'Mugic') return tribeMugicFilter(generify(tribe, 'Mugic'));
          if (type === 'Creatures') return tribeCreaturesFilter(generify(tribe, 'Creatures'));
        }
        return tribeFilter(tribe);
      }
      else throw new Error(`${stripMention(args[0])} isn't an active tribe`);
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

const filterMugic: Filter = (scan: Scanned) => {
  if (scan.type === 'Mugic') return toScannable(scan);
};

const tribeFilter = (tribe: CreatureTribe | MugicTribe | 'Mixed'): Filter => {
  return (scan: Scanned) => {
    const card = API.find_cards_by_name(scan.name)[0] as Creature | Mugic;
    const type = card.gsx$type;
    if (
      (type === 'Creatures' || type === 'Mugic') &&
      /* @ts-ignore */
      parseTribe(card.gsx$tribe, type) === generify(tribe, type)
    ) {
      return toScannable(scan);
    }
  };
};

const tribeCreaturesFilter = (tribe: CreatureTribe): Filter => {
  return (scan: Scanned) => {
    const card = API.find_cards_by_name(scan.name)[0] as Creature;
    if (parseTribe(card.gsx$tribe, 'Creatures') === tribe) return toScannable(scan);
  };
};

const tribeMugicFilter = (tribe: MugicTribe): Filter => {
  return (scan: Scanned) => {
    const card = API.find_cards_by_name(scan.name)[0] as Mugic;
    if (parseTribe(card.gsx$tribe, 'Mugic') === tribe) return toScannable(scan);
  };
};
