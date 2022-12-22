import { Guild, Message, DMChannel, Client, TextChannel, Collection, RichEmbed, Snowflake } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

import { isModerator, hasPermission, msgCatch } from '../common';
import servers, { is_server } from '../common/servers';
import { isUser } from '../common/users';
import { API } from '../database';
import logger from '../logger';

export async function rm(message: Message, guild?: Guild): Promise<void> {
  if (message.channel instanceof DMChannel) {
    return await message.channel.fetchMessages({ limit: 20 })
      .then(async messages => {
        const msg = messages.find((msg) => isUser(msg, 'me'));
        if (msg) await msg.delete().catch(() => {});
      });
  }

  return await message.channel.fetchMessages({ limit: 10 })
    .then(async messages => {
      const msg = messages.find((msg) => isUser(msg, 'me'));
      if (msg) {
        if (!hasPermission(guild, 'MANAGE_MESSAGES')) {
          if (msg.deletable) await msg.delete();
        }
        else {
          await message.channel.bulkDelete([msg, message]);
        }
      }
    });
}

function trimLength(content: string) {
  return content.length > 2000 ? `${content.substring(0, 2000 - 3)}...` : content;
}

async function log(bot: Client, message: Message, messageHash: Collection<Snowflake, Message>) {
  if (is_server(message.guild, 'main')) {
    const { member, channel } = message;

    const messages = messageHash.array().sort((x, y) => x.createdTimestamp - y.createdTimestamp);

    for (const deleted of messages) {
      if (deleted.id === message.id) continue;

      const embed = new RichEmbed()
        .setAuthor(`#${member.user.tag}`, member.user.avatarURL)
        .setColor('#ff4711')
        .setTitle('Bulk Delete')
        .setDescription(
          trimLength(`**Sent by <@${deleted.author.id}> in <#${channel.id}>**\n${deleted.content}`)
        );

      await (bot.channels.get(servers('main').channel('logs')) as TextChannel)
        .send(embed)
        .catch(() => {});
    }
  }
}

export async function clear(bot: Client, amount: number, message: Message, mentions: string[] = []): Promise<void> {
  if (isNaN(amount) || amount <= 0) return;

  if (message.channel instanceof DMChannel) {
    return await message.channel.fetchMessages()
    .then(async messages => {
      const b_messages = messages.filter(m => isUser(m, 'me')).first(amount);
      for (const m of b_messages) {
        if (m.deletable) await m.delete();
      }
    });
  }

  if ((isModerator(message.member) && hasPermission(message.guild, 'MANAGE_MESSAGES'))) {
    if (amount <= 25) {
      if (mentions.length > 0) {
        return await message.channel.fetchMessages()
        .then(async (messages) => {
          const b_messages = messages.filter(m => mentions.includes(m.author.id)).first(amount);
          b_messages.push(message);

          await message.channel.bulkDelete(b_messages)
          .then(async (value) => await log(bot, message, value))
          .catch(() => {});
        });
      }
      else {
        await message.channel.bulkDelete(amount + 1)
        .then(async (value) => await log(bot, message, value))
        .catch(() => {});
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
  if (isUser(message, ['daddy', 'bf', 'ferric'])
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

export async function talk(bot: Client, message: Message, text: string, opts: string[]) {
  const options = opts.join(' ').toLowerCase();
  if (isUser(message, ['daddy'])) {
    const channel_id = (/channel=([0-9]{2,})/).exec(options);
    const message_id = (/message=([0-9]{2,})/).exec(options);
    if (channel_id && channel_id.length > 0) {
      const chan = (bot.channels.get(channel_id[1]) as TextChannel);

      if (message_id && message_id.length > 0) {
        const msg = await chan.fetchMessage(message_id[1]);
        if (msg.editable) {
          msg.edit(text)
          .catch(logger.error);
        }
      }
      else {
        chan.send(text)
        .catch(logger.error);
      }
    }
  }
}
