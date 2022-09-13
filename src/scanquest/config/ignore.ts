import { WithId } from 'mongodb';

import ScanQuestDB, { Server } from '../database';

const parse = (sa: string[]) => (sa.map(s => s.match(/<#([0-9]*)>/)?.[1] ?? '')).filter((f): f is string => f !== '');

export async function ignore(db: ScanQuestDB, server: WithId<Server>, args: string[]): Promise<string | undefined> {
  switch (args[0]) {
    case 'list': {
      if (server.ignore_channels.length === 0) {
        return 'This server has no ignored channels';
      }

      let channels = '';
      server.ignore_channels.forEach((channel) => {
        channels += `<#${channel}>\n`;
      });
      return channels;
    }
    case 'add': {
      if (args.length < 2) return;
      const { ignore_channels } = server;
      parse(args.slice(1)).forEach((channel) => {
        if (channel && !server.ignore_channels.includes(channel)) ignore_channels.push(channel);
      });
      const res = await db.servers.updateOne(
        { _id: server._id },
        {
          $set: { ignore_channels }
        }
      );
      if (res.acknowledged) {
        return 'added servers to ignored';
      }
      else {
        return 'failed to add servers to ignored';
      }
    }
    case 'remove': {
      if (args.length < 2) return;
      const channels = parse(args.slice(1));
      const ignore_channels = server.ignore_channels?.filter((channel) => !channels.includes(channel)) ?? [];
      const res = await db.servers.updateOne(
        { _id: server._id },
        {
          $set: { ignore_channels }
        }
      );
      if (res.acknowledged) {
        return 'removed servers from ignored';
      }
      else {
        return 'failed to remove servers from ignored';
      }
    }
    default: {
      return "!perim ignore 'list|add|remove'";
    }
  }
}
