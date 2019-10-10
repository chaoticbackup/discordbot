import {Channel} from '../definitions';
import {Guild, GuildMember, Role} from 'discord.js'
import { hasPermission, is_channel } from '../common';
const {servers} = require("../../config/server_ids.json");

const types = ["untap_match", "tts_match"];

function canMatch(guild: Guild, channel: Channel): boolean {
    if (!(guild && hasPermission(guild, "MANAGE_ROLES"))) return false;
    if (guild.id === servers.main.id && channel.id !== servers.main.channels.match_making) return false;
    return true;
}

export function lookingForMatch(type: string, channel: Channel, guild: Guild, member: GuildMember) {
    if (!canMatch(guild, channel)) return;

    if (!type) type = "untap";
    else if (types.indexOf(type) === -1) {
        type = "untap";
    }

    let role = guild.roles.find((role: Role) => role.name===`${type}_match`);
    if (role) {
        member.addRole(role);
        if (role.mentionable) type = `<@&${role.id}>`;
        return `You are looking for a ${type} match`;
    }
}

export function cancelMatch(channel: Channel, guild: Guild, member: GuildMember) {
    if (!canMatch(guild, channel)) return;

    types.forEach((t) => {
        let role = guild.roles.find((role: Role) => role.name===t);
        if (member.roles.find((role: Role) => role === role)) {
            member.removeRole(role);
        }
    });

    return "You are no longer looking for a match";
}
