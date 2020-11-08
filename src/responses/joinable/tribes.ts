import { Guild, GuildMember } from 'discord.js';
import { asyncForEach, hasPermission, isModerator } from '../../common';
import { CreatureTribes, parseTribe } from '../../common/card_types';

const tribes = CreatureTribes;

export const tribe = async (
  args: string[], guild?: Guild, member?: GuildMember
): Promise<string> => {
  if (!guild || !member) {
    return 'You can only use this command in a guild with roles';
  }

  if (!hasPermission(guild, 'MANAGE_ROLES')) {
    return 'I need the ``MANAGE_ROLES`` permission';
  }

  let param;

  if (args.length === 0 || args[0] === '' || (param = args[0].toLowerCase()) === 'show') {
    return displayTribe(guild, member);
  }

  if (param === 'leave') {
    return await leaveTribe(guild, member)
    .then(msg => msg);
  }

  if (args.length < 2) {
    return '!tribe <join|leave> <tribeName>';
  }

  if (param === 'join') {
    return await joinTribe(guild, member, args[1]);
  }

  return '!tribe <join|leave> <tribeName>';
};

export const brainwash = async (
  mentions: string[], guild?: Guild, member?: GuildMember
): Promise<string> => {
  if (!guild || !member) {
    return 'You can only use this command in a guild with roles';
  }

  if (!hasPermission(guild, 'MANAGE_ROLES')) {
    return 'I need the ``MANAGE_ROLES`` permission';
  }

  const bw = guild.roles.find(role => role.name === 'Brainwashed');
  if (!bw) {
    return 'This guild has no "Brainwashed" role';
  }

  const moderator = isModerator(member);

  const brainwashMember = (member: GuildMember) => {
    if (member.roles.find(role => role === bw)) {
      member.removeRole(bw).catch(() => {});
      return 'Your mind is free!';
    }
    else {
      member.addRole(bw).catch(() => {});
      return '<:Mar:294942283273601044> You have been brainwashed';
    }
  };

  if (mentions.length > 0) {
    if (moderator) {
      await asyncForEach(mentions, async (id: string) => {
        await guild.fetchMember(id).then(brainwashMember);
      });
    }
  }
  else {
    return brainwashMember(member);
  }

  return '';
};

const displayTribe = (guild: Guild, member: GuildMember): string => {
  const bw = guild.roles.find(role => role.name === 'Brainwashed');

  let tribe = '';
  tribes.forEach((t) => {
    const gr = guild.roles.find(role => role.name === t);
    if (member.roles.find(role => role === gr)) {
      if (bw && member.roles.find(role => role === bw)) {
        tribe = `You are a brainwashed ${(() => {
          if (t === 'OverWorld') return 'OverWorlder';
          else if (t === 'UnderWorld') return 'UnderWorlder';
          else return t;
        })()}`;
        return;
      }
      tribe = `You are part of the ${t}`;
    }
  });
  if (tribe) return tribe;
  return 'You have not declared an allegiance. Use !tribe join *tribe name*';
};

const leaveTribe = async (guild: Guild, member: GuildMember): Promise<string> => {
  for (let i = 0; i < tribes.length; i++) {
    const t = tribes[i];
    const gr = guild.roles.find(role => role.name === t);
    if (member.roles.find(role => role === gr)) {
      return await member.removeRole(gr)
      .then(() => `You have left the ${t} tribe`)
      .catch(() => '');
    }
  }

  return 'You are not part of a tribe';
};

const joinTribe = async (guild: Guild, member: GuildMember, input: string): Promise<string> => {
  let leaving_tribe = '';
  tribes.forEach((t) => {
    if (member.roles.find(role => role === guild.roles.find(role => role.name === t))) {
      leaving_tribe = t;
    }
  });

  let joining_msg = '';
  let leaving_msg = '';

  const tribe = parseTribe(input);

  switch (tribe) {
    case 'Danian':
      if (leaving_tribe) {
        joining_msg = '<:gottahave:400174328215502851> You\'ve been infected.';

        if (leaving_tribe === 'Mipedian') {
          leaving_msg = '<:Shim:315235831927537664> Hey! Return our water!';
        }
        else if (leaving_tribe === 'UnderWorld') {
          leaving_msg = '<:Chaor:285620681163669506> Bugs, humans? I\'ll squash you both!';
        }
      }
      else {
        joining_msg = '<:gottahave:400174328215502851> Yo, you\'re one of the hive now.';
      }
      break;
    case 'Mipedian':
      if (leaving_tribe === 'Danian') {
        joining_msg = '<:Shim:315235831927537664> Another one purified';
      }
      else {
        joining_msg = '<:Shim:315235831927537664> What\'s up my dude? heh heh heh, welcome to the fun.';
      }
      break;
    case "M'arrillian":
      joining_msg = '<:Mar:294942283273601044> You\'ll serve your purpose.';
      break;
    case 'OverWorld':
      if (leaving_tribe === 'UnderWorld') {
        leaving_msg = '<:Chaor:285620681163669506> How dare you betray me for the OverWorld!';
        // eslint-disable-next-line max-len
        joining_msg = "<:ZalThink:565050379499208704> I'm still suspicious of your allegiance, but we can use another set of hands.";
      }
      else if (leaving_tribe === 'Mipedian') {
        leaving_msg = '<:Shim:315235831927537664> Look out!';
        joining_msg = '<:WhyHello:586724104732672000> SURPRISE!';
      }
      else {
        joining_msg = '<:Bodal:401553896108982282> You have joined the mighty forces of the OverWorld.';
      }
      break;
    case 'UnderWorld':
      if (leaving_tribe === 'OverWorld') {
        joining_msg = '<:Chaor:285620681163669506> Ah good! You can tell me all their secrets! ';
      }
      else {
        joining_msg = '<:Chaor:285620681163669506> Puny humans can still fight for Chaor!';
      }
      break;
    case 'Frozen':
      joining_msg = 'Shhhh we haven\'t been revealed yet';
      break;
    default:
      return `${input} is not a valid faction`;
  }

  const guild_role = guild.roles.find(role => role.name === tribe);
  const remove_role = guild.roles.find(role => role.name === leaving_tribe);

  if (guild_role) {
    await member.addRole(guild_role);

    if (leaving_tribe === tribe) {
      return `You are already part of the ${tribe}.`;
    }
    else if (remove_role) {
      await member.removeRole(remove_role);
    }

    if (leaving_msg !== '') {
      return `${leaving_msg}\n${joining_msg}`;
    }
    else {
      return joining_msg;
    }
  }
  else {
    return `Sorry this guild doesn't have the ${tribe} role`;
  }
};
