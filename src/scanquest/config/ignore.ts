import ScanQuestDB, { Server } from '../database';

const parse = (sa: string[]) => (sa.map(s => s.match(/<#([0-9]*)>/)?.[1] ?? '')).filter((f): f is string => f !== '');

export function ignore(db: ScanQuestDB, server: Server, args: string[]): string | undefined {
  switch (args[0]) {
    case 'list': {
      let channels = '';
      server.ignore_channels.forEach((channel) => {
        channels += `<#${channel}>\n`;
      });
      return channels;
    }
    case 'add': {
      if (args.length < 2) return;
      const channels = parse(args.slice(1));
      channels.forEach((channel) => {
        if (channel && !server.ignore_channels.includes(channel)) server.ignore_channels.push(channel);
      });
      db.servers.update(server);
      return;
    }
    case 'remove': {
      if (args.length < 2) return;
      const channels = parse(args.slice(1));
      server.ignore_channels = server.ignore_channels?.filter((channel) => !channels.includes(channel)) ?? [];
      db.servers.update(server);
    }
  }
}
