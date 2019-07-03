const { RichEmbed } = require('discord.js');

export function tierlist() {
	return new RichEmbed().setImage('https://drive.google.com/uc?id=1h9QOd2sk1KD4WK91FLy5CQPcar4twGlA');
}
export function tierlisttext() {
    const {tierlist, decks} = require('../config/tierlist.json');

    const embed = new RichEmbed();
    for (var tier in tierlist) {
        let message = "";
        tierlist[tier].forEach((deck) => {
            message += `${deck}: ${decks[deck].url}\n`;
        });
        embed.addField(tier, message, true);
    };

    return embed;
}
