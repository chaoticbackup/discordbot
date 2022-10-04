import { Snowflake, Message, Client, TextChannel } from 'discord.js';

import { msgCatch } from '../common';
import servers from '../common/servers';

interface Store {
  link: string
  ids: Array<{
    channel: Snowflake
    message: Snowflake
  }>
}

const linkMessages = new Map<Snowflake, Store>();

const notifyStaff = async (bot: Client, message: Message, msg?: string) => {
  const channel = bot.channels.get(servers('main').channel('staff')) as TextChannel;
  const content = (msg ?? message.content.replaceAll(/@(here|everyone)/g, '$1'));
  await channel.send(`Kicked suspected spam: ${message.member.displayName}\nContent: ||${content}||`);
};

const link_regex = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?/g;
export function checkSpam(bot: Client, msg: Message): Boolean {
  if (/@(here|everyone)/.test(msg.content) && link_regex.test(msg.content)) {
    if (msg.member.kickable) {
      msg.member.kick('Spammed same link. Typically spam bot behavior.')
      .then(async () => await notifyStaff(bot, msg))
      .then(async () => {
        if (msg.deletable) await msg.delete();
      })
      .catch(msgCatch);
    }
    return true;
  }

  if (msg.content.includes('chaoticrecode') || !link_regex.test(msg.content)) {
    if (linkMessages.has(msg.author.id)) {
      const { ids, link } = linkMessages.get(msg.author.id)!;
      if (ids.length > 1) {
        ids.pop();
        linkMessages.set(msg.author.id, { ids, link });
      }
      else {
        linkMessages.delete(msg.author.id);
      }
    }
    return false;
  }

  const new_link = msg.content.match(link_regex)![0];
  if (linkMessages.has(msg.author.id)) {
    const { link, ids } = linkMessages.get(msg.author.id)!;
    if (new_link.localeCompare(link) === 0) {
      ids.push({
        channel: msg.channel.id,
        message: msg.id
      });
      if (ids.length >= 3) {
        if (msg.member.kickable) {
          msg.member.kick('Spammed same link. Typically spam bot behavior.')
          .then(async () => await notifyStaff(bot, msg))
          .then(async () => {
            for (const { channel, message } of ids) {
              await (bot.channels.get(channel) as TextChannel).fetchMessage(message)
              .then(async (v) => {
                if (v.deletable) await v.delete();
              });
            }
          })
          .catch(msgCatch);
        }
      }
      else {
        linkMessages.set(msg.author.id, { link, ids });
      }
    }
    else {
      setNewLink(msg, new_link);
    }
  }
  else {
    setNewLink(msg, new_link);
  }

  return true;
}

function setNewLink(msg: Message, link: string) {
  linkMessages.set(msg.author.id, {
    link,
    ids: [{
      channel: msg.channel.id,
      message: msg.id
    }]
  });
}
