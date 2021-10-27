import { GuildMember, Snowflake, Message, Client, TextChannel } from "discord.js";
import servers from './common/servers';

interface Store {
  link: string
  ids: {
    channel: Snowflake
    message: Snowflake
  }[]
}

const newMembers: Snowflake[] = [];
const linkMessages = new Map<Snowflake, Store>();

const name_regex = new RegExp('(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)', 'i');
export function checkNewMember(member: GuildMember) {
  if (name_regex.test(member.displayName)) {
    if (member.bannable) { member.ban({ reason: 'No url in username' }).then(() => {
      // Delete the meebot welcome message
      const meebot = member.guild.members.get('159985870458322944');
      if (meebot) { setTimeout(() => {
        if (meebot.lastMessage?.deletable) {
          meebot.lastMessage.delete();
        }
      }, 500); }
    }); }
  }
  else {
    newMembers.push(member.id);
  }
}

const link_regex = new RegExp(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/);
export function checkSpam (bot: Client, msg: Message): Boolean {
  if (!msg.guild || msg.guild.id !== servers('main').id) return false;

  const index = newMembers.indexOf(msg.author.id);

  if (msg.content.includes('chaoticrecode') || !link_regex.test(msg.content)) {
    if (index >= 0) newMembers.splice(index, 1);
    linkMessages.delete(msg.author.id);
    return false;
  }

  if (index >= 0) {
    if (msg.member.kickable) {
      msg.member.kick('Posted link as first message. Typically spam bot behavior.')
      .then(async () => {
        const channel = bot.channels.get(servers('main').channel('staff')) as TextChannel;
        await channel.send(`Kicked suspected spam: ${msg.member.displayName}\nContent: ||${msg.content}||`);
        if (msg.deletable) msg.delete();
      });
    }
  }
  else {
    const new_link = msg.content.match(link_regex)![0];
    if (linkMessages.has(msg.author.id)) {
      const {link, ids} = linkMessages.get(msg.author.id)!;
      if (new_link.localeCompare(link) === 0) {
        ids.push({
          channel: msg.channel.id,
          message: msg.id
        });
        if (ids.length >= 3) {
          if (msg.member.kickable) {
            msg.member.kick('Spammed same link. Typically spam bot behavior.')
            .then(async () => {
              const staff_channel = bot.channels.get(servers('main').channel('staff')) as TextChannel;
              await staff_channel.send(`Kicked suspected spam: ${msg.member.displayName}\nContent: ||${link}||`);
              ids.forEach(({channel, message}) => {
                (bot.channels.get(channel) as TextChannel).fetchMessage(message)
                .then(v => {
                  if (v.deletable) v.delete();
                });
              })
            })
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
  }  

  return true;
};

function setNewLink(msg: Message, link: string) {
  linkMessages.set(msg.author.id, {
    link,
    ids: [{
      channel: msg.channel.id,
      message: msg.id
    }]
  });
}
