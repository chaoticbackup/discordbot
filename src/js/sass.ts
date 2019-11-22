import {SendFunction} from './definitions';
import {Client, Message, RichEmbed} from 'discord.js';
import {rndrsp, can_send, is_channel} from './common';
import {whyban} from './gameplay/bans';
import {display_card} from './database/card';
const {sass, tags} = require('../config/sass.json');
const {users, servers} = require('../config/server_ids.json');

export async function checkSass(bot: Client, message: Message, mentions: string[], send: SendFunction ): Promise<void> {

  if (mentions.length > 0) return send(checkMentions(message, mentions));

  const content = message.content;

  // #ban
  if (content.substring(0, 4).toLowerCase() == "#ban") {
    let name = (content.charAt(5) == " ") ? content.substring(6) : content.substring(5);
    return send(whyban(name));
  }

  // [[cardname]]
  if (message.channel.id !== servers.main.channels.other_games
    && message.channel.id !== servers.main.channels.bot_commands
    ) {
    let cardRgx = (/\[{2}(.*?)\]{2}/g);
    if (cardRgx.test(content)) {
      cardRgx = new RegExp(cardRgx);
      let result;
      while ((result = cardRgx.exec(content)) !== null) {
        let card = display_card(result[1].toLowerCase(), ["text"], bot);
        if (card instanceof RichEmbed) send(card);
      }
      return;
    }
  }

  // if (is_channel("main", message.channel, "bot_commands") {
  //   return "Please use another channel for conversations"
  // }

  if (content.match(/indefinitely.*?\?/)) {
    return send("Abilities last until the end of turn unless otherwise printed on the card.");
  }

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/(fire|water|earth|air|element)/i)) {
      return send("Creatures will regain their Scanned elements at the end of the turn");
    }
    if (content.match(/(stats|disciplines|energy)/i)) {
      return send("Creature's disciplines and energy are reset to their Scanned values at the end of the turn. Any innate modifiers are reapplied.");
    }
    return send("Abilities last until the end of turn unless otherwise printed on the card.");
  }

  if (content.match(/(stack\?|cumulative.*?\?)/i)) {
    const myreg = new RegExp("((elementproof|(water|fire|air|earth)(proof|[ ][0-9x]+)|intimidate(\s)?(energy|courage|wisdom|power|speed)?|(outperform|exaust)(\s)?(energy|courage|wisdom|power|speed)?|strike|swift|support|recklessness)[ ]?[0-9x]*|tarin)(.+stacks)?", "i");
    if (myreg.test(content)) {
      let match = myreg.exec(content);
      // @ts-ignore
      return send("Yes, " + match[0] + " stacks.");
    }
    if (new RegExp("hive", "i").test(content)) {
      return send("Abilities granted by hive stack.");
    }
    return send("Does the ability contain a number? Abilities with numerical quantities are cumulative (stack).\nExamples of cumulative abilities are: Strike, Recklessness, Intimidate, Element X, Elementproof, Exhaust, Outperform, Support, and Swift");
  }

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return send(rndrsp(sass[key]));
  }

}

function checkMentions(message: Message, mentions: string[]): string | undefined {
  const content = message.content;

  if (mentions.indexOf(users.afjak) !== -1) {
    if (message.channel.id === servers.main.ruling_questions) return;
    return ('Don\'t @ the Oracle. He sees everything anyway');
  }
    

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

  return;
}
