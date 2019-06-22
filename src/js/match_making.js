export function lookingForMatch(type, guild, member) {
    // all, untap, tts
    let match = "";
    if (type.toLowerCase() == "tts") {
        match = "tts_match";
    }
    else {
        match = "untap_match";
        type = "untap";
    }
    let gr = guild.roles.find(role => role.name===match);
    if (gr) {
        member.addRole(gr);
        return `You are looking for a ${type} match`;
    }
}

export function cancelMatch(guild, member) {
    ["untap_match", "tts_match"].forEach((t) => {
        let gr = guild.roles.find(role => role.name===t);
        if (member.roles.find(role => role === gr)) {
            member.removeRole(gr);
        }
    });

    return "You are no longer looking for a match";
}
