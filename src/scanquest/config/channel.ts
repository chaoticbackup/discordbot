import { WithId } from 'mongodb';

import ScanQuestDB, { Server } from '../database';

export async function channel(db: ScanQuestDB, server: WithId<Server>, args: string[]): Promise<string | undefined> {
  switch (args[0]) {
    case 'list': {
      return `send: <#${server.send_channel}>\nreceive: <#${server.receive_channel}>`;
    }
    case 'send': {
      if (args.length < 2) return;
      const channel = args.slice(1).join(' ').match(/<#([0-9]*)>/)?.[1] ?? '';
      if (channel !== '') {
        await db.servers.updateOne(
          { _id: server._id },
          {
            $set: { send_channel: channel }
          }
        );
      }
      return;
    }
    case 'receive': {
      if (args.length < 2) return;
      const channel = args.slice(1).join(' ').match(/<#([0-9]*)>/)?.[1] ?? '';
      if (channel !== '') {
        await db.servers.updateOne(
          { _id: server._id },
          {
            $set: { receive_channel: channel }
          }
        );
      }
      return;
    }
    default: {
      return "!perim channels 'list|send|recieve'";
    }
  }
}
