import { Guild, GuildMember, Role } from 'discord.js';
import { cleantext, uppercase } from '../../common';

const suffix = '_speakers';

const languageProper = (lang: string): string => {
  return uppercase(lang.replace(suffix, ''))
}

export default async (user: GuildMember, guild: Guild, args: string[]) => {
  if (!guild) {
    return 'You can only use this command in a guild with roles';
  }

  const languageList = () => {
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
  }

  if (args.length === 0 || args[0] === '') return languageList();

  const language = args[0].toLowerCase();
  const role: Role = guild.roles.find(role => role.name === `${language}${suffix}`);

  const memberList = (lang: string) => {
    let msg = `List of ${languageProper(lang)} speaking members:\n`;
    role.members.forEach((m) => {
      msg += `${m.displayName}\n`;
    });
    return msg;
  }

  if (!role) return languageList();

  if (args.length < 2) return memberList(language);

  switch (cleantext(args[1])) {
    case 'list': {
      return memberList(language);
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

  return '!speakers <language> <join|leave|list|>';
}
