import { stripMention } from '../../common';
import { CreatureTribe, generify, parseTribe, parseType, MugicTribe } from '../../common/card_types';
import { API } from '../../database';
import { Card, Creature, Mugic } from '../../definitions';
import { Scannable } from '../scan_type/Scannable';
import { Scanned } from '../scan_type/Scanned';
import { toScannable } from '../scan_type/toScannable';

export type Filter = (scan: Scanned) => Scannable | undefined;

export default function createFilter(text: string): Filter {
  const args = text.toLowerCase().split(' ').filter(i => i);

  if (args.length === 0) {
    return noFilter;
  }

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
  }

  const cards = API.find_cards_ignore_comma(text);
  if (cards.length > 0) {
    return filterName(cards);
  }
  else throw new Error(`${stripMention(text)} isn't a valid type, available tribe, or card name`);
}

const filterName: (cards: Card[]) => Filter = (cards: Card[]) => {
  return (scan: Scanned) => {
    if (cards.find(c => c.gsx$name === scan.name)) {
      return toScannable(scan);
    }
  };
};

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
    const { type } = scan;
    if (type === 'Creatures' || type === 'Mugic') {
      const card = API.find_cards_ignore_comma(scan.name)[0] as Creature | Mugic;

      if (!card) throw new Error(`${scan.name} is not a card`);
      /* @ts-ignore */
      if (card && parseTribe(card.gsx$tribe, type) === generify(tribe, type))
        return toScannable(scan);
    }
  };
};

const tribeCreaturesFilter = (tribe: CreatureTribe): Filter => {
  return (scan: Scanned) => {
    if (scan.type === 'Creatures') {
      const card = API.find_cards_ignore_comma(scan.name)[0] as Creature;
      if (parseTribe(card.gsx$tribe, 'Creatures') === tribe) return toScannable(scan);
    }
  };
};

const tribeMugicFilter = (tribe: MugicTribe): Filter => {
  return (scan: Scanned) => {
    if (scan.type === 'Mugic') {
      const card = API.find_cards_ignore_comma(scan.name)[0] as Mugic;
      if (parseTribe(card.gsx$tribe, 'Mugic') === tribe) return toScannable(scan);
    }
  };
};
