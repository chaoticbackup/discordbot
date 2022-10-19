import { Message, RichEmbed, TextChannel } from 'discord.js';
import moment, { Moment } from 'moment';
import { ObjectId } from 'mongodb';

import { msgCatch, stripMention } from '../../common';
import { parseType } from '../../common/card_types';
import debug, { formatTimestamp } from '../../common/debug';
import { API } from '../../database';
import { Card } from '../../definitions';
import { ActiveScan } from '../database';
import { ScannableCreature } from '../scan_type/Creature';
import { Scannable } from '../scan_type/Scannable';

import parseExpires from './parseExpire';
import Spawner from './Spawner';

const expiresDiff = (expires: Moment) => {
  return expires.startOf('minute').diff(moment().startOf('minute'), 'minutes') / 60;
};

const cmd = "!spawn [<content>] [--fix] [--new] [--expire=<'+-|'<number>'mh' | timestamp>] [--message=<Snowflake>] [--type=<CardType>]";

export default async function (this: Spawner, message: Message, args: string[], opts: string[]): Promise<void> {
  const content = args.join(' ');
  const options = opts.join(' ').toLowerCase();

  if (options.includes('new')) {
    return await this.reroll(message);
  }

  const server = await this.db.servers.findOne({ id: message.guild.id });

  if (!server) return;

  const addIfMissing = async (scan_id: ObjectId, err = '') => {
    if (server.activescan_ids.find((id) => id === scan_id) === undefined) {
      const res = await this.db.servers.updateOne(
        { _id: server._id },
        { $push: { activescan_ids: scan_id } }
      );
      if (!res.acknowledged) throw new Error(err || "can't add scan to server activescans");
      return true;
    }
  };

  const send = (content: any) => {
    message.channel.send(content).catch(msgCatch);
  };

  // Definitions
  let regex_arr: RegExpExecArray | null = null;

  regex_arr = (/message=([\d]{2,})/).exec(options);
  const msg_id = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;
  const scan = (msg_id) ? await this.db.scans.findOne({ msg_id }) : null;

  regex_arr = (/expire=([\w.+-|]{2,})/).exec(options);
  const expire_change = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;

  regex_arr = (/type=([\w]{2,})/).exec(options);
  const card_type = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;

  /**
   * Fix Scan
   */
  if (options.includes('fix')) {
    if (!msg_id) {
      send('!spawn --fix --message=<Snowflake>');
      return;
    }
    if (scan === null) {
      send('Specified message does not have a scan');
      return;
    }

    (this.bot.channels.get(server.send_channel) as TextChannel)
    .fetchMessage(msg_id)
    .then(async (message) => {
      if (message.editable && message.embeds.length > 0) {
        await message.edit(new RichEmbed(message.embeds[0]));
      }
      if (await addIfMissing(scan._id)) {
        send('Updated existing scan');
      }
    })
    .catch((e) => {
      send('Unable to fetch specified message id');
      debug(this.bot, e, 'errors');
    });
    return;
  }

  /**
   *  Update scan's expires
   */
  if (content.length === 0 && card_type === undefined) {
    if (msg_id === null || expire_change === undefined) {
      send(cmd);
      return;
    }

    if (scan === null) {
      send('Not a valid scan message id');
      return;
    }

    const expires = parseExpires(scan.expires, expire_change);

    if (expires === false) {
      send(`${expire_change} is not a valid format`);
      return;
    }

    try {
      const res = await this.db.scans.updateOne(
        { _id: scan._id },
        { $set: { expires: expires.toDate() } }
      );
      if (!res.acknowledged) throw new Error("can't update scan");

      await addIfMissing(scan._id);
    } catch (e) {
      send('Unable to update scan in db');
      debug(this.bot, e, 'errors');
    }

    const active = expiresDiff(expires);

    await (this.bot.channels.get(server.send_channel) as TextChannel)
    .fetchMessage(msg_id!)
    .then(async (message) => {
      if (message?.editable && message.embeds.length > 0) {
        const embed = new RichEmbed(message.embeds[0]);
        this.select.setTitle(embed, active);
        await message.edit(embed);
      }
    })
    .catch((e) => {
      send('Unable to fetch specified message id');
      debug(this.bot, e, 'errors');
    });

    if (Number(active.toFixed(2)) <= 0) {
      const server = await this.db.servers.findOne({ id: message.guild.id });
      if (server) await this.cleanOldScans(server);
      send(`${scan.scan.name} updated to expire now`);
    } else {
      send(`${scan.scan.name} updated to expire at ${formatTimestamp(moment(expires.toDate()))}`);
    }

    return;
  }

  /**
   * Generate a new card
   */
  let card: Card;
  let sc: Scannable | undefined;
  let img: RichEmbed | undefined;

  const activescans = await this.db.getActiveScans(server);

  if (content.length > 0) {
    let name: string;
    let stats: string[] | undefined;
    try {
      [name, ...stats] = content.split(/ (?=[0-9]+)/);
    } catch {
      name = content.trim();
    }

    card = API.find_cards_by_name(name)[0] ?? null;

    if (!card) {
      send(`${stripMention(name)} is not a valid card`);
      return;
    }

    [sc, img] = ((): [Scannable, RichEmbed] | [] => {
      if (card.gsx$type === 'Creatures') {
        const [scannable, image] = this.select.generateFromCard(card);
        if (scannable === undefined || image === undefined) return [];
        if (stats && stats.length === 5) {
          const { card } = (scannable as ScannableCreature);
          [card.courage, card.power, card.wisdom, card.speed, card.energy] = stats.map((v) => parseInt(v));
        }
        return [scannable, image];
      }
      return this.select.generateFromCard(card);
    })();

    if (sc === undefined) {
      send(`${card.gsx$name} is not a spawnable card`);
      return;
    }
  }
  else {
    const type = parseType(card_type ?? '');
    if (type === undefined) {
      send(`${stripMention(card_type!)} is not a valid card type`);
      return;
    }
    [sc, img] = this.select.generateFromType(type, activescans);
  }

  let { scannable, image, active, next } = await this.select.card(server, sc, img);

  if (expire_change) {
    const expires = parseExpires(this.expiresToDate(active), expire_change);
    if (expires === false) {
      send(`${expire_change} is not a valid format`);
      return;
    }
    active = expiresDiff(expires);
    this.select.setTitle(image, active);
  }

  // Spawn new card
  if (!msg_id) {
    if (active > 0) {
      await this.spawnCard(server, { scannable, image, active, next });
    }
    else {
      send('Cannot spawn a new card that already expired');
    }
    return;
  }

  // Update existing scan
  (this.bot.channels.get(server.send_channel) as TextChannel)
  .fetchMessage(msg_id)
  .then(async (message) => {
    if (message.editable && message.embeds.length > 0) {
      await message.edit(image);

      try {
        const expires = this.expiresToDate(active);

        let scan_id: ObjectId;
        if (scan !== null) {
          const res = await this.db.scans.updateOne(
            { _id: scan._id },
            { $set: { expires, scan: scannable.card } }
          );
          if (!res.acknowledged) throw new Error('existing scan');
          scan_id = scan._id;
        // If unable to find existing scan, update message with a new scan
        } else {
          const res = await this.db.scans.insertOne(new ActiveScan({ scan: scannable.card, expires, msg_id }));
          if (!res.acknowledged) throw new Error('new scan');
          scan_id = res.insertedId;
        }

        await addIfMissing(scan_id, 'server scans');

        send('Updated existing scan');
      }
      catch (e) {
        send(`DB failed to update ${e.message}`);
      }
    } else {
      send('Unable to update specificed message id');
    }
  })
  .catch((e) => {
    send('Unable to fetch specified message id');
    debug(this.bot, e, 'errors');
  });
}
