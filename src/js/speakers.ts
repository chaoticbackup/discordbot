import { Guild, GuildMember, Role } from 'discord.js';
import {cleantext, uppercase} from './common';

const suffix = "_speakers";

export default async (user: GuildMember, guild: Guild, args: string[]): Promise<string> => {

    const languageProper = (lang: string): string => {
        return uppercase(lang.replace(suffix, ""))
    }

    const languageList = async () => {
        let language_count = 0;
        let msg = "Available languages:\n";
        guild.roles.forEach((value: Role) => {
            if (value.name.includes(suffix)) {
                language_count++;
                msg += languageProper(value.name) + "\n";
            }
        });
        if (language_count === 0) {
            return Promise.resolve(`This guild has no language "${suffix}" roles`);
        }
        return Promise.resolve(msg);
    }

    const memberList = async (lang: string) => {
        let msg = `List of ${languageProper(lang)} speaking members:\n`;
        role.members.forEach((m) => {
            msg += m.displayName + '\n';
        });
        return Promise.resolve(msg);
    }

    if (args.length == 0 || args[0] == "") return languageList();
        
    const language = args[0].toLowerCase();
    const role: Role = guild.roles.find(role => role.name===`${language}${suffix}`);

    if (!role) return languageList();
    
    if (args.length < 2) return memberList(language);

    switch(cleantext(args[1])) {
        case 'list': {
            return memberList(language);
        }
        case 'join': {
            return user.addRole(role).then(() => {
                return `You joined ${languageProper(language)} speakers`;
            });
        }
        case 'leave': {
            return user.removeRole(role).then(() => {
                return `${user.displayName} left ${languageProper(language)} speakers`;
            });
        }
    }

    return Promise.resolve("!speakers <language> <join|leave|list|>");
}