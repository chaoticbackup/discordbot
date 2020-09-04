import { Message, Client } from 'discord.js';
import moment from 'moment';
import { API } from '../../database';
import Icons from '../../common/bot_icons';
import ScanQuestDB, { ActiveScan } from '../database';
import { SendFunction } from '../../definitions';
import { toScannable } from '../scan_type/toScannable';
import { first_scan } from '../database/help';

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (message: Message, args: string, send: SendFunction): Promise<Message | void> => {
    const guild_id = message.guild.id;
    const author_id = message.author.id;

    const server = this.db.servers.findOne({ id: guild_id });
    if (server === null) return;

    if (server.activescans.length === 0) {
      return await send('There is no scannable card');
    }

    const player = this.db.findOnePlayer({ id: author_id });

    // give or take a minute
    const now = moment().subtract(1, 'minute');

    let selected: ActiveScan | undefined;
    if (args === '') {
      let i = 1;
      let all = false;
      while (i <= server.activescans.length) {
        selected = server.activescans[server.activescans.length - i];
        i++;

        if (moment(selected.expires).isBefore(now)) {
          selected = undefined;
          continue;
        }

        if (!selected.players || selected.players.length === 0) {
          all = false;
          break;
        } else if (selected.players.includes(player.id)) {
          all = true;
        }
      }

      if (all) {
        return await send('You\'ve scanned all active cards');
      }

      if (selected === undefined) {
        return await send('There is no scannable card');
      }
    }
    else {
      const name = API.find_cards_by_name(args)[0]?.gsx$name ?? null;
      if (name) {
        selected = server.activescans.find(scan => scan.scan.name === name);
      }

      if (selected === undefined) {
        await send(`${name || args.replace('@', '')} isn't an active scan`);
        return;
      }
      if (moment(selected.expires).isBefore(now)) {
        await send(`${name} is no longer active`);
        return;
      }
    }

    if (selected.players.includes(player.id)) {
      await send(`You've already scanned this ${selected.scan.name}`);
      return;
    } else {
      selected.players.push(player.id);
    }
    this.db.servers.update(server);

    const card = Object.assign({}, selected.scan); // clone card to assign code
    card.code = this.db.generateCode();
    await this.db.save(player, card);

    const m = await send(toScannable(card)!.getCard(this.icons));

    if (player.scans.length <= 1) {
      await send(first_scan(server.send_channel));
    }

    return m;
  };
}
