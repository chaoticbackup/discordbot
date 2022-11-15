/* eslint-disable max-len */
import { Client, Message, RichEmbed, Snowflake } from 'discord.js';

import { is_channel, rndrsp, escape_text, msgCatch } from '../common';
import servers from '../common/servers';
import users, { isUser } from '../common/users';

import { SendFunction } from '../definitions';

import { display_card } from './card';
import { compliment, insult } from './misc/insult_compliment';

import { isMissing } from './misc/missing_cards';
import { quips, hello, jingles, user, hbu } from './sass_options';

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
    if (new RegExp(key, 'i').test(message.content)) {
      return await send(rndrsp(quips[key]));
    }
  }
}

function checkMentions(message: Message, mentions: string[]): string | undefined {
  const content = message.content.replace(`<@${users('me')}>`, '');

  if (mentions.includes(users('afjak'))) {
    if (message.channel.id === servers('main').channel('ruling_questions')) return;
    return ('Don\'t @ the Oracle. He sees everything anyway');
  }

  if (mentions.includes(users('me'))) {
    if (content.length === 0) {
      return rndrsp(jingles, 'jingles');
    }

    if (/hello/i.test(content)) {
      return rndrsp(hello.friendly.slice(0, 2));
    }
    if (/(how[’']s nicole)|(how are you)/i.test(content)) {
      return rndrsp(hbu);
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
    if (/who.+(made|created)/i.test(content)) {
      let displayName: string | null = message.guild.members.get(users('daddy'))?.displayName ?? null;
      if (displayName === null) {
        displayName = `<@${users('daddy')}>`;
      }
      return rndrsp([`${displayName} taught me Chaotic`, `${displayName} the best dad!`, `${displayName}, but sometimes I give him a hard time`]);
    }

    if (isUser(message, 'brat')) {
      if ((/((nee|nii)-chan)|baka/i).test(content)) {
        return 'Thank you weeb';
      } else {
        return rndrsp(user.brat);
      }
    }
    else if (isUser(message, 'bf')) {
      return compliment([users('bf')], '', message.guild);
    }
    else if (isUser(message, 'ferric')) {
      return rndrsp(user.ferric);
    }
    else if (isUser(message, 'chio')) {
      return rndrsp(user.chio);
    }
    else if (isUser(message, 'daddy')) {
      return rndrsp(user.daddy);
    }

    return randomHello.hello(message);
  }
}

const moods = Object.keys(hello);
class Hello {
  sr: Map<Snowflake, { mood: keyof typeof hello, responses: string[], timeout?: NodeJS.Timeout }> = new Map();

  hello = (message: Message) => {
    const { id } = message.author;
    let mood;
    let resp;

    if (!this.sr.has(id)) {
      mood = rndrsp(moods) as any;
      this.sr.set(id, { mood, responses: [] });
    }

    let t = this.sr.get(id)!;

    clearTimeout(t.timeout);

    if (t.responses.length >= hello[t.mood].length || t.responses.length > 4) {
      switch (t.mood) {
        case 'mean':
          resp = "Sorry, I'll be nicer now!";
          break;
        case 'friendly':
          break;
        case 'silly':
          resp = 'Alright, phew got that out of me';
          break;
        case 'away':
          resp = 'Chaotic Nicole is brought to you by <http://chaoticbackup.forumotion.com/>';
          break;
      }
      mood = rndrsp(moods.filter((v) => v !== t.mood)) as any;
      t = { mood, responses: [] };
      this.sr.set(id, t);
    }

    if (resp) return resp;

    const list = hello[t.mood].filter(v => !t.responses.includes(v));

    const rand = Math.floor(Math.random() * list.length);
    resp = list[rand];

    t.responses.push(resp);

    t.timeout = setTimeout(
      () => {
        this.sr.delete(id);
      },
      30 * 1000
    );

    this.sr.set(id, t);

    return resp;
  };
}

const randomHello = new Hello();
