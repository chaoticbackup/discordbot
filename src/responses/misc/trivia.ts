import { Guild, GuildMember, Message } from 'discord.js';
import { isModerator } from '../common';

export {
    w as whistle,
    // It's the command that manages timing, like the whistle of a ref.
    t as trivia
    //sets a guildmember as the trivia master
    a as answer
    //how a trivia player sends a response to the bot
}

var questiontime = false;
var responses: string[]; 
var triviaMaster;

function w() {
    if (questiontime == false)
        questiontime = true;
    else {
        questiontime = false;
        var mail = responses.toString();
        triviaMaster.send(mail);
        responses = [];
    }
}

function t() {
    if(isModerator(message.author))
        triviaMaster = message.author;
}

function a(answer: string) {
    if (questiontime == true) {
        responses += answer; 
        message.author.displayName += answer;
    }
}
