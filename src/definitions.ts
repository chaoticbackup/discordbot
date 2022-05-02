import Discord, { RichEmbed, StringResolvable, MessageOptions, Attachment, Message } from 'discord.js';

import { CardType } from './common/card_types';

// export class Channel extends TextBasedChannel(Discord.Channel)
export interface Channel extends Discord.Channel {
  send(content?: StringResolvable, options?: MessageOptions & { split: false } | RichEmbed | Attachment): Promise<Message>
  send(content?: StringResolvable, options?: MessageOptions | RichEmbed | Attachment): Promise<Message | Message[]>
  send(options?: MessageOptions | RichEmbed | Attachment): Promise<Message | Message[]>
}

// This has to be Promise<any> since the expected
export type SendFunction =
  (msg?: StringResolvable, options?: MessageOptions | RichEmbed | Attachment) =>
  Promise<any>; // Message|Message[]|void

export type { CardType };

export interface BaseCard {
  gsx$name: string
  gsx$tags?: string
  gsx$type: CardType
  gsx$set: string
  gsx$rarity: string
  gsx$image: string
  gsx$ability: string
  gsx$flavortext: string
  gsx$splash: string
  gsx$types: string
  gsx$unique: number | string
  gsx$legendary: number | string
  gsx$loyal: number | string
  gsx$alt?: string
  gsx$alt2?: string
  gsx$ic?: string // imgur card
  gsx$if?: string // imgur fullart
}

export interface Attack extends BaseCard {
  gsx$type: 'Attacks'
  gsx$fire: number | string
  gsx$air: number | string
  gsx$earth: number | string
  gsx$water: number | string
  gsx$base: number | string
  gsx$bp: number | string
}

export interface Battlegear extends BaseCard {
  gsx$type: 'Battlegear'
  gsx$subtype: string
}

export interface Creature extends BaseCard {
  gsx$type: 'Creatures'
  gsx$tribe: string
  gsx$courage: string | number
  gsx$power: string | number
  gsx$wisdom: string | number
  gsx$speed: string | number
  gsx$energy: string | number
  gsx$elements: string
  gsx$brainwashed: string
  gsx$mugicability: string | number
  gsx$avatar?: string
  gsx$subtype: string
  gsx$ia?: string // imgur avatar
}

export interface Location extends BaseCard {
  gsx$type: 'Locations'
  gsx$initiative: string
  gsx$subtype: string
}

export interface Mugic extends BaseCard {
  gsx$type: 'Mugic'
  gsx$tribe: string
  gsx$cost: number | string
}

export type Card = Attack | Battlegear | Creature | Location | Mugic;

export type Code = string;

export function isAttack(card: Card): card is Attack {
  return (card.gsx$type === 'Attacks');
}

export function isBattlegear(card: Card): card is Battlegear {
  return (card.gsx$type === 'Battlegear');
}

export function isCreature(card: Card): card is Creature {
  return (card.gsx$type === 'Creatures');
}

export function isLocation(card: Card): card is Location {
  return (card.gsx$type === 'Locations');
}

export function isMugic(card: Card): card is Mugic {
  return (card.gsx$type === 'Mugic');
}
