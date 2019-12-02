import { Client } from 'discord.js';

export default class Icons {
    bot: Client;
    constructor(bot: Client) {
        this.bot = bot;
    }

    attacks = () => {
        return this.bot.emojis.find(emoji => emoji.name==="attack");
    }

    battlegear = () => {
        return this.bot.emojis.find(emoji => emoji.name==="battlegear");
    }

    locations = () => {
        return this.bot.emojis.find(emoji => emoji.name==="location");
    }

    // Tribal mugic counters
    mc = (tribe: string) => {
        switch (tribe) {
        case "OverWorld":
            return this.bot.emojis.find(emoji => emoji.name==="OWCounter");
        case "UnderWorld":
            return this.bot.emojis.find(emoji => emoji.name==="UWCounter");
        case "M'arrillian":
            return this.bot.emojis.find(emoji => emoji.name==="MarCounter");
        case "Mipedian":
            return this.bot.emojis.find(emoji => emoji.name==="MipCounter");
        case "Danian":
            return this.bot.emojis.find(emoji => emoji.name==="DanCounter");
        default:
            return this.bot.emojis.find(emoji => emoji.name==="TLCounter");
        }
    }

    // Element active icons
    elements = (input: string) => {
        switch (input) {
            case "Fire":
                return this.bot.emojis.find(emoji => emoji.name=="Fire");
            case "Air":
                return this.bot.emojis.find(emoji => emoji.name=="Air");
            case "Earth":
                return this.bot.emojis.find(emoji => emoji.name=="Earth");
            case "Water":
                return this.bot.emojis.find(emoji => emoji.name=="Water");
            default:
                return "";
        }
    }

    // Element inactive icons
    el_inactive = (input: string) => {
        switch (input) {
            case "Fire":
                return this.bot.emojis.find(emoji => emoji.name=="fireinactive");
            case "Air":
                return this.bot.emojis.find(emoji => emoji.name=="airinactive");
            case "Earth":
                return this.bot.emojis.find(emoji => emoji.name=="earthinactive");
            case "Water":
                return this.bot.emojis.find(emoji => emoji.name=="waterinactive");
            default:
                return "";
        }
    }

    // Discipline icons
    disciplines = (input: string) => {
        switch (input) {
            case "Courage":
                return this.bot.emojis.find(emoji => emoji.name=="Courage");
            case "Power":
                return this.bot.emojis.find(emoji => emoji.name=="Power");
            case "Wisdom":
                return this.bot.emojis.find(emoji => emoji.name=="Wisdom");
            case "Speed":
                return this.bot.emojis.find(emoji => emoji.name=="Speed");
            default:
                return "";
        }
    }

    // Tribe icons
    tribes = (input: string) => {
        switch (input) {
            case "OverWorld":
                return this.bot.emojis.find(emoji => emoji.name==="OW");
            case "UnderWorld":
                return this.bot.emojis.find(emoji => emoji.name==="UW");
            case "M'arrillian":
                return this.bot.emojis.find(emoji => emoji.name==="Mar");
            case "Mipedian":
                return this.bot.emojis.find(emoji => emoji.name==="Mip");
            case "Danian":
                return this.bot.emojis.find(emoji => emoji.name==="Dan");
            default:
                return this.bot.emojis.find(emoji => emoji.name==="TL");
        }
    }
}






