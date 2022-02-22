import { FieldsEmbed, IFunctionEmoji } from 'discord-paginationembed';
import { Attachment, DMChannel, Message, TextChannel } from 'discord.js';
import { isUser } from '../../common/users';
import ScanQuestDB, { Player } from '../database';
import { Filter, setFilter } from './typeFilter';
import { SendFunction } from '../../definitions';
import { Scannable } from '../scan_type/Scannable';

interface scan {
  index: number
  details: string
}

const toRow = ([scan, i]: [Scannable, number]) => {
  return ({ index: i, details: scan.toString() });
};

const formatRow = (scan: scan) => {
  return `${scan.index}) ${scan.details}`;
};

export default async (db: ScanQuestDB, message: Message, text: string, options: string[], send: SendFunction): Promise<void> => {
  // If not dm or receive channel
  if (
    !(
      message.channel instanceof DMChannel ||
      (message.guild && (
        await db.is_receive_channel(message.guild.id, message.channel.id) ||
        message.member.hasPermission('ADMINISTRATOR'))
      )
    )
  ) return;

  const ids = [message.author.id];
  let player: Player | null;

  let user: RegExpExecArray | null;
  if (options.length > 0 &&
    isUser(message, 'daddy') &&
    (user = (/user=([\w]{2,})/).exec(options.join(' '))))
  {
    ids.push(user[1]);
    const p = await db.players.findOne({ id: ids[1] });
    if (p) player = p;
    else return;
  } else {
    player = await db.players.findOne({ id: ids[0] });
  }

  if (!player || player.scans.length === 0) {
    return await send('You have no scans');
  }

  let filterType: Filter;

  try {
    filterType = setFilter(text);
  }
  catch (e) {
    return await send(e.message);
  }

  const list = player.scans.map((scan, i) => {
    return ([filterType(scan), i]);
  }).filter(([s]) => s !== undefined) as Array<[Scannable, number]>;

  if (list.length === 0) {
    return await send('You have no scans for this filter');
  }

  if (options.includes('download')) {
    const contents = list.map(toRow).map(formatRow).join('\n');
    const attachment = new Attachment(Buffer.from(contents, 'utf-8'), 'scans.txt');
    return await send(attachment);
  }

  const Pagination = new FieldsEmbed<scan>();

  const functionEmojis: IFunctionEmoji<scan> = {
    '⬇️': (_, instance) => {
      instance.array = list.sort(([a], [b]) => a.card.name.localeCompare(b.card.name)).map(toRow);
    },
    // '🔎': (user, instance) => {
    //   const msg = `<@!${message.author.id}>, search for cards by name`;
    //   message.channel.send(msg)
    //   .then(resp => {
    //     const filter: CollectorFilter = (message: Message) => {
    //       return (message.author.id === user.id);
    //     };

    //     const collector = message.channel.createMessageCollector(filter, { max: 1, time: 45000 });
    //     collector.on('collect', (message: Message) => {
    //       const new_list = list.filter((card) => {
    //         return card.details.toLowerCase().startsWith(message.content);
    //       });
    //       if (new_list.length > 0) {
    //         instance.array = new_list;
    //         Pagination._loadList(false).catch((e) => { logger.error(e); });
    //       } else {
    //         message.channel.send('No scans match this search').catch(msgCatch);
    //       }
    //       if (message.deletable) message.delete().catch(msgCatch);
    //     });
    //     collector.on('end', () => {
    //       if (resp.deletable) resp.delete().catch(msgCatch);
    //     });
    //   })
    //   .catch(msgCatch);
    // }
  };

  Pagination
    .setAuthorizedUsers(ids)
    .setChannel(message.channel as (TextChannel | DMChannel))
    .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
    .setPageIndicator(true)
    .setArray(list.map(toRow))
    .formatField('Scans', formatRow)
    .setFunctionEmojis(functionEmojis)
    .setEmojisFunctionAfterNavigation(true);

  await Pagination.build();
};
