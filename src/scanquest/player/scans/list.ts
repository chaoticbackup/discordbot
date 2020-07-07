import { FieldsEmbed, IFunctionEmoji } from 'discord-paginationembed';
import { CollectorFilter, DMChannel, Message, TextChannel } from 'discord.js';
import users from '../../../common/users';
import logger from '../../../logger';
import Scanned from '../../scanner/Scanned';
import ScanQuestDB from '../../scan_db';
import { setFilter } from './typeFilter';
import { SendFunction } from '../../../definitions';

interface scan {
  index: number
  details: string
}

export default async (db: ScanQuestDB, message: Message, options: string[], send: SendFunction): Promise<void> => {
  // If not dm or receive channel
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
    return await send(e.message);
  }

  if (list.length === 0) {
    return await send('You have no scans');
  }

  const Pagination = new FieldsEmbed<scan>();

  const functionEmojis: IFunctionEmoji<scan> = {
    '⬇️': (_, instance) => {
      instance.array = (instance.array as scan[]).sort((a: scan, b: scan) => {
        return a.details.localeCompare(b.details);
      });
    },
    '🔎': (user, instance) => {
      const msg = `<@!${message.author.id}>, search for cards by name`;
      message.channel.send(msg)
      .then(resp => {
        const filter = ((message: Message) => {
          return (message.author.id === user.id);
        }) as CollectorFilter;

        const collector = message.channel.createMessageCollector(filter, { max: 1, time: 45000 });
        collector.on('collect', (message: Message) => {
          const new_list = list.filter((card) => {
            return card.details.toLowerCase().startsWith(message.content);
          });
          if (new_list.length > 0) {
            instance.array = new_list;
            Pagination._loadList(false).catch((e) => { logger.error(e); });
          }
          if (message.deletable) message.delete().catch(() => {});
          message.channel.send('No scans match this search').catch(() => {});
        });
        collector.on('end', () => {
          if (resp.deletable) resp.delete().catch(logger.error);
        });
      })
      .catch(logger.error);
    }
  };

  Pagination
    .setAuthorizedUsers(ids)
    .setChannel(message.channel as (TextChannel | DMChannel))
    .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
    .setPageIndicator(true)
    .setArray(list)
    .formatField('Scans', el => `${el.index}) ${el.details}`)
    .setFunctionEmojis(functionEmojis)
    .setEmojisFunctionAfterNavigation(true);

  await Pagination.build();
};
