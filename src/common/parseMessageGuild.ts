import { Message, GuildMember, Guild } from 'discord.js';

/**
 * If the message was sent in a guild, returns the `guild` and `guildMember`
 */
export async function messageGuild(message: Message):
Promise<{guild?: Guild, guildMember?: GuildMember }>
{
  if (!message.guild) return { guild: undefined, guildMember: undefined };

  const { guild } = message;
  const guildMember: GuildMember = message.member !== undefined
    ? message.member
    : await guild.fetchMember(message.author).then((member) => member);

  return { guild, guildMember };
}
