/* eslint-disable max-len */
import { Client, Message, RichEmbed } from 'discord.js';
import { is_channel, rndrsp, escape_text } from '../common';
import servers from '../common/servers';
import users from '../common/users';

import { compliment } from './misc/insult_compliment';
import { SendFunction } from '../definitions';
import { display_card } from './card';
import { whyban } from './game/bans';

type s = Record<string, string[]>;

const { sass, tags } = require('./config/sass.json') as {sass: s, tags: s};

export default async function (bot: Client, message: Message, mentions: string[], send: SendFunction): Promise<void> {
  if (mentions.length > 0) return await send(checkMentions(message, mentions));

  if (message.content.substring(0, 2) === '``') return;

  const content = escape_text(message.content);

  // coming back
  const back_regex = new RegExp(/((.*(chaotic).*(return|(com|be).*(back)).*)|(.*news.*(reboot|rebirth).*)|(.*(announcement|new|update).*chaotic.*))\?/, 'i');
  if (content.match(back_regex)) {
    const response = "Although it's basically been confirmed, these things take a lot of time, and the news got out before they were ready for an actual announcement. We will make an announcment and ping everyone when they do.";
    return await send(response).then((message: Message) => {
      message.react('586395473716445184').catch((err) => { console.log(err) });
    });
  }

  // #ban
  if (content.substring(0, 4).toLowerCase() === '#ban') {
    const name = (content.charAt(5) === ' ') ? content.substring(6) : content.substring(5);
    return await send(whyban(name));
  }

  // [[cardname]]
  if (message.channel.id !== servers('main').channel('other_games')
    && message.channel.id !== servers('main').channel('bot_commands')
  ) {
    let cardRgx = (/\[{2}(.*?)\]{2}/g);
    if (cardRgx.test(content)) {
      cardRgx = new RegExp(cardRgx);
      let result;
      while ((result = cardRgx.exec(content)) !== null) {
        const card = display_card(result[1].toLowerCase(), ['ability'], bot);
        if (card instanceof RichEmbed) send(card).catch(() => {});
      }
      return;
    }
  }

  // if (is_channel(message, "bot_commands") {
  //   return "Please use another channel for conversations"
  // }

  if (is_channel(message, 'general_chat_1')) {
    if (content.match(/want[s]?\s?(to)?\s?battle[^a-z\s]*/i)) {
      return await send(`Have you tried asking in <#${servers('main').channel('match_making')}>?`)
    }
  }

  if (content.match(/indefinitely.*?\?/)) {
    return await send('Abilities last until the end of turn unless otherwise printed on the card.');
  }

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/(fire|water|earth|air|element)/i)) {
      return await send('Creatures will regain their Scanned elements at the end of the turn');
    }
    if (content.match(/(stats|disciplines|energy)/i)) {
      return await send("Creature's disciplines and energy are reset to their Scanned values at the end of the turn. Any innate modifiers are reapplied.");
    }
    return await send('Abilities last until the end of turn unless otherwise printed on the card.');
  }

  if (content.match(/(stack\?|cumulative.*?\?)/i)) {
    const myreg = new RegExp('((elementproof|(water|fire|air|earth)(proof|[ ][0-9x]+)|intimidate(\s)?(energy|courage|wisdom|power|speed)?|(outperform|exaust)(\s)?(energy|courage|wisdom|power|speed)?|strike|swift|support|recklessness)[ ]?[0-9x]*|tarin)(.+stacks)?', 'i');
    if (myreg.test(content)) {
      const match = myreg.exec(content);
      // @ts-ignore
      return await send(`Yes, ${match[0]} stacks.`);
    }
    if (new RegExp('hive', 'i').test(content)) {
      return await send('Abilities granted by hive stack.');
    }
    return await send('Does the ability contain a number? Abilities with numerical quantities are cumulative (stack).\nExamples of cumulative abilities are: Strike, Recklessness, Intimidate, Element X, Elementproof, Exhaust, Outperform, Support, and Swift');
  }

  for (const key in sass) {
    if (content.match(new RegExp(key, 'i'))) {
      return await send(rndrsp(sass[key]));
    }
  }
}

function checkMentions(message: Message, mentions: string[]): string | undefined {
  const content = message.content;

  if (mentions.includes(users('afjak'))) {
    if (message.channel.id === servers('main').channel('ruling_questions')) return;
    return ('Don\'t @ the Oracle. He sees everything anyway');
  }

  if (mentions.includes(users('me'))) {
    if (message.author.id === users('brat')) {
      return rndrsp(tags.brat);
    }
    else if (message.author.id === users('bf')) {
      return compliment(message.guild, [users('bf')], '');
    }
    else if (content.match(new RegExp(/love/, 'i'))) {
      return '❤️ you too';
    }
    else if (content.match(new RegExp(/did.+(king).+(make|create)/, 'i'))) {
      return (rndrsp(tags.daddy));
    }
    else if (content.match(new RegExp(/who.+(made|created)/, 'i'))) {
      let displayName: string | null = message.guild.members.get(users('daddy'))!.displayName;
      if (displayName === null) {
        displayName = `<@${users('daddy')}>`;
      }
      return `${displayName} taught me Chaotic`;
    }
    else {
      return (rndrsp(tags.hello, 'hello'));
    }
  }
}
