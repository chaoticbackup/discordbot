import { GuildMember } from 'discord.js';
import { isModerator } from '../../common';

export {
    w as whistle,
    // It's the command that manages timing, like the whistle of a ref.
    t as trivia,
    //sets a guildmember as the trivia master
    a as answer
    //how a trivia player sends a response to the bot
}

type Response = {
    name: string;
    answer: string;
}

let questiontime = false;
let responses: Response[]; 
let triviaMaster: GuildMember;

function w(member: GuildMember): string {
    if (member.id === triviaMaster.id) {
        if (questiontime == false) {
            questiontime = true;
            return "Users may now submit their answers";
        }
        else {
            questiontime = false;
            let message = "";
            responses.forEach(rsp => {
                message += `${rsp.name} answered: ${rsp.answer}\n`;
            });
            responses = [];
            triviaMaster.send(message);
            return "Question time is over, messages have been sent to the trivia host";
        }
    }
    return "You're not the host";
}

function t (member: GuildMember): string {
    if (isModerator(member)) {
        triviaMaster = member;
        return ("You are now Trivia Master!");
    }
    return ("Tsk tsk, only mods can host trivia night!")
}

function a (member: GuildMember, answer: string): string {
    if (questiontime == true) {
        responses.push({name: member.displayName, answer});
        return "Your response has been recorded!";
    }
    return "There's no active question currently";
}
