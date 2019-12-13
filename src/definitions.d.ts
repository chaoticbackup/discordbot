import Discord, {RichEmbed, StringResolvable, MessageOptions, Attachment} from 'discord.js';

export interface Channel extends Discord.Channel {
    send(arg0: string | RichEmbed, arg1?:any): Promise<any>;
}
  
export interface SendFunction extends Function {
  (msg: StringResolvable, options?: MessageOptions | RichEmbed | Attachment): Promise<any>
}

interface BaseCard {
  gsx$name: string;
  gsx$tags?: string;
  gsx$type: "Attacks" | "Battlegear" | "Creatures" | "Locations" | "Mugic";
  gsx$set: string;
  gsx$rarity: string;
  gsx$image: string;
  gsx$ability: string;
  gsx$flavortext: string;
  gsx$splash: string;
  gsx$types: string;
  gsx$unique: number | string;
  gsx$legendary: number | string;
  gsx$loyal: number | string;
}

export type Card = Attack & Battlegear & Creature & Location & Mugic;

export interface Attack extends BaseCard {
  gsx$fire: number | string;
  gsx$air: number | string;
  gsx$earth: number | string;
  gsx$water: number | string;
  gsx$base: number | string;
  gsx$bp: number | string;
}

export interface Battlegear extends BaseCard {}

export interface Creature extends BaseCard {
  gsx$tribe: string;
  gsx$courage: string | number;
  gsx$power: string | number;
  gsx$wisdom: string | number;
  gsx$speed: string | number;
  gsx$energy: string | number;
  gsx$elements: string;
  gsx$brainwashed: string;
  gsx$mugicability: string | number;
  gsx$avatar: string;
}

export interface Location extends BaseCard {
  gsx$initiative: string;
}

export interface Mugic extends BaseCard {
  gsx$tribe: string;
  gsx$cost: number | string;
}


