import { Channel } from '../definitions';
import { Guild } from 'discord.js';
import { rndrsp, cleantext, is_channel, can_send } from './../common';

const {servers} = require("../../config/server_ids.json");
const {bans, watchlist, detailed, reasons,
  jokes, pauper, noble, modern} = require('../../config/bans.json');

export function banlist(guild: Guild, channel: Channel, options: string[] = []) {
  
  if (guild && guild.id == servers.main.id) {
    if (!(is_channel("main", channel, "bot_commands")
      || is_channel("main", channel, "banlist_discussion")
      || is_channel("main", channel, "meta_analysis")
      )) {
        return (`I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#${servers.main.channels.bot_commands}>?`);
      }
  }

  let message = "";

  // Standard
  if (options.length == 0) {
    message = "**Community Ban List:**\n=====";
    bans.forEach((key: string) => {
      message += "\n" + key;
    });
    message += "\n=====\n**Watchlist:** (not banned)"
    watchlist.forEach((key: string) => {
      message += "\n" + key;
    });
    message += "\n=====\nYou can find out why a card was banned with \"!whyban *card name*\"";
  }
  // Pauper
  else if (options.includes("pauper")) {
    message = "**Pauper (Commons and Uncommons)**\nBanned Cards:\n====="
    pauper.forEach((key: string) => {
      message += "\n" + key;
    });
  }
  // Nobel
  else if (options.includes("nobel")) {
    message = "**Noble (Commons, Uncommons, and Rares)**\nBanned Cards:\n====="
    noble.forEach((key: string) => {
      message += "\n" + key;
    });
  }
  // Modern
  else if (options.includes("modern")) {
    message = "**Modern**\n(M'arrillian Invasion, Secrets of the Lost City, Organized Play, League Rewards)\nBanned Cards:\n=====";
    modern.forEach((key: string) => {
      message += "\n" + key;
    });
  }

  return message;
}

export function whyban(
  name: string, guild?: Guild, channel?: Channel, options: string[] = []
): string {
  if (name == "") return "Please provide a card or use !banlist";

  let cardName = cleantext(name);

  // Check if long explaination requested
  if (options.includes("detailed")) {
    if (guild && channel && guild.id == servers.main.id) {
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
        return `${key} doesn't have a more detailed explaination`;
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


