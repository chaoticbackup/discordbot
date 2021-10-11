import { Attack, Battlegear, Creature, Location, Mugic } from '../definitions';
import { ColorResolvable } from 'discord.js';

export default function card_color (card: Attack | Battlegear | Creature | Location | Mugic): ColorResolvable {
  if (card.gsx$type === 'Battlegear')
  { return '#aebdce'; }
  if (card.gsx$type === 'Locations')
  { return '#419649'; }
  if (card.gsx$type === 'Attacks')
  { return '#586b81'; }
  if (card.gsx$type === 'Creatures' || card.gsx$type === 'Mugic') {
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
  }
  return '#56687e'; // Default color
}
