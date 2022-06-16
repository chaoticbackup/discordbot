/* eslint-disable max-len */
import { Client, Message, RichEmbed } from 'discord.js';

import { is_channel, rndrsp, escape_text, msgCatch } from '../common';
import servers from '../common/servers';
import users, { isUser } from '../common/users';

import { SendFunction } from '../definitions';

import { display_card } from './card';
import { compliment, insult } from './misc/insult_compliment';

import { isMissing } from './misc/missing_cards';
import { quips, hello, rhymes } from './sass.json';

export default async function (bot: Client, message: Message, mentions: string[], send: SendFunction): Promise<void> {
  if (mentions.length > 0) return await send(checkMentions(message, mentions));

  if (message.content.substring(0, 2) === '``') return;

  const content = escape_text(message.content);

  // coming back
  const back_regex = /((.*(chaotic).*(return|(com|be).*(back)).*)|(.*news.*(reboot|rebirth).*)|(.*(announcement|update).*chaotic.*))\?/i;
  if (content.match(back_regex)) {
    const response = "Although Chaotic's return has been confirmed, these things take a lot of time. They have yet to give an official statement and we don't have any details regarding dates or specifics. We will make an announcement and ping everyone when they do.";
    const m: Message = await send(response).catch(msgCatch);
    await m.react('586395473716445184').catch(msgCatch);
    return;
  }

  // Fast way to check if card been added to recode
  const missing_regex = /is (.*) (missing (in|on)|added (in|on|to)|(?<!(added|missing)[ ])(in|on)) recode\?/i;
  if (missing_regex.test(content)) {
    const name = missing_regex.exec(content)!;
    return await send(isMissing(name[1]));
  }

  // Special case for Quebec people trying to sell
  if (message.channel.id === servers('main').channel('french')) {
    if (content.includes('vendre')) {
      const embed = new RichEmbed()
      .setDescription("[Pas de vente ou d'échanges sous peine d'être ban du serveur](https://discord.com/channels/135657678633566208/586755320962088985/662679259562639379)")
      .setTitle('Attention');
      return await send(embed);
    }
  }

  // [[cardname]]
  if (!is_channel(message, 'other_games') || !is_channel(message, 'bot_commands')) {
    let cardRgx = (/\[{2}([^\[\]]+)\]{2}/g);
    if (cardRgx.test(content)) {
      cardRgx = new RegExp(cardRgx);
      let result;
      while ((result = cardRgx.exec(content)) !== null) {
        const card = display_card(result[1].toLowerCase(), ['ability'], bot);
        if (card instanceof RichEmbed) await send(card);
      }
      return;
    }
  }

  // Redirects conversation out of spam channel
  // if (is_channel(message, "bot_commands") {
  //   return "Please use another channel for conversations"
  // }

  if (is_channel(message, 'general_chat_1')) {
    if (content.match(/want[s]?\s?(to)?\s?battle[^a-z\s]*/i)) {
      return await send(`Have you tried asking in <#${servers('main').channel('match_making')}>?`);
    }
  }

  if (content.match(/indefinitely.*?\?/)) {
    return await send('Abilities last until the end of turn unless otherwise printed on the card.');
  }

  if (content.match(/(end of combat|combat end|end of turn).*?\?/i)) {
    if (content.match(/(fire|water|earth|air|element)/i)) {
      return await send('Creatures will gain or lose elements to match their Scanned elements at the end of the turn');
    }
    if (content.match(/(stats|disciplines|energy)/i)) {
      return await send("Creature's disciplines and energy are reset to their Scanned values at the end of the turn. Any innate modifiers are reapplied.");
    }
    return await send('Abilities last until the end of turn unless otherwise printed on the card.');
  }

  if (content.match(/(stack\?|cumulative.*?\?)/i)) {
    const myreg = /((elementproof|(water|fire|air|earth)(proof|[ ]?[0-9x]+)|intimidate(s)?(energy|courage|wisdom|power|speed)?|(outperform|exaust)(s)?(energy|courage|wisdom|power|speed)?|strike|swift|support|recklessness)[ ]?[0-9x]*|tarin)(.+stacks)?/i;
    if (myreg.test(content)) {
      const match = myreg.exec(content)!;
      return await send(`Yes, ${match[0].trim()} stacks.`);
    }
    if (/hive/i.test(content)) {
      return await send('Abilities granted by hive stack.');
    }
    return await send('Does the ability contain a number? Abilities with numerical quantities are cumulative (stack).\nExamples of cumulative abilities are: Strike, Recklessness, Intimidate, Element X, Elementproof, Exhaust, Outperform, Support, and Swift');
  }

  for (const key in quips) {
    if (content.match(new RegExp(key, 'i'))) {
      return await send(rndrsp(quips[key]));
    }
  }
}

function checkMentions(message: Message, mentions: string[]): string | undefined {
  const content = message.content.replace(`<@!${users('me')}>`, '');

  if (mentions.includes(users('afjak'))) {
    if (message.channel.id === servers('main').channel('ruling_questions')) return;
    return ('Don\'t @ the Oracle. He sees everything anyway');
  }

  if (mentions.includes(users('me'))) {
    if (content.length === 0) {
      return (rndrsp(rhymes, 'rhymes'));
    }

    if (/rule 34/i.test(content)) {
      return '<:cerbie_bonk:833781431842897991>';
    }
    if (/hate/i.test(content)) {
      return insult([message.author.id], message.author.username, message.guild);
    }
    if (/love/i.test(content)) {
      return '❤️ you too';
    }
    if (/thank(s)*([ ]you)*/i.test(content)) {
      return 'You are welcome';
    }
    if (/sorry/i.test(content)) {
      if (isUser(message, 'brat')) {
        return "I'll forgive you, if you stop annoying me";
      }
      return 'I forgive you';
    }
    if (/did.+(king).+(make|create)/i.test(content)) {
      const responses = ['Yeah he did!', "He's the best dad!", '*big smile*', 'Sometimes I give him a hard time'];
      return rndrsp(responses);
    }
    if (/who.+(made|created)/i.test(content)) {
      let displayName: string | null = message.guild.members.get(users('daddy'))?.displayName ?? null;
      if (displayName === null) {
        displayName = `<@${users('daddy')}>`;
      }
      return `${displayName} taught me Chaotic`;
    }

    if (isUser(message, 'brat')) {
      if ((/((nee|nii)-chan)|baka/i).test(content)) {
        return 'Thank you weeb';
      } else {
        const responses = ["Yes? Oh… it's you", 'Stop bothering me', 'So is this what having a younger brother is like?', "Dad, he's picking on me", 'Sigh, here we go again'];
        return rndrsp(responses);
      }
    }
    else if (isUser(message, 'bf')) {
      return compliment([users('bf')], '', message.guild);
    }
    else if (isUser(message, 'ferric')) {
      const responses = ["How's the dam coming along?", 'Is it raining cool beavers?'];
      return rndrsp(responses);
    }

    return rndrsp(hello, 'hello');
  }
}
