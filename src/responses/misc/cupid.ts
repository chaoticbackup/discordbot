import fs from 'fs-extra';
import path from 'path';
import db_path from '../../database/db_path';
import { Message } from 'discord.js';
import servers from '../../common/servers';

const channel_id = process.env.NODE_ENV !== 'development'
  ? servers('main').channel('cupid')
  : servers('develop').channel('bot_commands');

export default function (args: string[], message: Message) {
  const { guild, author: member, channel } = message;

  if (channel.id !== channel_id) return;

  const cupid_loc = path.join(db_path, 'cupid.json');
  if (!fs.existsSync(cupid_loc)) {
    fs.writeFileSync(cupid_loc, '[]');
  }

  const data = fs.readFileSync(path.join(db_path, 'cupid.json'));
  let arr = JSON.parse(data.toString()) as string[];

  if (args.length > 0 && args[0] === 'list') {
    if (arr.length > 0) {
      let msg = '';
      arr.forEach((arrow) => {
        msg = msg + (`${guild.members.get(arrow)!.displayName}\n` ?? '');
      });
      return msg;
    }
    else {
      return 'No one is looking for a match';
    }
  }
  else if (args.length > 0) {
    if (args[0] === 'stop') {
      if (arr.includes(member.id)) {
        arr = arr.filter(arrow => arrow !== member.id);
        fs.writeFileSync(cupid_loc, JSON.stringify(arr));
        return 'You are no longer looking for a match';
      }
    }
    else {
      return 'Use `!cupid stop` to stop looking for a match';
    }
  }
  else {
    let msg = '';

    if (arr.length > 0) {
      arr.forEach((arrow) => {
        msg += `<@!${arrow}> `;
      });
    }
    else {
      msg = 'You are looking for a match';
    }
    if (!arr.includes(member.id)) arr.push(member.id);

    fs.writeFileSync(cupid_loc, JSON.stringify(arr));
    return msg;
  }
}
