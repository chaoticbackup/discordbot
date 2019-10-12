import {Guild} from 'discord.js';
import { rndrsp } from './common';
const commands = require('../config/commands.json');

export {
    c as compliment,
    i as insult
}

function c(guild: Guild, mentions: string[], name: string): string {
    return flirt_dirt("compliment", guild, mentions, name);
}

function i(guild: Guild, mentions: string[], name: string): string {
    if (mentions.indexOf('279331985955094529') !== -1)
        return ("<:Bodal:401553896108982282> just... <:Bodal:401553896108982282>");
    return flirt_dirt("insult", guild, mentions, name);
}

function flirt_dirt(command: "compliment" | "insult", guild: Guild, mentions: string[], name: string): string {
    // Function to replace the mention with the display name
    const insertname = (resp: string) => {
        if (guild && mentions.length > 0) {
            let member = guild.members.get(mentions[0]);
            if (member) name = member.displayName;
        }
        console.log(name, Boolean(name));
        if (name) {
            return resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (_match: any, p1: string) => {
                return p1.replace(/x/i, name);
            });
        }
        return resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (_match: any, p1: string) => {return p1;});
    }


    return insertname(rndrsp(commands[command], command));
}