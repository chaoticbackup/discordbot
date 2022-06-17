import { Client, RichEmbed, Snowflake } from 'discord.js';
import moment from 'moment';

import { stripMention } from '../../common';
import Icons from '../../common/bot_icons';
import { API } from '../../database';
import { first_scan } from '../config/help';
import ScanQuestDB, { ActiveScan, Player } from '../database';
import { toScannable } from '../scan_type/toScannable';

import {
  ALL_SCANS, ALREADY_SCANNED, ERROR_ACTIVESCAN, ERROR_CODE, ERROR_LOADING_SCAN, NOT_ACTIVE, NO_LONGER_ACTIVE, NO_SCANS, SCANNED
} from './ErrorMessages';

type ReturnArray = [string, ...Array<string | RichEmbed>];

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (player: Player, guild_id: Snowflake, args: string): Promise<string | ReturnArray> => {
    const server = await this.db.servers.findOne({ id: guild_id });

    if (!server) {
      throw new Error(ERROR_LOADING_SCAN);
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
        return [ALL_SCANS, `<@${player.id}>`];
      }

      if (selected === undefined) {
        return NO_SCANS;
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
              return [ALREADY_SCANNED, name];
            } else {
              return [NO_LONGER_ACTIVE, name];
            }
          }
        }
      }

      if (selected === undefined) {
        return [NOT_ACTIVE, `${name || stripMention(args)}`];
      }
    }

    if (selected === undefined) {
      return ERROR_LOADING_SCAN;
    }

    const scan_idx = activescans.findIndex(scan => scan.msg_id === selected!.msg_id);

    let res = await this.db.servers.updateOne(
      { id: server.id },
      {
        $push: { [`activescans.${scan_idx}.players`]: player.id }
      }
    );

    if (!res.acknowledged) {
      return ERROR_ACTIVESCAN;
    }

    const card = Object.assign({}, selected.scan); // clone card to assign code
    card.code = await this.db.generateCode();
    res = await this.db.save(player, card);

    if (!res.acknowledged) {
      return ERROR_CODE;
    }

    const response: ReturnArray = [
      SCANNED,
      toScannable(card)!.getCard(this.icons)
    ];

    if (player.scans.length <= 1) {
      response.push(first_scan(server.send_channel));
    }

    return response;
  };
}
