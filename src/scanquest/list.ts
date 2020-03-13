import { TextChannel, Message, DMChannel } from 'discord.js';
import { FieldsEmbed } from 'discord-paginationembed';
import ScanQuestDB from './scan_db';
import { toScannable } from './scanner';

export default async (db: ScanQuestDB, message: Message, options: string[]): Promise<void> => {
  // If not dm or recieve channel
  if (
    !(
      message.channel instanceof DMChannel ||
      (message.guild && db.is_receive_channel(message.guild.id, message.channel.id))
    )
  ) return Promise.resolve();

  const player = db.findOnePlayer({ id: message.author.id });
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
  .setAuthorizedUsers([message.author.id])
  .setChannel(message.channel as (TextChannel | DMChannel))
  .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
  .setPageIndicator(true)
  .setArray(resp)
  .formatField('Scans', el => el);

  return Pagination.build();
}
