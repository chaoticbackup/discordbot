import { Snowflake, Message, GuildMember } from 'discord.js';
import { donate } from '../../common';
import help from './help';
import ScanQuestDB, { Server } from '.';
import { SendFunction } from '../../definitions';

export default async function (db: ScanQuestDB, message: Message, args: string[], mentions: string[], send: SendFunction) {
  if (args.length > 0) {
    // handled in responses
    if (args[0] === 'protector') return;
    if (args[0] === 'help') {
      if (message.guild) {
        let guildMember: GuildMember;

        if (mentions.length > 0) {
          guildMember = await message.guild.fetchMember(mentions[0]).then((m) => m);
        }
        else {
          if (db.is_receive_channel(message.guild.id, message.channel.id)) {
            return await send(help());
          }
          guildMember = (message.member)
            ? message.member
            : await message.guild.fetchMember(message.author).then((m) => m);
        }

        return guildMember.send(help())
          .then(async () => { await guildMember.send(donate()); })
          // if can't dm, send to channel
          .catch(async () => { await send(help()); });
      }
      return await send(help())
        .then(async () => { await send(donate()); });
    }
  }
  if (message.guild && message.member.hasPermission('ADMINISTRATOR')) {
    return await send(config(db, message.guild.id, args));
  }
}

function config(db: ScanQuestDB, id: Snowflake, args: string[]): string | undefined {
  if (args.length === 0) {
    // todo this is for init a new server
    return 'Cannot configure a new server at this time';
  }

  const server = db.servers.findOne({ id: id });
  if (server === null) {
    return 'This server is not configured for Perim Scan Quest';
  }

  switch (args[0]) {
    case 'remaining': return remaining(server);
    case 'ignore': return ignore(db, server, args.slice(1));
    case 'channel': return channel(db, server, args.slice(1));
  }
}

const parse = (sa: string[]) => (sa.map(s => s.match(/<#([0-9]*)>/)?.[1] ?? '')).filter((f): f is string => f !== '');

function remaining(server: Server) {
  const remaining = server.remaining ? new Date((new Date(server.remaining)).getTime() - (new Date()).getTime()) : null;
  if (remaining !== null && !isNaN(remaining.getTime())) {
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*$/;
    const d = regex.exec(remaining.toJSON()) as RegExpExecArray;
    return `${d[4]}:${d[5]}:${d[6]}`;
  }
  return 'No scan scheduled';
}

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
