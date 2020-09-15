import { Message } from 'discord.js';

import { SendFunction } from '../../definitions';
import { Server } from '../database/ScanQuestDB';
import help from './help';
import ScanQuest from '..';
import { ignore } from './ignore';
import { channel } from './channel';

export default async function (this: ScanQuest, message: Message, args: string[], mentions: string[], send: SendFunction) {
  if (args.length > 0) {
    // handled in responses
    if (args[0] === 'protector') return;
    if (args[0] === 'help') {
      return await help(this.db, message, mentions, send);
    }
  }
  if (message.guild && message.member.hasPermission('ADMINISTRATOR')) {
    if (args.length === 0) {
      // todo this is for init a new server
      return await send('Cannot configure a new server at this time');
    }

    const server = this.db.servers.findOne({ id: message.guild.id });
    if (server === null) {
      return await send('This server is not configured for Perim Scan Quest');
    }

    switch (args[0]) {
      case 'remaining': return await send(remaining(server));
      case 'ignore': return await send(ignore(this.db, server, args.slice(1)));
      case 'channel': return await send(channel(this.db, server, args.slice(1)));
      case 'disable': return await send(disable(this, server));
    }
  }
}

function remaining(server: Server) {
  const remaining = server.remaining ? new Date((new Date(server.remaining)).getTime() - (new Date()).getTime()) : null;
  if (remaining !== null && !isNaN(remaining.getTime())) {
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*$/;
    const d = regex.exec(remaining.toJSON()) as RegExpExecArray;
    return `${d[4]}:${d[5]}:${d[6]}`;
  }
  return 'No scan scheduled';
}

function disable(SC: ScanQuest, server: Server) {

}
