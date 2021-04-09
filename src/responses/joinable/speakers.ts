import { Guild, GuildMember, Role, Message, TextChannel } from 'discord.js';
import { FieldsEmbed } from 'discord-paginationembed';
import { cleantext, uppercase, hasPermission } from '../../common';

const suffix = '_speakers';

const languageProper = (lang: string): string => {
  return uppercase(lang.replace(suffix, ''));
};

const languageList = (guild: Guild) => {
  let language_count = 0;
  let msg = 'Available languages:\n';
  guild.roles.forEach((value: Role) => {
    if (value.name.includes(suffix)) {
      language_count++;
      msg += `${languageProper(value.name)}\n`;
    }
  });
  if (language_count === 0) {
    return `This guild has no language "${suffix}" roles`;
  }
  return msg;
};

const memberList = async (message: Message, role: Role, lang: string) => {
  const Pagination = new FieldsEmbed<GuildMember>();

  const array = (await message.guild.fetchMembers()).members.filter(m => m.roles.has(role.id)).array();

  Pagination
    .setChannel(message.channel as (TextChannel))
    .setDisabledNavigationEmojis(['DELETE'])
    .setElementsPerPage(20)
    .setPageIndicator(true)
    .setArray(array)
    .formatField(`List of ${languageProper(lang)} speakers:`, m => m.displayName);

  return await Pagination.build();
};

export default async function (message: Message, args: string[], guild?: Guild, user?: GuildMember) {
  if (!guild || !user) {
    return 'You can only use this command in a guild';
  }

  if (!hasPermission(guild, 'MANAGE_ROLES')) {
    return 'I need the ``MANAGE_ROLES`` permission';
  }

  if (args.length === 0 || args[0] === '') return languageList(guild);

  const language = args[0].toLowerCase();
  const role: Role = guild.roles.find(role => role.name === `${language}${suffix}`);

  if (!role) return languageList(guild);

  if (args.length < 2) return memberList(message, role, language);

  switch (cleantext(args[1])) {
    case 'list': {
      return await memberList(message, role, language);
    }
    case 'join': {
      return await user.addRole(role).then(() => {
        return `You joined ${languageProper(language)} speakers`;
      });
    }
    case 'leave': {
      return await user.removeRole(role).then(() => {
        return `${user.displayName} left ${languageProper(language)} speakers`;
      });
    }
  }

  return '!speakers <language> \'join|leave|list\'';
}
