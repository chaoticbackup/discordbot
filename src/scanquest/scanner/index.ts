import { RichEmbed, Client } from 'discord.js';
import Icons from '../../common/bot_icons';
import ScanQuestDB, { ActiveScan } from '../scan_db';
import { ScannableBattlegear, BattlegearScan } from './Battlegear';
import { ScannableCreature, CreatureScan } from './Creature';
import { ScannableLocation, LocationScan } from './Location';
import Scannable from './Scannable';
import Scanned from './Scanned';

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (guild_id: string, author_id: string, args: string): Promise<RichEmbed | string | void> => {
    const server = this.db.servers.findOne({ id: guild_id });
    if (server === null) return;

    if (server.activescans.length === 0) {
      return 'There is no scannable card';
    }

    // give or take a minute
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);

    let selected: ActiveScan | undefined;
    if (args === '') {
      while (true) {
        selected = server.activescans[server.activescans.length - 1];
        if (new Date(selected.expires) < now) {
          server.activescans.pop();
          this.db.servers.update(server);
        }
        else break;
      }
      if (server.activescans.length === 0) {
        return 'There is no scannable card';
      }
    }
    else {
      selected = server.activescans.find(scan => {
        return scan.scan.name.toLowerCase() === args;
      });
      if (
        selected === undefined
        || new Date(selected.expires) < now
      ) {
        return `${args.replace('@', '')} isn't an active scan`;
      }
    }

    const card = selected.scan;

    card.code = this.db.generateCode();

    const player = this.db.findOnePlayer({ id: author_id });
    if (!selected.players || selected.players.length === 0) {
      selected.players = [player.id];
    }
    else if (selected.players.includes(player.id)) {
      return `You've already scanned this ${card.name}`;
    } else {
      selected.players.push(player.id);
    }

    this.db.servers.update(server);
    await this.db.save(player, card);
    return toScannable(card)!.getCard(this.icons);
  }
}

export function toScannable(scan: Scanned): Scannable | undefined {
  switch (scan.type) {
    case 'Battlegear':
      return new ScannableBattlegear(scan as BattlegearScan);
    case 'Creatures':
      return new ScannableCreature(scan as CreatureScan);
    case 'Locations':
      return new ScannableLocation(scan as LocationScan);
  }
}
