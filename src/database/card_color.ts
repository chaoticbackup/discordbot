import { Attack, Battlegear, Creature, Location, Mugic } from '../definitions';
import { ColorResolvable } from 'discord.js';

export default function card_color (card: Attack | Battlegear | Creature | Location | Mugic): ColorResolvable {
  switch (card.gsx$type) {
    case 'Attacks':
      { return '#586b81'; }
    case 'Battlegear':
      { return '#aebdce'; }
    case 'Locations':
      { return '#419649'; }
    case 'Creatures':
    case 'Mugic':
      switch ((card as Creature | Mugic).gsx$tribe) {
        case 'OverWorld':
          return '#1994d1';
        case 'UnderWorld':
          return '#ce344e';
        case "M'arrillian":
          return '#717981';
        case 'Mipedian':
          return '#ba9626';
        case 'Danian':
          return '#957167';
        case 'Frozen':
          return '#7aecff';
        case 'Generic':
        case 'Tribeless':
          if (card.gsx$type === 'Creatures')
            return '#b5b5b5';
          else
            return '#4f545c';
        default:
          return '#56687e';
      }
    default:
      return '#56687e'; // Default color
  }
}
