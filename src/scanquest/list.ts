import { TextChannel, Message, DMChannel } from 'discord.js';

import { BattlegearScan, ScannableBattlegear } from './scanner/Battlegear';
import { CreatureScan, ScannableCreature } from './scanner/Creature';
import { LocationScan, ScannableLocation } from './scanner/Location';
import { FieldsEmbed } from 'discord-paginationembed';
import ScanQuestDB from './scan_db';

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
    if (scan.type === 'Creatures') {
      const result = new ScannableCreature(scan as CreatureScan);
      resp.push(`${i}) ${result.toString()}`);
    }
    else if (scan.type === 'Locations') {
      const result = new ScannableLocation(scan as LocationScan);
      resp.push(`${i}) ${result.toString()}`);
    }
    else if (scan.type === 'Battlegear') {
      const result = new ScannableBattlegear(scan as BattlegearScan);
      resp.push(`${i}) ${result.toString()}`);
    }
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
