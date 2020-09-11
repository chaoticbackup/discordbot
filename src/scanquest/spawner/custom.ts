import { Message, RichEmbed, TextChannel } from 'discord.js';
import Spawner from './Spawner';
import { API } from '../../database';
import { ScannableCreature } from '../scan_type/Creature';
import { Scannable } from '../scan_type/Scannable';
import moment, { Moment } from 'moment';
import { ActiveScan } from '../database';
import { Card } from '../../definitions';

const cmd = '!spawn <content> --expire=[+/-<number>m/h | timestamp] --message=[Snowflake]';
export default function (this: Spawner, message: Message, args: string[], options: string): void {
  const server = this.db.servers.findOne({ id: message.guild.id });

  if (!server) return;

  let regex_arr: RegExpExecArray | null = null;
  const content = args.join(' ');

  regex_arr = (/message=([\d]{2,})/).exec(options);
  const msg_id = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;
  const scan = (msg_id) ? server.activescans.find((s) => s.msg_id === msg_id) : undefined;

  regex_arr = (/expire=([\w+-]{2,})/).exec(options);
  const expire_change = (regex_arr && regex_arr.length > 1) ? regex_arr[1] : undefined;

  const parseExpires = (oldExpires: Date, change: string): false | Moment => {
    let newExpires: Moment | undefined;
    let set: 'add' | 'sub' | undefined;

    if (change.startsWith('+')) {
      set = 'add';
    }
    else if (change.startsWith('-')) {
      set = 'sub';
    }

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
      regex_arr = (/[+-](\d+)[hm]*/).exec(change);
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

    if (newExpires === undefined) {
      message.channel.send(`${change} is not a valid format`)
      .catch(() => {});
      return false;
    }

    return newExpires;
  };

  const expiresDiff = (expires: Moment) => {
    return expires.startOf('minute').diff(moment().startOf('minute'), 'hours');
  };

  const setExpires = (scan: ActiveScan, expires: Moment) => {
    scan.expires = expires.toDate();

    (this.bot.channels.get(server.send_channel) as TextChannel).fetchMessage(msg_id!)
    .then(async (message) => {
      if (message?.editable && message.embeds.length > 0) {
        const embed = new RichEmbed(message.embeds[0]);
        this.select.setTitle(embed, expiresDiff(expires));
        await message.edit(embed);
      }
    })
    .catch(() => {});

    this.db.servers.update(server);
  };

  const getScannable = (card: Card): [Scannable, RichEmbed] | [] => {
    if (!this.select.isSpawnable(card)) return [];
    if (card.gsx$type === 'Creatures') {
      const [scannable, image] = this.select.generate(card);
      if (scannable === undefined || image === undefined) return [];
      if (stats && stats.length === 5) {
        const { card } = (scannable as ScannableCreature);
        [card.courage, card.power, card.wisdom, card.speed, card.energy] = stats.map((v) => parseInt(v));
      }
      return [scannable, image];
    }
    return this.select.generate(card);
  };

  /* Start of logic */

  if (content.length === 0) {
    // Update existing card's expires
    if (scan !== undefined && expire_change !== undefined) {
      const expires = parseExpires(scan.expires, expire_change);
      if (expires !== false) {
        setExpires(scan, expires);
        message.channel.send(`${scan.scan.name} updated to expire at ${moment(scan.expires).format('hh:mm:ss A')}`)
        .catch(() => {});
      }
      return;
    }
    else if (msg_id) {
      message.channel.send('Not a valid message id')
      .catch(() => {});
      return;
    }
    else {
      message.channel.send(cmd)
      .catch(() => {});
      return;
    }
  }

  // Generate a new card
  let name: string | undefined;
  let stats: string[] | undefined;

  try {
    [name, ...stats] = content.split(/ (?=[0-9]+)/);
  } catch {
    name = content.trim();
  }

  const card = API.find_cards_by_name(name)[0] ?? null;

  if (!card) {
    message.channel.send(`${name.replace('@', '')} is not a valid card`)
    .catch(() => {});
    return;
  }

  const [sc, img] = getScannable(card);

  if (sc === undefined) {
    message.channel.send(`${card.gsx$name} is not a spawnable card`)
    .catch(() => {});
    return;
  }

  let { scannable, image, active } = this.select.card(server, sc, img);

  if (expire_change) {
    const expires = parseExpires(this.expiresToDate(active), expire_change);
    if (expires === false) {
      return;
    }
    active = expiresDiff(expires);
    this.select.setTitle(image, active);
  }

  if (!msg_id) {
    if (active > 0) {
      this.spawnCard(server, scannable, image, active);
    }
    else {
      message.channel.send('Cannot spawn a new card that already expired')
      .catch(() => {});
    }
  }
  else {
    (this.bot.channels.get(server.send_channel) as TextChannel).fetchMessage(msg_id)
    .then(async (message) => {
      if (message?.editable && message.embeds.length > 0) {
        await message.edit(image);
        const expires = this.expiresToDate(active);

        if (scan) {
          scan.expires = expires;
          scan.scan = scannable.card;
        } else {
          server.activescans.push(new ActiveScan({ scan: scannable.card, expires, msg_id }));
        }

        this.db.servers.update(server);

        message.channel.send('Updated existing scan')
        .catch(() => {});
      } else {
        message.channel.send('Not a valid message id')
        .catch(() => {});
      }
    })
    .catch(() => {
      message.channel.send('Not a valid message id')
      .catch(() => {});
    });
  }
}
