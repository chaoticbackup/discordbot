import { GuildMember, RichEmbed } from 'discord.js';

import { isModerator } from '../common';

import command_help from './command_help.json';

/*
* "list" makes a command shows up if you type !commands or c!help
* "alias" can be used to directly link to another command
* "cmd" is not needed if "list" is not provided
* "details" is optional if "list" is provided (the bot will just show "list" if "details" isn't provided).
  If neither are provided, the accounts for that too
* Commands can be marked as "mod": true, in which case help does not appear for non moderators.
  Help for those commands will only show up in this or the main server though since I need to check for moderator
* Command with "mod": string, means it has additional moderator function and that string explains it if they are a mod
* This does not include perim help!
*/

interface command {
  cmd?: string
  list?: string
  details?: string
  alias?: string
  mod?: boolean | string
}

const commands = command_help as Record<string, command>;

/**
 * Sends info about the provided command
 */
const details = (command: command): string => {
  const cmd = (command.cmd) ? `\`\`\`md\n${command.cmd}\n\`\`\`` : '';
  if (command.details) {
    return `${cmd}${command.details}`;
  }
  else if (command.list) {
    return `${cmd}${command.list}`;
  }
  return '';
};

/**
 * Shows help for the specified command if it exists
 * @param str User input
 * @param guildMember The Guild Member (for checking if moderator)
 */
export const help_command = (str: string = '', guildMember?: GuildMember) => {
  if (str !== '') {
    if (str in commands) {
      const command = commands[str];
      if (command.mod === true && !isModerator(guildMember)) {
        return 'This command is for mods only';
      }

      let message = '';
      if (command.alias) {
        message = details(commands[command.alias]);
      }
      else {
        message = details(command);
      }

      if (message === '') {
        return "Sorry, I don't have additional information about that command";
      }

      if (typeof command.mod === 'string' && isModerator(guildMember)) {
        message += `\n${command.mod}`;
      }

      return message;
    }
    else {
      return "That's not a command I can perform";
    }
  }
  return 'Please provide a command or use ``!commands`` for a list of all commands';
};

/**
 * Returns the list of commonly useful commands
 * @param list Optional list of keys to show as a command list
 */
export const help_list = (list?: string[]) => {
  const partial = Boolean(list !== undefined && list.length > 0);
  const keys = (partial) ? list! : Object.keys(commands);

  const embed = new RichEmbed()
    .setDescription(`${commands.help.details}\n` +
      '\nI try to be helpful, but can be sassy. I may also pop in to add a quip ;)' +
      '\nYou can ask me more about specific commands ``!command <command>``.' +
      `${partial ? '' : '\nIf you want a list of all possible commands you can ask for ``!everything``'}`
    );

  const fields: string[] = [''];
  let f = 0;

  keys.forEach((key) => {
    if ('list' in commands[key]) {
      const command = commands[key];
      let message = `\n\`\`\`md\n${command.cmd}\n\`\`\``;
      if (command.list !== '') {
        message += `${command.list}\n`;
      }
      // Cannot exceded length of field
      if (fields[f].length + message.length >= 1024 - 3) {
        f++;
        fields[f] = '';
      }
      fields[f] += message;
    }
  });

  fields.forEach((field) => {
    embed.addField('\u200B', field, false);
  });

  if (partial) {
    embed.addField('\u200B', 'For my full feature set check out the main server https://discord.gg/chaotic\n');
  }

  embed.addField('Donate', '[Support the development of Chaotic BackTalk](https://www.paypal.me/ChaoticBackup)');

  return embed;
};

/**
 * Literally every command
 */
export const all_commands = (guildMember?: GuildMember) => {
  const isMod = isModerator(guildMember);
  const messages: string[] = [];

  let count = 0;
  for (const key in commands) {
    if (commands[key].mod === true && !isMod) continue;
    messages.push(key);
    count++;
  }

  messages.unshift(`Here's a list of all ${count} commands I have:`);

  return messages.join('\n');
};
