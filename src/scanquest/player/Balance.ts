import { Message, DMChannel } from 'discord.js';
import ScanQuestDB from '../database';
import { isUser } from '../../common/users';
import { SendFunction } from '../../definitions';

export default async function balance(db: ScanQuestDB, message: Message, options: string[], send: SendFunction):
Promise<void> {
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

  let user: RegExpExecArray | null;
  if (options.length > 0 &&
      isUser(message, 'daddy') &&
      (user = (/user=([\w]{2,})/).exec(options.join(' '))))
  {
    const p = await db.players.findOne({ id: user[1] });
    if (p) {
      const member = await message.guild.fetchMember(p.id);
      return await send(`${member.displayName} balance is: ${p.coins ?? 0} coins`);
    }
  } else {
    const player = await db.findOnePlayer({ id: message.author.id });
    return await send(`Your balance is: ${player?.coins ?? 0} coins`);
  }
}
