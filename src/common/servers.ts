import { Snowflake, Message, TextChannel, Guild } from 'discord.js';

import { Channel } from '../definitions';

class Server<T extends ServerName> {
  id: Snowflake;
  channels: typeof serverHash[T]['channels'];

  constructor(server: typeof serverHash[T]) {
    this.id = server.id;
    this.channels = server.channels;
  }

  channel = (name: keyof typeof serverHash[T]['channels']) => {
    return this.channels[name];
  };
}

export default function servers<T extends ServerName>(name: T): Server<T> {
  const server = serverHash[name];
  // @ts-ignore this shouldn't be hit unless dev doesn't have linting on
  if (server === undefined) return new Server({ id: '', channels: {} });
  return new Server(server);
}

export function is_server(guild: Guild, name: ServerName): boolean {
  return guild.id === servers(name).id;
}

/**
 * Checks whether a channel is the specified name
 * @param guild Optionally specify which guild this channel should be in (default main)
 */
export function is_channel(message: Message, channel_name: string, guild?: ServerName): boolean;
export function is_channel(channel: Channel, channel_name: string, guild?: ServerName): boolean;
export function is_channel<A extends Message | Channel>(arg1: A, channel_name: string, guild: ServerName = 'main') {
  let channel;
  if (arg1 instanceof Message) {
    if (arg1.channel instanceof TextChannel) {
      ({ channel } = arg1);
    } else {
      return false;
    }
  }
  else if (arg1 instanceof TextChannel) {
    channel = arg1;
  }
  else {
    return false;
  }

  return channel.id === servers(guild).channels[channel_name];
}

const serverHash = {
  main: {
    id: '135657678633566208',
    channels: {
      logs: '708674018349154356',
      admin: '613915559012204545',
      staff: '293610368947716096',
      gen_1: '135657678633566208',
      gen_2: '587376910364049438',
      bot_commands: '387805334657433600',
      learn_to_play: '896784058149896312',
      match_making: '278314121198305281',
      untap_matching: '834153271613587537',
      tts_matching: '834153289553281024',
      spelltable_matching: '871966720947023882',
      ruling_questions: '468785561533153290',
      banlist_discussion: '473975360342458368',
      meta_analysis: '418856983018471435',
      other_games: '286993363175997440',
      perim: '656156361029320704',
      french: '407259697348083717',
      recode: '706962283284398172'
    }
  },
  develop: {
    id: '504052742201933824',
    channels: {
      gen: '504052742201933827',
      errors: '558184649466314752',
      bot_commands: '559935570428559386',
      debug: '712680358939852883'
    }
  },
  trading: {
    id: '617128322593456128',
    channels: {}
  },
  international: {
    id: '624576671630098433',
    channels: {
      bot_commands: '624632794739376129'
    }
  },
  unchained: {
    id: '339031939811901441',
    channels: {
      bot_commands: '392869882863026179'
    }
  }
} as const;

type ServerName = keyof typeof serverHash;

export { serverHash as servers };

/*
I did some cool TS stuff that I want to remember, you're welcome future me
Check the git history of the file too

const serverList = [
  {
    name: 'main',
    id: '135657678633566208',
    channels: {
      gen_1: '135657678633566208',
    }
  }
] as const;

const _servers: Server[] = serverList.map(s => new Server(s));

const _names = serverList.map(s => s.name);

type serverName = typeof _names[number];
*/
