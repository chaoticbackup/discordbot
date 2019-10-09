import {Message} from 'discord.js';
const {rndrsp} = require('./common');
const {sass, tags} = require('../config/sass.json');
const {users} = require('../config/server_ids.json');

export function checkSass(message: Message, mentions: string[] ) {
  let content = message.content;

  if (mentions.length > 0)
    return checkMentions(message, mentions);

  if (content.match(/indefinitely/)) {
    return "No, the ability only lasts until the end of turn.";
  }

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/(fire|water|earth|air|element)/i)) {
      return "Creatures will regain their Scanned elements at the end of the turn";
    }
    if (content.match(/(stats|disciplines|energy)/i)) {
      return "Creature's disciplines and energy are reset to their Scanned values at the end of the turn. Any innate modifiers are reapplied.";
    }
    return "Abilities last until the end of turn unless otherwise printed on the card.";
  }

  if (content.match(/(stack\?|cumulative.*?\?)/i)) {
    const myreg = new RegExp("((elementproof|(water|fire|air|earth)(proof|[ ][0-9x]+)|intimidate(\s)?(energy|courage|wisdom|power|speed)?|(outperform|exaust)(\s)?(energy|courage|wisdom|power|speed)?|strike|swift|support|recklessness)[ ]?[0-9x]*|tarin)(.+stacks)?", "i");
    if (myreg.test(content)) {
      let match = myreg.exec(content);
      // @ts-ignore
      return "Yes, " + match[0] + " stacks.";
    }
    if (new RegExp("hive", "i").test(content)) {
      return "Abilities granted by hive stack.";
    }
    return "Does the ability contain a number? Abilities with numerical quantities are cumulative (stack).\nExamples of cumulative abilities are: Strike, Recklessness, Intimidate, Element X, Elementproof, Exhaust, Outperform, Support, and Swift";
  }

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }

}

function checkMentions(message: Message, mentions: string[]): string {
  const content = message.content;

  if (mentions.indexOf(users.afjak) !== -1)
    return ('Don\'t @ the Oracle. He sees everything anyway');

  if (mentions.indexOf(users.me) !== -1) {
    if (content.match(new RegExp(/love/, "i"))) {
      return `❤️ you too`;
    }
    else if (content.match(new RegExp(/did.+(king).+(make|create)/, "i"))) {
      return (rndrsp(tags["daddy"]));
    }
    else if (content.match(new RegExp(/who.+(made|created)/, "i"))) {
      let displayName: string;
      try {
        // @ts-ignore
        displayName = message.guild.members.get(users.daddy).displayName;
      }
      catch(err) {
        displayName = `<@${users.daddy}>`;
      }
      return `${displayName} taught me Chaotic`;
    }
    else {
      return (rndrsp(tags["hello"], 'hello'));
    }
  }

  return "";
}
