import ScanQuestDB, { Server } from '../database';

export function channel(db: ScanQuestDB, server: Server, args: string[]): string | undefined {
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
      return;
    }
    default: {
      return '!perim channels <list | send | recieve>';
    }
  }
}
