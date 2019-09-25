import {cleantext} from './shared';
import { RichEmbed } from 'discord.js';
const {tierlist, decks, tribes} = require('../config/tierlist.json');

export function tier(tier: string) {
    const embed = new RichEmbed();

    if (tier && tier.toLowerCase() != "list") {
        for (let key in tribes) {
          if (cleantext(key) == cleantext(tier)) {
            let message = `**${key} Decks:**\n`;
            tribes[key].forEach((deck: string) => {
              message += `${deck}: ${decks[deck].url}\n`;
            });
            return embed.setDescription(message);
          }
        }

        tier = tier.toUpperCase();
        if (tier == "CM") tier = "S";
        if (tierlist.hasOwnProperty(tier)) {
            let message = "";
            tierlist[tier].forEach((deck: string) => {
                message += `${deck}: ${decks[deck].url}\n`;
            });
            return embed.addField(`${tier} Decks`, message, true);
        }
        else return "That is not a tier";
    }
    else {
       for (let tier in tierlist) {
           let message = "";
           tierlist[tier].forEach((deck: string) => {
               message += `${deck}: ${decks[deck].url}\n`;
           });
           embed.addField(tier, message, true);
       };
    }

    return embed;
}
