import { TextChannel, Message, DMChannel } from 'discord.js';
import { FieldsEmbed } from 'discord-paginationembed';
import ScanQuestDB from './scan_db';
import { toScannable } from './scanner';
import users from '../common/users';

export default async (db: ScanQuestDB, message: Message, options: string[]): Promise<void> => {
  // If not dm or recieve channel
  if (
    !(
      message.channel instanceof DMChannel ||
      (message.guild && (
        db.is_receive_channel(message.guild.id, message.channel.id) ||
        message.member.hasPermission('ADMINISTRATOR'))
      )
    )
  ) return;

  const ids = [message.author.id];
  let player;

  let user: RegExpExecArray | null;
  if (options.length > 0 && message.author.id === users('daddy') &&
    (user = (/user=([\w]{2,})/).exec(options.join(' ')))) {
    ids.push(user[1]);
    const p = db.players.findOne({ id: ids[1] });
    if (p) player = p;
    else return;
  } else {
    player = db.findOnePlayer({ id: ids[0] });
  }

  if (player.scans.length === 0) {
    message.channel.send('You have no scans').catch(() => {});
    return;
  }

  const resp: string[] = [];
  player.scans.forEach((scan, i) => {
    const scannable = toScannable(scan);
    if (scannable) resp.push(`${i}) ${scannable.toString()}`);
  });

  const Pagination = new FieldsEmbed<string>()
  .setAuthorizedUsers(ids)
  .setChannel(message.channel as (TextChannel | DMChannel))
  .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
  .setPageIndicator(true)
  .setArray(resp)
  .formatField('Scans', el => el);

  return await Pagination.build();
}
