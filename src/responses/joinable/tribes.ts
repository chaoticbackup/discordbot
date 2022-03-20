/* eslint-disable max-len */
import { Guild, GuildMember } from 'discord.js';
import { asyncForEach, hasPermission, isModerator } from '../../common';
import { parseTribe } from '../../common/card_types';

const tribes = ['Danian', 'Mipedian', "M'arrillian", 'OverWorld', 'UnderWorld', 'Tribeless', 'Frozen'];

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
    return '!tribe \'join|leave\' <tribe>';
  }

  if (param === 'join') {
    return await joinTribe(guild, member, args[1]);
  }

  return '!tribe  \'join|leave\' <tribe>';
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
        const member = await guild.fetchMember(id);
        brainwashMember(member);
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
        tribe = `You are a brainwashed ${t}`;
      } else {
        tribe = `You are part of the ${t} tribe`;
      }
    }
  });
  if (tribe) return tribe;
  return 'You have not declared an allegiance. Use !tribe join *tribe name*';
};

const leaveTribe = async (guild: Guild, member: GuildMember): Promise<string> => {
  let leaving_msg = 'You are not part of a tribe';

  for (const t of tribes) {
    const gr = guild.roles.find(role => role.name === t);
    if (member.roles.find(role => role === gr)) {
      await member.removeRole(gr)
      .then(() => {
        leaving_msg = `You have left the ${t} tribe`;
      })
      .catch(() => {});
    }
  }

  return leaving_msg;
};

const joinTribe = async (guild: Guild, member: GuildMember, input: string): Promise<string> => {
  let leaving_tribe = '';
  let joining_msg = '';
  let leaving_msg = '';

  const tribe = (input === 'assimilate') ? 'Danian' : parseTribe(input, 'Joinable');

  for (const t of tribes) {
    const remove_role = guild.roles.find(role => role.name === t);
    if (member.roles.find(role => role === remove_role)) {
      if (t === tribe) {
        switch(tribe) {
          case "Danian":
          case "M'arrillian":
          case "Mipedian": {
            tribe = tribe + "s";
            break;
          }
          case "OverWorld":
          case "UnderWorld": {
            tribe = tribe + "ers";
            break;
          }
        }
        return `You are already part of the ${tribe}.`;
      }
      else {
        await member.removeRole(remove_role).catch(() => {});
        leaving_tribe = t;
      }
    }
  }

  switch (tribe) {
    case 'Danian':
      if (input === 'assimilate') {
        joining_msg = '<:gottahave:400174328215502851> You\'ve been infected.';
      } else {
        joining_msg = '<:gottahave:400174328215502851> Yo, you\'re one of the hive now.';
      }

      if (leaving_tribe) {
        if (leaving_tribe === 'Mipedian') {
          leaving_msg = '<:Shim:315235831927537664> Hey! Return our water!';
        }
        else if (leaving_tribe === 'UnderWorld') {
          leaving_msg = '<:Chaor:285620681163669506> Bugs, humans? I\'ll squash you both!';
        }
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
      joining_msg = '<:dealwithit:920071682008449046> You\'ll serve your purpose.';
      break;
    case 'OverWorld':
      if (leaving_tribe === 'UnderWorld') {
        leaving_msg = '<:Chaor:285620681163669506> How dare you betray me for the OverWorld!';
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
    case 'Tribeless':
      if (leaving_tribe) {
        joining_msg = '<:creepy:471863166737973268> You\'ve left your home behind';
      }
      else {
        joining_msg = '<:creepy:471863166737973268> New prey 👀';
      }
      break;
    case 'Frozen':
      joining_msg = 'Shhhh we haven\'t been revealed yet';
      break;
    default:
      return `${input} is not a valid faction`;
  }

  const guild_role = guild.roles.find(role => role.name === tribe);

  if (guild_role) {
    await member.addRole(guild_role);

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
