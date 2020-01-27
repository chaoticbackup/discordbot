import { Snowflake } from 'discord.js';

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

    channel (name: string): Snowflake {
      const channel = this.channels[name];
      if (channel) return channel;
      else return '';
    }
}

export default function (name: string): Server {
  const server = servers.find(server => server.name === name);
  if (server === undefined) return new Server({ name: '', id: '', channels: {} });
  return server;
}

const servers: Server[] = [
  new Server({
    name: 'main',
    id: '135657678633566208',
    channels: {
      staff: '293610368947716096',
      gen_1: '135657678633566208',
      bot_commands: '387805334657433600',
      match_making: '278314121198305281',
      ruling_questions: '468785561533153290',
      banlist_discussion: '473975360342458368',
      meta_analysis: '418856983018471435',
      other_games: '286993363175997440',
      perim: '656156361029320704'
    }
  }),
  new Server ({
    name: 'develop',
    id: '504052742201933824',
    channels: {
      gen: '504052742201933827',
      errors: '558184649466314752',
      bot_commands: '559935570428559386'
    }
  }),
  new Server ({
    name: 'trading',
    id: '617128322593456128',
    channels: {}
  }),
  new Server({
    name: 'international',
    id: '624576671630098433',
    channels: {
      bot_commands: '624632794739376129'
    }
  }),
  new Server({
    name: 'unchained',
    id: '339031939811901441',
    channels: {
      bot_commands: '392869882863026179'
    }
  })
];
