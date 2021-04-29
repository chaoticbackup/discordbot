import { Message, GuildMember, Guild } from 'discord.js';

/**
 * If the message was sent in a guild, returns the `guild` and `guildMember`
 */
export async function messageGuild(message: Message):
Promise<{guild?: Guild, guildMember?: GuildMember }>
{
  if (!message.guild) return { guild: undefined, guildMember: undefined };

  const { guild, member, author } = message;
  const guildMember: GuildMember = (member !== undefined)
    ? member
    : await guild.fetchMember(author).then((m) => m);

  return { guild, guildMember };
}
