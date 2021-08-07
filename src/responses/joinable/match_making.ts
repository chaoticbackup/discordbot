import { Guild, GuildMember, Role } from 'discord.js';
import { hasPermission } from '../../common';
import { Channel } from '../../definitions';
import servers from '../../common/servers';

const types = ['recode', 'untap', 'tts', 'pauper', 'spell'] as const;

type Type = typeof types[number];

function isType(input: string): input is Type {
  return types.includes(input as any);
}

function canMatch(guild: Guild, channel: Channel): boolean {
  if (!(hasPermission(guild, 'MANAGE_ROLES'))) return false;
  if (guild.id === servers('main').id) {
    if (
      channel.id === servers('main').channel('match_making') ||
      channel.id === servers('main').channel('untap_matching') ||
      channel.id === servers('main').channel('tts_matching') ||
      channel.id === servers('main').channel('spelltable_matching')
    ) return true;
    else return false;
  }
  return true;
}

const parseType = (type: string, channel: Channel, guild: Guild): Type => {
  if (!isType(type)) {
    if ((guild.id === servers('main').id)) {
      if (channel.id === servers('main').channel('match_making')) return 'recode';
      else if (channel.id === servers('main').channel('untap_matching')) return 'untap';
      else if (channel.id === servers('main').channel('tts_matching')) return 'tts';
      else if (channel.id === servers('main').channel('spelltable_matching')) return 'spell';
    }

    return types[0];
  }

  return type;
};

export function lookingForMatch(arg0: string, channel: Channel, guild?: Guild, member?: GuildMember) {
  if (!guild || !member || !canMatch(guild, channel)) return;

  const type = parseType(arg0, channel, guild);

  const role = guild.roles.find((role: Role) => role.name === `${type}_match`);
  if (role) {
    member.addRole(role).catch(() => {});
    if (role.mentionable) {
      return `You are looking for a <@&${role.id}>`;
    }
    return `You are looking for a ${type} match`;
  }
  return `Please add ${type}_match as a role on this server`;
}

export function cancelMatch(arg0: string, channel: Channel, guild?: Guild, member?: GuildMember) {
  if (!guild || !member || !canMatch(guild, channel)) return;

  if (arg0 && isType(arg0)) {
    const type = parseType(arg0, channel, guild);

    const role = guild.roles.find((role: Role) => role.name === `${type}_match`);

    if (role && member.roles.find((r) => role === r)) {
      member.removeRole(role).catch(() => {});
      return `You are no longer looking for a ${type} match`;
    }

    return `Please add ${type}_match as a role on this server`;
  }

  for (let i = 0; i < types.length; i++) {
    const role = guild.roles.find((role: Role) => role.name === `${types[i]}_match`);
    if (role && member.roles.find((r) => role === r)) {
      member.removeRole(role).catch(() => {});
    }
  }

  return 'You are no longer looking for a match';
}
