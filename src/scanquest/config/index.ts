import { Message } from 'discord.js';

import ScanQuest from '..';
import { SendFunction } from '../../definitions';
import { Server } from '../database';

import { channel } from './channel';
import { disable } from './disable';
import help from './help';
import { ignore } from './ignore';

export default async function (this: ScanQuest, message: Message, args: string[], mentions: string[], send: SendFunction) {
  if (args.length > 0) {
    // handled in responses
    if (args[0] === 'protector') return;
    if (args[0] === 'help') {
      return await help(this.db, message, mentions, send);
    }
  }
  if (message.guild && (message.member.hasPermission('ADMINISTRATOR') || message.member.hasPermission('MANAGE_MESSAGES'))) {
    if (args.length === 0) {
      // TODO this is for init a new server
      return await send('Cannot configure a new server at this time');
    }

    const server = await this.db.servers.findOne({ id: message.guild.id });
    if (server === null) {
      return await send('This server is not configured for Perim Scan Quest');
    }

    switch (args[0]) {
      case 'remaining': return await send(remaining(server));
      case 'ignore': return await send(ignore(this.db, server, args.slice(1)));
      case 'channel':
      case 'channels': return await send(channel(this.db, server, args.slice(1)));
      case 'disable': return await disable.call(this, server, true, send);
      case 'enable': return await disable.call(this, server, false, send);
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
