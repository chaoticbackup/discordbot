import { Guild, Message, DMChannel } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';
import logger from '../logger';

import users from '../common/users';
import { API } from '../database';
import { isModerator, hasPermission } from '../common';
import servers from '../common/servers';
import { debug } from 'console';

export async function rm(message: Message, guild?: Guild): Promise<void> {
  if (message.channel instanceof DMChannel) {
    return await message.channel.fetchMessages({ limit: 20 })
      .then(async messages => {
        const msg = messages.find((msg) => msg.author.id === users('me'));
        if (msg) await msg.delete();
      });
  }
  if (!hasPermission(guild, 'MANAGE_MESSAGES')) return;
  return await message.channel.fetchMessages({ limit: 10 })
    .then(async messages => {
      const msg = messages.find((msg) => msg.author.id === users('me'));
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
        await message.channel.bulkDelete(amount + 1).catch();
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
  if ((message.member?.id === users('daddy') || message.member?.id === users('bf'))
      || (message.guild?.id === servers('main').id && isModerator(message.member))
  ) {
    await message.channel.send('Resetting...');
    API.rebuild()
      .then(async () => {
        process.emit('SIGINT', 'SIGINT');
      })
      .catch((err) => {
        debug(err.message, 'errors');
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
      text = '==New Log==\n'
        + `${text}`
        + '==Old Log==\n'
        + `${fs.readFileSync(path.resolve(home_path, 'out.log'), { encoding: 'utf8' }).toString().replace(/\\[3[29]m/g, '')}`;
      if (text.length > 2000) {
        return text.slice(0, 2000);
      }
    }

    return text;
  }
  catch (e) {
    logger.error(e);
  }
}
