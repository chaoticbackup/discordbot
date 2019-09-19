import {Guild, GuildMember, Role} from 'discord.js'

export function lookingForMatch(type:string, guild: Guild, member: GuildMember ) {
    // all, untap, tts
    let match = "";
    if (type.toLowerCase() == "tts") {
        match = "tts_match";
    }
    else {
        match = "untap_match";
        type = "untap";
    }
    let role = guild.roles.find((role: Role) => role.name===match);
    if (role) {
        member.addRole(role);
        if(role.mentionable)
            type = `<@&${role.id}>`;
        return `You are looking for a ${type} match`;
    }
}

export function cancelMatch(guild: Guild, member: GuildMember) {
    ["untap_match", "tts_match"].forEach((t) => {
        let role = guild.roles.find((role: Role) => role.name===t);
        if (member.roles.find((role: Role) => role === role)) {
            member.removeRole(role);
        }
    });

    return "You are no longer looking for a match";
}
