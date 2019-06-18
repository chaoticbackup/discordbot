export function lookingForMatch(type, message, bot) {
    // all, untap, tts
    let match = "";
    if (type.toLowerCase() == "tts") {
        match = "tts_match";
    }
    else {
        match = "untap_match";
    }
    let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===match);
    if (gr) {
        message.member.addRole(gr);
        return `You are looking for a ${type} match`;
    }
}

export function cancelMatch(message, bot) {
    ["untap_match", "tts_match"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            message.member.removeRole(gr);
        }
    });

    return "You are no longer looking for a match";
}
