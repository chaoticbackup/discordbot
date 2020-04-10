import ScanQuestDB, { Server } from '.';

export default function (db: ScanQuestDB, id: string, args: string[]): string | undefined {
  if (args.length === 0) {
    // todo this is for init a new server
    return 'Cannot configure a new server at this time';
  }

  const server = db.servers.findOne({ id: id });
  if (server === null) {
    return 'This server is not configured for Perim Scan Quest';
  }

  switch (args[0]) {
    case 'ignore': return ignore(db, server, args.slice(1));
    case 'channel': return channel(db, server, args.slice(1));
  }
}

const parse = (sa: string[]) => (sa.map(s => s.match(/<#([0-9]*)>/)?.[1] ?? '')).filter((f): f is string => f !== '');

function channel(db: ScanQuestDB, server: Server, args: string[]): string | undefined {
  switch (args[0]) {
    case 'list': {
      return `send: <#${server.send_channel}>\nreceive: <#${server.receive_channel}>`;
    }
    case 'send': {
      if (args.length < 2) return;
      const channel = args.slice(1).join(' ').match(/<#([0-9]*)>/)?.[1] ?? '';
      if (channel !== '') {
        server.send_channel = channel;
        db.servers.update(server);
      }
      return;
    }
    case 'receive': {
      if (args.length < 2) return;
      const channel = args.slice(1).join(' ').match(/<#([0-9]*)>/)?.[1] ?? '';
      if (channel !== '') {
        server.receive_channel = channel;
        db.servers.update(server);
      }
    }
  }
}

function ignore(db: ScanQuestDB, server: Server, args: string[]): string | undefined {
  switch (args[0]) {
    case 'list': {
      let channels = '';
      server.ignore_channels.forEach((channel) => {
        channels += `<#${channel}>\n`;
      })
      return channels;
    }
    case 'add': {
      if (args.length < 2) return;
      const channels = parse(args.slice(1));
      channels.forEach((channel) => {
        if (channel && !server.ignore_channels.includes(channel)) server.ignore_channels.push(channel);
      })
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