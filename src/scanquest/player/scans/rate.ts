import ScanQuestDB from '../../scan_db';
import { Message, Client } from 'discord.js';
import { ScannableCreature } from '../../scanner/Creature';
import rate from '../../../responses/rate';
import { toScannable } from '../../scanner';

export default function (db: ScanQuestDB, message: Message, args: string[], options: string[], bot: Client) {
  if (args.length > 0) {
    const index = parseInt(args[0]);
    if (!isNaN(index) && index >= 0) {
      const player = db.findOnePlayer({ id: message.author.id });
      if (player.scans.length <= index) {
        return `Scan ID must be within your number of scans (${player.scans.length - 1})`;
      }
      const scan = toScannable(player.scans[index]);
      if (scan instanceof ScannableCreature) {
        return rate(scan.toString(), options, bot);
      } else {
        return `${scan!.card.name} is not a Creature`;
      }
    }
  }
}
