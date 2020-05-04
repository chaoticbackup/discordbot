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
    fs.writeFileSync(cupid_loc, '[]')
  }

  const data = fs.readFileSync(path.join(db_path, 'cupid.json'))
  let arrows = JSON.parse(data.toString()) as string[];

  if (args.length > 0 && args[0] === 'list') {
    if (arrows.length > 0) {
      let msg = '';
      arrows.forEach((arrow) => {
        msg = msg + (`${guild.members.get(arrow)!.displayName}\n` ?? '');
      })
      return msg;
    }
    else {
      return 'No one is looking for a match';
    }
  }
  else {
    let msg = '';
    if (arrows.includes(member.id)) {
      arrows = arrows.filter(arrow => arrow !== member.id);
      msg = 'You are no longer looking for a match';
    }
    else {
      if (arrows.length > 0) {
        arrows.forEach((arrow) => {
          msg += `<@!${arrow}> `;
        })
      }
      else {
        msg = 'You are looking for a match';
      }
      arrows.push(member.id);
    }
    fs.writeFileSync(cupid_loc, JSON.stringify(arrows));
    return msg;
  }
}
