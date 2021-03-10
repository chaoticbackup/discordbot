import { Snowflake, Message, TextChannel } from 'discord.js';
import { Channel } from '../definitions';

class Server {
  name: string;
  id: string;
  channels: Record<string, Snowflake>;

  constructor(
    { name, id, channels }: {name: string, id: string, channels: Record<string, Snowflake>})
  {
    this.name = name;
    this.id = id;
    this.channels = channels;
  }

  channel(name: string): Snowflake {
    const channel = this.channels[name];
    if (channel) return channel;
    else return '';
  }
}

export default function servers(name: serverName): Server {
  const server = _servers.find(server => server.name === name);
  if (server === undefined) return new Server({ name: '', id: '', channels: {} });
  return server;
}

/**
 * Checks whether a channel is the specified name
 * @param guild Optionally specify which guild this channel should be in (default main)
 */
export function is_channel(message: Message, name: string): boolean;
export function is_channel(channel: Channel, name: string, guild?: serverName): boolean;
export function is_channel<A extends Message | Channel>(arg1: A, name: string, guild?: serverName) {
  if (arg1 instanceof Message) {
    const { channel } = arg1;
    if (channel instanceof TextChannel) {
      return (channel.name === name);
    }
    return false;
  }
  else if (arg1 instanceof TextChannel) {
    const channel = arg1;
    if (!guild) guild = 'main';
    const server = servers(guild);
    if (Object.keys(server.channels).length === 0) return false;
    return channel.id === server.channel(name);
  }

  return false;
}

const serverList = [
  {
    name: 'main',
    id: '135657678633566208',
    channels: {
      staff: '293610368947716096',
      gen_1: '135657678633566208',
      gen_2: '587376910364049438',
      bot_commands: '387805334657433600',
      match_making: '278314121198305281',
      ruling_questions: '468785561533153290',
      banlist_discussion: '473975360342458368',
      meta_analysis: '418856983018471435',
      other_games: '286993363175997440',
      perim: '656156361029320704',
      french: '407259697348083717',
      recode: '706962283284398172',
      dev: '509822128342958083'
    }
  },
  {
    name: 'develop',
    id: '504052742201933824',
    channels: {
      gen: '504052742201933827',
      errors: '558184649466314752',
      bot_commands: '559935570428559386',
      debug: '712680358939852883'
    }
  },
  {
    name: 'trading',
    id: '617128322593456128',
    channels: {}
  },
  {
    name: 'international',
    id: '624576671630098433',
    channels: {
      bot_commands: '624632794739376129'
    }
  },
  {
    name: 'unchained',
    id: '339031939811901441',
    channels: {
      bot_commands: '392869882863026179'
    }
  }
] as const;

const _servers: Server[] = serverList.map(s => new Server(s));

const _names = serverList.map(s => s.name);

type serverName = typeof _names[number];
