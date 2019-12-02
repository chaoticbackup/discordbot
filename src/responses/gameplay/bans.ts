import { Guild } from 'discord.js';
import { can_send, cleantext, is_channel, rndrsp, uppercase } from '../../common';
import { Channel } from '../../definitions';
import servers from '../../common/servers';

const ban_lists = require('../config/bans.json');
const {formats, watchlist, detailed, reasons, jokes} = ban_lists;

export { f as formats };

function f() {
  let message = "Community Formats:\n";

  for (let format in formats) {
    message += `**${uppercase(format)}**: ${formats[format]}\n`;
  }

  return message;
}

export function banlist(guild: Guild, channel: Channel, options: string[] = []) {
  
  if (guild && guild.id == servers("main").id) {
    if (!(is_channel(channel, "bot_commands")
      || is_channel(channel, "banlist_discussion")
      || is_channel(channel, "meta_analysis")
      )) {
        return (`I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#${servers("main").channel("bot_commands")}>?`);
      }
  }

  let message = "";

  const list_bans = (_format: string) => {
    message = `**${uppercase(_format)}:**\n${formats[_format]}\n==Banned Cards==`;
    ban_lists[_format].forEach((key: string) => {
      message += "\n" + key;
    });
  }

  // Standard
  if (options.length == 0 || options.includes("standard")) {
    list_bans("standard");
    message += "\n=====\n**Watchlist:** (not banned)"
    watchlist.forEach((key: string) => {
      message += "\n" + key;
    });
    message += "\n=====\nYou can find out why a card was banned with \"!whyban *card name*\"";
  }
  // Legacy
  else if (options.includes("legacy")) {
    message = "**Legacy**\nNo cards banned";
  }
  // Pauper
  else if (options.includes("pauper")) {
    list_bans("pauper");
  }
  // Noble
  else if (options.includes("noble")) {
    list_bans("noble");
  }
  // Modern
  else if (options.includes("modern")) {
    list_bans("modern");
  }
  else {
    message = "Not a supported format";
  }

  return message;
}

export function whyban(
  name: string, guild?: Guild, channel?: Channel, options: string[] = []
): string | undefined {
  if (guild && channel && !can_send(guild, channel)) return;
  
  if (name == "") return "Please provide a card or use !banlist";

  let cardName = cleantext(name);

  // Check if long explanation requested
  if (options.includes("detailed")) {
    if (guild && channel && guild.id == servers("main").id) {
      if (!can_send(guild, channel)) return "";
    }
    for (let key in detailed) {
      if (cleantext(key).indexOf(cardName) === 0) {
        return `*${key}*:\n${detailed[key]}`;
      }
    }
    // Check if its even banned
    for (let key in reasons) {
      if (cleantext(key).indexOf(cardName) === 0) {
        return `${key} doesn't have a more detailed explanation`;
      }
    }
    return `${name} isn't banned`;
  }

  for (let key in reasons) {
    if (cleantext(key).indexOf(cardName) === 0) {
      if (options.includes("joke")) {
        if (reasons[key].length > 1) {
          return `*${key}*:\n${rndrsp(reasons[key].slice(1, reasons[key].length), key)}`;
        }
        else {
          return "Sorry " + key + " doesn't have a joke";
        }
      }
      else {
        return `*${key}*:\n${reasons[key][0]}`;
      }
    }
  }

  for (let key in jokes) {
    if (cleantext(key).indexOf(cardName) === 0) {
      return `*${key}*:\n${rndrsp(jokes[key], key)}`;
    }
  }

  return rndrsp(["That card isn't banned", `Oh lucky you, ${name} isn't banned`]);
}


