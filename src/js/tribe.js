const {cleantext} = require('./shared.js');

export function showTribe() {
    ["Danian", "Mipedian", "M'arrillian", "OverWorld", "UnderWorld", "Tribeless"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            return `You are part of the ` + t;
        }
    });
    return `You have not declared an allegiance`;
}

export function leaveTribe(message, bot) {
    let leaving_tribe = "";
    ["Danian", "Mipedian", "M'arrillian", "OverWorld", "UnderWorld", "Tribeless", "Frozen"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            message.member.removeRole(gr);
            leaving_tribe = t;
        }
    });
    return leaving_tribe;
}

export function joinTribe(tribe, message, bot) {
    let leaving_tribe = "";
    ["Danian", "Mipedian", "M'arrillian", "OverWorld", "UnderWorld", "Tribeless", "Frozen"]
    .forEach((t) => {
        let gr = bot.guilds.get(message.guild.id).roles.find(role => role.name===t);
        if (message.member.roles.find(role => role === gr)) {
            if (tribe == t) return leaving_tribe = "stay";
            else {
                message.member.removeRole(gr);
                leaving_tribe = t;
            }
        }
    });

    if (leaving_tribe == "stay")
        return `You're already part of the ${tribe}.`

    let joining_msg = "";
    let leaving_msg = "";
    switch(tribe.toLowerCase()) {
        case 'danian':
            tribe = "Danian";
            joining_msg = `<:gottahave:400174328215502851> Yo, you're one of the hive now.`;
            break;
        case 'mipedian':
            tribe = "Mipedian";
            joining_msg = `<:Shim:315235831927537664> What's up my dude? heh heh heh, welcome to the fun.`;
            break;
        case 'marrillian':
        case "m'arrillian":
        case 'm’arrillian':
            tribe = "M'arrillian";
            joining_msg = `<:Mar:294942283273601044> You'll serve your purpose.`
            break;
        case 'overworld':
            tribe = "OverWorld";
            if (leaving_tribe == "UnderWorld") {
                leaving_msg = "<:Chaor:285620681163669506> How dare you betray me for the OverWorld!";
                joining_msg = "<:Bodal:401553896108982282> I'm still suspicious of your allegiance, but we can use another set of hands.";
            }
            else {
                joining_msg = `<:Bodal:401553896108982282> You have joined the mighty forces of the OverWorld.`;
            }
            break;
        case 'underworld':
            tribe = "UnderWorld";
            joining_msg = `<:Chaor:285620681163669506 Puny humans can still fight for Chaor!`;
            break;
        case 'tribeless':
        case 'generic':
            tribe = "Tribeless";
            joining_msg = `<:creepy:471863166737973268> 👀`;
            break;
        case 'frozen':
            tribe = "Frozen";
            joining_msg = `Shhhh we haven't been revealed yet`;
            break;
        default:
            return `${tribe} is not a valid faction`;
    }

    let guild_role = bot.guilds.get(message.guild.id).roles.find(role => role.name===tribe);
    if (guild_role) {
        message.member.addRole(guild_role);
        if (leaving_msg != "") {
            return leaving_msg + '\n' + joining_msg;
        }
        return joining_msg;
    }

    return `Sorry this guild doesn't have tribal roles`;
}
