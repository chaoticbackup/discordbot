const {cleantext} = require('./shared.js');

export function setTribe(tribe, message, bot) {

    ["Danian", "Mipedian", "M'arrillian", "OverWorld", "UnderWorld", "Tribeless", "Frozen"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            message.member.removeRole(gr);
        }
    });

    let response = ""
    switch(tribe.toLowerCase()) {
        case 'danian':
            tribe = "Danian";
            response = `<:gottahave:400174328215502851>: Yo, you're one of the hive now.`;
            break;
        case 'mipedian':
            tribe = "Mipedian";
            response = `<:Shim:315235831927537664>: What's up my dude? heh heh heh, welcome to the fun.`;
            break;
        case 'marrillian':
        case "m'arrillian":
            tribe = "M'arrillian";
            response = `<:Mar:294942283273601044>: You'll serve you're purpose.`
            break;
        case 'overworld':
            tribe = "OverWorld";
            response = `<:Bodal:401553896108982282>: You have joined the mighty forces of the OverWorld.`;
            break;
        case 'underworld':
            tribe = "UnderWorld";
            response = `<:Chaor:285620681163669506>: Puny humans can still fight for Chaor!`;
            break;
        case 'tribeless':
        case 'generic':
            tribe = "Tribeless";
            response = `<:creepy:471863166737973268>: 👀`;
            break;
        case 'frozen':
            tribe = "Frozen";
            response = `Shhhh we haven't been revealed yet`;
            break;
        default:
            return `${tribe} is not a valid faction`;
    }

    let guild_role = bot.guilds.get(message.guild.id).roles.find(role => role.name===tribe);
    if (guild_role) {
        message.member.addRole(guild_role);
        return response;
    }

    return `Sorry this guild doesn't have tribal roles`;
}
