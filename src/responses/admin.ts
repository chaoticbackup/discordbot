import { Guild, Message, DMChannel } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';
import logger from '../logger';

import { isUser } from '../common/users';
import { API } from '../database';
import { isModerator, hasPermission, msgCatch } from '../common';
import servers from '../common/servers';

export async function rm(message: Message, guild?: Guild): Promise<void> {
  if (message.channel instanceof DMChannel) {
    return await message.channel.fetchMessages({ limit: 20 })
      .then(async messages => {
        const msg = messages.find((msg) => isUser(msg, 'me'));
        if (msg) await msg.delete().catch(() => {});
      });
  }
  if (!hasPermission(guild, 'MANAGE_MESSAGES')) return;
  return await message.channel.fetchMessages({ limit: 10 })
    .then(async messages => {
      const msg = messages.find((msg) => isUser(msg, 'me'));
      if (msg) await message.channel.bulkDelete([msg, message]);
    });
}

export async function clear(amount: number, message: Message, mentions: string[] = []): Promise<void> {
  if ((isModerator(message.member) && hasPermission(message.guild, 'MANAGE_MESSAGES'))) {
    if (amount <= 25) {
      if (mentions.length > 0) {
        return await message.channel.fetchMessages()
        .then(async messages => {
          const b_messages = messages.filter(m => mentions.includes(m.author.id));
          if (b_messages.size > 0) {
            await message.channel.bulkDelete(b_messages);
          }
          await message.delete();
        });
      }
      else {
        await message.channel.bulkDelete(amount + 1).catch(() => {});
      }
    }
    else {
      // only delete the clear command
      await message.channel.send('Enter a number less than 20');
      await message.delete();
    }
  }
}

export async function haxxor(message: Message): Promise<void> {
  if (isUser(message, ['daddy', 'bf'])
      || (message.guild?.id === servers('main').id && isModerator(message.member))
  ) {
    await message.channel.send('Resetting...');
    API.rebuild()
      .then(async () => {
        process.emit('SIGINT', 'SIGINT');
      })
      .catch((err) => {
        logger.error(err.message);
      });
  }
}

const home_path = path.resolve(__dirname, '..', '..');

export function logs() {
  try {
    let text = fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '');
    if (text.length > 2000) {
      return text.slice(-2000);
    }

    if (fs.existsSync(path.resolve(home_path, 'out.old.log'))) {
      text =
        `${fs.readFileSync(path.resolve(home_path, 'out.old.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '')}`
        + '==New Log==\n'
        + `${text}`;
      if (text.length > 2000) {
        return text.slice(-2000);
      }
    }

    return text;
  }
  catch (e) {
    msgCatch(e);
  }
}
