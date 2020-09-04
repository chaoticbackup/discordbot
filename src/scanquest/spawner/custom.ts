import { Message, RichEmbed } from 'discord.js';
import Spawner from './Spawner';
import { API } from '../../database';
import { ScannableCreature } from '../scan_type/Creature';
import { Scannable } from '../scan_type/Scannable';

// !spawn <content> --expire=<+h or timestamp> --order=<number> --message=<Snowflake>
export default function (this: Spawner, message: Message, args: string[], options: string[]): void {
  const server = this.db.servers.findOne({ id: message.guild.id });

  if (!server) return;

  const content = args.join(' ');

  if (content.length === 0) {
    message.channel.send('!spawn <content> --expire=<+h or timestamp> --message=<Snowflake>')
    .catch(() => {});
    return;
  }

  let name: string | undefined;
  let stats: string[] | undefined;

  try {
    [name, ...stats] = content.split(/ (?=[0-9]+)/);
  } catch {}

  if (!name) {
    name = content.trim();
  }

  const card = API.find_cards_by_name(name)[0] ?? null;

  if (!card) {
    message.channel.send(`${name.replace('@', '')} is not a valid card`).catch(() => {});
    return;
  }

  const getScannable = (): [Scannable, RichEmbed] | [] => {
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

  const [sc, img] = getScannable();
  console.log(sc);

  if (sc === undefined) {
    message.channel.send(`${card.gsx$name} is not a spawnable card`).catch(() => {});
    return;
  }

  const { scannable, image, active } = this.select.card(server, sc, img);

  this.spawnCard(server, scannable, image, active);
}
