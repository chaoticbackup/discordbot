import { Channel as Chan, RichEmbed, StringResolvable, MessageOptions, Attachment, TextBasedChannel } from 'discord.js';
import { CardType } from './common/card_types';

export class Channel extends TextBasedChannel(Chan) {
  // send(msg?: StringResolvable, options?: MessageOptions | RichEmbed | Attachment): Promise<Message|Message[]>
}

export type SendFunction =
  (msg?: StringResolvable, options?: MessageOptions | RichEmbed | Attachment)
  => Promise<any>; // Message|Message[]|void

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
  gsx$ic?: string
  gsx$if?: string
}

export interface Attack extends BaseCard {
  gsx$fire: number | string
  gsx$air: number | string
  gsx$earth: number | string
  gsx$water: number | string
  gsx$base: number | string
  gsx$bp: number | string
}

export interface Battlegear extends BaseCard {
  gsx$subtype: string
}

export interface Creature extends BaseCard {
  gsx$tribe: string
  gsx$courage: string | number
  gsx$power: string | number
  gsx$wisdom: string | number
  gsx$speed: string | number
  gsx$energy: string | number
  gsx$elements: string
  gsx$brainwashed: string
  gsx$mugicability: string | number
  gsx$avatar: string
  gsx$subtype: string
  gsx$ia?: string
}

export interface Location extends BaseCard {
  gsx$initiative: string
  gsx$subtype: string
}

export interface Mugic extends BaseCard {
  gsx$tribe: string
  gsx$cost: number | string
}

export type Card = Attack | Battlegear | Creature | Location | Mugic;

export type Code = string;
