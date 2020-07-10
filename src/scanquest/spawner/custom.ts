import { Message } from 'discord.js';
import { API } from '../../database';
import Spawner from '.';
import { CreatureScan } from '../scanner/Creature';

// !spawn Maxxor, Protector of Perim --stats="string" --timer=<+h or timestamp> --order=<number>
export default function (this: Spawner, message: Message, args: string[], options: string[]) {
  const id = message.guild.id;
  const server = this.db.servers.findOne({ id });

  try {
    if (server) {
      let name = args.join(' ').trim();
      if (name.length > 0) {
        const card = API.find_cards_by_name(name)[0] ?? null;
        if (card) {
          name = card.gsx$name;
          if (card.gsx$type === 'Creatures') {
            let reg: RegExpExecArray | null;
            if ((reg = (/stats=([\w"]*)/).exec(options.join(' ')))) {
              console.log(reg[1]);
              const stats = reg[1].replace('"', '').split(' ');
              if (stats.length === 5) {
                const cs = new CreatureScan();
                // cs.courage =
              }
            }
          }
        }
      }
    }
  }
  catch (e) {

  }
}
