const {cleantext} = require('./shared.js');

export function setTribe(tribe, message, bot) {

    ["Danian", "Mipedian", "M'arrillian", "OverWorld", "UnderWorld", "Tribeless", "Frozen"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            message.member.removeRole(gr);
        }
    });

    switch(tribe.toLowerCase()) {
        case 'danian':
            tribe = "Danian";
            break;
        case 'mipedian':
            tribe = "Mipedian";
            break;
        case 'marrillian':
        case "m'arrillian":
            tribe = "M'arrillian";
            break;
        case 'overworld':
            tribe = "OverWorld";
            break;
        case 'underworld':
            tribe = "UnderWorld";
            break;
        case 'tribeless':
        case 'generic':
            tribe = "Tribeless";
            break;
        case 'frozen':
            tribe = "Frozen";
            break;
        default:
            return `${tribe} is not a valid faction`;
    }

    let guild_role = bot.guilds.get(message.guild.id).roles.find(role => role.name===tribe);
    if (guild_role) {
        message.member.addRole(guild_role);
        if (tribe = "Frozen")
            return `Shhhh we haven't been revealed yet`;
        else
            return `You have joined the ${tribe}`;
    }

    return `Sorry this guild doesn't have tribal roles`;
}
