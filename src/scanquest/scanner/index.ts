import { RichEmbed, Client } from 'discord.js';
import Icons from '../../common/bot_icons';
import ScanQuestDB, { ActiveScan } from '../scan_db';

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (guild_id: string, author_id: string, args: string): Promise<RichEmbed | string | undefined> => {
    const server = this.db.servers.findOne({ id: guild_id });
    if (server === null) return;

    if (server.activescans.length === 0) {
      return 'There is no scannable card';
    }

    let selected: ActiveScan | undefined;
    if (args === '') {
      selected = server.activescans[server.activescans.length - 1];
    }
    else {
      selected = server.find(args);
      if (!selected) {
        return `${args} isn't an active scan`;
      }
    }

    const scannable = selected.scannable;
    const card = scannable.card;
    card.code = this.db.generateCode();

    if ((await this.db.save(author_id, card)) !== null) {
      return scannable.getCard(this.icons);
    }

    return `You've already scanned this ${card.name}`;
  }
}
