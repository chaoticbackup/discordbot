import { TextChannel, Message, DMChannel, CollectorFilter } from 'discord.js';
import { FieldsEmbed, IFunctionEmoji } from 'discord-paginationembed';
import { parseType, parseTribe, CreatureTribe, generify } from '../../common/card_types';
import ScanQuestDB from '../scan_db';
import { toScannable } from '../scanner';
import users from '../../common/users';
import Scanned from '../scanner/Scanned';
import Scannable from '../scanner/Scannable';
import { API } from '../../database';
import { Creature } from '../../definitions';

interface scan {
  index: number
  details: string
}

export default async (db: ScanQuestDB, message: Message, options: string[]): Promise<void> => {
  // If not dm or recieve channel
  if (
    !(
      message.channel instanceof DMChannel ||
      (message.guild && (
        db.is_receive_channel(message.guild.id, message.channel.id) ||
        message.member.hasPermission('ADMINISTRATOR'))
      )
    )
  ) return;

  const ids = [message.author.id];
  let player;

  let user: RegExpExecArray | null;
  if (options.length > 0 &&
    message.author.id === users('daddy') &&
    (user = (/user=([\w]{2,})/).exec(options.join(' '))))
  {
    ids.push(user[1]);
    const p = db.players.findOne({ id: ids[1] });
    if (p) player = p;
    else return;
  } else {
    player = db.findOnePlayer({ id: ids[0] });
  }

  const list: scan[] = [];
  try {
    const filterType = setFilter(message.content);
    player.scans.forEach((scan: Scanned, i: number) => {
      const scannable = filterType(scan);
      if (scannable) list.push({ index: i, details: scannable.toString() });
    });
  }
  catch (e) {
    message.channel.send(e.message).catch(() => {});
    return;
  }

  if (list.length === 0) {
    message.channel.send('You have no scans').catch(() => {});
    return;
  }

  const functionEmojis: IFunctionEmoji<scan> = {
    '⬇️': (_, instance) => {
      instance.array = (instance.array as scan[]).sort((a: scan, b: scan) => {
        return a.details.localeCompare(b.details);
      })
    },
    '🔎': (_, instance) => {
      const filter = ((message: Message) => {

      }) as CollectorFilter;
      message.channel.createMessageCollector(filter, { max: 1, time: 30000 })
      .on('collect', (m: Message) => {

      })
    }
  };

  const Pagination = new FieldsEmbed<scan>()
  .setAuthorizedUsers(ids)
  .setChannel(message.channel as (TextChannel | DMChannel))
  .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
  .setPageIndicator(true)
  .setArray(list)
  .formatField('Scans', el => `${el.index}) ${el.details}`)
  .setFunctionEmojis(functionEmojis)
  .setEmojisFunctionAfterNavigation(true);

  return await Pagination.build();
}

type Filter = (scan: Scanned) => Scannable | undefined;

function setFilter(content: string): Filter {
  const args = content.toLowerCase().split(' ').slice(1);

  if (args.length > 0) {
    let type = parseType(args[0]);
    if (type === 'Attacks') throw new Error("Attacks aren't collectable");
    else if (type === 'Battlegear') return filterBattlegear;
    else if (type === 'Creatures') {
      if (args.length > 1) {
        return tribeCreatures(parseTribe(args[1], 'Creatures') as CreatureTribe);
      }
      return filterCreature;
    }
    else if (type === 'Locations') return filterLocation;
    else if (type === 'Mugic') throw new Error("Mugic aren't currently collectable");
    else if (args.length > 1) {
      const tribe = parseTribe(args[0]);
      if (tribe !== undefined) {
        type = parseType(args[1]);
        if (type === 'Mugic') throw new Error("Mugic aren't currently collectable");
        if (type === 'Creatures') return tribeCreatures(generify(tribe, 'Creatures'));
      }
      else throw new Error(`${args[0].replace('@', '')} isn't an active tribe`);
    }
  }

  return noFilter;
}

const noFilter: Filter = (scan: Scanned) => toScannable(scan);

const filterBattlegear: Filter = (scan: Scanned) => {
  if (scan.type === 'Battlegear') return toScannable(scan);
}

const filterCreature: Filter = (scan: Scanned) => {
  if (scan.type === 'Creatures') return toScannable(scan);
}

const filterLocation: Filter = (scan: Scanned) => {
  if (scan.type === 'Locations') return toScannable(scan);
}

const tribeCreatures = (tribe: CreatureTribe): Filter => {
  return (scan: Scanned) => {
    if (scan.type === 'Creatures') {
      const card = API.find_cards_by_name(scan.name)[0] as Creature;
      if (parseTribe(card.gsx$tribe) === tribe) return toScannable(scan);
    }
  }
}
