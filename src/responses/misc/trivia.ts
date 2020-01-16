import { GuildMember, User } from 'discord.js';
import { isModerator } from '../../common';

type Response = {
    name: string;
    answer: string;
}

let questiontime = false;
let responses: Response[];
let triviaMaster: GuildMember | null;

// It's the command that manages timing, like the whistle of a ref.
export function whistle(member: GuildMember): string {
  if (triviaMaster && member.id === triviaMaster.id) {
    if (!questiontime) {
      questiontime = true;
      return 'Users may now submit their answers';
    }
    else {
      questiontime = false;
      let message = '';
      responses.forEach(rsp => {
        message += `${rsp.name} answered: ${rsp.answer}\n`;
      });
      responses = [];
      triviaMaster.send(message);
      return 'Question time is over, messages have been sent to the Trivia Master';
    }
  }
  return "You're not the host";
}

// sets a guildmember as the trivia master
export function trivia (member: GuildMember): string {
  if (isModerator(member)) {
    if (triviaMaster) {
      if (triviaMaster.id === member.id) {
        triviaMaster = null;
        return 'You stopped hosting Trivia Night';
      }
      return 'Sorry ' + triviaMaster.displayName + ' is already hosting';
    }
    else {
      triviaMaster = member;
      responses = [];
      return ('You are now Trivia Master!');
    }
  }
  return ('Tsk tsk, only mods can host Trivia Night!')
}

// how a trivia player sends a response to the bot
export function answer (member: GuildMember | User, answer: string): string {
  if (questiontime) {
    if (member instanceof GuildMember)
    { responses.push({ name: member.displayName, answer }); }
    else if (member instanceof User)
    { responses.push({ name: member.username, answer }); }
    return 'Your response has been recorded!';
  }
  return "There's no active question currently";
}
