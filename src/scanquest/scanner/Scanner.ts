import { Message, Client, Snowflake } from 'discord.js';
import moment from 'moment';

import { stripMention } from '../../common';
import Icons from '../../common/bot_icons';
import { API } from '../../database';
import { SendFunction } from '../../definitions';
import { first_scan } from '../config/help';
import ScanQuestDB, { ActiveScan, Player } from '../database';
import { toScannable } from '../scan_type/toScannable';

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (player: Player, guild_id: Snowflake, args: string, send: SendFunction): Promise<Message | undefined> => {
    const server = await this.db.servers.findOne({ id: guild_id });

    if (!server) {
      await send('Error loading active scans');
      return;
    }

    const { activescans } = server;

    // give or take a minute
    const now = moment().subtract(1, 'minute');

    let selected: ActiveScan | undefined;
    if (args === '') {
      let i = 0;
      let all = false;
      while (i < activescans.length) {
        selected = activescans[i];
        i++;

        if (moment(selected.expires).isSameOrBefore(now)) {
          selected = undefined;
          continue;
        }

        if (selected.players.includes(player.id)) {
          all = true;
        } else {
          all = false;
          break;
        }
      }

      if (all) {
        await send('You\'ve scanned all active scans');
        return;
      }

      if (selected === undefined) {
        await send('There is no active scans');
        return;
      }
    }
    else {
      const name: string | undefined = API.find_cards_ignore_comma(args)[0]?.gsx$name ?? undefined;

      if (name) {
        const name_match = activescans.filter(scan => scan.scan.name === name);
        if (name_match.length > 0) {
          let already = false;
          for (const match of name_match) {
            if (match.players.includes(player.id)) {
              already = true;
              continue;
            }
            else if (moment(match.expires).isBefore(now)) {
              continue;
            }
            else {
              selected = match;
              already = false;
              break;
            }
          }
          if (selected === undefined) {
            // If we don't have an active scan its because its either been scanned or expired
            if (already) {
              await send(`You've already scanned this ${name}`);
              return;
            } else {
              await send(`${name} is no longer active`);
              return;
            }
          }
        }
      }

      if (selected === undefined) {
        await send(`${name || stripMention(args)} isn't an active scan`);
        return;
      }
    }

    if (selected === undefined) {
      await send('Error loading scan');
      return;
    }

    const scan_idx = activescans.findIndex(scan => scan.msg_id === selected!.msg_id);

    let res = await this.db.servers.updateOne(
      { id: server.id },
      {
        $push: { [`activescans.${scan_idx}.players`]: player.id }
      }
    );

    if (!res.acknowledged) {
      await send('Unable to update activescan');
      return;
    }

    const card = Object.assign({}, selected.scan); // clone card to assign code
    card.code = await this.db.generateCode();
    res = await this.db.save(player, card);

    if (!res.acknowledged) {
      await send('Unable to generate code');
      return;
    }

    const m = await send(toScannable(card)!.getCard(this.icons));

    if (player.scans.length <= 1) {
      await send(first_scan(server.send_channel));
    }

    return m;
  };
}
