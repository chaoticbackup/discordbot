const { RichEmbed } = require('discord.js');

export function tierlist(tier) {
    const {tierlist, decks} = require('../config/tierlist.json');
    const embed = new RichEmbed();

    if (tier) {
        tier = tier.toUpperCase();
        if (tier == "CM") tier = "S";
        if (tierlist.hasOwnProperty(tier)) {
            let message = "";
            tierlist[tier].forEach((deck) => {
                message += `${deck}: ${decks[deck].url}\n`;
            });
            embed.addField(`${tier} Decks`, message, true);
        }
        else return "That is not a tier";
    }
    else {
       for (var tier in tierlist) {
           let message = "";
           tierlist[tier].forEach((deck) => {
               message += `${deck}: ${decks[deck].url}\n`;
           });
           embed.addField(tier, message, true);
       };
    }

    return embed;
}
