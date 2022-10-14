import { Message, RichEmbed, TextChannel } from 'discord.js';
import moment, { Moment } from 'moment';
import { ObjectId, UpdateResult } from 'mongodb';

import { isUser, msgCatch, stripMention } from '../../common';
import { parseType } from '../../common/card_types';
import debug, { formatTimestamp } from '../../common/debug';
import { API } from '../../database';
import { Card } from '../../definitions';
import { ActiveScan } from '../database';
import { ScannableCreature } from '../scan_type/Creature';
import { Scannable } from '../scan_type/Scannable';

import Spawner from './Spawner';

const parseExpires = (oldExpires: Date, change: string): false | Moment => {
  let newExpires: Moment | undefined;
  let set: 'add' | 'sub' | undefined;

  if (change.startsWith('+')) {
    set = 'add';
  }
  else if (change.startsWith('-')) {
    set = 'sub';
  }

  try {
    if (set === undefined) {
      if (change === 'now') {
        newExpires = moment();
      }
      else {
        const t = moment(change);
        if (t.isValid()) {
          newExpires = t;
        }
      }
    }
    else {
      const regex_arr = (/[+-](\d+[.]?\d?)[hm]?/).exec(change);
      if (regex_arr && regex_arr.length > 1) {
        const num = regex_arr[1];
        if (change.endsWith('m')) {
          if (set === 'add') {
            newExpires = moment(oldExpires).add(num, 'minutes');
          }
          else {
            newExpires = moment(oldExpires).subtract(num, 'minutes');
          }
        }
        else {
          if (set === 'add') {
            newExpires = moment(oldExpires).add(num, 'hours');
          }
          else {
            newExpires = moment(oldExpires).subtract(num, 'hours');
          }
        }
      }
    }
  }
  catch {
    return false;
  }

  if (newExpires === undefined) {
    return false;
  }

  return newExpires;
};

const expiresDiff = (expires: Moment) => {
  return expires.startOf('minute').diff(moment().startOf('minute'), 'hours');
};

const cmd = '!spawn <content> --expire=[+/-<number>m/h | timestamp] --message=[Snowflake] --type=[CardType] --fix';
export default async function (this: Spawner, message: Message, args: string[], opts: string[]): Promise<void> {
  const server = await this.db.servers.findOne({ id: message.guild.id });

  if (!server) return;

  const content = args.join(' ');
  const options = opts.join(' ').toLowerCase();

  let regex_arr: RegExpExecArray | null = null;

  regex_arr = (/message=([\d]{2,})/).exec(options);
  const msg_id = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;
  const scan = (msg_id) ? await this.db.scans.findOne({ msg_id }) : null;

  const addIfMissing = async (scan_id: ObjectId, err = '') => {
    if (server.activescan_ids.find((id) => id === scan_id) === undefined) {
      const res = await this.db.servers.updateOne(
        { _id: server._id },
        { $push: { activescan_ids: scan_id } }
      );
      if (!res.acknowledged) throw new Error(err || "can't add scan to server activescans");
    }
  };

  if (options.includes('fix')) {
    if (!msg_id) {
      message.channel.send('!spawn --fix --message=[Snowflake]').catch(msgCatch);
      return;
    }
    if (scan === null) {
      message.channel.send('message does not have a scan').catch(msgCatch);
      return;
    }
    (this.bot.channels.get(server.send_channel) as TextChannel)
    .fetchMessage(msg_id)
    .then(async (message) => {
      if (isUser(message, 'me') && message.editable && message.embeds.length > 0) {
        await message.edit(new RichEmbed(message.embeds[0]));
      }
      await addIfMissing(scan._id);
    })
    .catch((e) => {
      message.channel.send('Unable to fetch specified message id').catch(msgCatch);
      debug(this.bot, e, 'errors');
    });
    return;
  }

  regex_arr = (/expire=([\w.+-]{2,})/).exec(options);
  const expire_change = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;

  regex_arr = (/type=([\w]{2,})/).exec(options);
  const card_type = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;

  // Update existing card's expires
  if (content.length === 0 && card_type === undefined) {
    if (scan !== null && expire_change !== undefined) {
      const expires = parseExpires(scan.expires, expire_change);

      if (expires === false) {
        message.channel.send(`${expire_change} is not a valid format`).catch(msgCatch);
        return;
      }

      try {
        const res = await this.db.scans.updateOne(
          { _id: scan._id },
          { $set: { expires: expires.toDate() } }
        );

        if (!res.acknowledged) throw new Error("can't update scan");

        // If unable to find existing scan (probably broke)
        await addIfMissing(scan._id);

        const active = expiresDiff(expires);

        await (this.bot.channels.get(server.send_channel) as TextChannel).fetchMessage(msg_id!)
        .then(async (message) => {
          if (message?.editable && message.embeds.length > 0) {
            const embed = new RichEmbed(message.embeds[0]);
            this.select.setTitle(embed, active);
            await message.edit(embed);
          }
        })
        .catch(msgCatch);

        if (Number(active.toFixed(2)) <= 0) {
          const server = await this.db.servers.findOne({ id: message.guild.id });
          if (server) await this.cleanOldScans(server);
          message.channel.send(`${scan.scan.name} updated to expire now`)
          .catch(msgCatch);
        } else {
          message.channel.send(`${scan.scan.name} updated to expire at ${formatTimestamp(moment(expires.toDate()))}`)
          .catch(msgCatch);
        }
      } catch (e) {
        message.channel.send('Unable to update scan in db')
        .catch(msgCatch);
        debug(this.bot, e, 'errors');
      }

      return;
    }
    else if (msg_id) {
      message.channel.send('Not a valid scan message id')
      .catch(msgCatch);
      return;
    }
    else {
      message.channel.send(cmd)
      .catch(msgCatch);
      return;
    }
  }

  const activescans = await this.db.getActiveScans(server);

  // Generate a new card
  let card: Card;
  let sc: Scannable | undefined;
  let img: RichEmbed | undefined;

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
      message.channel.send(`${stripMention(name)} is not a valid card`).catch(msgCatch);
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
      message.channel.send(`${card.gsx$name} is not a spawnable card`).catch(msgCatch);
      return;
    }
  }
  else {
    const type = parseType(card_type ?? '');
    if (type === undefined) {
      message.channel.send(`${stripMention(card_type!)} is not a valid card type`).catch(msgCatch);
      return;
    }
    [sc, img] = this.select.generateFromType(type, activescans);
  }

  let { scannable, image, active, next } = await this.select.card(server, sc, img);

  if (expire_change) {
    const expires = parseExpires(this.expiresToDate(active), expire_change);
    if (expires === false) {
      message.channel.send(`${expire_change} is not a valid format`).catch(msgCatch);
      return;
    }
    active = expiresDiff(expires);
    this.select.setTitle(image, active);
  }

  if (!msg_id) {
    if (active > 0) {
      await this.spawnCard(server, { scannable, image, active, next });
    }
    else {
      message.channel.send('Cannot spawn a new card that already expired').catch(msgCatch);
    }
  }
  else {
    (this.bot.channels.get(server.send_channel) as TextChannel).fetchMessage(msg_id)
    .then(async (message) => {
      if (isUser(message, 'me') && message.editable && message.embeds.length > 0) {
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

          message.channel.send('Updated existing scan').catch(msgCatch);
        }
        catch (e) {
          message.channel.send(`DB failed to update ${e.message}`).catch(msgCatch);
        }
      } else {
        message.channel.send('Unable to update specificed message id').catch(msgCatch);
      }
    })
    .catch((e) => {
      message.channel.send('Unable to fetch specified message id').catch(msgCatch);
      debug(this.bot, e, 'errors');
    });
  }
}
